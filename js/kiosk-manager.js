// js/kiosk-manager.js

class KioskManager {
    constructor(appInstance, timeoutDuration = 60000) { // Default 1 minute (60000 ms)
        this.app = appInstance;
        this.inactivityTimer = null;
        this.inactivityTimeout = timeoutDuration;
        this.relevantActivityEvents = ['mousedown', 'touchstart', 'mousemove', 'keydown', 'scroll']; // Added more events

        this.boundResetInactivityTimer = this.resetInactivityTimer.bind(this); // Bind 'this' context
        this.setupInactivityTracking();
    }

    setupInactivityTracking() {
        this.relevantActivityEvents.forEach(event => {
            document.addEventListener(event, this.boundResetInactivityTimer, { passive: true });
        });
        this.resetInactivityTimer(); // Start the timer initially
        console.log('Kiosk inactivity tracking started.');
    }

    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        this.inactivityTimer = setTimeout(() => {
            console.log('Kiosk inactivity timeout. Returning to intro.');
            if (this.app && typeof this.app.showSlide === 'function') {
                this.app.showSlide('slide-intro'); // Or a dedicated app.returnToIntro() method
            }
        }, this.inactivityTimeout);
    }

    destroy() { // Optional: if you need to stop tracking
        clearTimeout(this.inactivityTimer);
        this.relevantActivityEvents.forEach(event => {
            document.removeEventListener(event, this.boundResetInactivityTimer);
        });
        console.log('Kiosk inactivity tracking stopped.');
    }
}