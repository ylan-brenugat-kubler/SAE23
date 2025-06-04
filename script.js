// Variables globales
let map;
let currentMarker;
let weatherData = [];
let searchTimeout;
let suggestionsContainer;

// Configuration de la carte
const mapConfig = {
    defaultView: [46.603354, 1.888334], // Centre de la France
    defaultZoom: 6,
    maxZoom: 18,
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
};

// Initialisation de la carte
function initMap() {
    map = L.map('map').setView(mapConfig.defaultView, mapConfig.defaultZoom);
    
    L.tileLayer(mapConfig.tileLayer, {
        attribution: mapConfig.attribution,
        maxZoom: mapConfig.maxZoom
    }).addTo(map);
}

// Ajout d'un marqueur sur la carte
function addMarkerToMap(lat, lng, cityName, popupContent) {
    // Supprimer le marqueur précédent s'il existe
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    
    // Créer un marqueur personnalisé
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div class="marker-pin"><i class="fas fa-map-marker-alt text-red-500 text-2xl"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    
    currentMarker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
            <div class="popup-content p-2">
                <h3 class="font-bold text-lg text-blue-600">${cityName}</h3>
                <p class="text-sm text-gray-600">Latitude: ${lat.toFixed(4)}</p>
                <p class="text-sm text-gray-600">Longitude: ${lng.toFixed(4)}</p>
                ${popupContent}
            </div>
        `)
        .openPopup();
    
    // Centrer la carte sur le marqueur avec animation
    map.flyTo([lat, lng], 12, {
        animate: true,
        duration: 1.5
    });
}

// Fonction pour afficher/masquer le spinner de chargement
function toggleLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (show) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

// Fonction pour obtenir l'icône météo appropriée
function getWeatherIcon(weatherCode) {
    const icons = {
        0: '☀️', // Ensoleillé
        1: '🌤️', // Peu nuageux
        2: '⛅', // Partiellement nuageux
        3: '☁️', // Nuageux
        10: '☁️', // Couvert
        40: '🌧️', // Pluie légère
        41: '🌧️', // Pluie modérée
        42: '🌧️', // Pluie forte
        43: '❄️', // Neige légère
        44: '❄️', // Neige modérée
        45: '❄️', // Neige forte
        60: '🌦️', // Averses légères
        61: '🌦️', // Averses modérées
        62: '⛈️', // Averses fortes
        210: '⛈️', // Orage faible
        211: '⛈️', // Orage modéré
        212: '⛈️', // Orage fort
    };
    return icons[weatherCode] || '🌤️';
}

// Fonction pour obtenir la description météo
function getWeatherDescription(weatherCode) {
    const descriptions = {
        0: 'Ensoleillé',
        1: 'Peu nuageux',
        2: 'Partiellement nuageux',
        3: 'Nuageux',
        10: 'Couvert',
        40: 'Pluie légère',
        41: 'Pluie modérée',
        42: 'Pluie forte',
        43: 'Neige légère',
        44: 'Neige modérée',
        45: 'Neige forte',
        60: 'Averses légères',
        61: 'Averses modérées',
        62: 'Averses fortes',
        210: 'Orage faible',
        211: 'Orage modéré',
        212: 'Orage fort'
    };
    return descriptions[weatherCode] || 'Conditions météo inconnues';
}

// Fonction pour obtenir la classe CSS de température
function getTempClass(temp) {
    if (temp >= 25) return 'temp-hot';
    if (temp >= 15) return 'temp-warm';
    if (temp >= 5) return 'temp-cool';
    return 'temp-cold';
}

// Fonction pour créer une carte météo
function createWeatherCard(day, cityName, index, info, lat, lng) {
    const date = new Date(day.datetime);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const weather = getWeatherDescription(day.weather);
    const weatherIcon = getWeatherIcon(day.weather);
    const tempMinClass = getTempClass(day.tmin);
    const tempMaxClass = getTempClass(day.tmax);
    
    const card = document.createElement('div');
    card.className = 'weather-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const additionalInfo = [];
    if (info.includes('latitude')) additionalInfo.push(`<span class="info-badge"><i class="fas fa-globe-americas mr-1"></i>Lat: ${lat.toFixed(4)}</span>`);
    if (info.includes('longitude')) additionalInfo.push(`<span class="info-badge"><i class="fas fa-globe-americas mr-1"></i>Lng: ${lng.toFixed(4)}</span>`);
    if (info.includes('rain')) additionalInfo.push(`<span class="info-badge"><i class="fas fa-tint mr-1"></i>Pluie: ${day.rr10 || 0} mm</span>`);
    if (info.includes('wind-speed')) additionalInfo.push(`<span class="info-badge"><i class="fas fa-wind mr-1"></i>Vent: ${day.wind10m || 0} km/h</span>`);
    if (info.includes('wind-direction')) additionalInfo.push(`<span class="info-badge"><i class="fas fa-compass mr-1"></i>Direction: ${day.dirwind10m || 0}°</span>`);
    
    card.innerHTML = `
        <div class="flex flex-col h-full">
            <div class="flex items-start justify-between mb-4">
                <div>
                    <h3 class="text-lg font-bold text-gray-800 mb-1">
                        ${cityName.toUpperCase()}
                    </h3>
                    <p class="text-sm text-gray-600 capitalize">
                        ${formattedDate}
                    </p>
                </div>
                <div class="text-4xl weather-icon">
                    ${weatherIcon}
                </div>
            </div>
            
            <div class="mb-4">
                <p class="text-base font-medium text-gray-700 mb-2">
                    ${weather}
                </p>
                <div class="flex items-center space-x-2">
                    <span class="temp-indicator ${tempMinClass}">
                        <i class="fas fa-thermometer-quarter mr-1"></i>
                        Min: ${day.tmin}°C
                    </span>
                    <span class="temp-indicator ${tempMaxClass}">
                        <i class="fas fa-thermometer-three-quarters mr-1"></i>
                        Max: ${day.tmax}°C
                    </span>
                </div>
            </div>
            
            <div class="space-y-2 mb-4">
                <div class="flex items-center text-sm text-gray-600">
                    <i class="fas fa-sun mr-2 text-yellow-500"></i>
                    <span>Ensoleillement: ${day.sun_hours || 0}h</span>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <i class="fas fa-cloud-rain mr-2 text-blue-500"></i>
                    <span>Probabilité de pluie: ${day.probarain || 0}%</span>
                </div>
            </div>
            
            ${additionalInfo.length > 0 ? `
                <div class="mt-auto pt-4 border-t border-gray-200">
                    <div class="flex flex-wrap gap-1">
                        ${additionalInfo.join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Gestionnaire de soumission du formulaire
document.getElementById('weather-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const city = document.getElementById('city').value.trim();
    const days = parseInt(document.getElementById('days').value);
    const info = Array.from(document.querySelectorAll('input[name="info"]:checked')).map(input => input.value);
    
    if (!city) {
        showError('Veuillez entrer le nom d\'une ville');
        return;
    }
    
    toggleLoading(true);
    
    try {
        // Étape 1: Recherche de la ville
        const apiToken = '98dccdd29cc6a31bc53e69d7ad0f3589deba60cdb6a473f7bfd0de1ae306b4e0';
        const searchUrl = `https://api.meteo-concept.com/api/location/cities?token=${apiToken}&search=${encodeURIComponent(city)}`;
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (!searchData.cities || searchData.cities.length === 0) {
            throw new Error('Ville non trouvée. Vérifiez l\'orthographe et réessayez.');
        }
        
        const { insee, latitude, longitude, name } = searchData.cities[0];
        
        // Étape 2: Récupération des prévisions météo
        const forecastUrl = `https://api.meteo-concept.com/api/forecast/daily?token=${apiToken}&insee=${insee}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        if (!forecastData.forecast) {
            throw new Error('Impossible de récupérer les prévisions météo');
        }
        
        // Sauvegarde des données météo
        weatherData = forecastData.forecast.slice(0, days);
        
        // Étape 3: Mise à jour de la carte
        const popupContent = `
            <div class="mt-2">
                <p class="text-sm"><strong>Météo aujourd'hui:</strong></p>
                <p class="text-sm">${getWeatherDescription(weatherData[0].weather)}</p>
                <p class="text-sm">Température: ${weatherData[0].tmin}°C - ${weatherData[0].tmax}°C</p>
            </div>
        `;
        
        addMarkerToMap(latitude, longitude, name || city, popupContent);
        
        // Étape 4: Affichage des résultats météo
        displayWeatherResults(weatherData, name || city, info, latitude, longitude);
        
    } catch (error) {
        console.error('Erreur:', error);
        showError(error.message);
    } finally {
        toggleLoading(false);
    }
});

// Fonction pour afficher les résultats météo
function displayWeatherResults(forecasts, cityName, info, lat, lng) {
    const resultsDiv = document.getElementById('weather-results');
    resultsDiv.innerHTML = '';
    
    forecasts.forEach((day, index) => {
        const card = createWeatherCard(day, cityName, index, info, lat, lng);
        resultsDiv.appendChild(card);
    });
    
    // Animation d'apparition en cascade
    const cards = resultsDiv.querySelectorAll('.weather-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-fade-in');
        }, index * 100);
    });
}

// Fonction pour afficher les erreurs
function showError(message) {
    const resultsDiv = document.getElementById('weather-results');
    resultsDiv.innerHTML = `
        <div class="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl shadow-lg animate-fade-in">
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-3 text-lg"></i>
                <div>
                    <h3 class="font-semibold">Erreur</h3>
                    <p class="text-sm">${message}</p>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour la recherche de villes avec code postal
async function searchCitiesAndPostalCodes(query) {
    try {
        const apiToken = '98dccdd29cc6a31bc53e69d7ad0f3589deba60cdb6a473f7bfd0de1ae306b4e0';
        let searchUrl;
        
        // Vérifier si c'est un code postal (5 chiffres)
        const isPostalCode = /^\d{5}$/.test(query);
        
        if (isPostalCode) {
            // Recherche par code postal
            searchUrl = `https://api.meteo-concept.com/api/location/cities?token=${apiToken}&postal=${query}`;
        } else {
            // Recherche par nom de ville
            searchUrl = `https://api.meteo-concept.com/api/location/cities?token=${apiToken}&search=${encodeURIComponent(query)}`;
        }
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.cities && data.cities.length > 0) {
            showSuggestions(data.cities.slice(0, 8), query);
        } else {
            hideSuggestions();
        }
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        hideSuggestions();
    }
}

// Fonction pour afficher les suggestions
function showSuggestions(cities, query) {
    if (!suggestionsContainer) {
        suggestionsContainer = document.getElementById('suggestions');
    }
    
    suggestionsContainer.innerHTML = '';
    
    cities.forEach(city => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        
        // Mettre en évidence le terme recherché
        const cityName = highlightText(city.name, query);
        const postalCode = city.postal || city.cp || 'N/A';
        const department = city.departement || '';
        const region = city.region || '';
        
        suggestionItem.innerHTML = `
            <div class="suggestion-main">
                <div class="suggestion-city">${cityName}</div>
                <div class="suggestion-details">
                    ${department}${region ? `, ${region}` : ''}
                </div>
            </div>
            <div class="suggestion-postal">${postalCode}</div>
        `;
        
        // Gestionnaire de clic
        suggestionItem.addEventListener('click', () => {
            document.getElementById('city').value = city.name;
            hideSuggestions();
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    suggestionsContainer.classList.remove('hidden');
}

// Fonction pour masquer les suggestions
function hideSuggestions() {
    if (suggestionsContainer) {
        suggestionsContainer.classList.add('hidden');
        suggestionsContainer.innerHTML = '';
    }
}

// Fonction pour mettre en évidence le texte recherché
function highlightText(text, query) {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
}

// Fonction pour gérer la recherche en temps réel
function initLiveSearch() {
    const cityInput = document.getElementById('city');
    
    cityInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            hideSuggestions();
            return;
        }
        
        // Délai pour éviter trop de requêtes
        searchTimeout = setTimeout(() => {
            searchCitiesAndPostalCodes(query);
        }, 300);
    });
    
    // Masquer les suggestions quand on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#city') && !e.target.closest('#suggestions')) {
            hideSuggestions();
        }
    });
    
    // Navigation au clavier dans les suggestions
    cityInput.addEventListener('keydown', (e) => {
        const suggestions = document.querySelectorAll('.suggestion-item');
        const currentFocus = document.querySelector('.suggestion-item.focused');
        let index = Array.from(suggestions).indexOf(currentFocus);
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentFocus) currentFocus.classList.remove('focused');
            index = index < suggestions.length - 1 ? index + 1 : 0;
            if (suggestions[index]) suggestions[index].classList.add('focused');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentFocus) currentFocus.classList.remove('focused');
            index = index > 0 ? index - 1 : suggestions.length - 1;
            if (suggestions[index]) suggestions[index].classList.add('focused');
        } else if (e.key === 'Enter' && currentFocus) {
            e.preventDefault();
            currentFocus.click();
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });
}

// Gestion du redimensionnement de la carte
function handleMapResize() {
    window.addEventListener('resize', () => {
        if (map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    });
}

// Fonction d'initialisation complète
function initApp() {
    // Initialisation de la carte
    initMap();
    
    // Initialisation de la recherche en temps réel
    initLiveSearch();
    
    // Gestion du redimensionnement
    handleMapResize();
    
    // Animation d'entrée pour les éléments
    setTimeout(() => {
        document.querySelectorAll('.animate-fade-in').forEach(el => {
            el.classList.add('opacity-100');
        });
    }, 100);
    
    console.log('Application météo initialisée avec succès! 🌤️');
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur globale:', event.error);
});

// Service Worker pour la mise en cache (optionnel)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        console.log('Service Worker support détecté');
    });
}