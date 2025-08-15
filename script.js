// ========== DOM Elements ==========
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfo = document.getElementById('weather-info');
const recentSearches = document.getElementById('recent-searches');
const themeToggle = document.getElementById('theme-toggle');

// ========== API Setup ==========
const API_KEY = '6ce2cec8c45e59edf9bc5b4ac7fc8bc3';
const API_URL = (city) => `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;

// ========== Recent Searches ==========
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// ========== Functions ==========
// Fetch weather data
async function getWeather(city, isFromLocation = false) {
    try {
        const response = await fetch(API_URL(city));
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "City not found");
        }

        const data = await response.json();
        showWeather(data);
        addRecentCity(city);
        getForecast(city);
    } catch (error) {
        if (!isFromLocation) {
            weatherInfo.innerHTML = `<p style="color: red">❌ ${error.message}</p>`;
            weatherInfo.classList.add('active');
        }
    }
}
// ========== Get 5-Day Forecast ==========
// async function getForecast(city) {
//   const forecastContainer = document.getElementById('forecast-container');

//   try {
//     const response = await fetch(
//       `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
//     );

//     if (!response.ok) {
//       throw new Error("Forecast data not available");
//     }

//     const data = await response.json();

//     // Group forecast by day (skip 3-hour intervals)
//     const dailyForecast = {};
//     const today = new Date().getDate();

//     data.list.forEach(item => {
//       const date = new Date(item.dt * 1000);
//       const day = date.getDate();
//       const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

//       // Skip today
//       if (day === today) return;

//       // Use first reading of each day
//       if (!dailyForecast[day]) {
//         dailyForecast[day] = {
//           day: weekday,
//           date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
//           temp: item.main.temp,
//           temp_min: item.main.temp_min,
//           temp_max: item.main.temp_max,
//           icon: getWeatherIcon(item.weather[0].main),
//           description: item.weather[0].description
//         };
//       }
//     });

//     // Get first 5 days
//     const forecastData = Object.values(dailyForecast).slice(0, 5);

//     // Render forecast cards
//     const cardsHTML = forecastData.map(day => `
//       <div class="forecast-card">
//         <h4>${day.day}<br><small>${day.date}</small></h4>
//         <div class="forecast-icon">${day.icon}</div>
//         <div class="forecast-temp">${Math.round(day.temp_max)}°</div>
//         <div class="forecast-desc">${day.description}</div>
//       </div>
//     `).join('');

//     document.getElementById('forecast-container').innerHTML = `
//       <h3>5-Day Forecast</h3>
//       <div class="forecast-cards">
//         ${cardsHTML}
//       </div>
//     `;

//     document.getElementById('forecast-container').classList.add('active');
//   } catch (error) {
//     console.error("Forecast error:", error);
//     document.getElementById('forecast-container').innerHTML = `
//       <p style="color: var(--text-secondary); font-size: 0.9rem; text-align: center;">
//         📅 Could not load forecast.
//       </p>
//     `;
//     document.getElementById('forecast-container').classList.add('active');
//   }
// }

