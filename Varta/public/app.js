let currentUser = null;
const socket = io();

// DOM Elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-text');
const messagesDiv = document.getElementById('messages');
const switchToRegisterBtn = document.getElementById('switch-to-register');
const fileInput = document.getElementById('file-upload');
const filePreview = document.getElementById('file-preview');
const profilePic = document.getElementById('profile-pic');
const profileUpload = document.getElementById('profile-upload');
const profileUsername = document.getElementById('profile-username');
const usersList = document.getElementById('users-list');

//for logout
document.getElementById('logout-button').addEventListener('click', function() {
  // Perform any cleanup, such as clearing user data
  // For example, clear local storage or session storage if used
  localStorage.removeItem('token'); // Assuming you store JWT in localStorage

  // Hide chat container and show auth container
  document.getElementById('chat-container').classList.add('hidden');
  document.getElementById('auth-container').classList.remove('hidden');

  // Optionally, reset any UI elements
  document.getElementById('profile-username').innerText = '';
  document.getElementById('profile-pic').src = '/default-avatar.png';
  document.getElementById('users-list').innerHTML = '';
  document.getElementById('messages').innerHTML = '';


});


//for registration

let isRegistering = false;
let currentFile = null;

// Check for token and user data on page load
const token = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
if (token && storedUser) {
  const userInfo = JSON.parse(atob(token.split('.')[1]));
  const userId = userInfo.id;
  const userData = JSON.parse(storedUser);
  currentUser = {
    id: userId,
    username: userData.username,
    profilePic: userData.profilePic || '/default-avatar.png',
    color: userData.color
  };
  
  profilePic.src = currentUser.profilePic;
  profileUsername.textContent = currentUser.username;
  authContainer.classList.add('hidden');
  chatContainer.classList.remove('hidden');
  socket.emit('join', currentUser);
}

// Profile picture click handler
profilePic.addEventListener('click', () => {
  profileUpload.click();
});


profileUpload.addEventListener('change', async () => {
  const file = profileUpload.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('profile', file);
    formData.append('userId', currentUser.id); // Ensure to send userId

    try {
      const response = await fetch('/upload-profile', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        // Update the user's profile picture in the currentUser object
        currentUser.profilePic = data.profilePic; // Use the new profile picture URL
        profilePic.src = currentUser.profilePic; // Update the displayed profile picture
        localStorage.setItem('user', JSON.stringify(currentUser)); // Update local storage
        updateUsersList(users); // Optionally update user list if needed
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
     
    }
  }
});

switchToRegisterBtn.addEventListener('click', () => {
  isRegistering = !isRegistering;
  switchToRegisterBtn.textContent = isRegistering ? 'Already have an account?' : 'Need an account?';
  loginForm.querySelector('button[type="submit"]').textContent = isRegistering ? 'Register' : 'Login';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(isRegistering ? '/register' : '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      if (!isRegistering) {
        currentUser = {
          id: data.userId,
          username: data.username,
          profilePic: data.profilePic || '/default-avatar.png',
          color: data.color
        };
        profilePic.src = currentUser.profilePic;
        profileUsername.textContent = currentUser.username;
        authContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        socket.emit('join', currentUser);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } else {
        isRegistering = false;
        switchToRegisterBtn.textContent = 'Need an account?';
        loginForm.querySelector('button[type="submit"]').textContent = 'Login';
        alert('Registration successful! Please login.');
      }
    } else {
      alert(data.error);
    }
  } catch (err) {
    alert('An error occurred. Please try again.');
  }
});
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    currentFile = file;
    
    const fileURL = URL.createObjectURL(file);
    const fileType = file.type.split('/')[0]; 
    let previewContent = '';

    if (fileType === 'image') {
      previewContent = `
        <div class="file-preview">
          <img src="${fileURL}" alt="${file.name}" class="file-image" />
          <span class="file-name">${file.name}</span>
          <button onclick="removeFile()">×</button>
        </div>
      `;
    } else if (fileType === 'video') {
      previewContent = `
        <div class="file-preview">
          <video src="${fileURL}" class="file-video" controls></video>
          <span class="file-name">${file.name}</span>
          <button onclick="removeFile()">×</button>
        </div>
      `;
    } else if (fileType === 'audio') {
      previewContent = `
        <div class="file-preview">
          <audio src="${fileURL}" class="file-audio" controls></audio>
          <span class="file-name">${file.name}</span>
          <button onclick="removeFile()">×</button>
        </div>
      `;
    } else {
      const icon = '📁'; 
      previewContent = `
        <div class="file-preview">
          <span class="file-icon">${icon}</span>
          <span class="file-name">${file.name}</span>
          <button onclick="removeFile()">×</button>
        </div>
      `;
    }

    filePreview.innerHTML = previewContent;
    filePreview.classList.remove('hidden');
  }
});


