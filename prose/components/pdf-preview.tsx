"use client";

import { useEffect, useState } from "react";
import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type PdfPreviewProps = {
	pdfBlob: Blob | null;
	isLoading: boolean;
	error: Error | null;
};

export function PdfPreview({ pdfBlob, isLoading, error }: PdfPreviewProps) {
	const [blobUrl, setBlobUrl] = useState<string | null>(null);

	useEffect(() => {
		if (pdfBlob) {
			const url = URL.createObjectURL(pdfBlob);
			setBlobUrl(url);
			return () => URL.revokeObjectURL(url);
		}
		setBlobUrl(null);
	}, [pdfBlob]);

	if (isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-muted/30">
				<div className="flex items-center gap-2 text-muted-foreground">
					<HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />
					<span className="text-sm">Compiling <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" /></span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/30 p-4">
				<HugeiconsIcon icon={Alert02Icon} className="size-8 text-destructive" />
				<p className="text-sm font-medium">Compilation Failed</p>
				<p className="max-w-md text-center text-xs text-muted-foreground">
					{error.message}
				</p>
			</div>
		);
	}

	if (!blobUrl) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-muted/30">
				<p className="text-sm text-muted-foreground">
					Save to generate PDF preview
				</p>
			</div>
		);
	}

	return (
		<object data={blobUrl} type="application/pdf" className="h-full w-full">
			<p className="p-4 text-sm text-muted-foreground">
				PDF preview not supported in this browser
			</p>
		</object>
	);
}
