# MercadoPago Configuration Guide

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# MercadoPago Keys (get these from your MercadoPago Dashboard)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_public_key_here
MERCADOPAGO_ACCESS_TOKEN=your_access_token_here

# Base URL for webhooks and redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Getting Your MercadoPago Keys

1. **Sign up for MercadoPago** at https://www.mercadopago.com.br
2. **Go to your Dashboard** → Developers → Your integrations → Create application
3. **Copy your keys:**
   - **Public Key** → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
   - **Access Token** → `MERCADOPAGO_ACCESS_TOKEN`

## Payment Methods Available

MercadoPago supports:
- **Credit/Debit Cards** (Visa, Mastercard, Elo, etc.)
- **PIX** (Instant payment)
- **Boleto Bancário** (Bank slip)
- **Installments** (up to 12x)

## Testing

Use MercadoPago's test credentials for testing:
- Test cards are available in the MercadoPago documentation
- Use sandbox mode during development
- Switch to production keys only when ready for live payments

## Webhook Configuration

The webhook endpoint is configured at:
`/api/mercadopago/webhook`

Configure this URL in your MercadoPago dashboard under:
**Developers → Webhooks → Add webhook URL**

## Important Notes

- Never commit your access tokens to version control
- Use test credentials during development
- Configure webhooks for payment status updates
- MercadoPago handles PCI compliance automatically
