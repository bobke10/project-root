// js/map-manager.js

class MapManager {
    constructor(mapId, onMarkerClickCallback) {
        this.mapId = mapId;
        this.onMarkerClickCallback = onMarkerClickCallback;
        this.map = null;
        this.lejoMarkersLayerGroup = null;
        this.allLocationsData = [];

        this.flandersCenter = [50.95, 4.0]; // Latitude, Longitude for the center of Flanders
        this.flandersZoom = 8.5; // UPDATED from 8 - Adjust this value as needed (e.g., 8.7, 9)
        this.markerFocusZoom = 13;

        this.lejoIcon = L.divIcon({
            className: 'lejo-marker-icon', html: '<div></div>',
            iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30]
        });
        this.activeLejoIcon = L.divIcon({
            className: 'lejo-marker-icon active-lejo-marker', html: '<div></div>',
            iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -38]
        });
        this.currentOpenMarker = null;
    }

    initializeMap() {
        const mapLoader = document.getElementById('map-loader');
        if (mapLoader) mapLoader.textContent = 'Kaart initialiseren...';

        this.map = L.map(this.mapId, { preferCanvas: true, zoomControl: false })
                      .setView(this.flandersCenter, this.flandersZoom); // Uses the updated flandersZoom
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        this.lejoMarkersLayerGroup = L.featureGroup().addTo(this.map);

        if (mapLoader) mapLoader.style.display = 'none';
        return this.map;
    }

    async fetchAndLoadMarkers(jsonPath) {
        const mapLoader = document.getElementById('map-loader');
        if (mapLoader) {
            mapLoader.textContent = 'Locaties laden...';
            mapLoader.style.display = 'block';
        }
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
            this.allLocationsData = await response.json();
            this._populateMapWithMarkers(this.allLocationsData);
            if (mapLoader) mapLoader.style.display = 'none';
            return this.allLocationsData;
        } catch (error) {
            console.error("Failed to fetch/process location data:", error);
            if (mapLoader) {
                mapLoader.textContent = 'Fout bij laden locaties.';
                mapLoader.style.color = 'red';
            }
            return [];
        }
    }

    _populateMapWithMarkers(locations) {
        this.lejoMarkersLayerGroup.clearLayers();
        if (!locations || locations.length === 0) return;

        locations.forEach(location => {
            if (!location.coordinates || typeof location.coordinates.lat !== 'number' || typeof location.coordinates.lon !== 'number') {
                console.warn(`Ongeldige coördinaten voor: ${location.name || location.id}`);
                return;
            }
            const marker = L.marker([location.coordinates.lat, location.coordinates.lon], {
                icon: this.lejoIcon,
                title: location.name || location.title,
                locationId: location.id
            });

            marker.on('click', () => {
                if (this.onMarkerClickCallback) {
                    const clickedLocationData = this.allLocationsData.find(loc => loc.id === location.id);
                    this.onMarkerClickCallback(marker, clickedLocationData || location);
                }
            });
            this.lejoMarkersLayerGroup.addLayer(marker);
        });
    }

    handleMarkerActivation(marker) {
        if (this.currentOpenMarker && this.currentOpenMarker !== marker) {
            this.currentOpenMarker.setIcon(this.lejoIcon);
            if (this.currentOpenMarker.getElement()) this.currentOpenMarker.getElement().style.zIndex = 'auto';
        }
        this.currentOpenMarker = marker;
        marker.setIcon(this.activeLejoIcon);
        if (marker.getElement()) marker.getElement().style.zIndex = 1001;
        else if (marker.bringToFront) marker.bringToFront();
    }

    resetMarkerActivation() {
        if (this.currentOpenMarker) {
            this.currentOpenMarker.setIcon(this.lejoIcon);
            if (this.currentOpenMarker.getElement()) this.currentOpenMarker.getElement().style.zIndex = 'auto';
            this.currentOpenMarker = null;
        }
    }

    flyToLocation(latLng, zoom) {
        this.map.flyTo(latLng, zoom || this.markerFocusZoom, { animate: true, duration: 0.4 });
    }

    panBy(offset) {
        this.map.panBy(offset, {animate: true, duration: 0.3});
    }

    resetMapView() {
        this.map.flyTo(this.flandersCenter, this.flandersZoom, { animate: true, duration: 0.5 }); // Uses the updated flandersZoom
        this.resetMarkerActivation();
    }

    fitAllMarkers() {
        if (this.lejoMarkersLayerGroup && this.lejoMarkersLayerGroup.getLayers().length > 0) {
            const bounds = this.lejoMarkersLayerGroup.getBounds();
             if (bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.5 });
                return true;
             } else if (this.lejoMarkersLayerGroup.getLayers().length === 1) {
                 const markerLatLng = this.lejoMarkersLayerGroup.getLayers()[0].getLatLng();
                 this.flyToLocation(markerLatLng); // This will use markerFocusZoom, which is fine for a single marker
                 return true;
             }
        }
        return false;
    }

    getMapInstance() { return this.map; }
    getFlandersCenter() { return this.flandersCenter; }
    getFlandersZoom() { return this.flandersZoom; } // This getter will now return the new value
    getMarkersLayerGroup() { return this.lejoMarkersLayerGroup; }
}