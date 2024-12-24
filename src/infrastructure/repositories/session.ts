import { prisma } from "../utils/prisma";

export class SessionRepositories {
	public async getSession(userIdOrSessionId: string) {
		return await prisma.session.findFirst({
			where: {
				OR: [
					{
						id: userIdOrSessionId,
					},
					{
						userId: userIdOrSessionId,
					},
				],
			},
		});
	}

	public async create(userId: string) {
		return await prisma.session.create({
			data: {
				user: {
					connect: {
						id: userId,
					},
				},
			},
		});
	}

	public async delete(sessionId: string) {
		return await prisma.session.delete({
			where: {
				id: sessionId,
			},
		});
	}
}
