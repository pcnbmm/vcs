export function isBookingExpired(
  startDateTime: string | null | undefined,
  status: string | number,
): boolean {
  // เกินกำหนดแค่ตอนที่ยังเป็น PENDING ถ้า approve/reject ไม่นับว่าเกินกำหนด
  const isPending = String(status) === "1" || status === "PENDING";
  if (!isPending) return false;
  if (!startDateTime) return false;

  const deadline = new Date(startDateTime);
  const now = new Date();
  return deadline <= now;
}
