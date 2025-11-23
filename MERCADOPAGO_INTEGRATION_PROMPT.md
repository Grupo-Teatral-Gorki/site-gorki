# MercadoPago Integration Implementation Prompt

Use this prompt to replicate the complete MercadoPago payment integration with order processing, confirmation emails, and receipt generation.

---

## Overview

Implement a complete MercadoPago payment integration for product sales with the following features:
- Payment preference creation using MercadoPago REST API
- Webhook handling for payment notifications with signature validation
- Automatic order confirmation and processing upon payment approval
- PDF receipt/invoice generation with branded design
- Email delivery of order confirmation and receipts using Nodemailer
- Firebase Firestore for order and payment storage
- Payment status polling and real-time updates
- Support for multiple product types and quantities

---

## Tech Stack

**Framework:** Next.js 15+ (App Router)
**Language:** TypeScript
**Payment Gateway:** MercadoPago (REST API + React SDK)
**Database:** Firebase Firestore
**PDF Generation:** Puppeteer
**Email:** Nodemailer

---

## Required Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@mercadopago/sdk-react": "^1.0.3",
    "firebase": "^12.0.0",
    "nodemailer": "^7.0.5",
    "puppeteer": "^24.20.0"
  },
  "devDependencies": {
    "@types/nodemailer": "^7.0.1"
  }
}
```

---

## Environment Variables

Create these environment variables (both `.env.local` for development and production environment):

```bash
# MercadoPago Configuration
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_access_token
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_public_key

# Base URL Configuration
NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # Production URL
NEXT_PUBLIC_NGROK_URL=http://localhost:3000  # Development URL (or ngrok)

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

---

## File Structure

Create the following file structure:

```
src/
├── app/
│   ├── api/
│   │   ├── mercadopago/
│   │   │   ├── create-preference/
│   │   │   │   └── route.ts
│   │   │   ├── webhook/
│   │   │   │   └── route.ts
│   │   │   └── process-payment/
│   │   │       └── route.ts
│   │   └── orders/
│   │       ├── [paymentId]/
│   │       │   └── route.ts
│   │       ├── generate-receipt/
│   │       │   └── route.ts
│   │       └── send-email/
│   │           └── route.ts
│   └── payment-success/
│       └── page.tsx
├── components/
│   └── MercadoPagoPayment.tsx
└── lib/
    ├── firebase.ts
    ├── firestore.ts
    ├── orderStore.ts
    └── pdf/
        └── generateReceiptPdf.ts
```

---

## Implementation Details

### 1. Firebase Configuration (`src/lib/firebase.ts`)

```typescript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 2. Firestore Order Store (`src/lib/firestore.ts`)

Create a Firestore-based storage system with these key methods:
- `saveOrder(orderId, orderData)` - Save order to Firestore
- `getOrder(orderId)` - Retrieve single order
- `getOrderByPaymentId(paymentId)` - Get order by payment ID
- `updateOrderStatus(orderId, status)` - Update order fulfillment status
- `savePayment(paymentData)` - Save payment information
- `getPayment(paymentId)` - Retrieve payment information

**Key Features:**
- Convert date strings to Firestore Timestamps for better querying
- Handle both Timestamp and string date formats when reading
- Use two collections: `orders` and `payments`
- Include metadata: product details, quantities, customer info, shipping address

### 3. Order Store Abstraction (`src/lib/orderStore.ts`)

```typescript
import { FirestoreOrderStore } from './firestore';

interface OrderData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentId: string;
  externalReference: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

function createOrderStore() {
  console.log('Using Firestore storage');
  return new FirestoreOrderStore();
}

