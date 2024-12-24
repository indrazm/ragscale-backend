import { ElysiaAdapter } from "@bull-board/elysia";
import { queueService } from "../../application/instances";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

export const serverAdapter = new ElysiaAdapter("/tasks");
export const queue = queueService.queue();

createBullBoard({
	queues: [new BullMQAdapter(queue)],
	serverAdapter,
});
