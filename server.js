const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const activeUsers = new Map(); // To keep track of active users

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'chat.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the database.');
  }
});

// Create users table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
});

// Read users from JSON file and insert them into the database
fs.readFile(path.join(__dirname, 'users.json'), 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading users file:', err.message);
    return;
  }
  
  const users = JSON.parse(data);
  
  db.serialize(() => {
    const stmt = db.prepare(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`);
    users.forEach(user => {
      stmt.run(user.username, user.password);
    });
    stmt.finalize();
  });
});

// Create messages table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('A user connected');

  // Fetch old messages from the database and emit them to the client
  db.all('SELECT * FROM messages', (err, rows) => {
    if (err) {
      console.error('Error fetching messages:', err.message);
    } else {
      socket.emit('load messages', rows);
    }
  });

  // Send the list of active users
  const updateActiveUsers = () => {
    const users = Array.from(activeUsers.values());
    io.emit('update users', users);
  };

  // Authentication logic
  socket.on('login', ({ username, password }) => {
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
      if (err) {
        console.error('Error during login:', err.message);
        socket.emit('login-failure', { error: 'Internal server error' });
      } else if (row) {
        activeUsers.set(socket.id, { username: row.username, active: true });
        socket.emit('login-success', { username: row.username });
        updateActiveUsers();
      } else {
        socket.emit('login-failure', { error: 'Invalid username or password' });
      }
    });
  });

  // Message handling logic
  socket.on('chat message', (msg) => {
    // Save message to the database
    db.run('INSERT INTO messages (username, message) VALUES (?, ?)', [msg.username, msg.message], (err) => {
      if (err) {
        console.error('Error saving message:', err.message);
      } else {
        // Broadcast the message to all connected clients
        io.emit('chat message', { username: msg.username, message: msg.message, timestamp: new Date() });
      }
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    updateActiveUsers();
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

