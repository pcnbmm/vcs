import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import SessionWrapper from "@/components/providers/SessionWrapper";
import PermissionGuard from "@/components/layout/PermissionGuard";
import PageHeader from "@/components/layout/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <SessionWrapper session={session}>
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-5 max-w-7xl mx-auto w-full">
            <PermissionGuard>
              <PageHeader />
              {children}
            </PermissionGuard>
          </main>
        </div>
      </div>
    </SessionWrapper>
  );
}
