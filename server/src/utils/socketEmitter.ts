/**
 * Safe Socket.IO event emitter utility
 * Avoids circular dependencies across services and controllers
 */
let socketIoInstance: any = null;

export function setSocketIO(io: any) {
  socketIoInstance = io;
}

export function getSocketIO() {
  return socketIoInstance;
}

export function emitSocketEvent(event: string, data: any) {
  if (socketIoInstance) {
    try {
      socketIoInstance.emit(event, data);
    } catch (err) {
      console.error('Socket event emission error:', err);
    }
  }
}
