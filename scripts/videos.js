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
  const userJson = localStorage.getItem('currentUser');
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
// Load the videos into the table
async function loadVideos() {
  try {
    // Get the current user ID from localStorage
    const userJson = localStorage.getItem('currentUser');
    let userId = '';
    
    if (userJson) {
      const currentUser = JSON.parse(userJson);
      userId = currentUser.id;
    }
    
    // Add timestamp and user ID to prevent caching and filter by user
    const timestamp = new Date().getTime();
    
    // Add auth headers
    const fetchOptions = addAuthHeader({
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const response = await fetch(`http://localhost:3001/api/videos?userId=${userId}&_=${timestamp}`, fetchOptions);

    const videos = await response.json();

    const tableBody = document.getElementById("videoTable");
    tableBody.innerHTML = "";

    videos.forEach(video => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${video.name}</td>
        <td><a href="${video.url}" target="_blank">${video.url}</a></td>
        <td>${video.description || "No description"}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editVideo('${video._id}', '${video.name}', '${video.url}', '${video.description}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteVideo('${video._id}')">Delete</button>
        </td>
      `;

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading videos:", error);
  }
}


// Delete a video
async function deleteVideo(videoId) {
  if (!confirm("Are you sure you want to delete this video?")) return;

  // Communicating with API
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


document.addEventListener("DOMContentLoaded", loadVideos);
document.querySelector("#videoForm").addEventListener("submit", saveVideo);

window.video = addNewVideo;
