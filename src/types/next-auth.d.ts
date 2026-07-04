import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      githubId?: string;
      accessToken?: string;
    } & DefaultSession["user"];
  }
}
