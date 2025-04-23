document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    loadAvatars();
});

// Available avatars with descriptive names
const avatars = [
    { file: 'avatar1.png', name: 'Boy with Cap' },
    { file: 'avatar2.png', name: 'Girl with Pigtails' },
    { file: 'avatar3.png', name: 'Boy with Glasses' },
    { file: 'avatar4.png', name: 'Girl with Headband' },
    { file: 'avatar5.png', name: 'Robot Character' },
    { file: 'avatar6.png', name: 'Superhero Kid' }
];

function loadAvatars() {
    const avatarSelector = document.getElementById('avatarSelector');
    avatarSelector.innerHTML = '';
    
    avatars.forEach(avatar => {
        const avatarElement = document.createElement('div');
        avatarElement.className = 'avatar-option';
        avatarElement.title = avatar.name;
        avatarElement.innerHTML = `<img src="../assets/avatars/${avatar.file}" alt="${avatar.name}">`;
        avatarElement.onclick = function() {
            selectAvatar(avatar.file, this);
        };
        avatarSelector.appendChild(avatarElement);
    });
}

function selectAvatar(avatarName, element) {
    // Remove selected class from all avatars
    document.querySelectorAll('.avatar-option').forEach(avatar => {
        avatar.classList.remove('selected');
    });
    
    // Add selected class to clicked avatar
    element.classList.add('selected');
    
    // Store selected avatar
    document.getElementById('selectedAvatar').value = avatarName;
}

async function loadUsers() {
    try {
        // Get current user ID from localStorage
        const userJson = localStorage.getItem('currentUser');
        let parentUserId = '';
        
        if (userJson) {
            const currentUser = JSON.parse(userJson);
            parentUserId = currentUser.id;
        }
        
        // Add timestamp to prevent browser caching
        const timestamp = new Date().getTime();
        
        // Pass the parentUserId as a query parameter
        const response = await fetch(`http://localhost:3001/api/users/restricted?parentUserId=${parentUserId}&_=${timestamp}`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const users = await response.json();
        
        const usersContainer = document.getElementById('users-container');
        const noUsersMessage = document.getElementById('no-users-message');
        
        if (users.length > 0) {
            noUsersMessage.style.display = 'none';
            
            usersContainer.innerHTML = '';
            users.forEach(user => {
                const userCard = document.createElement('div');
                userCard.className = 'col-md-3 col-sm-6';
                userCard.innerHTML = `
                    <div class="profile-card">
                        <div class="profile-image">
                            <img src="../assets/avatars/${user.avatar}" alt="${user.name}'s Avatar">
                        </div>
                        <div class="profile-info">
                            <h5>${user.name}</h5>
                            <div class="mt-3">
                                <button class="btn btn-warning btn-sm" onclick="editUser('${user._id}')">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user._id}')">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
                usersContainer.appendChild(userCard);
            });
        } else {
            noUsersMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        // Display error message to user
        document.getElementById('users-container').innerHTML = 
            `<div class="col-12 text-center"><div class="alert alert-danger">Error loading users: ${error.message}</div></div>`;
    }
}

function editUser(userId) {
    // Reset form
    document.getElementById('userForm').reset();
    document.querySelectorAll('.avatar-option').forEach(avatar => {
        avatar.classList.remove('selected');
    });
    
    // Get current user ID from localStorage
    const userJson = localStorage.getItem('currentUser');
    let parentUserId = '';
    
    if (userJson) {
        const currentUser = JSON.parse(userJson);
        parentUserId = currentUser.id;
    }
    
    fetch(`http://localhost:3001/api/users/restricted/${userId}?parentUserId=${parentUserId}`)
        .then(response => response.json())
        .then(user => {
            document.getElementById('userId').value = user._id;
            document.getElementById('fullName').value = user.name;
            
            // Clear PIN field - leave it blank for editing
            document.getElementById('pin').value = '';
            // Add placeholder to indicate optional for edits
            document.getElementById('pin').placeholder = 'Enter new PIN (leave blank to keep existing)';
            
            document.getElementById('selectedAvatar').value = user.avatar;
            
            // Select the correct avatar
            document.querySelectorAll('.avatar-option').forEach(avatarElement => {
                const imgSrc = avatarElement.querySelector('img').src;
                if (imgSrc.includes(user.avatar)) {
                    avatarElement.classList.add('selected');
                }
            });
            
            // Show modal
            const userModal = new bootstrap.Modal(document.getElementById('userModal'));
            userModal.show();
        })
        .catch(error => {
            console.error('Error fetching user:', error);
            alert('Error loading user data');
        });
}

async function saveUser() {
    const userId = document.getElementById('userId').value;
    const name = document.getElementById('fullName').value;
    const pin = document.getElementById('pin').value;
    const avatar = document.getElementById('selectedAvatar').value;
    
    // Only validate name and avatar as required
    if (!name || !avatar) {
        alert('Please fill all required fields and select an avatar');
        return;
    }
    
    // Only validate PIN if it's provided (required for new users)
    if (pin && (pin.length !== 6 || !/^\d+$/.test(pin))) {
        alert('PIN must be 6 digits');
        return;
    }
    
    // For new users, PIN is required
    if (!userId && !pin) {
        alert('PIN is required for new users');
        return;
    }
    
    //get current user ID from localStorage
    const userJson = localStorage.getItem('currentUser');
    let parentUserId = null;
    if (userJson) {
        const currentUser = JSON.parse(userJson);
        parentUserId = currentUser.id;
    }
    
    // Only include PIN in the data if it's provided
    const userData = { 
        name, 
        avatar,
        parentUserId 
    };
    
    if (pin) {
        userData.pin = pin;
    }
    
    try {
        let response;
        
        if (userId) {
            // Update existing user
            response = await fetch(`http://localhost:3001/api/users/restricted/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
        } else {
            // Create new user
            response = await fetch('http://localhost:3001/api/users/restricted', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
        }
        
        if (response.ok) {
            alert(userId ? 'User updated successfully!' : 'User created successfully!');
            
            // Close modal
            const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
            userModal.hide();
            
            // Force page refresh instead of just reloading users
            window.location.reload();
        } else {
            const result = await response.json();
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error saving user:', error);
        alert('An error occurred while saving the user');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3001/api/users/restricted/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('User deleted successfully!');
            // Force page refresh instead of just reloading users
            window.location.reload();
        } else {
            const result = await response.json();
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('An error occurred while deleting the user');
    }
}
