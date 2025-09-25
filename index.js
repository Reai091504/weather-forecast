// WEATHER APP

const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".cityInput");
const card = document.querySelector(".card");
const submitButton = document.querySelector('button[type="submit"]');
const apiKey = "7a732e0b407f5f98bf5cd5a5e4dc98fc";

// State management
let isLoading = false;
let currentUnit = 'fahrenheit';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    cityInput.focus();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key to clear/hide results
        if (e.key === 'Escape') {
            card.style.display = 'none';
            cityInput.focus();
        }
        
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            cityInput.focus();
            cityInput.select();
        }
    });
});

weatherForm.addEventListener("submit", async event => {

    event.preventDefault();

    const city = cityInput.value.trim();

    // Input validation
    if(!city){
        displayError("Please enter a city name");
        return;
    }
    
    if(city.length < 2){
        displayError("City name must be at least 2 characters long");
        return;
    }
    
    if(!/^[a-zA-Z\s\-'.,]+$/.test(city)){
        displayError("Please enter a valid city name");
        return;
    }

    // Prevent multiple requests
    if(isLoading) return;

    try{
        setLoadingState(true);
        const weatherData = await getWeatherData(city);
        displayWeatherInfo(weatherData);
    }
    catch(error){
        console.error(error);
        displayError(getErrorMessage(error));
    }
    finally{
        setLoadingState(false);
    }
});

// Loading state management
function setLoadingState(loading) {
    isLoading = loading;
    submitButton.disabled = loading;
    submitButton.textContent = loading ? 'Loading...' : 'Get Weather';
    cityInput.disabled = loading;
    
    if (loading) {
        card.style.display = 'flex';
        card.innerHTML = '<div class="loading-message">🌤️ Fetching weather data...</div>';
    }
}

// Enhanced error message handling
function getErrorMessage(error) {
    if (error.message.includes('404')) {
        return 'City not found. Please check the spelling and try again.';
    }
    if (error.message.includes('401')) {
        return 'Weather service unavailable. Please try again later.';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Network error. Please check your internet connection.';
    }
    return 'Unable to fetch weather data. Please try again.';
}

async function getWeatherData(city){

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found (404)');
            } else if (response.status === 401) {
                throw new Error('API key invalid (401)');
            } else {
                throw new Error(`HTTP error ${response.status}`);
            }
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error - please check your connection');
        }
        throw error;
    }
}

function displayWeatherInfo(data){

    const {name: city, 
           main: {temp, humidity, feels_like, pressure}, 
           weather: [{description, id}],
           wind: {speed} = {},
           sys: {country} = {}} = data;

    card.textContent = "";
    card.style.display = "flex";

    const cityDisplay = document.createElement("h1");
    const tempDisplay = document.createElement("p");
    const feelsLikeDisplay = document.createElement("p");
    const humidityDisplay = document.createElement("p");
    const descDisplay = document.createElement("p");
    const weatherEmoji = document.createElement("p");
    const unitToggle = document.createElement("button");
    const timestamp = document.createElement("p");

    // Set content
    cityDisplay.textContent = country ? `${city}, ${country}` : city;
    
    // Temperature conversion and display
    const {tempText, feelsLikeText} = formatTemperature(temp, feels_like, currentUnit);
    tempDisplay.textContent = tempText;
    feelsLikeDisplay.textContent = `Feels like ${feelsLikeText}`;
    
    humidityDisplay.textContent = `💧 Humidity: ${humidity}%`;
    descDisplay.textContent = capitalizeWords(description);
    weatherEmoji.textContent = getWeatherEmoji(id);
    
    // Unit toggle button
    unitToggle.textContent = `Switch to °${currentUnit === 'fahrenheit' ? 'C' : 'F'}`;
    unitToggle.classList.add('unit-toggle');
    unitToggle.addEventListener('click', () => toggleTemperatureUnit(data));
    
    // Timestamp
    timestamp.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    timestamp.classList.add('timestamp');

    // Add classes
    cityDisplay.classList.add("cityDisplay");
    tempDisplay.classList.add("tempDisplay");
    feelsLikeDisplay.classList.add("feelsLikeDisplay");
    humidityDisplay.classList.add("humidityDisplay");
    descDisplay.classList.add("descDisplay");
    weatherEmoji.classList.add("weatherEmoji");

    // Append elements
    card.appendChild(cityDisplay);
    card.appendChild(tempDisplay);
    card.appendChild(feelsLikeDisplay);
    card.appendChild(humidityDisplay);
    card.appendChild(descDisplay);
    card.appendChild(weatherEmoji);
    card.appendChild(unitToggle);
    card.appendChild(timestamp);
}

// Temperature formatting and conversion
function formatTemperature(temp, feelsLike, unit) {
    if (unit === 'fahrenheit') {
        const tempF = (temp * 9/5) + 32;
        const feelsLikeF = (feelsLike * 9/5) + 32;
        return {
            tempText: `${tempF.toFixed(1)}°F`,
            feelsLikeText: `${feelsLikeF.toFixed(1)}°F`
        };
    } else {
        return {
            tempText: `${temp.toFixed(1)}°C`,
            feelsLikeText: `${feelsLike.toFixed(1)}°C`
        };
    }
}

// Temperature unit toggle
function toggleTemperatureUnit(data) {
    currentUnit = currentUnit === 'fahrenheit' ? 'celsius' : 'fahrenheit';
    displayWeatherInfo(data);
}

// Utility function to capitalize words
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

function getWeatherEmoji(weatherId){

    switch(true){
        case (weatherId >= 200 && weatherId < 300):
            return "⛈";
        case (weatherId >= 300 && weatherId < 400):
            return "🌧";
        case (weatherId >= 500 && weatherId < 600):
            return "🌧";
        case (weatherId >= 600 && weatherId < 700):
            return "❄";
        case (weatherId >= 700 && weatherId < 800):
            return "🌫";
        case (weatherId === 800):
            return "☀";
        case (weatherId >= 801 && weatherId < 810):
            return "☁";
        default:
            return "❓";
    }
}

function displayError(message){

    card.textContent = "";
    card.style.display = "flex";

    const errorContainer = document.createElement("div");
    errorContainer.classList.add("error-container");

    const errorIcon = document.createElement("p");
    errorIcon.textContent = "⚠️";
    errorIcon.classList.add("error-icon");

    const errorDisplay = document.createElement("p");
    errorDisplay.textContent = message;
    errorDisplay.classList.add("errorDisplay");

    const retryButton = document.createElement("button");
    retryButton.textContent = "Try Again";
    retryButton.classList.add("retry-button");
    retryButton.addEventListener('click', () => {
        card.style.display = 'none';
        cityInput.focus();
    });

    errorContainer.appendChild(errorIcon);
    errorContainer.appendChild(errorDisplay);
    errorContainer.appendChild(retryButton);
    card.appendChild(errorContainer);

    // Auto-hide error after 10 seconds
    setTimeout(() => {
        if (card.contains(errorContainer)) {
            card.style.display = 'none';
        }
    }, 10000);
}