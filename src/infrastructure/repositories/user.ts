import type { User } from "@prisma/client";
import { prisma } from "../utils/prisma";

type CreateUser = Omit<User, "id" | "avatarUrl">;

export class UserRepositories {
	public async getUser(idOrEmail: string) {
		return await prisma.user.findFirst({
			where: {
				OR: [
					{
						id: idOrEmail,
					},
					{
						email: idOrEmail,
					},
				],
			},
		});
	}

	public async create(data: CreateUser) {
		return await prisma.user.create({
			data: data,
		});
	}
}
