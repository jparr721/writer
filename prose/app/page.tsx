// Client page that wires the sidebar and editor together
"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import AppSidebar from "@/components/app-sidebar";
import Editor from "@/components/editor";
import SiteHeader from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { type DocumentSummary, useDocument, useSaveDocument } from "@/hooks/use-documents";

export default function Page() {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [content, setContent] = useState("");

	const { data: document, isLoading } = useDocument(selectedId ?? undefined);
	const saveMutation = useSaveDocument();

	// Sync content from fetched document
	useEffect(() => {
		if (document) {
			setContent(document.content ?? "");
		}
	}, [document]);

	const handleSelectDocument = useCallback((doc: DocumentSummary) => {
		setSelectedId(doc.id);
	}, []);

	const handleSave = useCallback(() => {
		if (!selectedId || !document) return;
		saveMutation.mutate({ id: selectedId, title: document.title, content });
	}, [content, document, saveMutation, selectedId]);

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar
				variant="inset"
				onSelectDocument={handleSelectDocument}
				selectedId={selectedId ?? undefined}
			/>
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2 p-4">
						{selectedId ? (
							<div className="flex-1 rounded-lg border">
								<Editor
									title={document?.title ?? ""}
									value={content}
									onChange={setContent}
									onSave={handleSave}
									isSaving={saveMutation.isPending}
									disabled={isLoading}
								/>
							</div>
						) : (
							<div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
								<div className="space-y-2">
									<p>Select a document from the sidebar to start editing.</p>
									<p>Use "Open Folder" to upload files into the app.</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
