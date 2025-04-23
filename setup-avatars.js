/**
 * Script to download default avatars for the application
 * Run this script with Node.js to set up the avatars directory
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Create avatars directory if it doesn't exist
const avatarsDir = path.join(__dirname, 'assets', 'avatars');
if (!fs.existsSync(path.join(__dirname, 'assets'))) {
    fs.mkdirSync(path.join(__dirname, 'assets'));
}
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir);
    console.log('Created avatars directory');
}

// Default avatar URLs (these are placeholder URLs, replace with real ones)
const avatarUrls = [
    {
        url: 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png',
        filename: 'avatar1.png',
        description: 'Boy with Cap'
    },
    {
        url: 'https://cdn-icons-png.flaticon.com/512/4333/4333613.png',
        filename: 'avatar2.png',
        description: 'Girl with Pigtails'
    },
    {
        url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        filename: 'avatar3.png',
        description: 'Boy with Glasses'
    },
    {
        url: 'https://cdn-icons-png.flaticon.com/512/2945/2945397.png',
        filename: 'avatar4.png',
        description: 'Girl with Headband'
    },
    {
        url: 'https://cdn-icons-png.flaticon.com/512/4333/4333604.png',
        filename: 'avatar5.png',
        description: 'Robot Character'
    },
    {
        url: 'https://cdn-icons-png.flaticon.com/512/4139/4139981.png',
        filename: 'avatar6.png',
        description: 'Superhero Kid'
    }
];

// Download avatars
let downloadsCompleted = 0;

avatarUrls.forEach(avatar => {
    const filePath = path.join(avatarsDir, avatar.filename);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
        console.log(`${avatar.filename} already exists, skipping...`);
        downloadsCompleted++;
        if (downloadsCompleted === avatarUrls.length) {
            console.log('All avatars are ready!');
        }
        return;
    }
    
    const file = fs.createWriteStream(filePath);
    
    https.get(avatar.url, response => {
        response.pipe(file);
        
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${avatar.filename} (${avatar.description})`);
            
            downloadsCompleted++;
            if (downloadsCompleted === avatarUrls.length) {
                console.log('All avatars have been downloaded successfully!');
            }
        });
    }).on('error', err => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        console.error(`Error downloading ${avatar.filename}: ${err.message}`);
    });
});

console.log('Avatar setup process started. Please wait...');
