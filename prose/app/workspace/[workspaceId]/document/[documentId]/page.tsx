"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Editor from "@/components/editor";
import { useCompilePdf } from "@/hooks/use-compile-pdf";
import {
	useCommitDocumentDraft,
	useDeleteDocumentDraft,
	useDocument,
	useDocumentDraft,
	useUpsertDocumentDraft,
} from "@/hooks/use-documents";

export default function DocumentPage() {
	const params = useParams<{ workspaceId: string; documentId: string }>();
	const workspaceId = Array.isArray(params.workspaceId)
		? params.workspaceId[0]
		: params.workspaceId;
	const documentId = Array.isArray(params.documentId) ? params.documentId[0] : params.documentId;
	const router = useRouter();

	const { data: document, isLoading, error } = useDocument(workspaceId, documentId);
	const { data: draft } = useDocumentDraft(workspaceId, documentId);
	const upsertDraft = useUpsertDocumentDraft(workspaceId);
	const deleteDraft = useDeleteDocumentDraft(workspaceId);
	const commitDraft = useCommitDocumentDraft(workspaceId);
	const compileMutation = useCompilePdf(workspaceId);
	const [content, setContent] = useState("");
	const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

	// Sync content from fetched document
	useEffect(() => {
		if (draft?.content !== undefined) {
			setContent(draft.content ?? "");
			return;
		}

		if (document?.content !== undefined) {
			setContent(document.content ?? "");
		}
	}, [document, draft]);

	// Handle document not found - redirect to workspace landing
	useEffect(() => {
		if (error && !isLoading) {
			router.replace(`/workspace/${workspaceId}`);
		}
	}, [error, isLoading, router, workspaceId]);

	// Persist draft changes with debounce. If content matches base, delete draft.
	useEffect(() => {
		if (!documentId || !workspaceId || !document) return;

		const baseContent = document.content ?? "";

		const handler = setTimeout(() => {
			if (content === baseContent) {
				if (draft) {
					deleteDraft.mutate({ id: documentId });
				}
				return;
			}

			upsertDraft.mutate({ id: documentId, content });
		}, 400);

		return () => {
			clearTimeout(handler);
		};
	}, [content, deleteDraft, document, documentId, draft, upsertDraft, workspaceId]);

	const handleSave = useCallback(async () => {
		if (!documentId || !document) return;
		await commitDraft.mutateAsync({ id: documentId, content });
		compileMutation.mutate(undefined, {
			onSuccess: (blob) => setPdfBlob(blob),
		});
	}, [commitDraft, compileMutation, content, document, documentId]);

	if (isLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<p className="text-sm text-muted-foreground">Loading document</p>
			</div>
		);
	}

	if (!document) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
				<p>Document not found</p>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col min-h-0 overflow-hidden">
			<Editor
				title={document.title}
				value={content}
				baseValue={document.content ?? ""}
				diffFilename={document.title}
				onChange={setContent}
				onSave={handleSave}
				isSaving={commitDraft.isPending}
				disabled={isLoading}
				pdfBlob={pdfBlob}
				isCompiling={compileMutation.isPending}
				compileError={compileMutation.error}
				workspaceId={workspaceId}
				documentId={documentId}
			/>
		</div>
	);
}
