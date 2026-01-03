import { Button } from "@/components/ui/button";

interface NoWorkspaceViewProps {
	hasWorkspaces: boolean;
	onSelectClick: () => void;
	onCreateClick: () => void;
}

export function NoWorkspaceView({
	hasWorkspaces,
	onSelectClick,
	onCreateClick,
}: NoWorkspaceViewProps) {
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="max-w-md space-y-4 text-center">
				<h1 className="text-xl font-semibold">Choose a workspace</h1>
				<p className="text-sm text-muted-foreground">
					Select an existing workspace or create a new one to get started.
				</p>
				<div className="flex items-center justify-center gap-2">
					<Button onClick={onSelectClick} disabled={!hasWorkspaces}>
						Select workspace
					</Button>
					<Button variant="outline" onClick={onCreateClick}>
						Create workspace
					</Button>
				</div>
				{!hasWorkspaces && (
					<p className="text-xs text-muted-foreground">No workspaces yet. Create one to begin.</p>
				)}
			</div>
		</div>
	);
}
