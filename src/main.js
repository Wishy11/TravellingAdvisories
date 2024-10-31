// Import required Electron modules for desktop application functionality
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Window Control Functions
// These handle minimize, maximize, and close operations for the custom title bar
ipcMain.on('minimize-window', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('maximize-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('close-window', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

// Main Window Creation
// Sets up the main application window with specific configurations
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,        // Removes default window frame for custom styling
        transparent: true,   // Enables transparency effects
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'pages/index.html'));
}

// File Operations Section
// Save Itinerary: Handles saving trip details to a text file
ipcMain.handle('save-itinerary', async (event, itinerary) => {
    try {
        const customPath = path.join('C:', 'Users', 'User', 'OneDrive - Kolej Profesional MARA Indera Mahkota', 'Desktop', 'OOPCoding', 'TrvelAdvisor', 'textfiles');
        
        if (!fs.existsSync(customPath)) {
            fs.mkdirSync(customPath, { recursive: true });
        }

        // Create or update filename based on destination and ID (to maintain the same file)
        const sanitizedDestination = itinerary.destination.replace(/[^a-z0-9]/gi, '_');
        const fileName = `${sanitizedDestination}_${itinerary.id}.txt`;
        const filePath = path.join(customPath, fileName);

        // Format the itinerary content
        const content = `
Travel Itinerary
===============
Destination: ${itinerary.destination}
Date: ${itinerary.date}

Weather Information
-----------------
Temperature: ${itinerary.weather.temperature}°C
Condition: ${itinerary.weather.condition}
Forecast: ${itinerary.weather.forecast}°C average

Activities
---------
${itinerary.activities}

Notes
-----
${itinerary.notes}

Last Updated: ${new Date().toLocaleString()}
        `;

        // Write/overwrite file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('File saved/updated successfully at:', filePath);
        
        return { success: true, filePath };
    } catch (error) {
        console.error('Error saving/updating file:', error);
        return { success: false, error: error.message };
    }
});

