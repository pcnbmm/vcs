import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt", // CredentialsProvider requires JWT strategy
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "รหัสพนักงาน", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // ค้นหา User ด้วย Username (รหัสพนักงาน)
        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        if (!user) return null;

        // ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // ถ้ามีการล็อกอินใหม่ (user จะมีค่า) ให้เก็บข้อมูลลง JWT
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
