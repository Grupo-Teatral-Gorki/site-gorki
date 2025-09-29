import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

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
    const q = query(collection(db, 'desventuras'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ items }, { headers: corsHeaders });
  } catch (e: any) {
    console.error('Error listing desventuras entries:', e);
    return NextResponse.json(
      { error: 'Failed to load desventuras entries', details: e?.message || 'unknown' },
      { status: 500, headers: corsHeaders }
    );
  }
}
