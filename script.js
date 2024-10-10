let map = L.map('map').setView([13.48911, -88.19229], 15);
let markers = [];
let userMarker;
let selectedMarker = null;
let userLocation = null;
let routeControl;
let tourMarkers = [];

// Ubicaciones de aulas
let aulaLocations = [
    { name: "Ugb", location: [13.48911, -88.19229], image: "ugb.png" },
    { name: "UGB store", location: [13.48861, -88.19211], image: "store.png" },
    { name: "Edificio Gerardo Barrio", location: [13.49010, -88.19336], image: "gerardo.png" },
    { name: "Cancha Universitaria Gerardo Barrio", location: [13.48921, -88.19471], image: "cancha.png" },
    { name: "Auditorio", location: [13.48855, -88.19290], image: "https://example.com/auditorio.jpg" },
    { name: "Biblioteca UGB", location: [13.48861, -88.19184], image: "biblioteca.png" }
];

// Ubicaciones del tour
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
            document.getElementById('search-box').value = '';
        }
    });

    if (!found) {
        alert('Aula no encontrada. Por favor, intenta con otro nombre.');
    }
}

function startWatchingUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
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
        }, showError);
    } else {
        alert("La geolocalización no está soportada por este navegador.");
    }
}

function getDirections() {
    if (!userLocation || !selectedMarker) {
        alert("Por favor, asegúrate de que tu ubicación esté disponible y selecciona una aula.");
        return;
    }
    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(userLocation),
            L.latLng(selectedMarker.getLatLng())
        ],
        routeWhileDragging: true
    }).addTo(map);
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("El usuario negó la solicitud de geolocalización.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("La ubicación no está disponible.");
            break;
        case error.TIMEOUT:
            alert("La solicitud de ubicación ha expirado.");
            break;
        case error.UNKNOWN_ERROR:
            alert("Se ha producido un error desconocido.");
            break;
    }
}

window.onload = startWatchingUser; // Llamar a startWatchingUser al cargar la página

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Añadir evento para el botón de abrir/cerrar el menú
document.getElementById('toggle-button').addEventListener('click', toggleSidebar);
document.getElementById('search-button').addEventListener('click', performSearch);
document.getElementById('clear-button').addEventListener('click', () => {
    markers.forEach(marker => marker.remove());
    document.getElementById('search-box').value = '';
});
document.getElementById('tour-button').addEventListener('click', () => {
    tourMarkers.forEach(marker => marker.remove());
    tourLocations.forEach(tourLocation => {
        let marker = L.marker(tourLocation.location).addTo(map).bindPopup(tourLocation.name);
        tourMarkers.push(marker);
    });
    alert('Tour iniciado.');
});
document.getElementById('end-tour-button').addEventListener('click', () => {
    tourMarkers.forEach(marker => marker.remove());
    alert('Tour finalizado.');
});

