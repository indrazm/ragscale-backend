import type { Project } from "@prisma/client";
import type { ProjectRepositories } from "../../infrastructure/repositories/project";

export class ProjectService {
	private projectRepositories: ProjectRepositories;

	constructor(projectRepo: ProjectRepositories) {
		this.projectRepositories = projectRepo;
	}

	public async getUserProjects(userId: string) {
		return await this.projectRepositories.getAll(userId);
	}

	public async getProjectDetail(projectId: string) {
		return await this.projectRepositories.get(projectId);
	}

	public async createProject(
		name: string,
		description: string,
		documentName: string,
		userId: string,
	) {
		const newProject = await this.projectRepositories.create({
			name,
			document: documentName,
			description,
			userId,
		});

		return { newProject };
	}

	public async updateProject(projectId: string, data: Partial<Project>) {
		const updatedProject = await this.projectRepositories.update(
			projectId,
			data,
		);
		return { updatedProject };
	}

	public async addChat(projectId: string, role: string, message: string) {
		const chat = await this.projectRepositories.addChat(
			projectId,
			role,
			message,
		);
		return { chat };
	}

	public async getChatHistory(projectId: string) {
		const chatHistory = await this.projectRepositories.getChat(projectId);
		return { chatHistory };
	}

	public async clearChatHistory(projectId: string) {
		await this.projectRepositories.clearChat(projectId);
		return { message: "Chat history cleared!" };
	}
}
