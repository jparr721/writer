"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@/components/editor";
import { useDocument, useSaveDocument } from "@/hooks/use-documents";

export default function DocumentPage() {
	const params = useParams<{ workspaceId: string; documentId: string }>();
	const workspaceId = Array.isArray(params.workspaceId)
		? params.workspaceId[0]
		: params.workspaceId;
	const documentId = Array.isArray(params.documentId)
		? params.documentId[0]
		: params.documentId;
	const router = useRouter();

	const { data: document, isLoading, error } = useDocument(workspaceId, documentId);
	const saveMutation = useSaveDocument(workspaceId);
	const [content, setContent] = useState("");

	// Sync content from fetched document
	useEffect(() => {
		if (document) {
			setContent(document.content ?? "");
		}
	}, [document]);

	// Handle document not found - redirect to workspace landing
	useEffect(() => {
		if (error && !isLoading) {
			router.replace(`/workspace/${workspaceId}`);
		}
	}, [error, isLoading, router, workspaceId]);

	const handleSave = useCallback(() => {
		if (!documentId || !document) return;
		saveMutation.mutate({ id: documentId, title: document.title, content });
	}, [content, document, saveMutation, documentId]);

	if (isLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<p className="text-sm text-muted-foreground">Loading document</p>
			</div>
		);
	}

	if (!document) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
				<p>Document not found</p>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col min-h-0 overflow-hidden rounded-lg border">
			<Editor
				title={document.title}
				value={content}
				onChange={setContent}
				onSave={handleSave}
				isSaving={saveMutation.isPending}
				disabled={isLoading}
			/>
		</div>
	);
}
