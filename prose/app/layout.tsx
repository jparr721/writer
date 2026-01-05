import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import "@git-diff-view/react/styles/diff-view-pure.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Prose",
	description: "A modern writing app for AI-powered writing assistance.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={jetbrainsMono.variable}>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<QueryProvider>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						{children}
					</ThemeProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
