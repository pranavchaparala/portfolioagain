/**
 * REVISED PLAYGROUND LOGIC - Integrated for New Website
 */

// --- Global State ---
let grid, gridWrapper, infoOverlay, viewport;

const totalCards = 104; 
let isDragging = false;
let isFocused = false;
let isResetting = false;
let isGridReady = false; 
let isClickable = false; 

let pendingZoomArgs = null;
let targetX = 0, targetY = 0; 
let currentX = 0, currentY = 0; 
let lastMouseX = 0, lastMouseY = 0;
let clickStartX = 0, clickStartY = 0;
let velocityX = 0, velocityY = 0;

const lerpAmount = 0.08;
const friction = 0.95;
const dragThreshold = 5;

function initGrid() {
    grid = document.getElementById('grid');
    gridWrapper = document.getElementById('grid-wrapper');
    infoOverlay = document.getElementById('info-overlay');
    viewport = document.getElementById('viewport');

    if (!grid || !gridWrapper || !viewport) return;

    // Hard reset state on load
    isDragging = false;
    isFocused = false;
    isResetting = false;
    isGridReady = false; 
    isClickable = false; 
    targetX = 0; targetY = 0;
    currentX = 0; currentY = 0;
    velocityX = 0; velocityY = 0;

    let dataPool = [];
    while (dataPool.length < totalCards) {
        dataPool = dataPool.concat(playgroundData);
    }
    dataPool = dataPool.slice(0, totalCards);

    // Shuffle
    for (let i = dataPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dataPool[i], dataPool[j]] = [dataPool[j], dataPool[i]];
    }

    grid.innerHTML = ''; 

    for (let i = 0; i < totalCards; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.pointerEvents = 'none'; 

        const data = dataPool[i];
        const title = data.title;
        const description = data.description;
        const filename = data.filename;

        // Path to your playgroundassets folder
        const assetPath = `../playgroundassets/${filename}`;

        // Check if asset is video or image
        if (filename.toLowerCase().endsWith('.mp4')) {
            const vid = document.createElement('video');
            vid.src = assetPath;
            vid.autoplay = true;
            vid.loop = true;
            vid.muted = true;
            vid.playsInline = true;
            vid.className = 'card-img'; // Keeping class name same for CSS consistency
            card.appendChild(vid);
        } else {
            const img = document.createElement('img');
            img.src = assetPath;
            img.className = 'card-img';
            img.draggable = false;
            img.onerror = function () { this.src = `https://picsum.photos/seed/${i + 100}/500/600`; };
            card.appendChild(img);
        }

        card.onmousedown = (e) => {
            if (!isClickable) return;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            clickStartX = e.clientX;
            clickStartY = e.clientY;
        };

        card.onmouseup = (e) => {
            if (!isClickable) return; 

            const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
            if (dist < dragThreshold && !isResetting && !isFocused) {
                // If your data has separate high-res video, it passes here
                handleCardClick(card, title, description, data.videoFilename);
            }
        };

        grid.appendChild(card);
    }

    setupDragListeners();

    // --- SEQUENTIAL UNLOCK SEQUENCE ---
    setTimeout(() => { if (grid) grid.classList.add('grid-spaced'); }, 1000);
    setTimeout(() => { isGridReady = true; }, 1800);
    setTimeout(() => { 
        isClickable = true; 
        document.querySelectorAll('.card').forEach(c => {
            c.style.pointerEvents = 'auto'; 
            c.style.cursor = 'pointer';
        });
    }, 2500);

    if (!window.physicsLoopRunning) {
        window.physicsLoopRunning = true;
        requestAnimationFrame(updatePhysics);
    }
}

function updatePhysics() {
    if (!gridWrapper) {
        window.physicsLoopRunning = false;
        return;
    }

    if (!isFocused && !isResetting && isGridReady) {
        if (!isDragging) {
            if (pendingZoomArgs) {
                velocityX *= 0.6;
                velocityY *= 0.6;
                if (Math.hypot(velocityX, velocityY) < 0.5) {
                    velocityX = 0; velocityY = 0;
                    executeZoom(pendingZoomArgs);
                    pendingZoomArgs = null;
                }
            } else {
                velocityX *= friction;
                velocityY *= friction;
            }
            targetX += velocityX;
            targetY += velocityY;
        }

        const gridRect = grid.getBoundingClientRect();
        const vW = window.innerWidth;
        const vH = window.innerHeight;

        const limitX = Math.max(0, (gridRect.width - vW) / 2);
        const limitY = Math.max(0, (gridRect.height - vH) / 2);

        targetX = Math.max(-limitX, Math.min(limitX, targetX));
        targetY = Math.max(-limitY, Math.min(limitY, targetY));

        currentX += (targetX - currentX) * lerpAmount;
        currentY += (targetY - currentY) * lerpAmount;

        gridWrapper.style.transform = `translate3d(${currentX}px, ${currentY}px, 0px) scale(1)`;
    }
    requestAnimationFrame(updatePhysics);
}

