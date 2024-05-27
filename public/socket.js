// socket.js

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Listen for 'load messages' event to load old messages
    socket.on('load messages', (messages) => {
        const messagesList = document.getElementById('messages');
        messages.forEach((msg) => {
            const item = document.createElement('li');
            item.textContent = `${msg.username}: ${msg.message}`;
            messagesList.appendChild(item);
        });
    });

    // Listen for 'login-success' event after successful login
    socket.on('login-success', ({ username }) => {
        console.log(`Login successful. Welcome, ${username}!`);
        // Optionally, hide login modal or redirect to chat page
    });

    // Listen for 'login-failure' event after failed login
    socket.on('login-failure', ({ error }) => {
        console.error('Login failed:', error);
        // Optionally, display error message to the user
    });

    // Listen for 'chat message' event to display new messages
    socket.on('chat message', (msg) => {
        const messagesList = document.getElementById('messages');
        const item = document.createElement('li');
        item.textContent = `${msg.username}: ${msg.message}`;
        messagesList.appendChild(item);
    });

    // Submit login form
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        socket.emit('login', { username, password });
    });

    // Submit message form
    const messageForm = document.getElementById('form');
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = document.getElementById('m').value;
        socket.emit('chat message', { username: 'YourUsername', message });
        document.getElementById('m').value = '';
    });
});

