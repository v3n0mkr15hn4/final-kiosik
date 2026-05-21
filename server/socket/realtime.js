import { Server } from 'socket.io';

export function createRealtimeServer(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
        .split(',')
        .map((value) => value.trim()),
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    socket.on('join:department', (departmentId) => {
      if (departmentId) socket.join(`department:${departmentId}`);
    });
    socket.on('join:kiosk', (kioskId) => {
      if (kioskId) socket.join(`kiosk:${kioskId}`);
    });
    socket.on('kiosk:heartbeat', (payload) => {
      io.emit('kiosk:heartbeat:update', {
        ...payload,
        timestamp: new Date().toISOString(),
      });
    });
    socket.on('workflow:update', (payload) => {
      if (payload?.departmentId) {
        io.to(`department:${payload.departmentId}`).emit('workflow:changed', payload);
      } else {
        io.emit('workflow:changed', payload);
      }
    });
    socket.on('security:alert', (payload) => {
      io.emit('security:alert', payload);
    });
  });

  app.locals.io = io;
  return io;
}

