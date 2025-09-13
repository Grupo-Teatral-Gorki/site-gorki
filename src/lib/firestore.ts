// Firestore-based ticket storage for production
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';

interface TicketData {
  ticketId: string;
  ticketNumber: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  customerName: string;
  customerEmail: string;
  paymentId: string;
  externalReference: string;
  ticketIndex: number;
  totalTickets: number;
  generatedAt: string;
  isValid: boolean;
  isUsed: boolean;
  usedAt?: string;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

interface PaymentData {
  paymentId: string;
  status: string;
  externalReference: string;
  merchantOrderId?: string;
  preferenceId?: string;
  paymentType?: string;
  customerName: string;
  customerEmail: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketQuantity: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

class FirestoreTicketStore {
  private ticketsCollection = 'tickets';
  private paymentsCollection = 'payments';

  async set(ticketId: string, ticketData: TicketData): Promise<void> {
    try {
      const ticketRef = doc(db, this.ticketsCollection, ticketId);
      
      // Convert date strings to Firestore Timestamps for better querying
      const firestoreData = {
        ...ticketData,
        generatedAt: Timestamp.fromDate(new Date(ticketData.generatedAt)),
        usedAt: ticketData.usedAt ? Timestamp.fromDate(new Date(ticketData.usedAt)) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(ticketRef, firestoreData, { merge: true });
      console.log(`Ticket ${ticketId} saved to Firestore`);
    } catch (error) {
      console.error('Error saving ticket to Firestore:', error);
      throw error;
    }
  }

  async get(ticketId: string): Promise<TicketData | undefined> {
    try {
      const ticketRef = doc(db, this.ticketsCollection, ticketId);
      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        return undefined;
      }

      const data = ticketSnap.data();
      
      // Convert Firestore Timestamps back to ISO strings
      return {
        ticketId: data.ticketId,
        ticketNumber: data.ticketNumber,
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        eventDate: data.eventDate,
        eventLocation: data.eventLocation,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        paymentId: data.paymentId,
        externalReference: data.externalReference,
        ticketIndex: data.ticketIndex,
        totalTickets: data.totalTickets,
        generatedAt: data.generatedAt?.toDate?.()?.toISOString() || data.generatedAt,
        isValid: data.isValid,
        isUsed: data.isUsed,
        usedAt: data.usedAt?.toDate?.()?.toISOString() || data.usedAt
      };
    } catch (error) {
      console.error('Error fetching ticket from Firestore:', error);
      throw error;
    }
  }

  async getByPaymentId(paymentId: string): Promise<TicketData[]> {
    try {
      const ticketsRef = collection(db, this.ticketsCollection);
      const q = query(
        ticketsRef, 
        where('paymentId', '==', paymentId)
        // Removed orderBy to avoid index requirement - we'll sort in memory
      );
      
      const querySnapshot = await getDocs(q);
      const tickets: TicketData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          ticketId: data.ticketId,
          ticketNumber: data.ticketNumber,
          eventId: data.eventId,
          eventTitle: data.eventTitle,
          eventDate: data.eventDate,
          eventLocation: data.eventLocation,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          paymentId: data.paymentId,
          externalReference: data.externalReference,
          ticketIndex: data.ticketIndex,
          totalTickets: data.totalTickets,
          generatedAt: data.generatedAt?.toDate?.()?.toISOString() || data.generatedAt,
          isValid: data.isValid,
          isUsed: data.isUsed,
          usedAt: data.usedAt?.toDate?.()?.toISOString() || data.usedAt
        });
      });

      // Sort tickets by ticketIndex in memory to avoid needing composite index
      tickets.sort((a, b) => a.ticketIndex - b.ticketIndex);

      return tickets;
    } catch (error) {
      console.error('Error fetching tickets by payment ID from Firestore:', error);
      throw error;
    }
  }

  async getAllPaymentIds(): Promise<string[]> {
    try {
      const ticketsRef = collection(db, this.ticketsCollection);
      const querySnapshot = await getDocs(ticketsRef);
      
      const paymentIds = new Set<string>();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        paymentIds.add(data.paymentId);
      });

      return Array.from(paymentIds);
    } catch (error) {
      console.error('Error fetching payment IDs from Firestore:', error);
      throw error;
    }
  }

  async size(): Promise<number> {
    try {
      const ticketsRef = collection(db, this.ticketsCollection);
      const querySnapshot = await getDocs(ticketsRef);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting ticket count from Firestore:', error);
      throw error;
    }
  }

  async markAsUsed(ticketId: string): Promise<void> {
    try {
      const ticketRef = doc(db, this.ticketsCollection, ticketId);
      await updateDoc(ticketRef, {
        isUsed: true,
        usedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`Ticket ${ticketId} marked as used in Firestore`);
    } catch (error) {
      console.error('Error marking ticket as used in Firestore:', error);
      throw error;
    }
  }

  // Payment management methods
  async savePayment(paymentData: PaymentData): Promise<void> {
    try {
      const paymentRef = doc(db, this.paymentsCollection, paymentData.paymentId);
      
      const firestoreData = {
        ...paymentData,
        createdAt: Timestamp.fromDate(new Date(paymentData.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(paymentData.updatedAt))
      };

      await setDoc(paymentRef, firestoreData, { merge: true });
      console.log(`Payment ${paymentData.paymentId} saved to Firestore`);
    } catch (error) {
      console.error('Error saving payment to Firestore:', error);
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<PaymentData | undefined> {
    try {
      const paymentRef = doc(db, this.paymentsCollection, paymentId);
      const paymentSnap = await getDoc(paymentRef);

      if (!paymentSnap.exists()) {
        return undefined;
      }

      const data = paymentSnap.data();
      return {
        paymentId: data.paymentId,
        status: data.status,
        externalReference: data.externalReference,
        merchantOrderId: data.merchantOrderId,
        preferenceId: data.preferenceId,
        paymentType: data.paymentType,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        eventDate: data.eventDate,
        eventLocation: data.eventLocation,
        ticketQuantity: data.ticketQuantity,
        totalAmount: data.totalAmount,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    } catch (error) {
      console.error('Error fetching payment from Firestore:', error);
      throw error;
    }
  }
}

export { FirestoreTicketStore, type TicketData, type PaymentData };
