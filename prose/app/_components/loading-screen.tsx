import { Spinner } from "@/components/ui/spinner";

export function LoadingScreen() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<Spinner className="size-6" />
		</div>
	);
}
