import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(_req: NextRequest) {
    try {
        // Load payments sorted by createdAt desc
        const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const payments = snapshot.docs.map((d) => {
            const data: any = d.data();
            let createdAt = data?.createdAt;
            let updatedAt = data?.updatedAt;
            if (createdAt && typeof createdAt?.toDate === 'function') {
                try { createdAt = createdAt.toDate().toISOString(); } catch { }
            } else if (createdAt && typeof createdAt?.seconds === 'number') {
                try { createdAt = new Date(createdAt.seconds * 1000).toISOString(); } catch { }
            }
            if (updatedAt && typeof updatedAt?.toDate === 'function') {
                try { updatedAt = updatedAt.toDate().toISOString(); } catch { }
            } else if (updatedAt && typeof updatedAt?.seconds === 'number') {
                try { updatedAt = new Date(updatedAt.seconds * 1000).toISOString(); } catch { }
            }
            return {
                id: data?.paymentId || d.id,
                paymentId: data?.paymentId || d.id,
                status: data?.status || '',
                name: data?.customerName || '',
                email: data?.customerEmail || '',
                eventId: data?.eventId || '',
                eventTitle: data?.eventTitle || '',
                eventDate: data?.eventDate || '',
                eventLocation: data?.eventLocation || '',
                quantity: Number(data?.ticketQuantity) || 0,
                ticketInteiraQty: Number(data?.ticketInteiraQty || 0),
                ticketMeiaQty: Number(data?.ticketMeiaQty || 0),
                totalAmount: Number(data?.totalAmount) || 0,
                createdAt,
                updatedAt,
            };
        })
            // Only A Casa Fechada payments (both sessions)
            .filter((p) => (p.eventId || '').toLowerCase().includes('casa-fechada'));

        return NextResponse.json({ items: payments }, { headers: corsHeaders });
    } catch (e: any) {
        console.error('Error listing casa-fechada entries:', e);
        return NextResponse.json(
            { error: 'Failed to load casa-fechada entries', details: e?.message || 'unknown' },
            { status: 500, headers: corsHeaders }
        );
    }
}