function setupDragListeners() {
    if (!viewport) return;

    viewport.onmousedown = (e) => {
        if (isFocused || isResetting || !isGridReady) return; 
        if (pendingZoomArgs) pendingZoomArgs = null;
        isDragging = true;
        velocityX = 0; velocityY = 0;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    };

    window.onmousemove = (e) => {
        if (!isDragging || isFocused || isResetting || !isGridReady) return;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        targetX += dx; targetY += dy;
        velocityX = dx; velocityY = dy;
        lastMouseX = e.clientX; lastMouseY = e.clientY;
    };

    window.onmouseup = () => { isDragging = false; };
}

function handleCardClick(clickedCard, title, description, videoFilename) {
    if (Math.hypot(velocityX, velocityY) > 1.0) {
        pendingZoomArgs = { clickedCard, title, description, videoFilename };
        return;
    }
    executeZoom({ clickedCard, title, description, videoFilename });
}

function executeZoom({ clickedCard, title, description, videoFilename }) {
    isFocused = true;
    viewport.classList.add('is-focused-mode');
    gridWrapper.classList.add('is-focused');
    gridWrapper.classList.remove('is-resetting');

    document.querySelectorAll('.card').forEach(c => c.classList.remove('active-card'));
    clickedCard.classList.add('active-card');

    const wrapperRect = gridWrapper.getBoundingClientRect();
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    const cardRect = clickedCard.getBoundingClientRect();
    
    const relX = (cardRect.left + cardRect.width / 2) - wrapperRect.left;
    const relY = (cardRect.top + cardRect.height / 2) - wrapperRect.top;

    const scale = 2.8;
    const initialOriginX = wrapperRect.left - currentX;
    const initialOriginY = wrapperRect.top - currentY;

    const zoomTargetX = screenCenterX - initialOriginX - (relX * scale);
    const zoomTargetY = screenCenterY - initialOriginY - (relY * scale);

    gridWrapper.style.transform = `translate3d(${zoomTargetX}px, ${zoomTargetY}px, 0px) scale(${scale})`;

    // New Site ID logic
    if (infoOverlay) infoOverlay.classList.add('active'); 
    document.getElementById('focus-title').innerText = title;
    document.getElementById('focus-subtitle').innerText = description;

    // Optional: Unmute if it's already a video or add the high-res videoFilename overlay
    if (videoFilename) {
        const vid = document.createElement('video');
        vid.src = `../playgroundassets/${videoFilename}`;
        vid.autoplay = true; vid.muted = false; vid.loop = true; vid.playsInline = true;
        vid.className = 'card-video';
        vid.style.position = 'absolute'; vid.style.top = '0'; vid.style.left = '0';
        vid.style.width = '100%'; vid.style.height = '100%'; vid.style.objectFit = 'cover';
        vid.style.opacity = '0'; vid.style.transition = 'opacity 0.5s ease 0.5s'; vid.style.pointerEvents = 'none';

        clickedCard.appendChild(vid);
        vid.play().catch(() => { vid.muted = true; vid.play(); });
        setTimeout(() => { vid.style.opacity = '1'; }, 100);
    }
}

function resetView() {
    if (!isFocused) return;
    isFocused = false;
    isResetting = true;

    viewport.classList.remove('is-focused-mode');
    gridWrapper.classList.remove('is-focused');
    gridWrapper.classList.add('is-resetting');

    if (infoOverlay) infoOverlay.classList.remove('active');

    targetX = 0; targetY = 0;
    currentX = 0; currentY = 0;
    velocityX = 0; velocityY = 0;

    gridWrapper.style.transform = `translate3d(0px, 0px, 0px) scale(1)`;

    const activeCards = document.querySelectorAll('.card.active-card');
    activeCards.forEach(card => {
        // Remove high-res overlays but keep the base grid media
        const vids = card.querySelectorAll('.card-video');
        vids.forEach(v => {
            v.style.opacity = '0';
            setTimeout(() => v.remove(), 600);
        });
        card.classList.remove('active-card');
    });

    setTimeout(() => {
        isResetting = false;
        if (gridWrapper) gridWrapper.classList.remove('is-resetting');
    }, 1800);
}

// Global Click-to-reset
window.onmousedown = (e) => {
    if (!isFocused || isResetting) return;
    if (!e.target.closest('.active-card') && !e.target.closest('.info-overlay')) resetView();
};

window.addEventListener('load', () => { if (document.getElementById('grid')) initGrid(); });