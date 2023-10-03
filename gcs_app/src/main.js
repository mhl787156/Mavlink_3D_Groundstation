// src/main.js

// Import Mapbox and Three.js functions
import MapManager from './map.js';
import ThreeSceneManager from './view.js';

const backend_host = "localhost"
const backend_port = "4000"

const latitude= 51.45523  //51.423200
const longitude=-2.59665 // -2.671000
const zoom=14

// Initialise MapManager
const mapManager = new MapManager(backend_host, backend_port, latitude, longitude, zoom)

// Setup Three.js scene
const sceneManager = new ThreeSceneManager('map');
sceneManager.enableOrbitControls()
sceneManager.addCube();


mapManager.fetchElevationData(data => {

    const pixels = data.satelliteImage;
    const data_sat = new Uint8Array(data.width * data.height * 4); // 3 channels (R, G, B)
    // Populate the data array with pixel colors
    for (let i = 0; i < pixels.length; i++) {
        data_sat[i * 3] = pixels[i][0]; // Red channel
        data_sat[i * 3 + 1] = pixels[i][1]; // Green channel
        data_sat[i * 3 + 2] = pixels[i][2]; // Blue channel
        data_sat[i * 3 + 3] = 255; // Alpha channel
    }

    sceneManager.addElevationMap(
        data.width, data.height,
        Math.floor(data.xcenter), Math.floor(data.ycenter),
        data.elevationData,
        data_sat
    )
})




// Animation

function animate() {
    requestAnimationFrame(animate);

    // Update animations or interactions here, if needed

    sceneManager.render(); // Render the scene
}

animate(); // Start the render loop
