import type { ProjectRepositories } from "../infrastructure/repositories/project";
import slugify from "slugify";

export class ProjectService {
	private projectRepositories: ProjectRepositories;

	constructor(projectRepo: ProjectRepositories) {
		this.projectRepositories = projectRepo;
	}

	public async getUserProjects(userId: string) {
		return await this.projectRepositories.getAll(userId);
	}

	public async createProject(
		name: string,
		description: string,
		documentName: string,
		userId: string,
	) {
		const slug = slugify(name, { lower: true });
		const newProject = await this.projectRepositories.create({
			name,
			slug,
			document: documentName,
			description,
			userId,
		});

		return { newProject };
	}

	public async addContent(projectId: string, content: string) {
		const newContent = await this.projectRepositories.addContent(
			projectId,
			content,
		);
		return { newContent };
	}
}
