// Audio System
const audioSystem = {
    context: null,
    enabled: true,
    backgroundMusic: null,
    chaseMusic: null,
    currentAmbient: null,
    isChasing: false,
    lastChaseCheck: 0,
    sounds: {},
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.setupAudioElements();
            this.generateSounds();
            this.setupEventListeners();
        } catch (e) {
            console.warn('Web Audio API not supported, audio disabled:', e);
            this.enabled = false;
        }
    },

    setupAudioElements() {
        this.backgroundMusic = document.getElementById('backgroundMusic');
        this.chaseMusic = document.getElementById('scaryChaseSound');
        this.interactionSound = document.getElementById('interactionSound');
        this.locationChangeSound = document.getElementById('locationChangeSound');
        this.damageSound = document.getElementById('damageSound');
    },

    setupEventListeners() {
        const toggleSoundBtn = document.getElementById('toggleSound');
        const toggleGameSoundBtn = document.getElementById('toggleGameSound');
        if (toggleSoundBtn) toggleSoundBtn.addEventListener('click', this.toggleSound.bind(this));
        if (toggleGameSoundBtn) toggleGameSoundBtn.addEventListener('click', this.toggleSound.bind(this));
    },

    generateSounds() {
        if (!this.enabled) return;

        // Generate different ambient sounds for each location
        this.generateAmbientSounds();
        this.generateChaseMusic();
        this.generateSoundEffects();
    },

    generateAmbientSounds() {
        const locations = ['home', 'park', 'friend', 'theater', 'garden', 'forest', 'lake', 'end'];
        
        locations.forEach(location => {
            this.sounds[location] = this.createAmbientSound(location);
        });
    },

    createAmbientSound(locationType) {
        if (!this.context) return null;

        const buffer = this.context.createBuffer(2, this.context.sampleRate * 4, this.context.sampleRate);
        
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            
            for (let i = 0; i < channelData.length; i++) {
                let sample = 0;
                
                switch (locationType) {
                    case 'home':
                        // Gentle home ambiance with soft tones
                        sample = Math.sin(2 * Math.PI * 220 * i / this.context.sampleRate) * 0.05 +
                                Math.sin(2 * Math.PI * 110 * i / this.context.sampleRate) * 0.03;
                        break;
                    case 'park':
                        // Bird sounds and gentle wind
                        sample = Math.sin(2 * Math.PI * 330 * i / this.context.sampleRate) * 0.04 +
                                Math.random() * 0.02 - 0.01;
                        break;
                    case 'forest':
                        // Deep forest sounds with wind through trees
                        sample = Math.sin(2 * Math.PI * 80 * i / this.context.sampleRate) * 0.06 +
                                Math.sin(2 * Math.PI * 160 * i / this.context.sampleRate) * 0.03 +
                                (Math.random() * 0.03 - 0.015);
                        break;
                    case 'lake':
                        // Water lapping sounds
                        sample = Math.sin(2 * Math.PI * 100 * i / this.context.sampleRate) * 0.05 +
                                Math.sin(2 * Math.PI * 200 * (1 + Math.sin(i / 1000)) * i / this.context.sampleRate) * 0.04;
                        break;
                    case 'theater':
                        // Quiet theater ambiance
                        sample = Math.sin(2 * Math.PI * 60 * i / this.context.sampleRate) * 0.03;
                        break;
                    case 'garden':
                        // Peaceful garden with buzzing
                        sample = Math.sin(2 * Math.PI * 440 * i / this.context.sampleRate) * 0.02 +
                                Math.sin(2 * Math.PI * 220 * i / this.context.sampleRate) * 0.04;
                        break;
                    default:
                        sample = Math.sin(2 * Math.PI * 200 * i / this.context.sampleRate) * 0.03;
                }
                
                // Add some natural variation
                sample *= (0.8 + Math.random() * 0.4);
                channelData[i] = sample;
            }
        }
        
        return buffer;
    },

    generateChaseMusic() {
        if (!this.context) return;

        // Create scary chase music buffer
        const buffer = this.context.createBuffer(2, this.context.sampleRate * 2, this.context.sampleRate);
        
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            
            for (let i = 0; i < channelData.length; i++) {
                // Scary low-frequency rumble with dissonant overtones
                let sample = Math.sin(2 * Math.PI * 55 * i / this.context.sampleRate) * 0.15 +
                            Math.sin(2 * Math.PI * 85 * i / this.context.sampleRate) * 0.12 +
                            Math.sin(2 * Math.PI * 110 * i / this.context.sampleRate) * 0.08 +
                            Math.sin(2 * Math.PI * 165 * i / this.context.sampleRate) * 0.06;
                
                // Add tension with higher frequencies
                sample += Math.sin(2 * Math.PI * 880 * (1 + Math.sin(i / 800)) * i / this.context.sampleRate) * 0.08;
                
                // Add some noise for scary effect
                sample += (Math.random() * 0.1 - 0.05);
                
                channelData[i] = sample * (0.7 + Math.random() * 0.3);
            }
        }
        
        this.sounds.chase = buffer;
    },

    generateSoundEffects() {
        if (!this.context) return;

        // Interaction sound (positive chime)
        this.sounds.interaction = this.createSoundEffect(440, 0.2, 'sine');
        
        // Location change sound (upward sweep)
        this.sounds.locationChange = this.createSweepSound(200, 400, 0.5);
        
        // Damage sound (harsh noise)
        this.sounds.damage = this.createSoundEffect(150, 0.3, 'sawtooth');
    },

    createSoundEffect(frequency, duration, type = 'sine') {
        if (!this.context) return null;

        const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            const t = i / this.context.sampleRate;
            let sample = 0;
            
            switch (type) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'sawtooth':
                    sample = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
                    break;
                case 'square':
                    sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
                    break;
            }
            
            // Apply envelope (fade out)
            const envelope = Math.exp(-t * 3);
            channelData[i] = sample * envelope * 0.3;
        }
        
        return buffer;
    },

    createSweepSound(startFreq, endFreq, duration) {
        if (!this.context) return null;

        const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            const t = i / this.context.sampleRate;
            const progress = t / duration;
            const frequency = startFreq + (endFreq - startFreq) * progress;
            
            const sample = Math.sin(2 * Math.PI * frequency * t);
            const envelope = Math.exp(-t * 2);
            
            channelData[i] = sample * envelope * 0.2;
        }
        
        return buffer;
    },

    playSound(soundName, volume = 0.5) {
        if (!this.enabled || !this.context || !this.sounds[soundName]) return;

        try {
            const source = this.context.createBufferSource();
            const gainNode = this.context.createGain();
            
            source.buffer = this.sounds[soundName];
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.context.destination);         
            source.start();
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    },

    playAmbientSound(locationName) {
        if (!this.enabled) return;

        this.stopAmbientSound();
        
        const soundKey = this.getLocationSoundKey(locationName);
        if (this.sounds[soundKey]) {
            this.currentAmbient = this.createLoopingSource(this.sounds[soundKey], 0.3);
        }
    },

    createLoopingSource(buffer, volume) {
        if (!this.context) return null;

        try {
            const source = this.context.createBufferSource();
            const gainNode = this.context.createGain();
            
            source.buffer = buffer;
            source.loop = true;
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.context.destination);
            source.start();
            
            return { source, gainNode };
        } catch (e) {
            console.warn('Error creating looping source:', e);
            return null;
        }
    },

    stopAmbientSound() {
        if (this.currentAmbient && this.currentAmbient.source) {
            try {
                this.currentAmbient.source.stop();
            } catch (e) {
                // Source may already be stopped
            }
            this.currentAmbient = null;
        }
    },

    startChaseMusic() {
        if (!this.enabled || this.isChasing) return;
        
        this.isChasing = true;
        if (this.sounds.chase) {
            this.chaseMusic = this.createLoopingSource(this.sounds.chase, 0.4);
        }
    },

    stopChaseMusic() {
        if (!this.isChasing) return;
        
        this.isChasing = false;
        if (this.chaseMusic && this.chaseMusic.source) {
            try {
                this.chaseMusic.source.stop();
            } catch (e) {
                // Source may already be stopped
            }
            this.chaseMusic = null;
        }
    },

    checkForChase() {
        // Only check every few frames for performance
        if (Date.now() - this.lastChaseCheck < 100) return;
        this.lastChaseCheck = Date.now();

        const monsters = gameState.monsters;
        let isBeingChased = false;

        for (let monster of monsters) {
            if (monster.behavior === 'crazy' || monster.behavior === 'chase' || monster.behavior === 'hunt') {
                const dx = monster.x - gameState.playerX;
                const dy = monster.y - gameState.playerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If monster is close and actively pursuing
                if (distance < 150) {
                    isBeingChased = true;
                    break;
                }
            }
        }

        if (isBeingChased && !this.isChasing) {
            this.startChaseMusic();
        } else if (!isBeingChased && this.isChasing) {
            this.stopChaseMusic();
        }
    },

    getLocationSoundKey(locationName) {
        const locationMap = {
            'Home': 'home',
            'Player\'s House Interior': 'home',
            'Neighborhood Park': 'park',
            'Friend\'s House': 'friend',
            'Friend\'s House Interior': 'friend',
            'Movie Theater': 'theater',
            'Garden Center': 'garden',
            'Forest Path': 'forest',
            'Crystal Lake': 'lake',
            'End of the Earth': 'end'
        };
        return locationMap[locationName] || 'home';
    },

    toggleSound() {
        this.enabled = !this.enabled;
        const buttons = [document.getElementById('toggleSound'), document.getElementById('toggleGameSound')];
        
        buttons.forEach(button => {
            if (button) {
                button.textContent = this.enabled ? '🔊' : '🔇';
                if (button.id === 'toggleSound') {
                    button.textContent = this.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
                }
            }
        });

        if (!this.enabled) {
            this.stopAmbientSound();
            this.stopChaseMusic();
        } else {
            // Resume context if needed
            if (this.context && this.context.state === 'suspended') {
                this.context.resume();
            }
            // Restart ambient sound for current location
            const currentLocationName = locations[gameState.currentLocation].name;
            this.playAmbientSound(currentLocationName);
        }
    },

    playInteractionSound() {
        this.playSound('interaction', 0.3);
    },

    playLocationChangeSound() {
        this.playSound('locationChange', 0.4);
    },

    playDamageSound() {
        this.playSound('damage', 0.5);
    }
};

