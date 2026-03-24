const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/toblocks', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(err => console.log('DB Error:', err));

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = 'TOBLOCKS_SECRET_KEY_CHANGE_THIS_IN_PRODUCTION';

// ========== SCHEMAS ==========
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    mana: { type: Number, default: 50 },
    maxMana: { type: Number, default: 50 },
    gold: { type: Number, default: 1000 },
    powers: [{ type: String }],
    inventory: [{ type: String }],
    position: { x: Number, y: Number, z: Number },
    hasUndergroundKey: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ========== AUTH ROUTES ==========
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, error: 'Passwords do not match' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            position: { x: 0, y: 2, z: 10 }
        });
        
        await user.save();
        res.json({ success: true, message: 'Registration successful! Please login.' });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                username: user.username,
                level: user.level,
                exp: user.exp,
                hp: user.hp,
                maxHp: user.maxHp,
                mana: user.mana,
                gold: user.gold,
                powers: user.powers,
                position: user.position
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// ========== PLAYER ROUTES ==========
app.get('/api/player/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'Player not found' });
        res.json({ success: true, player: user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

app.put('/api/player/:id', async (req, res) => {
    try {
        const { position, hp, mana, exp, level, gold } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { position, hp, mana, exp, level, gold },
            { new: true }
        );
        res.json({ success: true, player: user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// ========== SHOP ROUTES ==========
const shopItems = [
    { id: 1, name: 'Iron Sword', price: 100, damage: 15 },
    { id: 2, name: 'Steel Sword', price: 250, damage: 25 },
    { id: 3, name: 'Dragon Sword', price: 500, damage: 50 },
    { id: 4, name: 'Health Potion', price: 50, heal: 30 },
    { id: 5, name: 'Mana Potion', price: 50, mana: 30 }
];

app.get('/api/shop', (req, res) => {
    res.json({ success: true, items: shopItems });
});

app.post('/api/buy', async (req, res) => {
    try {
        const { userId, itemId } = req.body;
        const item = shopItems.find(i => i.id === itemId);
        const user = await User.findById(userId);

        if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
        if (user.gold < item.price) {
            return res.status(400).json({ success: false, error: 'Not enough gold!' });
        }

        user.gold -= item.price;
        user.inventory.push(item.name);
        await user.save();

        res.json({ success: true, message: `Bought ${item.name}!`, player: user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// ========== GODS ROUTES ==========
const gods = [
    { id: 1, name: 'Fire God', power: 'Inferno', description: 'Master of flames', underground: true },
    { id: 2, name: 'Ice God', power: 'Blizzard', description: 'Lord of ice', underground: true },
    { id: 3, name: 'Thunder God', power: 'Lightning', description: 'God of storms', underground: true },
    { id: 4, name: 'Nature God', power: 'Forest', description: 'Keeper of nature', underground: true }
];

app.get('/api/gods', (req, res) => {
    res.json({ success: true, gods });
});

app.post('/api/learn-power', async (req, res) => {
    try {
        const { userId, power } = req.body;
        const user = await User.findById(userId);
        
        if (!user.powers.includes(power)) {
            user.powers.push(power);
            await user.save();
        }
        
        res.json({ success: true, message: `Learned ${power}!`, powers: user.powers });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// ========== SOCKET.IO MULTIPLAYER ==========
const players = {};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('playerJoin', (data) => {
        players[socket.id] = {
            id: socket.id,
            username: data.username,
            position: data.position,
            hp: data.hp
        };
        io.emit('playersList', Object.values(players));
    });

    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].position = data.position;
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                position: data.position
            });
        }
    });

    socket.on('attack', (data) => {
        io.emit('playerAttacked', {
            attacker: socket.id,
            target: data.targetId,
            damage: data.damage
        });
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
        console.log('Player disconnected:', socket.id);
    });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 TOBLOCKS Server running on http://localhost:${PORT}`);
});
