let currentUser = null;
let selectedUser = null;
let ws = null;
let typingTimeout = null;
let userProfilePic = 'default-avatar.png';

function connectWebSocket() {
    if (ws) {
        ws.close();
    }

    ws = new WebSocket(`ws://${window.location.hostname}:4000`);

    ws.onopen = () => {
        if (currentUser) {
            ws.send(JSON.stringify({
                type: 'login',
                username: currentUser
            }));
        }
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
            const message = data.message;
            if ((message.from === currentUser && message.to === selectedUser) ||
                (message.from === selectedUser && message.to === currentUser)) {
                displayMessage(message);
            }
        } else if (data.type === 'conversationDeleted') {
            const { from, to } = data;
            // If the deletion affects the currently-open conversation, clear it
            const isCurrentPair = (from === currentUser && to === selectedUser) ||
                                  (from === selectedUser && to === currentUser);
            if (isCurrentPair) {
                document.getElementById('messages').innerHTML = '';
                document.getElementById('typing-status').textContent = '';
            }
        } else if (data.type === 'userStatus') {
            updateUsersList(data.users);
        } else if (data.type === 'typing') {
            if ((data.from === selectedUser && data.to === currentUser)) {
                updateTypingStatus(data.isTyping);
            }
        }
    };
}

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.success) {
        alert('Registration successful! Please login.');
    } else {
        alert('Registration failed: ' + data.error);
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.success) {
        currentUser = username;
        userProfilePic = data.profilePic;

        // Save user info in localStorage for 30 days
        const userData = {
            username,
            profilePic: userProfilePic,
            expiry: new Date().getTime() + 30 * 24 * 60 * 60 * 1000 // 30 days
        };
        localStorage.setItem('userData', JSON.stringify(userData));

        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'flex';
        document.getElementById('current-username').textContent = username;
        document.getElementById('current-user-pic').src = `../../priuploads/${userProfilePic}`;

        connectWebSocket();
        loadUsers();
    } else {
        alert('Login failed: ' + data.error);
    }
}
function checkLogin() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        const currentTime = new Date().getTime();
        
        // Check if the stored data is still valid (not expired)
        if (currentTime < userData.expiry) {
            // Auto-login the user
            currentUser = userData.username;
            userProfilePic = userData.profilePic;
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('chat-container').style.display = 'flex';
            document.getElementById('current-username').textContent = currentUser;
            document.getElementById('current-user-pic').src = `../../priuploads/${userProfilePic}`;

            connectWebSocket();
            loadUsers();
        } else {
            // Clear expired data
            localStorage.removeItem('userData');
        }
    }
}

// Call checkLogin on page load
window.onload = checkLogin;


async function loadUsers() {
    const response = await fetch('/users');
    const users = await response.json();
    updateUsersList(users);
}

function updateUsersList(users) {
    const usersDiv = document.getElementById('users');
    usersDiv.innerHTML = '';

    users.forEach(user => {
        if (user.username !== currentUser) {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';

            const statusDot = document.createElement('span');
            statusDot.className = `status-dot ${user.online ? 'online' : 'offline'}`;

            const profilePic = document.createElement('img');
            profilePic.src = user.profilePic ? `../../priuploads/${user.profilePic}` : '/default-avatar.png';
            profilePic.className = 'profile-pic';

            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = user.username;

            userDiv.appendChild(statusDot);
            userDiv.appendChild(profilePic);
            userDiv.appendChild(usernameSpan);
            
            // Add click event listener to userDiv
            userDiv.onclick = () => selectUser(user.username, user.profilePic); // Attach the click event

            usersDiv.appendChild(userDiv);
        }
    });
}


function selectUser(username) {
    selectedUser = username;
    document.getElementById('selected-user').textContent = `Chat with ${username}`;
    document.getElementById('messages').innerHTML = '';
    document.getElementById('typing-status').textContent = '';
    loadMessages();
}

async function loadMessages() {
    const response = await fetch('/private.json');
    const messages = await response.json();
    
    messages.forEach(message => {
        if ((message.from === currentUser && message.to === selectedUser) ||
            (message.from === selectedUser && message.to === currentUser)) {
            displayMessage(message);
        }
    });
}
function displayMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.from === currentUser ? 'sent' : 'received'}`;

    const timestamp = new Date(message.timestamp).toLocaleString();
    const contentDiv = document.createElement('div');
    contentDiv.style.wordBreak = 'break-word'; // Ensure long words break here

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

    if (imageExtensions.some(ext => message.content.endsWith(ext))) {
        const img = document.createElement('img');
        img.src = `../../priuploads/${message.content}`;
        img.alt = 'Image';
        messageDiv.appendChild(img);
    } else if (message.content.endsWith('.mp4') || message.content.endsWith('.mov')) {
        const video = document.createElement('video');
        video.src = `../../priuploads/${message.content}`;
        video.controls = true;
        messageDiv.appendChild(video);
    } else if (message.content.endsWith('.pdf')) {
        const link = document.createElement('a');
        link.href = `../../priuploads/${message.content}`;
        link.textContent = 'Download PDF';
        link.target = '_blank';
        messageDiv.appendChild(link);
    } else {
        contentDiv.textContent = message.content;
        messageDiv.appendChild(contentDiv);
    }

    const timeDiv = document.createElement('span');
    timeDiv.className = 'timestamp';
    timeDiv.textContent = timestamp;
    messageDiv.appendChild(timeDiv);
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateTypingStatus(isTyping) {
    const typingStatus = document.getElementById('typing-status');
    if (isTyping) {
        typingStatus.innerHTML = `
            <span>${selectedUser} is typing</span>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
    } else {
        typingStatus.innerHTML = '';
    }
}



