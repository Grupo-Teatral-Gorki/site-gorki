import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new Response(null, { status: 200, headers: corsHeaders });
}

function getDb() {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const app = getApps().length === 0 ? initializeApp(firebaseConfig as any) : getApps()[0];
    return getFirestore(app);
}

export async function GET(req: NextRequest) {
    try {
        const db = getDb();

        // Query transactions ordered by creation date (newest first)
        const q = query(
            collection(db, 'transactions'),
            orderBy('createdAt', 'desc')
        );

        const snap = await getDocs(q);
        const transactions: any[] = [];

        snap.forEach((doc) => {
            const d = doc.data() as any;
            transactions.push({
                id: doc.id,
                transactionId: d.transactionId,
                status: d.status,
                customerName: d.customerName,
                customerEmail: d.customerEmail,
                customerPhone: d.customerPhone,
                eventId: d.eventId,
                eventTitle: d.eventTitle,
                eventDate: d.eventDate,
                eventLocation: d.eventLocation,
                ticketQuantity: d.ticketQuantity,
                ticketType: d.ticketType,
                ticketInteiraQty: d.ticketInteiraQty,
                ticketMeiaQty: d.ticketMeiaQty,
                totalAmount: d.totalAmount,
                paymentId: d.paymentId,
                externalReference: d.externalReference,
                preferenceId: d.preferenceId,
                paymentType: d.paymentType,
                transactionAmount: d.transactionAmount,
                dateApproved: d.dateApproved,
                statusDetail: d.statusDetail,
                createdAt: d.createdAt?.toDate?.()?.toISOString?.() || d.createdAt,
                updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() || d.updatedAt,
            });
        });

        return NextResponse.json({ transactions }, { headers: corsHeaders });
    } catch (e: any) {
        console.error('Error listing transactions', e);
        return NextResponse.json(
            { error: 'Failed to list transactions', details: e.message },
            { status: 500, headers: corsHeaders }
        );
    }
}
