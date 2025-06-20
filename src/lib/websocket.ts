import { WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: any) {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    
    wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
    
    server.on('upgrade', (request: any, socket: any, head: any) => {
      wss!.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit('connection', ws, request);
      });
    });
  }
  
  return wss;
}

export function getServer() {
  return wss;
}