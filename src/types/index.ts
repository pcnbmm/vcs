// src/types/index.ts

export interface Booking {
  id: string;
  requesterName: string;
  department: string;
  objective: string;
  origin: string;
  destination: string;
  requestDate: string;
  startDateTime: string;
  endDateTime: string;
  passengerCount: number;
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "IN_USE"
    | "COMPLETED"
    | "CANCELLED";
  rejectReason?: string;
  vehicleId?: string;
  driverId?: string;
  phone?: string;
  carType?: string;
  selfDrive?: string;
}
