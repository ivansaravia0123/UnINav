let map = L.map('map').setView([13.48911, -88.19229], 15);
        let markers = [];
        let userMarker;
        let selectedMarker = null;
        let userLocation = null;
        let routeControl;
        let tourMarkers = [];

        let aulaLocations = [
            {
                name: "Ugb",
                location: [13.48911, -88.19229],
                image: "ugb.png"
            },
            {
                name: "UGB store",
                location: [13.48861, -88.19211],
                image: "store.png"
            },
            {
                name: "Edificio Gerardo Barrio",
                location: [13.49010, -88.19336],
                image: "gerardo.png"
            },
            {
                name: "Cancha Universitaria Gerardo Barrio",
                location: [13.48921, -88.19471],
                image: "cancha.png"
            },
            {
                name: "Auditorio",
                location: [13.48855, -88.19290],
                image: "https://example.com/auditorio.jpg"
            },
            {
                name: "Biblioteca UGB",
                location: [13.48861, -88.19184],
                image: "biblioteca.png"
            }
        ];

        let tourLocations = [
            {
                name: "Punto 1",
                location: [13.48911, -88.19229],
                image: "360_image1.jpg"
            },
            {
                name: "Punto 2",
                location: [13.49010, -88.19336],
                image: "360_image2.jpg"
            },
            {
                name: "Punto 3",
                location: [13.48861, -88.19184],
                image: "360_image3.jpg"
            }
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
                            L.latLng(userLocation[0], userLocation[1]),
                            L.latLng(selectedMarker.getLatLng().lat, selectedMarker.getLatLng().lng)
                        ]);
                    }
                }, () => {
                    alert("No se pudo obtener la ubicación actual.");
                }, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            } else {
                alert("Tu navegador no soporta geolocalización.");
            }
        }

        function getDirections() {
            if (userLocation && selectedMarker) {
                const universityBounds = L.latLngBounds([
                    [13.48700, -88.19500],
                    [13.49100, -88.19000]
                ]);

                routeControl = L.Routing.control({
                    waypoints: [
                        L.latLng(userLocation[0], userLocation[1]),
                        L.latLng(selectedMarker.getLatLng().lat, selectedMarker.getLatLng().lng)
                    ],
                    routeWhileDragging: true,
                    createMarker: function() { return null; },
                    bounds: universityBounds,
                    router: L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1',
                        profile: 'foot',
                        useHints: false
                    })
                }).addTo(map);

                map.fitBounds(universityBounds);
            } else {
                alert("No se pudo obtener la ubicación o el marcador seleccionado.");
            }
        }

        function calculateDistance(latlng1, latlng2) {
            return map.distance(latlng1, latlng2);
        }

        function clearSearch() {
            document.getElementById('search-box').value = '';
            markers.forEach(marker => marker.remove());
            document.getElementById('distance-info').textContent = '';
            if (routeControl) {
                map.removeControl(routeControl);
                routeControl = null;
            }
        }

        function startTour() {
            if (tourMarkers.length > 0) {
                tourMarkers.forEach(marker => marker.remove());
            }

            tourLocations.forEach(location => {
                const marker = L.marker(location.location, { title: location.name }).addTo(map);
                marker.bindPopup(`<img src="${location.image}" alt="${location.name}" style="width:100px;height:100px;"><br>${location.name}`).openPopup();
                tourMarkers.push(marker);
            });

            map.setView(tourLocations[0].location, 19);
        }

        // Verificar parámetros en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get('lat'));
        const lng = parseFloat(urlParams.get('lng'));

        if (!isNaN(lat) && !isNaN(lng)) {
            map.setView([lat, lng], 18);
        }

        document.getElementById('search-button').addEventListener('click', performSearch);
        document.getElementById('locate-button').addEventListener('click', startWatchingUser);
        document.getElementById('clear-button').addEventListener('click', clearSearch);
        document.getElementById('tour-button').addEventListener('click', startTour);
    </script>
</body>
</html>