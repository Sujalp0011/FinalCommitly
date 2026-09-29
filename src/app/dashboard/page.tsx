import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import SignOutButton from "@/components/sign-out-button";
import SyncButton from "@/components/sync-button";
import DailySummaryCard from "@/components/daily-summary-card";
import ProjectsProgress from "@/components/projects-progress";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      {/* User info header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={64}
            height={64}
            style={{ borderRadius: "50%" }}
          />
        )}
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
            {session.user?.name ?? "Developer"}
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#888" }}>
            {session.user?.email}
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <SignOutButton />
        </div>
      </div>

      {/* Sync controls */}
      <SyncButton />

      {/* Daily AI Summary */}
      <DailySummaryCard />

      {/* Project Progress Cards */}
      <ProjectsProgress />
    </main>
  );
}
