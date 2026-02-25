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
}