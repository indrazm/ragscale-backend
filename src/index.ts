import { Elysia } from "elysia";
import { authRouter } from "./presentation/routes/auth";
import { projectRouter } from "./presentation/routes/project";
import cors from "@elysiajs/cors";

const _ = new Elysia()
	// plugins
	.use(cors())

	// routes
	.use(authRouter)
	.use(projectRouter)

	// port listening
	.listen(8000, () => {
		console.log("RAG Backend ran at port 8000");
	});
