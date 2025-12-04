import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            transactionId,
            status,
            paymentId,
            preferenceId,
            externalReference,
            additionalData
        } = body;

        if (!transactionId) {
            return NextResponse.json(
                { error: 'Transaction ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const db = getDb();

        // Find the transaction by transactionId
        const q = query(
            collection(db, 'transactions'),
            where('transactionId', '==', transactionId)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Update the first matching document
        const docRef = querySnapshot.docs[0].ref;
        const updateData: any = {
            updatedAt: Timestamp.fromDate(new Date()),
        };

        if (status) updateData.status = status;
        if (paymentId) updateData.paymentId = paymentId;
        if (preferenceId) updateData.preferenceId = preferenceId;
        if (externalReference) updateData.externalReference = externalReference;

        // Merge any additional data
        if (additionalData && typeof additionalData === 'object') {
            Object.assign(updateData, additionalData);
        }

        await updateDoc(docRef, updateData);

        console.log('✅ Transaction updated:', transactionId, 'Status:', status);

        return NextResponse.json({
            success: true,
            transactionId,
            updated: updateData
        }, { headers: corsHeaders });

    } catch (e: any) {
        console.error('Error updating transaction:', e);
        return NextResponse.json(
            { error: 'Failed to update transaction', details: e.message },
            { status: 500, headers: corsHeaders }
        );
    }
}