// Game state and configuration
const gameState = {
    currentScreen: 'start',
    playerName: 'Hero',
    hearts: 3,
    currentLocation: 0,
    playerX: 400,
    playerY: 300,
    checkpointX: 400,
    checkpointY: 300,
    checkpointLocation: 0,
    gameRunning: false,
    keys: {},
    monsters: [],
    collectibles: [],
    invincible: false,
    invincibilityTimer: 0,
    visitedLocations: [0], // Track visited locations
    interactableElements: [],
    doorStates: {}, // Track which doors are open
    secrets: [], // Track discovered secrets
    tutorialShown: false, // Track if tutorial has been shown
    hasMovedHero: false // Track if hero has moved with arrow keys
};

// Game locations with different themes
const locations = [
    {
        name: "Home",
        bgClass: "location-home",
        description: "Your cozy home with a pool outside",
        nextLocation: { x: 750, y: 300, to: 1 },
        obstacles: [],
        monsters: [],
        theme: "🏠"
    },
    {
        name: "Neighborhood Park",
        bgClass: "location-park",
        description: "A beautiful park with trees and flowers",
        nextLocation: { x: 750, y: 300, to: 2 },
        previousLocation: { x: 50, y: 300, to: 0 },
        obstacles: [
            { x: 200, y: 200, width: 60, height: 60, type: "tree" },
            { x: 400, y: 150, width: 80, height: 40, type: "bench" }
        ],
        monsters: [
            { x: 200, y: 350, width: 45, height: 45, speed: 2.0, direction: 1, type: "squirrel", behavior: "crazy" },
            { x: 100, y: 400, width: 40, height: 40, speed: 1.4, direction: 1, type: "squirrel", behavior: "street_patrol", patrolPath: 0 },
            { x: 600, y: 400, width: 40, height: 40, speed: 1.4, direction: 1, type: "squirrel", behavior: "street_patrol", patrolPath: 0 }
        ],
        theme: "🌳"
    },
    {
        name: "Friend's House",
        bgClass: "location-friend-house",
        description: "Your friend's house - safe checkpoint",
        nextLocation: { x: 750, y: 300, to: 3 },
        previousLocation: { x: 50, y: 300, to: 1 },
        obstacles: [],
        monsters: [],
        isCheckpoint: true,
        theme: "🏡"
    },
    {
        name: "Movie Theater",
        bgClass: "location-theater",
        description: "The local movie theater",
        nextLocation: { x: 750, y: 300, to: 4 },
        previousLocation: { x: 50, y: 300, to: 2 },
        obstacles: [
            { x: 150, y: 250, width: 100, height: 50, type: "counter" }
        ],
        monsters: [
            { x: 400, y: 200, width: 50, height: 50, speed: 2.5, direction: 1, type: "ghost", behavior: "crazy" },
            { x: 200, y: 350, width: 40, height: 40, speed: 1.3, direction: 1, type: "ghost", behavior: "street_patrol", patrolPath: 0 },
            { x: 550, y: 350, width: 40, height: 40, speed: 1.3, direction: -1, type: "ghost", behavior: "street_patrol", patrolPath: 0 }
        ],
        theme: "🎬"
    },
    {
        name: "Garden Center",
        bgClass: "location-garden",
        description: "Beautiful gardens with flowers",
        nextLocation: { x: 750, y: 300, to: 5 },
        previousLocation: { x: 50, y: 300, to: 3 },
        obstacles: [
            { x: 200, y: 300, width: 40, height: 40, type: "flower" },
            { x: 350, y: 200, width: 40, height: 40, type: "flower" }
        ],
        monsters: [
            { x: 400, y: 350, width: 35, height: 35, speed: 2.0, direction: 1, type: "bee", behavior: "crazy" },
            { x: 150, y: 450, width: 30, height: 30, speed: 1.5, direction: 1, type: "bee", behavior: "street_patrol", patrolPath: 0 },
            { x: 600, y: 400, width: 30, height: 30, speed: 1.5, direction: -1, type: "bee", behavior: "street_patrol", patrolPath: 0 }
        ],
        theme: "🌺"
    },
    {
        name: "Forest Path",
        bgClass: "location-forest",
        description: "Deep forest with tall trees",
        nextLocation: { x: 750, y: 300, to: 6 },
        previousLocation: { x: 50, y: 300, to: 4 },
        obstacles: [
            { x: 100, y: 150, width: 50, height: 80, type: "tree" },
            { x: 450, y: 100, width: 55, height: 90, type: "tree" }
        ],
        monsters: [
            { x: 300, y: 350, width: 55, height: 55, speed: 2.5, direction: 1, type: "wolf", behavior: "crazy" },
            { x: 150, y: 400, width: 45, height: 45, speed: 1.8, direction: 1, type: "wolf", behavior: "street_patrol", patrolPath: 0 },
            { x: 650, y: 400, width: 45, height: 45, speed: 1.8, direction: -1, type: "wolf", behavior: "street_patrol", patrolPath: 0 }
        ],
        theme: "🌲"
    },
    {
        name: "Crystal Lake",
        bgClass: "location-lake",
        description: "A serene lake - checkpoint",
        nextLocation: { x: 750, y: 300, to: 7 },
        previousLocation: { x: 50, y: 300, to: 5 },
        obstacles: [
            { x: 300, y: 300, width: 200, height: 150, type: "water" }
        ],
        monsters: [
            { x: 300, y: 450, width: 40, height: 40, speed: 2.0, direction: 1, type: "frog", behavior: "crazy" },
            { x: 150, y: 380, width: 35, height: 35, speed: 1.6, direction: 1, type: "frog", behavior: "street_patrol", patrolPath: 0 },
            { x: 600, y: 400, width: 35, height: 35, speed: 1.6, direction: -1, type: "frog", behavior: "street_patrol", patrolPath: 0 }
        ],
        isCheckpoint: true,
        theme: "🌊"
    },
    {
        name: "End of the Earth",
        bgClass: "location-end",
        description: "The final destination!",
        previousLocation: { x: 50, y: 300, to: 6 },
        obstacles: [],
        monsters: [
            { x: 400, y: 100, width: 70, height: 70, speed: 3.2, direction: 1, type: "dragon", behavior: "crazy" },
            { x: 200, y: 200, width: 65, height: 65, speed: 2.8, direction: 1, type: "dragon", behavior: "guard_treasure" },
            { x: 600, y: 350, width: 60, height: 60, speed: 2.5, direction: -1, type: "dragon", behavior: "street_patrol", patrolPath: 0 }
        ],
        isFinalLocation: true,
        theme: "🏆"
    },
    // Interior locations
    {
        name: "Player's House Interior",
        bgClass: "location-player-interior",
        description: "Inside your cozy home",
        previousLocation: { x: 400, y: 550, to: 0 },
        obstacles: [],
        monsters: [],
        isInterior: true,
        parentLocation: 0,
        theme: "🏠"
    },
    {
        name: "Friend's House Interior", 
        bgClass: "location-friend-interior",
        description: "Inside your friend's house",
        previousLocation: { x: 400, y: 550, to: 2 },
        obstacles: [],
        monsters: [],
        isInterior: true,
        parentLocation: 2,
        theme: "🏡"
    }
];

