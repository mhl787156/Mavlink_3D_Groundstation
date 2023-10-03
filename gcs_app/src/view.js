// src/three.js

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ThreeSceneManager {

    constructor(containerId) {

        // Get the container element by its ID and append the renderer's DOM element to it
        const container = document.getElementById(containerId);

        // Create a Three.js scene
        this.scene = new THREE.Scene();

        // Create a Three.js camera
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        // Create a Three.js renderer and set its size to match the container
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        // Add a directional light to illuminate the cube
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.position.set(1, 1, 1);
        this.scene.add(this.light);
        console.log("Screen manager initialised")
    }

    enableOrbitControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
                // Example configuration options
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.autoRotate = true; // Automatically rotate the camera
    }

    // Add objects, lights, and other scene elements as methods of the class
    addCube() {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
    }

    // Render method to update and render the scene
    render() {
        if (typeof this.controls !== 'undefined') {
            this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
    }
}

export default ThreeSceneManager;
