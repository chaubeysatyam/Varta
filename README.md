# 🚀 Varta - Advanced Private & Global Chat Application

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js">
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</div>



<p align="center">
  <img src="https://github.com/chaubeysatyam/Varta/blob/1e9c41ab7b5d195c32209d53fcf2d2852d9b670a/Varta/images/1.png" alt="Screenshot 1" width="420" />
  <img src="https://github.com/chaubeysatyam/Varta/blob/1e9c41ab7b5d195c32209d53fcf2d2852d9b670a/Varta/images/2.png" width="420" />
  <img src="https://github.com/chaubeysatyam/Varta/blob/1e9c41ab7b5d195c32209d53fcf2d2852d9b670a/Varta/images/3.png" width="420" />
</p>

<p align="center">
  <img src="https://github.com/chaubeysatyam/Varta/blob/1e9c41ab7b5d195c32209d53fcf2d2852d9b670a/Varta/images/4.png" alt="Screenshot 4" width="420" />
  <img src="https://github.com/chaubeysatyam/Varta/blob/1e9c41ab7b5d195c32209d53fcf2d2852d9b670a/Varta/images/5.png" alt="Screenshot 5" width="420" />
  <img src="https://github.com/chaubeysatyam/Varta/blob/1e9c41ab7b5d195c32209d53fcf2d2852d9b670a/Varta/images/7.png" alt="Screenshot 6" width="420" />
</p>

<p align="center">
  <em>A clean, modern, and powerful project — lightweight yet production ready.</em>
