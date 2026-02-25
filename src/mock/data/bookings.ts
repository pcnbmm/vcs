// src/mock/data/bookings.ts
import { Booking } from '@/types';

export const mockBookings: Booking[] = [
    {
        id: 'REQ-2026-0001',
        requesterName: 'นาย สมชาย ใจดี',
        department: 'ฝ่ายการตลาด',
        objective: 'ประชุมร่วมกับลูกค้า',
        origin: 'สำนักงานใหญ่',
        destination: 'เซ็นทรัลเวิลด์',
        requestDate: '2026-02-10',
        startDateTime: '2026-02-12T09:00',
        endDateTime: '2026-02-12T16:00',   // ← วันเดียวกัน
        passengerCount: 3,
        status: 'PENDING',
    },
    {
        id: 'REQ-2026-0002',
        requesterName: 'นางสาว วิภา รักงาน',
        department: 'ฝ่ายบัญชี',
        objective: 'ยื่นเอกสารกรมสรรพากร',
        origin: 'สำนักงานใหญ่',
        destination: 'กรมสรรพากร',
        requestDate: '2026-02-10',
        startDateTime: '2026-02-13T08:30',
        endDateTime: '2026-02-13T12:00',   // ← วันเดียวกัน
        passengerCount: 1,
        status: 'PENDING',
    },
    {
        id: 'REQ-2026-0003',
        requesterName: 'นาย ประเสริฐ มุ่งมั่น',
        department: 'ฝ่าย IT',
        objective: 'ติดตั้งระบบสาขา',
        origin: 'สำนักงานใหญ่',
        destination: 'สาขาเชียงใหม่',
        requestDate: '2026-02-11',
        startDateTime: '2026-02-15T07:00',
        endDateTime: '2026-02-17T18:00',   // ← ข้ามวัน
        passengerCount: 2,
        status: 'APPROVED',
    },
    {
        id: 'REQ-2026-0004',
        requesterName: 'นางสาว ปิยะดา สุขสันต์',
        department: 'ฝ่ายบุคคล',
        objective: 'อบรมพนักงานใหม่',
        origin: 'สำนักงานใหญ่',
        destination: 'โรงแรมมิราเคิล',
        requestDate: '2026-02-11',
        startDateTime: '2026-02-14T08:00',
        endDateTime: '2026-02-14T17:00',   // ← วันเดียวกัน
        passengerCount: 5,
        status: 'REJECTED',
        rejectReason: 'รถไม่ว่างในช่วงเวลาดังกล่าว',
    },
    {
        id: 'REQ-2026-0005',
        requesterName: 'นาย ธนกร วิริยะ',
        department: 'ฝ่ายขาย',
        objective: 'เยี่ยมลูกค้าต่างจังหวัด',
        origin: 'สำนักงานใหญ่',
        destination: 'จังหวัดระยอง',
        requestDate: '2026-02-12',
        startDateTime: '2026-02-16T06:00',
        endDateTime: '2026-02-18T20:00',   // ← ข้ามวัน
        passengerCount: 4,
        status: 'PENDING',
    },
];