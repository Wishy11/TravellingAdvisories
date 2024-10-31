const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveItinerary: (itinerary) => ipcRenderer.invoke('save-itinerary', itinerary),
    deleteItinerary: (itinerary) => ipcRenderer.invoke('delete-itinerary', itinerary),
    readItineraries: () => ipcRenderer.invoke('read-itineraries'),
    readItineraryFile: (id) => ipcRenderer.invoke('read-itinerary-file', id),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    updateExistingItinerary: (itinerary) => ipcRenderer.invoke('updateExistingItinerary', itinerary),
});
