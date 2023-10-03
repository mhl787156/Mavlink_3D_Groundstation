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

        this.addFloor()

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

    addFloor() {
        // Create a floor plane
        const floorGeometry = new THREE.PlaneGeometry(10, 10, 1, 1);
        const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);

        // Position the floor at the bottom of the scene
        this.floor.position.set(0, 0, 0);

        // Rotate the floor to make it horizontal
        this.floor.rotation.x = -Math.PI / 2;

        // Add the floor to the scene
        this.scene.add(this.floor);
    }

    addElevationMap(width, height, centerx, centery, elevationData) {
        // Create a floor plane
        const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
        const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });

        const vertex = new THREE.Vector3();
        const positionAttribute = geometry.getAttribute( 'position' );
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute( positionAttribute, i ); // read vertex
            const elevationValue = elevationData[i]; // Adjust this based on your data format
            positionAttribute.setXYZ(i, vertex.x, vertex.y, elevationValue)
        }
        geometry.setAttribute('position', positionAttribute);

        // Compute face normals and vertex normals for shading
        // geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        this.scene.remove(this.floor)
        this.floor = new THREE.Mesh(geometry, floorMaterial);
        this.floor.position.set(centerx, centery, 0);
        // Rotate the floor to make it horizontal
        this.floor.rotation.x = -Math.PI / 2;

        this.scene.add(this.floor)
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
