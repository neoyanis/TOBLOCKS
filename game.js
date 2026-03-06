// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 10;

// Renderer
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff,0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff,0.8);
directionalLight.position.set(50,100,50);
scene.add(directionalLight);

// --- Player Minecraft-style ---
let skinsMaterials = [
    [ // Skin 1 - rouge
        new THREE.MeshStandardMaterial({color:0xff5555}),
        new THREE.MeshStandardMaterial({color:0xff0000}),
        new THREE.MeshStandardMaterial({color:0xaa0000}),
        new THREE.MeshStandardMaterial({color:0xff2222}),
        new THREE.MeshStandardMaterial({color:0xff4444}),
        new THREE.MeshStandardMaterial({color:0xff1111})
    ],
    [ // Skin 2 - bleu
        new THREE.MeshStandardMaterial({color:0x5555ff}),
        new THREE.MeshStandardMaterial({color:0x0000ff}),
        new THREE.MeshStandardMaterial({color:0x0000aa}),
        new THREE.MeshStandardMaterial({color:0x2222ff}),
        new THREE.MeshStandardMaterial({color:0x4444ff}),
        new THREE.MeshStandardMaterial({color:0x1111ff})
    ],
    [ // Skin 3 - vert
        new THREE.MeshStandardMaterial({color:0x55ff55}),
        new THREE.MeshStandardMaterial({color:0x00ff00}),
        new THREE.MeshStandardMaterial({color:0x00aa00}),
        new THREE.MeshStandardMaterial({color:0x22ff22}),
        new THREE.MeshStandardMaterial({color:0x44ff44}),
        new THREE.MeshStandardMaterial({color:0x11ff11})
    ]
];

let skinIndex = 0;
const geometry = new THREE.BoxGeometry(1,1,1);
const player = new THREE.Mesh(geometry, skinsMaterials[skinIndex]);
player.position.y=0.5;
scene.add(player);

// Player stats
let playerLevel = 1;
let playerExp = 0;
let playerHP = 50;
let playerMaxHP = 50;
let playerCoins = 0;

// --- Map (gigantesque) ---
const floorGeometry = new THREE.PlaneGeometry(300,300,50,50);
const floorMaterial = new THREE.MeshPhongMaterial({color:0x228B22, side:THREE.DoubleSide, flatShading:true});
const floor = new THREE.Mesh(floorGeometry,floorMaterial);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// --- Power Cubes Minecraft-style ---
class PowerCube {
    constructor(name,x,z,color,moves){
        this.name=name;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshStandardMaterial({color:color})
        );
        this.mesh.position.set(x,0.5,z);
        scene.add(this.mesh);
        this.moves=moves; // tableau de fonctions
    }
    activate(moveKey){
        if(this.moves[moveKey]) this.moves[moveKey]();
    }
}

function createPowerCubes(){
    let cubes = [];
    cubes.push(new PowerCube("MAD",50,50,0xff0000,{'a':()=>{player.position.x+=2;},'q':()=>{player.position.z-=2;}}));
    cubes.push(new PowerCube("GATE",-50,80,0x0000ff,{'w':()=>{player.position.set(0,0.5,0);},'z':()=>{player.position.x+=5;}}));
    cubes.push(new PowerCube("FLAME",80,-50,0xffa500,{'s':()=>{console.log("FLAME");}}));
    cubes.push(new PowerCube("ICE",-80,-60,0x00ffff,{'x':()=>{console.log("ICE");}}));
    cubes.push(new PowerCube("SHIELD",100,0,0xffff00,{'a':()=>{console.log("SHIELD");}}));
    cubes.push(new PowerCube("SPEED",-100,60,0x00ff00,{'q':()=>{console.log("SPEED");}}));
    cubes.push(new PowerCube("JUMP",120,100,0xff00ff,{'w':()=>{player.position.y+=2;}}));
    cubes.push(new PowerCube("LIGHTNING",-120,-100,0xffff00,{'z':()=>{console.log("LIGHTNING");}}));
    cubes.push(new PowerCube("HEAL",150,-150,0x00ff00,{'s':()=>{playerHP=Math.min(playerHP+20,playerMaxHP);}}));
    cubes.push(new PowerCube("GRAVITY",-150,150,0x0000ff,{'x':()=>{console.log("GRAVITY");}}));
    return cubes;
}
let powerCubes = createPowerCubes();

