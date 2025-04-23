let restrictedUsers = [];

async function loadRestrictedUsers() {
  try {
    // Get current user ID from localStorage for filtering
    const userJson = localStorage.getItem('currentUser');
    let parentUserId = '';
    
    if (userJson) {
      const currentUser = JSON.parse(userJson);
      parentUserId = currentUser.id;
    }
    
    const response = await fetch(`http://localhost:3001/api/users/restricted?parentUserId=${parentUserId}`);
    restrictedUsers = await response.json();
    
    // Populate the profiles dropdown in the modal
    const profilesSelect = document.getElementById("profiles");
    profilesSelect.innerHTML = '';
    
    restrictedUsers.forEach(user => {
      const option = document.createElement("option");
      option.value = user._id;
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

  // get user ID from localStorage
  const userJson = localStorage.getItem('currentUser');
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
    const response = await fetch("http://localhost:3001/api/playlists/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(playlist)
    });

    const result = await response.json();

    if (response.ok) {
      alert("Playlist created successfully!");
      const modal = bootstrap.Modal.getInstance(document.getElementById('playlistModal'));
      modal.hide();
      loadPlaylists();
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Error creating playlist", error);
    alert("Error creating playlist");
  }
}

async function loadPlaylists() {
  try {
    // Get current user ID from localStorage
    const userJson = localStorage.getItem('currentUser');
    let userId = '';
    
    if (userJson) {
      const currentUser = JSON.parse(userJson);
      userId = currentUser.id;
    }
    
    // Pass userId as query parameter to fetch only playlists for this user
    const response = await fetch(`http://localhost:3001/api/playlists?userId=${userId}`);
    const playlists = await response.json();

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
            const user = restrictedUsers.find(u => u._id === profile);
            return user ? user.name : 'Unknown';
          }
        });
        profileNames = profileList.join(", ");
      } else {
        profileNames = "No profiles";
      }

      const row = document.createElement("tr");

      // Show all on the table
      row.innerHTML = `
        <td>${playlist.name}</td>
        <td>${profileNames}</td>
        <td>${playlist.videos ? playlist.videos.length : 0}</td>
        <td>
          <button class="btn btn-info btn-sm" onclick="viewPlaylistVideos('${playlist._id}')">View Videos</button>
          <button class="btn btn-warning btn-sm" onclick="editPlaylist('${playlist._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deletePlaylist('${playlist._id}')">Delete</button>
        </td>
      `;

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error("Error loading playlists:", error);
  }
}

function viewPlaylistVideos(playlistId) {
  window.location.href = `playlist-videos.html?id=${playlistId}`;
}

async function editPlaylist(playlistId) {
  try {
    // Fetch the playlist data
    const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch playlist data');
    }
    
    const playlist = await response.json();
    
    // Fill in the edit form
    document.getElementById('playlistId').value = playlist._id;
    document.getElementById('name').value = playlist.name;
    
    // Clear previous selections
    const profilesSelect = document.getElementById('profiles');
    Array.from(profilesSelect.options).forEach(option => {
      option.selected = false;
    });
    
    // Select the profiles that are in this playlist
    if (playlist.profiles && Array.isArray(playlist.profiles)) {
      playlist.profiles.forEach(profile => {
        const profileId = typeof profile === 'object' ? profile._id : profile;
        
        // Find and select the option with this profile ID
        Array.from(profilesSelect.options).forEach(option => {
          if (option.value === profileId) {
            option.selected = true;
          }
        });
      });
    }
    
    // Change the modal's save button to call updatePlaylist instead
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
    const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        profiles: selectedProfiles
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update playlist');
    }
    
    alert('Playlist updated successfully!');
    
    // Close modal and reset modal for future use
    const modal = bootstrap.Modal.getInstance(document.getElementById('playlistModal'));
    modal.hide();
    
    // Reset the save button to call createPlaylist
    const saveButton = document.querySelector('#playlistModal .btn-success');
    saveButton.onclick = () => createPlaylist();
    
    // Reset the modal title
    document.getElementById('playlistModalLabel').textContent = 'Add/Edit Playlist';
    
    // Reload playlists to show updated data
    loadPlaylists();
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
    const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}`, {
      method: "DELETE"
    });
    
    if (response.ok) {
      alert("Playlist deleted successfully!");
      loadPlaylists();
    } else {
      const result = await response.json();
      alert(`Error: ${result.error}`);
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
