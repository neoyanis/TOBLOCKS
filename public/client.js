// Three.js & Socket.io Game Client
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js';

let scene, camera, renderer;
let player, gameRunning = false;
let socket;
let playerId;
let otherPlayers = {};
let mobs = [];
let terrain;
let trees = [];
let firstTree = null;
let undergroundWorld;
let gods = [];

// Game config
const GAME_CONFIG = {
    worldSize: 500,
    mobCount: 15,
    bossHealthMultiplier: 5
};

// Initialize Three.js Scene
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 300, 500);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 50);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -300;
    sunLight.shadow.camera.right = 300;
    sunLight.shadow.camera.top = 300;
    sunLight.shadow.camera.bottom = -300;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
}

// Create Terrain
function createTerrain() {
    const geometry = new THREE.PlaneGeometry(GAME_CONFIG.worldSize, GAME_CONFIG.worldSize, 50, 50);
    const material = new THREE.MeshLambertMaterial({ color: 0x2d8659 });
    terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);
}

// Create Trees and First Tree with Hidden Key
function createTrees() {
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * GAME_CONFIG.worldSize;
        const z = (Math.random() - 0.5) * GAME_CONFIG.worldSize;
        const tree = createTree(x, z);
        trees.push(tree);
        scene.add(tree);

        // First tree (special - contains key)
        if (i === 0) {
            firstTree = tree;
            firstTree.position.x = 0;
            firstTree.position.z = 0;
            firstTree.userData.hasKey = true;
        }
    }
}

function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(3, 4, 20, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 10, z);
    trunk.castShadow = true;

    const foliageGeometry = new THREE.SphereGeometry(15, 8, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, 30, z);
    foliage.castShadow = true;

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);
    tree.position.set(x, 0, z);
    tree.userData.hasKey = false;
    return tree;
}

// Create Player
function createPlayer() {
    const geometry = new THREE.BoxGeometry(2, 3, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(geometry, material);
    player.position.y = 5;
    player.castShadow = true;
    scene.add(player);

    // Camera follows player
    camera.position.set(player.position.x, player.position.y + 5, player.position.z + 15);
}

// Create NPCs/Mobs
function createMobs() {
    for (let i = 0; i < GAME_CONFIG.mobCount; i++) {
        const mob = {
            mesh: createMobMesh(),
            position: {
                x: (Math.random() - 0.5) * GAME_CONFIG.worldSize,
                y: 5,
                z: (Math.random() - 0.5) * GAME_CONFIG.worldSize
            },
            level: Math.floor(Math.random() * 10) + 1,
            health: 30,
            maxHealth: 30,
            speed: 0.05,
            isAlive: true
        };
        mob.mesh.position.copy(mob.position);
        scene.add(mob.mesh);
        mobs.push(mob);
    }
}

function createMobMesh() {
    const geometry = new THREE.BoxGeometry(1.5, 2, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xff6b35 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
}

// Underground World
function createUnderground() {
    undergroundWorld = new THREE.Group();
    
    // Underground terrain
    const undergroundGeometry = new THREE.PlaneGeometry(GAME_CONFIG.worldSize, GAME_CONFIG.worldSize);
    const undergroundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const undergroundTerrain = new THREE.Mesh(undergroundGeometry, undergroundMaterial);
    undergroundTerrain.rotation.x = -Math.PI / 2;
    undergroundTerrain.position.y = -50;
    undergroundWorld.add(undergroundTerrain);

    // Add Gods
    for (let i = 0; i < 4; i++) {
        const god = createGod(i);
        undergroundWorld.add(god);
    }

    undergroundWorld.visible = false;
    scene.add(undergroundWorld);
}

function createGod(index) {
    const geometry = new THREE.ConeGeometry(3, 8, 8);
    const colors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00];
    const material = new THREE.MeshLambertMaterial({ color: colors[index] });
    const god = new THREE.Mesh(geometry, material);
    god.position.set((index - 1.5) * 50, -45, 0);
    god.castShadow = true;
    god.userData = { godId: index, power: ['Inferno', 'Blizzard', 'Lightning', 'Forest'][index] };
    return god;
}

// Player Controls
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key === 'e') interactWithNearby();
    if (e.key === 'b') toggleShop();
    if (e.key === 'p') togglePowers();
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function updatePlayerPosition() {
    const speed = 0.5;
    
    if (keys['w'] || keys['arrowup']) player.position.z -= speed;
    if (keys['s'] || keys['arrowdown']) player.position.z += speed;
    if (keys['a'] || keys['arrowleft']) player.position.x -= speed;
    if (keys['d'] || keys['arrowright']) player.position.x += speed;
    if (keys[' ']) player.position.y = 10; // Jump

    // Keep player in bounds
    player.position.x = Math.max(-GAME_CONFIG.worldSize/2, Math.min(GAME_CONFIG.worldSize/2, player.position.x));
    player.position.z = Math.max(-GAME_CONFIG.worldSize/2, Math.min(GAME_CONFIG.worldSize/2, player.position.z));

    // Update camera
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 15;

    // Emit position to server
    if (socket) {
        socket.emit('playerMove', { position: player.position });
    }
}

