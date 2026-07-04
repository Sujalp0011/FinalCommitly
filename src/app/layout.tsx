import type { Metadata } from "next";
import AuthProvider from "@/components/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commitly — AI-Powered Commit Insights",
  description:
    "Get intelligent summaries and insights from your GitHub commits, powered by AI.",
  keywords: ["github", "commits", "ai", "developer tools", "code analysis"],
  authors: [{ name: "Commitly" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0D1117" />
      </head>
      <body className="min-h-screen antialiased" style={{ background: "#0D1117", color: "#E6EDF3" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
