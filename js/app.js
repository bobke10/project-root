// js/app.js

class App {
    constructor() {
        this.zoomLevelIndicator = document.getElementById('zoomLevel');
        this.infoPane = document.getElementById('info-pane');
        this.infoPaneTitle = document.getElementById('info-pane-title');
        this.infoPaneImage = document.getElementById('info-pane-image');
        this.infoPaneContentDiv = document.getElementById('info-pane-content');

        this.contentSlides = document.querySelectorAll('.content-slide');
        this.lightboxElement = document.getElementById('lightbox');
        this.lightboxCloseBtn = this.lightboxElement?.querySelector('.lightbox-close-btn');
        this.kioskManager = null; // Add this
        this.helpButton = document.getElementById('btn-help');
        this.helpOverlay = document.getElementById('help-overlay');
        this.helpCloseButton = document.getElementById('help-close-btn');

        this.currentSlideId = 'slide-intro';
        this.isPaneVisible = false;
        this.allLocationsData = [];

        this.genericPdfIconPath = 'images/ui/default_pdf_icon.png';

        if (typeof UIComponents === 'undefined' || typeof MapManager === 'undefined') {
            console.error("CRITICAL: UIComponents or MapManager class not defined. App cannot initialize. Check script load order in index.html.");
            document.body.innerHTML = '<div style="padding:20px;text-align:center;font-size:1.2em;color:red;">Application Error: Core components failed to load. Please contact support or refresh.</div>';
            return;
        }
        this.ui = new UIComponents();
        this.mapManager = new MapManager('map', (marker, locationData) => this.onMarkerClick(marker, locationData));

        this.initialize();
    }

    initialize() {
        if (!this.mapManager || !this.ui) {
            console.error("App initialization skipped due to missing core components.");
            return;
        }
        this.mapManager.initializeMap();
        this.loadDataAndSetup();
        this.setupEventListeners();
        this.updateZoomLevelIndicator('Introductie');
        this.updateControlsActiveState();

        // Initialize Kiosk Manager
        if (typeof KioskManager !== 'undefined') {
            // Set inactivity timeout to 2 minutes (120000 ms) for example
            this.kioskManager = new KioskManager(this, 120000);
        } else {
            console.warn('KioskManager class not defined. Inactivity tracking will not start.');
        }
    }

    initialize() {
        if (!this.mapManager || !this.ui) {
            console.error("App initialization skipped due to missing core components.");
            return;
        }
        this.mapManager.initializeMap();
        this.loadDataAndSetup();
        this.setupEventListeners();
        this.updateZoomLevelIndicator('Introductie');
        this.updateControlsActiveState();
    }

