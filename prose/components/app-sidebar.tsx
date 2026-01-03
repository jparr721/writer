"use client";

import type React from "react";
import { useCallback, useState } from "react";
// Sidebar that lists documents from the API and lets the user upload a folder
import { Button } from "@/components/ui/button";
import { type DocumentSummary, useDocuments, useInvalidateDocuments } from "@/hooks/use-documents";

import { uploadFolder } from "@/lib/upload-folder";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
	onSelectDocument?: (doc: DocumentSummary) => void;
	selectedId?: string;
};

export default function AppSidebar({ onSelectDocument, selectedId, ...props }: AppSidebarProps) {
	const { data: documents = [], isLoading } = useDocuments();
	const invalidateDocuments = useInvalidateDocuments();
	const [isUploading, setIsUploading] = useState(false);

	const handleUploadFolder = useCallback(async () => {
		setIsUploading(true);
		try {
			const result = await uploadFolder();
			if (result.errors.length) {
				console.warn("Some files failed to upload", result.errors);
			}
			invalidateDocuments();
		} catch (error) {
			console.error(error);
		} finally {
			setIsUploading(false);
		}
	}, [invalidateDocuments]);

	const handleSelect = useCallback(
		(doc: DocumentSummary) => {
			onSelectDocument?.(doc);
		},
		[onSelectDocument]
	);

	return (
		<Sidebar collapsible="offExamples" {...props}>
			<SidebarContent>
				<div className="flex flex-col gap-2 p-3">
					<Button onClick={handleUploadFolder} disabled={isUploading}>
						{isUploading ? "Uploading..." : "Open Folder"}
					</Button>
					{isLoading && <p className="text-sm text-muted-foreground">Loading documents...</p>}
				</div>
				<SidebarGroup>
					<SidebarMenu>
						{documents.map((doc) => (
							<SidebarMenuItem key={doc.id}>
								<SidebarMenuButton
									asChild
									isActive={doc.id === selectedId}
									onClick={() => handleSelect(doc)}
								>
									<button className="w-full text-left">
										<div className="flex flex-col">
											<span>{doc.title || "Untitled"}</span>
										</div>
									</button>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
						{!documents.length && !isLoading && (
							<SidebarMenuItem>
								<SidebarMenuButton disabled>No documents yet</SidebarMenuButton>
							</SidebarMenuItem>
						)}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
