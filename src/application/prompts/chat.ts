import { PromptTemplate } from "@langchain/core/prompts";

export const chatPrompt = new PromptTemplate({
	template: `
	You will be given a document to extract information from.
	Here is the document: {input},

	Please provide a response to the following question:
	{query}

	IMPORTANT:
	- The response should be in English
	- The response should be concise and clear
	`,
	inputVariables: ["input", "query"],
});
