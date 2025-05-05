# KidsTube - Frontend

KidsTube is a web application designed to provide a safe and controlled YouTube viewing experience for children. This repository contains the frontend interface of the application.

## About KidsTube

In today's digital world, children have unprecedented access to online content, particularly videos. While platforms like YouTube offer a wealth of educational and entertaining content, they also present risks in terms of age-inappropriate material. KidsTube addresses this challenge by creating a curated environment where parents maintain control over what their children watch.

### The Problem KidsTube Solves

Standard video platforms like YouTube present several challenges for parents:
- Difficulty monitoring what children are watching
- Algorithmically recommended videos that may be inappropriate
- Easy access to unsuitable content through related videos
- Limited parental controls for specific content filtering

### Our Solution

KidsTube creates a "walled garden" approach where:
- Parents create dedicated profiles for their children
- All video content is pre-approved by parents
- Children can only access videos within playlists created for them
- PIN protection ensures children stay within their designated profiles
- Search functionality is limited to approved content only

This approach gives parents peace of mind while still allowing children the joy of video discovery within safe boundaries.

## Dual-API Integration

The KidsTube frontend integrates with two complementary backend services:

1. **REST API** (KidsTubeV2-Backend): Used for:
   - User authentication and registration
   - Write operations (POST, PUT, DELETE)
   - Resource creation, updating, and deletion

2. **GraphQL API** (KidsTubeV2-GraphQL): Used EXCLUSIVELY for:
   - Read operations (GET)
   - Listing Profiles (restrictedUsers)
   - Listing Videos
   - Listing Playlists
   - Video Search

This hybrid approach follows a strict separation of concerns:
- REST for all data modification operations
- GraphQL only for data retrieval operations

### API Usage Guidelines

- Use GraphQL ONLY for these specific GET operations:
  - Fetching lists of restricted users/profiles
  - Fetching lists of videos
  - Fetching lists of playlists
  - Searching for videos

- Use REST API for ALL other operations:
  - Authentication flows
  - All create/update/delete operations
  - Any operation that modifies data

## Overview

The frontend provides interfaces for two types of users:
1. **Parents/Administrators**: Manage child profiles, videos, and playlists
2. **Children (Restricted Users)**: Access personalized, parent-approved content

## Features

- User authentication and profile management
- Restricted user (child) profile creation with avatar selection
- PIN protection for both admin and restricted user access
- Video management interface
- Playlist creation and management
- Restricted user interface for safe video browsing and watching
- Search functionality within approved content

## Tech Stack

- HTML5, CSS3, JavaScript
- Bootstrap 5 for responsive design
- YouTube Embedded Player API
- REST API for direct operations
- GraphQL for complex data fetching

## Setup Instructions

### Prerequisites
- Node.js installed
- KidsTube Backend running (see backend repository)

### Installation

1. Clone this repository:
   ```
   git clone [frontend-repository-url]
   cd KidsTube-Frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up avatar assets (required for restricted user profiles):
   ```
   node setup-avatars.js
   ```

4. Serve the application using a local server or open the index.html file directly in a browser.

## Project Structure

- `/views`: HTML pages for different views
  - `main.html`: Main dashboard and user selection
  - `videos.html`: Video management
  - `playlist.html`: Playlist management
  - `restricted-users.html`: Child profile management
  - `user-playlist.html`: Restricted user playlist view
  
- `/scripts`: JavaScript functionality for each view
  - Contains API utilities for both REST and GraphQL operations
- `/css`: Styling files
- `/components`: Reusable components (e.g., navbar)
- `/utils`: Utility functions (e.g., authentication, API helpers)
- `/assets`: Static assets including avatars

## Usage

### Admin Access
1. Register for an admin account or log in with existing credentials
2. Enter your 6-digit PIN when prompted for administrative access
3. From the admin dashboard, you can:
   - Manage restricted user profiles
   - Create and edit playlists
   - Add and manage videos
   - Assign playlists to user profiles

### Restricted User Access
1. From the main screen, select a user profile
2. Enter the 6-digit PIN associated with that profile
3. Browse and watch videos from assigned playlists

## Connecting to Backend

By default, the frontend connects to a backend running at `http://localhost:3001`. If your backend is running at a different URL, you'll need to update the API calls in the JavaScript files.

## API Integration

### REST API Calls

REST API calls are made directly using the Fetch API with appropriate authentication headers:

```javascript
// Example of REST API call
async function fetchData(endpoint) {
  const options = addAuthHeader({
    headers: { 'Content-Type': 'application/json' }
  });
  
  const response = await fetch(`http://localhost:3001/api/${endpoint}`, options);
  return await response.json();
}
```

### GraphQL Queries

GraphQL operations use a dedicated function to execute queries and mutations:

```javascript
// Example of GraphQL query
async function fetchDataWithGraphQL(query, variables) {
  const result = await executeGraphQLMutation(query, variables);
  return result.data;
}
```

By leveraging both API paradigms, the frontend can choose the most appropriate approach for each specific use case.

## Security Features

- Authentication checks on protected routes
- PIN protection for all users
- Client-side input validation

## License

This project is for educational purposes.