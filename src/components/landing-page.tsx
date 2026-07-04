"use client";

import { signIn } from "next-auth/react";
import {
  LayoutGrid,
  MessageSquareText,
  Repeat,
  FileText,
  TrendingUp,
  Search,
  Github,
  ArrowRight,
} from "lucide-react";

const ACCENT = "#4F8EF7";
const BG = "#0D1117";
const CARD_BG = "#161B22";
const TEXT = "#E6EDF3";
const TEXT_MUTED = "#8B949E";
const BORDER = "#21262D";

function connectGitHub() {
  signIn("github", { callbackUrl: "/dashboard" });
}

/* ── Navbar ─────────────────────────────────────── */
function Navbar() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        maxWidth: "1100px",
        margin: "0 auto",
        background: BG,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <span
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: ACCENT,
          letterSpacing: "-0.02em",
        }}
      >
        Commitly
      </span>
      <button
        onClick={connectGitHub}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 20px",
          fontSize: "0.875rem",
          fontWeight: 500,
          cursor: "pointer",
          border: `1px solid ${BORDER}`,
          borderRadius: "6px",
          background: "transparent",
          color: TEXT,
        }}
      >
        <Github size={16} />
        Connect GitHub
      </button>
    </nav>
  );
}

/* ── Hero ───────────────────────────────────────── */
function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3.25rem)",
          fontWeight: 700,
          lineHeight: 1.15,
          color: TEXT,
          letterSpacing: "-0.03em",
          margin: 0,
        }}
      >
        Know what you actually
        <br />
        built today
      </h1>
      <p
        style={{
          fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
          lineHeight: 1.7,
          color: TEXT_MUTED,
          marginTop: "24px",
          maxWidth: "560px",
        }}
      >
        Commitly reads your GitHub commits and gives you a plain-English summary
        of your progress — across all your side projects, every day.
      </p>
      <button
        id="hero-cta"
        onClick={connectGitHub}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "40px",
          padding: "14px 32px",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
          borderRadius: "8px",
          background: ACCENT,
          color: "#fff",
        }}
      >
        Connect GitHub — it&apos;s free
        <ArrowRight size={18} />
      </button>
      <p
        style={{
          fontSize: "0.8rem",
          color: "#484F58",
          marginTop: "16px",
        }}
      >
        No credit card. No setup. Just connect GitHub.
      </p>
    </section>
  );
}

/* ── Problem ────────────────────────────────────── */
const painPoints = [
  {
    icon: LayoutGrid,
    title: "Multiple repos, zero overview",
    desc: "Your progress is scattered across 4 different GitHub repos with no unified view.",
  },
  {
    icon: MessageSquareText,
    title: "Commits don\u2019t equal clarity",
    desc: "You pushed code today. But what did you actually move forward?",
  },
  {
    icon: Repeat,
    title: "Patterns you never notice",
    desc: "You\u2019ve been fixing the same bug for 3 days. GitHub won\u2019t tell you that.",
  },
];

function Problem() {
  return (
    <section
      style={{
        padding: "80px 24px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
          fontWeight: 700,
          color: TEXT,
          textAlign: "center",
          letterSpacing: "-0.02em",
          marginBottom: "48px",
        }}
      >
        You commit. But do you know what you&apos;re building?
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {painPoints.map((point) => (
          <div
            key={point.title}
            style={{
              background: CARD_BG,
              border: `1px solid ${BORDER}`,
              borderRadius: "10px",
              padding: "28px 24px",
            }}
          >
            <point.icon size={22} color={ACCENT} style={{ marginBottom: "16px" }} />
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: TEXT,
                margin: "0 0 10px 0",
              }}
            >
              {point.title}
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                lineHeight: 1.65,
                color: TEXT_MUTED,
                margin: 0,
              }}
            >
              {point.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────── */
const features = [
  {
    icon: FileText,
    title: "Daily Dev Summary",
    desc: "Every day, Commitly pulls your commits and writes a plain-English summary of what you built. Specific. Honest. No fluff.",
    gradient: `linear-gradient(135deg, #1a1a3e, ${ACCENT}22)`,
  },
  {
    icon: TrendingUp,
    title: "Project Progress",
    desc: "See how each side project is moving — not just commit counts, but actual momentum indicators.",
    gradient: `linear-gradient(135deg, #1a2e1a, #4ade8022)`,
  },
  {
    icon: Search,
    title: "Commit Pattern Insights",
    desc: "Spot patterns in how you work. Are you building or just fixing? Moving forward or going in circles?",
    gradient: `linear-gradient(135deg, #2e1a1a, #fbbf2422)`,
  },
];

function Features() {
  return (
    <section
      style={{
        padding: "80px 24px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
          fontWeight: 700,
          color: TEXT,
          textAlign: "center",
          letterSpacing: "-0.02em",
          marginBottom: "56px",
        }}
      >
        Your dev day, finally making sense
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        {features.map((feat, i) => {
          const reversed = i % 2 !== 0;
          return (
            <div
              key={feat.title}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
                alignItems: "center",
              }}
            >
              <div style={{ order: reversed ? 2 : 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <feat.icon size={20} color={ACCENT} />
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      color: TEXT,
                      margin: 0,
                    }}
                  >
                    {feat.title}
                  </h3>
                </div>
                <p
                  style={{
                    fontSize: "0.925rem",
                    lineHeight: 1.7,
                    color: TEXT_MUTED,
                    margin: 0,
                  }}
                >
                  {feat.desc}
                </p>
              </div>

              <div
                style={{
                  order: reversed ? 1 : 2,
                  height: "200px",
                  borderRadius: "10px",
                  border: `1px solid ${BORDER}`,
                  background: feat.gradient,
                }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── CTA ────────────────────────────────────────── */
function CTASection() {
  return (
    <section
      style={{
        padding: "80px 24px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
          fontWeight: 700,
          color: TEXT,
          letterSpacing: "-0.02em",
          marginBottom: "12px",
        }}
      >
        Start knowing what you&apos;re building
      </h2>
      <p
        style={{
          fontSize: "1rem",
          color: TEXT_MUTED,
          marginBottom: "32px",
        }}
      >
        Connect GitHub in 30 seconds. Your first summary is waiting.
      </p>
      <button
        id="bottom-cta"
        onClick={connectGitHub}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 32px",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
          borderRadius: "8px",
          background: ACCENT,
          color: "#fff",
        }}
      >
        Connect GitHub — it&apos;s free
        <ArrowRight size={18} />
      </button>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────── */
function Footer() {
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        padding: "32px 24px",
        maxWidth: "1100px",
        margin: "0 auto",
        borderTop: `1px solid ${BORDER}`,
        fontSize: "0.8rem",
        color: "#484F58",
      }}
    >
      <span>Commitly — Built for side-project builders</span>
      <span>Made by Sujal</span>
    </footer>
  );
}

/* ── Exported Landing Page Component ────────────── */
export default function LandingPage() {
  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <CTASection />
      <Footer />
    </div>
  );
}
