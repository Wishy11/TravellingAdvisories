const WEATHER_API_KEY = '32804b24a847407391c53709241010';
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

// Initialize Modal
let editModal;
document.addEventListener('DOMContentLoaded', function() {
    editModal = new bootstrap.Modal(document.getElementById('editModal'));
    
    // Add event listener for the Save Changes button in edit modal
    document.getElementById('saveChangesBtn').addEventListener('click', async function() {
        await updateItinerary();
    });
    
    loadItineraries();
});

// Handle form submission
document.getElementById('itineraryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const destination = document.getElementById('destination').value;
        const weatherData = await getDestinationWeather(destination);
        
        const itinerary = {
            id: Date.now(),
            destination: destination,
            date: document.getElementById('date').value,
            activities: document.getElementById('activities').value,
            notes: document.getElementById('notes').value,
            weather: {
                temperature: weatherData.current.temp_c,
                condition: weatherData.current.condition.text,
                forecast: weatherData.forecast.forecastday[0].day.avgtemp_c
            }
        };

        console.log('Saving itinerary:', itinerary);
        
        const result = await window.electronAPI.saveItinerary(itinerary);
        
        if (result.success) {
            showAlert('success', 'Itinerary saved successfully!');
            this.reset();
            showEmptyWeatherPreview();
            await loadItineraries();
        } else {
            throw new Error(result.error || 'Failed to save itinerary');
        }
    } catch (error) {
        console.error('Error saving itinerary:', error);
        showAlert('danger', 'Error saving itinerary. Please try again.');
    }
});

// CRUD Functions with Weather
async function addItinerary() {
    const destination = document.getElementById('destination').value;
    
    try {
        // Fetch weather data
        const weatherData = await getDestinationWeather(destination);
        
        const itinerary = {
            id: Date.now(),
            destination: destination,
            date: document.getElementById('date').value,
            activities: document.getElementById('activities').value,
            notes: document.getElementById('notes').value,
            weather: {
                temperature: weatherData.current.temp_c,
                condition: weatherData.current.condition.text,
                icon: weatherData.current.condition.icon,
                forecast: weatherData.forecast.forecastday[0].day.avgtemp_c
            }
        };

        // Save to localStorage
        let itineraries = JSON.parse(localStorage.getItem('itineraries')) || [];
        itineraries.push(itinerary);
        localStorage.setItem('itineraries', JSON.stringify(itineraries));

        // Save to file using Electron API
        try {
            const result = await window.electronAPI.saveItinerary(itinerary);
            if (result.success) {
                showAlert('success', `Itinerary saved successfully! File saved at: ${result.filePath}`);
            } else {
                throw new Error(result.error);
            }
        } catch (fileError) {
            console.error('File save error:', fileError);
            showAlert('danger', `Error saving itinerary file: ${fileError.message}`);
        }

        // Reset form and reload
        document.getElementById('itineraryForm').reset();
        loadItineraries();

    } catch (error) {
        console.error('Error:', error);
        showAlert('danger', 'Error saving itinerary. Please try again.');
    }
}

