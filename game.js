// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 10;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Sol (carte globale)
const floorGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22, side: THREE.DoubleSide, flatShading: true });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// --- Création d'îles ---
function createIsland(x, z, scale=3, color=0x8B4513) {
    const geom = new THREE.BoxGeometry(scale, 1, scale);
    const mat = new THREE.MeshStandardMaterial({ color: color });
    const island = new THREE.Mesh(geom, mat);
    island.position.set(x, 0.5, z);
    scene.add(island);
}

createIsland(10, 10, 5, 0x8B0000); // île rouge
createIsland(-15, -5, 7, 0x006400); // île verte
createIsland(20, -20, 6, 0x00008B); // île bleue

// --- Obstacles ---
function createObstacle(x, z, scale=1, color=0x555555){
    const geom = new THREE.BoxGeometry(scale, scale, scale);
    const mat = new THREE.MeshStandardMaterial({ color: color });
    const obs = new THREE.Mesh(geom, mat);
    obs.position.set(x, scale/2, z);
    scene.add(obs);
}

createObstacle(5, 5);
createObstacle(-10, 0);
createObstacle(15, -10);

// --- Zones pour crafter ---
function createCraftZone(x, z, scale=3, color=0xFFD700){
    const geom = new THREE.PlaneGeometry(scale, scale);
    const mat = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide });
    const zone = new THREE.Mesh(geom, mat);
    zone.rotation.x = -Math.PI/2;
    zone.position.set(x, 0.01, z);
    scene.add(zone);
}

createCraftZone(12, 12);
createCraftZone(-12, -12);

// --- Cube joueur ---
let skins = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00];
let skinIndex = 0;
const geometry = new THREE.BoxGeometry(1,1,1);
let material = new THREE.MeshStandardMaterial({ color: skins[skinIndex] });
const player = new THREE.Mesh(geometry, material);
player.position.y = 0.5;
scene.add(player);

// Animation cube
let walkOffset = 0;

// Controls
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// Bouton changer de skin
document.getElementById("skinButton").addEventListener("click", () => {
    skinIndex = (skinIndex + 1) % skins.length;
    player.material.color.setHex(skins[skinIndex]);
});

// Animate
function animate() {
    requestAnimationFrame(animate);

    const speed = 0.1;
    let moving = false;
    if(keys['w']) { player.position.z -= speed; moving = true; }
    if(keys['s']) { player.position.z += speed; moving = true; }
    if(keys['a']) { player.position.x -= speed; moving = true; }
    if(keys['d']) { player.position.x += speed; moving = true; }

    if(moving){
        walkOffset += 0.1;
        player.position.y = 0.5 + Math.sin(walkOffset)*0.1;
    } else {
        walkOffset = 0;
        player.position.y = 0.5;
    }

    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 10;
    camera.lookAt(player.position);

    renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
