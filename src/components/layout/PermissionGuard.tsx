"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMenusByRoleIds } from "@/app/actions/menuActions";
import { Loader2 } from "lucide-react";

export default function PermissionGuard({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        let isMounted = true;

        if (status === "loading") return;

        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        const checkAccess = async () => {
            // Allow dashboard and unauthorized pages unconditionally
            if (pathname === "/" || pathname === "/dashboard" || pathname === "/unauthorized") {
                if (isMounted) setIsAuthorized(true);
                return;
            }

            const roles = session?.user?.roles ?? [];
            if (roles.length === 0) {
                router.push("/unauthorized");
                return;
            }

            try {
                // Check cache first
                const cacheKey = `menus_roles_${roles.join('_')}`;
                const cachedMenus = sessionStorage.getItem(cacheKey);
                let menus = [];

                if (cachedMenus) {
                    menus = JSON.parse(cachedMenus);
                } else {
                    const result = await getMenusByRoleIds(roles);
                    if (result.success) {
                        menus = result.data;
                        sessionStorage.setItem(cacheKey, JSON.stringify(menus));
                    }
                }

                const hasAccess = menus.some((menu: any) => {
                    if (!menu.route_path) return false;
                    return pathname === menu.route_path || pathname.startsWith(menu.route_path + "/");
                });

                if (isMounted) {
                    if (hasAccess) {
                        setIsAuthorized(true);
                    } else {
                        setIsAuthorized(false);
                        router.push("/unauthorized");
                    }
                }
            } catch (error) {
                console.error("Error checking permissions:", error);
                router.push("/unauthorized");
            }
        };

        checkAccess();

        return () => {
            isMounted = false;
        };
    }, [pathname, session, status, router]);

    if (!isAuthorized) {
        return (
            <div className="w-full h-[80vh] flex flex-col items-center justify-center bg-transparent">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="text-slate-500 font-medium tracking-wide">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
            </div>
        );
    }

    return <>{children}</>;
}
