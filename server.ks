const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const users = [
    { username: 'farah', password: 'opensmsm' },
    { username: 'taem', password: 'opensesame' }
];

io.on('connection', (socket) => {
    socket.on('login', ({ username, password }) => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            socket.emit('login-success', { username: user.username });
        } else {
            socket.emit('login-failure', { redirectLink: '/login-failure' }); // Specify the link to redirect to
        }
    });

    // Add other socket.io event handlers...

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

