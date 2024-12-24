import { ChromaClient } from "chromadb";

export const chromaCliet = new ChromaClient({
	path: "http://localhost:8090",
});
