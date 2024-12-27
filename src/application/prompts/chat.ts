import { PromptTemplate } from "@langchain/core/prompts";

export const judgePrompt = new PromptTemplate({
	template: `
	You are a query judge, you need to judge the query if related to the document or not.
	Here is the question: {question}
	Here is the document: {document}

	IMPORTANT:
	- If the question is related to the document, please respond with "YES".
	- If the question is like greeting or similar, you can respond with a greeting.
	- If the question is not clear, you can ask for clarification.
	- If the question topic is not related to the document, please respond that you can't help with that.
	`,
	inputVariables: ["question", "document"],
});

export const chatPrompt = new PromptTemplate({
	template: `
	You will be given a document to extract information from.
	Please also understand the current context of the chats
	Here is the document: {input},
	Here is the current chat context: {history}

	Please provide a response to the following question:
	{query}

	IMPORTANT:
	- If the user question is not clear, you can ask for clarification.
	- If the user is like "hello" or similar, you can respond with a greeting.
	- The response should be in English
	- The response should be in Valid Markdown without CODE Tag. 
	`,
	inputVariables: ["input", "query", "history"],
});
