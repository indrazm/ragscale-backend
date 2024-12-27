import type { Project } from "@prisma/client";
import { prisma } from "../utils/prisma";

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

	public async addChat(projectId: string, role: string, message: string) {
		return await prisma.chatHistory.create({
			data: {
				projectId,
				role,
				message,
			},
		});
	}

	public async getChat(projectId: string) {
		return await prisma.chatHistory.findMany({
			where: {
				projectId,
			},
		});
	}

	public async clearChat(projectId: string) {
		return await prisma.chatHistory.deleteMany({
			where: {
				projectId,
			},
		});
	}
}
