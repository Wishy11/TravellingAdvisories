const WEATHER_API_KEY = '32804b24a847407391c53709241010';
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';
const DEFAULT_LOCATION = 'Kuantan';

async function loadDefaultWeather() {
    document.getElementById('location').value = DEFAULT_LOCATION;
    await getWeather();
}

async function getWeather() {
    const location = document.getElementById('location').value || DEFAULT_LOCATION;
    
    try {
        document.getElementById('weather-info').innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading weather data for ${location}...</p>
            </div>
        `;
        
        const response = await fetch(
            `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${location}&days=3`
        );

        if (!response.ok) {
            throw new Error('Weather data fetch failed');
        }

        const data = await response.json();
        
        displayWeatherInfo(data);
        displayClothingRecommendations(data.current.temp_c);
        displayActivitiesRecommendations(data);

    } catch (error) {
        console.error('Error details:', error);
        document.getElementById('weather-info').innerHTML = `
            <div class="alert alert-danger">
                Unable to fetch weather data. Please check the location name and try again.
                <br>
                Error: ${error.message}
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadDefaultWeather();
    
    document.getElementById('location').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getWeather();
        }
    });
});

function getWeatherIcon(condition) {
    condition = condition.toLowerCase();
    
    if (condition.includes('sunny') || condition.includes('clear')) {
        return '<i class="fas fa-sun text-warning"></i>';
    } else if (condition.includes('rain')) {
        return '<i class="fas fa-cloud-rain text-info"></i>';
    } else if (condition.includes('cloud')) {
        return '<i class="fas fa-cloud text-secondary"></i>';
    } else if (condition.includes('snow')) {
        return '<i class="fas fa-snowflake text-info"></i>';
    } else if (condition.includes('thunder') || condition.includes('storm')) {
        return '<i class="fas fa-bolt text-warning"></i>';
    } else if (condition.includes('mist') || condition.includes('fog')) {
        return '<i class="fas fa-smog text-secondary"></i>';
    } else if (condition.includes('drizzle')) {
        return '<i class="fas fa-cloud-rain text-info"></i>';
    } else if (condition.includes('overcast')) {
        return '<i class="fas fa-cloud text-secondary"></i>';
    } else if (condition.includes('partly cloudy')) {
        return '<i class="fas fa-cloud-sun text-secondary"></i>';
    } else {
        return '<i class="fas fa-cloud text-secondary"></i>'; // default icon
    }
}

