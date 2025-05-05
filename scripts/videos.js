// Function to open the modal in add edit video mode
function editVideo(videoId, name, url, description) {
  document.getElementById("videoId").value = videoId;
  document.getElementById("videoName").value = name;
  document.getElementById("videoUrl").value = url;
  document.getElementById("videoDescription").value = description;

  // Change the title of the modal to "Edit Video"
  document.getElementById("videoModalLabel").textContent = "Edit Video";

  // Show edit modal
  const videoModal = new bootstrap.Modal(document.getElementById("videoModal"));
  videoModal.show();
}

// Function to open the modal in add new video mode
function addNewVideo() {
  // Clear form fields before create a new video
  document.getElementById("videoId").value = '';
  document.getElementById("videoName").value = '';
  document.getElementById("videoUrl").value = '';
  document.getElementById("videoDescription").value = '';

  // Change the title of the modal to "Add Video"
  document.getElementById("videoModalLabel").textContent = "Add Video";

  // Show the add new video modal
  const videoModal = new bootstrap.Modal(document.getElementById("videoModal"));
  videoModal.show();
}

// Function to save changes to an existing video or create a new one
async function saveVideo() {
  const videoId = document.getElementById("videoId").value.trim();
  const name = document.getElementById("videoName").value.trim();
  const url = document.getElementById("videoUrl").value.trim();
  const description = document.getElementById("videoDescription").value.trim();

  // Check fields
  if (!name || !url || !description) {
      alert("Please fill in all required fields.");
      return;
  }

  // Get current user ID
  const userJson = sessionStorage.getItem('currentUser');
  let userId = null;
  
  if (userJson) {
    const currentUser = JSON.parse(userJson);
    userId = currentUser.id;
  }

  const videoData = { 
    name, 
    url, 
    description,
    userId // Add the user ID to associate this video with the current user
  };

  try {
      let response;
      let result;

      // Add auth headers
      const fetchOptions = addAuthHeader({
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoData)
      });

      // If exist an id, edit the video
      if (videoId) {
          response = await fetch(`http://localhost:3001/api/videos/${videoId}`, {
              method: "PUT",
              ...fetchOptions
          });
          result = await response.json();

          if (response.ok) {
              alert("Video updated successfully!");
          } else {
              alert(`Error updating video: ${result.error}`);
          }
      } else {
          // Create new video
          response = await fetch("http://localhost:3001/api/videos/create", {
              method: "POST",
              ...fetchOptions
          });
          result = await response.json();

          if (response.ok) {
              alert("Video created successfully!");
          } else {
              alert(`Error creating video: ${result.error}`);
          }
      }

      // Close the modal and reload the page to reflect changes
      const videoModal = bootstrap.Modal.getInstance(document.getElementById("videoModal"));
      videoModal.hide();
      window.location.reload();
  } catch (error) {
      console.error("Error saving video:", error);
      alert("Error saving video.");
  }
}

// Helper function to execute GraphQL queries
async function executeGraphQLQuery(query, variables) {
  const token = sessionStorage.getItem('authToken');
  
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
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
    console.error('GraphQL query error:', error);
    throw error;
  }
}

