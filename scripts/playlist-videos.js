let playlistId;
let playlistData;
let availableVideos = [];

document.addEventListener('DOMContentLoaded', function() {
    // Get playlist ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    playlistId = urlParams.get('id');
    
    if (!playlistId) {
        alert('No playlist ID provided');
        window.location.href = 'playlist.html';
        return;
    }
    
    loadPlaylistData();
    loadAvailableVideos();
});

async function loadPlaylistData() {
    try {
        const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}`);
        playlistData = await response.json();
        
        // Set playlist name in header
        document.getElementById('playlistName').textContent = `${playlistData.name} - Videos`;
        
        // Load videos in the playlist
        loadPlaylistVideos();
    } catch (error) {
        console.error('Error loading playlist data:', error);
        alert('Error loading playlist data');
    }
}

async function loadPlaylistVideos() {
    try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}/videos?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
        const videos = await response.json();
        
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
                        <button class="btn btn-danger btn-sm" onclick="removeVideoFromPlaylist('${video._id}')">
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

async function loadAvailableVideos() {
    try {
        const response = await fetch('http://localhost:3001/api/videos');
        availableVideos = await response.json();
        
        const videoSelect = document.getElementById('videoSelect');
        videoSelect.innerHTML = '<option value="">-- Select an existing video --</option>';
        
        availableVideos.forEach(video => {
            const option = document.createElement('option');
            option.value = video._id;
            option.textContent = video.name;
            videoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading available videos:', error);
    }
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
        return match[2];
    }
    
    return 'error';
}

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
        // Show loading indicator
        document.getElementById('videosContainer').innerHTML = 
            '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p>Adding video to playlist...</p></div>';
        
        let videoId;
        
        // If adding a new video
        if (newVideoName && newVideoUrl) {
            const newVideoResponse = await fetch('http://localhost:3001/api/videos/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newVideoName,
                    url: newVideoUrl,
                    description: newVideoDescription
                })
            });
            
            if (!newVideoResponse.ok) {
                const error = await newVideoResponse.json();
                throw new Error(error.error || 'Error creating video');
            }
            
            const newVideo = await newVideoResponse.json();
            videoId = newVideo.videoId;
        } else {
            videoId = selectedVideoId;
        }
        
        // Add video to playlist
        const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}/videos`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache' 
            },
            body: JSON.stringify({ videoId })
        });
        
        if (response.ok) {
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addVideoModal'));
            modal.hide();
            
            document.getElementById('videoSelect').value = '';
            document.getElementById('newVideoName').value = '';
            document.getElementById('newVideoUrl').value = '';
            document.getElementById('newVideoDescription').value = '';
            
            // Simple solution: Force page reload
            alert('Video added to playlist successfully! Refreshing page...');
            window.location.reload();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error adding video to playlist');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'An error occurred');
    }
}

async function removeVideoFromPlaylist(videoId) {
    if (!confirm('Are you sure you want to remove this video from the playlist?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}/videos/${videoId}`, {
            method: 'DELETE',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            alert('Video removed from playlist successfully!');
            // Refresh the page to show changes
            window.location.reload();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error removing video from playlist');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'An error occurred');
    }
}

// Make these functions available globally
window.addVideoToPlaylist = addVideoToPlaylist;
window.removeVideoFromPlaylist = removeVideoFromPlaylist;