    async loadDataAndSetup() {
        this.allLocationsData = await this.mapManager.fetchAndLoadMarkers('data/locations.json');
        this.handleLocationHash();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.helpOverlay && this.helpOverlay.classList.contains('visible')) {
                    this.hideHelpOverlay();
                } else if (this.ui.lightbox && this.ui.lightbox.classList.contains('visible')) {
                    this.closeLightbox();
                } else if (this.isPaneVisible) {
                    this.hideInfoPane();
                } else if (this.currentSlideId && this.currentSlideId !== 'slide-intro') {
                    this.showSlide('slide-intro');
                }
            }
        });
        window.addEventListener('hashchange', () => this.handleLocationHash());

        if (this.lightboxElement) {
            this.lightboxElement.addEventListener('click', (event) => {
                if (event.target === this.lightboxElement) {
                    this.closeLightbox();
                }
            });
        }
        if (this.lightboxCloseBtn) {
            this.lightboxCloseBtn.addEventListener('click', () => this.closeLightbox());
        }

        if (this.helpButton) {
            this.helpButton.addEventListener('click', () => this.showHelpOverlay());
        }
        if (this.helpOverlay) {
            this.helpOverlay.addEventListener('click', (event) => {
                if (event.target === this.helpOverlay) {
                    this.hideHelpOverlay();
                }
            });
        }
        if (this.helpCloseButton) {
            this.helpCloseButton.addEventListener('click', () => this.hideHelpOverlay());
        }
    }

    handleLocationHash() {
        if (this.allLocationsData.length === 0) return;

        const locationIdFromHash = window.location.hash.substring(1);
        if (locationIdFromHash) {
            const targetLocationData = this.allLocationsData.find(loc => loc.id === locationIdFromHash);
            const markers = this.mapManager.getMarkersLayerGroup()?.getLayers() || [];
            const targetMarker = markers.find(m => m.options.locationId === locationIdFromHash);

            if (targetMarker && targetLocationData) {
                this.hideHelpOverlay();
                this.hideAllSlides(); this.currentSlideId = null;
                this.onMarkerClick(targetMarker, targetLocationData);
            } else {
                console.warn(`Location ID from hash '${locationIdFromHash}' not found.`);
                history.replaceState(null, null, window.location.pathname + window.location.search);
                if (!this.isPaneVisible && !this.currentSlideId) this.showSlide('slide-intro');
            }
        } else if (!this.isPaneVisible && !this.currentSlideId) {
            this.showSlide('slide-intro');
        }
    }

    onMarkerClick(marker, locationData) {
        this.hideHelpOverlay();
        this.hideAllSlides();
        this.currentSlideId = null;
        this.mapManager.handleMarkerActivation(marker);

        if (locationData && locationData.coordinates) {
            const targetLatLng = L.latLng(locationData.coordinates.lat, locationData.coordinates.lon);
            this.mapManager.flyToLocation(targetLatLng);

            setTimeout(() => {
                const paneWasVisible = this.isPaneVisible;
                this._populateAndShowInfoPane(locationData);

                if (!paneWasVisible) {
                    const paneWidthEstimate = this.infoPane.offsetWidth > 0 ? this.infoPane.offsetWidth : (window.innerWidth * 0.33);
                    const mapOffset = -paneWidthEstimate / 2.2;
                    const mapInstance = this.mapManager.getMapInstance();
                    if (mapInstance && mapInstance.getBounds().contains(targetLatLng)) {
                        this.mapManager.panBy([mapOffset, 0]);
                    }
                }

                this.updateZoomLevelIndicator(`Locatie: ${locationData.title || locationData.name}`);
                if (window.location.hash !== `#${locationData.id}`) {
                    history.pushState(null, null, `#${locationData.id}`);
                }

                this.isPaneVisible = true;
                this.infoPane.classList.add('visible');
                this.updateControlsActiveState();
            }, 150);
        } else {
            console.warn(`No data or coordinates for marker:`, marker.options.locationId, locationData);
            this.hideInfoPane();
            this.updateControlsActiveState();
        }
    }

    _createMediaButtonElement(mediaItem) {
        const button = document.createElement('a');
        button.href = '#';
        button.classList.add('fun-media-button');
        button.dataset.type = mediaItem.type;
        button.dataset.title = mediaItem.alt || mediaItem.id || 'Media';

        let icon = '🔗';
        let text = mediaItem.alt || mediaItem.id || 'Bekijk media';

        if (mediaItem.type === 'youtube') {
            icon = '▶';
            let videoId = mediaItem.src; // Default to src if parsing fails
            try {
                if (mediaItem.src.includes('youtu.be/')) {
                    videoId = mediaItem.src.split('youtu.be/')[1]?.split(/[?&]/)[0];
                } else if (mediaItem.src.includes('youtube.com/watch')) {
                    const urlParams = new URL(mediaItem.src).searchParams;
                    videoId = urlParams.get('v') || videoId; // Fallback to original src if 'v' param not found
                }
            } catch (e) { console.warn("Error parsing YouTube URL, using full src as videoId potentially:", mediaItem.src, e); }
            button.dataset.videoId = videoId; // Store the extracted/original video ID
            text = `${mediaItem.alt || 'YouTube Video'}`;
        } else if (mediaItem.type === 'local-video') {
            icon = '🎬';
            button.dataset.localVideoSrc = mediaItem.src;
            text = `${mediaItem.alt || 'Lokale Video'}`;
        } else if (mediaItem.type === 'instagram') {
            icon = '📷';
            button.dataset.url = mediaItem.src;
            text = `${mediaItem.alt || 'Instagram'}`;
        } else if (mediaItem.type === 'pdf-link') {
            icon = '📄';
            button.dataset.url = mediaItem.src;
            text = `${mediaItem.alt || 'PDF Document'}`;
        } else if (['spotify-link', 'vimeo-link', 'sharepoint-link', 'link', 'facebook-video'].includes(mediaItem.type)) {
            icon = '🔗';
            button.dataset.url = mediaItem.src;
            text = `${mediaItem.alt || 'Externe Link'}`;
        }

        button.innerHTML = `<span class='button-icon'>${icon}</span> ${text}`;
        return button;
    }

    _populateAndShowInfoPane(locationData) {
        this.infoPaneTitle.textContent = locationData.title || locationData.name || 'Details';
        this.infoPaneContentDiv.innerHTML = '';

        if (locationData.image && locationData.image !== "") {
            this.infoPaneImage.src = locationData.image;
            this.infoPaneImage.alt = `Afbeelding van ${locationData.name || locationData.title}`;
            this.infoPaneImage.style.display = 'block';
            this.infoPaneImage.onclick = (event) => this.ui.openImageLightbox(locationData.image, locationData.title || locationData.name, event.target);
            this.infoPaneImage.onerror = () => { this.infoPaneImage.style.display = 'none'; console.warn(`Failed to load main info pane image: ${locationData.image}`); };
        } else {
            this.infoPaneImage.src = ""; this.infoPaneImage.style.display = 'none'; this.infoPaneImage.onclick = null;
        }

        if (locationData.gallery && Array.isArray(locationData.gallery) && locationData.gallery.length > 0) {
            this._appendDetailImages(locationData.gallery, this.infoPaneContentDiv);
        }

        if (locationData.sections && Array.isArray(locationData.sections)) {
            locationData.sections.forEach(sectionData => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'section-block';

                if (sectionData.title) {
                    const titleEl = document.createElement('h3');
                    titleEl.className = 'section-title';
                    const lowerTitle = sectionData.title.toLowerCase();
                    if (lowerTitle.includes("hoofdkantoor") || lowerTitle.includes("werking") || lowerTitle.includes("dit doen we")) {
                        titleEl.classList.add('green-bg');
                    }
                    titleEl.textContent = sectionData.title;
                    sectionDiv.appendChild(titleEl);
                }

                if (sectionData.text) {
                    const texts = Array.isArray(sectionData.text) ? sectionData.text : [sectionData.text];
                    texts.forEach(textItem => {
                        const p = document.createElement('p');
                        p.innerHTML = this._parseTextForLinks(textItem);
                        sectionDiv.appendChild(p);
                    });
                }

                if (sectionData.link && !sectionData.items) {
                    const pLink = document.createElement('p');
                    const linkEl = document.createElement('a');
                    linkEl.href = sectionData.link;
                    linkEl.target = '_blank';
                    linkEl.textContent = sectionData.linkText || 'Meer info';
                    linkEl.classList.add('info-pane-link');
                    pLink.appendChild(linkEl);
                    sectionDiv.appendChild(pLink);
                }

                if (sectionData.items && Array.isArray(sectionData.items)) {
                    const ul = document.createElement('ul');
                    sectionData.items.forEach(item => {
                        const li = document.createElement('li');
                        let itemHTML = this._parseTextForLinks(item.text);
                        if (item.link) {
                            itemHTML = `<a href="${item.link}" target="_blank" class="info-pane-link">${item.text}</a>`;
                        }
                        li.innerHTML = itemHTML;

                        const processMedia = (mediaId) => {
                            if (mediaId && locationData.media) {
                                const mediaItem = locationData.media.find(m => m.id === mediaId);
                                if (mediaItem) {
                                    const button = this._createMediaButtonElement(mediaItem);
                                    const pButton = document.createElement('p');
                                    pButton.appendChild(button);
                                    li.appendChild(pButton);
                                }
                            }
                        };
                        if (item.mediaId) processMedia(item.mediaId);
                        if (item.mediaIds) item.mediaIds.forEach(processMedia);
                        ul.appendChild(li);
                    });
                    sectionDiv.appendChild(ul);
                }

                const processSectionMedia = (mediaId) => {
                     if (mediaId && locationData.media) {
                        const mediaItem = locationData.media.find(m => m.id === mediaId);
                        if (mediaItem) sectionDiv.appendChild(this._createMediaButtonElement(mediaItem));
                    }
                };
                if (sectionData.mediaId) processSectionMedia(sectionData.mediaId);
                if (sectionData.mediaIds) sectionData.mediaIds.forEach(processSectionMedia);

                if (sectionData.links && Array.isArray(sectionData.links)) {
                    sectionData.links.forEach(linkItem => {
                        const p = document.createElement('p');
                        const a = document.createElement('a');
                        a.href = linkItem.url;
                        a.target = '_blank';
                        a.textContent = linkItem.text;
                        a.classList.add('info-pane-link');
                        p.appendChild(a);
                        sectionDiv.appendChild(p);
                    });
                }
                if(sectionDiv.hasChildNodes()) this.infoPaneContentDiv.appendChild(sectionDiv);
            });
        }

        if (locationData.address) {
            this._appendAddress(locationData.address, this.infoPaneContentDiv);
        }

        this.infoPaneContentDiv.querySelectorAll('.fun-media-button').forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const targetButton = event.currentTarget;
                const type = targetButton.dataset.type;
                const title = targetButton.dataset.title || targetButton.textContent;

                if (type === 'pdf-link') {
                    const pdfUrl = targetButton.dataset.url;
                    if (pdfUrl) {
                        this.ui.openPdfLightbox(pdfUrl, title, targetButton);
                    } else {
                        console.error("Fun PDF button missing data-url.", targetButton);
                    }
                    return;
                } else if (type === 'youtube') {
                    const videoId = targetButton.dataset.videoId;
                    if (videoId) {
                        this.ui.openYouTubeVideoLightbox(videoId, title, targetButton);
                    } else {
                        console.error("Fun YouTube button missing data-video-id.", targetButton);
                    }
                    return;
                } else if (type === 'local-video') {
                    // For local videos, opening in lightbox might be complex due to kiosk environment
                    // and file access. Sticking to new tab for simplicity unless specifically requested
                    // for lightbox and paths are guaranteed accessible.
                    const localVideoSrc = targetButton.dataset.localVideoSrc;
                    if (localVideoSrc) {
                        // Option 1: Open in new tab (current behavior)
                        window.open(localVideoSrc, '_blank');
                        // Option 2: If you want to try lightbox for local videos (ensure paths are correct)
                        // this.ui.openLocalVideoLightbox(localVideoSrc, title, targetButton);
                    } else {
                        console.error("Fun local video button missing data-local-video-src.", targetButton);
                    }
                    return;
                }


                // For other types, open in new tab
                let urlToOpen = '#';
                if (['instagram', 'spotify-link', 'vimeo-link', 'sharepoint-link', 'link', 'facebook-video'].includes(type)) {
                    urlToOpen = targetButton.dataset.url || targetButton.href;
                     if (!urlToOpen || urlToOpen === '#') { console.error(`Fun ${type} button missing data-url or valid href.`, targetButton); return; }
                } else {
                    console.warn("Unknown/unhandled fun media button type:", type, targetButton);
                    return;
                }
                window.open(urlToOpen, '_blank');
            });
        });
    }

    _parseTextForLinks(text) {
        if (typeof text !== 'string') return text;
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, function(url) {
            return `<a href="${url}" target="_blank" class="info-pane-link">${url}</a>`;
        });
    }

    _appendDetailImages(galleryData, parentElement) {
        const container = document.createElement('div');
        container.className = 'section-block';
        const h4 = document.createElement('h4');
        h4.className = 'section-title';
        h4.textContent = 'Team & Sfeerbeelden';
        container.appendChild(h4);
        const galleryDiv = document.createElement('div');
        galleryDiv.className = 'detail-images-gallery';
        container.appendChild(galleryDiv);
        parentElement.appendChild(container);

        galleryData.forEach(imgData => {
            const itemDiv = document.createElement('div'); itemDiv.className = 'detail-image-item';
            const img = document.createElement('img');

            if (imgData.type === 'pdf') {
                img.src = this.genericPdfIconPath;
                img.alt = imgData.alt || 'PDF Document';
            } else {
                img.src = imgData.src;
                img.alt = imgData.alt || 'Detail';
            }

            img.onerror = (e) => {
                e.target.style.display='none';
                itemDiv.style.display='none';
                console.warn(`Failed to load detail image/thumbnail: ${img.src}`);
            };

            img.onclick = (event) => {
                if (imgData.type === 'pdf') {
                    this.ui.openPdfLightbox(imgData.src, imgData.caption || imgData.alt, event.target);
                } else {
                    this.ui.openImageLightbox(imgData.src, imgData.caption || imgData.alt, event.target);
                }
            };

            itemDiv.appendChild(img);
            if (imgData.caption || imgData.alt) {
                const cap = document.createElement('div'); cap.className = 'caption'; cap.textContent = imgData.caption || imgData.alt; itemDiv.appendChild(cap);
            }
            galleryDiv.appendChild(itemDiv);
        });
    }

    _appendAddress(address, parentElement) {
        const addressDiv = document.createElement('div');
        addressDiv.className = 'section-block';
        addressDiv.innerHTML = `<h4 class="section-title">Adres</h4><p>${address}</p>`;
        parentElement.appendChild(addressDiv);
    }

    hideInfoPane() {
        this.hideHelpOverlay();
        this.infoPane.classList.remove('visible');
        this.isPaneVisible = false;
        this.mapManager.resetMarkerActivation();
        const mapInstance = this.mapManager.getMapInstance();
        if (!this.currentSlideId && window.location.hash) {
            history.pushState(null, null, window.location.pathname + window.location.search);
            if(mapInstance) this.updateZoomLevelIndicator(mapInstance.getZoom() === this.mapManager.getFlandersZoom() ? 'Overzicht Vlaanderen' : 'Alle Locaties');
        } else if (!this.currentSlideId && mapInstance) {
            this.updateZoomLevelIndicator(mapInstance.getZoom() === this.mapManager.getFlandersZoom() ? 'Overzicht Vlaanderen' : 'Alle Locaties');
        }
        this.updateControlsActiveState();
    }

    updateZoomLevelIndicator(text) {
        if (this.zoomLevelIndicator) this.zoomLevelIndicator.textContent = text;
    }

    hideAllSlides() {
        this.contentSlides.forEach(slide => slide.classList.remove('active'));
    }

    showSlide(slideId) {
        this.hideHelpOverlay();
        this.hideInfoPane();
        this.hideAllSlides();
        const slide = document.getElementById(slideId);
        if (slide) {
            slide.classList.add('active');
            this.currentSlideId = slideId;
            let zoomText = 'LEJO';
            if (slideId === 'slide-intro') zoomText = 'Introductie';
            else if (slideId === 'slide-werkingen') zoomText = 'Onze Werkingen';
            else if (slideId === 'slide-toekomst') zoomText = 'De Toekomst';
            else if (slideId === 'slide-contact') zoomText = 'Contact';
            this.updateZoomLevelIndicator(zoomText);
            if (window.location.hash) history.pushState(null, null, window.location.pathname + window.location.search);
            const mapInstance = this.mapManager.getMapInstance();
            if (mapInstance) {
                const isAtFlandersCenter = mapInstance.getCenter();
                const isAtFlandersZoomLevel = mapInstance.getZoom() === this.mapManager.getFlandersZoom();
                const isAtFlandersCoords = isAtFlandersCenter.lat.toFixed(2) === this.mapManager.getFlandersCenter()[0].toFixed(2) &&
                                           isAtFlandersCenter.lng.toFixed(2) === this.mapManager.getFlandersCenter()[1].toFixed(2);
                if (!isAtFlandersZoomLevel || !isAtFlandersCoords) {
                    this.mapManager.resetMapView();
                }
            }
        }
        this.updateControlsActiveState();
    }

    startExploration() {
        this.hideHelpOverlay();
        this.hideAllSlides(); this.currentSlideId = null;
        this.resetMapView();
    }

    resetMapView() {
        this.hideHelpOverlay();
        this.hideInfoPane();
        this.mapManager.resetMapView();
        if (!this.currentSlideId) {
             this.updateZoomLevelIndicator('Overzicht Vlaanderen');
        }
        this.updateControlsActiveState();
    }

    fitAllMarkers() {
        this.hideHelpOverlay();
        this.hideAllSlides(); this.currentSlideId = null;
        this.hideInfoPane();
        if (this.mapManager.fitAllMarkers()) {
            this.updateZoomLevelIndicator('Alle Locaties');
        } else {
            this.mapManager.resetMapView();
            this.updateZoomLevelIndicator('Overzicht Vlaanderen');
        }
        this.updateControlsActiveState();
    }

    showHelpOverlay() {
        if (this.helpOverlay) {
            this.helpOverlay.classList.add('visible');
        }
    }

    hideHelpOverlay() {
        if (this.helpOverlay) {
            this.helpOverlay.classList.remove('visible');
        }
    }

    updateControlsActiveState() {
        const introBtn = document.getElementById('btn-intro');
        const werkBtn = document.getElementById('btn-werkingen');
        const toekBtn = document.getElementById('btn-toekomst');
        const contactBtn = document.getElementById('btn-contact');
        const overviewBtn = document.getElementById('btn-overview');
        const fitMarkersBtn = document.getElementById('btn-fit-markers');

        if (introBtn) introBtn.disabled = (this.currentSlideId === 'slide-intro');
        if (werkBtn) werkBtn.disabled = (this.currentSlideId === 'slide-werkingen');
        if (toekBtn) toekBtn.disabled = (this.currentSlideId === 'slide-toekomst');
        if (contactBtn) contactBtn.disabled = (this.currentSlideId === 'slide-contact');

        const mapInstance = this.mapManager.getMapInstance();
        if (overviewBtn && mapInstance) {
            const isAtFlandersCenter = mapInstance.getCenter();
            const isAtFlandersZoomLevel = mapInstance.getZoom() === this.mapManager.getFlandersZoom();
            const isAtFlandersCoords = isAtFlandersCenter.lat.toFixed(2) === this.mapManager.getFlandersCenter()[0].toFixed(2) &&
                                       isAtFlandersCenter.lng.toFixed(2) === this.mapManager.getFlandersCenter()[1].toFixed(2);
            overviewBtn.disabled = isAtFlandersZoomLevel && isAtFlandersCoords && !this.isPaneVisible && !this.currentSlideId;
        } else if (overviewBtn) {
            overviewBtn.disabled = true;
        }

        if (fitMarkersBtn) {
            const markersLayer = this.mapManager.getMarkersLayerGroup();
            fitMarkersBtn.disabled = !(markersLayer && markersLayer.getLayers().length > 0) || !!this.currentSlideId;
        }
    }

    closeLightbox() {
        if (this.ui && typeof this.ui.closeLightbox === 'function') {
            this.ui.closeLightbox();
        } else {
            console.error("UI components not available to close lightbox.");
        }
    }
}

if (typeof App !== 'undefined' && !window.app) {
    if (typeof UIComponents !== 'undefined' && typeof MapManager !== 'undefined') {
        window.app = new App();
    } else {
        console.error("Cannot instantiate App: UIComponents or MapManager is not defined.");
        document.body.innerHTML = '<div style="padding:20px;text-align:center;font-size:1.2em;color:red;">Application critical error: failed to load components. Please refresh or contact support.</div>';
    }
} else if (window.app) {
    // console.warn("window.app already defined. App script might be loaded more than once.");
} else if (typeof App === 'undefined') {
    console.error("App class is not defined in app.js. Cannot instantiate.");
}