// DOM elements
const screens = {
    start: document.getElementById('startScreen'),
    howToPlay: document.getElementById('howToPlayScreen'),
    map: document.getElementById('mapScreen'),
    game: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOverScreen'),
    victory: document.getElementById('victoryScreen')
};

const elements = {
    characterName: document.getElementById('characterName'),
    startGame: document.getElementById('startGame'),
    playerName: document.getElementById('playerName'),
    currentLocation: document.getElementById('currentLocation'),
    hearts: document.querySelectorAll('.heart'),
    restartGame: document.getElementById('restartGame'),
    backToStart: document.getElementById('backToStart'),
    playAgain: document.getElementById('playAgain'),
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),
    openMap: document.getElementById('openMap'),
    closeMap: document.getElementById('closeMap'),
    gameMap: document.getElementById('gameMap')
};

// Event listeners
elements.startGame.addEventListener('click', startGame);
elements.restartGame.addEventListener('click', restartFromCheckpoint);
elements.backToStart.addEventListener('click', goToStartScreen);
elements.playAgain.addEventListener('click', goToStartScreen);
elements.openMap.addEventListener('click', openMapScreen);
elements.closeMap.addEventListener('click', closeMapScreen);
document.getElementById('howToPlayBtn').addEventListener('click', showInstructions);
document.getElementById('closeInstructions').addEventListener('click', closeInstructions);
document.getElementById('closeTutorial').addEventListener('click', closeTutorial);
document.getElementById('exitTutorial').addEventListener('click', closeTutorial);
document.getElementById('controlBox').addEventListener('click', showTutorial);

document.addEventListener('keydown', (e) => {
    gameState.keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
        e.preventDefault();
        handleInteraction();
    }
    if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        openMapScreen();
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key.toLowerCase()] = false;
});

// Add canvas click event listener for transitions AND interactive elements
elements.canvas.addEventListener('click', handleCanvasClick);

// Map location click listeners
document.querySelectorAll('.map-location').forEach(location => {
    location.addEventListener('click', (e) => {
        const locationIndex = parseInt(e.target.dataset.location);
        if (gameState.visitedLocations.includes(locationIndex)) {
            jumpToLocation(locationIndex);
        }
    });
});

function startGame() {
    const name = elements.characterName.value.trim();
    gameState.playerName = name || 'Hero';
    elements.playerName.textContent = gameState.playerName;
    
    // Initialize audio system
    audioSystem.init();
    
    gameState.hearts = 3;
    gameState.currentLocation = 0;
    gameState.playerX = 400; // Center X position
    gameState.playerY = 300; // Center Y position
    gameState.checkpointX = 100;
    gameState.checkpointY = 300;
    gameState.checkpointLocation = 0;
    gameState.gameRunning = true;
    gameState.hasMovedHero = false; // Reset hero movement flag for new game
    
    updateHearts();
    updateLocation();
    
    // Start ambient sound for initial location
    audioSystem.playAmbientSound(locations[gameState.currentLocation].name);
    
    showScreen('game');
    gameLoop();
}

function restartFromCheckpoint() {
    gameState.hearts = 3;
    gameState.currentLocation = gameState.checkpointLocation;
    gameState.playerX = gameState.checkpointX;
    gameState.playerY = gameState.checkpointY;
    gameState.gameRunning = true;
    
    // Stop any chase music and restart ambient sound
    audioSystem.stopChaseMusic();
    audioSystem.playAmbientSound(locations[gameState.currentLocation].name);
    
    updateHearts();
    updateLocation();
    showScreen('game');
    gameLoop();
}

function goToStartScreen() {
    gameState.gameRunning = false;
    showScreen('start');
}

function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.add('hidden');
    });
    screens[screenName].classList.remove('hidden');
    gameState.currentScreen = screenName;
}

