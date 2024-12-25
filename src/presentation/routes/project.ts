import { Elysia, t } from "elysia";
import { authService, projectService } from "../../application/instances";
import { ragQueue } from "../..";
import slugify from "slugify";

export const projectRouter = new Elysia()
	.derive(async ({ headers, set }) => {
		const authorization = headers.authorization?.split(" ")[1];

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

		return { message: "Project fetched successfully!", data: projects };
	})
	.post(
		"/projects",
		async ({ body, user }) => {
			const documentName = slugify(body.document.name, { lower: true });

			const { newProject } = await projectService.createProject(
				body.name,
				body.description,
				documentName,
				user.id,
			);

			await ragQueue.add(newProject.id, {
				projectId: newProject.id,
				document: newProject.document,
			});

			await Bun.write(
				`./public/${newProject.id}/${documentName}`,
				body.document,
			);

			return { message: "Project successfully created!", data: newProject };
		},
		{
			body: t.Object({
				name: t.String(),
				description: t.String(),
				document: t.File(),
			}),
		},
	)
	.get("/projects/:id", async ({ params }) => {
		const project = await projectService.getProjectDetail(params.id);

		return { data: project };
	});
