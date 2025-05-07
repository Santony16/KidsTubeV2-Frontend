// GraphQL endpoint
const GRAPHQL_URL = 'http://localhost:4000/graphql';

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

// Helper function for GraphQL queries with robust error handling
async function executeGraphQLQuery(query, variables) {
    try {
        const token = sessionStorage.getItem('authToken');
        
        console.log(`Executing GraphQL query with variables:`, variables);
        
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify({
                query,
                variables
            }),
            credentials: 'include' // Include credentials for CORS
        });
        
        // Check for network errors
        if (!response.ok) {
            throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.errors) {
            console.error('GraphQL returned errors:', result.errors);
            throw new Error(result.errors[0].message);
        }
        
        return result.data;
    } catch (error) {
        console.error('GraphQL query error:', error);
        throw error;
    }
}

// Load restricted users using GraphQL only - NO REST fallback
async function loadUsers() {
    try {
        // Get current user ID from sessionStorage
        const userJson = sessionStorage.getItem('currentUser');
        let parentUserId = '';
        
        if (userJson) {
            const currentUser = JSON.parse(userJson);
            parentUserId = currentUser.id;
        } else {
            throw new Error('No authenticated user found');
        }
        
        console.log('Loading restricted users for parent ID:', parentUserId);
        
        // GraphQL query for restricted users
        const USERS_QUERY = `
            query GetRestrictedUsers($parentUserId: ID) {
                restrictedUsers(parentUserId: $parentUserId) {
                    id
                    name
                    avatar
                    parentUser
                }
            }
        `;
        
        // Execute GraphQL query
        const data = await executeGraphQLQuery(USERS_QUERY, { parentUserId });
        
        if (!data || !data.restrictedUsers) {
            throw new Error('Failed to retrieve restricted users data');
        }
        
        const users = data.restrictedUsers;
        console.log('Successfully loaded users via GraphQL:', users.length);
        
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-container').innerHTML = 
            `<div class="col-12 text-center">
                <div class="alert alert-danger">
                    <h5>Error loading users</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-outline-danger mt-2" onclick="loadUsers()">
                        Retry
                    </button>
                </div>
            </div>`;
    }
}

// Function to display users
function displayUsers(users) {
    const container = document.getElementById('users-container');
    
    if (!users || users.length === 0) {
        container.innerHTML = `<div class="col-12 text-center"><div class="alert alert-info">No restricted user profiles found.</div></div>`;
        return;
    }
    
    container.innerHTML = '';
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'col-md-4 mb-4';
        userCard.innerHTML = `
            <div class="card">
                <div class="card-body text-center">
                    <img src="../assets/avatars/${user.avatar || 'default.png'}" class="rounded-circle mb-3" width="100" height="100" alt="Avatar">
                    <h5 class="card-title">${user.name}</h5>
                    <div class="mt-3">
                        <button class="btn btn-warning btn-sm" onclick="editUser('${user.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(userCard);
    });
}

// Function to edit a user
async function editUser(userId) {
    try {
        console.log('Editing user:', userId);
        
        // GraphQL query to get user details
        const USER_QUERY = `
            query GetRestrictedUser($id: ID!) {
                restrictedUser(id: $id) {
                    id
                    name
                    avatar
                    parentUser
                }
            }
        `;
        
        const data = await executeGraphQLQuery(USER_QUERY, { id: userId });
        const user = data.restrictedUser;
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Populate the form fields
        document.getElementById('userId').value = user.id;
        document.getElementById('fullName').value = user.name;
        
        // PIN field is left empty because we don't want to force changing PIN
        document.getElementById('pin').value = '';
        
        // Show that PIN is optional when editing
        const pinRequiredIndicator = document.getElementById('pinRequiredIndicator');
        if (pinRequiredIndicator) {
            pinRequiredIndicator.style.display = 'none';
        }
        
        const pinHelpText = document.getElementById('pinHelpText');
        if (pinHelpText) {
            pinHelpText.innerText = 'Leave blank to keep the current PIN.';
        }
        
        // Select the avatar
        document.querySelectorAll('.avatar-option').forEach(avatarEl => {
            const avatarImg = avatarEl.querySelector('img');
            if (avatarImg && avatarImg.src.includes(user.avatar)) {
                selectAvatar(user.avatar, avatarEl);
            }
        });
        
        // Update modal title and button text
        document.getElementById('userModalLabel').textContent = 'Edit Restricted User';
        const saveBtn = document.getElementById('saveUserBtn');
        saveBtn.textContent = 'Update User';
        
        // Show the modal
        const userModal = new bootstrap.Modal(document.getElementById('userModal'));
        userModal.show();
        
    } catch (error) {
        console.error('Error editing user:', error);
        alert(`Error loading user data: ${error.message}`);
    }
}

// Function to view a restricted user's profile
function viewProfile(userId) {
    // Navigate to the user profile page
    window.location.href = `user-profile.html?id=${userId}`;
}

// Function to save or update a user
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
    
    //get current user ID from sessionStorage
    const userJson = sessionStorage.getItem('currentUser');
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
        
        // Disable button and show loading state
        const saveBtn = document.getElementById('saveUserBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = userId ? 
            '<span class="spinner-border spinner-border-sm"></span> Updating...' : 
            '<span class="spinner-border spinner-border-sm"></span> Creating...';
        
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
            const result = await response.json();
            console.log(`User ${userId ? 'updated' : 'created'} successfully:`, result);
            
            // Close modal
            const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
            userModal.hide();
            
            // Show success message
            alert(userId ? 'User updated successfully!' : 'User created successfully!');
            
            // Reload the page to see the changes
            window.location.reload();
        } else {
            const result = await response.json();
            alert(`Error: ${result.error}`);
            
            // Reset button state
            saveBtn.disabled = false;
            saveBtn.innerHTML = userId ? 'Update User' : 'Create User';
        }
    } catch (error) {
        console.error('Error saving user:', error);
        alert(`An error occurred while saving the user: ${error.message}`);
        
        // Reset button state
        const saveBtn = document.getElementById('saveUserBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = userId ? 'Update User' : 'Create User';
    }
}

// Function to delete a user
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

// Make functions available globally
window.saveUser = saveUser;
window.viewProfile = viewProfile;
window.deleteUser = deleteUser;
window.editUser = editUser;
