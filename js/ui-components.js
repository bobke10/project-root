// js/ui-components.js

class UIComponents {
    constructor() {
        this.lightbox = document.getElementById('lightbox');
        this.lightboxContentWrapper = this.lightbox?.querySelector('.lightbox-content-wrapper');
        this.lightboxImg = document.getElementById('lightboxImg');
        this.lightboxVideoContainer = document.getElementById('lightboxVideoContainer');
        this.lightboxCaption = document.getElementById('lightboxCaption');
        this.currentLightboxType = null;
    }

    _setLightboxOrigin(clickedElement) {
        if (!this.lightboxContentWrapper) return;
        if (clickedElement) {
            const rect = clickedElement.getBoundingClientRect();
            const originX = rect.left + rect.width / 2;
            const originY = rect.top + rect.height / 2;
            this.lightboxContentWrapper.style.transformOrigin = `${(originX / window.innerWidth) * 100}% ${(originY / window.innerHeight) * 100}%`;
        } else {
            this.lightboxContentWrapper.style.transformOrigin = 'center center';
        }
    }

    _showLightboxAnimated() {
        if (!this.lightbox || !this.lightboxContentWrapper) return;
        this.lightboxContentWrapper.style.transform = 'scale(0.5)';
        this.lightboxContentWrapper.style.opacity = '0';
        this.lightbox.classList.add('visible');
        void this.lightboxContentWrapper.offsetWidth;
        this.lightboxContentWrapper.style.transform = 'scale(1)';
        this.lightboxContentWrapper.style.opacity = '1';
    }

    _prepareLightboxForType(type) {
        if (!this.lightboxImg || !this.lightboxVideoContainer) return;

        this.lightboxImg.style.display = 'none';
        this.lightboxVideoContainer.style.display = 'none';
        this.lightboxVideoContainer.innerHTML = ''; // Clear previous content

        this.lightbox.classList.remove('showing-image', 'showing-video', 'showing-pdf');

        if (type === 'image') {
            this.lightboxImg.style.display = 'block';
            this.lightbox.classList.add('showing-image');
        } else if (type === 'youtube-video' || type === 'local-video' || type === 'pdf') {
            this.lightboxVideoContainer.style.display = 'block';
            if (type === 'pdf') {
                this.lightbox.classList.add('showing-pdf');
            } else {
                this.lightbox.classList.add('showing-video');
            }
        }
        this.currentLightboxType = type;
    }


    openImageLightbox(src, captionText, clickedElement) {
        if (!this.lightbox || !this.lightboxImg || !this.lightboxCaption || !this.lightboxContentWrapper) {
            console.error("Lightbox elements not fully initialized for image.");
            return;
        }
        this._prepareLightboxForType('image');
        this.lightboxImg.src = src;
        this.lightboxCaption.textContent = captionText || "";
        this._setLightboxOrigin(clickedElement);
        this._showLightboxAnimated();
    }

    openYouTubeVideoLightbox(videoId, videoTitle, clickedPlaceholderElement) {
        if (!this.lightbox || !this.lightboxVideoContainer || !this.lightboxCaption || !this.lightboxContentWrapper) {
            console.error("Lightbox elements not fully initialized for YouTube video.");
            return;
        }
        this._prepareLightboxForType('youtube-video');
        this.lightboxVideoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0" title="${videoTitle || 'YouTube video player'}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
        this.lightboxCaption.textContent = videoTitle || "";
        this._setLightboxOrigin(clickedPlaceholderElement);
        this._showLightboxAnimated();
    }

    openLocalVideoLightbox(videoSrc, videoTitle, clickedPlaceholderElement) {
        if (!this.lightbox || !this.lightboxVideoContainer || !this.lightboxCaption || !this.lightboxContentWrapper) {
            console.error("Lightbox elements not fully initialized for local video.");
            return;
        }
        this._prepareLightboxForType('local-video');
        this.lightboxVideoContainer.innerHTML = `<video controls autoplay playsinline title="${videoTitle || 'Local video player'}">
                                                    <source src="${videoSrc}" type="video/mp4">
                                                    Your browser does not support the video tag.
                                                 </video>`;
        this.lightboxCaption.textContent = videoTitle || "";
        this._setLightboxOrigin(clickedPlaceholderElement);
        this._showLightboxAnimated();
    }

    openPdfLightbox(pdfSrc, captionText, clickedElement) {
        if (!this.lightbox || !this.lightboxVideoContainer || !this.lightboxCaption || !this.lightboxContentWrapper) {
            console.error("Lightbox elements not fully initialized for PDF.");
            return;
        }
        this._prepareLightboxForType('pdf');
        this.lightboxVideoContainer.innerHTML = `<embed src="${pdfSrc}" type="application/pdf" style="width:100%; height:100%; border:none;" title="${captionText || 'PDF Document'}">`;
        this.lightboxCaption.textContent = captionText || "";
        this._setLightboxOrigin(clickedElement);
        this._showLightboxAnimated();
    }


    closeLightbox() {
        if (!this.lightbox || !this.lightboxContentWrapper || !this.lightbox.classList.contains('visible')) return;

        this.lightboxContentWrapper.style.transform = 'scale(0.5)';
        this.lightboxContentWrapper.style.opacity = '0';

        setTimeout(() => {
            this.lightbox.classList.remove('visible', 'showing-image', 'showing-video', 'showing-pdf');

            if (this.lightboxVideoContainer) {
                this.lightboxVideoContainer.innerHTML = ''; // Clear iframe/video/embed tag
                this.lightboxVideoContainer.style.display = 'none'; // Ensure it's hidden
            }
            if (this.lightboxImg) {
                this.lightboxImg.src = "#"; // Reset image src
                this.lightboxImg.style.display = 'none'; // Ensure it's hidden
            }
            if (this.lightboxCaption) {
                this.lightboxCaption.textContent = "";
            }

            this.currentLightboxType = null;
        }, 350);
    }
}