function updateHearts() {
    elements.hearts.forEach((heart, index) => {
        if (index < gameState.hearts) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
}

function updateLocation() {
    const location = locations[gameState.currentLocation];
    elements.currentLocation.textContent = `${location.theme} ${location.name}`;
    elements.canvas.className = location.bgClass;
    
    // Show/hide hero hint only on home location and if no movement yet
    const heroHint = document.getElementById('heroHint');
    if (gameState.currentLocation === 0 && !gameState.hasMovedHero) { // Home location and no movement yet
        heroHint.classList.remove('hidden');
    } else {
        heroHint.classList.add('hidden');
    }
}

function handlePlayerMovement() {
    const moveSpeed = 3;
    let newX = gameState.playerX;
    let newY = gameState.playerY;
    let hasMoved = false;
    
    if (gameState.keys['w'] || gameState.keys['arrowup']) {
        newY -= moveSpeed;
        hasMoved = true;
    }
    if (gameState.keys['s'] || gameState.keys['arrowdown']) {
        newY += moveSpeed;
        hasMoved = true;
    }
    if (gameState.keys['a'] || gameState.keys['arrowleft']) {
        newX -= moveSpeed;
        hasMoved = true;
    }
    if (gameState.keys['d'] || gameState.keys['arrowright']) {
        newX += moveSpeed;
        hasMoved = true;
    }
    
    // Hide hint after first movement
    if (hasMoved && !gameState.hasMovedHero) {
        gameState.hasMovedHero = true;
        const heroHint = document.getElementById('heroHint');
        heroHint.classList.add('hidden');
    }
    
    if (newX >= 10 && newX <= 770 && newY >= 10 && newY <= 570) {
        const location = locations[gameState.currentLocation];
        let canMove = true;
        
        for (let obstacle of location.obstacles) {
            if (newX < obstacle.x + obstacle.width &&
                newX + 20 > obstacle.x &&
                newY < obstacle.y + obstacle.height &&
                newY + 20 > obstacle.y) {
                canMove = false;
                break;
            }
        }
        
        if (canMove) {
            gameState.playerX = newX;
            gameState.playerY = newY;
        }
    }
}

function handleInteraction() {
    const location = locations[gameState.currentLocation];
    
    if (location.nextLocation) {
        const next = location.nextLocation;
        if (Math.abs(gameState.playerX - next.x) < 80 && Math.abs(gameState.playerY - next.y) < 80) {
            changeLocation(next.to);
            return;
        }
    }
    
    if (location.previousLocation) {
        const prev = location.previousLocation;
        if (Math.abs(gameState.playerX - prev.x) < 80 && Math.abs(gameState.playerY - prev.y) < 80) {
            changeLocation(prev.to);
            return;
        }
    }
    
    if (location.isFinalLocation) {
        if (Math.abs(gameState.playerX - 400) < 50 && Math.abs(gameState.playerY - 300) < 50) {
            gameState.gameRunning = false;
            showScreen('victory');
        }
    }
}

// Enhanced click handler for transitions AND interactive elements
function handleCanvasClick(event) {
    const rect = elements.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const location = locations[gameState.currentLocation];
    
    // Check interactive elements first (doors, pools, etc.)
    if (checkInteractiveElements(clickX, clickY, location)) {
        return;
    }
    
    // Check if clicked on next transition
    if (location.nextLocation) {
        const next = location.nextLocation;
        if (Math.abs(clickX - next.x) < 40 && Math.abs(clickY - next.y) < 20) {
            changeLocation(next.to);
            return;
        }
    }
    
    // Check if clicked on previous transition
    if (location.previousLocation) {
        const prev = location.previousLocation;
        if (Math.abs(clickX - prev.x) < 40 && Math.abs(clickY - prev.y) < 20) {
            changeLocation(prev.to);
            return;
        }
    }
}

function checkInteractiveElements(clickX, clickY, location) {
    const locationName = location.name;
    
    // Home location interactions
    if (locationName === "Home") {
        // Door interaction - enter house (140, 340, 35, 80)
        if (clickX >= 140 && clickX <= 175 && clickY >= 340 && clickY <= 420) {
            enterPlayerHouse();
            return true;
        }
        // Pool interaction (300, 400, 120, 80)
        if (clickX >= 300 && clickX <= 420 && clickY >= 400 && clickY <= 480) {
            splashPool();
            return true;
        }
    }
    
    // Friend's House location interactions
    if (locationName === "Friend's House") {
        // Door interaction - enter friend's house (140, 340, 35, 80)
        if (clickX >= 140 && clickX <= 175 && clickY >= 340 && clickY <= 420) {
            enterFriendHouse();
            return true;
        }
    }
    
    // Interior exit interactions
    if (locationName === "Player's House Interior" || locationName === "Friend's House Interior") {
        // Exit door (375, 520, 50, 80)
        if (clickX >= 375 && clickX <= 425 && clickY >= 520 && clickY <= 600) {
            exitHouse();
            return true;
        }
    }
    
    // Theater location interactions
    if (locationName === "Movie Theater") {
        // Movie screen interaction (270, 70, 260, 110)
        if (clickX >= 270 && clickX <= 530 && clickY >= 70 && clickY <= 180) {
            playMovie();
            return true;
        }
    }
    
    // Lake location interactions
    if (locationName === "Crystal Lake") {
        // Lake water interaction (200, 350, 400, 200)
        if (clickX >= 200 && clickX <= 600 && clickY >= 350 && clickY <= 550) {
            rippleLake(clickX, clickY);
            return true;
        }
    }
    
    // Sky/cloud interactions (available in outdoor locations)
    if (['Home', 'Neighborhood Park', 'Forest Path', 'Crystal Lake', 'Garden Center'].includes(locationName)) {
        // Sky area (0, 0, 800, 300)
        if (clickX >= 0 && clickX <= 800 && clickY >= 0 && clickY <= 300) {
            clickSky(clickX, clickY);
            return true;
        }
    }
    
    return false;
}

// Interactive element functions
function enterPlayerHouse() {
    showMessage("🏠 Welcome home! The door opens...");
    setTimeout(() => {
        gameState.currentLocation = 8; // Player's house interior
        gameState.visitedLocations.push(8);
        gameState.playerX = 400;
        gameState.playerY = 450;
        updateLocation();
    }, 1500);
}

function enterFriendHouse() {
    showMessage("🏡 Welcome to your friend's house!");
    setTimeout(() => {
        gameState.currentLocation = 9; // Friend's house interior
        gameState.visitedLocations.push(9);
        gameState.playerX = 400;
        gameState.playerY = 450;
        updateLocation();
    }, 1500);
}

function exitHouse() {
    const currentLoc = locations[gameState.currentLocation];
    showMessage("🚪 Going back outside...");
    setTimeout(() => {
        gameState.currentLocation = currentLoc.parentLocation;
        gameState.playerX = 170;
        gameState.playerY = 350;
        updateLocation();
    }, 1500);
}

function openDoor(doorId) {
    if (!gameState.doorStates[doorId]) {
        audioSystem.playInteractionSound();
        gameState.doorStates[doorId] = true;
        showMessage("🚪 Door opened! You found a secret passage!");
        gameState.secrets.push("home_door");
    } else {
        showMessage("🚪 The door is already open!");
    }
}

function splashPool() {
    audioSystem.playInteractionSound();
    showMessage("🏊‍♂️ Splash! The water feels refreshing!");
    // Add visual effect
    addWaterEffect(360, 440);
}

function playMovie() {
    audioSystem.playInteractionSound();
    showMessage("🎬 Now playing: 'The Adventures of " + gameState.playerName + "'!");
}

function rippleLake(x, y) {
    audioSystem.playInteractionSound();
    showMessage("🌊 Beautiful ripples spread across the lake!");
    addWaterEffect(x, y);
}

function clickSky(x, y) {
    audioSystem.playInteractionSound();
    const messages = [
        "☁️ A cloud drifts peacefully by...",
        "🌤️ The sky looks beautiful today!",
        "🦅 You spot a bird flying high above!",
        "✨ A shooting star flashes across the sky!",
        "🌈 You feel peaceful looking at the sky..."
    ];
    showMessage(messages[Math.floor(Math.random() * messages.length)]);
}

function addWaterEffect(x, y) {
    // Create temporary visual effect (this could be enhanced)
    console.log(`Water effect at ${x}, ${y}`);
}

function showMessage(text) {
    // Create temporary message display
    const messageDiv = document.createElement('div');
    messageDiv.textContent = text;
    messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 1000;
        font-size: 1.2rem;
        animation: fadeInOut 3s ease-in-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
        document.head.removeChild(style);
    }, 3000);
}

function changeLocation(locationIndex) {
    gameState.currentLocation = locationIndex;
    const location = locations[locationIndex];
    
    // Play location change sound and update ambient sound
    audioSystem.playLocationChangeSound();
    audioSystem.playAmbientSound(location.name);
    
    // Track visited locations
    if (!gameState.visitedLocations.includes(locationIndex)) {
        gameState.visitedLocations.push(locationIndex);
    }
    
    if (location.previousLocation && gameState.playerX > 400) {
        gameState.playerX = 100;
    } else if (location.nextLocation && gameState.playerX < 400) {
        gameState.playerX = 700;
    }
    
    if (location.isCheckpoint) {
        gameState.checkpointX = gameState.playerX;
        gameState.checkpointY = gameState.playerY;
        gameState.checkpointLocation = locationIndex;
    }
    
    updateLocation();
    updateMapStatus();
}

// Map functions
function openMapScreen() {
    if (gameState.gameRunning) {
        updateMapStatus();
        showScreen('map');
    }
}

function closeMapScreen() {
    showScreen('game');
}

function showInstructions() {
    showScreen('howToPlay');
}

function closeInstructions() {
    showScreen('start');
}

function showTutorial() {
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    tutorialOverlay.classList.remove('hidden');
}

function closeTutorial() {
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    tutorialOverlay.classList.add('hidden');
}

function jumpToLocation(locationIndex) {
    gameState.currentLocation = locationIndex;
    gameState.playerX = 400;
    gameState.playerY = 300;
    updateLocation();
    closeMapScreen();
}

function updateMapStatus() {
    document.querySelectorAll('.map-location').forEach((element, index) => {
        element.classList.remove('current', 'visited', 'locked');
        
        if (index === gameState.currentLocation) {
            element.classList.add('current');
        } else if (gameState.visitedLocations.includes(index)) {
            element.classList.add('visited');
        } else {
            element.classList.add('locked');
        }
    });
}

