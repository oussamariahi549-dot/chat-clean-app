const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

let onlineUsers = 0;

io.on('connection', (socket) => {
    onlineUsers++;
    io.emit('updateUserCount', onlineUsers);

    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', {
            id: socket.id,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('typing', (isTyping) => {
        socket.broadcast.emit('typingStatus', { id: socket.id, isTyping });
    });

    socket.on('callUser', (data) => {
        socket.broadcast.emit('incomingCall', { from: socket.id, signal: data.signalData });
    });

    socket.on('answerCall', (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    });

    socket.on('endCall', () => {
        socket.broadcast.emit('callEnded');
    });

    socket.on('disconnect', () => {
        onlineUsers--;
        io.emit('updateUserCount', onlineUsers);
        socket.broadcast.emit('callEnded');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
