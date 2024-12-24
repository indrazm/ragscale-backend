import { Queue as QueueMQ, Worker } from "bullmq";
import type { ProjectRepositories } from "../../infrastructure/repositories/project";
import type { OCR } from "./ocr";

const redisOptions = {
	port: 6379,
	host: "localhost",
	password: "",
};
export class Queue {
	private projectRepositories: ProjectRepositories;
	private ocrService: OCR;

	constructor(projectRepo: ProjectRepositories, ocr: OCR) {
		this.projectRepositories = projectRepo;
		this.ocrService = ocr;
	}

	public queue() {
		return new QueueMQ("ocrQueue", { connection: redisOptions });
	}

	public async process(projectId: string) {
		const project = await this.projectRepositories.get(projectId);

		if (!project) {
			return "Task failed!";
		}

		const filePath = `./public/${projectId}/${project.document}`;
		const { text } = await this.ocrService.extractText(filePath);
		const textChunks = await this.ocrService.splitText(text);

		console.log(textChunks);
		return "Task successfully processed";
	}

	public async addQueue(projectId: string) {
		new Worker("ocrQueue", await this.process(projectId), {
			connection: redisOptions,
		});
	}
}
