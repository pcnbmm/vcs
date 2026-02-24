import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar'; // Import เข้ามา

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50">
            {/* ด้านซ้าย: Sidebar */}
            <Sidebar />

            {/* ด้านขวา: Header + Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar /> {/* เพิ่ม Navbar ไว้ตรงนี้ */}
                
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}