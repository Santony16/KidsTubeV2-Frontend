// GraphQL endpoint
const GRAPHQL_URL = 'http://localhost:4000/graphql';

// GraphQL complete profile mutation
const COMPLETE_PROFILE_MUTATION = `
  mutation CompleteGoogleProfile(
    $userId: ID!,
    $googleToken: String!,
    $phone: String!,
    $pin: String!,
    $birthDate: String!,
    $country: String!
  ) {
    completeGoogleProfile(
      userId: $userId,
      googleToken: $googleToken,
      phone: $phone,
      pin: $pin,
      birthDate: $birthDate,
      country: $country
    ) {
      token
      userId
      message
      user {
        id
        email
        firstName
        lastName
        phone
        country
      }
    }
  }
`;

// Function to execute GraphQL mutation
async function executeGraphQLMutation(mutation, variables) {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
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

// Load countries from GraphQL instead of direct API call
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
    
    const result = await executeGraphQLMutation(COUNTRIES_QUERY, {});
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
// and load country data when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const googleToken = localStorage.getItem('googleToken');
  const userId = localStorage.getItem('tempUserId');
  
  if (!googleToken || !userId) {
    alert('Google authentication information is missing. Please log in again.');
    window.location.href = '../index.html';
  }
  
  // Load countries from GraphQL API
  loadCountries();
});

// Complete the user profile
async function completeProfile() {
  const googleToken = localStorage.getItem('googleToken');
  const userId = localStorage.getItem('tempUserId');
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
    // Call GraphQL mutation to complete the profile
    const result = await executeGraphQLMutation(COMPLETE_PROFILE_MUTATION, {
      userId,
      googleToken,
      phone,
      pin,
      birthDate,
      country
    });

    const profileResult = result.completeGoogleProfile;
    
    if (profileResult.token && profileResult.user) {
      // Save auth data
      localStorage.setItem('authToken', profileResult.token);
      localStorage.setItem('currentUser', JSON.stringify(profileResult.user));
      
      // Clean up temporary data
      localStorage.removeItem('googleToken');
      localStorage.removeItem('tempUserId');
      
      // Redirect to main page
      window.location.href = 'main.html';
    } else {
      alert('Something went wrong. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete Registration';
    }
  } catch (error) {
    alert(`Error: ${error.message || 'An error occurred while completing your profile'}`);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Complete Registration';
  }
}

window.completeProfile = completeProfile;
