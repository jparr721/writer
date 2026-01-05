import BookContent from "@/components/book-content";

type BookPageProps = {
	params: Promise<{ workspaceId: string }>;
};

export default async function BookPage({ params }: BookPageProps) {
	const { workspaceId } = await params;

	return (
		<div className="container max-w-5xl py-8">
			<header className="mb-8">
				<h1 className="text-2xl font-bold">Book</h1>
				<p className="text-muted-foreground">
					Manage chapters, reorder them, and generate summaries for AI context.
				</p>
			</header>
			<BookContent workspaceId={workspaceId} />
		</div>
	);
}
