// API endpoints
const REST_API_URL = 'http://localhost:3001/api';
const GRAPHQL_URL = 'http://localhost:4000/graphql';

// Function to execute GraphQL query (for GET operations only)
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

// Function to execute REST API calls (for POST/PUT/DELETE operations)
async function executeRESTCall(endpoint, method, data) {
  try {
    const response = await fetch(`${REST_API_URL}/${endpoint}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
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

// Load countries when document loads
document.addEventListener('DOMContentLoaded', function() {
    fetchCountries();
});

// Function to fetch and display countries from the GraphQL API (GET operation)
async function fetchCountries() {
    try {
        // Use GraphQL to fetch countries (this is a GET operation)
        const COUNTRIES_QUERY = `
            query {
                countries {
                    name
                    code
                    dialCode
                }
            }
        `;
        
        const response = await executeGraphQLQuery(COUNTRIES_QUERY);
        const countries = response.countries;
        
        // Populate country dropdown
        const countrySelect = document.getElementById('country');
        if (countrySelect) {
            countrySelect.innerHTML = '<option value="" disabled selected>Select your country</option>';
            
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country.name;
                option.textContent = `${country.name} (${country.dialCode})`;
                option.dataset.dialCode = country.dialCode;
                countrySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error fetching countries:', error);
        
        // Fallback to REST API if GraphQL fails
        try {
            const response = await fetch(`${REST_API_URL}/countries`);
            if (!response.ok) {
                throw new Error('Failed to fetch countries');
            }
            
            const countries = await response.json();
            
            // Populate country dropdown
            const countrySelect = document.getElementById('country');
            if (countrySelect) {
                countrySelect.innerHTML = '<option value="" disabled selected>Select your country</option>';
                
                countries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country.name;
                    option.textContent = `${country.name} (${country.dialCode})`;
                    option.dataset.dialCode = country.dialCode;
                    countrySelect.appendChild(option);
                });
            }
        } catch (fallbackError) {
            console.error('Fallback error:', fallbackError);
            // If all else fails, add a text field as fallback
            const countryContainer = document.getElementById('country').parentNode;
            countryContainer.innerHTML = `
                <label for="country" class="form-label">Country</label>
                <input type="text" class="form-control" id="country" required>
            `;
        }
    }
}

function registerUser() {
    const countrySelect = document.getElementById('country');
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    const country = countrySelect.value;
    const countryDialCode = selectedOption.dataset.dialCode || '';
    
    // Validate countryDialCode is present
    if (!countryDialCode) {
        alert('Please select a valid country with a dial code');
        return;
    }
    
    const userData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        phone: document.getElementById('phone').value,
        pin: document.getElementById('pin').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        country: country,
        countryDialCode: countryDialCode,
        birthDate: document.getElementById('birthDate').value
    };

    // Using REST API for user registration (mutation operation)
    callRestApi('users/register', 'POST', userData)
        .then(result => {
            // Success - show verification message
            document.querySelector('.card-body').innerHTML = `
                <h2 class="fw-bold mb-4 text-uppercase">Registration Successful!</h2>
                <div class="alert alert-success">
                    <p>Thank you for registering with KidsTube!</p>
                    <p>A verification email has been sent to <strong>${userData.email}</strong>.</p>
                    <p>Please check your inbox and click the verification link to activate your account.</p>
                </div>
                <div class="mt-4">
                    <a href="../index.html" class="btn btn-outline-light btn-lg px-5 w-100">Return to Login</a>
                </div>
            `;
        })
        .catch(error => {
            console.error("Registration failed:", error);
            alert(`Error: ${error.message || 'An error occurred during registration'}`);
        });
}

// Make registerUser available globally
window.registerUser = registerUser;
