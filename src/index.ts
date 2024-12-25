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

		const textChunks = [];
		for (const path of paths) {
			const { text } = await ocrService.extractText(path);
			textChunks.push(text);
		}

		const chain = prompt.pipe(llm);
		const text = await chain.invoke({ input: textChunks.join("\n") });

		await projectService.updateProject(projectId, {
			summary: text,
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
