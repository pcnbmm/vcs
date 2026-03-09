'use server';

const LONGDO_MAP_KEY = '8292430c8689ff87e9f8d20a29cbd4f9';

export async function searchLocation(keyword: string) {
    if (!keyword) return null;

    try {
        // อัปเดต URL เป็น API ตัวล่าสุดที่ถูกต้อง
        const url = `https://api.longdo.com/mapsearch/json/search?key=${LONGDO_MAP_KEY}&keyword=${encodeURIComponent(keyword)}&limit=5`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Server Search Error:', error);
        return { error: true, message: 'Server connection failed' };
    }
}

export async function suggestLocation(keyword: string) {
    if (!keyword || keyword.length < 2) return [];

    try {
        // อัปเดต URL เป็น API ตัวล่าสุดที่ถูกต้อง
        const url = `https://api.longdo.com/mapsearch/json/suggest?key=${LONGDO_MAP_KEY}&keyword=${encodeURIComponent(keyword)}&limit=10`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Server Suggest Error:', error);
        return [];
    }
}

export async function getAddressFromLatLon(lat: number, lon: number) {
    if (!lat || !lon) return null;

    try {
        const url = `https://api.longdo.com/map/services/address?lat=${lat}&lon=${lon}&key=${LONGDO_MAP_KEY}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) throw new Error('Network response not ok');

        const data = await response.json();
        return data;
        // data usually contains: { aoi, road, district, subdistrict, province, postcode, country }
    } catch (error) {
        console.error('Server Reverse Geocode Error:', error);
        return null;
    }
}
