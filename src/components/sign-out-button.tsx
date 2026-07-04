"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      id="sign-out-button"
      onClick={() => signOut({ callbackUrl: "/" })}
      style={{
        padding: "8px 16px",
        fontSize: "0.875rem",
        cursor: "pointer",
        border: "1px solid #555",
        borderRadius: "6px",
        background: "transparent",
        color: "#ccc",
      }}
    >
      Sign Out
    </button>
  );
}
