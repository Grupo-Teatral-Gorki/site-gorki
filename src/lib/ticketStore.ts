// Simple file-based ticket store for development
// In production, you would use a proper database
import fs from 'fs';
import path from 'path';

const STORE_FILE = path.join(process.cwd(), 'tickets.json');

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

class FileTicketStore {
  private ensureStoreFile() {
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify({}));
    }
  }

  private readStore(): Record<string, TicketData> {
    try {
      this.ensureStoreFile();
      const data = fs.readFileSync(STORE_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading ticket store:', error);
      return {};
    }
  }

  private writeStore(data: Record<string, TicketData>) {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing ticket store:', error);
    }
  }

  async set(ticketId: string, ticketData: TicketData): Promise<void> {
    const store = this.readStore();
    store[ticketId] = ticketData;
    this.writeStore(store);
  }

  async get(ticketId: string): Promise<TicketData | undefined> {
    const store = this.readStore();
    return store[ticketId];
  }

  async getByPaymentId(paymentId: string): Promise<TicketData[]> {
    const store = this.readStore();
    return Object.values(store).filter(ticket => ticket.paymentId === paymentId);
  }

  async getAllPaymentIds(): Promise<string[]> {
    const store = this.readStore();
    return Object.values(store).map(ticket => ticket.paymentId);
  }

  async size(): Promise<number> {
    const store = this.readStore();
    return Object.keys(store).length;
  }
}

// Always use Firestore for both development and production
function createTicketStore() {
  console.log('Using Firestore storage');
  const { FirestoreTicketStore } = require('./firestore');
  return new FirestoreTicketStore();
}

export const ticketStore = createTicketStore();
export type { TicketData };