let typingInterval = null;

function handleTyping() {
    if (!selectedUser || !ws) return;

    // Start sending typing status if not already started
    if (!typingInterval) {
        typingInterval = setInterval(() => {
            ws.send(JSON.stringify({
                type: 'typing',
                from: currentUser,
                to: selectedUser,
                isTyping: true // Indicate that the user is currently typing
            }));
        }, 600); // Send every second
    }

    // Clear the previous timeout if user is still typing
    clearTimeout(typingTimeout);

    // Set a timeout to stop the typing status after a delay of inactivity
    typingTimeout = setTimeout(() => {
        clearInterval(typingInterval); // Stop sending typing status
        typingInterval = null; // Reset interval

        ws.send(JSON.stringify({
            type: 'typing',
            from: currentUser,
            to: selectedUser,
            isTyping: false // Indicate that the user has stopped typing
        }));
    }, 1000); // Stops typing status after 2 seconds of inactivity
}



function sendMessage() {
    if (!selectedUser) return;

    const messageText = document.getElementById('message-text');
    const content = messageText.value.trim();

    // If there's a selected file, send it
    if (selectedFile && ws) {
        sendFile(selectedFile); // Send the selected file
        selectedFile = null; // Clear the selected file after sending
        document.getElementById('file-input').value = ''; // Reset the file input
        document.getElementById('file-preview').style.display = 'none'; // Hide preview
    } else if (content && ws) {
        const message = {
            type: 'message',
            from: currentUser,
            to: selectedUser,
            content: content,
            timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(message));
        messageText.value = ''; // Clear the input field
    }
}

async function sendFile(file) {
    if (!selectedUser || !ws) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    if (data.success) {
        const message = {
            type: 'message',
            from: currentUser,
            to: selectedUser,
            content: data.filename,
            timestamp: new Date().toISOString(),
        };

        ws.send(JSON.stringify(message));
    } else {
        alert('File upload failed: ' + data.error);
    }
}

async function updateProfilePic(file) {
    const formData = new FormData();
    formData.append('profilePic', file);
    formData.append('username', currentUser);

    const response = await fetch('/upload-profile-pic', {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    if (data.success) {
        userProfilePic = data.profilePic;

        // Update the profile picture in real-time
        document.getElementById('current-user-pic').src = `/priuploads/${data.profilePic}`; // Use correct path

        // Update local storage with new profile picture
        const userData = {
            username: currentUser,
            profilePic: userProfilePic,
            expiry: new Date().getTime() + 30 * 24 * 60 * 60 * 1000 // 30 days
        };
        localStorage.setItem('userData', JSON.stringify(userData));

        // Notify others about the profile picture update
        notifyProfilePicUpdate();

        // Optionally, refresh user list to reflect the change
        loadUsers(); // If you need to update the user list, keep this
    } else {
        alert('Profile picture update failed: ' + data.error);
    }
}


let selectedFile = null; // To store the selected file

function handleFileInput(event) {
    selectedFile = event.target.files[0]; // Get the selected file

    if (selectedFile) {
        const filePreview = document.getElementById('file-preview');
        const previewImg = document.getElementById('preview-img');
        const previewVideo = document.getElementById('preview-video');
        const previewLink = document.getElementById('preview-link');

        // Clear previous previews
        previewImg.style.display = 'none';
        previewVideo.style.display = 'none';
        previewLink.style.display = 'none';

        // Show the preview based on the file type
        const reader = new FileReader();
        reader.onload = function(e) {
            if (selectedFile.type.startsWith('image/')) {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
            } else if (selectedFile.type.startsWith('video/')) {
                previewVideo.src = e.target.result;
                previewVideo.style.display = 'block';
            } else if (selectedFile.type === 'application/pdf') {
                previewLink.href = e.target.result;
                previewLink.textContent = 'Download PDF';
                previewLink.style.display = 'block';
            }
            filePreview.style.display = 'block'; // Show the preview area
        };

        reader.readAsDataURL(selectedFile); // Read the file as a data URL
    }
}

function handleProfilePicInput(event) {
    const file = event.target.files[0];
    if (file) {
        updateProfilePic(file);
    }
}

document.getElementById('file-input').addEventListener('change', handleFileInput);
document.getElementById('profile-pic-input').addEventListener('change', handleProfilePicInput);
document.getElementById('message-text').addEventListener('input', handleTyping);
document.getElementById('message-text').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function filterUsers() {
    const searchInput = document.getElementById('search-bar').value.toLowerCase();
    const userElements = document.getElementById('users').children; // Get all user elements

    for (let userElement of userElements) {
        const username = userElement.textContent.toLowerCase(); // Get the username text
        if (username.includes(searchInput)) {
            userElement.style.display = ''; // Show the user if it matches
        } else {
            userElement.style.display = 'none'; // Hide the user if it doesn't match
        }
    }
}

// Example function to update the users list
function updateUserList(users) {
    const usersContainer = document.getElementById('users');
    usersContainer.innerHTML = ''; // Clear existing users

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.textContent = user.username; // Adjust this if your user object has a different structure
        usersContainer.appendChild(userDiv);
    });
}