// Load the videos using GraphQL instead of REST API
async function loadVideos() {
  try {
    // Get the current user ID from sessionStorage
    const userJson = sessionStorage.getItem('currentUser');
    let userId = '';
    
    if (userJson) {
      const currentUser = JSON.parse(userJson);
      userId = currentUser.id;
    }
    
    // Use GraphQL to fetch videos
    const VIDEOS_QUERY = `
      query GetVideos($userId: ID) {
        videos(userId: $userId) {
          id
          name
          url
          description
          userId
        }
      }
    `;
    
    const data = await executeGraphQLQuery(VIDEOS_QUERY, { userId });
    
    if (!data || !data.videos) {
      throw new Error('Failed to retrieve videos data');
    }
    
    const videos = data.videos;
    console.log('Successfully loaded videos via GraphQL:', videos.length);
    
    const tableBody = document.getElementById("videoTable");
    tableBody.innerHTML = "";

    videos.forEach(video => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${video.name}</td>
        <td><a href="${video.url}" target="_blank">${video.url}</a></td>
        <td>${video.description || "No description"}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editVideo('${video.id}', '${video.name}', '${video.url}', '${video.description || ''}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteVideo('${video.id}')">Delete</button>
        </td>
      `;

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading videos:", error);
    const tableBody = document.getElementById("videoTable");
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center">Error loading videos: ${error.message}</td></tr>`;
  }
}

// Delete a video
async function deleteVideo(videoId) {
  if (!confirm("Are you sure you want to delete this video?")) return;

  try {
    // Add auth headers
    const fetchOptions = addAuthHeader({
      method: "DELETE"
    });
    
    const response = await fetch(`http://localhost:3001/api/videos/${videoId}`, fetchOptions);

    if (response.ok) {
      alert("Video deleted successfully!");
      window.location.reload();
    } else {
      const result = await response.json();
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Error deleting video:", error);
    alert("Error deleting video.");
  }
}

// Add YouTube search functions
let youtubeSearchResults = [];
const GRAPHQL_URL = 'http://localhost:4000/graphql';

// Function to perform YouTube search via GraphQL
async function searchYouTubeVideos() {
  const searchInput = document.getElementById('youtubeSearchInput').value.trim();
  
  if (!searchInput) {
    alert('Please enter a search term');
    return;
  }
  
  try {
    document.getElementById('youtubeSearchResults').innerHTML = 
      '<div class="text-center"><div class="spinner-border" role="status"></div><p>Searching YouTube...</p></div>';
    
    const token = sessionStorage.getItem('authToken');
    const YOUTUBE_SEARCH_QUERY = `
      query SearchYouTube($query: String!) {
        youtubeSearch(query: $query) {
          id
          title
          description
          thumbnailUrl
          channelTitle
        }
      }
    `;
    
    console.log('Executing YouTube search with query:', searchInput);
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        query: YOUTUBE_SEARCH_QUERY,
        variables: { query: searchInput }
      })
    });
    
    // Check response status before processing JSON
    if (!response.ok) {
      const text = await response.text();
      console.error('GraphQL server error response:', text);
      throw new Error(`Server error: ${response.status}. Please try again later.`);
    }
    
    const result = await response.json();
    console.log('GraphQL response:', result);
    
    // More detailed error handling
    if (result.errors) {
      const errorMsg = result.errors[0].message;
      console.error('GraphQL error details:', result.errors);
      
      // Check for specific API key errors
      if (errorMsg.includes('API key') || errorMsg.includes('API configuration')) {
        throw new Error('YouTube API configuration error. Please contact support.');
      }
      
      throw new Error(errorMsg || 'GraphQL Error');
    }
    
    if (!result.data || !result.data.youtubeSearch) {
      console.error('Unexpected GraphQL response format:', result);
      throw new Error('Invalid response format');
    }
    
    youtubeSearchResults = result.data.youtubeSearch;
    
    // Display results
    displayYouTubeResults(youtubeSearchResults);
    
    // Show the search results section
    document.getElementById('videoSection').style.display = 'none';
    document.getElementById('youtubeSearchSection').style.display = 'block';
    
  } catch (error) {
    console.error('Error searching YouTube:', error);
    document.getElementById('youtubeSearchResults').innerHTML = 
      `<div class="alert alert-danger">
        <h4>Search Error</h4>
        <p>${error.message || 'Failed to search YouTube'}</p>
        <p>Please try again or contact support if the problem persists.</p>
      </div>`;
  }
}

// Function to display YouTube search results
function displayYouTubeResults(results) {
  const resultsContainer = document.getElementById('youtubeSearchResults');
  
  if (!results || results.length === 0) {
    resultsContainer.innerHTML = '<div class="alert alert-info">No videos found matching your search.</div>';
    return;
  }
  
  resultsContainer.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'row';
  
  results.forEach((video) => {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-3';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${video.thumbnailUrl}" class="card-img-top" alt="${video.title}">
        <div class="card-body">
          <h6 class="card-title">${video.title}</h6>
          <p class="card-text small">${video.channelTitle}</p>
        </div>
        <div class="card-footer bg-transparent border-top-0">
          <button class="btn btn-primary btn-sm" onclick="addYouTubeVideo('${video.id}', '${encodeURIComponent(video.title)}', '${encodeURIComponent(video.description || '')}')">
            Add Video
          </button>
        </div>
      </div>
    `;
    
    row.appendChild(col);
  });
  
  resultsContainer.appendChild(row);
}

// Function to add a YouTube video from search results
async function addYouTubeVideo(videoId, titleEncoded, descriptionEncoded) {
  try {
    const title = decodeURIComponent(titleEncoded);
    const description = decodeURIComponent(descriptionEncoded);
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Get the current user ID
    const currentUserJson = sessionStorage.getItem('currentUser');
    let userId = '';
    
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      userId = currentUser.id;
    }
    
    // Create video using REST API
    const response = await fetch('http://localhost:3001/api/videos/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        name: title,
        url: url,
        description: description,
        userId: userId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to add video');
    }
    
    alert('Video added successfully!');
    
    // Return to videos list and refresh
    document.getElementById('youtubeSearchSection').style.display = 'none';
    document.getElementById('videoSection').style.display = 'block';
    loadVideos();
    
  } catch (error) {
    console.error('Error adding video:', error);
    alert(`Error adding video: ${error.message}`);
  }
}

// Function to show all videos and hide search section
function showAllVideos() {
  document.getElementById('youtubeSearchSection').style.display = 'none';
  document.getElementById('videoSection').style.display = 'block';
}

// Add these functions to the global scope
window.searchYouTubeVideos = searchYouTubeVideos;
window.addYouTubeVideo = addYouTubeVideo;
window.showAllVideos = showAllVideos;

document.addEventListener("DOMContentLoaded", loadVideos);
document.querySelector("#videoForm").addEventListener("submit", saveVideo);

window.video = addNewVideo;

document.addEventListener('DOMContentLoaded', function() {
  // Add event listener for YouTube search
  const searchButton = document.getElementById('youtubeSearchButton');
  if (searchButton) {
    searchButton.addEventListener('click', searchYouTubeVideos);
  }
  
  // Add event listener for search input to trigger search on Enter key
  const searchInput = document.getElementById('youtubeSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchYouTubeVideos();
      }
    });
  }
});
