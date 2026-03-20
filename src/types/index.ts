// src/types/index.ts

export enum Role {
    USER = 'USER',
    APPROVER = 'APPROVER',
    DISPATCHER = 'DISPATCHER',
    ADMIN = 'ADMIN',
}

export interface Vehicle {
    id: string;
    plate: string;
    brand: string;
    model: string;
    type: string;
    capacity: number;
    status: 'AVAILABLE' | 'BUSY' | 'MAINTENANCE';
}

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
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_USE' | 'COMPLETED';
    rejectReason?: string;
    vehicleId?: string;
    driverId?: string;
    phone?: string;
    carType?: string;
    selfDrive?: string;
}

export interface Driver {
    id: string;
    name: string;
    licenseNumber: string;
    phone: string;
    status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
}

// 1. Roles ทั้ง 8 บทบาทตามหัวตาราง
export enum VcsRole {
  USER = 'USER',                             // 1. User
  APPROVER = 'APPROVER',                     // 2. Approver
  DISPATCHER = 'DISPATCHER',                 // 3. Dispatcher (นายเวร)
  ADMIN = 'ADMIN',                           // 4. Admin (ผู้ดูแล)
  EXECUTIVE = 'EXECUTIVE',                   // 5. ผู้บริหาร
  FLEET_OWNER_REGION = 'FLEET_OWNER_REGION', // 6. เจ้าของยานพาหนะแบบเขต
  ROLE_MANAGER = 'ROLE_MANAGER',             // 7. Manage roles
  VEHICLE_OWNER = 'VEHICLE_OWNER'            // 8. เจ้าของยานพาหนะ (เฉพาะหน่วยงาน)
}

// 2. เมนูและหน้าจอ (Menus/Pages) ตามคอลัมน์ซ้ายสุด
export enum VcsMenu {
  REQUEST = 'REQUEST',             // 1. ขอใช้รถ
  PENDING = 'PENDING',             // 2. ติดตามคำขอ
  APPROVAL = 'APPROVAL',           // 3. อนุมัติคำขอ
  DISPATCH = 'DISPATCH',           // 4. จัดรถและคนขับ
  RETURN = 'RETURN',               // 5. บันทึกการคืนรถ
  REPORTS = 'REPORTS',             // 6. รายงาน
  ASSIGN = 'ASSIGN',               // 7. จัดการสิทธิ์
  MASTER_DATA = 'MASTER_DATA'      // 8. ข้อมูลรถ/คนขับ
}