function removeFile() {
  currentFile = null;
  fileInput.value = '';
  filePreview.innerHTML = '';
  filePreview.classList.add('hidden');
}

async function uploadFile() {
  if (!currentFile) return null;

  const formData = new FormData();
  formData.append('file', currentFile);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error uploading file:', err);
    return null;
  }
}

messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = messageInput.value.trim();
  
  if ((!content && !currentFile) || !currentUser) return;

  let fileData = null;
  if (currentFile) {
    fileData = await uploadFile();
    if (!fileData) {
      alert('Failed to upload file');
      return;
    }
  }

  const messageData = {
    userId: currentUser.id,
    username: currentUser.username,
    content,
    type: fileData ? 'file' : 'text',
    fileUrl: fileData?.path,
    fileName: fileData?.originalname,
    profilePic: currentUser.profilePic,
    color: currentUser.color
  };

  socket.emit('message', messageData);
  messageInput.value = '';
  removeFile();
});

socket.on('previousMessages', (messages) => {
  messagesDiv.innerHTML = '';
  messages.forEach(addMessage);
  scrollToBottom();
});

socket.on('message', (message) => {
  addMessage(message);
  scrollToBottom();
});

socket.on('userJoined', (userData) => {
  addSystemMessage(`${userData.username} joined the chat`);
  updateOnlineUsers();
});

socket.on('userLeft', (userData) => {
  addSystemMessage(`${userData.username} left the chat`);
  updateOnlineUsers();
});

socket.on('onlineUsers', (users) => {
  updateUsersList(users);
});


socket.on('allUsers', (allUsers) => {
  updateUsersList(allUsers); // This will show users excluding the current user
});


function updateUsersList(users) {
  usersList.innerHTML = users.map(user => `
    <div class="user-list-item" style="border-left: 3px solid ${user.color}">
      <a href="http://localhost:4000/public/private/index.html">
        <img src="${user.profilePic || '/default-avatar.png'}" alt="${user.username}" class="profile-pic" data-username="${user.username}">
      </a>
      <span>${user.username}</span>
      <span class="user-status" style="background-color: ${user.isOnline ? '#66ff99' : '#ff6666'};"></span>
    </div>
  `).join('');

  // Update the online count
  document.querySelector('.online-count').textContent = `${users.filter(u => u.isOnline).length} online`;
}

socket.on('allUsers', (users) => {
  updateUsersList(users); // Update the displayed users list with the new data
});

// Function to update a user's profile picture
function updateProfilePic(username, newProfilePic) {
  const userItem = document.querySelector(`.user-list-item img[data-username="${username}"]`);
  if (userItem) {
    userItem.src = newProfilePic || '/default-avatar.png'; // Update the image source
  }
}

// Call this function when updating the list of online users
function updateOnlineUsers() {
  socket.emit('requestAllUsers'); // Request the updated list of all users
}




