import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = { 
  // ระบุหน้าที่ต้องการให้ "รปภ." เฝ้าไว้
  // ถ้าพยายามเข้าหน้าพวกนี้โดยไม่ Login ระบบจะดีดไปหน้า /login อัตโนมัติ
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};