function displayWeatherInfo(data) {
    const weatherInfo = document.getElementById('weather-info');
    
    weatherInfo.innerHTML = `
        <div class="weather-main">
            <h2>${data.location.name}, ${data.location.country}</h2>
            <div class="current-weather">
                <div class="weather-primary">
                    <div class="weather-icon-large">
                        ${getWeatherIcon(data.current.condition.text)}
                    </div>
                    <div class="temperature">
                        <h3>${data.current.temp_c}°C</h3>
                        <p>Feels like ${data.current.feelslike_c}°C</p>
                    </div>
                </div>
                <div class="weather-details">
                    <p>${getWeatherIcon(data.current.condition.text)} ${data.current.condition.text}</p>
                    <p><i class="fas fa-wind"></i> Wind: ${data.current.wind_kph} km/h</p>
                    <p><i class="fas fa-tint"></i> Humidity: ${data.current.humidity}%</p>
                    <p><i class="far fa-clock"></i> Local Time: ${data.location.localtime}</p>
                    <p><i class="fas fa-sunrise"></i> Sunrise: ${data.forecast.forecastday[0].astro.sunrise}</p>
                    <p><i class="fas fa-sunset"></i> Sunset: ${data.forecast.forecastday[0].astro.sunset}</p>
                </div>
            </div>

            <div class="hourly-forecast">
                <h3><i class="fas fa-clock"></i> Hourly Forecast</h3>
                <div class="hourly-container">
                    ${data.forecast.forecastday[0].hour
                        .filter(hour => new Date(hour.time) > new Date())
                        .map(hour => `
                            <div class="hour-card">
                                <p>${new Date(hour.time).getHours()}:00</p>
                                <div class="weather-icon-small">
                                    ${getWeatherIcon(hour.condition.text)}
                                </div>
                                <p>${hour.temp_c}°C</p>
                            </div>
                        `).join('')}
                </div>
            </div>

            <div class="daily-forecast">
                <h3><i class="fas fa-calendar-alt"></i> 3-Day Forecast</h3>
                <div class="forecast-container">
                    ${data.forecast.forecastday.map(day => `
                        <div class="forecast-card">
                            <p>${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <div class="weather-icon-medium">
                                ${getWeatherIcon(day.day.condition.text)}
                            </div>
                            <p>${day.day.avgtemp_c}°C</p>
                            <p class="forecast-condition">${day.day.condition.text}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function displayClothingRecommendations(temperature) {
    const recommendationsDiv = document.getElementById('clothing-recommendations');
    let recommendations = '';

    if (temperature <= 10) {
        recommendations = `
            <div class="recommendations-card dark">
                <div class="recommendations-container">
                    <div class="recommendations-content">
                        <h3 class="text-white">Cold Weather Clothing</h3>
                        <ul class="text-white">
                            <li>Heavy winter coat</li>
                            <li>Warm sweater</li>
                            <li>Thermal underwear</li>
                            <li>Winter boots</li>
                            <li>Gloves and scarf</li>
                        </ul>
                        <p class="weather-tip text-white">Tip: Layer your clothing for better insulation!</p>
                    </div>
                    <div class="recommendations-image">
                        <img src="../images/cold-weather.png" alt="Cold weather clothing" class="weather-outfit-image">
                    </div>
                </div>
            </div>
        `;
    } else if (temperature <= 20) {
        recommendations = `
            <div class="recommendations-card dark">
                <div class="recommendations-container">
                    <div class="recommendations-content">
                        <h3 class="text-white">Mild Weather Clothing</h3>
                        <ul class="text-white">
                            <li>Light jacket</li>
                            <li>Long sleeve shirt</li>
                            <li>Jeans or pants</li>
                            <li>Comfortable shoes</li>
                        </ul>
                        <p class="weather-tip text-white">Tip: Bring a light jacket for evening temperature drops!</p>
                    </div>
                    <div class="recommendations-image">
                        <img src="../images/mild-weather.png" alt="Mild weather clothing" class="weather-outfit-image">
                    </div>
                </div>
            </div>
        `;
    } else {
        recommendations = `
            <div class="recommendations-card dark">
                <div class="recommendations-container">
                    <div class="recommendations-content">
                        <h3 class="text-white">Warm Weather Clothing</h3>
                        <ul class="text-white list-unstyled">
                            <li>T-shirt</li>
                            <li>Shorts</li>
                            <li>Sunhat</li>
                            <li>Sandals</li>
                            <li>Sunglasses</li>
                        </ul>
                        <p class="weather-tip text-white">Tip: Don't forget sunscreen and stay hydrated!</p>
                    </div>
                    <div class="recommendations-image">
                        <img src="../images/warm-weather.png" alt="Warm weather clothing" class="weather-outfit-image">
                    </div>
                </div>
            </div>
        `;
    }

    recommendationsDiv.innerHTML = recommendations;
}

function displayActivitiesRecommendations(weatherData) {
    const activitiesDiv = document.getElementById('activities-recommendations');
    const recommendedActivities = getActivitiesRecommendations(weatherData);
    
    activitiesDiv.innerHTML = `
        <div class="recommendations-card dark">
            <div class="recommendations-container">
                <div class="recommendations-content">
                    <h3 class="text-white">Recommended Activities</h3>
                    <p class="text-white">Based on current weather: ${weatherData.current.condition.text}</p>
                    <ul class="text-white">
                        ${recommendedActivities.map(activity => `
                            <li>${activity}</li>
                        `).join('')}
                    </ul>
                    <p class="weather-tip text-white">
                        Temperature: ${weatherData.current.temp_c}°C | 
                        Wind: ${weatherData.current.wind_kph} km/h | 
                        Humidity: ${weatherData.current.humidity}%
                    </p>
                </div>
            </div>
        </div>
    `;
}

async function loadSavedDestination(city) {
    try {
        document.getElementById('location').value = city;
        
        document.getElementById('weather-info').innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading weather data for ${city}...</p>
            </div>
        `;

        const response = await fetch(
            `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${city}&days=3`
        );

        if (!response.ok) {
            throw new Error('Weather data fetch failed');
        }

        const data = await response.json();
        
        displayWeatherInfo(data);
        displayClothingRecommendations(data.current.temp_c);
        displayActivitiesRecommendations(data);

    } catch (error) {
        console.error('Error loading saved destination:', error);
        document.getElementById('weather-info').innerHTML = `
            <div class="alert alert-danger">
                Unable to fetch weather data for ${city}. Please try again.
                <br>
                Error: ${error.message}
            </div>
        `;
    }
}

function getActivitiesRecommendations(weatherData) {
    const condition = weatherData.current.condition.text.toLowerCase();
    const temp = weatherData.current.temp_c;
    const windKph = weatherData.current.wind_kph;
    const humidity = weatherData.current.humidity;
    const activities = [];

    // Temperature-based recommendations
    if (temp >= 30) {
        activities.push(
            'Swimming',
            'Water sports',
            'Visit air-conditioned places',
            'Indoor activities during peak heat',
            'Early morning or evening outdoor activities'
        );
    } else if (temp >= 20 && temp < 30) {
        activities.push(
            'Outdoor sports',
            'Hiking',
            'Cycling',
            'Picnicking',
            'Gardening',
            'Beach activities'
        );
    } else if (temp >= 10 && temp < 20) {
        activities.push(
            'Jogging',
            'Tennis',
            'Golf',
            'Sightseeing',
            'Photography'
        );
    } else {
        activities.push(
            'Indoor sports',
            'Visit museums',
            'Ice skating',
            'Shopping',
            'Indoor rock climbing'
        );
    }

    // Condition-based recommendations
    if (condition.includes('sunny') || condition.includes('clear')) {
        activities.push(
            'Outdoor dining',
            'Visit parks',
            'Outdoor photography',
            'Nature walks',
            'Outdoor markets'
        );
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
        activities.push(
            'Visit museums or galleries',
            'Watch movies',
            'Indoor shopping',
            'Spa treatments',
            'Indoor games',
            'Visit cafes or restaurants'
        );
    } else if (condition.includes('cloudy') || condition.includes('overcast')) {
        activities.push(
            'City tours',
            'Visit historical sites',
            'Light outdoor activities',
            'Photography (good lighting)',
            'Outdoor sports'
        );
    } else if (condition.includes('snow')) {
        activities.push(
            'Skiing',
            'Snowboarding',
            'Build snowman',
            'Winter photography',
            'Hot chocolate at a cafe'
        );
    }

    // Wind-based recommendations
    if (windKph > 30) {
        activities.push(
            'Windsurfing',
            'Kiteboarding',
            'Indoor activities recommended',
            'Avoid beach activities'
        );
    } else if (windKph > 15 && windKph <= 30) {
        activities.push(
            'Fly a kite',
            'Sailing',
            'Light outdoor activities'
        );
    }

    // Humidity-based recommendations
    if (humidity > 80) {
        activities.push(
            'Indoor air-conditioned activities',
            'Swimming',
            'Stay hydrated',
            'Avoid strenuous activities'
        );
    }

    // Remove duplicates and return random selection of 5 activities
    const uniqueActivities = [...new Set(activities)];
    return shuffleArray(uniqueActivities).slice(0, 5);
}

// Helper function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}