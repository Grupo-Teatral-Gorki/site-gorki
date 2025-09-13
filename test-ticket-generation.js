// Test script to generate tickets for existing payment
const testTicketGeneration = async () => {
  const paymentId = "125499217237";
  
  const payload = {
    paymentId: paymentId,
    externalReference: `event-test-${Date.now()}`,
    customerInfo: {
      name: "Test Customer",
      email: "test@example.com"
    },
    eventInfo: {
      id: "test-event-1",
      title: "Evento de Teste",
      date: "2024-01-15 20:00",
      location: "Teatro Municipal"
    },
    ticketQuantity: 2
  };

  try {
    const response = await fetch('http://localhost:3000/api/tickets/manual-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Response:', result);
    
    if (result.success) {
      console.log(`✅ Successfully generated ${result.totalTickets} tickets`);
      console.log('Tickets:', result.tickets);
    } else {
      console.error('❌ Failed to generate tickets:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Run the test
testTicketGeneration();
