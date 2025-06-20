import { NextApiRequest, NextApiResponse } from 'next';
import { WebSocketServer } from 'ws';
import { getSales } from '@/lib/firestoreService';

// This is a special Next.js API route configuration
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.ws) {
    console.log('Setting up WebSocket server');
    const wss = new WebSocketServer({ noServer: true });
    
    wss.on('connection', (ws) => {
      console.log('New WebSocket connection');
      
      // Send initial data
      getSales().then(sales => {
        ws.send(JSON.stringify({ type: 'INITIAL_DATA', data: sales }));
      });
      
      ws.on('close', () => console.log('Client disconnected'));
    });
    
    res.socket.server.ws = wss;
    
    // Handle upgrade requests
    res.socket.server.on('upgrade', (req, socket, head) => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    });
  }
  
  res.end();
}