async function getForecast(city) {
  const forecastContainer = document.getElementById('forecast-container');

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Forecast data not available");
    }

    const data = await response.json();

    // Group by 3-hour intervals, then extract daily data
    const dailyMap = {};

    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.getDate();
      const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];

      // Use "Mon 5" as key to avoid conflicts across months
      const dayKey = `${weekday} ${day}`;

      // Initialize if not seen
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = {
          day: weekday,
          date: `${month} ${day}`,
          temp_max: -Infinity,
          temp_min: Infinity,
          icon: getWeatherIcon(item.weather[0].main),
          description: item.weather[0].description,
          count: 0
        };
      }

      // Update max/min temps
      if (item.main.temp_max > dailyMap[dayKey].temp_max) {
        dailyMap[dayKey].temp_max = item.main.temp_max;
      }
      if (item.main.temp_min < dailyMap[dayKey].temp_min) {
        dailyMap[dayKey].temp_min = item.main.temp_min;
      }

      // Update icon to the most "severe" one (optional logic)
      dailyMap[dayKey].icon = getWeatherIcon(item.weather[0].main);
    });

    // Convert to array and get up to 5 days (skip today)
    const today = new Date().getDate();
    const todayKey = `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]} ${today}`;

    const forecastData = Object.values(dailyMap)
      .filter(day => day.day !== todayKey)  // Skip today
      .slice(0, 5);  // Always take up to 5 days

    // If we have fewer than 5 days, just show what we have
    if (forecastData.length === 0) {
      forecastContainer.innerHTML = `
        <p style="color: var(--text-secondary); text-align: center;">
          📅 No forecast available.
        </p>
      `;
      forecastContainer.classList.add('active');
      return;
    }

    // Render forecast cards
    const cardsHTML = forecastData.map(day => `
      <div class="forecast-card">
        <h4>${day.day}<br><small>${day.date}</small></h4>
        <div class="forecast-icon">${day.icon}</div>
        <div class="forecast-temp">${Math.round(day.temp_max)}°</div>
        <div class="forecast-desc">${day.description}</div>
      </div>
    `).join('');

    forecastContainer.innerHTML = `
      <h3>5-Day Forecast</h3>
      <div class="forecast-cards">
        ${cardsHTML}
      </div>
    `;

    forecastContainer.classList.add('active');
  } catch (error) {
    console.error("Forecast error:", error);
    forecastContainer.innerHTML = `
      <p style="color: var(--text-secondary); font-size: 0.9rem; text-align: center;">
        📅 Could not load forecast.
      </p>
    `;
    forecastContainer.classList.add('active');
  }
}
// ========== Get Weather by Live Location ==========
async function getWeatherByLocation() {
    const locationBtn = document.getElementById('location-btn');

    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }

    locationBtn.disabled = true;
    const originalText = locationBtn.innerHTML;
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`📍 Lat: ${latitude}, Lon: ${longitude}`);

            try {
                // Step 1: Reverse geocode → get city name
                const geoResponse = await fetch(
                    `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
                );

                if (!geoResponse.ok) {
                    throw new Error("Geocoding failed");
                }

                const geoData = await geoResponse.json();
                if (!geoData || geoData.length === 0) {
                    showError("No city found at your location.");
                    return;
                }

                const city = geoData[0].name || geoData[0].local_names?.en || "Unknown Location";
                console.log("🏙️ Detected city:", city);

                // Step 2: Get weather by coordinates (NOT by city name)
                const weatherResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
                );

                if (!weatherResponse.ok) {
                    const error = await weatherResponse.json();
                    throw new Error(error.message || "Weather data not available");
                }

                const weatherData = await weatherResponse.json();
                showWeather(weatherData);
                addRecentCity(city);
                getForecast(city);  
            } catch (error) {
                console.error("Weather fetch error:", error);
                showError(`❌ ${error.message}`);
            } finally {
                locationBtn.disabled = false;
                locationBtn.innerHTML = originalText;
            }
        },
        (error) => {
            locationBtn.disabled = false;
            locationBtn.innerHTML = originalText;

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    showError("You denied location access. Please enable it.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    showError("Location data is unavailable.");
                    break;
                case error.TIMEOUT:
                    showError("Location request timed out.");
                    break;
                default:
                    showError("An unknown error occurred.");
                    break;
            }
        }
    );
}

// Reuse error display
function showError(message) {
    weatherInfo.innerHTML = `<p style="color: red">📍 ${message}</p>`;
    weatherInfo.classList.add('active');
}

// Display weather
function showWeather(data) {
    const { name, sys, main, weather, wind } = data;
    const icon = getWeatherIcon(weather[0].main);

    weatherInfo.innerHTML = `
    <h2>${name}, ${sys.country}</h2>
    <div class="weather-icon">${icon}</div>
    <p><strong>${Math.round(main.temp)}°C</strong></p>
    <p>${weather[0].main} - ${weather[0].description}</p>
    <p>💧 Humidity: ${main.humidity}%</p>
    <p>💨 Wind: ${wind.speed} m/s</p>
    <p>📅 ${new Date().toLocaleDateString()}</p>
  `;
    weatherInfo.classList.add('active');
}

// Map weather to emoji/icons
function getWeatherIcon(condition) {
    const icons = {
        Clear: "☀️",
        Clouds: "☁️",
        Rain: "🌧️",
        Drizzle: "🌦️",
        Thunderstorm: "⛈️",
        Snow: "❄️",
        Mist: "🌫️",
        Smoke: "🔥",
        Haze: "🌫️",
        Fog: "🌫️"
    };
    return icons[condition] || "🌤️";
}

// Add to recent searches
function addRecentCity(city) {
    if (!recentCities.includes(city)) {
        recentCities.unshift(city);
        if (recentCities.length > 5) recentCities.pop();
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        displayRecentCities();
    }
}

// Display recent cities
function displayRecentCities() {
    recentSearches.innerHTML = '';
    if (recentCities.length === 0) return;

    const h3 = document.createElement('h3');
    h3.textContent = 'Recent Cities';
    recentSearches.appendChild(h3);

    recentCities.forEach(city => {
        const span = document.createElement('span');
        span.classList.add('recent-city');
        span.textContent = city;
        span.addEventListener('click', () => getWeather(city));
        recentSearches.appendChild(span);
    });
}

// Dark Mode Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    }
});

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    displayRecentCities();
});

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) getWeather(city);
    }
});
// Live Location Button
document.getElementById('location-btn').addEventListener('click', getWeatherByLocation);