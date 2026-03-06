// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // ciel bleu

// Camera
const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth/window.innerHeight, 0.1, 1000
);
camera.position.y = 5;
camera.position.z = 10;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Sol avec relief (map améliorée)
const floorGeometry = new THREE.PlaneGeometry(50, 50, 10, 10);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22, side: THREE.DoubleSide, flatShading: true });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Cube joueur
let skins = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00]; // différentes couleurs cubes
let skinIndex = 0;

const geometry = new THREE.BoxGeometry(1,1,1);
let material = new THREE.MeshStandardMaterial({ color: skins[skinIndex] });
const player = new THREE.Mesh(geometry, material);
player.position.y = 0.5;
scene.add(player);

// Animation simple pour marche
let walkOffset = 0;

// Contrôle clavier
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// Changer de skin
document.getElementById("skinButton").addEventListener("click", () => {
    skinIndex = (skinIndex + 1) % skins.length;
    player.material.color.setHex(skins[skinIndex]);
});

// Fonction animate
function animate() {
    requestAnimationFrame(animate);

    const speed = 0.1;
    let moving = false;

    if(keys['w']) { player.position.z -= speed; moving = true; }
    if(keys['s']) { player.position.z += speed; moving = true; }
    if(keys['a']) { player.position.x -= speed; moving = true; }
    if(keys['d']) { player.position.x += speed; moving = true; }

    // Animation simple cube (petit mouvement haut-bas)
    if(moving) {
        walkOffset += 0.1;
        player.position.y = 0.5 + Math.sin(walkOffset)*0.1;
    } else {
        walkOffset = 0;
        player.position.y = 0.5;
    }

    // Caméra suit le joueur
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 10;
    camera.lookAt(player.position);

    renderer.render(scene, camera);
}

animate();

// Redimensionnement
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
