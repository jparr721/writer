"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import AppSidebar from "@/components/app-sidebar";
import SiteHeader from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { DocumentSummary } from "@/hooks/use-documents";
import { useWorkspaceSettings } from "@/hooks/use-workspace-settings";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
	const params = useParams<{ workspaceId: string; documentId?: string[] }>();
	const workspaceId = Array.isArray(params.workspaceId)
		? params.workspaceId[0]
		: params.workspaceId;
	// Catch-all route gives an array of path segments - join them back into a file path
	const documentId = Array.isArray(params.documentId)
		? params.documentId.join("/")
		: params.documentId;
	const router = useRouter();
	const { setWorkspaceId } = useWorkspaceSettings();
	const [validating, setValidating] = useState(true);

	useEffect(() => {
		let cancelled = false;
		const validate = async () => {
			if (!workspaceId) {
				router.replace("/");
				return;
			}
			try {
				await axios.get(`/api/workspaces/${workspaceId}`);
				if (cancelled) return;
				setWorkspaceId(workspaceId);
				setValidating(false);
			} catch {
				if (cancelled) return;
				setWorkspaceId(null);
				router.replace("/");
			}
		};
		void validate();
		return () => {
			cancelled = true;
		};
	}, [router, setWorkspaceId, workspaceId]);

	const handleSelectDocument = useCallback(
		(doc: DocumentSummary) => {
			router.push(`/workspace/${workspaceId}/document/${doc.id}`);
		},
		[router, workspaceId]
	);

	if (validating) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">Loading workspace</p>
			</div>
		);
	}

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
				selectedId={documentId}
				workspaceId={workspaceId ?? null}
			/>
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col overflow-hidden">
					<div className="@container/main flex flex-1 flex-col gap-2 p-4 overflow-hidden">
						{children}
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
