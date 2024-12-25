import { createBullBoard } from "@bull-board/api";
import { ElysiaAdapter } from "@bull-board/elysia";
import { Elysia } from "elysia";
import { authRouter } from "./presentation/routes/auth";
import { projectRouter } from "./presentation/routes/project";
import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import { Queue, Worker } from "bullmq";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { redisOptions } from "./infrastructure/config/redis";
import { ocrService, projectService } from "./application/instances";
import { llm, prompt } from "./infrastructure/utils/openai";
import { chromaClient } from "./infrastructure/utils/chroma";
import { OpenAIEmbeddingFunction } from "chromadb";

// =============================================== //
// ============== Queue and Worker =============== //
// =============================================== //
export const ragQueue = new Queue("rag-queue");
const serverAdapter = new ElysiaAdapter("/tasks");

new Worker(
	"rag-queue",
	async (job) => {
		const { projectId } = job.data;

		const project = await projectService.getProjectDetail(projectId);
		await projectService.updateProject(projectId, {
			status: "PROCESSING",
		});

		if (!project) {
			return "Task failed!";
		}

		const filePath = `./public/${projectId}/${project.document}`;
		const file = Bun.file(filePath);
		const data = await file.arrayBuffer();
		const buffer = Buffer.from(data);
		const { pageCount } = await ocrService.getPageCount(data);
		const { paths } = await ocrService.convertToImage({
			projectId,
			buffer,
			fileName: project.document,
			numberOfPages: pageCount,
		});

		const documentContent = [];
		for (const path of paths) {
			const { text } = await ocrService.extractText(path);
			documentContent.push(text);
		}

		const chain = prompt.pipe(llm);
		const text = await chain.invoke({ input: documentContent.join("\n") });

		await chromaClient.deleteCollection({ name: projectId });

		const collection = await chromaClient.createCollection({
			name: projectId,
			embeddingFunction: new OpenAIEmbeddingFunction({
				openai_api_key: process.env.OPENAI_API_KEY as string,
				openai_model: "text-embedding-3-large",
			}),
		});

		const { text: textChunks } = await ocrService.splitText(
			documentContent.join("\n"),
		);

		await collection.add({
			documents: textChunks,
			ids: textChunks.map((_, i) => `ids_${i}`),
		});

		await projectService.updateProject(projectId, {
			summary: text.content.toString(),
			status: "DONE",
		});

		return { message: "Task successfully processed", data: paths };
	},
	{ connection: redisOptions },
);

createBullBoard({
	queues: [new BullMQAdapter(ragQueue)],
	serverAdapter,
	options: {
		uiConfig: {
			boardTitle: "Ragscale Queue",
		},
	},
});
// =============================================== //
// ============== Queue and Worker =============== //

export const _ = new Elysia()
	// plugins
	.use(staticPlugin())
	.use(cors())
	.use(serverAdapter.registerPlugin())

	// routes
	.use(authRouter)
	.use(projectRouter)

	// port listening
	.listen(8000, () => {
		console.log("RAG Backend ran at port 8000");
	});
