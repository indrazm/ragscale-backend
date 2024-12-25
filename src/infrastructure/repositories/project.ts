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

	public async get(projectId: string) {
		return await prisma.project.findFirst({
			where: {
				id: projectId,
			},
		});
	}

	public async create(data: Omit<Project, "id" | "status" | "summary">) {
		return await prisma.project.create({
			data,
		});
	}

	public async update(projectId: string, data: Partial<Project>) {
		return await prisma.project.update({
			where: {
				id: projectId,
			},
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
