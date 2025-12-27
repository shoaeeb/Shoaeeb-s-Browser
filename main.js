const { app, BrowserWindow, ipcMain, globalShortcut, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Data storage paths - use user data directory for installed app
const DATA_DIR = path.join(app.getPath('userData'), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');
const DOWNLOADS_FILE = path.join(DATA_DIR, 'downloads.json');
const BLOCKED_SITES_FILE = path.join(DATA_DIR, 'blocked-sites.json');

// Download tracking
let activeDownloads = new Map();

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  console.log('Creating data directory:', DATA_DIR);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(HISTORY_FILE)) {
  console.log('Creating history file:', HISTORY_FILE);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
}

if (!fs.existsSync(BOOKMARKS_FILE)) {
  console.log('Creating bookmarks file:', BOOKMARKS_FILE);
  fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(DOWNLOADS_FILE)) {
  console.log('Creating downloads file:', DOWNLOADS_FILE);
  fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(BLOCKED_SITES_FILE)) {
  console.log('Creating blocked sites file:', BLOCKED_SITES_FILE);
  fs.writeFileSync(BLOCKED_SITES_FILE, JSON.stringify({
    blockedDomains: [],
    timeRules: [],
    enabled: true
  }));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'ShoaeebBrowser',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      webviewTag: true,
      allowRunningInsecureContent: true
    }
  });

  mainWindow.loadFile('index.html');

  // Remove menu bar for cleaner look
  mainWindow.setMenuBarVisibility(false);
  
  // Setup download handling
  setupDownloadHandling();
  
  // Register global shortcuts
  registerGlobalShortcuts();
}

function registerGlobalShortcuts() {
  // Navigation shortcuts
  globalShortcut.register('CommandOrControl+L', () => {
    mainWindow.webContents.send('shortcut-focus-address-bar');
  });
  
  globalShortcut.register('CommandOrControl+R', () => {
    mainWindow.webContents.send('shortcut-reload');
  });
  
  globalShortcut.register('F5', () => {
    mainWindow.webContents.send('shortcut-reload');
  });
  
  globalShortcut.register('CommandOrControl+F5', () => {
    mainWindow.webContents.send('shortcut-hard-reload');
  });
  
  globalShortcut.register('Alt+Left', () => {
    mainWindow.webContents.send('shortcut-go-back');
  });
  
  globalShortcut.register('Alt+Right', () => {
    mainWindow.webContents.send('shortcut-go-forward');
  });
  
  globalShortcut.register('Alt+Home', () => {
    mainWindow.webContents.send('shortcut-go-home');
  });
  
  // Tab management shortcuts
  globalShortcut.register('CommandOrControl+T', () => {
    mainWindow.webContents.send('shortcut-new-tab');
  });
  
  globalShortcut.register('CommandOrControl+W', () => {
    mainWindow.webContents.send('shortcut-close-tab');
  });
  
  globalShortcut.register('CommandOrControl+Tab', () => {
    mainWindow.webContents.send('shortcut-next-tab');
  });
  
  globalShortcut.register('CommandOrControl+Shift+Tab', () => {
    mainWindow.webContents.send('shortcut-previous-tab');
  });
  
  // Bookmark shortcuts
  globalShortcut.register('CommandOrControl+D', () => {
    mainWindow.webContents.send('shortcut-bookmark');
  });
  
  globalShortcut.register('CommandOrControl+H', () => {
    mainWindow.webContents.send('shortcut-history');
  });
  
  globalShortcut.register('CommandOrControl+Shift+O', () => {
    mainWindow.webContents.send('shortcut-bookmarks');
  });
  
  // Split view shortcut
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow.webContents.send('shortcut-split-view');
  });
  
  // Help shortcut
  globalShortcut.register('F1', () => {
    mainWindow.webContents.send('shortcut-help');
  });
  
  // Downloads shortcut
  globalShortcut.register('CommandOrControl+J', () => {
    mainWindow.webContents.send('shortcut-downloads');
  });
  
  // Fullscreen shortcuts
  globalShortcut.register('F11', () => {
    const isFullScreen = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFullScreen);
    mainWindow.webContents.send('fullscreen-changed', !isFullScreen);
  });
  
  globalShortcut.register('Escape', () => {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
      mainWindow.webContents.send('fullscreen-changed', false);
    }
  });
  
  // Number key shortcuts (1-9)
  for (let i = 1; i <= 9; i++) {
    globalShortcut.register(`CommandOrControl+${i}`, () => {
      mainWindow.webContents.send('shortcut-switch-tab', i - 1);
    });
  }
}

// IPC handlers for data persistence
ipcMain.handle('save-history', async (event, historyEntry) => {
  try {
    console.log('Saving history entry:', historyEntry.title);
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    history.unshift(historyEntry);
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(100);
    }
    
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    console.log('History saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving history:', error);
    console.error('History file path:', HISTORY_FILE);
    return false;
  }
});

