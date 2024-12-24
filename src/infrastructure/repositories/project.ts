import { prisma } from "../utils/prisma";

export class ProjectRepositories {
	public async getProjects(userId: string) {
		return await prisma.project.findMany({});
	}
}