export const orderStore = createOrderStore();
export type { OrderData };
```

### 4. Create Payment Preference API (`src/app/api/mercadopago/create-preference/route.ts`)

**Key Implementation Points:**
- Use REST API approach (fetch) instead of SDK to avoid import issues
- Include CORS headers for all responses
- Implement OPTIONS handler for preflight requests
- Dynamic base URL detection (development vs production)
- Store comprehensive metadata in preference for webhook processing
- Include ticket type breakdown (inteira/meia quantities)

**Request Body:**
```typescript
{
  amount: number;
  customerInfo: { 
    name: string; 
    email: string; 
    phone?: string;
    shippingAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  shipping?: number;
  tax?: number;
}
```

**Response:**
```typescript
{
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}
```

**Critical Details:**
- Set `notification_url` to your webhook endpoint
- Set `back_urls` for success/failure/pending redirects
- Use `external_reference` for tracking (e.g., `order-${orderId}-${timestamp}`)
- Store ALL customer, product, and shipping data in `metadata` field
- Include each product as a separate item in the `items` array
- Calculate prices correctly including subtotal, shipping, and tax

### 5. Webhook Handler (`src/app/api/mercadopago/webhook/route.ts`)

**Key Implementation Points:**
- Validate webhook signature using HMAC SHA256
- Extract payment ID from query params (`data.id`) or request body
- Fetch full payment details from MercadoPago API
- Process orders only for `approved` payments
- Save payment data to Firestore first, then create order record
- Update order status to 'paid'
- Generate PDF receipt/invoice
- Send order confirmation email with PDF attachment

**Signature Validation:**
```typescript
function validateSignature(xSignature: string, xRequestId: string, dataID: string, body: string): boolean {
  // Extract ts and v1 from x-signature header
  // Create signed string: "id:{dataID};request-id:{xRequestId};ts:{ts};"
  // Generate HMAC SHA256 with webhook secret
  // Compare with v1 value
}
```

**Order Processing Flow:**
1. Extract metadata from payment info (customer, products, shipping)
2. Save payment to Firestore
3. Create order record:
   - Generate unique UUID as orderId
   - Create order number: `ORD-{timestamp}-{randomString}`
   - Extract product items from metadata
   - Calculate totals (subtotal, shipping, tax, total)
   - Set initial status to 'paid'
   - Save to Firestore
4. Generate PDF receipt/invoice with order details
5. Email receipt to customer

**Important:** Use dynamic imports for orderStore and crypto to avoid edge runtime issues:
```typescript
const { orderStore } = await import('@/lib/orderStore');
const { randomUUID } = await import('crypto');
```

### 6. MercadoPago Payment Component (`src/components/MercadoPagoPayment.tsx`)

**Key Features:**
- Initialize MercadoPago SDK with public key
- Two-step UI: payment button → MercadoPago Wallet
- Display event and pricing information
- Handle payment success/error callbacks
- Support for ticket type breakdown display

**Component Props:**
```typescript
interface MercadoPagoPaymentProps {
  amount: number;
  customerInfo: { 
    name: string; 
    email: string; 
    phone?: string;
    shippingAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  shipping?: number;
  tax?: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}
```

**Flow:**
1. User clicks "Pay" button
2. Call `/api/mercadopago/create-preference` to get preferenceId
3. Show MercadoPago Wallet component with preferenceId
4. User completes payment in MercadoPago modal
5. MercadoPago redirects to success page with payment info

### 7. Payment Success Page (`src/app/payment-success/page.tsx`)

**Key Features:**
- Extract payment info from URL query params
- Implement polling mechanism to check payment status
- Fetch order details when payment is approved
- Display order summary with product list
- Download receipt/invoice as PDF
- Show processing state while waiting for approval
- Handle rejected payments
- Display order tracking information

**URL Parameters:**
```
?payment_id=123456&status=approved&external_reference=order-123-1234567890
```

**Polling Implementation:**
- Poll every 5 seconds for up to 5 minutes
- Call `/api/mercadopago/process-payment?paymentId={id}`
- Stop polling when order is fetched or payment is rejected
- Show appropriate UI based on status (pending/approved/rejected)

**Order Display:**
- Show order number and status
- Display customer information
- List all products with quantities and prices
- Show subtotal, shipping, tax, and total
- Display shipping address if applicable
- Provide download option for receipt PDF
- Show estimated delivery information

### 8. PDF Receipt Generation (`src/lib/pdf/generateReceiptPdf.ts`)

**Key Features:**
- Use Puppeteer to generate PDF from HTML
- Professional invoice/receipt design
- Include company branding and logo
- Display order details, customer info, and itemized product list
- Calculate and show subtotal, shipping, tax, and total
- Include payment information and order number
- Add terms and conditions or return policy
- Load brand logo from public folder as base64 data URL

**Receipt Design Elements:**
- Clean, professional layout
- Company header with logo and contact info
- Order number and date prominently displayed
- Customer billing and shipping information
- Itemized product table with quantities and prices
- Clear breakdown of costs (subtotal, shipping, tax, total)
- Payment method and transaction ID
- Footer with thank you message and support contact

**PDF Configuration:**
```typescript
await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
});
```

### 9. Additional API Routes

**Get Order by Payment ID** (`src/app/api/orders/[paymentId]/route.ts`):
- Fetch order from Firestore using `orderStore.getOrderByPaymentId()`
- Return order details with all product information
- Handle 404 if no order found

**Generate Receipt PDF** (`src/app/api/orders/generate-receipt/route.ts`):
- Accept order data in request body
- Call `generateReceiptPdf()` function
- Return PDF as blob with proper content-type header

**Send Email** (`src/app/api/orders/send-email/route.ts`):
- Accept email and order data in request body
- Generate receipt PDF
- Send order confirmation email using Nodemailer with PDF attachment
- Include order summary in email body
- Use SMTP configuration from environment variables

**Process Payment** (`src/app/api/mercadopago/process-payment/route.ts`):
- Fetch payment status from MercadoPago API
- Trigger order creation if approved and not yet created
- Return current payment status
- Used by polling mechanism on success page

---

## Security Considerations

1. **Webhook Signature Validation:**
   - Always validate webhook signatures in production
   - Use HMAC SHA256 with webhook secret
   - Reject requests with invalid signatures

2. **Environment Variables:**
   - Never expose access tokens in client-side code
   - Use `NEXT_PUBLIC_` prefix only for public keys
   - Store sensitive keys server-side only

3. **CORS Headers:**
   - Configure appropriate CORS headers for API routes
   - Restrict origins in production if needed

4. **Payment Verification:**
   - Always fetch payment details from MercadoPago API
   - Don't trust client-side payment status
   - Verify payment amount matches expected amount

---

## Testing Checklist

- [ ] Test with MercadoPago sandbox credentials
- [ ] Verify webhook receives notifications
- [ ] Check order creation for approved payments
- [ ] Test email delivery with valid SMTP credentials
- [ ] Verify PDF receipt generation with correct branding
- [ ] Check payment status polling on success page
- [ ] Test with multiple products and quantities
- [ ] Verify Firestore data storage for orders and payments
- [ ] Test error handling for rejected payments
- [ ] Check mobile responsiveness of payment UI
- [ ] Test with different payment methods (PIX, credit card, boleto)
- [ ] Verify shipping address capture and storage
- [ ] Test order status updates
- [ ] Verify price calculations (subtotal, shipping, tax, total)

---

## Production Deployment

1. **Environment Setup:**
   - Set all production environment variables
   - Use production MercadoPago credentials
   - Configure production domain in `NEXT_PUBLIC_BASE_URL`

2. **Webhook Configuration:**
   - Register webhook URL in MercadoPago dashboard
   - Ensure webhook endpoint is publicly accessible
   - Test webhook delivery in production

3. **Firebase Setup:**
   - Create production Firebase project
   - Set up Firestore collections: `orders`, `payments`
   - Configure security rules for Firestore
   - Set up indexes if needed (though code avoids composite indexes)
   - Consider adding `products` collection for inventory management

4. **Email Configuration:**
   - Use production SMTP credentials
   - Test email delivery from production server
   - Configure SPF/DKIM records for better deliverability

5. **Monitoring:**
   - Monitor webhook logs for errors
   - Track payment success/failure rates
   - Monitor order creation success
   - Set up alerts for failed emails
   - Track order fulfillment status
   - Monitor inventory levels if applicable

---

## Common Issues and Solutions

**Issue:** Webhook not receiving notifications
- **Solution:** Ensure webhook URL is publicly accessible, check MercadoPago dashboard for webhook status

**Issue:** Orders not creating after payment
- **Solution:** Check webhook logs, verify Firebase credentials, ensure payment status is "approved", verify metadata is properly stored

**Issue:** PDF generation fails
- **Solution:** Ensure Puppeteer is installed correctly, check for missing dependencies in production environment

**Issue:** Emails not sending
- **Solution:** Verify SMTP credentials, check firewall rules, ensure port 587 is open

**Issue:** CORS errors on API calls
- **Solution:** Ensure CORS headers are set in all API routes, add OPTIONS handler

**Issue:** Signature validation fails
- **Solution:** Verify webhook secret matches MercadoPago dashboard, check signature parsing logic

---

## Key Differences from Standard Implementations

1. **REST API vs SDK:** Uses fetch() for MercadoPago API calls instead of SDK to avoid import issues
2. **Dynamic Imports:** Uses dynamic imports for server-side modules to avoid edge runtime issues
3. **Polling Mechanism:** Implements client-side polling for payment status instead of relying solely on webhooks
4. **Dual Storage:** Saves both payment and order data separately in Firestore
5. **Multi-Product Support:** Built-in support for multiple products with individual quantities and prices
6. **PDF Generation:** Custom branded receipt/invoice generation using Puppeteer instead of generic templates
7. **Comprehensive Metadata:** Stores complete order details in payment metadata for reliable order reconstruction

---

## Implementation Steps

1. Install all required dependencies
2. Set up Firebase project and configure environment variables
3. Create Firebase configuration files
4. Implement Firestore order store with all methods
5. Create MercadoPago API routes (create-preference, webhook, process-payment)
6. Implement PDF receipt generation function
7. Create MercadoPago payment component
8. Build payment success page with polling
9. Add order API routes (fetch, generate receipt, send email)
10. Test end-to-end flow in sandbox environment
11. Configure production environment and deploy
12. Register webhook in MercadoPago dashboard
13. Test production payment flow

---

## Notes

- This implementation is production-tested and handles edge cases like PIX/Boleto delayed confirmations
- The polling mechanism ensures orders appear even if webhook is delayed
- Metadata in payment preference is crucial for order creation - include all necessary data (customer info, products, shipping)
- Store complete product details in metadata to reconstruct orders accurately
- PDF receipts are designed to be professional invoices suitable for printing or digital storage
- Email delivery happens automatically after payment approval via webhook
- Consider implementing inventory management to track product stock levels
- Order status can be updated separately for fulfillment tracking (processing, shipped, delivered)
