import { loadStripe } from '@stripe/stripe-js';

// Make sure to add your Stripe publishable key to your environment variables
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log('🔍 Debugging Stripe configuration:');
console.log('- Environment variables available:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
console.log('- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY value:', publishableKey ? `${publishableKey.substring(0, 20)}...` : 'NOT FOUND');

if (!publishableKey) {
  console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
  console.log('📝 Please add your Stripe publishable key to .env.local file');
  console.log('📝 Make sure the variable name is exactly: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default stripePromise;
