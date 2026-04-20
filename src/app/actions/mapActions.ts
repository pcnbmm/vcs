"use server";

const LONGDO_MAP_KEY = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY;

export async function searchLocation(keyword: string) {
  if (!keyword) return null;

  try {
    // อัปเดต URL เป็น API ตัวล่าสุดที่ถูกต้อง
    const url = `https://api.longdo.com/mapsearch/json/search?key=${LONGDO_MAP_KEY}&keyword=${encodeURIComponent(keyword)}&limit=5`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Server Search Error:", error);
    return { error: true, message: "Server connection failed" };
  }
}

export async function suggestLocation(keyword: string) {
  if (!keyword || keyword.length < 2) return [];

  try {
    // อัปเดต URL เป็น API ตัวล่าสุดที่ถูกต้อง
    const url = `https://api.longdo.com/mapsearch/json/suggest?key=${LONGDO_MAP_KEY}&keyword=${encodeURIComponent(keyword)}&limit=20`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Server Suggest Error:", error);
    return [];
  }
}
