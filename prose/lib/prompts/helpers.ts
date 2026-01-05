import type { BookContextItem } from "@/app/api/schemas";

export function formatBookContext(items: BookContextItem[]): string {
	if (items.length === 0) {
		return "";
	}

	return items
		.map((item) => `## Chapter ${item.position + 1}: ${item.title}\n\n${item.summary}`)
		.join("\n\n---\n\n");
}