ipcMain.handle('get-history', async () => {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
});

ipcMain.handle('save-bookmark', async (event, bookmark) => {
  try {
    console.log('Saving bookmark:', bookmark.title);
    const bookmarks = JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf8'));
    
    // Check if bookmark already exists
    const exists = bookmarks.some(b => b.url === bookmark.url);
    if (!exists) {
      bookmarks.unshift(bookmark);
      fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
      console.log('Bookmark saved successfully');
    } else {
      console.log('Bookmark already exists');
    }
    
    return !exists;
  } catch (error) {
    console.error('Error saving bookmark:', error);
    console.error('Bookmarks file path:', BOOKMARKS_FILE);
    return false;
  }
});

ipcMain.handle('get-bookmarks', async () => {
  try {
    return JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading bookmarks:', error);
    return [];
  }
});

// Download IPC handlers
ipcMain.handle('get-downloads', async () => {
  try {
    return JSON.parse(fs.readFileSync(DOWNLOADS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading downloads:', error);
    return [];
  }
});

ipcMain.handle('pause-download', async (event, downloadId) => {
  console.log('Main: Attempting to pause download:', downloadId);
  console.log('Main: Active downloads:', Array.from(activeDownloads.keys()));
  const download = activeDownloads.get(downloadId);
  if (download && download.item) {
    if (!download.item.isPaused() && !download.item.isDone()) {
      console.log('Main: Pausing download item');
      download.item.pause();
      download.data.state = 'paused';
      download.data.isPaused = true;
      
      // Update the downloads file immediately
      updateDownloadInFile(download.data);
      
      // Notify renderer
      mainWindow.webContents.send('download-progress', download.data);
      return true;
    } else {
      console.log('Main: Download already paused or done');
    }
  }
  console.log('Main: Could not pause download - not found');
  return false;
});

ipcMain.handle('resume-download', async (event, downloadId) => {
  console.log('Main: Attempting to resume download:', downloadId);
  console.log('Main: Active downloads:', Array.from(activeDownloads.keys()));
  const download = activeDownloads.get(downloadId);
  if (download && download.item) {
    if (download.item.isPaused()) {
      console.log('Main: Resuming download item');
      download.item.resume();
      download.data.state = 'progressing';
      download.data.isPaused = false;
      
      // Update the downloads file immediately
      updateDownloadInFile(download.data);
      
      // Notify renderer
      mainWindow.webContents.send('download-progress', download.data);
      return true;
    } else {
      console.log('Main: Download is not paused, current state:', download.item.getState());
    }
  }
  console.log('Main: Could not resume download - not found or not paused');
  return false;
});

ipcMain.handle('cancel-download', async (event, downloadId) => {
  console.log('Main: Attempting to cancel download:', downloadId);
  const download = activeDownloads.get(downloadId);
  if (download && download.item && !download.item.isDone()) {
    console.log('Main: Cancelling download item');
    download.item.cancel();
    return true;
  }
  console.log('Main: Could not cancel download - not found or already done');
  return false;
});

ipcMain.handle('open-download-location', async (event, filePath) => {
  console.log('Main: Opening download location:', filePath);
  try {
    shell.showItemInFolder(filePath);
    console.log('Main: Successfully opened location');
    return true;
  } catch (error) {
    console.error('Main: Error opening download location:', error);
    return false;
  }
});

// Blocked sites IPC handlers
ipcMain.handle('get-blocked-sites', async () => {
  try {
    return JSON.parse(fs.readFileSync(BLOCKED_SITES_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading blocked sites:', error);
    return { blockedDomains: [], timeRules: [], enabled: true };
  }
});

ipcMain.handle('save-blocked-sites', async (event, blockedSitesData) => {
  try {
    console.log('Saving blocked sites data');
    fs.writeFileSync(BLOCKED_SITES_FILE, JSON.stringify(blockedSitesData, null, 2));
    console.log('Blocked sites saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving blocked sites:', error);
    console.error('Blocked sites file path:', BLOCKED_SITES_FILE);
    return false;
  }
});

ipcMain.handle('is-site-blocked', async (event, url) => {
  try {
    const blockedSites = JSON.parse(fs.readFileSync(BLOCKED_SITES_FILE, 'utf8'));
    
    if (!blockedSites.enabled) return false;
    
    const domain = new URL(url).hostname.toLowerCase();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes for more precise comparison
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    console.log(`Checking if ${domain} is blocked at ${currentHour}:${currentMinute.toString().padStart(2, '0')} on day ${currentDay}`);
    
    // Check manual blocklist
    const isManuallyBlocked = blockedSites.blockedDomains.some(blockedDomain => {
      return domain.includes(blockedDomain.toLowerCase()) || blockedDomain.toLowerCase().includes(domain);
    });
    
    if (isManuallyBlocked) {
      console.log(`${domain} is manually blocked`);
      return true;
    }
    
    // Check time-based rules
    const isTimeBlocked = blockedSites.timeRules.some(rule => {
      if (!rule.enabled) return false;
      
      // If rule has a specific domain, check if it matches
      if (rule.domain && rule.domain.trim()) {
        const ruleDomain = rule.domain.toLowerCase().trim();
        const domainMatches = domain.includes(ruleDomain) || ruleDomain.includes(domain);
        if (!domainMatches) return false;
      }
      
      // Check if current day is in rule's days
      if (rule.days && rule.days.length > 0 && !rule.days.includes(currentDay)) {
        return false;
      }
      
      // Parse time more precisely (including minutes)
      const [startHour, startMinute] = rule.startTime.split(':').map(Number);
      const [endHour, endMinute] = rule.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      let isInTimeRange = false;
      
      if (startTime <= endTime) {
        // Same day range (e.g., 14:00 to 17:00)
        isInTimeRange = currentTime >= startTime && currentTime < endTime;
      } else {
        // Overnight range (e.g., 22:00 to 6:00)
        isInTimeRange = currentTime >= startTime || currentTime < endTime;
      }
      
      if (isInTimeRange) {
        console.log(`${domain} is blocked by time rule: ${rule.startTime}-${rule.endTime} for domain: ${rule.domain || 'all sites'}`);
        return true;
      }
      
      return false;
    });
    
    return isTimeBlocked;
  } catch (error) {
    console.error('Error checking if site is blocked:', error);
    return false;
  }
});

// Fullscreen IPC handler
ipcMain.handle('toggle-fullscreen', async () => {
  const isFullScreen = mainWindow.isFullScreen();
  mainWindow.setFullScreen(!isFullScreen);
  return !isFullScreen;
});

function setupDownloadHandling() {
  // Set up download handling for the persist:main session (used by webviews)
  const webviewSession = session.fromPartition('persist:main');
  
  webviewSession.on('will-download', (event, item, webContents) => {
    const downloadId = Date.now().toString();
    const downloadData = {
      id: downloadId,
      filename: item.getFilename(),
      url: item.getURL(),
      totalBytes: item.getTotalBytes(),
      receivedBytes: 0,
      progress: 0,
      state: 'progressing',
      startTime: new Date().toISOString(),
      savePath: item.getSavePath(),
      isPaused: false
    };

    // Store active download
    activeDownloads.set(downloadId, { item, data: downloadData });

    // Save to downloads file
    saveDownloadToFile(downloadData);

    // Send initial download info to renderer
    mainWindow.webContents.send('download-started', downloadData);

    item.on('updated', (event, state) => {
      downloadData.receivedBytes = item.getReceivedBytes();
      downloadData.totalBytes = item.getTotalBytes();
      downloadData.progress = downloadData.totalBytes > 0 ? 
        Math.round((downloadData.receivedBytes / downloadData.totalBytes) * 100) : 0;
      downloadData.state = state;
      downloadData.isPaused = item.isPaused();

      // Update downloads file with current progress
      updateDownloadInFile(downloadData);

      mainWindow.webContents.send('download-progress', downloadData);
    });

    item.once('done', (event, state) => {
      downloadData.state = state;
      downloadData.endTime = new Date().toISOString();
      downloadData.savePath = item.getSavePath();
      downloadData.isPaused = false;

      if (state === 'completed') {
        downloadData.progress = 100;
      }

      // Update downloads file
      updateDownloadInFile(downloadData);

      // Send completion info to renderer
      mainWindow.webContents.send('download-completed', downloadData);

      // Only remove from active downloads if it's actually done (not paused)
      if (state === 'completed' || state === 'cancelled' || state === 'interrupted') {
        activeDownloads.delete(downloadId);
      }
    });
  });
}

function saveDownloadToFile(downloadData) {
  try {
    const downloads = JSON.parse(fs.readFileSync(DOWNLOADS_FILE, 'utf8'));
    downloads.unshift(downloadData);
    
    // Keep only last 50 downloads
    if (downloads.length > 50) {
      downloads.splice(50);
    }
    
    fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2));
  } catch (error) {
    console.error('Error saving download:', error);
  }
}

function updateDownloadInFile(downloadData) {
  try {
    const downloads = JSON.parse(fs.readFileSync(DOWNLOADS_FILE, 'utf8'));
    const index = downloads.findIndex(d => d.id === downloadData.id);
    
    if (index !== -1) {
      downloads[index] = downloadData;
      fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2));
    }
  } catch (error) {
    console.error('Error updating download:', error);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});