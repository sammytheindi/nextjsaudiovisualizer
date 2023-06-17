// pages/api/signaling.js
import { Server } from "ws";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (!res.socket.server.ws) {
    console.log("* Initializing WebSocket server");
    res.socket.server.ws = new Server({ server: res.socket.server });

    res.socket.server.ws.on("connection", (socket) => {
      socket.on("message", (message) => {
        res.socket.server.ws.clients.forEach((client) => {
          if (client !== socket && client.readyState === 1) {
            client.send(message);
          }
        });
      });
    });
  }

  res.end();
}
