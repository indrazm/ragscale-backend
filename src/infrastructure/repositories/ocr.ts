import type { OpenAIEmbeddings } from "@langchain/openai";
import { PDFDocument } from "pdf-lib";
import { fromBuffer } from "pdf2pic";
import slugify from "slugify";
import { createWorker } from "tesseract.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

interface ConvertToImage {
	projectId: string;
	buffer: Buffer;
	fileName: string;
	numberOfPages: number;
}

export class OCR {
	private openAIEmbeddings: OpenAIEmbeddings;

	constructor(embeddings: OpenAIEmbeddings) {
		this.openAIEmbeddings = embeddings;
	}

	public async convertToImage({
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

	public async convertToEmbeddings(textChunks: string[]) {
		const embeddings = await this.openAIEmbeddings.embedDocuments(textChunks);
		return { embeddings };
	}

	public async extractText(documentPath: string) {
		const file = Bun.file(documentPath);
		const data = await file.arrayBuffer();
		const buffer = Buffer.from(data);
		const worker = await createWorker();
		const res = await worker.recognize(buffer);
		await worker.terminate();

		return { text: res.data.text };
	}

	public async getPageCount(pdfBuffer: ArrayBuffer) {
		const pdfDoc = await PDFDocument.load(pdfBuffer);
		return { pageCount: pdfDoc.getPageCount() };
	}

	public async splitText(text: string) {
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 0,
		});

		const textChunk = await splitter.splitText(text);
		return { text: textChunk };
	}
}
