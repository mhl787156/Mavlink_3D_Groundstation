// src/main.js

// Import Mapbox and Three.js functions
import { initializeMap, fetchElevationData } from './map.js';
import ThreeSceneManager from './view.js';

const latitude=51.423200
const longitude=-2.671000
const zoom=4

// Initialize Mapbox map
initializeMap();

// Fetch elevation data (you can call this function as needed)
const elevationData = fetchElevationData(latitude, longitude, zoom);

// Setup Three.js scene
const sceneManager = new ThreeSceneManager('map');
sceneManager.enableOrbitControls()

sceneManager.addCube();

function animate() {
    requestAnimationFrame(animate);

    // Update animations or interactions here, if needed

    sceneManager.render(); // Render the scene
}

animate(); // Start the render loop
