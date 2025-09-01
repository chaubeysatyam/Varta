const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const {
  ensureKey,
  encryptJsonToFile,
  decryptJsonFromFile,
  encryptFileAtPath,
  streamDecryptedFile,
  isLikelyMediaFile,
  getContentTypeForName
} = require('./cryptoUtil');

const app = express();
const port = 4000;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './priuploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    cb(null, `${timestamp}_${randomNum}_${file.originalname}`);
  }
});

const upload = multer({ storage });

ensureKey();
app.use(express.json());
app.use(cookieParser());

// Basic hardening: block direct access to sensitive files when proxied by any web server
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  // Allow explicit API paths
  if (p === '/private.json' || p.startsWith('/priuploads/')) return next();
  // Block sensitive artifacts
  const blocked = [
    '/secret.key', '/server.js', '/priserver.js', '/cryptoutil.js',
  ];
  if (blocked.includes(p)) return res.status(404).end();
  if (p.endsWith('.key') || p.endsWith('.pem') || p.endsWith('.env')) return res.status(404).end();
  // Block direct JSON access except allowed API above
  if (p.endsWith('.json')) return res.status(404).end();
  next();
});

// Initialize JSON files if they don't exist (encrypted)
if (!fs.existsSync('priusers.json')) encryptJsonToFile('priusers.json', []);
if (!fs.existsSync('private.json')) encryptJsonToFile('private.json', []);

const onlineUsers = new Map(); // Store online users and their WebSocket connections
const typingUsers = new Map(); // Store users who are currently typing

app.post('/register', async (req, res) => {
  const users = decryptJsonFromFile('priusers.json', []);
  const { username, password } = req.body;
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ 
    username, 
    password: hashedPassword,
    profilePic: 'default-avatar.png'
  });
  encryptJsonToFile('priusers.json', users);
  res.json({ success: true });
});

app.post('/login', async (req, res) => {
  const users = decryptJsonFromFile('priusers.json', []);
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ success: true, username, profilePic: user.profilePic });
});

app.get('/users', (req, res) => {
  const users = decryptJsonFromFile('priusers.json', []);
  const usersWithStatus = users.map(u => ({
    username: u.username,
    profilePic: u.profilePic,
    online: onlineUsers.has(u.username)
  }));
  res.json(usersWithStatus);
});

app.post('/upload-profile-pic', upload.single('profilePic'), (req, res) => {
  const { username } = req.body;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Encrypt the uploaded file at rest
  try {
    const filePath = path.join(__dirname, 'priuploads', file.filename);
    encryptFileAtPath(filePath, filePath);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to encrypt file' });
  }

  const users = decryptJsonFromFile('priusers.json', []);
  const user = users.find(u => u.username === username);
  if (user) {
    user.profilePic = file.filename;
    encryptJsonToFile('priusers.json', users);
    res.json({ success: true, profilePic: file.filename });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  try {
    const filePath = path.join(__dirname, 'priuploads', file.filename);
    encryptFileAtPath(filePath, filePath);
    res.json({ success: true, filename: file.filename });
  } catch (e) {
    res.status(500).json({ error: 'Failed to encrypt upload' });
  }
});

// Serve decrypted media from storage
app.get('/priuploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'priuploads', filename);
  try {
    const contentType = getContentTypeForName(filename);
    streamDecryptedFile(filePath, res, contentType, filename);
  } catch (e) {
    // Fallback to raw file (legacy non-encrypted assets like default avatar)
    res.sendFile(filePath);
  }
});

// Serve decrypted private messages as JSON
app.get('/private.json', (req, res) => {
  const messages = decryptJsonFromFile('private.json', []);
  res.json(messages);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let username = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'login') {
        username = data.username;
        onlineUsers.set(username, ws);
        broadcastUserStatus();
    } else if (data.type === 'typing') {
        if (data.isTyping) {
            typingUsers.set(data.from, Date.now()); // Track who is typing
        } else {
            typingUsers.delete(data.from); // Remove typing status when not typing
        }
        broadcastTypingStatus(data.from, data.to); // Notify others about typing status
    } else if (data.type === 'message') {
        const messages = decryptJsonFromFile('private.json', []);
        messages.push({
            from: data.from,
            to: data.to,
            content: data.content,
            timestamp: new Date().toISOString(),
        });
        encryptJsonToFile('private.json', messages);
        
        // Remove typing status when message is sent
        typingUsers.delete(data.from);
        broadcastTypingStatus(data.from, data.to);

        // Broadcast message
        broadcastMessage(data);
    }
});


  ws.on('close', () => {
    if (username) {
      onlineUsers.delete(username);
      typingUsers.delete(username);
      broadcastUserStatus();
    }
  });
});

function broadcastUserStatus() {
  const users = decryptJsonFromFile('priusers.json', []);
  const usersWithStatus = users.map(u => ({
    username: u.username,
    profilePic: u.profilePic,
    online: onlineUsers.has(u.username)
  }));

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'userStatus',
        users: usersWithStatus
      }));
    }
  });
}

function broadcastTypingStatus(from, to) {
  const isTyping = typingUsers.has(from);
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'typing',
        from,
        to,
        isTyping
      }));
    }
  });
}

function broadcastMessage(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'message',
        message: data
      }));
    }
  });
}

function broadcastConversationDeleted(userA, userB) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'conversationDeleted',
        from: userA,
        to: userB
      }));
    }
  });
}

// Delete conversation and associated media between two users
app.post('/delete-conversation', (req, res) => {
  const { from, to } = req.body || {};
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to required' });
  }

  const allMessages = decryptJsonFromFile('private.json', []);
  const toDelete = [];
  const keep = [];
  for (const m of allMessages) {
    const isPair = (m.from === from && m.to === to) || (m.from === to && m.to === from);
    if (isPair) {
      toDelete.push(m);
    } else {
      keep.push(m);
    }
  }

  // Delete media files referenced by the conversation
  for (const m of toDelete) {
    if (typeof m.content === 'string' && isLikelyMediaFile(m.content)) {
      const p = path.join(__dirname, 'priuploads', m.content);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) {}
      }
    }
  }

  encryptJsonToFile('private.json', keep);
  // Notify connected clients in real-time
  try { broadcastConversationDeleted(from, to); } catch (e) {}
  return res.json({ success: true, deleted: toDelete.length });
});

// Serve only the public folder; do not expose repository root
app.use('/public', express.static(path.join(__dirname, 'public')));