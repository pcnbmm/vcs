export function isBookingExpired(
  startDateTime: string | null | undefined,
  status: string | number,
  isRegional?: boolean,
): boolean {
  // เกินกำหนดแค่ตอนที่ยังเป็น PENDING ถ้า approve/reject หรือ จัดรถแล้ว(7) ไม่นับว่าเกินกำหนด
  const isPending = String(status) === "1" || status === "PENDING";
  const isDispatchedPending = String(status) === "7" || status === "DISPATCHED_PENDING";

  // คำขอส่วนภูมิภาคที่ยังรอการอนุมัติ (1) หรือจัดรถแล้วรออนุมัติ (7) → ไม่ expire เพื่อให้ผู้อนุมัติเข้าจัดการย้อนหลังได้
  if (isRegional && (isPending || isDispatchedPending)) return false;

  if (!isPending) return false;
  if (!startDateTime) return false;

  const deadline = new Date(startDateTime);
  const now = new Date();
  return deadline <= now;
}

