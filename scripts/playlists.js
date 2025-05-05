let restrictedUsers = [];

// API URLs
const GRAPHQL_URL = 'http://localhost:4000/graphql';
const REST_API_URL = 'http://localhost:3001/api';

// Function to execute GraphQL queries (GET)
async function executeGraphQLQuery(query, variables) {
  const token = sessionStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: headers,
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

// Function for REST API calls (mutations)
async function callRestApi(endpoint, method, data) {
  const token = sessionStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${REST_API_URL}/${endpoint}`, {
      method: method,
      headers: headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `Error: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('REST API error:', error);
    throw error;
  }
}

async function loadRestrictedUsers() {
  try {
    // Get current user ID from sessionStorage for filtering
    const userJson = sessionStorage.getItem('currentUser');
    let parentUserId = '';
    
    if (userJson) {
      const currentUser = JSON.parse(userJson);
      parentUserId = currentUser.id;
    }
    
    // Use GraphQL to get restricted users (GET)
    const RESTRICTED_USERS_QUERY = `
      query GetRestrictedUsers($parentUserId: ID) {
        restrictedUsers(parentUserId: $parentUserId) {
          id
          name
          avatar
          parentUser
        }
      }
    `;
    
    const result = await executeGraphQLQuery(RESTRICTED_USERS_QUERY, { parentUserId });
    restrictedUsers = result.restrictedUsers;
    
    // Populate the profiles dropdown in the modal
    const profilesSelect = document.getElementById("profiles");
    profilesSelect.innerHTML = '';
    
    restrictedUsers.forEach(user => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = user.name;
      profilesSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading restricted users:", error);
  }
}

async function createPlaylist() {
  const name = document.getElementById("name").value;
  const profilesSelect = document.getElementById("profiles");
  const selectedProfiles = Array.from(profilesSelect.selectedOptions).map(option => option.value);

  // Check empty fields before communicating the API
  if (!name || selectedProfiles.length === 0) {
    alert("Please enter all required fields");
    return;
  }

  // get user ID from sessionStorage
  const userJson = sessionStorage.getItem('currentUser');
  let userId = null;
  if (userJson) {
    const currentUser = JSON.parse(userJson);
    userId = currentUser.id;
  }

  const playlist = { 
    name, 
    profiles: selectedProfiles,
    userId
  };

  try {
    // Use REST API to create playlist (POST)
    const response = await callRestApi("playlists/create", "POST", playlist);

    if (response) {
      alert("Playlist created successfully!");
      const modal = bootstrap.Modal.getInstance(document.getElementById('playlistModal'));
      modal.hide();
      loadPlaylists();
    }
  } catch (error) {
    console.error("Error creating playlist", error);
    alert("Error creating playlist");
  }
}

async function loadPlaylists() {
  try {
    // Get current user ID from sessionStorage
    const userJson = sessionStorage.getItem('currentUser');
    let userId = '';
    
    if (userJson) {
      const currentUser = JSON.parse(userJson);
      userId = currentUser.id;
    }
    
    // Use GraphQL to get playlists (GET)
    const PLAYLISTS_QUERY = `
      query GetPlaylists($userId: ID) {
        playlists(userId: $userId) {
          id
          name
          profiles
          videos {
            id
          }
          parentUser
        }
      }
    `;
    
    const result = await executeGraphQLQuery(PLAYLISTS_QUERY, { userId });
    const playlists = result.playlists;

    const tableBody = document.getElementById("playlistTable");
    tableBody.innerHTML = "";

    playlists.forEach(playlist => { 
      // Get profile names instead of IDs for display
      let profileNames = "";
      
      if (playlist.profiles && Array.isArray(playlist.profiles)) {
        // Handle both populated and unpopulated profiles
        const profileList = playlist.profiles.map(profile => {
          // If profile is an object (populated), use its name
          if (typeof profile === 'object' && profile !== null) {
            return profile.name || 'Unnamed';
          } 
          // If profile is just an ID, find it in restrictedUsers
          else {
            const user = restrictedUsers.find(u => u.id === profile);
            return user ? user.name : 'Unknown';
          }
        });
        profileNames = profileList.join(", ");
      } else {
        profileNames = "No profiles";
      }

      const row = document.createElement("tr");

      // Display everything in the table
      row.innerHTML = `
        <td>${playlist.name}</td>
        <td>${profileNames}</td>
        <td>${playlist.videos ? playlist.videos.length : 0}</td>
        <td>
          <button class="btn btn-info btn-sm" onclick="viewPlaylistVideos('${playlist.id}')">View Videos</button>
          <button class="btn btn-warning btn-sm" onclick="editPlaylist('${playlist.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deletePlaylist('${playlist.id}')">Delete</button>
        </td>
      `;

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error("Error loading playlists:", error);
    const tableBody = document.getElementById("playlistTable");
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center">Error loading playlists: ${error.message}</td></tr>`;
  }
}

function viewPlaylistVideos(playlistId) {
  window.location.href = `playlist-videos.html?id=${playlistId}`;
}

async function editPlaylist(playlistId) {
  try {
    // Use GraphQL to get playlist data (GET)
    const PLAYLIST_QUERY = `
      query GetPlaylist($id: ID!) {
        playlist(id: $id) {
          id
          name
          profiles
        }
      }
    `;
    
    const result = await executeGraphQLQuery(PLAYLIST_QUERY, { id: playlistId });
    const playlist = result.playlist;
    
    // Fill the edit form
    document.getElementById('playlistId').value = playlist.id;
    document.getElementById('name').value = playlist.name;
    
    // Clear previous selections
    const profilesSelect = document.getElementById('profiles');
    Array.from(profilesSelect.options).forEach(option => {
      option.selected = false;
    });
    
    // Select the profiles that are in this playlist
    if (playlist.profiles && Array.isArray(playlist.profiles)) {
      playlist.profiles.forEach(profile => {
        const profileId = typeof profile === 'object' ? profile.id : profile;
        
        // Find and select the option with this profile ID
        Array.from(profilesSelect.options).forEach(option => {
          if (option.value === profileId) {
            option.selected = true;
          }
        });
      });
    }
    
    // Change the modal button to call updatePlaylist
    const saveButton = document.querySelector('#playlistModal .btn-success');
    saveButton.onclick = () => updatePlaylist();
    
    // Change the modal title to indicate editing
    document.getElementById('playlistModalLabel').textContent = 'Edit Playlist';
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('playlistModal'));
    modal.show();
  } catch (error) {
    console.error('Error editing playlist:', error);
    alert('Error loading playlist data for editing');
  }
}

async function updatePlaylist() {
  const playlistId = document.getElementById('playlistId').value;
  const name = document.getElementById('name').value;
  const profilesSelect = document.getElementById('profiles');
  const selectedProfiles = Array.from(profilesSelect.selectedOptions).map(option => option.value);
  
  // Validation
  if (!name || selectedProfiles.length === 0) {
    alert('Please enter a name and select at least one profile');
    return;
  }
  
  try {
    // Use REST API to update playlist (PUT)
    const response = await callRestApi(`playlists/${playlistId}`, 'PUT', { 
      name, 
      profiles: selectedProfiles
    });
    
    if (response) {
      alert('Playlist updated successfully!');
      
      // Close modal and reset it for future use
      const modal = bootstrap.Modal.getInstance(document.getElementById('playlistModal'));
      modal.hide();
      
      // Reset the save button to call createPlaylist
      const saveButton = document.querySelector('#playlistModal .btn-success');
      saveButton.onclick = () => createPlaylist();
      
      // Reset the modal title
      document.getElementById('playlistModalLabel').textContent = 'Add/Edit Playlist';
      
      // Reload playlists to show updated data
      loadPlaylists();
    }
  } catch (error) {
    console.error('Error updating playlist:', error);
    alert(error.message || 'Error updating playlist');
  }
}

async function deletePlaylist(playlistId) {
  if (!confirm("Are you sure you want to delete this playlist?")) {
    return;
  }
  
  try {
    // Use REST API to delete playlist (DELETE)
    const response = await callRestApi(`playlists/${playlistId}`, 'DELETE');
    
    if (response) {
      alert("Playlist deleted successfully!");
      loadPlaylists();
    }
  } catch (error) {
    console.error("Error deleting playlist:", error);
    alert("Error deleting playlist");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Reset the form and modal state when opening the "Add New Playlist" modal
  document.querySelector('[data-bs-target="#playlistModal"]').addEventListener('click', () => {
    document.getElementById('playlistId').value = '';
    document.getElementById('name').value = '';
    
    // Reset profile selections
    const profilesSelect = document.getElementById('profiles');
    Array.from(profilesSelect.options).forEach(option => {
      option.selected = false;
    });
    
    // Reset modal title and save button function
    document.getElementById('playlistModalLabel').textContent = 'Add/Edit Playlist';
    const saveButton = document.querySelector('#playlistModal .btn-success');
    saveButton.onclick = () => createPlaylist();
  });

  loadRestrictedUsers();
  loadPlaylists();
});

window.createPlaylist = createPlaylist;
window.editPlaylist = editPlaylist;
window.deletePlaylist = deletePlaylist;
window.viewPlaylistVideos = viewPlaylistVideos;
window.updatePlaylist = updatePlaylist;
