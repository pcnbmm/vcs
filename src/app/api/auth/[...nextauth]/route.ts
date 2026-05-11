import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 60,
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

        if (!user) {
          await prisma.vc_login_log.create({
            data: {
              username: credentials.username,
              status: "FAILED",
            },
          });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.username2 ?? "",
        );

        if (!isPasswordValid) {
          await prisma.vc_login_log.create({
            data: {
              userid: user.userid,
              username: user.username,
              status: "FAILED",
            },
          });
          return null;
        }

        await prisma.vc_login_log.create({
          data: {
            userid: user.userid,
            username: user.username,
            status: "SUCCESS",
          },
        });

        const roles = user.vc_user_roles
          .map((ur) => ur.roles_id)
          .filter(Boolean) as number[];

        return {
          id: String(user.userid),
          name: `${user.bname ?? ""} ${user.firstname ?? ""} ${user.lastname ?? ""}`.trim(),
          email: user.email,
          username: user.username ?? "",
          roles: roles.length > 0 ? roles : [1],
          sectionid: user.sectionid,
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
        token.sectionid = (user as any).sectionid;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).roles = token.roles as number[];
        (session.user as any).sectionid = token.sectionid as string;
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
