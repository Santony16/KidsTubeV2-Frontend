// get the current user from local storage
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    // load the current user
    loadCurrentUser();
    
    // load the restricted users
    loadRestrictedUsers();
});

function loadCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        currentUser = JSON.parse(userJson);
        
        // show the welcome message
        const welcomeElement = document.getElementById('userWelcome');
        if (welcomeElement && currentUser) {
            welcomeElement.textContent = `Welcome, ${currentUser.email}`;
        }
    } else {
        // No user logged in, redirect to login page
        window.location.href = '../index.html';
    }
}

// Function to log out the current user
function logout() {
    localStorage.removeItem('currentUser');
}

async function loadRestrictedUsers() {
    try {
        // Get current user ID from localStorage
        const userJson = localStorage.getItem('currentUser');
        let parentUserId = '';
        
        if (userJson) {
            const currentUser = JSON.parse(userJson);
            parentUserId = currentUser.id;
        }
        
        // Pass the parentUserId as a query parameter
        const response = await fetch(`http://localhost:3001/api/users/restricted?parentUserId=${parentUserId}`);
        const users = await response.json();
        
        const profilesContainer = document.getElementById('profiles-container');
        const noProfilesMessage = document.getElementById('no-profiles-message');
        
        if (users.length > 0) {
            noProfilesMessage.style.display = 'none';
            
            profilesContainer.innerHTML = '';
            users.forEach(user => {
                const profileCard = document.createElement('div');
                profileCard.className = 'col-md-3 col-sm-6';
                profileCard.innerHTML = `
                    <div class="profile-card" onclick="openUserPinModal('${user._id}', '${user.name}')">
                        <div class="profile-image">
                            <img src="../assets/avatars/${user.avatar}" alt="${user.name}'s Avatar">
                        </div>
                        <div class="profile-info">
                            <h5>${user.name}</h5>
                        </div>
                    </div>
                `;
                profilesContainer.appendChild(profileCard);
            });
        } else {
            noProfilesMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading restricted users:', error);
    }
}

function showAdminPinModal() {
    const adminPinModal = new bootstrap.Modal(document.getElementById('adminPinModal'));
    adminPinModal.show();
}

function openUserPinModal(userId, userName) {
    document.getElementById('selectedUserId').value = userId;
    document.getElementById('userPinModalLabel').innerText = `Enter PIN for ${userName}`;
    
    const userPinModal = new bootstrap.Modal(document.getElementById('userPinModal'));
    userPinModal.show();
}

async function verifyAdminPin() {
    const pin = document.getElementById('adminPin').value;
    
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
        alert('Please enter a valid 6-digit PIN');
        return;
    }
    
    try {
        // Include the user ID if a user is logged in
        const userId = currentUser ? currentUser.id : null;
        
        const response = await fetch('http://localhost:3001/api/users/verify-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                pin,
                userId
            })
        });
        
        if (response.ok) {
            window.location.href = 'restricted-users.html';
        } else {
            alert('Invalid PIN. Please try again.');
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        alert('An error occurred. Please try again.');
    }
}

async function verifyUserPin() {
    const userId = document.getElementById('selectedUserId').value;
    const pin = document.getElementById('userPin').value;
    
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
        alert('Please enter a valid 6-digit PIN');
        return;
    }
    
    try {
        console.log('Attempting to verify restricted user PIN:');
        console.log('User ID:', userId);
        console.log('PIN (first digit only for security):', pin.charAt(0) + '*****');
        
        const response = await fetch('http://localhost:3001/api/users/restricted/verify-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, pin })
        });
        
        const data = await response.json();
        console.log('API Response:', response.status);
        
        if (response.ok) {
            console.log('PIN verified successfully, redirecting to playlist');
            window.location.href = `user-playlist.html?userId=${userId}`;
        } else {
            console.error('PIN verification failed:', data.error);
            alert(`Invalid PIN. Please try again.`);
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        alert('An error occurred. Please try again.');
    }
}

// Make logout function available globally
window.logout = logout;