function updateMonsters() {
    const location = locations[gameState.currentLocation];
    
    location.monsters.forEach(monster => {
        // Different AI behaviors
        switch (monster.behavior) {
            case "chase":
                chasePlayer(monster);
                break;
            case "hunt":
                huntPlayer(monster);
                break;
            case "guard":
            case "guard_treasure":
                guardArea(monster);
                break;
            case "patrol":
                patrolArea(monster);
                break;
            case "swarm":
                swarmBehavior(monster);
                break;
            case "jump":
                jumpBehavior(monster);
                break;
            case "pack":
                packBehavior(monster);
                break;
            case "crazy":
                crazyBehavior(monster);
                break;
            case "street_patrol":
                streetPatrolBehavior(monster);
                break;
            default:
                // Default patrol behavior
                monster.x += monster.speed * monster.direction;
                if (monster.x <= 0 || monster.x >= 800 - monster.width) {
                    monster.direction *= -1;
                }
        }
        
        // Keep monsters within bounds
        monster.x = Math.max(0, Math.min(800 - monster.width, monster.x));
        monster.y = Math.max(0, Math.min(600 - monster.height, monster.y));
        
        // Check collision with player (only if not invincible)
        if (!gameState.invincible && 
            gameState.playerX < monster.x + monster.width &&
            gameState.playerX + 20 > monster.x &&
            gameState.playerY < monster.y + monster.height &&
            gameState.playerY + 20 > monster.y) {
            
            // Player takes damage
            gameState.hearts--;
            updateHearts();
            
            // Play damage sound
            audioSystem.playDamageSound();
            
            // Set invincibility period (2 seconds)
            gameState.invincible = true;
            gameState.invincibilityTimer = 120; // 120 frames = 2 seconds at 60fps
            
            if (gameState.hearts <= 0) {
                gameState.gameRunning = false;
                showScreen('gameOver');
            } else {
                // Knockback effect
                const knockbackDistance = 80;
                const dx = gameState.playerX - monster.x;
                const dy = gameState.playerY - monster.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    gameState.playerX += (dx / distance) * knockbackDistance;
                    gameState.playerY += (dy / distance) * knockbackDistance;
                    
                    // Keep player in bounds
                    gameState.playerX = Math.max(10, Math.min(770, gameState.playerX));
                    gameState.playerY = Math.max(10, Math.min(570, gameState.playerY));
                }
            }
        }
    });
}

// AI Behavior Functions
function chasePlayer(monster) {
    const dx = gameState.playerX - monster.x;
    const dy = gameState.playerY - monster.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        monster.x += (dx / distance) * monster.speed;
        monster.y += (dy / distance) * monster.speed;
    }
}

function huntPlayer(monster) {
    // More aggressive chasing with prediction
    const dx = gameState.playerX - monster.x;
    const dy = gameState.playerY - monster.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Predict player movement
    let predictX = gameState.playerX;
    let predictY = gameState.playerY;
    
    if (gameState.keys['w'] || gameState.keys['arrowup']) predictY -= 30;
    if (gameState.keys['s'] || gameState.keys['arrowdown']) predictY += 30;
    if (gameState.keys['a'] || gameState.keys['arrowleft']) predictX -= 30;
    if (gameState.keys['d'] || gameState.keys['arrowright']) predictX += 30;
    
    const predDx = predictX - monster.x;
    const predDy = predictY - monster.y;
    const predDistance = Math.sqrt(predDx * predDx + predDy * predDy);
    
    if (predDistance > 0) {
        monster.x += (predDx / predDistance) * monster.speed * 1.2;
        monster.y += (predDy / predDistance) * monster.speed * 1.2;
    }
}

function guardArea(monster) {
    // Guard the treasure/important areas, chase if player gets close
    const centerX = 400;
    const centerY = 300;
    const guardDistance = 150;
    
    const playerDistance = Math.sqrt(
        (gameState.playerX - centerX) ** 2 + (gameState.playerY - centerY) ** 2
    );
    
    if (playerDistance < guardDistance) {
        // Player is too close to treasure, chase them!
        chasePlayer(monster);
    } else {
        // Patrol around the treasure
        const dx = centerX - monster.x;
        const dy = centerY - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) {
            // Move back towards center
            monster.x += (dx / distance) * monster.speed * 0.5;
            monster.y += (dy / distance) * monster.speed * 0.5;
        } else {
            // Circle around
            monster.x += monster.speed * monster.direction;
            if (Math.random() < 0.02) monster.direction *= -1;
        }
    }
}

function patrolArea(monster) {
    // Simple back and forth patrol
    monster.x += monster.speed * monster.direction;
    if (monster.x <= 50 || monster.x >= 750 - monster.width) {
        monster.direction *= -1;
    }
    
    // Sometimes change direction randomly
    if (Math.random() < 0.01) {
        monster.direction *= -1;
    }
}

function swarmBehavior(monster) {
    // Bees that swarm together and towards player
    const location = locations[gameState.currentLocation];
    const otherBees = location.monsters.filter(m => m.type === "bee" && m !== monster);
    
    let avgX = 0, avgY = 0;
    if (otherBees.length > 0) {
        otherBees.forEach(bee => {
            avgX += bee.x;
            avgY += bee.y;
        });
        avgX /= otherBees.length;
        avgY /= otherBees.length;
    }
    
    // Move towards player and stay with swarm
    const dx = (gameState.playerX - monster.x) * 0.7 + (avgX - monster.x) * 0.3;
    const dy = (gameState.playerY - monster.y) * 0.7 + (avgY - monster.y) * 0.3;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        monster.x += (dx / distance) * monster.speed;
        monster.y += (dy / distance) * monster.speed;
    }
    
    // Add some buzzing motion
    monster.x += Math.sin(Date.now() * 0.01 + monster.x * 0.1) * 2;
    monster.y += Math.cos(Date.now() * 0.01 + monster.y * 0.1) * 2;
}

function jumpBehavior(monster) {
    // Frogs that jump towards player
    if (!monster.jumpTimer) monster.jumpTimer = 0;
    if (!monster.isJumping) monster.isJumping = false;
    
    monster.jumpTimer++;
    
    if (monster.jumpTimer > 60 && !monster.isJumping) { // Jump every 60 frames
        const dx = gameState.playerX - monster.x;
        const dy = gameState.playerY - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < 200) { // Only jump if player is nearby
            monster.jumpDx = (dx / distance) * monster.speed * 15;
            monster.jumpDy = (dy / distance) * monster.speed * 15;
            monster.isJumping = true;
            monster.jumpTimer = 0;
        }
    }
    
    if (monster.isJumping) {
        monster.x += monster.jumpDx;
        monster.y += monster.jumpDy;
        monster.jumpDx *= 0.9; // Slow down jump
        monster.jumpDy *= 0.9;
        
        if (Math.abs(monster.jumpDx) < 0.5 && Math.abs(monster.jumpDy) < 0.5) {
            monster.isJumping = false;
        }
    }
}

function packBehavior(monster) {
    // Wolves that work together to surround player
    const location = locations[gameState.currentLocation];
    const packMembers = location.monsters.filter(m => m.type === "wolf" && m !== monster);
    
    // Try to position at different angles around player
    const angleStep = (Math.PI * 2) / (packMembers.length + 1);
    const myIndex = packMembers.indexOf(monster) + 1;
    const targetAngle = angleStep * myIndex;
    
    const surroundDistance = 100;
    const targetX = gameState.playerX + Math.cos(targetAngle) * surroundDistance;
    const targetY = gameState.playerY + Math.sin(targetAngle) * surroundDistance;
    
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        monster.x += (dx / distance) * monster.speed;
        monster.y += (dy / distance) * monster.speed;
    }
}

