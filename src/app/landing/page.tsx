import LandingPage from "@/components/landing-page";

/**
 * Dev preview route — always shows the landing page regardless of auth state.
 * Visit /landing while logged in to preview the landing page design.
 */
export default function LandingPreviewPage() {
  return <LandingPage />;
}
