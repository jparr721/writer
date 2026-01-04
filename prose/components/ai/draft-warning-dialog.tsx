"use client";

import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DraftWarningDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaveAndContinue: () => Promise<void>;
	onCancel: () => void;
	isSaving: boolean;
};

export function DraftWarningDialog({
	open,
	onOpenChange,
	onSaveAndContinue,
	onCancel,
	isSaving,
}: DraftWarningDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia className="bg-amber-100 text-amber-600">
						<HugeiconsIcon icon={Alert02Icon} className="size-5" />
					</AlertDialogMedia>
					<AlertDialogTitle>Unsaved Changes Detected</AlertDialogTitle>
					<AlertDialogDescription>
						You have unsaved changes in your draft. Running the AI will overwrite your current
						draft. Would you like to save your changes first?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel} disabled={isSaving}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction onClick={onSaveAndContinue} disabled={isSaving}>
						{isSaving ? (
							<>
								<HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
								Saving...
							</>
						) : (
							"Save and Continue"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
