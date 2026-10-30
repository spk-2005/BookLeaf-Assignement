/**
 * Server-Sent Events (SSE) Broadcaster
 * Keeps Author and Admin dashboards synchronized in real time with sub-second latency.
 */

class SSEService {
  constructor() {
    this.clients = new Set();
  }

  // Handle incoming SSE subscription
  subscribe(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      res,
      userId: req.user?.id || null,
      role: req.user?.role || null
    };

    this.clients.add(client);
    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId: client.id })}\n\n`);

    // Clean up on disconnect
    req.on('close', () => {
      this.clients.delete(client);
    });
  }

  // Broadcast an event to all connected clients (or targeted role)
  broadcast(eventType, payload) {
    const data = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
    for (const client of this.clients) {
      try {
        client.res.write(`data: ${data}\n\n`);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

export const sseService = new SSEService();
