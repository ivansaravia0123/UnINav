let map = L.map('map').setView([13.48911, -88.19229], 15);
let markers = [];
let userMarker;
let selectedMarker = null;
let userLocation = null;
let routeControl;
let tourMarkers = [];

let aulaLocations = [
    { name: "Ugb", location: [13.48911, -88.19229], image: "ugb.png" },
    { name: "UGB store", location: [13.48861, -88.19211], image: "store.png" },
    { name: "Edificio Gerardo Barrio", location: [13.49010, -88.19336], image: "gerardo.png" },
    { name: "Cancha Universitaria Gerardo Barrio", location: [13.48921, -88.19471], image: "cancha.png" },
    { name: "Auditorio", location: [13.48855, -88.19290], image: "https://example.com/auditorio.jpg" },
    { name: "Biblioteca UGB", location: [13.48861, -88.19184], image: "biblioteca.png" }
];

let tourLocations = [
    { name: "Punto 1", location: [13.48911, -88.19229], image: "360_image1.jpg" },
    { name: "Punto 2", location: [13.49010, -88.19336], image: "360_image2.jpg" },
    { name: "Punto 3", location: [13.48861, -88.19184], image: "360_image3.jpg" }
];

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Inicialmente ocultar los marcadores
aulaLocations.forEach(aula => {
    let marker = L.marker(aula.location, { title: aula.name }).on('click', function() {
        selectedMarker = marker;
        showInfoWindow(aula, marker);
    });
    markers.push(marker);
});

function showInfoWindow(aula, marker) {
    const infoWindowContent = `
        <div class="info-window-content">
            <img src="${aula.image}" alt="${aula.name}">
            <strong>${aula.name}</strong>
            <button onclick="getDirections()">Cómo llegar aquí</button>
        </div>
    `;
    L.popup()
        .setLatLng(marker.getLatLng())
        .setContent(infoWindowContent)
        .openOn(map);
}

function performSearch() {
    let query = document.getElementById('search-box').value.toLowerCase();
    let found = false;

    // Limpiar todos los marcadores del mapa
    markers.forEach(marker => marker.remove());

    markers.forEach(marker => {
        if (marker.options.title.toLowerCase().includes(query)) {
            marker.addTo(map);
            map.setView(marker.getLatLng(), 19);
            found = true;
            selectedMarker = marker;
            const aula = aulaLocations.find(a => a.name.toLowerCase().includes(query));
            showInfoWindow(aula, marker);

            if (userMarker) {
                userMarker.addTo(map);
            }

            if (userLocation) {
                const distance = calculateDistance(userLocation, marker.getLatLng());
                document.getElementById('distance-info').textContent = `Distancia a ${marker.options.title}: ${Math.round(distance)} metros`;
            }

            document.getElementById('search-box').value = '';
        }
    });

    if (!found) {
        alert('Aula no encontrada. Por favor, intenta con otro nombre.');
        document.getElementById('distance-info').textContent = '';
    }
}

function startWatchingUser() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(position => {
            userLocation = [position.coords.latitude, position.coords.longitude];
            if (userMarker) {
                userMarker.setLatLng(userLocation);
            } else {
                userMarker = L.marker(userLocation, {
                    icon: L.icon({
                        iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/man.png',
                        iconSize: [32, 37],
                        iconAnchor: [16, 37]
                    }),
                    title: "Estás aquí"
                }).addTo(map);
            }
            map.setView(userLocation, 18);

            if (routeControl) {
                routeControl.setWaypoints([
                    L.latLng(userLocation),
                    L.latLng(selectedMarker.getLatLng())
                ]);
            }
        });
    } else {
        alert("La geolocalización no está soportada por este navegador.");
    }
}

function getDirections() {
    if (!userLocation || !selectedMarker) {
        alert("Por favor, asegúrate de que tu ubicación esté disponible y selecciona una aula.");
        return;
    }

    if (routeControl) {
        routeControl.setWaypoints([
            L.latLng(userLocation),
            L.latLng(selectedMarker.getLatLng())
        ]);
    } else {
        routeControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation),
                L.latLng(selectedMarker.getLatLng())
            ],
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            lineOptions: {
                styles: [{ color: 'blue', weight: 4 }]
            },
            createMarker: function() { return null; }
        }).addTo(map);
    }
}

function clearSearch() {
    markers.forEach(marker => marker.remove());
    if (userMarker) {
        userMarker.addTo(map);
    }
    document.getElementById('distance-info').textContent = '';
}

function startTour() {
    // Limpiar los marcadores anteriores
    markers.forEach(marker => marker.remove());

    // Mostrar los puntos del tour
    tourLocations.forEach(tourLocation => {
        let marker = L.marker(tourLocation.location).addTo(map).bindPopup(`
            <div class="info-window-content">
                <strong>${tourLocation.name}</strong>
                <img src="${tourLocation.image}" alt="${tourLocation.name}">
            </div>
        `);
        tourMarkers.push(marker);
    });

    // Mostrar el botón de "Cerrar Tour"
    document.getElementById('end-tour-button').style.display = 'inline';
}

function endTour() {
    tourMarkers.forEach(marker => marker.remove());
    tourMarkers = [];
    document.getElementById('end-tour-button').style.display = 'none';
}

function calculateDistance(latlng1, latlng2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (latlng2.lat - latlng1[0]) * Math.PI / 180;
    const dLng = (latlng2.lng - latlng1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(latlng1[0] * Math.PI / 180) * Math.cos(latlng2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en metros
}

document.getElementById('search-button').addEventListener('click', performSearch);
document.getElementById('locate-button').addEventListener('click', startWatchingUser);
document.getElementById('clear-button').addEventListener('click', clearSearch);
document.getElementById('tour-button').addEventListener('click', startTour);
document.getElementById('end-tour-button').addEventListener('click', endTour);
