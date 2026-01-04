import { NextResponse } from "next/server";
import AiGenerator from "@/lib/ai/ai-generator";

export async function GET() {
	const aiGenerator = new AiGenerator(0.7);
	return NextResponse.json({ name: aiGenerator.name });
}
