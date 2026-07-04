"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GitBranch } from "lucide-react";
import LandingPage from "@/components/landing-page";

const BG = "#0D1117";
const TEXT_MUTED = "#8B949E";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  // Show loading only while checking auth — prevents flash
  if (status === "loading" || (status === "authenticated" && session)) {
    return (
      <main
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          color: TEXT_MUTED,
        }}
      >
        <GitBranch size={20} style={{ animation: "spin 1.5s linear infinite", marginRight: "10px" }} />
        Loading...
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  // User is unauthenticated — show landing page
  return <LandingPage />;
}