function crazyBehavior(monster) {
    // Monster goes completely nuts - erratic movement but still follows player
    if (!monster.crazyTimer) monster.crazyTimer = 0;
    if (!monster.crazyDirection) monster.crazyDirection = { x: 0, y: 0 };
    
    monster.crazyTimer++;
    
    // Change direction randomly every 20-40 frames
    if (monster.crazyTimer > 20 + Math.random() * 20) {
        // Mix of following player and random movement
        const dx = gameState.playerX - monster.x;
        const dy = gameState.playerY - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // 70% towards player, 30% random chaos
            monster.crazyDirection.x = (dx / distance) * 0.7 + (Math.random() - 0.5) * 2;
            monster.crazyDirection.y = (dy / distance) * 0.7 + (Math.random() - 0.5) * 2;
        }
        
        monster.crazyTimer = 0;
    }
    
    // Move with crazy speed variations
    const speedMultiplier = 0.8 + Math.random() * 0.8; // Speed varies from 0.8x to 1.6x
    monster.x += monster.crazyDirection.x * monster.speed * speedMultiplier;
    monster.y += monster.crazyDirection.y * monster.speed * speedMultiplier;
    
    // Add jerky, twitchy movement
    monster.x += (Math.random() - 0.5) * 8;
    monster.y += (Math.random() - 0.5) * 8;
    
    // Occasionally dash towards player
    if (Math.random() < 0.05) {
        const dx = gameState.playerX - monster.x;
        const dy = gameState.playerY - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            monster.x += (dx / distance) * monster.speed * 3;
            monster.y += (dy / distance) * monster.speed * 3;
        }
    }
}

function streetPatrolBehavior(monster) {
    // Two monsters that patrol the same street/path in coordinated fashion
    if (!monster.patrolPoints) {
        // Define patrol route based on location
        const location = locations[gameState.currentLocation];
        if (location.name === "Neighborhood Park") {
            monster.patrolPoints = [
                { x: 100, y: 400 },
                { x: 300, y: 400 },
                { x: 500, y: 400 },
                { x: 700, y: 400 }
            ];
        } else if (location.name === "Movie Theater") {
            monster.patrolPoints = [
                { x: 150, y: 350 },
                { x: 400, y: 350 },
                { x: 650, y: 350 }
            ];
        } else if (location.name === "Forest Path") {
            monster.patrolPoints = [
                { x: 150, y: 400 },
                { x: 350, y: 300 },
                { x: 550, y: 400 },
                { x: 650, y: 350 }
            ];
        } else if (location.name === "End of the Earth") {
            monster.patrolPoints = [
                { x: 150, y: 200 },
                { x: 400, y: 150 },
                { x: 650, y: 200 },
                { x: 400, y: 250 }
            ];
        } else {
            // Default patrol
            monster.patrolPoints = [
                { x: 100, y: 350 },
                { x: 700, y: 350 }
            ];
        }
        monster.currentPatrolIndex = 0;
    }
    
    // Get current target
    const target = monster.patrolPoints[monster.currentPatrolIndex];
    const dx = target.x - monster.x;
    const dy = target.y - monster.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Move towards current patrol point
    if (distance > 15) {
        monster.x += (dx / distance) * monster.speed;
        monster.y += (dy / distance) * monster.speed;
    } else {
        // Reached patrol point, move to next one
        monster.currentPatrolIndex = (monster.currentPatrolIndex + 1) % monster.patrolPoints.length;
    }
    
    // If player gets too close to the patrol route, chase them briefly
    const playerDistance = Math.sqrt(
        (gameState.playerX - monster.x) ** 2 + (gameState.playerY - monster.y) ** 2
    );
    
    if (playerDistance < 100) {
        // Temporarily chase player
        const playerDx = gameState.playerX - monster.x;
        const playerDy = gameState.playerY - monster.y;
        const playerDist = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
        
        if (playerDist > 0) {
            monster.x += (playerDx / playerDist) * monster.speed * 1.5;
            monster.y += (playerDy / playerDist) * monster.speed * 1.5;
        }
    }
}

function drawGame() {
    const ctx = elements.ctx;
    const location = locations[gameState.currentLocation];
    
    ctx.clearRect(0, 0, 800, 600);
    
    drawBackground(ctx, location);
    
    location.obstacles.forEach(obstacle => {
        drawObstacle(ctx, obstacle);
    });
    
    location.monsters.forEach(monster => {
        drawMonster(ctx, monster);
    });
    
    if (location.nextLocation) {
        drawTransition(ctx, location.nextLocation, "→ Next");
    }
    if (location.previousLocation) {
        drawTransition(ctx, location.previousLocation, "← Back");
    }
    
    drawPlayer(ctx);
    
    if (location.isFinalLocation) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(250, 50, 300, 60);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Reach the center to win!', 400, 75);
        ctx.fillText('Avoid the dragons!', 400, 95);
    }
}

function drawBackground(ctx, location) {
    // Draw sky gradient for outdoor locations
    if (['location-home', 'location-park', 'location-forest', 'location-lake', 'location-garden'].includes(location.bgClass)) {
        drawSky(ctx);
    }
    
    switch (location.bgClass) {
        case 'location-home':
            drawRealisticHome(ctx);
            break;
        case 'location-friend-house':
            drawFriendHouse(ctx);
            break;
        case 'location-player-interior':
            drawPlayerInterior(ctx);
            break;
        case 'location-friend-interior':
            drawFriendInterior(ctx);
            break;
        case 'location-park':
            drawRealisticPark(ctx);
            break;
        case 'location-forest':
            drawRealisticForest(ctx);
            break;
        case 'location-lake':
            drawRealisticLake(ctx);
            break;
        case 'location-theater':
            drawRealisticTheater(ctx);
            break;
        case 'location-garden':
            drawRealisticGarden(ctx);
            break;
        case 'location-end':
            drawRealisticEndLocation(ctx);
            break;
    }
}

// Draw realistic sky with clouds
function drawSky(ctx) {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 300);
    
    // Clouds
    drawCloud(ctx, 150, 80, 60);
    drawCloud(ctx, 400, 60, 70);
    drawCloud(ctx, 650, 90, 55);
}

function drawCloud(ctx, x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.2, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
}

function drawRealisticHome(ctx) {
    // Ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 350, 800, 250);
    
    // House structure
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(50, 300, 150, 120);
    
    // Roof
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(30, 300);
    ctx.lineTo(125, 250);
    ctx.lineTo(220, 300);
    ctx.fill();
    
    // Door
    ctx.fillStyle = '#654321';
    ctx.fillRect(100, 350, 30, 70);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(125, 385, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(70, 320, 25, 25);
    ctx.fillRect(155, 320, 25, 25);
    
    // Window frames
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 320, 25, 25);
    ctx.strokeRect(155, 320, 25, 25);
    
    // Pool
    ctx.fillStyle = '#0080FF';
    ctx.fillRect(300, 400, 120, 80);
    ctx.strokeStyle = '#4682B4';
    ctx.lineWidth = 3;
    ctx.strokeRect(300, 400, 120, 80);
    
    // Pool water effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(310 + i * 20, 410 + i * 5, 15, 3);
    }
    
    // Driveway
    ctx.fillStyle = '#696969';
    ctx.fillRect(0, 420, 50, 30);
    
    // Flowers around house
    drawFlower(ctx, 250, 380, '#FF69B4');
    drawFlower(ctx, 270, 375, '#FF1493');
    drawFlower(ctx, 290, 385, '#FFB6C1');
}

