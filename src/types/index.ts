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
    objective: string;
    destination: string;
    startDateTime: string;
    endDateTime: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_USE' | 'COMPLETED';
    vehicleId?: string;
    driverId?: string;
}

export interface Driver {
    id: string;
    name: string;
    licenseNumber: string;
    phone: string;
    status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
}