async function getDestinationWeather(destination) {
    try {
        const encodedDestination = encodeURIComponent(destination);
        const response = await fetch(
            `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodedDestination}&days=3`
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Weather data fetch failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw new Error(`Weather fetch failed: ${error.message}`);
    }
}

function createItineraryCard(itinerary) {
    const col = document.createElement('div');
    col.className = 'col-md-6 mb-3';
    
    col.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${itinerary.destination}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${formatDate(itinerary.date)}</h6>
                    </div>
                    <div class="weather-badge">
                        <i class="fas fa-temperature-high"></i>
                        <span>${itinerary.weather.temperature}°C</span>
                    </div>
                </div>
                
                <div class="weather-forecast mt-2 mb-3">
                    <small class="text-muted">
                        <i class="fas fa-cloud"></i> ${itinerary.weather.condition}
                        <br>
                        <i class="fas fa-calendar-day"></i> Forecast: ${itinerary.weather.forecast}°C average
                    </small>
                </div>

                <p class="card-text"><strong>Activities:</strong><br>${itinerary.activities}</p>
                <p class="card-text"><strong>Notes:</strong><br>${itinerary.notes || 'No notes added'}</p>
                
                <div class="card-actions mt-3">
                    <button onclick="editItinerary(${itinerary.id})" class="btn btn-primary btn-sm">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteItinerary(${itinerary.id})" class="btn btn-danger btn-sm">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button onclick="readItineraryFile(${itinerary.id})" class="btn btn-info btn-sm">
                        <i class="fas fa-file-alt"></i> Read File
                    </button>
                    <small class="text-muted d-block mt-2">
                        <i class="fas fa-file-alt"></i> Saved as: ${itinerary.fileName || 'N/A'}
                    </small>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

async function updateItinerary() {
    const id = parseInt(document.getElementById('editId').value);
    const destination = document.getElementById('editDestination').value;
    
    try {
        // First, get the existing itineraries to find the current file name
        const result = await window.electronAPI.readItineraries();
        if (!result.success) {
            throw new Error('Failed to read existing itineraries');
        }

        const existingItinerary = result.files.find(item => item.id === id);
        if (!existingItinerary) {
            throw new Error('Original itinerary not found');
        }

        console.log('Existing itinerary:', existingItinerary); // Debug log

        // Fetch updated weather data
        const weatherData = await getDestinationWeather(destination);
        
        // Create new filename based on new destination
        const sanitizedDestination = destination.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const newFileName = `${sanitizedDestination}_${id}.txt`;

        console.log('Old filename:', existingItinerary.fileName); // Debug log
        console.log('New filename:', newFileName); // Debug log

        const updatedItinerary = {
            id: id,
            oldFileName: existingItinerary.fileName,
            newFileName: newFileName,
            destination: destination,
            date: document.getElementById('editDate').value,
            activities: document.getElementById('editActivities').value,
            notes: document.getElementById('editNotes').value,
            weather: {
                temperature: weatherData.current.temp_c,
                condition: weatherData.current.condition.text,
                forecast: weatherData.forecast.forecastday[0].day.avgtemp_c
            }
        };

        console.log('Sending update request:', updatedItinerary); // Debug log

        const updateResult = await window.electronAPI.updateExistingItinerary(updatedItinerary);
        
        if (updateResult.success) {
            showAlert('success', 'Itinerary updated successfully!');
            editModal.hide();
            await loadItineraries(); // Reload the list
        } else {
            throw new Error(updateResult.error || 'Failed to update itinerary');
        }
    } catch (error) {
        console.error('Error updating itinerary:', error);
        showAlert('danger', `Error updating itinerary: ${error.message}`);
    }
}

async function loadItineraries() {
    const itineraryList = document.getElementById('itineraryList');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');

    try {
        // Show loading spinner
        loadingSpinner.classList.remove('d-none');
        itineraryList.innerHTML = '';
        emptyState.classList.add('d-none');

        // Read itineraries from files
        const result = await window.electronAPI.readItineraries();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load itineraries');
        }

        const itineraries = result.files || [];

        // Handle empty state
        if (!itineraries.length) {
            emptyState.classList.remove('d-none');
            return;
        }

        // Sort itineraries by date (most recent first)
        itineraries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Display each itinerary
        itineraries.forEach(itinerary => {
            const card = createItineraryCard(itinerary);
            itineraryList.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading itineraries:', error);
        showAlert('danger', `Error loading itineraries: ${error.message}`);
    } finally {
        loadingSpinner.classList.add('d-none');
    }
}

async function editItinerary(id) {
    try {
        // Get all itineraries from files
        const result = await window.electronAPI.readItineraries();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load itinerary data');
        }

        const itineraries = result.files || [];
        const itinerary = itineraries.find(item => item.id === id);
        
        if (itinerary) {
            // Populate the edit modal with itinerary data
            document.getElementById('editId').value = itinerary.id;
            document.getElementById('editDestination').value = itinerary.destination;
            document.getElementById('editDate').value = itinerary.date;
            document.getElementById('editActivities').value = itinerary.activities;
            document.getElementById('editNotes').value = itinerary.notes || '';
            
            // Show the modal
            editModal.show();
        } else {
            showAlert('danger', 'Itinerary not found');
        }
    } catch (error) {
        console.error('Error loading itinerary for edit:', error);
        showAlert('danger', 'Error loading itinerary data');
    }
}

async function deleteItinerary(id) {
    if (confirm('Are you sure you want to delete this itinerary?')) {
        try {
            // Get the itinerary details from the current list
            const result = await window.electronAPI.readItineraries();
            if (!result.success) {
                throw new Error('Failed to read itineraries');
            }

            const itineraryToDelete = result.files.find(item => item.id === id);
            if (!itineraryToDelete) {
                throw new Error('Itinerary not found');
            }

            // Delete the file using electron API
            const deleteResult = await window.electronAPI.deleteItinerary({
                id: id,
                destination: itineraryToDelete.destination
            });

            if (deleteResult.success) {
                showAlert('success', 'Itinerary deleted successfully');
                await loadItineraries(); // Reload the list
            } else {
                throw new Error(deleteResult.error || 'Failed to delete itinerary');
            }

        } catch (error) {
            console.error('Deletion error:', error);
            showAlert('danger', `Error deleting itinerary: ${error.message}`);
        }
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Add notification function
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Add this after your existing constants
let weatherPreviewDebounceTimer;

// Add this after DOMContentLoaded event listener
document.getElementById('destination').addEventListener('input', function(e) {
    clearTimeout(weatherPreviewDebounceTimer);
    const destination = e.target.value.trim();
    
    if (destination) {
        weatherPreviewDebounceTimer = setTimeout(() => {
            updateWeatherPreview(destination);
        }, 500); // Debounce for 500ms
    } else {
        showEmptyWeatherPreview();
    }
});

// Add these new functions
async function updateWeatherPreview(destination) {
    const weatherPreview = document.getElementById('weatherPreview');
    
    try {
        // Show loading state
        weatherPreview.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted mt-2">Fetching weather data...</p>
            </div>
        `;

        const weatherData = await getDestinationWeather(destination);
        
        // Format the weather preview
        weatherPreview.innerHTML = `
            <div class="weather-preview-content">
                <div class="location-header mb-3">
                    <h4>${weatherData.location.name}, ${weatherData.location.country}</h4>
                    <p class="text-muted">${weatherData.location.localtime}</p>
                </div>
                
                <div class="current-conditions d-flex align-items-center justify-content-center mb-3">
                    <div class="temperature-large me-3">
                        <span class="display-4">${Math.round(weatherData.current.temp_c)}°C</span>
                    </div>
                    <div class="condition-icon">
                        <img src="${weatherData.current.condition.icon}" 
                             alt="${weatherData.current.condition.text}"
                             style="width: 64px; height: 64px;">
                    </div>
                </div>
                
                <div class="weather-details">
                    <div class="row text-center">
                        <div class="col-4">
                            <div class="weather-detail-item">
                                <i class="fas fa-temperature-high text-primary mb-2"></i>
                                <p class="mb-0">Feels Like</p>
                                <strong>${Math.round(weatherData.current.feelslike_c)}°C</strong>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="weather-detail-item">
                                <i class="fas fa-wind text-primary mb-2"></i>
                                <p class="mb-0">Wind</p>
                                <strong>${weatherData.current.wind_kph} km/h</strong>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="weather-detail-item">
                                <i class="fas fa-tint text-primary mb-2"></i>
                                <p class="mb-0">Humidity</p>
                                <strong>${weatherData.current.humidity}%</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="forecast-preview mt-3">
                    <h5 class="text-primary mb-2">3-Day Forecast</h5>
                    <div class="d-flex justify-content-between">
                        ${weatherData.forecast.forecastday.slice(0, 3).map(day => `
                            <div class="forecast-day text-center">
                                <p class="mb-1">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                <img src="${day.day.condition.icon}" 
                                     alt="${day.day.condition.text}"
                                     style="width: 32px; height: 32px;">
                                <p class="mb-0"><strong>${Math.round(day.day.avgtemp_c)}°C</strong></p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Weather preview error:', error);
        weatherPreview.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Unable to fetch weather data for this location.
            </div>
        `;
    }
}

function showEmptyWeatherPreview() {
    const weatherPreview = document.getElementById('weatherPreview');
    weatherPreview.innerHTML = `
        <div class="text-center text-muted">
            <i class="fas fa-cloud-sun fa-3x mb-3"></i>
            <p>Enter a destination to see weather forecast</p>
        </div>
    `;
}

async function readItineraryFile(id) {
    try {
        const result = await window.electronAPI.readItineraryFile(id);
        
        if (result.success) {
            // Get the modal element
            const readFileModal = document.getElementById('readFileModal');
            if (!readFileModal) {
                throw new Error('Read file modal not found in DOM');
            }

            // Get the content element
            const contentElement = document.getElementById('fileContent');
            if (!contentElement) {
                throw new Error('File content element not found in DOM');
            }

            // Set the content
            contentElement.textContent = result.content;

            // Create and show the modal
            const modal = new bootstrap.Modal(readFileModal);
            modal.show();
        } else {
            throw new Error(result.error || 'Failed to read file');
        }
    } catch (error) {
        console.error('Error reading file:', error);
        showAlert('danger', `Error reading file: ${error.message}`);
    }
}

// Add this to your existing destination input event listener
document.getElementById('destination').addEventListener('change', async function() {
    const destination = this.value.trim();
    if (destination) {
        try {
            // Update weather preview
            await updateWeatherPreview(destination);
            
            // Update map location
            await window.mapFunctions.searchLocation(destination);
        } catch (error) {
            console.error('Error updating destination info:', error);
            showAlert('danger', 'Error updating destination information');
        }
    }
});

// Update your createItineraryCard function to include a map button
function createItineraryCard(itinerary) {
    // ... existing card HTML ...
    const cardButtons = `
        <div class="btn-group mt-2">
            <button class="btn btn-info btn-sm" onclick="window.mapFunctions.searchLocation('${itinerary.destination}')">
                <i class="fas fa-map-marker-alt me-1"></i> Show on Map
            </button>
            // ... other buttons ...
        </div>
    `;
    // ... rest of the function ...
}