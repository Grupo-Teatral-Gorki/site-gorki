import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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
    const snap = await getDocs(collection(db, 'payments'));
    const payments: any[] = [];
    snap.forEach((doc) => {
      const d = doc.data() as any;
      payments.push({
        paymentId: d.paymentId,
        status: d.status,
        customerName: d.customerName,
        customerEmail: d.customerEmail,
        eventTitle: d.eventTitle,
        eventDate: d.eventDate,
        eventLocation: d.eventLocation,
        ticketQuantity: d.ticketQuantity,
        totalAmount: d.totalAmount,
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() || d.createdAt,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() || d.updatedAt,
      });
    });
    // sort newest first by createdAt if available
    payments.sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    return NextResponse.json({ payments }, { headers: corsHeaders });
  } catch (e: any) {
    console.error('Error listing payments', e);
    return NextResponse.json({ error: 'Failed to list payments' }, { status: 500, headers: corsHeaders });
  }
}
