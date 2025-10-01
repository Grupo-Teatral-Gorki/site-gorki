import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { items, generatedAt, title } = await req.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items must be an array' }, { status: 400, headers: corsHeaders });
    }

    // Try to load logo from public folder as data URL
    async function loadLogo(filename: string): Promise<string | null> {
      try {
        const filePath = path.join(process.cwd(), 'public', filename);
        const buf = await fs.readFile(filePath);
        const ext = path.extname(filename).replace('.', '') || 'png';
        return `data:image/${ext};base64,${buf.toString('base64')}`;
      } catch {
        return null;
      }
    }

    const logoDataUrl = await loadLogo('logo-mark-black.png');

    const html = buildHtml({ items, title: title || 'Desventuras – Relatório de Pagamentos', generatedAt: generatedAt || new Date().toLocaleString('pt-BR'), logoDataUrl });

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '14mm', right: '10mm', bottom: '14mm', left: '10mm' } });
    await browser.close();

    return new NextResponse(pdf, { headers: { ...corsHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="desventuras_relatorio.pdf"' } });
  } catch (e) {
    console.error('Error generating PDF report', e);
    return NextResponse.json({ error: 'failed to generate pdf' }, { status: 500, headers: corsHeaders });
  }
}

function esc(v: unknown): string { return (v == null ? '' : String(v)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function statusLabel(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return 'Aprovado';
  if (s === 'pending') return 'Pendente';
  if (s === 'rejected' || s === 'invalid') return 'Rejeitado';
  return status || '';
}

function buildHtml({ items, title, generatedAt, logoDataUrl }: { items: any[]; title: string; generatedAt: string; logoDataUrl?: string | null; }) {
  const rows = items.map((i) => `
    <tr>
      <td class="mono">${esc(i.paymentId)}</td>
      <td>${esc(i.name)}</td>
      <td>${esc(i.email || '')}</td>
      <td>${esc(i.eventTitle || i.eventId || '')}</td>
      <td class="num">${Number(i.quantity || 0)}</td>
      <td class="num">${Number(i.ticketInteiraQty || 0)}</td>
      <td class="num">${Number(i.ticketMeiaQty || 0)}</td>
      <td><span class="badge ${badgeClass(i.status)}">${statusLabel(i.status)}</span></td>
      <td>${esc(i.createdAt ? new Date(i.createdAt).toLocaleString('pt-BR') : '')}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
    .logo { text-align: center; margin-bottom: 6px; }
    .logo img { height: 36px; width: auto; }
    h1 { font-size: 18px; margin: 0 0 6px; }
    .muted { color: #6b7280; font-size: 12px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
    thead th { background: #f9fafb; font-weight: 700; position: sticky; top: 0; }
    tbody tr:nth-child(even) { background: #fcfcfd; }
    .num { text-align: right; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 10px; color: #374151; }
    .badge { padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 700; border: 1px solid; display: inline-block; }
    .badge.approved { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .badge.pending { background: #fef9c3; color: #854d0e; border-color: #fde68a; }
    .badge.rejected { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
    .badge.neutral { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }
  </style>
</head>
<body>
  <div class="logo">${logoDataUrl ? `<img src="${logoDataUrl}" alt="Gorki" />` : ''}</div>
  <h1>${esc(title)}</h1>
  <div class="muted">Gerado em ${esc(generatedAt)}</div>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Nome</th>
        <th>Email</th>
        <th>Evento</th>
        <th>Qtd Total</th>
        <th>Inteira</th>
        <th>Meia</th>
        <th>Status</th>
        <th>Criado em</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

function badgeClass(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return 'approved';
  if (s === 'pending') return 'pending';
  if (s === 'rejected' || s === 'invalid') return 'rejected';
  return 'neutral';
}
