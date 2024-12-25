import { Elysia, t } from "elysia";
import { authService, projectService } from "../../application/instances";

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

    return { projects };
  })
  .post(
    "/projects",
    async ({ body, user }) => {
      const { newProject } = await projectService.createProject(
        body.name,
        body.description,
        body.documentName,
        user.id,
      );

      return { message: "Project successfully created!", data: newProject };
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.String(),
        documentName: t.String(),
      }),
    },
  )
  .get("/projects/:id", async ({ params }) => {
    const project = await projectService.getProjectDetail(params.id);

    return { project };
  });
