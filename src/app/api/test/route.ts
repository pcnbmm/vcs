import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const approver = await prisma.vc_users.findFirst({
    where: { username: "approver03" },
    include: { vc_user_roles: { include: { vc_roles: true } } },
  });

  const dispatcher = await prisma.vc_users.findFirst({
    where: { username: "dispatcher02" },
    include: { vc_user_roles: { include: { vc_roles: true } } },
  });

  let approverOwnDivProp = null;
  if (approver?.sectionid) {
    approverOwnDivProp = await prisma.vc_own_div_prop.findFirst({
      where: { own_div_code: approver.sectionid },
    });
  }

  let dispatcherOwnDivProp = null;
  if (dispatcher?.sectionid) {
    dispatcherOwnDivProp = await prisma.vc_own_div_prop.findFirst({
      where: { own_div_code: dispatcher.sectionid },
    });
  }

  return NextResponse.json({
    approver,
    approverOwnDivProp,
    dispatcher,
    dispatcherOwnDivProp,
  });
}
