import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
	model: "gpt-4o-mini",
	apiKey: process.env.OPENAI_API_KEY,
});
