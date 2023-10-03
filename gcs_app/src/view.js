// src/three.js

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ThreeSceneManager {

    constructor(containerId) {

        // Get the container element by its ID and append the renderer's DOM element to it
        const container = document.getElementById(containerId);

        // Create a Three.js scene
        this.scene = new THREE.Scene();
        this.scene.rotation.x = -Math.PI / 2;

        // Create a Three.js camera
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        // Create a Three.js renderer and set its size to match the container
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        this.renderer.setClearColor(new THREE.Color(0x87ceeb)); // Use the color you prefer

        // Add a directional light to illuminate the cube
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.position.set(100, 100, 100);
        this.scene.add(this.light);

        this.addFloor()

        console.log("Screen manager initialised")
    }

    moveCamera(cx, cy, cz, lx, ly, lz) {
        this.camera.position.set(cx, cy, cz)
        this.camera.lookAt(new THREE.Vector3(lx, ly, lz))
        this.camera.rotation.x = -Math.PI/2;
    }

    enableOrbitControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
                // Example configuration options
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        // this.controls.autoRotate = true; // Automatically rotate the camera
    }

    // Add objects, lights, and other scene elements as methods of the class
    addCube() {
        function gen_cube(color) {
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshStandardMaterial({ color: color });
            return new THREE.Mesh(geometry, material);
        }
        const c1 = gen_cube(0xff0000)
        c1.position.set(1, 0, 0)
        this.scene.add(c1);

        const c2 = gen_cube(0x00ff00)
        c2.position.set(0, 1, 0)
        this.scene.add(c2);

        const c3 = gen_cube(0x0000ff)
        c3.position.set(0, 0, 1)
        this.scene.add(c3);
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

    createSphereMarker(position, size, color) {
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);

        sphere.position.copy(position);
        // sphere.rotation.x = -Math.PI / 2;

        this.scene.add(sphere);
    }

    addElevationMap(width, height, centerx, centery, elevationData, satDataPixels) {

        console.log(satDataPixels)
        // Set up Sat Data
        const texture = new THREE.DataTexture(satDataPixels, width, height, THREE.RGBFormat);
        texture.needsUpdate = true;

        // Create a floor plane
        const geometry = new THREE.PlaneGeometry(width, height, width-1, height-1);
        const floorMaterial = new THREE.MeshBasicMaterial({ map: texture });





        // Assuming you have created your PlaneGeometry
        const planeGeometry = new THREE.PlaneGeometry(256, 256, 255, 255);

        // Access the UV attribute data
        const uvAttribute = planeGeometry.getAttribute("uv");

        // Log the UV coordinates to the console
        console.log(uvAttribute);

        // Optionally, visualize the UV coordinates by creating a debug texture
        const debugTextureCanvas = document.createElement("canvas");
        debugTextureCanvas.width = 256;
        debugTextureCanvas.height = 256;
        document.body.appendChild(debugTextureCanvas);

        // const debugTextureContext = debugTextureCanvas.getContext("2d");

        // for (let i = 0; i < uvAttribute.count; i++) {
        // const u = uvAttribute.getX(i);
        // const v = uvAttribute.getY(i);

        // // Map UV coordinates to pixel space for visualization
        // const x = Math.floor(u * 256);
        // const y = Math.floor((1 - v) * 256); // Invert v-coordinate to match canvas coordinates

        // debugTextureContext.fillStyle = `rgb(${x}, ${y}, 0)`;
        // debugTextureContext.fillRect(x, y, 1, 1);
        // }


        // Create a separate scene for texture visualization
        const textureScene = new THREE.Scene();
        const textureCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        textureCamera.position.z = 5;

        const textureMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const textureGeometry = new THREE.PlaneGeometry(2, 2); // A quad covering the viewport

        const textureMesh = new THREE.Mesh(textureGeometry, textureMaterial);
        textureScene.add(textureMesh);

        // Create a renderer for texture visualization
        const textureRenderer = new THREE.WebGLRenderer({ canvas: debugTextureCanvas });
        textureRenderer.setSize(256, 256);

        // Render the texture scene
        textureRenderer.render(textureScene, textureCamera);






        const vertex = new THREE.Vector3();
        const positionAttribute = geometry.getAttribute( 'position' );
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute( positionAttribute, i ); // read vertex
            const elevationValue = elevationData[i]; // Adjust this based on your data format
            positionAttribute.setXYZ( i, vertex.x, vertex.y, elevationValue ); // write coordinates back            // console.log(i, vertex.x, vertex.y, elevationValue)
        }

        const center_idx = centery * width + centerx;
        const centerz = elevationData[center_idx];
        const ccx = (width/2) - centerx
        const ccy = (height/2) - centery
        console.log(ccx, ccy, centerz, center_idx )

        // Compute face normals and vertex normals for shading
        // geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        this.scene.remove(this.floor)
        this.floor = new THREE.Mesh(geometry, floorMaterial);
        this.floor.position.set(ccx, ccy, centerz);
        this.scene.position.set(ccx, ccy, centerz);

        // Set Sat map texture
        // this.floor.material.map = texture;

        this.scene.add(this.floor)

        this.createSphereMarker(new THREE.Vector3(0, 0, 0), 10, 0xff0000)

        this.moveCamera(10, 10, 10, 0, 0, 0)
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
