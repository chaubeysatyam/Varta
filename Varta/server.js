const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const {
  ensureKey,
  encryptJsonToFile,
  decryptJsonFromFile,
  encryptFileAtPath,
  streamDecryptedFile,
  getContentTypeForName
} = require('./cryptoUtil');

const JWT_SECRET = 'my_sattu_seacrtkey1234567890'; // Change this to a secure secret

// Create uploads directory if it doesn't exist
if (!fs.existsSync('public/uploads')) {
  fs.mkdirSync('public/uploads', { recursive: true });
}
if (!fs.existsSync('public/uploads/profiles')) {
  fs.mkdirSync('public/uploads/profiles', { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = req.path === '/upload-profile' ? 'public/uploads/profiles' : 'public/uploads';
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate a random 5-digit number
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 10000 to 99999
    const timestamp = Date.now(); // Current timestamp
    const originalName = file.originalname.replace(/\s+/g, '_'); // Replace spaces with underscores

    // Create the new filename
    const newFilename = `${timestamp}_${randomNum}_${originalName}`;
    cb(null, newFilename);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (req.path === '/upload-profile') {
      const allowedTypes = /jpeg|jpg|png|webp|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      if (extname) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for profile pictures'));
      }
    } else {
      const allowedTypes = /jpeg|jpg|png|webp|ico|gif|apk|pdf|doc|docx|txt|mp3|wav|mp4|avi|zip|rar|tar|7z|csv|ppt|pptx|svg/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      if (extname) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    }
  }
});

ensureKey();
app.use(express.json());

// Load users and messages (encrypted JSON)
let users = [];
let messages = [];
users = decryptJsonFromFile('users.json', []);
messages = decryptJsonFromFile('messages.json', []);

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const filePath = path.join(__dirname, 'public', 'uploads', req.file.filename);
    encryptFileAtPath(filePath, filePath);
    res.json({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: `/uploads/${req.file.filename}`
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to encrypt uploaded file' });
  }
});

app.post('/upload-profile', upload.single('profile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userId = req.body.userId; // Get the userId from the request body
  const user = users.find(u => u.id === userId); // Find the user by ID

  if (user) {
    // Encrypt profile image at rest and update reference
    try {
      const filePath = path.join(__dirname, 'public', 'uploads', 'profiles', req.file.filename);
      encryptFileAtPath(filePath, filePath);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to encrypt profile image' });
    }
    user.profilePic = `/uploads/profiles/${req.file.filename}`;

    // Save the updated users array back to users.json (encrypted)
    encryptJsonToFile('users.json', users);

    // Respond with the new profile picture URL
    res.json({ success: true, profilePic: user.profilePic });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});


app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    profilePic: '/default-avatar.png',
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`
  };

  users.push(user);
  encryptJsonToFile('users.json', users);
  res.json({ success: true });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create a JWT token
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ 
    success: true, 
    token, // Return the token
    userId: user.id, 
    username: user.username,
    profilePic: user.profilePic,
    color: user.color
  });
});

// Use the authentication middleware for protected routes
app.get('/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (user) {
    res.json({ username: user.username, profilePic: user.profilePic });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});
// Existing code...
// ... (existing imports and setup)

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join', (userData) => {
    socket.username = userData.username;
    socket.userId = userData.id;
    socket.broadcast.emit('userJoined', userData);
    socket.emit('previousMessages', messages);
  
    // Get all users from users.json
    const allUsers = users.map(user => {
      const isOnline = Array.from(io.sockets.sockets.values()).some(s => s.userId === user.id);
      return {
        id: user.id,
        username: user.username,
        profilePic: user.profilePic,
        color: user.color,
        isOnline: isOnline // Indicates online status
      };
    });
  
    io.emit('allUsers', allUsers); // Emit all users to all clients
  });
  

  socket.on('typing', () => {
    // Emit typing event to other users, including the user's profile picture
    const user = users.find(u => u.id === socket.userId);
    if (user) {
      socket.broadcast.emit('typing', { username: socket.username, profilePic: user.profilePic });
    }
  });

  socket.on('stopTyping', () => {
    // Emit stop typing event to other users
    socket.broadcast.emit('stopTyping', { userId: socket.userId });
  });

  socket.on('message', (data) => {
    const user = users.find(u => u.id === data.userId);
    const message = {
      id: uuidv4(),
      userId: data.userId,
      username: data.username,
      content: data.content,
      timestamp: new Date().toISOString(),
      type: data.type || 'text',
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      profilePic: user?.profilePic,
      color: user?.color
    };

    messages.push(message);
    encryptJsonToFile('messages.json', messages);
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('userLeft', { username: socket.username, id: socket.userId });
  
      // Update online users list
      const onlineUsers = Array.from(io.sockets.sockets.values())
        .filter(s => s.username)
        .map(s => {
          const user = users.find(u => u.id === s.userId);
          return {
            id: s.userId,
            username: s.username,
            profilePic: user?.profilePic,
            color: user?.color,
            isOnline: true // Online users
          };
        });
      
      io.emit('onlineUsers', onlineUsers);
      // Emit updated list of all users
      const allUsers = users.map(user => {
        const isOnline = onlineUsers.some(u => u.id === user.id);
        return {
          id: user.id,
          username: user.username,
          profilePic: user.profilePic,
          color: user.color,
          isOnline: isOnline
        };
      });
      io.emit('allUsers', allUsers); // Send the updated list to all clients
    }
  });
  
});

// Decrypted media streaming routes
app.get('/uploads/profiles/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'public', 'uploads', 'profiles', filename);
  const contentType = getContentTypeForName(filename);
  streamDecryptedFile(filePath, res, contentType, filename);
});

app.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'public', 'uploads', filename);
  const contentType = getContentTypeForName(filename);
  streamDecryptedFile(filePath, res, contentType, filename);
});

// Keep static after custom routes so decrypt endpoints take precedence
app.use(express.static('public'));



const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
