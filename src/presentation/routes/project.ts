import { OpenAIEmbeddingFunction } from "chromadb";
import { Elysia, t } from "elysia";
import slugify from "slugify";
import { ragQueue } from "../..";
import { authService, projectService } from "../../application/instances";
import { chromaClient } from "../../infrastructure/utils/chroma";
import { chatPrompt, llm } from "../../infrastructure/utils/openai";

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

			const collection = await chromaClient.getCollection({
				name: projectId,
				embeddingFunction: new OpenAIEmbeddingFunction({
					openai_api_key: process.env.OPENAI_API_KEY as string,
					openai_model: "text-embedding-3-large",
				}),
			});

			const data = await collection.query({
				queryTexts: query,
				nResults: 5,
			});

			const results = data.documents.map((_, i) => ({
				document: data.documents[i],
				distance: data.distances?.[i],
			}));

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

			const collection = await chromaClient.getCollection({
				name: projectId,
				embeddingFunction: new OpenAIEmbeddingFunction({
					openai_api_key: process.env.OPENAI_API_KEY as string,
					openai_model: "text-embedding-3-large",
				}),
			});

			const data = await collection.query({
				queryTexts: query,
				nResults: 10,
			});

			const content = data.documents.join("\n");

			const chain = chatPrompt.pipe(llm);
			const text = await chain.invoke({ input: content, query });

			return text.content.toString();
		},
		{
			body: t.Object({
				query: t.String(),
			}),
		},
	);