</p>

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Security Features](#security-features)
- [API Documentation](#api-documentation)
- [File Structure](#file-structure)


## 🌟 Overview

**Varta** is a  real-time chat application that combines the power of global group chat with secure private messaging. Built with modern web technologies and enterprise-grade encryption, it provides a seamless communication experience with advanced security features.

### Key Highlights
- 🔐 **End-to-End Encryption** - All messages and files are encrypted using AES-256-GCM
- 🌐 **Dual Chat System** - Global chat for group discussions + Private chat for one-on-one conversations
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- 🚀 **Real-time Communication** - Powered by Socket.io and WebSockets
- 📁 **File Sharing** - Support for images, videos, documents, and more
- 👤 **User Management** - Profile pictures, online status, and user authentication

## ✨ Features

### 🔐 Security Features
- **AES-256-GCM Encryption**: Military-grade encryption for all data at rest
- **JWT Authentication**: Secure token-based authentication system
- **Password Hashing**: bcryptjs for secure password storage
- **File Encryption**: All uploaded files are encrypted before storage
- **Secure Key Management**: Automatic encryption key generation and management

### 💬 Chat Features
- **Global Chat**: Real-time group messaging with all registered users
- **Private Chat**: Secure one-on-one conversations
- **Typing Indicators**: See when someone is typing in real-time
- **Online Status**: Live user presence indicators
- **Message History**: Persistent message storage with encryption
- **File Sharing**: Upload and share various file types
- **Image Preview**: Click to view images in full-screen modal
- **Message Timestamps**: Precise timing for all messages

### 📁 File Sharing
- **Supported Formats**:
  - **Images**: JPG, PNG, GIF, WebP, SVG, BMP, ICO
  - **Videos**: MP4, AVI, MOV, WebM
  - **Audio**: MP3, WAV, OGG
  - **Documents**: PDF, DOC, DOCX, TXT, CSV
  - **Presentations**: PPT, PPTX
  - **Archives**: ZIP, RAR, 7Z, TAR
  - **Apps**: APK files
- **File Size Limit**: 50MB per file
- **Encrypted Storage**: All files are encrypted before storage
- **Preview Support**: Image and video previews before sending

### 👤 User Management
- **User Registration**: Simple username/password registration
- **Profile Pictures**: Customizable profile pictures with encryption
- **User Colors**: Unique color coding for each user
- **Online Status**: Real-time online/offline indicators
- **User Search**: Search functionality in private chat
- **Session Management**: 30-day persistent login sessions

### 🎨 User Interface
- **Modern Design**: Clean, Discord-inspired interface
- **Responsive Layout**: Works on all screen sizes
- **Dark Theme**: Easy on the eyes with dark color scheme
- **Mobile Support**: Touch-friendly interface with swipe gestures
- **Sidebar Navigation**: Collapsible sidebar for better space usage
- **Modal Windows**: Full-screen image viewing
- **Smooth Animations**: Polished user experience

## 🚀 Installation

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)
- **Git** (for cloning the repository)

### Step 1: Clone the Repository
```bash
git clone https://github.com/chaubeysatyam/Varta.git
cd Varta
cd varta
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Install Dependencies For Private Chat
```bash
cd public/private
npm install
```

#### For Development (with auto-restart):
```bash
cd ..
cd ..
```

## 🚀 Start the Servers (VERY IMPORTANT)

> ⚠️ **YOU MUST RUN TWO SERVERS IN TWO DIFFERENT TERMINALS**

**Terminal 1 – Main Server**
```bash
node server.js
```

**Terminal 2 – Private Chat Server**
```bash
node priserver.js
```

✅ Keep both terminals running while you use the project.

---
### Step 4: Access the Application
- **Global Chat**: http://localhost:3000
- **Private Chat**: http://localhost:4000/public/private/index.html

## 🎯 Usage

### Getting Started
1. **Register**: Create a new account with username and password
2. **Login**: Use your credentials to access the chat
3. **Global Chat**: Join the main chat room to communicate with all users
4. **Private Chat**: Click on any user to start a private conversation

### Global Chat Features
- View all online users in the sidebar
- Send text messages and files
- See typing indicators from other users
- Upload and change your profile picture
- View message history

### Private Chat Features
- Select any user to start a private conversation
- Send encrypted messages and files
- Delete entire conversation history
- Search for users
- Real-time typing indicators

### File Sharing
1. Click the paperclip icon in the message input
2. Select your file (up to 50MB)
3. Preview the file before sending
4. Send the file - it will be encrypted and stored securely

## 🏗️ Architecture

### Backend Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   Global Chat   │    │  Private Chat   │
│   Server (3000) │    │  Server (4000)  │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌─────────────────┐
         │  Encryption     │
         │  Layer          │
         └─────────────────┘
                     │
         ┌─────────────────┐
         │  File Storage   │
         │  (Encrypted)    │
         └─────────────────┘
```

### Technology Stack
- **Backend**: Node.js, Express.js
- **Real-time**: Socket.io, WebSockets
- **Database**: JSON files with encryption
- **Authentication**: JWT, bcryptjs
- **Encryption**: Node.js crypto module (AES-256-GCM)
- **File Upload**: Multer
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## 🔒 Security Features

### Encryption Implementation
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Management**: Automatic key generation and storage
- **Data at Rest**: All JSON files and uploaded files are encrypted
- **Authentication**: JWT tokens with expiration
- **Password Security**: bcryptjs with salt rounds

### Security Measures
- **Input Validation**: All user inputs are validated and sanitized
- **File Type Restrictions**: Only allowed file types can be uploaded
- **Size Limits**: 50MB file size limit to prevent abuse
- **Secure Headers**: Proper content-type headers for file serving
- **Error Handling**: Secure error messages without sensitive information

## 📚 API Documentation

### Global Chat Server (Port 3000)

#### Authentication Endpoints
```http
POST /register
Content-Type: application/json
{
  "username": "string",
  "password": "string"
}
```

```http
POST /login
Content-Type: application/json
{
  "username": "string",
  "password": "string"
}
```

#### File Upload Endpoints
```http
POST /upload
Content-Type: multipart/form-data
file: [binary data]
```

```http
POST /upload-profile
Content-Type: multipart/form-data
profile: [image file]
userId: "string"
```

### Private Chat Server (Port 4000)

#### Authentication Endpoints
```http
POST /register
Content-Type: application/json
{
  "username": "string",
  "password": "string"
}
```

```http
POST /login
Content-Type: application/json
{
  "username": "string",
  "password": "string"
}
```

#### User Management
```http
GET /users
Returns: Array of users with online status
```

#### File Operations
```http
POST /upload
Content-Type: multipart/form-data
file: [binary data]
```

```http
POST /upload-profile-pic
Content-Type: multipart/form-data
profilePic: [image file]
username: "string"
```

#### Conversation Management
```http
POST /delete-conversation
Content-Type: application/json
{
  "from": "string",
  "to": "string"
}
```

## 📁 File Structure

```
Varta/
├── 📁 public/                    # Frontend files
│   ├── 📁 private/              # Private chat frontend
│   │   ├── index.html           # Private chat HTML
│   │   ├── script.js            # Private chat JavaScript
│   │   ├── pristyles.css        # Private chat styles
│   │   └── package.json         # Private chat dependencies
│   ├── index.html               # Global chat HTML
│   ├── app.js                   # Global chat JavaScript
│   ├── styles.css               # Global chat styles
│   ├── 📁 uploads/              # Encrypted file storage
│   └── 📁 profiles/             # Encrypted profile pictures
├── 📁 priuploads/               # Private chat file storage
├── server.js                    # Global chat server
├── priserver.js                 # Private chat server
├── cryptoUtil.js                # Encryption utilities
├── users.json                   # Encrypted user data
├── priusers.json                # Encrypted private chat users
├── messages.json                # Encrypted global messages
├── private.json                 # Encrypted private messages
├── package.json                 # Dependencies and scripts
├── secret.key                   # Encryption key (auto-generated)
└── README.md                    # This file
```


### Development
This project was developed with the assistance of:
- **🤖 AI Development Tools**: Advanced AI coding assistants for architecture, implementation, and code optimization
- **📺 YouTube Tutorials**: Comprehensive web development and Node.js tutorials for learning best practices and modern development techniques

### Technologies Used
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Socket.io**: Real-time communication
- **Multer**: File upload handling
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **Node.js Crypto**: Encryption implementation

### Learning Resources & Development Process
- **AI Coding Assistants**: Used for code generation, debugging, and architectural decisions
- **YouTube Learning**: Followed tutorials on Node.js, Express.js, Socket.io, and real-time applications
- **Online Documentation**: Referenced official documentation for all technologies used
- **Community Forums**: Stack Overflow and GitHub discussions for problem-solving

### Inspiration
- **Discord**: UI/UX design inspiration
- **WhatsApp**: Private messaging features
- **Slack**: Global chat functionality

## 🛠️ Development Journey

### How AI & YouTube Tutorials Helped Build Varta

This project showcases the power of combining AI assistance with educational content:

#### 🤖 AI Development Assistance
- **Code Generation**: AI helped generate boilerplate code and complex functions
- **Architecture Design**: Assisted in designing the dual-server architecture
- **Security Implementation**: Guided the implementation of AES-256-GCM encryption
- **Bug Fixing**: Helped identify and resolve issues in real-time communication
- **Documentation**: Assisted in creating comprehensive documentation

#### 📺 YouTube Tutorial Learning
- **Node.js Fundamentals**: Learning server-side JavaScript development
- **Express.js Framework**: Web application framework concepts
- **Socket.io Integration**: Understood real-time communication patterns
- **Authentication Systems**: JWT and bcryptjs implementation
- **File Upload Handling**:  Multer and file processing
- **Frontend Development**: Improving HTML, CSS, and JavaScript skills

#### 🎯 Key Learning Outcomes
- **Full-Stack Development**: Gained experience in both frontend and backend
- **Real-time Applications**:  WebSocket and Socket.io implementation
- **Security Best Practices**: Implemented encryption and secure authentication
- **Modern JavaScript**: Used ES6+ features and async/await patterns
- **Project Architecture**: Designed scalable and maintainable code structure


## 🆘 Support

If you encounter any issues or have questions:

## 📬 Contact

For any inquiries, feel free to reach out:  
**[chaubeysatyam449@gmail.com](mailto:chaubeysatyam449@gmail.com)**


## 🚀 Future Enhancements That Can Be Made

- [ ] Voice and video calling
- [ ] Message reactions and emojis
- [ ] Group chat creation
- [ ] Message search functionality
- [ ] Push notifications
- [ ] Mobile app development
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Message encryption keys per conversation
- [ ] Admin panel for user management
- [ ] Message backup and export

---

<div align="center">
  <p>Made with ❤️ and AI assistance and Youtube tutorials</p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>




