// lib/admin-actions.ts
"use server"
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function registerEmployee(formData: {
  username: string, 
  email: string, 
  name: string, 
  password: string 
}) {
  const hashedPassword = await bcrypt.hash(formData.password, 10);

  try {
    const newUser = await prisma.user.create({
      data: {
        username: formData.username, // รหัสพนักงาน
        email: formData.email,       // อีเมลองค์กร
        name: formData.name,
        password: hashedPassword,
      }
    });
    return { success: true, user: newUser };
  } catch (error) {
    return { success: false, error: "Username หรือ Email นี้มีอยู่แล้ว" };
  }
}