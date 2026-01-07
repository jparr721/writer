"use client";

import { Loading03Icon, MultiplicationSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContentFullscreen,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useFolderUpload } from "@/hooks/use-folder-upload";
import type { PendingFile } from "@/lib/upload/types";
import { fileToPendingFile } from "@/lib/upload/utils";

type FolderUploadDialogProps = {
	workspaceId: string | null;
};

export default function FolderUploadDialog({ workspaceId }: FolderUploadDialogProps) {
	const [open, setOpen] = useState(false);
	const [files, setFiles] = useState<PendingFile[]>([]);
	const [filter, setFilter] = useState("");
	const [ignoreDotFiles, setIgnoreDotFiles] = useState(true);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const { upload, isUploading, progress, reset } = useFolderUpload(workspaceId);

	const handleChoose = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFilesSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const selected = event.target.files;
		if (!selected?.length) return;

		const next = Array.from(selected).map(fileToPendingFile);
		setFiles(next);
	}, []);

	const handleRemove = useCallback((path: string) => {
		setFiles((prev) => prev.filter((item) => item.path !== path));
	}, []);

	const filteredFiles = useMemo(() => {
		let result = files;

		// Filter dot files if checkbox is checked
		if (ignoreDotFiles) {
			result = result.filter((f) => {
				const filename = f.path.split("/").pop() || f.path;
				return !filename.startsWith(".");
			});
		}

		// Apply text filter
		if (filter.trim()) {
			const term = filter.trim().toLowerCase();
			result = result.filter((f) => f.path.toLowerCase().includes(term));
		}

		return result;
	}, [files, filter, ignoreDotFiles]);

	const totalSize = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);

	const handleUpload = useCallback(async () => {
		if (!filteredFiles.length) return;

		try {
			await upload(filteredFiles);
			setOpen(false);
			setFiles([]);
			setFilter("");
		} catch (error) {
			console.error("Failed to upload folder", error);
		}
	}, [filteredFiles, upload]);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				reset();
			}
			setOpen(nextOpen);
		},
		[reset]
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="default" disabled={!workspaceId}>
					Import Folder
				</Button>
			</DialogTrigger>
			<DialogContentFullscreen>
				<DialogHeader>
					<DialogTitle>Import folder</DialogTitle>
					<DialogDescription>
						Select a folder to import. You can remove files before uploading. Hierarchy is preserved
						when relative paths are available.
					</DialogDescription>
				</DialogHeader>

				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					multiple
					//@ts-expect-error non-standard but supported in Chromium
					webkitdirectory="true"
					directory=""
					onChange={handleFilesSelected}
				/>

				<div className="flex items-center gap-2">
					<Button onClick={handleChoose} variant="secondary">
						Choose folder
					</Button>
					<Input
						placeholder="Filter files"
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
					/>
				</div>

				<div className="flex items-center gap-2 text-sm">
					<Checkbox
						id="ignore-dot-files"
						checked={ignoreDotFiles}
						onCheckedChange={(checked) => setIgnoreDotFiles(checked === true)}
					/>
					<Label htmlFor="ignore-dot-files">Ignore dot files</Label>
				</div>

				<div className="max-h-[60vh] overflow-auto rounded border text-xs">
					{filteredFiles.length ? (
						<ul className="divide-y">
							{filteredFiles.map((item) => (
								<li key={item.path} className="flex items-center justify-between gap-3 px-3 py-2">
									<div className="flex flex-col">
										<span className="font-medium">{item.path}</span>
										<span className="text-muted-foreground">
											{(item.size / 1024).toFixed(1)} KB
										</span>
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => handleRemove(item.path)}
										className="shrink-0"
									>
										<HugeiconsIcon icon={MultiplicationSignIcon} />
									</Button>
								</li>
							))}
						</ul>
					) : (
						<div className="px-3 py-6 text-center text-muted-foreground">No files selected.</div>
					)}
				</div>

				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<div>
						{files.length} file{files.length === 1 ? "" : "s"} selected ·{" "}
						{(totalSize / 1024).toFixed(1)} KB
					</div>
					<div>{filteredFiles.length !== files.length ? `${filteredFiles.length} shown` : ""}</div>
				</div>

				{isUploading && progress && (
					<div className="space-y-2">
						<Progress value={progress.completed} className="h-2" />
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>Uploading...</span>
							<span>{progress.completed}%</span>
						</div>
					</div>
				)}

				<DialogFooter className="flex items-center gap-2 sm:justify-end">
					<Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
						Cancel
					</Button>
					<Button onClick={handleUpload} disabled={!filteredFiles.length || isUploading}>
						{isUploading ? (
							<>
								<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin mr-2" />
								{progress?.completed ?? 0}%
							</>
						) : (
							"Upload"
						)}
					</Button>
				</DialogFooter>
			</DialogContentFullscreen>
		</Dialog>
	);
}
