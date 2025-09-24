import { NextRequest, NextResponse } from 'next/server';

// Reuse same CORS policy
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Gorki123'; // fallback to same password used elsewhere

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId, password } = await request.json();

    if (!paymentId || !password) {
      return NextResponse.json({ error: 'paymentId and password are required' }, { status: 400, headers: corsHeaders });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Derive origin from the request URL
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;

    // Call our existing process-payment endpoint to ensure single logic path
    const res = await fetch(`${origin}/api/mercadopago/process-payment?paymentId=${encodeURIComponent(paymentId)}`);

    const data = await res.json();

    return NextResponse.json(data, { status: res.status, headers: corsHeaders });
  } catch (error) {
    console.error('Admin process-payment error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: corsHeaders });
  }
}
