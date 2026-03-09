// src/app/(workspace)/approver-requests/page.tsx

import { getBookings } from '@/app/actions/bookingActions';
import ApproverRequestsClient from '@/components/features/approver/ApproverRequestsClient';

export default async function ApproverRequestsPage() {
    const bookings = await getBookings();
    return <ApproverRequestsClient bookings={bookings} />;
}