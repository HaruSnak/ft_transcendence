import { createServer } from "http";
import { Server, Socket } from "socket.io";

// On utilise any pour le message, pas d'import de shared
const httpServer = createServer();
const io = new Server<any>(httpServer, {
  cors: { origin: "*" },
});

const clients = new Map<String, Socket>();

io.on("connection", (socket) => {
  console.log("📡 Client connecté:", socket.id);
  clients.set(socket.id, socket);

  for (const clientSocket of clients.values()) {
    clientSocket.emit("user_list", Array.from(clients.keys()));
  }

  socket.on("message_frontend_to_backend", (msg: any) => {
    console.log("← message_frontend_to_backend:", msg);

    if (msg.to != '') {
      clients.get(msg.to)?.emit("message_backend_to_frontend", msg);
    }
    else {
      for (const clientSocket of clients.values()) {
        clientSocket.emit("message_backend_to_frontend", msg);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client déconnecté:", socket.id);
    clients.delete(socket.id);

    for (const clientSocket of clients.values()) {
      clientSocket.emit("user_list", Array.from(clients.keys()));
    }
  });
});

httpServer.listen(3000, () =>
  console.log("🚀 Stub WS listening on http://localhost:3000")
);
