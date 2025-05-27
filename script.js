document.getElementById('weather-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = document.getElementById('city').value;
    const days = document.getElementById('days').value;
    const info = Array.from(document.querySelectorAll('input[name="info"]:checked')).map(input => input.value);
    
    try {
        // Step 1: Get city coordinates from Météo Concept API
        const apiToken = '98dccdd29cc6a31bc53e69d7ad0f3589deba60cdb6a473f7bfd0de1ae306b4e0'; // Replace with your Météo Concept API token
        const searchUrl = `https://api.meteo-concept.com/api/location/cities?token=${apiToken}&search=${encodeURIComponent(city)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (!searchData.cities || searchData.cities.length === 0) {
            throw new Error('Ville non trouvée');
        }
        
        const { insee, latitude, longitude } = searchData.cities[0];
        
        // Step 2: Get weather forecast
        const forecastUrl = `https://api.meteo-concept.com/api/forecast/daily?token=${apiToken}&insee=${insee}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        if (!forecastData.forecast) {
            throw new Error('Erreur lors de la récupération des prévisions');
        }
        
        // Step 3: Display results
        const resultsDiv = document.getElementById('weather-results');
        resultsDiv.innerHTML = '';
        
        const forecasts = forecastData.forecast.slice(0, days);
        forecasts.forEach((day, index) => {
            const date = new Date(day.datetime).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Map Météo Concept weather code to a description (simplified)
            const weatherDescriptions = {
                0: 'Ensoleillé',
                1: 'Peu nuageux',
                10: 'Couvert',
                40: 'Pluie',
                // Add more mappings as needed
            };
            const weather = weatherDescriptions[day.weather] || 'Inconnu';
            
            // Use a placeholder icon URL (replace with actual icon source if available)
            const iconUrl = `http://openweathermap.org/img/wn/10d@2x.png`; // Placeholder
            
            const card = document.createElement('div');
            card.className = 'weather-card';
            card.innerHTML = `
                <h2 class="text-lg font-semibold">${city.toUpperCase()} - ${date}</h2>
                <img src="${iconUrl}" alt="Icône météo">
                <p><strong>${weather}</strong></p>
                <p>T min : ${day.tmin}°C</p>
                <p>T max : ${day.tmax}°C</p>
                <p>Ensoleillement : ${day.sun_hours} heures</p>
                <p>Probabilité de pluie : ${day.probarain}%</p>
                ${info.includes('latitude') ? `<p>Latitude : ${latitude}</p>` : ''}
                ${info.includes('longitude') ? `<p>Longitude : ${longitude}</p>` : ''}
                ${info.includes('rain') ? `<p>Cumul pluie : ${day.rr10} mm</p>` : ''}
                ${info.includes('wind-speed') ? `<p>Vent moyen (10m) : ${day.wind10m} km/h</p>` : ''}
                ${info.includes('wind-direction') ? `<p>Direction du vent : ${day.dirwind10m}°</p>` : ''}
            `;
            resultsDiv.appendChild(card);
        });
    } catch (error) {
        const resultsDiv = document.getElementById('weather-results');
        resultsDiv.innerHTML = `<p class="text-red-500">Erreur : ${error.message}</p>`;
    }
});

// Dark Mode Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
}