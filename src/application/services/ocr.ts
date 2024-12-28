import { Chroma } from "@langchain/community/vectorstores/chroma";
import type { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFDocument } from "pdf-lib";
import { fromBuffer } from "pdf2pic";
import slugify from "slugify";
import { createWorker } from "tesseract.js";
import { llm } from "../../infrastructure/utils/openai";
import { summarizePrompt } from "../prompts/summarize";
import type { ProjectService } from "./project";

const embeddings = new OpenAIEmbeddings({
	model: "text-embedding-3-large",
});

export const vectorStore = new Chroma(embeddings, {
	collectionName: "ragscale",
	url: `http://localhost:${process.env.CHROMADB_PORT}`,
});

interface ConvertToImage {
	projectId: string;
	buffer: Buffer;
	fileName: string;
	numberOfPages: number;
}

export class OCR {
	private projectService: ProjectService;

	constructor(projectService: ProjectService) {
		this.projectService = projectService;
	}

	private async convertToImage({
		projectId,
		buffer,
		fileName,
		numberOfPages,
	}: ConvertToImage) {
		const slug = slugify(fileName, { lower: true });
		const convert = fromBuffer(buffer, {
			width: 800,
			height: 1600,
			preserveAspectRatio: true,
			density: 100,
			savePath: `./public/${projectId}`,
			saveFilename: slug,
		});

		const paths = [];
		for (let i = 1; i <= numberOfPages; i++) {
			await convert(i, { responseType: "image" });
			paths.push(`./public/${projectId}/${slug}.${i}.png`);
		}

		return { paths };
	}

	private async extractText(documentPath: string) {
		const file = Bun.file(documentPath);
		const data = await file.arrayBuffer();
		const buffer = Buffer.from(data);
		const worker = await createWorker();
		const res = await worker.recognize(buffer);
		await worker.terminate();

		return { text: res.data.text };
	}

	private async getPageCount(pdfBuffer: ArrayBuffer) {
		const pdfDoc = await PDFDocument.load(pdfBuffer);
		return { pageCount: pdfDoc.getPageCount() };
	}

	private async splitText(text: string) {
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 150,
			separators: ["\n", ".", "!", "?", ";"],
		});

		const textChunk = await splitter.splitText(text);
		return { text: textChunk };
	}

	private async extractImagePaths(
		filePath: string,
		fileName: string,
		projectId: string,
	) {
		const file = Bun.file(filePath);
		const data = await file.arrayBuffer();
		const buffer = Buffer.from(data);
		const { pageCount } = await this.getPageCount(data);
		const { paths } = await this.convertToImage({
			projectId,
			buffer,
			fileName,
			numberOfPages: pageCount,
		});

		return { paths };
	}

	public async processRAG(projectId: string) {
		const project = await this.projectService.getProjectDetail(projectId);
		await this.projectService.updateProject(projectId, {
			status: "PROCESSING",
		});

		if (!project) {
			return "Task failed!";
		}

		const filePath = `./public/${projectId}/${project.document}`;
		const { paths } = await this.extractImagePaths(
			filePath,
			project.document,
			projectId,
		);

		let document = "";
		for (const path of paths) {
			const { text } = await this.extractText(path);
			document += text;
		}

		const summarizeLLM = summarizePrompt.pipe(llm);
		const summarize = await summarizeLLM.invoke({ input: document });

		const { text: textChunks } = await this.splitText(document);

		const documents: Document[] = textChunks.map((chunk) => {
			return {
				pageContent: chunk,
				metadata: { source: projectId },
			};
		});

		try {
			await vectorStore.delete({ filter: { source: projectId } });
		} catch (error) {
			console.log("Error deleting documents", error);
		}

		await vectorStore.addDocuments(documents);

		await this.projectService.updateProject(projectId, {
			status: "DONE",
			summary: summarize.content.toString(),
		});

		return { paths };
	}
}
