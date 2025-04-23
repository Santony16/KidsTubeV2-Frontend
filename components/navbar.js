/**
 * Inserts the navbar into the element with id "navbar-placeholder"
 * Include this script in any page that needs the navbar
 */
document.addEventListener('DOMContentLoaded', function() {
    loadNavbar();
});

function loadNavbar() {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (!navbarPlaceholder) {
        console.error('No navbar placeholder found. Add <div id="navbar-placeholder"></div> to your HTML.');
        return;
    }
    
    // Get the current page name to highlight active link
    const currentPage = window.location.pathname.split('/').pop();
    
    // Generate navbar HTML
    const navbarHtml = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="main.html">KidsTube</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <span class="nav-link" id="userWelcome">Welcome</span>
                    </li>
                </ul>
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link btn btn-primary text-white mx-1 ${currentPage === 'main.html' ? 'active' : ''}" 
                           href="main.html">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link btn btn-primary text-white mx-1 ${currentPage === 'restricted-users.html' ? 'active' : ''}" 
                           href="restricted-users.html">Users</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link btn btn-primary text-white mx-1 ${currentPage === 'playlist.html' ? 'active' : ''}" 
                           href="playlist.html">Playlists</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link btn btn-primary text-white mx-1 ${currentPage === 'videos.html' ? 'active' : ''}" 
                           href="videos.html">Videos</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link btn btn-danger text-white mx-1" href="../index.html" onclick="logout()">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `;
    
    // Insert the navbar
    navbarPlaceholder.innerHTML = navbarHtml;
    
    // Update welcome message with user info
    updateWelcomeMessage();
}

function updateWelcomeMessage() {
    const welcomeElement = document.getElementById('userWelcome');
    if (welcomeElement) {
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            const currentUser = JSON.parse(userJson);
            welcomeElement.textContent = `Welcome, ${currentUser.email}`;
        }
    }
}

// Make sure the logout function is available globally
window.logout = function() {
    localStorage.removeItem('currentUser');
};
