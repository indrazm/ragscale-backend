import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

export const llm = new OpenAI({
	model: "gpt-3.5-turbo-instruct",
	temperature: 0,
	maxRetries: 2,
	apiKey: process.env.OPENAI_API_KEY,
});

export const prompt = new PromptTemplate({
	template: "Summarize this text: {input}",
	inputVariables: ["input"],
});