function logout() {
    // Clear localStorage
    localStorage.removeItem('userData');
    // Reset the UI
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('chat-container').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}


function cancelFilePreview() {
    document.getElementById('file-preview').style.display = 'none';
    document.getElementById('preview-img').style.display = 'none';
    document.getElementById('preview-video').style.display = 'none';
    document.getElementById('preview-link').style.display = 'none';
    document.getElementById('file-input').value = ''; // Clear the file input
}


function toggleUserList() {
    const usersList = document.querySelector('.users-list');
    usersList.classList.toggle('active');

    if (usersList.classList.contains('active')) {
        document.addEventListener('click', closeUserList);
    } else {
        document.removeEventListener('click', closeUserList);
    }
}

function closeUserList(event) {
    const usersList = document.querySelector('.users-list');
    const toggleButton = document.querySelector('.menu-toggle');

    if (!usersList.contains(event.target) && !toggleButton.contains(event.target)) {
        usersList.classList.remove('active');
        document.removeEventListener('click', closeUserList);
    }
}
function selectUser(username, userProfilePic) {
    selectedUser = username;
    
    const selectedUserDiv = document.getElementById('selected-user');
    selectedUserDiv.innerHTML = ''; // Clear previous content

    // Create profile picture element
    const profilePic = document.createElement('img');
    profilePic.src = userProfilePic ? `../../priuploads/${userProfilePic}` : '/default-avatar.png';
    profilePic.style.width = '50px';
    profilePic.style.height = '50px';
    profilePic.style.borderRadius = '50%';
    profilePic.style.marginRight = '0.75rem';
    profilePic.style.border = '2px solid #7289da';
    profilePic.style.transition = 'transform 0.3s';
    profilePic.style.objectFit = 'cover';

    // Add click event to open modal
    profilePic.addEventListener('click', () => {
        openModal(profilePic.src);
    });

    // Create username element
    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = `${username}`;

    // Create delete conversation button
    const deleteBtn = document.createElement('button');
    deleteBtn.title = 'Delete private chat';
    deleteBtn.style.marginLeft = '0.75rem';
    deleteBtn.className = 'delete-conversation-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', deleteConversation);

    // Append elements to the selected user div
    selectedUserDiv.appendChild(profilePic);
    selectedUserDiv.appendChild(usernameSpan);
    selectedUserDiv.appendChild(deleteBtn);

    // Clear messages and typing status
    document.getElementById('messages').innerHTML = '';
    document.getElementById('typing-status').textContent = '';
    loadMessages();

    // Close the user list when a user is selected
    const usersList = document.querySelector('.users-list');
    usersList.classList.remove('active');
    document.removeEventListener('click', closeUserList);
}

document.addEventListener('DOMContentLoaded', () => {
    const messagesDiv = document.getElementById('messages');

    messagesDiv.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            openModal(event.target.src);
        }
    });
});

function openModal(src) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    modal.style.display = 'flex';
    modalImage.src = src;
}

function closeModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
}

document.getElementById('image-modal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeModal();
    }
});

async function deleteConversation() {
    if (!currentUser || !selectedUser) return;
    const confirmDelete = confirm(`Delete private chat with ${selectedUser}? This will remove all messages and media for this conversation.`);
    if (!confirmDelete) return;

    try {
        const response = await fetch('/delete-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: currentUser, to: selectedUser })
        });
        const result = await response.json();
        if (response.ok && result.success) {
            document.getElementById('messages').innerHTML = '';
            document.getElementById('typing-status').textContent = '';
        } else {
            alert(result.error || 'Failed to delete conversation');
        }
    } catch (e) {
        alert('Failed to delete conversation');
    }
}
