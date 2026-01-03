"use client";

export default function WorkspaceLandingPage() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
			<div className="space-y-2">
				<p>Select a document from the sidebar to start editing.</p>
				<p>Use Import Folder to upload files into the app.</p>
			</div>
		</div>
	);
}
