"use client";

export type PromptCategory = "editor" | "helper" | "checker";

export type PromptLibrary = Record<PromptCategory, string>;

export const PROMPT_CATEGORIES: PromptCategory[] = ["editor", "helper", "checker"];