// Delete Itinerary: Removes saved trip information
ipcMain.handle('delete-itinerary', async (event, itinerary) => {
    try {
        const customPath = path.join('C:', 'Users', 'User', 'OneDrive - Kolej Profesional MARA Indera Mahkota', 'Desktop', 'OOPCoding', 'TrvelAdvisor', 'textfiles');
        
        // Create the filename using the same format as when saving
        const sanitizedDestination = itinerary.destination.replace(/[^a-z0-9]/gi, '_');
        const fileName = `${sanitizedDestination}_${itinerary.id}.txt`;
        const filePath = path.join(customPath, fileName);

        console.log('Attempting to delete file:', filePath);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('File deleted successfully:', filePath);
            return { 
                success: true, 
                message: 'File deleted successfully' 
            };
        } else {
            console.log('File not found:', filePath);
            return { 
                success: false, 
                error: 'File not found, might have been already deleted'
            };
        }
    } catch (error) {
        console.error('Error during file deletion:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
});

// Read Itineraries: Fetches all saved trip information
ipcMain.handle('read-itineraries', async () => {
    try {
        const customPath = path.join('C:', 'Users', 'User', 'OneDrive - Kolej Profesional MARA Indera Mahkota', 'Desktop', 'OOPCoding', 'TrvelAdvisor', 'textfiles');
        
        if (!fs.existsSync(customPath)) {
            fs.mkdirSync(customPath, { recursive: true });
            return { success: true, files: [] };
        }

        const files = fs.readdirSync(customPath)
            .filter(file => file.endsWith('.txt'))
            .map(fileName => {
                const filePath = path.join(customPath, fileName);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Parse the content to extract information
                const destination = content.match(/Destination: (.+)/)?.[1] || '';
                const date = content.match(/Date: (.+)/)?.[1] || '';
                const temperature = parseFloat(content.match(/Temperature: (.+)°C/)?.[1] || '0');
                const condition = content.match(/Condition: (.+)/)?.[1] || '';
                const forecast = parseFloat(content.match(/Forecast: (.+)°C/)?.[1] || '0');
                const activities = content.split('Activities\n---------\n')[1]?.split('\n\nNotes')[0]?.trim() || '';
                const notes = content.split('Notes\n-----\n')[1]?.split('\n\nLast Updated')[0]?.trim() || '';
                const id = parseInt(fileName.split('_').pop().split('.')[0]);

                return {
                    id,
                    fileName,
                    destination,
                    date,
                    activities,
                    notes,
                    weather: {
                        temperature,
                        condition,
                        forecast
                    }
                };
            });

        console.log('Read itineraries result:', files); // Debug log
        return { success: true, files };
    } catch (error) {
        console.error('Error reading itineraries:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('read-itinerary-file', async (event, id) => {
    try {
        const customPath = path.join('C:', 'Users', 'User', 'OneDrive - Kolej Profesional MARA Indera Mahkota', 'Desktop', 'OOPCoding', 'TrvelAdvisor', 'textfiles');
        
        // First get the list of files to find the correct one
        const files = fs.readdirSync(customPath)
            .filter(file => file.endsWith('.txt'));
            
        const targetFile = files.find(file => {
            const fileId = parseInt(file.split('_').pop().split('.')[0]);
            return fileId === id;
        });

        if (!targetFile) {
            return { 
                success: false, 
                error: 'File not found' 
            };
        }

        const filePath = path.join(customPath, targetFile);
        const content = fs.readFileSync(filePath, 'utf8');

        return { 
            success: true, 
            content: content 
        };
    } catch (error) {
        console.error('Error reading file:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
});

ipcMain.handle('updateItinerary', async (event, id, updatedItinerary) => {
    try {
        const filePath = path.join(app.getPath('userData'), 'itineraries', `${id}.json`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error('Itinerary file not found');
        }

        // Write updated data to the existing file
        await fs.promises.writeFile(filePath, JSON.stringify(updatedItinerary, null, 2));
        
        return {
            success: true,
            message: 'Itinerary updated successfully'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('updateExistingItinerary', async (event, itinerary) => {
    try {
        const customPath = path.join('C:', 'Users', 'User', 'OneDrive - Kolej Profesional MARA Indera Mahkota', 'Desktop', 'OOPCoding', 'TrvelAdvisor', 'textfiles');
        const oldFilePath = path.join(customPath, itinerary.oldFileName);
        const newFilePath = path.join(customPath, itinerary.newFileName);

        console.log('Update request received:', {
            customPath,
            oldFilePath,
            newFilePath,
            oldFileName: itinerary.oldFileName,
            newFileName: itinerary.newFileName
        });

        // Format the itinerary content
        const content = `
Travel Itinerary
===============
Destination: ${itinerary.destination}
Date: ${itinerary.date}

Weather Information
-----------------
Temperature: ${itinerary.weather.temperature}°C
Condition: ${itinerary.weather.condition}
Forecast: ${itinerary.weather.forecast}°C average

Activities
---------
${itinerary.activities}

Notes
-----
${itinerary.notes}

Last Updated: ${new Date().toLocaleString()}
        `;

        // Check if files exist
        const oldFileExists = fs.existsSync(oldFilePath);
        const newFileExists = fs.existsSync(newFilePath);

        console.log('File status:', {
            oldFileExists,
            newFileExists,
            oldPath: oldFilePath,
            newPath: newFilePath
        });

        // Delete the old file if it exists and is different from the new file
        if (oldFilePath !== newFilePath && oldFileExists) {
            try {
                fs.unlinkSync(oldFilePath);
                console.log('Old file deleted successfully:', oldFilePath);
            } catch (deleteError) {
                console.error('Error deleting old file:', deleteError);
                throw new Error(`Failed to delete old file: ${deleteError.message}`);
            }
        }

        // Write the new file
        try {
            fs.writeFileSync(newFilePath, content, 'utf8');
            console.log('New file created successfully at:', newFilePath);
        } catch (writeError) {
            console.error('Error writing new file:', writeError);
            throw new Error(`Failed to write new file: ${writeError.message}`);
        }

        return { 
            success: true, 
            filePath: newFilePath,
            message: 'Itinerary updated successfully'
        };
    } catch (error) {
        console.error('Error in updateExistingItinerary:', error);
        return { 
            success: false, 
            error: error.message,
            details: {
                oldFileName: itinerary.oldFileName,
                newFileName: itinerary.newFileName
            }
        };
    }
});

// Application Event Handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
}); 