"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon02Icon, Sun03Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import FolderUploadDialog from "@/components/folder-upload-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentSummary } from "@/hooks/use-documents";
import { useLibrary } from "@/hooks/use-library";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";

type FolderNode = {
	id: string;
	name: string;
	parentId: string | null;
	folders: FolderNode[];
	documents: DocumentSummary[];
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
	onSelectDocument?: (doc: DocumentSummary) => void;
	selectedId?: string;
	workspaceId: string | null;
};

export default function AppSidebar({
	onSelectDocument,
	selectedId,
	workspaceId,
	...props
}: AppSidebarProps) {
	const { data: library, isLoading } = useLibrary(workspaceId);
	const { theme, setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
	const prevSelectedId = useRef<string | undefined>(undefined);

	// Avoid hydration mismatch for theme
	useEffect(() => {
		setMounted(true);
	}, []);

	const handleSelect = useCallback(
		(doc: DocumentSummary) => {
			onSelectDocument?.(doc);
		},
		[onSelectDocument]
	);

	useEffect(() => {
		// reset expanded folders when workspace changes
		setOpenFolders(new Set());
	}, [workspaceId]);

	useEffect(() => {
		if (!library) return;
		if (openFolders.size === 0) {
			// Open all folders by default on first load; do not override user toggles later
			setOpenFolders(new Set(library.folders.map((f) => f.id)));
		}
	}, [library, openFolders.size]);

	// Expand folder chain when selectedId changes (e.g., from URL navigation)
	useEffect(() => {
		if (!library || !selectedId) return;
		if (prevSelectedId.current === selectedId) return;
		prevSelectedId.current = selectedId;

		const doc = library.documents.find((d) => d.id === selectedId);
		if (!doc?.folderId) return;

		const parentById = new Map(library.folders.map((f) => [f.id, f.parentId] as const));
		const toOpen: string[] = [];
		let cursor: string | null = doc.folderId;
		while (cursor) {
			toOpen.push(cursor);
			cursor = parentById.get(cursor) ?? null;
		}
		setOpenFolders((prev) => {
			const next = new Set(prev);
			for (const id of toOpen) next.add(id);
			return next;
		});
	}, [library, selectedId]);

	const tree = useMemo(() => {
		if (!library) {
			return { roots: [] as FolderNode[], rootDocuments: [] as DocumentSummary[] };
		}

		const folderNodes = new Map<string, FolderNode>();
		library.folders.forEach((f) => {
			folderNodes.set(f.id, {
				id: f.id,
				name: f.name,
				parentId: f.parentId,
				folders: [],
				documents: [],
			});
		});

		const roots: FolderNode[] = [];
		folderNodes.forEach((node) => {
			if (node.parentId && folderNodes.has(node.parentId)) {
				folderNodes.get(node.parentId)!.folders.push(node);
			} else {
				roots.push(node);
			}
		});

		const rootDocuments: DocumentSummary[] = [];
		library.documents.forEach((doc) => {
			const summary: DocumentSummary = {
				id: doc.id,
				title: doc.title,
				updatedAt: doc.updatedAt ?? undefined,
			};

			if (doc.folderId && folderNodes.has(doc.folderId)) {
				folderNodes.get(doc.folderId)!.documents.push(summary);
			} else {
				rootDocuments.push(summary);
			}
		});

		return { roots, rootDocuments };
	}, [library]);

	const toggleFolder = useCallback((id: string) => {
		setOpenFolders((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const renderFolder = useCallback(
		function renderFolder(node: FolderNode, depth = 0) {
			const isOpen = openFolders.has(node.id);
			return (
				<div key={node.id} className="space-y-1">
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => toggleFolder(node.id)}
							className="flex items-center justify-between"
							style={{ paddingLeft: `${depth * 12 + 12}px` }}
						>
							<span className="font-medium">{node.name}</span>
							<span className="text-xs text-muted-foreground">{isOpen ? "▾" : "▸"}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					{isOpen && (
						<div className="space-y-1">
							{node.documents.map((doc) => (
								<SidebarMenuItem key={doc.id}>
									<SidebarMenuButton
										asChild
										isActive={doc.id === selectedId}
										onClick={() => handleSelect(doc)}
										className="justify-start"
										style={{ paddingLeft: `${depth * 12 + 24}px` }}
									>
										<button className="w-full text-left">
											<div className="flex flex-col">
												<span>{doc.title || "Untitled"}</span>
											</div>
										</button>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
							{node.folders.map((child) => renderFolder(child, depth + 1))}
						</div>
					)}
				</div>
			);
		},
		[handleSelect, openFolders, selectedId, toggleFolder]
	);

	return (
		<Sidebar collapsible="offExamples" {...props}>
			<SidebarContent>
				<div className="flex flex-col gap-2 p-3">
					<FolderUploadDialog workspaceId={workspaceId} />
					{isLoading && <p className="text-sm text-muted-foreground">Loading documents</p>}
				</div>
				<SidebarGroup>
					<SidebarMenu>
						{tree.roots.map((folder) => renderFolder(folder))}
						{tree.rootDocuments.map((doc) => (
							<SidebarMenuItem key={doc.id}>
								<SidebarMenuButton
									asChild
									isActive={doc.id === selectedId}
									onClick={() => handleSelect(doc)}
									className="justify-start"
								>
									<div className="flex flex-col">
										<span>{doc.title || "Untitled"}</span>
									</div>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
						{!tree.roots.length && !tree.rootDocuments.length && !isLoading && (
							<SidebarMenuItem>
								<SidebarMenuButton disabled>No documents yet</SidebarMenuButton>
							</SidebarMenuItem>
						)}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<HugeiconsIcon
										icon={mounted && resolvedTheme === "dark" ? Moon02Icon : Sun03Icon}
										className="size-5"
									/>
									<span className="flex-1 text-left text-sm font-medium">
										{mounted ? (theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light") : "Theme"}
									</span>
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" align="start" className="w-[--radix-dropdown-menu-trigger-width]">
								<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
									<DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
