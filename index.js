const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

let onlineUsers = 0;
let usersMap = {}; // لحفظ أسماء المتصلين

io.on('connection', (socket) => {
    onlineUsers++;
    io.emit('updateUserCount', onlineUsers);

    socket.on('registerUser', (username) => {
        usersMap[socket.id] = username;
    });

    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', {
            id: socket.id,
            sender: data.sender || 'مجهول',
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('typingStatus', { isTyping: data.isTyping, user: data.user });
    });

    // إرسال إشارة لتفعيل نغمة الرنين عند الجميع
    socket.on('playRingToAll', () => {
        socket.broadcast.emit('triggerRing');
    });

    socket.on('disconnect', () => {
        onlineUsers--;
        delete usersMap[socket.id];
        io.emit('updateUserCount', onlineUsers);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
