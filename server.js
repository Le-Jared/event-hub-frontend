import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

// Track active broadcasters and their rooms
const broadcasterRooms = new Map(); // roomId -> socketId

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // When a broadcaster starts streaming
  socket.on('start-broadcasting', (roomId) => {
    console.log(`Broadcaster ${socket.id} started in room ${roomId}`);
    broadcasterRooms.set(roomId, socket.id);
    socket.join(roomId);
  });

  // When a viewer checks if broadcaster exists
  socket.on('check-broadcaster', () => {
    socket.emit('broadcaster-exists', {
      exists: broadcasterRooms.size > 0,
      roomId: Array.from(broadcasterRooms.keys())[0]
    });
  });

  // When a viewer wants to join
  socket.on('viewer-join', (data) => {
    const roomId = typeof data === 'object' ? data.roomId : data;
    console.log(`Viewer ${socket.id} joining room ${roomId}`);
    socket.join(roomId);
    const broadcasterId = broadcasterRooms.get(roomId);
    if (broadcasterId) {
      console.log(`Found broadcaster ${broadcasterId} for room ${roomId}`);
      io.to(broadcasterId).emit('viewer-joined', { viewerId: socket.id });
    } else {
      console.log(`No broadcaster found for room ${roomId}`);
    }
  });

  // Handle WebRTC signaling
  socket.on('broadcaster-signal', ({ signal, viewerId }) => {
    io.to(viewerId).emit('broadcaster-signal', { signal });
  });


  socket.on('viewer-signal', ({ signal, roomId }) => {
    console.log(`Viewer ${socket.id} sending signal for room ${roomId}`);
    const broadcasterId = broadcasterRooms.get(roomId);
    if (broadcasterId) {
      io.to(broadcasterId).emit('viewer-signal', {
        signal,
        viewerId: socket.id
      });
    }
  });


  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove broadcaster if they disconnect
    for (const [roomId, broadcasterId] of broadcasterRooms.entries()) {
      if (broadcasterId === socket.id) {
        broadcasterRooms.delete(roomId);
        io.to(roomId).emit('broadcaster-left');
      }
    }
  });

  // When broadcaster stops streaming
  socket.on('stop-broadcasting', () => {
    for (const [roomId, broadcasterId] of broadcasterRooms.entries()) {
      if (broadcasterId === socket.id) {
        broadcasterRooms.delete(roomId);
        io.to(roomId).emit('broadcaster-left');
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
