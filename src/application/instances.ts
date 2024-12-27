import { ProjectRepositories } from "../infrastructure/repositories/project";
import { SessionRepositories } from "../infrastructure/repositories/session";
import { UserRepositories } from "../infrastructure/repositories/user";
import { AuthService } from "./services/auth";
import { OCR } from "./services/ocr";
import { ProjectService } from "./services/project";

const userRepo = new UserRepositories();
const sessionRepo = new SessionRepositories();
const projectRepo = new ProjectRepositories();

export const authService = new AuthService(userRepo, sessionRepo);
export const projectService = new ProjectService(projectRepo);
export const ocrService = new OCR(projectService);
