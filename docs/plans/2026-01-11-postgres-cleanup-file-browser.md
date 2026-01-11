# PostgreSQL Cleanup & File Browser Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove PostgreSQL remnants and add a server-side file browser component for workspace creation.

**Architecture:** Server Action provides directory listing (filesystem access stays server-side). Client Component handles UI with breadcrumb navigation and folder list. Component is self-contained in `components/ui/`.

**Tech Stack:** Next.js Server Actions, React, shadcn/ui patterns, Node.js fs/path modules

---

## Task 1: Remove PostgreSQL Files

**Files:**
- Delete: `docker-compose.yml`
- Delete: `db/` directory (contains empty `init.sql` folder)

**Step 1: Delete docker-compose.yml**

```bash
rm docker-compose.yml
```

**Step 2: Delete db directory**

```bash
rm -rf db
```

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove PostgreSQL docker-compose and db folder

SQLite migration complete, these are no longer needed.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create File Browser Server Action

**Files:**
- Create: `prose/components/ui/file-browser-actions.ts`

**Step 1: Create the server action file**

```typescript
"use server";

import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join, parse, sep } from "node:path";

export interface DirectoryListing {
	currentPath: string;
	folders: string[];
	canGoUp: boolean;
}

export async function listDirectory(path?: string): Promise<DirectoryListing> {
	const home = homedir();
	const targetPath = path || home;

	// Security: ensure path is within or equal to home directory
	const normalizedTarget = join(targetPath);
	const normalizedHome = join(home);

	if (!normalizedTarget.startsWith(normalizedHome)) {
		return {
			currentPath: home,
			folders: await getFolders(home),
			canGoUp: false,
		};
	}

	const folders = await getFolders(normalizedTarget);

	return {
		currentPath: normalizedTarget,
		folders,
		canGoUp: normalizedTarget !== normalizedHome,
	};
}

async function getFolders(dirPath: string): Promise<string[]> {
	try {
		const entries = await readdir(dirPath, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
			.map((entry) => entry.name)
			.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
	} catch {
		return [];
	}
}

export function getPathSegments(path: string): { name: string; path: string }[] {
	const home = homedir();
	const normalizedPath = join(path);
	const normalizedHome = join(home);

	if (!normalizedPath.startsWith(normalizedHome)) {
		return [{ name: "~", path: home }];
	}

	const segments: { name: string; path: string }[] = [{ name: "~", path: home }];

	if (normalizedPath === normalizedHome) {
		return segments;
	}

	const relativePath = normalizedPath.slice(normalizedHome.length);
	const parts = relativePath.split(sep).filter(Boolean);

	let currentPath = home;
	for (const part of parts) {
		currentPath = join(currentPath, part);
		segments.push({ name: part, path: currentPath });
	}

	return segments;
}
```

**Step 2: Commit**

```bash
git add prose/components/ui/file-browser-actions.ts && git commit -m "feat: add file browser server actions

Provides listDirectory and getPathSegments for server-side
directory browsing, restricted to user's home directory.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create File Browser Client Component

**Files:**
- Create: `prose/components/ui/file-browser.tsx`

**Step 1: Create the file browser component**

```typescript
"use client";

