let userId;
let userPlaylists = [];
let allVideos = [];

// URLs de API
const GRAPHQL_URL = 'http://localhost:4000/graphql';
const REST_API_URL = 'http://localhost:3001/api';

// Function to execute GraphQL queries (only for GET queries)
async function executeGraphQLQuery(query, variables, token = null) {
  try {
    if (!token) {
      token = sessionStorage.getItem('authToken');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('GraphQL Query to be executed:', query.trim());
    console.log('Variables:', variables);
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        query: query,
        variables: variables
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('GraphQL Response:', result);
    
    if (result.errors) {
      console.error('GraphQL returned errors:', result.errors);
      throw new Error(result.errors[0].message || 'Unknown GraphQL error');
    }
    
    return result.data;
  } catch (error) {
    console.error('GraphQL error:', error);
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', function() {
    // Get userId from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    userId = urlParams.get('userId');
    
    if (!userId) {
        alert('User ID is missing. Redirecting to home page.');
        window.location.href = 'main.html';
        return;
    }
    
    loadUserPlaylists();
    
    // Set up search input to trigger on Enter key
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchVideos();
        }
    });
});

async function loadUserPlaylists() {
    try {
        // Usar GraphQL para obtener playlists (GET)
        const PLAYLISTS_QUERY = `
          query GetPlaylistsByUser($userId: ID!) {
            playlistsByUser(userId: $userId) {
              id
              name
              videos {
                id
                name
                url
                description
                userId
              }
            }
          }
        `;
        
        const token = sessionStorage.getItem('authToken');
        const result = await executeGraphQLQuery(PLAYLISTS_QUERY, { userId }, token);
        const playlists = result.playlistsByUser;
        
        userPlaylists = playlists;
        
        const playlistsContainer = document.getElementById('playlistsContainer');
        
        if (playlists.length === 0) {
            playlistsContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No playlists available for this user.</div></div>';
            return;
        }
        
        playlistsContainer.innerHTML = '';
        
        playlists.forEach(playlist => {
            const playlistCard = document.createElement('div');
            playlistCard.className = 'col-md-4 col-sm-6 mb-4';
            playlistCard.innerHTML = `
                <div class="playlist-card" onclick="showPlaylistVideos('${playlist.id}', '${playlist.name}')">
                    <div class="playlist-header">
                        <h5>${playlist.name}</h5>
                    </div>
                    <div class="playlist-body">
                        <p>Total Videos: ${playlist.videos?.length || 0}</p>
                    </div>
                </div>
            `;
            
            playlistsContainer.appendChild(playlistCard);
        });
    } catch (error) {
        console.error('Error loading playlists:', error);
        document.getElementById('playlistsContainer').innerHTML = 
            '<div class="col-12"><div class="alert alert-danger">An error occurred while loading playlists.</div></div>';
    }
}

async function showPlaylistVideos(playlistId, playlistName) {
    try {
        // Usar GraphQL para obtener videos de una playlist (GET)
        const PLAYLIST_VIDEOS_QUERY = `
          query GetPlaylistVideos($id: ID!) {
            playlist(id: $id) {
              videos {
                id
                name
                url
                description
                userId
              }
            }
          }
        `;
        
        const token = sessionStorage.getItem('authToken');
        const result = await executeGraphQLQuery(PLAYLIST_VIDEOS_QUERY, { id: playlistId }, token);
        const videos = result.playlist.videos || [];
        
        // Cache all videos for search functionality
        allVideos = [...allVideos, ...videos.filter(video => 
            !allVideos.some(v => v.id === video.id)
        )];
        
        document.getElementById('currentPlaylistName').textContent = playlistName;
        
        const videosContainer = document.getElementById('videosContainer');
        
        if (videos.length === 0) {
            videosContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No videos in this playlist.</div></div>';
        } else {
            videosContainer.innerHTML = '';
            
            videos.forEach(video => {
                videosContainer.appendChild(createVideoCard(video));
            });
        }
        
        // Hide playlists view, show videos view
        document.getElementById('playlistsView').style.display = 'none';
        document.getElementById('videosView').style.display = 'block';
        document.getElementById('searchResultsView').style.display = 'none';
    } catch (error) {
        console.error('Error loading videos:', error);
        alert('An error occurred while loading videos');
    }
}

// El resto de funciones permanecen sin cambios
function createVideoCard(video) {
    const videoId = extractYouTubeId(video.url);
    
    const videoElement = document.createElement('div');
    videoElement.className = 'col-md-6 col-lg-4';
    videoElement.innerHTML = `
        <div class="video-card">
            <div class="video-thumbnail">
                <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
            </div>
            <div class="video-info">
                <h5>${video.name}</h5>
                <p>${video.description || 'No description available'}</p>
            </div>
        </div>
    `;
    
    return videoElement;
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
        return match[2];
    }
    
    return 'error';
}

function showPlaylists() {
    document.getElementById('playlistsView').style.display = 'block';
    document.getElementById('videosView').style.display = 'none';
    document.getElementById('searchResultsView').style.display = 'none';
}

function searchVideos() {
    // Búsqueda en la caché local en lugar de hacer petición
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (!searchTerm) {
        alert('Please enter a search term');
        return;
    }
    
    // Filter videos based on search term
    const results = allVideos.filter(video => 
        video.name.toLowerCase().includes(searchTerm) || 
        (video.description && video.description.toLowerCase().includes(searchTerm))
    );
    
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    
    if (results.length === 0) {
        searchResultsContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No videos found matching your search.</div></div>';
    } else {
        searchResultsContainer.innerHTML = '';
        
        results.forEach(video => {
            searchResultsContainer.appendChild(createVideoCard(video));
        });
    }
    
    // Show search results view
    document.getElementById('playlistsView').style.display = 'none';
    document.getElementById('videosView').style.display = 'none';
    document.getElementById('searchResultsView').style.display = 'block';
}
