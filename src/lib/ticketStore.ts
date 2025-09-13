import { FirestoreTicketStore } from './firestore';

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

// Always use Firestore for both development and production
function createTicketStore() {
  console.log('Using Firestore storage');
  return new FirestoreTicketStore();
}

export const ticketStore = createTicketStore();
export type { TicketData };
