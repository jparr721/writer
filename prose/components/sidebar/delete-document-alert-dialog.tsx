"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteDocumentAlertDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	documentTitle: string;
	onDelete: () => Promise<void>;
	isDeleting: boolean;
};

export function DeleteDocumentAlertDialog({
	open,
	onOpenChange,
	documentTitle,
	onDelete,
	isDeleting,
}: DeleteDocumentAlertDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete document</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete "{documentTitle || "Untitled"}"? This action cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={onDelete} disabled={isDeleting}>
						{isDeleting ? (
							<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
						) : (
							"Delete"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
