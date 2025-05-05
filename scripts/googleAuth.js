const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REST_API_URL = 'http://localhost:3001/api';

// Handle Google Sign-In response
function handleGoogleSignIn(response) {
  // Get the ID token from the response
  const token = response.credential;
  
  if (!token) {
    console.error('Google authentication failed: No token received');
    alert('Google authentication failed. Please try again.');
    return;
  }
  
  console.log('Google token received, sending to backend...');
  
  // Send the token to backend for verification
  fetch(`${REST_API_URL}/users/google-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      throw new Error(result.error);
    }
    
    console.log('Google authentication response:', result);
    
    if (result.isNewUser || result.requiresCompletion) {
      // New user or existing user that needs to complete profile
      // Store token and user ID temporarily
      sessionStorage.setItem('googleToken', token);
      sessionStorage.setItem('tempUserId', result.userId);
      sessionStorage.setItem('tempUserEmail', result.email);
      sessionStorage.setItem('tempUserName', result.name);     
      // Redirect to complete profile page
      window.location.href = 'views/complete-google-profile.html';
    } else {
      // Existing user with complete profile - regular login
      sessionStorage.setItem('authToken', result.token);
      sessionStorage.setItem('currentUser', JSON.stringify(result.user));
      
      // Redirect to main page
      window.location.href = 'views/main.html';
    }
  })
  .catch(error => {
    console.error('Google authentication error:', error);
    alert(`Authentication error: ${error.message || 'Unknown error occurred'}`);
  });
}

// Initialize Google Sign-In button
document.addEventListener('DOMContentLoaded', function() {
  if (typeof google !== 'undefined' && google.accounts) {
    console.log('Initializing Google Sign-In button');
    
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn,
      cancel_on_tap_outside: true,
      context: 'signin'
    });
    
    // Render the Google Sign-In button
    google.accounts.id.renderButton(
      document.getElementById('googleSignInButton'),
      { 
        type: 'standard',
        theme: 'outline', 
        size: 'large', 
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'center',
        width: '100%'
      }
    );
  } else {
    console.error('Google Sign-In SDK not loaded');
    document.getElementById('googleSignInButton').innerHTML = 
      '<div class="alert alert-warning">Google Sign-In unavailable</div>';
  }
});

// Make functions available globally
window.handleGoogleSignIn = handleGoogleSignIn;
