// Import necessary libraries
import * as THREE from 'three';
import { GUI } from 'dat.gui';
import io from 'socket.io-client';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a simple terrain
const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const terrain = new THREE.Mesh(geometry, material);
terrain.rotation.x = -Math.PI / 2;
scene.add(terrain);

// Player setup
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

camera.position.z = 5;

// Socket.io connection
const socket = io('http://localhost:3000');

// Player controls
const controls = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
            controls.forward = true;
            break;
        case 'KeyS':
            controls.backward = true;
            break;
        case 'KeyA':
            controls.left = true;
            break;
        case 'KeyD':
            controls.right = true;
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
            controls.forward = false;
            break;
        case 'KeyS':
            controls.backward = false;
            break;
        case 'KeyA':
            controls.left = false;
            break;
        case 'KeyD':
            controls.right = false;
            break;
    }
});

function animate() {
    requestAnimationFrame(animate);
    if (controls.forward) player.position.z -= 0.1;
    if (controls.backward) player.position.z += 0.1;
    if (controls.left) player.position.x -= 0.1;
    if (controls.right) player.position.x += 0.1;
    renderer.render(scene, camera);
}

animate();