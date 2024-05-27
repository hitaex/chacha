document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const loginForm = document.getElementById('loginForm');
    const loginModal = document.getElementById('loginModal');
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const messageForm = document.getElementById('form');
    const messageInput = document.getElementById('m');
    const messagesList = document.getElementById('messages');
    const userList = document.getElementById('userList');
    let currentUsername = '';

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        socket.emit('login', {
            username: loginUsername.value,
            password: loginPassword.value
        });
    });

    socket.on('login-success', ({ username }) => {
        currentUsername = username;
        loginModal.style.display = 'none';
    });

    socket.on('login-failure', ({ error }) => {
        alert(error);
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput.value) {
            socket.emit('chat message', {
                username: currentUsername,
                message: messageInput.value
            });
            messageInput.value = '';
        }
    });

    socket.on('load messages', (messages) => {
        messages.forEach(({ username, message, timestamp }) => {
            const item = document.createElement('li');
            const time = new Date(timestamp).toLocaleTimeString();
            item.innerHTML = `<strong>${username}</strong> <span class="timestamp">${time}</span>: ${message}`;
            messagesList.appendChild(item);
        });
    });

    socket.on('chat message', ({ username, message, timestamp }) => {
        const item = document.createElement('li');
        const time = new Date(timestamp).toLocaleTimeString();
        item.innerHTML = `<strong>${username}</strong> <span class="timestamp">${time}</span>: ${message}`;
        messagesList.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('update users', (users) => {
        userList.innerHTML = '';
        users.forEach(({ username, active }) => {
            const item = document.createElement('li');
            const status = active ? 'active' : 'inactive';
            item.innerHTML = `<span class="dot ${status}"></span> ${username}`;
            userList.appendChild(item);
        });
    });
});

