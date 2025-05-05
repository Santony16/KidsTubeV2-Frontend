// API URLs
const GRAPHQL_URL = 'http://localhost:4000/graphql';
const REST_API_URL = 'http://localhost:3001/api';

// Function to execute GraphQL queries (only for GET queries)
async function executeGraphQLQuery(query, variables) {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST', // GraphQL always uses POST method but only for GET queries
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

// Function for REST API calls (for mutations)
async function callRestApi(endpoint, method, data, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    };
    
    const response = await fetch(`${REST_API_URL}/${endpoint}`, options);
    // Check if the content type is JSON before attempting to parse it
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `Error: ${response.status}`);
      }
      
      return responseData;
    } else {
      // If not JSON, get the response text for debugging
      const text = await response.text();
      console.error('Received non-JSON response:', text);
      throw new Error(`Expected JSON response, got: ${contentType || 'unknown content type'}`);
    }
  } catch (error) {
    console.error('REST API error:', error);
    throw error;
  }
}

// Load countries from GraphQL (using GET query)
async function loadCountries() {
  try {
    // Use GraphQL to fetch countries
    const COUNTRIES_QUERY = `
      query GetCountries {
        countries {
          code
          name
        }
      }
    `;
    
    const result = await executeGraphQLQuery(COUNTRIES_QUERY, {});
    const countries = result.countries;
    
    const countrySelect = document.getElementById('country');
    
    // Add options to the select dropdown
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading countries:', error);
    
    // If loading countries fails, add a text field as fallback
    const countryContainer = document.getElementById('country').parentNode;
    countryContainer.innerHTML = `
      <label for="country" class="form-label">Country</label>
      <input type="text" class="form-control" id="country" required>
    `;
  }
}

// Check if we have the temporary data from Google sign-in
document.addEventListener('DOMContentLoaded', () => {
  const googleToken = sessionStorage.getItem('googleToken');
  const userId = sessionStorage.getItem('tempUserId');
  
  if (!googleToken || !userId) {
    alert('Google authentication information is missing. Please log in again.');
    window.location.href = '../index.html';
  }
  
  // Load countries from GraphQL API
  loadCountries();
});

// Complete the user profile using REST API instead of GraphQL
async function completeProfile() {
  const googleToken = sessionStorage.getItem('googleToken');
  const userId = sessionStorage.getItem('tempUserId');
  const phone = document.getElementById('phone').value.trim();
  const birthDate = document.getElementById('birthDate').value;
  const pin = document.getElementById('pin').value.trim();
  
  const countryElement = document.getElementById('country');
  const country = countryElement.tagName === 'SELECT'
    ? document.querySelector('#country option:checked').textContent
    : countryElement.value;

  // Validate form fields
  if (!phone || !birthDate || !pin || !country) {
    alert('Please fill in all required fields');
    return;
  }

  // Validate PIN format
  if (pin.length !== 6 || !/^\d+$/.test(pin)) {
    alert('PIN must be exactly 6 digits');
    return;
  }

  // Validate birthdate (must be 18+ years)
  const birthDateObj = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birthDateObj.getFullYear();
  if (age < 18) {
    alert('You must be at least 18 years old to register');
    return;
  }

  // Disable submit button and show loading state
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

  try {
    const result = await callRestApi('users/complete-google-profile', 'POST', {
      userId,
      googleToken,
      phone,
      pin,
      birthDate,
      country
    });
    
    if (result.token && result.user) {
      // Save auth data
      sessionStorage.setItem('authToken', result.token);
      sessionStorage.setItem('currentUser', JSON.stringify(result.user));
      
      // Clean up temporary data
      sessionStorage.removeItem('googleToken');
      sessionStorage.removeItem('tempUserId');
      
      // Redirect to main page
      window.location.href = 'main.html';
    } else {
      alert('Something went wrong. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete Registration';
    }
  } catch (error) {
    console.error('Error completing profile:', error);
    alert(`Error: ${error.message || 'An error occurred while completing your profile'}`);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Complete Registration';
  }
}

window.completeProfile = completeProfile;