function drawFriendHouse(ctx) {
    // Ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 350, 800, 250);
    
    // Different house structure - taller and blue
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(80, 280, 180, 140);
    
    // Different roof - green
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(60, 280);
    ctx.lineTo(170, 220);
    ctx.lineTo(280, 280);
    ctx.fill();
    
    // Different door - red
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(140, 340, 35, 80);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(160, 380, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Different windows - round
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.arc(110, 320, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(210, 320, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Window frames
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(110, 320, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(210, 320, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Garden with different flowers
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(300, 380, 120, 60);
    
    // Different colored flowers
    drawFlower(ctx, 320, 400, '#FF1493');
    drawFlower(ctx, 340, 395, '#9370DB');
    drawFlower(ctx, 360, 405, '#FF4500');
    drawFlower(ctx, 380, 400, '#00FF00');
    
    // Fence
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(450 + i * 30, 350);
        ctx.lineTo(450 + i * 30, 400);
        ctx.stroke();
    }
}

function drawPlayerInterior(ctx) {
    // Floor
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, 800, 600);
    
    // Walls
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(0, 0, 800, 400);
    
    // Room divisions
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    
    // Living room (left)
    ctx.strokeRect(50, 50, 300, 250);
    
    // Kitchen (top right)
    ctx.strokeRect(400, 50, 300, 150);
    
    // Bedroom (bottom right)
    ctx.strokeRect(400, 250, 300, 200);
    
    // Bathroom (small, top middle)
    ctx.strokeRect(350, 50, 50, 100);
    
    // Living room furniture
    // Table to work on
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(100, 150, 80, 50);
    ctx.fillStyle = '#654321';
    ctx.fillRect(105, 155, 70, 40);
    
    // Chair
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(90, 120, 30, 30);
    ctx.fillRect(90, 100, 30, 20);
    
    // Window
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(280, 80, 60, 80);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(280, 80, 60, 80);
    ctx.beginPath();
    ctx.moveTo(310, 80);
    ctx.lineTo(310, 160);
    ctx.moveTo(280, 120);
    ctx.lineTo(340, 120);
    ctx.stroke();
    
    // Kitchen appliances
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(450, 80, 40, 60); // Refrigerator
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(520, 80, 60, 40); // Stove
    ctx.fillRect(600, 80, 80, 30); // Counter
    
    // Bedroom toys
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(450, 300, 20, 20); // Red toy block
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(480, 310, 15, 15); // Green toy block
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(470, 330, 25, 25); // Blue toy block
    
    // Toy car
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(520, 320, 30, 15);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(530, 335, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(545, 335, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Teddy bear
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(600, 350, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(595, 340, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(605, 340, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Bed
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(580, 280, 100, 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(585, 285, 90, 20);
    
    // Bathroom fixtures
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(360, 70, 20, 30); // Toilet
    ctx.fillRect(365, 120, 30, 15); // Sink
    
    // Exit door
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(375, 520, 50, 80);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(400, 560, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Labels
    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial';
    ctx.fillText('Living Room', 150, 40);
    ctx.fillText('Kitchen', 500, 40);
    ctx.fillText('Bedroom', 500, 240);
    ctx.fillText('Bath', 355, 40);
    ctx.fillText('Exit', 395, 510);
}

function drawFriendInterior(ctx) {
    // Floor - different color
    ctx.fillStyle = '#F0E68C';
    ctx.fillRect(0, 0, 800, 600);
    
    // Walls - pink theme
    ctx.fillStyle = '#FFE4E1';
    ctx.fillRect(0, 0, 800, 400);
    
    // Different room layout
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    
    // Game room (left)
    ctx.strokeRect(50, 50, 250, 300);
    
    // Study room (top right)
    ctx.strokeRect(350, 50, 350, 200);
    
    // Art room (bottom right)
    ctx.strokeRect(350, 300, 350, 150);
    
    // Game room furniture
    // Gaming table
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(80, 200, 100, 60);
    ctx.fillStyle = '#000000';
    ctx.fillRect(90, 210, 80, 40); // Screen
    
    // Bean bag chairs
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(150, 150, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9370DB';
    ctx.beginPath();
    ctx.arc(220, 180, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Board games
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(80, 100, 40, 30);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(130, 95, 35, 25);
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(180, 105, 45, 35);
    
    // Study room
    // Desk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(400, 150, 120, 60);
    
    // Books
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(450, 80, 15, 60);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(470, 80, 15, 60);
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(490, 80, 15, 60);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(510, 80, 15, 60);
    
    // Computer
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(420, 130, 60, 40);
    ctx.fillStyle = '#000000';
    ctx.fillRect(425, 135, 50, 30);
    
    // Art room
    // Easel
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(400, 350);
    ctx.lineTo(420, 420);
    ctx.moveTo(450, 350);
    ctx.lineTo(430, 420);
    ctx.moveTo(410, 380);
    ctx.lineTo(440, 380);
    ctx.stroke();
    
    // Canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(415, 360, 30, 40);
    
    // Art supplies
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(500, 400, 10, 30);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(515, 405, 10, 25);
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(530, 410, 10, 20);
    
    // Paint palette
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.arc(580, 380, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Different toys
    ctx.fillStyle = '#FF1493';
    ctx.fillRect(550, 350, 25, 25); // Pink toy
    ctx.fillStyle = '#00CED1';
    ctx.beginPath();
    ctx.arc(600, 370, 12, 0, Math.PI * 2);
    ctx.fill(); // Turquoise ball
    
    // Exit door
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(375, 520, 50, 80);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(400, 560, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Labels
    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial';
    ctx.fillText('Game Room', 120, 40);
    ctx.fillText('Study Room', 450, 40);
    ctx.fillText('Art Room', 450, 290);
    ctx.fillText('Exit', 395, 510);
}

function drawRealisticPark(ctx) {
    // Ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 300, 800, 300);
    
    // Walking path
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 380, 800, 40);
    
    // Path lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.lineTo(800, 400);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Multiple realistic trees
    drawRealisticTree(ctx, 100, 350, 40);
    drawRealisticTree(ctx, 300, 320, 50);
    drawRealisticTree(ctx, 500, 340, 45);
    drawRealisticTree(ctx, 700, 330, 35);
    
    // Playground equipment
    drawSwingSet(ctx, 600, 450);
    
    // Scattered flowers
    for (let i = 0; i < 20; i++) {
        drawFlower(ctx, Math.random() * 800, 450 + Math.random() * 100, 
                  ['#FF69B4', '#FFFF00', '#FF4500', '#9370DB'][Math.floor(Math.random() * 4)]);
    }
}

function drawRealisticForest(ctx) {
    // Ground with fallen leaves
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 350, 800, 250);
    
    // Scattered leaves
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = ['#FF8C00', '#FFD700', '#CD853F', '#A0522D'][Math.floor(Math.random() * 4)];
        ctx.beginPath();
        ctx.arc(Math.random() * 800, 400 + Math.random() * 150, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Dense forest trees
    drawRealisticTree(ctx, 80, 380, 60);
    drawRealisticTree(ctx, 200, 360, 70);
    drawRealisticTree(ctx, 350, 370, 55);
    drawRealisticTree(ctx, 500, 350, 65);
    drawRealisticTree(ctx, 650, 375, 50);
    drawRealisticTree(ctx, 750, 365, 45);
    
    // Bushes
    for (let i = 0; i < 8; i++) {
        drawBush(ctx, 120 + i * 80, 480);
    }
    
    // Forest path
    ctx.fillStyle = '#654321';
    ctx.fillRect(350, 350, 100, 250);
}

function drawRealisticLake(ctx) {
    // Ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 400, 800, 200);
    
    // Lake water with gradient
    ctx.fillStyle = '#0080FF';
    ctx.fillRect(200, 350, 400, 200);
    
    // Water depth gradient
    const waterGradient = ctx.createRadialGradient(400, 450, 50, 400, 450, 200);
    waterGradient.addColorStop(0, '#87CEEB');
    waterGradient.addColorStop(1, '#0000FF');
    ctx.fillStyle = waterGradient;
    ctx.fillRect(200, 350, 400, 200);
    
    // Water ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(250 + i * 40, 400 + i * 15, 20 + i * 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Reeds around lake
    for (let i = 0; i < 10; i++) {
        drawReed(ctx, 180 + Math.random() * 20, 380 + Math.random() * 40);
        drawReed(ctx, 600 + Math.random() * 20, 380 + Math.random() * 40);
    }
    
    // Trees around lake
    drawRealisticTree(ctx, 50, 420, 45);
    drawRealisticTree(ctx, 650, 410, 50);
    
    // Dock
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(580, 450, 80, 15);
    ctx.fillRect(620, 440, 8, 40);
}

function drawRealisticTheater(ctx) {
    // Theater floor
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(0, 0, 800, 600);
    
    // Stage
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(250, 50, 300, 150);
    
    // Stage curtains
    ctx.fillStyle = '#800020';
    ctx.fillRect(240, 50, 20, 150);
    ctx.fillRect(540, 50, 20, 150);
    
    // Screen
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(270, 70, 260, 110);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(270, 70, 260, 110);
    
    // Movie title on screen
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NOW SHOWING', 400, 110);
    ctx.font = '16px Arial';
    ctx.fillText('NaturalWorld Adventure', 400, 140);
    
    // Theater seats (multiple rows)
    for (let row = 0; row < 6; row++) {
        for (let seat = 0; seat < 10; seat++) {
            drawTheaterSeat(ctx, 80 + seat * 64, 250 + row * 50);
        }
    }
    
    // Aisle lighting
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(50, 275 + i * 50, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(750, 275 + i * 50, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawRealisticGarden(ctx) {
    // Garden ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 300, 800, 300);
    
    // Garden beds
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(50, 350, 200, 100);
    ctx.fillRect(300, 400, 150, 80);
    ctx.fillRect(500, 320, 180, 120);
    
    // Organized flower beds
    // Bed 1
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            drawFlower(ctx, 70 + i * 30, 370 + j * 25, '#FF69B4');
        }
    }
    
    // Bed 2
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
            drawFlower(ctx, 320 + i * 30, 420 + j * 25, '#FFFF00');
        }
    }
    
    // Bed 3
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            drawFlower(ctx, 520 + i * 30, 340 + j * 25, '#FF4500');
        }
    }
    
    // Garden paths
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 450, 800, 30);
    ctx.fillRect(250, 300, 30, 300);
    
    // Fountain
    ctx.fillStyle = '#708090';
    ctx.beginPath();
    ctx.arc(400, 500, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Water in fountain
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.arc(400, 500, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Garden tools
    drawGardenTools(ctx, 720, 480);
}

function drawRealisticEndLocation(ctx) {
    // Mystical background
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FF69B4');
    gradient.addColorStop(1, '#9370DB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // Floating platforms
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(150, 450, 100, 20);
    ctx.fillRect(350, 350, 100, 20);
    ctx.fillRect(550, 480, 100, 20);
    
    // Victory pedestal
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(375, 275, 50, 50);
    
    // Gems around pedestal
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(350, 300, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(450, 300, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#0000FF';
    ctx.beginPath();
    ctx.arc(400, 260, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Victory trophy
    ctx.fillStyle = '#FFD700';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', 400, 305);
    
    // Sparkles
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(Math.random() * 800, Math.random() * 600, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Helper functions for realistic elements
function drawRealisticTree(ctx, x, y, size) {
    // Tree trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - size * 0.1, y, size * 0.2, size * 0.6);
    
    // Tree crown
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Tree texture
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y - size * 0.05, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.15, y - size * 0.15, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawFlower(ctx, x, y, color) {
    // Stem
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x - 1, y, 2, 15);
    
    // Petals
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x + Math.cos(i * Math.PI * 2 / 5) * 6, 
                y + Math.sin(i * Math.PI * 2 / 5) * 6, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Center
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawBush(ctx, x, y) {
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 15, y + 5, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 12, y + 8, 18, 0, Math.PI * 2);
    ctx.fill();
}

function drawReed(ctx, x, y) {
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 30);
    ctx.lineTo(x + 2, y);
    ctx.stroke();
    
    // Reed top
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y - 5, 4, 8);
}

function drawTheaterSeat(ctx, x, y) {
    // Seat base
    ctx.fillStyle = '#800020';
    ctx.fillRect(x, y + 15, 50, 25);
    
    // Seat back
    ctx.fillRect(x + 5, y, 40, 20);
    
    // Seat details
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y + 15, 50, 25);
    ctx.strokeRect(x + 5, y, 40, 20);
}

function drawSwingSet(ctx, x, y) {
    // Swing posts
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y - 50);
    ctx.lineTo(x, y);
    ctx.moveTo(x + 60, y - 50);
    ctx.lineTo(x + 60, y);
    ctx.stroke();
    
    // Top bar
    ctx.beginPath();
    ctx.moveTo(x, y - 50);
    ctx.lineTo(x + 60, y - 50);
    ctx.stroke();
    
    // Swing
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 20, y - 50);
    ctx.lineTo(x + 20, y - 20);
    ctx.moveTo(x + 30, y - 50);
    ctx.lineTo(x + 30, y - 20);
    ctx.stroke();
    
    // Swing seat
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 15, y - 25, 20, 5);
}

function drawGardenTools(ctx, x, y) {
    // Shovel
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 30);
    ctx.stroke();
    
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x - 5, y - 35, 10, 8);
    
    // Rake
    ctx.beginPath();
    ctx.moveTo(x + 15, y);
    ctx.lineTo(x + 15, y - 30);
    ctx.stroke();
    
    ctx.fillRect(x + 10, y - 35, 10, 3);
}

function drawObstacle(ctx, obstacle) {
    const colors = {
        tree: '#228B22',
        bench: '#8B4513',
        flower: '#FF69B4',
        counter: '#654321',
        water: '#4682B4'
    };
    
    ctx.fillStyle = colors[obstacle.type] || '#808080';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    if (obstacle.type === 'tree') {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(obstacle.x + obstacle.width/2 - 5, obstacle.y + obstacle.height - 20, 10, 20);
    }
}

function drawMonster(ctx, monster) {
    const colors = {
        squirrel: '#8B4513',
        ghost: '#F0F8FF',
        bee: '#FFD700',
        wolf: '#696969',
        bear: '#8B4513',
        fish: '#4682B4',
        frog: '#228B22',
        dragon: '#FF0000'
    };
    
    ctx.fillStyle = colors[monster.type] || '#FF0000';
    ctx.fillRect(monster.x, monster.y, monster.width, monster.height);
    
    ctx.fillStyle = 'white';
    ctx.fillRect(monster.x + 5, monster.y + 5, 5, 5);
}

function drawTransition(ctx, transition, text) {
    // Make transition more prominent and clickable
    ctx.fillStyle = 'rgba(0, 123, 255, 0.9)';
    ctx.fillRect(transition.x - 35, transition.y - 20, 70, 40);
    
    // Add border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(transition.x - 35, transition.y - 20, 70, 40);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, transition.x, transition.y + 5);
    
    // Add "CLICK" instruction
    ctx.font = '10px Arial';
    ctx.fillText('CLICK', transition.x, transition.y + 18);
}

function drawPlayer(ctx) {
    // Blinking effect when invincible
    if (gameState.invincible && Math.floor(gameState.invincibilityTimer / 10) % 2 === 0) {
        // Player is transparent/blinking during invincibility
        ctx.globalAlpha = 0.5;
    }
    
    // Draw red hero box
    ctx.fillStyle = '#e74c3c'; // Main red color
    ctx.fillRect(gameState.playerX, gameState.playerY, 25, 25);
    
    // Add border for better visibility
    ctx.strokeStyle = '#c0392b'; // Darker red border
    ctx.lineWidth = 2;
    ctx.strokeRect(gameState.playerX, gameState.playerY, 25, 25);
    
    // Add simple face/details
    ctx.fillStyle = 'white';
    ctx.fillRect(gameState.playerX + 5, gameState.playerY + 5, 3, 3); // Left eye
    ctx.fillRect(gameState.playerX + 17, gameState.playerY + 5, 3, 3); // Right eye
    ctx.fillRect(gameState.playerX + 8, gameState.playerY + 15, 9, 2); // Mouth
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
}

function gameLoop() {
    if (!gameState.gameRunning) return;
    
    // Update invincibility timer
    if (gameState.invincible) {
        gameState.invincibilityTimer--;
        if (gameState.invincibilityTimer <= 0) {
            gameState.invincible = false;
        }
    }
    
    handlePlayerMovement();
    updateMonsters();
    
    // Check for chase situations and play scary music if needed
    audioSystem.checkForChase();
    
    drawGame();
    
    requestAnimationFrame(gameLoop);
}

updateHearts();
updateLocation(); 