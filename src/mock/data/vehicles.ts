// src/mock/data/vehicles.ts
import { Vehicle } from '@/types'; // 1. ต้อง Import ตัวแปรต้นแบบมาก่อน

export const mockVehicles: Vehicle[] = [ // 2. ต้องประกาศชื่อตัวแปร และระบุว่าเป็น Array ของ Vehicle
    {
        id: 'v0001',
        plate: 'กข 1234',
        brand: 'Toyota',
        model: 'Toyota Camry',
        type: 'Sedan',
        capacity: 5,
        status: 'AVAILABLE',
    },
    {
        id: 'v0002',
        plate: 'กข 1235',
        brand: 'Toyota',
        model: 'Toyota Commuter',
        type: 'Van',
        capacity: 12,
        status: 'BUSY',
    },
    {
        id: 'v0003',
        plate: 'กข 1236',
        brand: 'Porsche',
        model: 'Porsche 911 GT3 R',
        type: 'Racing',
        capacity: 2,
        status: 'MAINTENANCE',
    },
]; // 3. ปิดท้ายด้วย semicolonโ