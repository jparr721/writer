"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type RenameDocumentDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentTitle: string;
	onRename: (newTitle: string) => Promise<void>;
	isRenaming: boolean;
};

export function RenameDocumentDialog({
	open,
	onOpenChange,
	currentTitle,
	onRename,
	isRenaming,
}: RenameDocumentDialogProps) {
	const [title, setTitle] = useState(currentTitle);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setTitle(currentTitle);
			setError(null);
		}
	}, [open, currentTitle]);

	const handleRename = useCallback(async () => {
		const trimmed = title.trim();
		if (!trimmed) {
			setError("Name is required");
			return;
		}

		try {
			await onRename(trimmed);
			onOpenChange(false);
		} catch (err) {
			console.error("Failed to rename document", err);
			setError("Failed to rename document");
		}
	}, [title, onRename, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename document</DialogTitle>
					<DialogDescription>Enter a new name for this document.</DialogDescription>
				</DialogHeader>
				<Input
					autoFocus
					placeholder="Document name"
					value={title}
					onChange={(e) => {
						setTitle(e.target.value);
						setError(null);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleRename();
						}
					}}
				/>
				{error && <p className="text-xs text-destructive">{error}</p>}
				<DialogFooter className="flex items-center gap-2 sm:justify-end">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRenaming}>
						Cancel
					</Button>
					<Button onClick={handleRename} disabled={isRenaming}>
						{isRenaming ? (
							<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
						) : (
							"Save"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
