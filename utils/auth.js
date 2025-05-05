/**
 * Authentication utility to protect routes from unauthorized access
 */

// Check if a user is logged in
function requireAuth() {
    const userData = sessionStorage.getItem('currentUser');
    const token = sessionStorage.getItem('authToken');
    
    if (!userData || !token) {
        console.log('Authentication failed: No user data or token found');
        window.location.href = getLoginPath();
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        
        if (!user || !user.id || !user.email) {
            console.log('Authentication failed: Invalid user data');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('authToken');
            window.location.href = getLoginPath();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Authentication error:', error);
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        window.location.href = getLoginPath();
        return false;
    }
}

// Get the correct path to the login page based on current location
function getLoginPath() {
    const path = window.location.pathname;
    return path.includes('/views/') ? '../index.html' : 'index.html';
}

// Get JWT token for API requests
function getAuthToken() {
    return sessionStorage.getItem('authToken');
}

// Add authentication headers to fetch options
function addAuthHeader(options = {}) {
    const token = getAuthToken();
    if (!token) return options;
    
    const headers = options.headers || {};
    
    return {
        ...options,
        headers: {
            ...headers,
            'Authorization': `Bearer ${token}`
        }
    };
}

// Check if user is authenticated
function isAuthenticated() {
    return sessionStorage.getItem('authToken') !== null;
}

// Get current user data
function getCurrentUser() {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Log out user
function logout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    window.location.href = '/index.html';
}

// Run authentication check on page load
document.addEventListener('DOMContentLoaded', requireAuth);

// Make functions available globally
window.requireAuth = requireAuth;
window.getAuthToken = getAuthToken;
window.addAuthHeader = addAuthHeader;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.logout = logout;
