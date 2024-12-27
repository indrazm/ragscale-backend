import { Elysia, t } from "elysia";
import slugify from "slugify";
import { ragQueue } from "../..";
import { authService, projectService } from "../../application/instances";
import { chatPrompt } from "../../application/prompts/chat";
import { vectorStore } from "../../application/services/ocr";
import { llm } from "../../infrastructure/utils/openai";

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
	})
	.post(
		"/projects/:id/search",
		async ({ params, body }) => {
			const projectId = params.id;
			const { query } = body;

			const similaritySearchResults =
				await vectorStore.similaritySearchWithScore(query, 5, {
					source: projectId,
				});

			const results = similaritySearchResults.map((result) => {
				return {
					id: result[0].id,
					pageContent: result[0].pageContent,
					score: result[1],
				};
			});

			return { data: results };
		},
		{
			body: t.Object({
				query: t.String(),
			}),
		},
	)
	.post(
		"/projects/:id/chat",
		async ({ params, body }) => {
			const projectId = params.id;
			const { query } = body;

			await projectService.addChat(projectId, "user", query);

			const similaritySearchResults =
				await vectorStore.similaritySearchWithScore(query, 5, {
					source: projectId,
				});

			const results = similaritySearchResults.map((result) => {
				return {
					id: result[0].id,
					pageContent: result[0].pageContent,
					score: result[1],
				};
			});

			const content = results.map((result) => result.pageContent).join("\n");

			const chain = chatPrompt.pipe(llm);
			const text = await chain.invoke({ input: content, query });
			const response = text.content.toString();

			await projectService.addChat(projectId, "ai", response);

			return response;
		},
		{
			body: t.Object({
				query: t.String(),
			}),
		},
	);
