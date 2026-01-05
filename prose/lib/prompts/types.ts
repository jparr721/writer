"use client";

export type PromptCategory = "editor" | "helper" | "checker" | "summarizer" | "rewriter";

export type PromptLibrary = Record<PromptCategory, string>;

export const PROMPT_CATEGORIES: PromptCategory[] = [
	"editor",
	"helper",
	"checker",
	"summarizer",
	"rewriter",
];
