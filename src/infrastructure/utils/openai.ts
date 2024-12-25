import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

export const llm = new ChatOpenAI({
	model: "gpt-4o-mini",
	apiKey: process.env.OPENAI_API_KEY,
});

export const prompt = new PromptTemplate({
	template: `
	You will be given a document to extract information from.
	Here is the document: {input}, 

	Please summarize the document, start with "This document is about" 
	and then provide a brief summary of the document.

	IMPORTANT:
	- The summarized text should be between 180 to 250 characters
	- The summarized text should be in English
	- The summarized text should be concise and clear
	`,
	inputVariables: ["input"],
});
