import { prisma } from "../utils/prisma";
import type { Project } from "@prisma/client";

export class ProjectRepositories {
	public async getAll(userId: string) {
		return await prisma.project.findMany({
			where: {
				userId,
			},
			include: {
				user: {
					select: {
						id: true,
						username: true,
					},
				},
			},
		});
	}

	public async get(projectIdOrSlug: string) {
		return await prisma.project.findFirst({
			where: {
				OR: [
					{
						id: projectIdOrSlug,
					},
					{
						slug: projectIdOrSlug,
					},
				],
			},
		});
	}

	public async create(data: Omit<Project, "id">) {
		return await prisma.project.create({
			data,
		});
	}

	public async addContent(projectId: string, content: string) {
		return await prisma.content.create({
			data: {
				content,
				project: {
					connect: {
						id: projectId,
					},
				},
			},
		});
	}
}
