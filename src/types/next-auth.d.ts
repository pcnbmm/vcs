import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      roles: number[];
    };
  }

  interface User {
    id: string;
    username: string;
    roles: number[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    roles: number[];
  }
}
