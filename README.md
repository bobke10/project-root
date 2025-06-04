# project-root
Okay, here's a very detailed project description you can use to start a new chat. This aims to give the AI a comprehensive understanding of your project's current state, goals, and tech stack.
"Hello! I'm developing an interactive map application for LEJO, a non-profit organization, designed to showcase their various locations, services, and impact across Flanders. This application is primarily intended for use on a large touch-screen kiosk (e.g., 65-inch) and is built using HTML, CSS, and modular JavaScript, with Leaflet.js as the core mapping library.
Core Project Functionality & Current State:
Interactive Map (Leaflet.js):
Displays a map of Flanders centered by default.
Custom markers represent LEJO's various physical locations and significant project sites.
Clicking/tapping a marker makes it "active" (changes style) and triggers the display of an Info Pane for that location.
Map controls include zoom (Leaflet default) and custom buttons for "Overview" (reset to Flanders view) and "Fit All Markers".
Introductory Slides:
Upon initial load, or when navigating via dedicated buttons, full-screen informational "slides" can overlay the map.
Current slides include: "Introductie," "Onze Kernwerkingen," and "De Toekomst."
These slides provide general statistics and context about LEJO.
Info Pane (Sidebar):
A detailed information panel slides in from the right when a map marker is tapped.
The content of this pane is dynamically generated based on a structured locations.json file.
Content includes:
Location Title.
Main representative image for the location (clickable to open in a full-screen image lightbox).
Structured Sections: Dynamically built from the sections array in the JSON for that location. Each section can have:
A title (optionally with a highlight style).
Paragraphs of text (basic URL auto-linking is implemented).
Bulleted lists of items, where each item can have text and an optional external link.
"Fun Media Buttons": These are stylized anchor tags (<a>) generated from a media array within the JSON. They can link to:
YouTube videos (opens youtube.com/watch?v=ID in a new tab).
Local video files (e.g., .mp4, opens in a new tab using the browser's default player).
Instagram profiles/posts (opens in a new tab).
PDF documents (opens in a new tab/browser PDF viewer).
Other external links (Spotify, Vimeo, SharePoint - all open in a new tab).
Each button has an icon (▶ for YouTube, 🎬 for local video, 📷 for Instagram, 📄 for PDF, 🔗 for others) and descriptive text.
Team & Sfeerbeelden Gallery: A dedicated section (typically appearing near the top of the info pane content, after the main image) displays a gallery of thumbnail images. These images are sourced from the gallery array in the JSON for that location. Clicking a thumbnail opens it in the full-screen image lightbox.
Address: If an address field is present in the JSON, it's displayed.
The info pane has a close button (×) and can also be closed by pressing the Escape key.
Image Lightbox (UIComponents module):
Used for the main info pane image and images in the "Team & Sfeerbeelden" gallery.
Opens with a "Windows 11 style" zoom/scale animation originating from the clicked thumbnail.
Displays the image full-screen with an optional caption.
Can be closed by clicking the overlay background, a close button (×), or the Escape key.
Note: This lightbox was previously also used for videos, but video playback within the info pane is now handled by direct links via the "Fun Media Buttons." The video lightbox code might still exist in UIComponents but isn't actively used for info pane videos in the current setup.
Help Overlay:
A dedicated help button (?) opens a modal overlay with tips for using the kiosk application (e.g., how to interact with markers, images, navigation).
Can be closed via a close button (×), clicking the overlay background, or the Escape key.
Navigation & Controls:
A persistent bottom bar contains buttons for: Intro, Overview (map), Alle Locaties (map), Werkingen (slide), Toekomst (slide).
A top-left anniversary logo.
A top-right "Zoom Level" indicator that updates its text based on the current view (e.g., "Introductie," "Overzicht Vlaanderen," "Locatie: [Name]").
Data Source (data/locations.json):
A single JSON file provides all data for locations.
Each location object has: id, name, coordinates: {lat, lon}, title, main image path, address.
It also contains structured arrays for:
gallery: For thumbnail images shown in the "Team & Sfeerbeelden" section. Each item: {src, alt, caption}.
media: For links to YouTube, local videos, Instagram, PDFs, etc., used to generate "Fun Media Buttons." Each item: {id, type, src, alt}.
sections: An array defining the content blocks for the info pane. Each section item: {title, text, link, linkText, items: [{text, link, mediaId(s)}], mediaId(s), links: [{text, url}]}.
The team array (previously used for displaying team member names and contacts) is no longer explicitly rendered as a list in the info pane sections to simplify and because team visuals are in the gallery.
File Structure & Technology:
index.html: Main page.
css/: main.css (base styles), components.css (UI element styles), responsive.css.
js/:
app.js: Main application logic, event handling, DOM manipulation for info pane/slides, state management. Defines the App class and creates window.app.
map-manager.js: Handles Leaflet map initialization, marker creation, and map interactions. Defines the MapManager class.
ui-components.js: Currently handles the image lightbox functionality. Defines the UIComponents class.
data/locations.json: Data source.
images/: Contains subfolders for UI assets (ui/), team presentation photos (locations_Teamvoorstelling/), activity photos (Location_Fotosacitviteiten/), and local videos (Videos/). All paths in JSON are relative to the images/ root.
Key Focus Areas & Philosophy:
User Experience for Kiosk: Intuitive touch interaction, clear visual feedback, large touch targets, and easily discoverable information.
Maintainability & Scalability: Clean, modular JavaScript code. The structured locations.json is designed for easier content updates.
Dynamic Content: The info pane content is almost entirely driven by the JSON structure.
Current Status & What I Might Need Help With:
The application is largely functional with the features described above. JavaScript errors related to script loading order and class definitions have recently been addressed by ensuring correct file content separation and loading sequence. The locations.json has been refactored to a more structured format, and app.js has been updated to parse this new structure for rendering the info pane.