function addMessage(message) {
  const messageDiv = document.createElement('div');
  const isSentMessage = message.userId === currentUser?.id;
  messageDiv.className = `message ${isSentMessage ? 'sent' : 'received'}`;
  
  const timestamp = new Date(message.timestamp).toLocaleTimeString();
  
  let content = '';
  if (message.type === 'file') {
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(message.fileName);
    const isVideo = /\.(mp4|webm|ogg)$/i.test(message.fileName);
    const isAudio = /\.(mp3|wav|ogg)$/i.test(message.fileName);
    
    if (isImage) {
      content = `
        <img src="${message.fileUrl}" alt="${message.fileName}" class="clickable-image" onclick="openModal('${message.fileUrl}')">
      `;
    } else if (isVideo) {
      content = `
        <video controls width="300">
          <source src="${message.fileUrl}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
    } else if (isAudio) {
      content = `
        <audio controls>
          <source src="${message.fileUrl}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
      `;
    } else {
      content = `<div class="file-attachment">
          <a href="${message.fileUrl}" target="_blank">
            📎 ${message.fileName}
          </a>
        </div>`;
    }
  }

  messageDiv.innerHTML = `
  <img src="${message.profilePic || '/default-avatar.png'}" alt="${message.username}" class="profile-pic clickable-image" onclick="openModal('${message.profilePic || '/default-avatar.png'}')">
  <div class="message-content">
    ${!isSentMessage ? `<span class="username" style="color:${message.color || '#ffffff'}">${message.username}</span>` : ''}
    ${message.content ? `<div class="content">${escapeHtml(message.content)}</div>` : ''}
    ${content}
    <span class="timestamp">${timestamp}</span>
  </div>
`;

  
  messagesDiv.appendChild(messageDiv);
}

function openModal(imageUrl) {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  modal.style.display = 'flex';
  modalImg.src = imageUrl;
}

function closeModal() {
  const modal = document.getElementById('image-modal');
  modal.style.display = 'none';
}




function addSystemMessage(content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'system-message';
  messageDiv.textContent = content;
  messagesDiv.appendChild(messageDiv);
  scrollToBottom();
}

function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
// Typing animation
let typingTimeout;
messageInput.addEventListener('input', () => {
  if (!typingTimeout) {
    socket.emit('typing'); // Emit typing event
  }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stopTyping'); // Emit stop typing event
    typingTimeout = null;
  }, 500);
});

// Listening for typing events
socket.on('typing', ({ username, profilePic }) => {
  const typingIndicator = document.getElementById('typing-indicator');
  const typingUsername = document.getElementById('typing-username');
  const typingProfilePic = document.getElementById('typing-profile-pic');

  typingUsername.textContent = username;
  typingProfilePic.src = profilePic; // Update with the profile picture of the user who is typing
  typingIndicator.classList.add('show'); // Show the typing indicator
});

socket.on('stopTyping', () => {
  const typingIndicator = document.getElementById('typing-indicator');
  typingIndicator.classList.remove('show'); // Hide the typing indicator
});


let sidebarOpen = false;

// Function to toggle sidebar
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('open');
  sidebarOpen = !sidebarOpen;
}

// Event listener for the toggle button
document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);

// Swipe detection
let touchstartX = 0;
let touchendX = 0;

const gestureZone = document.getElementById('chat-container'); // Or a larger area

gestureZone.addEventListener('touchstart', (event) => {
  touchstartX = event.changedTouches[0].screenX;
});

gestureZone.addEventListener('touchend', (event) => {
  touchendX = event.changedTouches[0].screenX;
  handleGesture();
});

function handleGesture() {
  if (touchendX < touchstartX - 50) {
    // Swipe left to right
    toggleSidebar();
  }
}

// Function to close the sidebar
function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.remove('open');
  sidebarOpen = false;
}

// Event listener for clicks outside the sidebar
document.addEventListener('click', (event) => {
  const sidebar = document.querySelector('.sidebar');
  const toggleButton = document.getElementById('toggle-sidebar');
  
  // Check if the sidebar is open and the click was outside of it and the toggle button
  if (sidebarOpen && !sidebar.contains(event.target) && !toggleButton.contains(event.target)) {
    closeSidebar();
  }
});

// Include the existing swipe detection and toggle functionality

gestureZone.addEventListener('touchstart', (event) => {
  touchstartX = event.changedTouches[0].screenX;
});

gestureZone.addEventListener('touchend', (event) => {
  touchendX = event.changedTouches[0].screenX;
  handleGesture();
});

function handleGesture() {
  if (touchendX < touchstartX - 50) {
    toggleSidebar();
  }
}


// Function to scroll to the bottom of the messages
function scrollToBottom() {
  const messagesContainer = document.getElementById('messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Scroll to bottom when the page loads
window.addEventListener('load', () => {
  scrollToBottom();
});

// Additionally, scroll to bottom whenever new content is added
const messagesContainer = document.getElementById('messages');

// Observe changes to the messages container
const observer = new MutationObserver(scrollToBottom);
observer.observe(messagesContainer, { childList: true, subtree: true });