import { Folder02Icon, Home01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "./breadcrumb";
import { Button } from "./button";
import {
	type DirectoryListing,
	getPathSegments,
	listDirectory,
} from "./file-browser-actions";
import { ScrollArea } from "./scroll-area";
import { Spinner } from "./spinner";

interface FileBrowserProps {
	onSelect: (path: string) => void;
	onCancel?: () => void;
	className?: string;
}

export function FileBrowser({ onSelect, onCancel, className }: FileBrowserProps) {
	const [listing, setListing] = useState<DirectoryListing | null>(null);
	const [segments, setSegments] = useState<{ name: string; path: string }[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadDirectory = useCallback(async (path?: string) => {
		setLoading(true);
		setError(null);
		try {
			const result = await listDirectory(path);
			setListing(result);
			const pathSegments = await getPathSegments(result.currentPath);
			setSegments(pathSegments);
		} catch {
			setError("Failed to load directory");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadDirectory();
	}, [loadDirectory]);

	const handleFolderClick = (folderName: string) => {
		if (!listing) return;
		const newPath = `${listing.currentPath}/${folderName}`;
		loadDirectory(newPath);
	};

	const handleBreadcrumbClick = (path: string) => {
		loadDirectory(path);
	};

	const handleSelect = () => {
		if (listing) {
			onSelect(listing.currentPath);
		}
	};

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{/* Breadcrumb navigation */}
			<Breadcrumb>
				<BreadcrumbList>
					{segments.map((segment, index) => (
						<BreadcrumbItem key={segment.path}>
							{index > 0 && <BreadcrumbSeparator />}
							{index === segments.length - 1 ? (
								<BreadcrumbPage className="flex items-center gap-1">
									{index === 0 && (
										<HugeiconsIcon icon={Home01Icon} className="size-3" />
									)}
									{segment.name}
								</BreadcrumbPage>
							) : (
								<BreadcrumbLink
									href="#"
									onClick={(e) => {
										e.preventDefault();
										handleBreadcrumbClick(segment.path);
									}}
									className="flex items-center gap-1"
								>
									{index === 0 && (
										<HugeiconsIcon icon={Home01Icon} className="size-3" />
									)}
									{segment.name}
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					))}
				</BreadcrumbList>
			</Breadcrumb>

			{/* Folder list */}
			<ScrollArea className="h-64 border border-border rounded-none">
				{loading ? (
					<div className="flex items-center justify-center h-full">
						<Spinner />
					</div>
				) : error ? (
					<div className="flex items-center justify-center h-full text-destructive text-sm">
						{error}
					</div>
				) : listing?.folders.length === 0 ? (
					<div className="flex items-center justify-center h-full text-muted-foreground text-sm">
						No folders
					</div>
				) : (
					<div className="p-1">
						{listing?.folders.map((folder) => (
							<button
								type="button"
								key={folder}
								onClick={() => handleFolderClick(folder)}
								className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-muted rounded-none transition-colors"
							>
								<HugeiconsIcon
									icon={Folder02Icon}
									className="size-4 text-muted-foreground"
								/>
								{folder}
							</button>
						))}
					</div>
				)}
			</ScrollArea>

			{/* Current path display */}
			{listing && (
				<p className="text-xs text-muted-foreground truncate">
					{listing.currentPath}
				</p>
			)}

			{/* Action buttons */}
			<div className="flex items-center justify-end gap-2">
				{onCancel && (
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button onClick={handleSelect} disabled={!listing}>
					Select this folder
				</Button>
			</div>
		</div>
	);
}
```

**Step 2: Commit**

```bash
git add prose/components/ui/file-browser.tsx && git commit -m "feat: add FileBrowser client component

Breadcrumb navigation with folder list for selecting directories.
Uses server actions for filesystem access.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Integrate FileBrowser into Create Workspace Dialog

**Files:**
- Modify: `prose/app/_components/create-workspace-dialog.tsx`

**Step 1: Update the dialog to use FileBrowser**

Replace the root path input with the FileBrowser component. The dialog should show the file browser inline, and when a folder is selected, show the selected path with an option to change it.

```typescript
"use client";

import { useState } from "react";
import type { WorkspaceResponse } from "@/app/api/schemas";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FileBrowser } from "@/components/ui/file-browser";
import { Input } from "@/components/ui/input";
import { useCreateWorkspace } from "@/hooks/use-workspaces";

interface CreateWorkspaceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingNames: string[];
	onCreated: (workspace: WorkspaceResponse) => void;
}

export function CreateWorkspaceDialog({
	open,
	onOpenChange,
	existingNames,
	onCreated,
}: CreateWorkspaceDialogProps) {
	const createWorkspace = useCreateWorkspace();
	const [name, setName] = useState("");
	const [rootPath, setRootPath] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleCreate = async () => {
		const trimmedName = name.trim();

		if (!trimmedName) {
			setError("Name is required");
			return;
		}

		if (!rootPath) {
			setError("Please select a folder");
			return;
		}

		const duplicate = existingNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase());
		if (duplicate) {
			setError("A workspace with that name already exists");
			return;
		}

		try {
			const workspace = await createWorkspace.mutateAsync({ name: trimmedName, rootPath });
			setError(null);
			setName("");
			setRootPath(null);
			onCreated(workspace);
		} catch (err) {
			console.error("Failed to create workspace", err);
			setError("Failed to create workspace");
		}
	};

	const handleClose = (isOpen: boolean) => {
		if (!isOpen) {
			setName("");
			setRootPath(null);
			setError(null);
		}
		onOpenChange(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Create workspace</DialogTitle>
					<DialogDescription>Choose a name and select the root directory for this workspace.</DialogDescription>
				</DialogHeader>
				<Input
					autoFocus
					placeholder="Workspace name"
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						setError(null);
					}}
				/>
				{rootPath ? (
					<div className="flex items-center gap-2">
						<div className="flex-1 text-sm border border-border px-2 py-1.5 truncate bg-muted">
							{rootPath}
						</div>
						<Button variant="outline" size="sm" onClick={() => setRootPath(null)}>
							Change
						</Button>
					</div>
				) : (
					<FileBrowser
						onSelect={(path) => {
							setRootPath(path);
							setError(null);
						}}
					/>
				)}
				{error ? <p className="text-xs text-destructive">{error}</p> : null}
				<DialogFooter className="flex items-center gap-2 sm:justify-end">
					<Button
						variant="outline"
						onClick={() => handleClose(false)}
						disabled={createWorkspace.isPending}
					>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={createWorkspace.isPending || !rootPath}>
						{createWorkspace.isPending ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
```

**Step 2: Commit**

```bash
git add prose/app/_components/create-workspace-dialog.tsx && git commit -m "feat: integrate FileBrowser into create workspace dialog

Replace manual path input with visual folder browser.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Test the Implementation

**Step 1: Start the dev server**

```bash
cd prose && bun dev
```

**Step 2: Manual testing checklist**

1. Open the app and click to create a new workspace
2. Verify the file browser loads showing home directory folders
3. Click a folder to navigate into it
4. Verify breadcrumbs update and are clickable
5. Click "Select this folder" and verify the path appears
6. Click "Change" to re-open the browser
7. Enter a workspace name and create the workspace
8. Verify the workspace is created successfully

**Step 3: Run linting**

```bash
bun biome:check
```

Fix any issues that arise.

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Remove PostgreSQL docker-compose and db folder |
| 2 | Create server action for directory listing |
| 3 | Create FileBrowser client component |
| 4 | Integrate FileBrowser into create workspace dialog |
| 5 | Test and verify the implementation |
