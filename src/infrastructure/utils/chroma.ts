import { ChromaClient } from "chromadb";

export const chromaClient = new ChromaClient({
	path: "http://localhost:8090",
});
