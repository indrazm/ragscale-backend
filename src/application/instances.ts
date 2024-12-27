import { AuthService } from "./services/auth";
import { UserRepositories } from "../infrastructure/repositories/user";
import { SessionRepositories } from "../infrastructure/repositories/session";
import { ProjectRepositories } from "../infrastructure/repositories/project";
import { ProjectService } from "./services/project";
import { OCR } from "./services/ocr";
import { OpenAIEmbeddings } from "@langchain/openai";

const openAiEmbeddings = new OpenAIEmbeddings({
	apiKey: process.env.OPENAI_API_KEY,
	model: "text-embedding-3-large",
});

const userRepo = new UserRepositories();
const sessionRepo = new SessionRepositories();
const projectRepo = new ProjectRepositories();

export const authService = new AuthService(userRepo, sessionRepo);
export const projectService = new ProjectService(projectRepo);
export const ocrService = new OCR(openAiEmbeddings);
