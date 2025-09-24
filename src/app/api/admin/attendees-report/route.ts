import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Gorki123';

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const password = url.searchParams.get('password');

    if (!password) {
      return NextResponse.json({ error: 'password is required' }, { status: 400, headers: corsHeaders });
    }
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Init Firebase (uses NEXT_PUBLIC_ keys)
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    // Fetch all tickets
    const ticketsRef = collection(db, 'tickets');
    const snap = await getDocs(ticketsRef);

    // Aggregate by event and customer name
    type Row = { eventTitle: string; eventDate: string; eventLocation: string; customerName: string; count: number };
    const map = new Map<string, Row>();

    snap.forEach((doc) => {
      const t: any = doc.data();
      const key = `${t.eventTitle}||${t.eventDate}||${t.eventLocation}||${t.customerName}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          eventTitle: t.eventTitle || '',
          eventDate: t.eventDate || '',
          eventLocation: t.eventLocation || '',
          customerName: t.customerName || '',
          count: 1,
        });
      }
    });

    // Build CSV
    const header = 'Evento,Data,Local,Nome,Quantidade\n';
    const rows = Array.from(map.values())
      .sort((a, b) => a.eventTitle.localeCompare(b.eventTitle) || a.customerName.localeCompare(b.customerName))
      .map((r) => [r.eventTitle, r.eventDate, r.eventLocation, r.customerName, r.count].map(csvEscape).join(','))
      .join('\n');

    const csv = header + rows + '\n';

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-participantes.csv"`,
      },
    });
  } catch (error) {
    console.error('attendees-report error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: corsHeaders });
  }
}

function csvEscape(value: any): string {
  const s = String(value ?? '').replace(/\r?\n|\r/g, ' ').trim();
  if (s.includes(',') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
