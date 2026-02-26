import { mockVehicles } from '@/mock/data/vehicles';

export default function DashboardPage() {
    return (
        <div className="p-8">
            <h1 className="text-gray-500 font-bold mb-6">VCS</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="border p-4 rounded-lg shadow-sm bg-white">
                        <h2 className="font-bold text-gray-500">{vehicle.model}</h2>
                        <p className="text-gray-500">ทะเบียน: {vehicle.plate}</p>
                        <p className="text-gray-500">ที่นั่ง: {vehicle.capacity}</p>
                        <div className={`mt-3 text-xs font-bold inline-block px-2 py-1 rounded ${vehicle.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                            vehicle.status === 'MAINTENANCE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {vehicle.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}