const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let slideshowWindow; // The slideshow window

// Create the main application window
app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        app.quit();
    });
});

// Handle starting the slideshow
ipcMain.on('start-slideshow', (event, data) => {
    if (slideshowWindow) {
        slideshowWindow.close(); // Ensure no duplicate windows
    }

    // Create a new slideshow window
    slideshowWindow = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            nodeIntegration: false,
        },
    });

    let currentIndex = 0;

    // Load the first URL in the slideshow
    slideshowWindow.loadURL(data.urls[currentIndex].url);

    // Cycle through URLs using their custom durations
    const nextSlide = () => {
        currentIndex = (currentIndex + 1) % data.urls.length;
        slideshowWindow.loadURL(data.urls[currentIndex].url);

        // Schedule the next slide based on its custom duration
        setTimeout(nextSlide, data.urls[currentIndex].duration * 1000);
    };

    // Start with the duration of the first URL
    setTimeout(nextSlide, data.urls[0].duration * 1000);

    slideshowWindow.on('closed', () => {
        slideshowWindow = null; // Cleanup when the window is closed
    });
});

// Handle stopping the slideshow
ipcMain.on('stop-slideshow', () => {
    if (slideshowWindow) {
        slideshowWindow.close(); // Close the slideshow window
    }
});