// --- NPC Minecraft-style ---
class NPC {
    constructor(level,x,z){
        this.level = level;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshStandardMaterial({color:0x8844ff})
        );
        this.mesh.position.set(x,0.5,z);
        scene.add(this.mesh);
        this.expReward = level*5;
        this.coinReward = level*2;
        this.hp = 10+level*2;
    }
}

let npcs = [];
for(let i=0;i<20;i++){
    npcs.push(new NPC(Math.floor(Math.random()*500)+1, Math.random()*280-140, Math.random()*280-140));
}

// --- Pièces ---
class Coin {
    constructor(x,z){
        this.mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3,0.3,0.1,16),
            new THREE.MeshStandardMaterial({color:0xFFD700})
        );
        this.mesh.position.set(x,0.1,z);
        this.mesh.rotation.x=Math.PI/2;
        scene.add(this.mesh);
    }
}

let coins = [];
for(let i=0;i<50;i++){
    let x=Math.random()*280-140;
    let z=Math.random()*280-140;
    coins.push(new Coin(x,z));
}

// --- Ramassage pièces ---
function checkCoinPickup(){
    coins.forEach((c,index)=>{
        const dx = player.position.x - c.mesh.position.x;
        const dz = player.position.z - c.mesh.position.z;
        const distance = Math.sqrt(dx*dx + dz*dz);
        if(distance < 1){
            playerCoins += 1;
            scene.remove(c.mesh);
            coins.splice(index,1);
            if(playerCoins % 5 === 0){
                playerMaxHP += 10;
                playerHP += 10;
            }
        }
    });
}

// --- UI ---
const ui = document.getElementById("ui");
function updateUI(){
    ui.innerHTML=`Niveau: ${playerLevel} <br> Vie: ${playerHP}/${playerMaxHP} <br> Pièces: ${playerCoins}`;
}

// --- Controls ---
const keys = {};
document.addEventListener('keydown',(e)=>{ keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup',(e)=>{ keys[e.key.toLowerCase()] = false; });

// Skin button
document.getElementById("skinButton").addEventListener("click",()=>{
    skinIndex=(skinIndex+1)%skinsMaterials.length;
    player.material=skinsMaterials[skinIndex];
});

// --- Animate ---
let walkOffset=0;
function animate(){
    requestAnimationFrame(animate);
    let speed=0.2;
    let moving=false;
    if(keys['arrowup']){ player.position.z-=speed; moving=true;}
    if(keys['arrowdown']){ player.position.z+=speed; moving=true;}
    if(keys['arrowleft']){ player.position.x-=speed; moving=true;}
    if(keys['arrowright']){ player.position.x+=speed; moving=true;}
    if(keys[' ']){ player.position.y+=0.2; moving=true;} // jump

    // Animation marche
    if(moving){ walkOffset+=0.1; player.position.y=0.5+Math.sin(walkOffset)*0.1; }
    else { walkOffset=0; player.position.y=0.5; }

    // Activer power cubes
    ['a','q','w','z','s','x'].forEach(k=>{
        if(keys[k]) powerCubes.forEach(c=>c.activate(k));
    });

    // Ramassage pièces
    checkCoinPickup();

    // Camera suit joueur
    camera.position.x=player.position.x;
    camera.position.z=player.position.z+20;
    camera.position.y=player.position.y+10;
    camera.lookAt(player.position);

    updateUI();
    renderer.render(scene,camera);
}

animate();

// Resize
window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});
