import { prisma } from "../utils/prisma";

export class SessionRepositories {
	public async getSession(id: string) {
		return await prisma.session.findFirst({
			where: {
				id,
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
}
