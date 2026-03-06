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
directionalLight.position.set(10,20,10);
scene.add(directionalLight);

// --- Player ---
let skins = [0xff0000,0x0000ff,0x00ff00,0xffff00];
let skinIndex=0;
const geometry = new THREE.BoxGeometry(1,1,1);
let material = new THREE.MeshStandardMaterial({color:skins[skinIndex]});
const player = new THREE.Mesh(geometry, material);
player.position.y = 0.5;
scene.add(player);

// Player stats
let playerLevel = 1;
let playerExp = 0;
let playerHP = 50;
let playerMaxHP = 50;
let playerCoins = 0;

// --- Map ---
const floorGeometry = new THREE.PlaneGeometry(100,100,20,20);
const floorMaterial = new THREE.MeshPhongMaterial({color:0x228B22, side: THREE.DoubleSide, flatShading:true});
const floor = new THREE.Mesh(floorGeometry,floorMaterial);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// --- Power Cubes ---
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

// Définir moves simples pour test
function createPowerCubes(){
    let cubes = [];
    // MAD - boost attaque et vitesse
    cubes.push(new PowerCube("MAD",5,5,0xff0000,{
        'a': ()=>{console.log("MAD Move 1"); player.position.x +=1;},
        'q': ()=>{console.log("MAD Move 2"); player.position.z -=1;}
    }));
    // GATE - téléport
    cubes.push(new PowerCube("GATE",-5,10,0x0000ff,{
        'w': ()=>{console.log("GATE teleport"); player.position.set(0,0.5,0);},
        'z': ()=>{console.log("GATE dash"); player.position.x +=2;}
    }));
    // Ajouter 8 autres cubes simples
    cubes.push(new PowerCube("FLAME",10,-5,0xffa500,{'s':()=>{console.log("FLAME attack");}}));
    cubes.push(new PowerCube("ICE",-10,-5,0x00ffff,{'x':()=>{console.log("ICE attack");}}));
    cubes.push(new PowerCube("SHIELD",15,0,0xffff00,{'a':()=>{console.log("SHIELD up");}}));
    cubes.push(new PowerCube("SPEED",-15,5,0x00ff00,{'q':()=>{console.log("SPEED boost");}}));
    cubes.push(new PowerCube("JUMP",20,10,0xff00ff,{'w':()=>{console.log("JUMP high");}}));
    cubes.push(new PowerCube("LIGHTNING",-20,-10,0xffff00,{'z':()=>{console.log("LIGHTNING");}}));
    cubes.push(new PowerCube("HEAL",25,-15,0x00ff00,{'s':()=>{console.log("HEAL"); playerHP=Math.min(playerHP+20,playerMaxHP);}}));
    cubes.push(new PowerCube("GRAVITY",-25,15,0x0000ff,{'x':()=>{console.log("GRAVITY slow");}}));
    return cubes;
}
let powerCubes = createPowerCubes();
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
for(let i=0;i<20;i++){
    let x=Math.random()*80-40;
    let z=Math.random()*80-40;
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
            // Acheter vie automatiquement tous les 5 coins
            if(playerCoins % 5 === 0){
                playerMaxHP += 10;
                playerHP += 10; // boost immédiat
            }
        }
    });
}
// --- NPC simples ---
class NPC {
    constructor(level,x,z){
        this.level = level;
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5,16,16),
            new THREE.MeshStandardMaterial({color:0xff00ff})
        );
        this.mesh.position.set(x,0.5,z);
        scene.add(this.mesh);
        this.expReward = level*5;
        this.coinReward = level*2;
        this.hp = 10+level*2;
    }
}

let npcs = [];
for(let i=0;i<10;i++){
    npcs.push(new NPC(Math.floor(Math.random()*50)+1, Math.random()*50-25, Math.random()*50-25));
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
    skinIndex=(skinIndex+1)%skins.length;
    player.material.color.setHex(skins[skinIndex]);
});

// --- Animate ---
let walkOffset=0;
function animate(){
    requestAnimationFrame(animate);
    let speed=0.1;
    let moving=false;
    if(keys['arrowup']){ player.position.z-=speed; moving=true;}
    if(keys['arrowdown']){ player.position.z+=speed; moving=true;}
    if(keys['arrowleft']){ player.position.x-=speed; moving=true;}
    if(keys['arrowright']){ player.position.x+=speed; moving=true;}
    if(keys[' ']){ player.position.y+=0.2; moving=true;} // simple jump

    // Animation marche
    if(moving){
        walkOffset+=0.1;
        player.position.y=0.5+Math.sin(walkOffset)*0.1;
    } else { walkOffset=0; player.position.y=0.5;}

    // Activer power cubes
    ['a','q','w','z','s','x'].forEach(k=>{
        if(keys[k]){
            powerCubes.forEach(c=>c.activate(k));
        }
    });

    // Camera suit joueur
    camera.position.x=player.position.x;
    camera.position.z=player.position.z+10;
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
