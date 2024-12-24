import { Elysia } from "elysia";
import { authRouter } from "./presentation/routes/auth";
import { projectRouter } from "./presentation/routes/project";
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";

export const _ = new Elysia()
	// plugins
	.use(cors())
	.use(
		swagger({
			path: "/docs",
		}),
	)

	// routes
	.use(authRouter)
	.use(projectRouter)

	// port listening
	.listen(8000, () => {
		console.log("RAG Backend ran at port 8000");
	});
