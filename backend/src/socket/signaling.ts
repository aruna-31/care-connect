import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

export const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    console.log('✅ Socket.io Initialized');

    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join Room (Appointment ID)
        socket.on('join-room', (roomId: string) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);

            // Notify others in room
            socket.to(roomId).emit('user-connected', socket.id);
        });

        // WebRTC Signaling
        socket.on('offer', (payload: { roomId: string, offer: any }) => {
            socket.to(payload.roomId).emit('offer', { offer: payload.offer, sender: socket.id });
        });

        socket.on('answer', (payload: { roomId: string, answer: any }) => {
            socket.to(payload.roomId).emit('answer', { answer: payload.answer, sender: socket.id });
        });

        socket.on('ice-candidate', (payload: { roomId: string, candidate: any }) => {
            socket.to(payload.roomId).emit('ice-candidate', payload.candidate);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};
