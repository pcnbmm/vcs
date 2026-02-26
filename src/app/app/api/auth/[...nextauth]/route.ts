import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "database", // เก็บ Session ลง PostgreSQL
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

        // คืนค่าข้อมูล User (NextAuth จะเอาไปใส่ใน Session table อัตโนมัติ)
        return {
          id: user.id,
          name: user.name,
          email: user.email,     // เก็บ Email ลง Session ด้วย
          username: user.username,
        };
      }
    })
  ],
  callbacks: {
    // ใน Database Strategy, 'user' คือข้อมูลที่ดึงมาจาก DB โดยตรง
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = (user as any).username;
        session.user.email = user.email; // ยืนยันว่ามี email ใน session
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