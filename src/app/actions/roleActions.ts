"use server";

import { prisma } from "@/lib/prisma";

export async function getRoles() {
  try {
    const roles = await prisma.vc_roles.findMany({
      orderBy: { roles_id: "asc" },
    });
    return { success: true, data: roles };
  } catch (error) {
    console.error("Error fetching roles:", error);
    return { success: false, data: [] };
  }
}
