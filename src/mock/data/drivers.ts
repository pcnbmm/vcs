import { Driver } from '@/types';

export const mockDrivers: Driver[] = [
    {
        id: 'd0001',
        name: 'สมชาย ใจดี',
        licenseNumber: 'L123456789',
        phone: '0812345678',
        status: 'AVAILABLE',
    },
    {
        id: 'd0002',
        name: 'สมยศ อดทน',
        licenseNumber: 'L987654321',
        phone: '0898765432',
        status: 'BUSY',
    },
    {
        id: 'd0003',
        name: 'สมศรี ขับดี',
        licenseNumber: 'L555555555',
        phone: '0855555555',
        status: 'ON_LEAVE',
    },
];
