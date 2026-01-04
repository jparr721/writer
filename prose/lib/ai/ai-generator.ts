import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";

type AiModel = ChatOllama | ChatOpenAI;

export default class AiGenerator {
	private temperature: number;
	private provider: AiModel;
	private providerName: string;

	constructor(temperature: number) {
		this.temperature = temperature;
		const { API_KEY } = process.env;
		if (!API_KEY) {
			throw new Error("API_KEY is not set");
		}
		if (API_KEY.startsWith("sk-")) {
			this.provider = new ChatOpenAI({
				model: "gpt-5-mini",
				// temperature: this.temperature,
				apiKey: API_KEY,
			});
			this.providerName = "openai";
		} else if (API_KEY.startsWith("ollama")) {
			this.provider = new ChatOllama({
				model: "gemma3:4b",
				temperature: this.temperature,
			});
			this.providerName = "ollama";
		} else {
			throw new Error("Invalid API_KEY format");
		}
	}

	async generate(systemMessage: string, prompt: string): Promise<string> {
		const response = await this.provider.invoke([
			new SystemMessage(systemMessage),
			new HumanMessage(prompt),
		]);

		return typeof response.content === "string"
			? response.content
			: response.content.map((c) => (c.type === "text" ? c.text : "")).join("");
	}

	get name(): string {
		return this.providerName;
	}
}
