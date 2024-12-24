import { Elysia } from "elysia";
import { authService, projectService } from "../../application/instances";

export const projectRouter = new Elysia()
	.derive(async ({ headers, set }) => {
		const authorization = headers.authorization;

		if (!authorization) {
			set.status = 401;
			throw new Error("No authorization key");
		}

		const session = await authService.getSession(authorization);

		if (!session) {
			set.status = 400;
			throw new Error("No session found, please login");
		}

		return {
			user: {
				id: session.userId,
			},
		};
	})
	.get("/projects", async ({ user }) => {
		const projects = await projectService.getUserProjects(user.id);

		return { projects };
	})
	.get("/projects/:id", async ({ params }) => {
		const project = await projectService.getProjectDetail(params.id);

		return { project };
	});
