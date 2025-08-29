# Stripe Configuration Guide

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# Stripe Keys (get these from your Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

## Getting Your Stripe Keys

1. **Sign up for Stripe** at https://stripe.com
2. **Go to your Dashboard** → Developers → API Keys
3. **Copy your keys:**
   - **Publishable key** (starts with `pk_test_`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (starts with `sk_test_`) → `STRIPE_SECRET_KEY`

## PIX Payment Setup

For PIX payments in Brazil:

1. **Enable PIX** in your Stripe Dashboard
2. **Go to** Settings → Payment methods → PIX
3. **Enable PIX** for your account
4. **Configure** your business information for Brazilian compliance

## Testing

Use Stripe's test cards for testing:

- **Successful payment:** `4242 4242 4242 4242`
- **Declined payment:** `4000 0000 0000 0002`
- **PIX testing:** Use test mode PIX payments

## Important Notes

- Never commit your secret keys to version control
- Use test keys during development
- Switch to live keys only in production
- PIX payments require Brazilian business verification
