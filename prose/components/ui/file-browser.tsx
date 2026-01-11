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
