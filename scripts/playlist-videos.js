let playlistId;
let playlistData;
let availableVideos = [];
let youtubeSearchResults = [];

// API URLs
const GRAPHQL_URL = 'http://localhost:4000/graphql';
const REST_API_URL = 'http://localhost:3001/api';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Ensure this is set in your environment variables

// Helper functions for API calls
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
            body: JSON.stringify({ query, variables })
        });

        const result = await response.json();
        if (result.errors) throw new Error(result.errors[0].message);
        return result.data;
    } catch (error) {
        console.error('GraphQL error:', error);
        throw error;
    }
}
// Function to execute REST API calls (for POST/PUT/DELETE operations)
async function callRestApi(endpoint, method, data) {
    const token = sessionStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${REST_API_URL}/${endpoint}`, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Error: ${response.status}`);
        return result;
    } catch (error) {
        console.error('REST API error:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    playlistId = urlParams.get('id');
    
    if (!playlistId) {
        alert('No playlist ID provided');
        window.location.href = 'playlist.html';
        return;
    }
    
    loadPlaylistData();
    loadAvailableVideos();
    
    document.getElementById('youtubeSearchButton').addEventListener('click', searchYouTubeVideos);
    document.getElementById('youtubeQuery').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchYouTubeVideos();
    });
});
// Function to load playlist data
async function loadPlaylistData() {
    try {
        const PLAYLIST_QUERY = `
            query GetPlaylist($id: ID!) {
                playlist(id: $id) {
                    id
                    name
                    profiles
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
        
        const result = await executeGraphQLQuery(PLAYLIST_QUERY, { id: playlistId });
        playlistData = result.playlist;
        document.getElementById('playlistName').textContent = `${playlistData.name} - Videos`;
        loadPlaylistVideos();
    } catch (error) {
        console.error('Error loading playlist data:', error);
        alert('Error loading playlist data');
    }
}
// Function to load videos in the playlist
async function loadPlaylistVideos() {
    try {
        const videos = playlistData.videos || [];
        const videosContainer = document.getElementById('videosContainer');
        const noVideosMessage = document.getElementById('noVideosMessage');
        
        if (videos.length === 0) {
            noVideosMessage.style.display = 'block';
            videosContainer.innerHTML = '';
            return;
        }
        
        noVideosMessage.style.display = 'none';
        videosContainer.innerHTML = '';
        
        videos.forEach(video => {
            const videoId = extractYouTubeId(video.url);
            const videoCol = document.createElement('div');
            videoCol.className = 'col-md-4 mb-4';
            videoCol.innerHTML = `
                <div class="card">
                    <div class="ratio ratio-16x9">
                        <iframe src="https://www.youtube.com/embed/${videoId}" title="${video.name}" allowfullscreen></iframe>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${video.name}</h5>
                        <p class="card-text">${video.description || 'No description'}</p>
                        <button class="btn btn-danger btn-sm" onclick="removeVideoFromPlaylist('${video.id}')">
                            Remove from Playlist
                        </button>
                    </div>
                </div>
            `;
            videosContainer.appendChild(videoCol);
        });
    } catch (error) {
        console.error('Error loading playlist videos:', error);
        alert('Error loading playlist videos');
    }
}
// Function to load available videos for selection
async function loadAvailableVideos() {
    try {
        const VIDEOS_QUERY = `
            query GetAllVideos {
                videos {
                    id
                    name
                }
            }
        `;
        
        const result = await executeGraphQLQuery(VIDEOS_QUERY, {});
        availableVideos = result.videos;
        
        const videoSelect = document.getElementById('videoSelect');
        videoSelect.innerHTML = '<option value="">-- Select an existing video --</option>';
        
        availableVideos.forEach(video => {
            const option = document.createElement('option');
            option.value = video.id;
            option.textContent = video.name;
            videoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading available videos:', error);
    }
}
// Function to extract YouTube video ID from URL
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : 'error';
}
// Function to search YouTube videos using GraphQL
async function searchYouTubeVideos() {
    const query = document.getElementById('youtubeQuery').value.trim();
    if (!query) {
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
        
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query: YOUTUBE_SEARCH_QUERY, variables: { query } })
        });
        
        const result = await response.json();
        if (result.errors) throw new Error(result.errors[0].message || 'GraphQL Error');
        youtubeSearchResults = result.data.youtubeSearch;
        displayYouTubeResults(youtubeSearchResults);
    } catch (error) {
        console.error('Error searching YouTube:', error);
        document.getElementById('youtubeSearchResults').innerHTML = 
            `<div class="alert alert-danger">Error: ${error.message || 'Failed to search YouTube'}</div>`;
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
                    <button class="btn btn-primary btn-sm w-100" onclick="selectYouTubeVideo('${video.id}', '${video.title.replace(/'/g, "\\'")}')">
                        Select Video
                    </button>
                </div>
            </div>
        `;
        row.appendChild(col);
    });
    
    resultsContainer.appendChild(row);
}
// Function to select a YouTube video and fill the form
function selectYouTubeVideo(videoId, title) {
    document.getElementById('newVideoName').value = title;
    document.getElementById('newVideoUrl').value = `https://www.youtube.com/watch?v=${videoId}`;
    const formTab = document.querySelector('#addVideoModal .nav-link[href="#videoFormTab"]');
    bootstrap.Tab.getOrCreateInstance(formTab).show();
    alert(`Video "${title}" selected. Complete the form to add it to the playlist.`);
}
// Function to add a video to the playlist
async function addVideoToPlaylist() {
    const selectedVideoId = document.getElementById('videoSelect').value;
    const newVideoName = document.getElementById('newVideoName').value.trim();
    const newVideoUrl = document.getElementById('newVideoUrl').value.trim();
    const newVideoDescription = document.getElementById('newVideoDescription').value.trim();
    
    if (!selectedVideoId && (!newVideoName || !newVideoUrl)) {
        alert('Please either select an existing video or enter details for a new video');
        return;
    }
    
    try {
        document.getElementById('videosContainer').innerHTML = 
            '<div class="col-12 text-center"><div class="spinner-border" role="status"></div><p>Adding video to playlist...</p></div>';
        
        let videoId;
        if (newVideoName && newVideoUrl) {
            const newVideoResponse = await callRestApi('videos/create', 'POST', {
                name: newVideoName,
                url: newVideoUrl,
                description: newVideoDescription
            });
            videoId = newVideoResponse.videoId;
        } else {
            videoId = selectedVideoId;
        }
        
        const response = await callRestApi(`playlists/${playlistId}/videos`, 'POST', { videoId });
        if (response) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addVideoModal'));
            modal.hide();
            document.getElementById('videoSelect').value = '';
            document.getElementById('newVideoName').value = '';
            document.getElementById('newVideoUrl').value = '';
            document.getElementById('newVideoDescription').value = '';
            alert('Video added to playlist successfully! Refreshing page...');
            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'An error occurred');
    }
}
// Function to remove a video from the playlist
async function removeVideoFromPlaylist(videoId) {
    if (!confirm('Are you sure you want to remove this video from the playlist?')) return;
    
    try {
        const response = await callRestApi(`playlists/${playlistId}/videos/${videoId}`, 'DELETE');
        if (response) {
            alert('Video removed from playlist successfully!');
            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'An error occurred');
    }
}

// Make these functions available globally
window.addVideoToPlaylist = addVideoToPlaylist;
window.removeVideoFromPlaylist = removeVideoFromPlaylist;
