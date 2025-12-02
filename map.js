var map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

async function loadTrips() {
    const res = await fetch('/api/trips');
    return await res.json();
}


async function geocodeLocation(country, city) {
    const query = encodeURIComponent(city + " " + country);

    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    const res = await fetch(url, { headers: { 'User-Agent': 'GloboApp/1.0' } });
    const data = await res.json();

    if (data.length === 0) {
        return null;
    }

    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
    };
}

async function renderTripsOnMap() {
    const trips = await loadTrips();

    for (let i = 0; i < trips.length; i++) {

        const trip = trips[i];

        const coords = await geocodeLocation(trip.country, trip.city);

        if (coords) {
            const marker = L.marker([coords.lat, coords.lon]).addTo(map);

            const dateString = new Date(trip.date).toLocaleDateString("nl-BE");

            marker.bindPopup(`
                <strong>${trip.country}</strong><br>
                ${trip.city}<br>
                ${dateString}<br>
                ${trip.activity}
            `);
        }

    }
}

renderTripsOnMap();
