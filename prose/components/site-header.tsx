import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import WorkspaceSelector from "@/components/workspace-selector";
import { useProvider } from "@/hooks/use-ai-tools";
import { useWorkspaceSettings } from "@/hooks/use-workspace-settings";
import { Spinner } from "./ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function SiteHeader() {
	const { settings } = useWorkspaceSettings();
	const { data: providerData, isLoading } = useProvider(settings.workspaceId);
	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
				<div className="items-center w-full grid grid-cols-3">
					<h1 className="text-base font-medium">Prose</h1>
					<div className="flex items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="text-xs text-muted-foreground">
									Provider: {isLoading ? <Spinner /> : providerData?.name}
								</span>
							</TooltipTrigger>
							<TooltipContent>
								Provider selected based on the API_KEY environment variable.
							</TooltipContent>
						</Tooltip>
					</div>
					<div className="ml-auto">
						<WorkspaceSelector />
					</div>
				</div>
			</div>
		</header>
	);
}
