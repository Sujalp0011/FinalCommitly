import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request repo scope to read commit data
          scope: "read:user user:email repo",
        },
      },
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Read access token from the Account table (stored by Prisma adapter)
        const account = await prisma.account.findFirst({
          where: {
            userId: user.id,
            provider: "github",
          },
          select: {
            access_token: true,
            providerAccountId: true,
          },
        });

        session.user.accessToken = account?.access_token ?? undefined;
        session.user.githubId = account?.providerAccountId ?? undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },

  session: {
    strategy: "database",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