// Combat System
function checkMobCollisions() {
    mobs.forEach(mob => {
        if (!mob.isAlive) return;
        
        const distance = player.position.distanceTo(mob.position);
        
        if (distance < 5) {
            // Combat
            mob.health -= 5;
            if (mob.health <= 0) {
                mob.isAlive = false;
                scene.remove(mob.mesh);
                updateHUD();
            }
            showMessage(`Hit Mob! HP: ${mob.health}/${mob.maxHealth}`);
        }
    });
}

// Interact with Nearby Objects
function interactWithNearby() {
    // Check distance to first tree
    if (firstTree && player.position.distanceTo(firstTree.position) < 20) {
        if (firstTree.userData.hasKey) {
            firstTree.userData.hasKey = false;
            showMessage('🔑 Found Underground Key!');
            updatePlayerData({ hasUndergroundKey: true });
        }
    }

    // Check underground access
    if (player.position.y < -40 && playerData.hasUndergroundKey) {
        terrain.visible = false;
        undergroundWorld.visible = true;
        showMessage('⛩️ Entered Underground Realm!');
    }
}

// Shop System
let shopOpen = false;
function toggleShop() {
    shopOpen = !shopOpen;
    const shopPanel = document.getElementById('shopPanel');
    if (shopOpen) {
        shopPanel.classList.add('active');
        loadShopItems();
    } else {
        shopPanel.classList.remove('active');
    }
}

async function loadShopItems() {
    try {
        const res = await fetch('/api/shop');
        const data = await res.json();
        const shopItems = document.getElementById('shopItems');
        shopItems.innerHTML = data.items.map(item => `
            <div class="shop-item" onclick="buyItem(${item.id})">
                <strong>${item.name}</strong><br>
                Price: ${item.price} Gold
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading shop:', err);
    }
}

async function buyItem(itemId) {
    try {
        const res = await fetch('/api/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: playerId, itemId })
        });
        const data = await res.json();
        if (data.success) {
            showMessage(`✅ ${data.message}`);
            playerData = data.player;
            updateHUD();
        } else {
            showMessage(`❌ ${data.error}`);
        }
    } catch (err) {
        console.error('Error buying item:', err);
    }
}

// Powers System
let powersOpen = false;
function togglePowers() {
    powersOpen = !powersOpen;
    const powersList = document.getElementById('powersList');
    if (powersOpen) {
        powersList.innerHTML = playerData.powers.map(p => `<div>⚡ ${p}</div>`).join('');
    } else {
        powersList.innerHTML = '';
    }
}

// HUD Update
let playerData = {};
function updateHUD() {
    document.getElementById('playerName').textContent = playerData.username || 'Player';
    document.getElementById('level').textContent = playerData.level || 1;
    document.getElementById('xp').textContent = playerData.exp || 0;
    
    const hpPercent = (playerData.hp / playerData.maxHp) * 100;
    document.getElementById('hpBar').style.width = hpPercent + '%';
    
    const manaPercent = (playerData.mana / playerData.maxMana) * 100;
    document.getElementById('manaBar').style.width = manaPercent + '%';
}

function showMessage(msg) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = msg;
    messageBox.classList.add('active');
    setTimeout(() => messageBox.classList.remove('active'), 3000);
}

// Update Player Data
function updatePlayerData(updates) {
    playerData = { ...playerData, ...updates };
    updateHUD();
}

// Socket.io Connection
function connectMultiplayer() {
    socket = io();
    
    socket.on('connect', () => {
        socket.emit('playerJoin', {
            username: playerData.username,
            position: player.position
        });
    });

    socket.on('playersList', (players) => {
        // Update other players
    });

    socket.on('playerMoved', (data) => {
        // Update other player position
    });
}

// Main Animation Loop
function animate() {
    requestAnimationFrame(animate);

    if (gameRunning) {
        updatePlayerPosition();
        checkMobCollisions();
        
        // Update mobs AI
        mobs.forEach(mob => {
            if (mob.isAlive) {
                const dirToPlayer = player.position.clone().sub(mob.position).normalize();
                mob.position.addScaledVector(dirToPlayer, mob.speed);
                mob.mesh.position.copy(mob.position);
            }
        });

        // Gravity
        if (player.position.y > 0) {
            player.position.y -= 0.1;
        }
    }

    renderer.render(scene, camera);
}

// Game Start
async function startGame(token, user) {
    playerId = user._id;
    playerData = user;
    
    document.getElementById('authPanel').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    initScene();
    createTerrain();
    createTrees();
    createPlayer();
    createMobs();
    createUnderground();
    connectMultiplayer();
    updateHUD();

    gameRunning = true;
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Auth Functions
function toggleForm() {
    document.getElementById('loginForm').style.display = 
        document.getElementById('loginForm').style.display === 'none' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = 
        document.getElementById('registerForm').style.display === 'none' ? 'block' : 'none';
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            startGame(data.token, data.user);
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirm').value;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, confirmPassword })
        });
        const data = await res.json();
        
        if (data.success) {
            alert(data.message);
            toggleForm();
        } else {
            alert('Registration failed: ' + data.error);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function logoutGame() {
    gameRunning = false;
    localStorage.removeItem('token');
    location.reload();
}
