# Firebase Configuration for Production

## Environment Variables Required

Add these environment variables to your production deployment:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

## Firestore Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Firestore Database

2. **Configure Firestore Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write access to tickets collection for server-side operations
       match /tickets/{ticketId} {
         allow read, write: if true; // In production, add proper authentication
       }
     }
   }
   ```

3. **Create Indexes** (Optional but recommended for performance)
   - Index on `paymentId` field
   - Index on `eventId` field
   - Composite index on `paymentId` and `ticketIndex`

## Production Deployment

The system automatically detects the environment:
- **Development**: Uses file-based storage (`tickets.json`)
- **Production**: Uses Firestore when `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is set

## Firestore Collection Structure

Collection: `tickets`

Document structure:
```typescript
{
  ticketId: string;           // Document ID
  ticketNumber: string;       // Human-readable ticket number
  eventId: string;           // Event identifier
  eventTitle: string;        // Event name
  eventDate: string;         // Event date
  eventLocation: string;     // Event venue
  customerName: string;      // Customer name
  customerEmail: string;     // Customer email
  paymentId: string;         // MercadoPago payment ID
  externalReference: string; // Payment reference
  ticketIndex: number;       // Ticket number in order
  totalTickets: number;      // Total tickets in order
  generatedAt: Timestamp;    // When ticket was created
  isValid: boolean;          // Ticket validity
  isUsed: boolean;          // Whether ticket was used
  usedAt: Timestamp | null; // When ticket was validated
  createdAt: Timestamp;     // Document creation time
  updatedAt: Timestamp;     // Last update time
}
```

## Security Considerations

1. **Firestore Rules**: Update rules to include proper authentication
2. **Environment Variables**: Keep Firebase config secure
3. **API Keys**: Use Firebase security rules instead of exposing sensitive operations
4. **Backup**: Enable Firestore backups for production data

## Migration from Development

When moving from development to production:
1. Set Firebase environment variables
2. Deploy with `NODE_ENV=production`
3. The system will automatically use Firestore
4. Existing file-based tickets won't be migrated automatically
