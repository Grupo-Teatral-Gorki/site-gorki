import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
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
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');
    const db = getDb();

    let snap;
    if (paymentId) {
      const q = query(collection(db, 'tickets'), where('paymentId', '==', paymentId));
      snap = await getDocs(q);
    } else {
      snap = await getDocs(collection(db, 'tickets'));
    }

    const tickets: any[] = [];
    snap.forEach((doc) => {
      const d = doc.data() as any;
      tickets.push({
        ticketId: d.ticketId,
        ticketNumber: d.ticketNumber,
        paymentId: d.paymentId,
        customerName: d.customerName,
        eventTitle: d.eventTitle,
        eventDate: d.eventDate,
        eventLocation: d.eventLocation,
        ticketIndex: d.ticketIndex,
        totalTickets: d.totalTickets,
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() || d.createdAt,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() || d.updatedAt,
      });
    });
    tickets.sort((a, b) => (a.paymentId === b.paymentId ? a.ticketIndex - b.ticketIndex : (a.paymentId || '').localeCompare(b.paymentId || '')));
    return NextResponse.json({ tickets }, { headers: corsHeaders });
  } catch (e: any) {
    console.error('Error listing tickets', e);
    return NextResponse.json({ error: 'Failed to list tickets' }, { status: 500, headers: corsHeaders });
  }
}
