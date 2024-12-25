import type { ProjectRepositories } from "../../infrastructure/repositories/project";
import type { Project } from "@prisma/client";

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

	public async addContent(projectId: string, content: string) {
		const newContent = await this.projectRepositories.addContent(
			projectId,
			content,
		);
		return { newContent };
	}
}
