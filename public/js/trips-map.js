const listPanel = document.getElementById('trips-list-view');
const mapPanel = document.getElementById('trips-map-view');
var tripsPageData = document.getElementById('tripsPageData');
var owner = '';

if (tripsPageData && tripsPageData.dataset.owner) {
    owner = tripsPageData.dataset.owner;
}

const toggleButtons = document.querySelectorAll('.trips-toggle .toggle-btn');

let map; 
let mapInitialized = false;
let markers = [];

toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        if (view === 'map') {
            if (listPanel) listPanel.classList.remove('active');
            if (mapPanel) mapPanel.classList.add('active');
            showMap();
        } else {
            if (mapPanel) mapPanel.classList.remove('active');
            if (listPanel) listPanel.classList.add('active');
        }
    });
});

const visitedIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
    iconSize: [32, 32],
    iconAnchor: [22, 32],
    popupAnchor: [-3, -32]
});

const wishIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    iconSize: [32, 32],
    iconAnchor: [22, 32],
    popupAnchor: [-3, -32]
});

async function loadTrips() {
    var endpoint = '/api/trips';
    if (owner) {
        endpoint = '/api/trips/user/' + owner;
    }

    var response = await fetch(endpoint);
    return await response.json();
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

const tripColors = [
    'pink', 'ltblue', 'purple', 'green', 'blue', 'red'
];

function getTripColor(tripId) {
    return tripColors[tripId % tripColors.length];
}

function createTripIcon(color) {
    return L.icon({
        iconUrl: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        iconSize: [32, 32],
        iconAnchor: [22, 32],
        popupAnchor: [-3, -32]
    });
}

async function renderTripsOnMap() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const trips = await loadTrips();
    const today = new Date();
    const filterWish = document.getElementById('trips-map-filter-wishlist').checked;
    const filterVisited = document.getElementById('trips-map-filter-visited').checked;

    updateMapStats(trips);

    for (const trip of trips) {
        const color = getTripColor(trip.id);
        const tripIcon = createTripIcon(color);

        for (const loc of trip.locations) {
            const status = loc.visited ? 'visited' : 'wishlist';

            if ((status === 'visited' && !filterVisited) || (status === 'wishlist' && !filterWish)) {
                continue;
            }

            const coords = await geocodeLocation(loc.country, loc.city);
            if (!coords) continue;

            const marker = L.marker([coords.lat, coords.lon], { icon: tripIcon }).addTo(map);
            markers.push(marker);

            const dateString = new Date(loc.date).toLocaleDateString("nl-BE");

            marker.bindPopup(
                '<a href="/trip/' + trip.id + '" class="map-trip-link">' +
                trip.title +
                '</a>'
            );
        }
    }
    updateMapStats(trips);
}

document.getElementById('trips-map-filter-wishlist').addEventListener('change', renderTripsOnMap);
document.getElementById('trips-map-filter-visited').addEventListener('change', renderTripsOnMap);

function showMap() {
    if (!mapInitialized) {
        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        mapInitialized = true;
    }
    renderTripsOnMap();
}

if (mapPanel && mapPanel.classList.contains('active')) {
    showMap();
}

function updateMapStats(trips) {
    let total = 0;
    let visited = 0;
    let wishlist = 0;

    trips.forEach(trip => {
        trip.locations.forEach(loc => {
            total++;
            if (loc.visited) visited++;
            else wishlist++;
        });
    });

    document.getElementById('trips-map-total').textContent = `Total Locations: ${total}`;
    document.getElementById('trips-map-visited').textContent = `Visited: ${visited}`;
    document.getElementById('trips-map-wishlist').textContent = `Wishlist: ${wishlist}`;
}
