// API endpoints
const REST_API_URL = 'http://localhost:3001/api';
const GRAPHQL_URL = 'http://localhost:4000/graphql';
const GOOGLE_CLIENT_ID = Process.env.GOOGLE_CLIENT_ID;
// Function to make REST API calls
async function callRestApi(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
      
    };

    // Add body for non-GET requests
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${REST_API_URL}/${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('REST API error:', error);
    throw error;
  }
}

// Function to execute GraphQL queries (GET operations only)
async function executeGraphQLQuery(query, variables) {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST', // GraphQL always uses POST method even for queries
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        variables: variables
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    return result.data;
  } catch (error) {
    console.error('GraphQL error:', error);
    throw error;
  }
}

// Function to handle normal login with email and password
function loginUser() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }
  
  // Show loading state
  const loginButton = document.querySelector('.btn-outline-light');
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Logging in...';
  }
  
  fetch(`${REST_API_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Check if SMS verification is required
    if (result.requireSmsVerification) {
      // Store user data for SMS verification process
      sessionStorage.setItem('tempUserId', result.userId);
      sessionStorage.setItem('tempUserPhone', result.user.phone);
      
      // Show SMS verification dialog
      showVerificationDialog(result.userId);
    } else {
      // Standard login - store token and redirect
      sessionStorage.setItem('authToken', result.token);
      
      if (result.user) {
        sessionStorage.setItem('currentUser', JSON.stringify(result.user));
      }
      
      // Redirect to main page
      window.location.href = 'views/main.html';
    }
  })
  .catch(error => {
    console.error('Login failed:', error);
    alert(`Login error: ${error.message || 'An error occurred during login'}`);
    
    // Restore button
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.innerHTML = 'Login';
    }
  });
}

// Function to show the verification dialog
function showVerificationDialog(userId) {
    // Create and display the verification modal
    const verificationModal = `
        <div class="modal fade" id="smsVerificationModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header">
                        <h5 class="modal-title">Two-Factor Authentication</h5>
                    </div>
                    <div class="modal-body">
                        <p>A verification code has been sent to your registered phone number.</p>
                        <div class="form-outline form-white mb-4">
                            <input type="text" id="verificationCode" class="form-control form-control-lg" maxlength="6" />
                            <label class="form-label" for="verificationCode">Verification Code</label>
                        </div>
                        <div class="text-center">
                            <button type="button" class="btn btn-outline-light btn-sm" onclick="resendCode('${userId}')">
                                Resend Code
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-light" onclick="verifyCode('${userId}')">Verify</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Append modal to body
    const modalElement = document.createElement('div');
    modalElement.innerHTML = verificationModal;
    document.body.appendChild(modalElement);
    
    // Initialize and show the modal
    const modal = new bootstrap.Modal(document.getElementById('smsVerificationModal'));
    modal.show();
    
    // Send the SMS verification code
    const phoneNumber = sessionStorage.getItem('tempUserPhone');
    
    // Send SMS verification request
    sendSmsVerification(userId, phoneNumber);
}

// Function to send SMS verification code
async function sendSmsVerification(userId, phoneNumber) {
    try {
        console.log('Sending SMS verification for user:', userId);
        
        // Show loading indicator
        const sendButton = document.querySelector('[onclick^="resendCode"]');
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';
        }
        
        const response = await fetch(`${REST_API_URL}/sms/send-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, phoneNumber })
        });
        
        const result = await response.json();
        
        // Reset button state
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = 'Resend Code';
        }
        
        if (!response.ok) {
            console.error('SMS verification request failed:', result.error || result.message);
            alert(`Failed to send verification code: ${result.error || result.message || 'Unknown error'}`);
            return false;
        } else {
            console.log('SMS verification code sent successfully');
            return true;
        }
    } catch (error) {
        console.error('SMS verification request error:', error);
        alert('Failed to send verification code. Please try again.');
        
        // Reset button state
        const sendButton = document.querySelector('[onclick^="resendCode"]');
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = 'Resend Code';
        }
        
        return false;
    }
}

// Function to verify the SMS code
async function verifyCode(userId) {
    const code = document.getElementById("verificationCode").value;
    
    if (!code) {
        alert("Please enter the verification code.");
        return;
    }
    
    try {
        console.log('Verifying code for user:', userId);
        
        const response = await fetch(`${REST_API_URL}/sms/verify-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, code })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Verification failed');
        }
        
        const verifyResult = await response.json();
        
        if (verifyResult.user) {
            // Hide the verification modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('smsVerificationModal'));
            modal.hide();
            
            // Save user data and token in sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(verifyResult.user));
            
            if (verifyResult.token) {
                sessionStorage.setItem('authToken', verifyResult.token);
                console.log('JWT token saved to sessionStorage');
            }
            
            console.log('User information saved to sessionStorage after 2FA');
            window.location.href = "views/main.html";
        } else {
            alert(`Verification failed: ${verifyResult.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Verification failed:", error);
        alert(`Error: ${error.message || 'An error occurred during verification'}`);
    }
}

// Function to resend the verification code
async function resendCode(userId) {
    const phoneNumber = sessionStorage.getItem('tempUserPhone');
    await sendSmsVerification(userId, phoneNumber);
    alert('A new verification code has been sent.');
}

// Handle Google Sign-In response
function handleGoogleResponse(response) {
  // Get the ID token from the response
  const token = response.credential;
  
  if (!token) {
    console.error('Google authentication failed: No token received');
    alert('Google authentication failed. Please try again.');
    return;
  }
  
  // Send the token to backend for verification
  fetch(`${REST_API_URL}/users/google-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  .then(response => response.json())
  .then(result => {
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (result.isNewUser || result.requiresCompletion) {
      // New user or existing user that needs to complete profile
      // Store token and user ID temporarily
      sessionStorage.setItem('googleToken', token);
      sessionStorage.setItem('tempUserId', result.userId);
      
      // Redirect to complete profile page
      window.location.href = 'views/complete-profile.html';
    } else {
      // Existing user with complete profile
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
  // Initialize Google Sign-In if the API is loaded
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse
    });
    
    google.accounts.id.renderButton(
      document.getElementById('googleSignInButton'),
      { 
        theme: 'outline', 
        size: 'large', 
        text: 'continue_with',
        shape: 'rectangular',
        width: '100%'
      }
    );
  } else {
    console.error('Google Sign-In API not loaded');
    document.getElementById('googleSignInButton').innerHTML = 
      '<div class="alert alert-warning">Google Sign-In unavailable</div>';
  }
});

// Make functions available globally
window.loginUser = loginUser;
window.verifyCode = verifyCode;
window.sendSmsVerification = sendSmsVerification;
window.resendCode = resendCode;
window.handleGoogleResponse = handleGoogleResponse;
