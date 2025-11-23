import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
    try {
        const { paymentIds } = await req.json();

        if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
            return NextResponse.json(
                { error: 'paymentIds array is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        let deletedCount = 0;
        const errors: string[] = [];

        // Delete from payments collection
        for (const paymentId of paymentIds) {
            try {
                // Find and delete from payments collection
                const paymentsRef = collection(db, 'payments');
                const q = query(paymentsRef, where('paymentId', '==', paymentId));
                const snapshot = await getDocs(q);

                for (const docSnap of snapshot.docs) {
                    await deleteDoc(doc(db, 'payments', docSnap.id));
                    deletedCount++;
                }

                // Also delete from tickets collection if exists
                const ticketsRef = collection(db, 'tickets');
                const ticketsQuery = query(ticketsRef, where('paymentId', '==', paymentId));
                const ticketsSnapshot = await getDocs(ticketsQuery);

                for (const ticketDoc of ticketsSnapshot.docs) {
                    await deleteDoc(doc(db, 'tickets', ticketDoc.id));
                }

            } catch (error) {
                console.error(`Error deleting payment ${paymentId}:`, error);
                errors.push(`Failed to delete ${paymentId}`);
            }
        }

        return NextResponse.json(
            {
                success: true,
                deletedCount,
                errors: errors.length > 0 ? errors : undefined,
            },
            { headers: corsHeaders }
        );

    } catch (error) {
        console.error('Error in delete endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to delete payments' },
            { status: 500, headers: corsHeaders }
        );
    }
}
