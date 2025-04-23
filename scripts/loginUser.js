// API endpoints
const REST_API_URL = 'http://localhost:3001/api';
const GRAPHQL_URL = 'http://localhost:4000/graphql';

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

async function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        // Step 1: Initial login with email/password using REST API
        const loginResult = await callRestApi('users/login', 'POST', { email, password });
        
        // If verification is required (2FA step)
        if (loginResult.requiresVerification) {
            showVerificationDialog(loginResult.userId);
        } else if (loginResult.user) {
            // Standard login success (user object exists)
            localStorage.setItem('currentUser', JSON.stringify(loginResult.user));
            
            // Store the token if provided
            if (loginResult.token) {
                localStorage.setItem('authToken', loginResult.token);
            }
            
            console.log('User information saved to localStorage');
            window.location.href = "views/main.html";
        } else {
            alert(`Error: ${loginResult.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Request failed:", error);
        alert(`Error: ${error.message || 'An error occurred while logging in'}`);
    }
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
}

// Function to verify the SMS code
async function verifyCode(userId) {
    const code = document.getElementById("verificationCode").value;
    
    if (!code) {
        alert("Please enter the verification code.");
        return;
    }
    
    try {
        // Call REST API to verify the code
        const verifyResult = await callRestApi('users/verify-sms', 'POST', { userId, code });
        
        if (verifyResult.user) {
            // Hide the verification modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('smsVerificationModal'));
            modal.hide();
            
            // Save user data and token
            localStorage.setItem('currentUser', JSON.stringify(verifyResult.user));
            
            if (verifyResult.token) {
                localStorage.setItem('authToken', verifyResult.token);
                console.log('JWT token saved to localStorage');
            }
            
            console.log('User information saved to localStorage after 2FA');
            window.location.href = "views/main.html";
        } else {
            alert(`Verification failed: ${verifyResult.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Verification failed:", error);
        alert(`Error: ${error.message || 'An error occurred during verification'}`);
    }
}

// Make functions available globally
window.loginUser = loginUser;
window.verifyCode = verifyCode;
