import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { mockRoles } from "@/mock/data/permissions";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "รหัสพนักงาน", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.vc_users.findFirst({
          where: { username: credentials.username },
          include: {
            vc_user_roles: {
              include: { vc_roles: true },
            },
          },
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.username2 ?? "",
        );

        if (!isPasswordValid) return null;

        // ── ดึง roles จาก vc_user_roles ───────────────────────
        const roles = user.vc_user_roles
          .map((ur) => ur.roles_id)
          .filter(Boolean) as number[];

        return {
          id: String(user.userid),
          name: user.bname,
          email: user.email,
          username: user.username ?? "",
          roles: roles.length > 0 ? roles : [1], // fallback role 1
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.roles = (user as any).roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.roles = token.roles as number[];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
