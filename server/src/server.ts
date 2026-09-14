import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { unclaimedParcelJob } from './jobs/unclaimed-parcel.job';

import { setSocketIO } from './utils/socketEmitter';

const server = http.createServer(app);

// Setup Socket.IO
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});
setSocketIO(io);

io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);

  socket.on('join_room', (room: string) => {
    socket.join(room);
    logger.debug(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
});

// Start scheduled jobs
unclaimedParcelJob.startSchedule();

// Start Server
const PORT = config.port || 5001;
server.listen(PORT, () => {
  logger.info(`CampusDrop Server running on http://localhost:${PORT}`);
  logger.info(`WebSocket Server active`);
  logger.info(`API endpoint: http://localhost:${PORT}/api`);
});

export default server;
