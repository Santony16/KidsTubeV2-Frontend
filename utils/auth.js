/**
 * Authentication utility to protect routes from unauthorized access
 */

// Function to check if a user is logged in
function requireAuth() {
    // Check if user data exists in localStorage
    const userData = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    
    if (!userData || !token) {
        console.log('Authentication failed: No user data or token found');
        // Redirect to login page
        window.location.href = getLoginPath();
        return false;
    }
    
    try {
        // Parse the user data to make sure it's valid JSON
        const user = JSON.parse(userData);
        
        if (!user || !user.id || !user.email) {
            console.log('Authentication failed: Invalid user data');
            // Clear invalid data and redirect to login
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            window.location.href = getLoginPath();
            return false;
        }
        
        // User is authenticated
        return true;
    } catch (error) {
        console.error('Authentication error:', error);
        // Clear invalid data and redirect to login
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        window.location.href = getLoginPath();
        return false;
    }
}

// Helper function to get the correct path to the login page
function getLoginPath() {
    // Check if we're in a views subdirectory
    const path = window.location.pathname;
    if (path.includes('/views/')) {
        return '../index.html';
    } else {
        return 'index.html';
    }
}

// Get the JWT token for API requests
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Add authentication headers to fetch options
function addAuthHeader(options = {}) {
    const token = getAuthToken();
    if (!token) return options;
    
    // Create headers object if it doesn't exist
    const headers = options.headers || {};
    
    return {
        ...options,
        headers: {
            ...headers,
            'Authorization': `Bearer ${token}`
        }
    };
}

// Run authentication check immediately when this script is loaded
document.addEventListener('DOMContentLoaded', requireAuth);

// Export functions for direct usage
window.requireAuth = requireAuth;
window.getAuthToken = getAuthToken;
window.addAuthHeader = addAuthHeader;
