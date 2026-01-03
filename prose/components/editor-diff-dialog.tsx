"use client";

import { generateDiffFile } from "@git-diff-view/file";
import { DiffModeEnum, DiffView } from "@git-diff-view/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

type EditorDiffDialogProps = {
	baseValue: string;
	value: string;
	filename?: string;
	disabled?: boolean;
	hasChanges?: boolean;
};

export function EditorDiffDialog({
	baseValue,
	value,
	filename = "document",
	disabled,
	hasChanges = true,
}: EditorDiffDialogProps) {
	const [open, setOpen] = useState(false);

	const diffFile = useMemo(() => {
		if (!hasChanges) return null;
		try {
			const instance = generateDiffFile(filename, baseValue, filename, value, "", "");
			instance.initRaw();
			return instance;
		} catch (error) {
			console.error("Failed to generate diff", error);
			return null;
		}
	}, [baseValue, filename, hasChanges, value]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" disabled={disabled}>
					Diff
				</Button>
			</DialogTrigger>
			<DialogContent className="w-[90vw] max-w-[80vw] sm:max-w-[80vw] lg:max-w-[80vw]">
				<DialogHeader>
					<DialogTitle>Changes</DialogTitle>
					<DialogDescription>Comparing saved content to your current draft.</DialogDescription>
				</DialogHeader>
				{diffFile ? (
					<div className="max-h-[80vh] overflow-auto">
						<DiffView
							diffFile={diffFile}
							diffViewWrap={true}
							diffViewHighlight
							diffViewMode={DiffModeEnum.Split}
						/>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">No changes to display.</p>
				)}
			</DialogContent>
		</Dialog>
	);
}
