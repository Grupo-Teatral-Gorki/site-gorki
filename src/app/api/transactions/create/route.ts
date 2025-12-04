import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { randomUUID } from 'crypto';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
            customerInfo,
            eventInfo,
            ticketQuantity,
            ticketType,
            ticketInteiraQty,
            ticketMeiaQty,
            totalAmount
        } = body;

        // Validate required fields
        if (!customerInfo?.name || !customerInfo?.email || !eventInfo?.id || !eventInfo?.title) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Generate a unique transaction ID
        const transactionId = randomUUID();
        const now = new Date();

        // Create transaction record
        const transactionData = {
            transactionId,
            status: 'aguardando_pagamento',
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone || '',
            eventId: eventInfo.id,
            eventTitle: eventInfo.title,
            eventDate: eventInfo.date,
            eventLocation: eventInfo.location,
            ticketQuantity: ticketQuantity || 1,
            ticketType: ticketType || 'inteira',
            ticketInteiraQty: ticketInteiraQty || 0,
            ticketMeiaQty: ticketMeiaQty || 0,
            totalAmount: totalAmount || 0,
            paymentId: null, // Will be updated when payment is processed
            externalReference: null, // Will be updated when preference is created
            preferenceId: null, // Will be updated when preference is created
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
        };

        const db = getDb();
        const docRef = await addDoc(collection(db, 'transactions'), transactionData);

        console.log('✅ Transaction created:', transactionId, 'Document ID:', docRef.id);

        return NextResponse.json({
            success: true,
            transactionId,
            documentId: docRef.id
        }, { headers: corsHeaders });

    } catch (e: any) {
        console.error('Error creating transaction:', e);
        return NextResponse.json(
            { error: 'Failed to create transaction', details: e.message },
            { status: 500, headers: corsHeaders }
        );
    }
}
