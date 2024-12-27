import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import cors from "@elysiajs/cors";
import staticPlugin from "@elysiajs/static";
import { Queue, Worker } from "bullmq";
import { Elysia } from "elysia";
import { ocrService } from "./application/instances";
import { redisOptions } from "./infrastructure/config/redis";
import { authRouter } from "./presentation/routes/auth";
import { projectRouter } from "./presentation/routes/project";

// =============================================== //
// ============== Queue and Worker =============== //
// =============================================== //
export const ragQueue = new Queue("rag-queue");
const serverAdapter = new ElysiaAdapter("/tasks");

new Worker(
	"rag-queue",
	async (job) => {
		const { projectId } = job.data;
		await ocrService.processRAG(projectId);

		return { message: "Task successfully processed", data: projectId };
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
