import { Elysia } from "elysia";
import { authRouter } from "./presentation/routes/auth";
import { projectRouter } from "./presentation/routes/project";
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { serverAdapter } from "./infrastructure/utils/bullmq";
import staticPlugin from "@elysiajs/static";

export const _ = new Elysia()
  // plugins
  .use(staticPlugin())
  .use(cors())
  .use(serverAdapter.registerPlugin())

  // routes
  .use(authRouter)
  .use(projectRouter)

  // port listening
  .listen(8000, () => {
    console.log("RAG Backend ran at port 8000");
  });
