// src/main.js

// Import Mapbox and Three.js functions
import MapManager from './map.js';
import ThreeSceneManager from './view.js';

const backend_host = "localhost"
const backend_port = "4000"

const latitude=51.423200
const longitude=-2.671000
const zoom=14

// Initialise MapManager
const mapManager = new MapManager(backend_host, backend_port, latitude, longitude, zoom)

// Setup Three.js scene
const sceneManager = new ThreeSceneManager('map');
sceneManager.enableOrbitControls()
sceneManager.addCube();


mapManager.fetchElevationData(data => {
    sceneManager.addElevationMap(
        data.width, data.height,
        Math.floor(data.xcenter), Math.floor(data.ycenter),
        data.elevationData
    )
})




// Animation

function animate() {
    requestAnimationFrame(animate);

    // Update animations or interactions here, if needed

    sceneManager.render(); // Render the scene
}

animate(); // Start the render loop
