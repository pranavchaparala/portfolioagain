/**
 * STABILIZED PLAYGROUND LOGIC
 * Fixed: Navbar stability, Info Overlay visibility, and State Syncing
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

    // Reset internal state
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

    // Shuffle cards
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

        // Store data on element for touch tap handler
        card._title = title;
        card._description = description;
        card._videoFilename = data.videoFilename;

        // Correct path for root-level assets
        const assetPath = `playgroundassets/${filename}`;

        if (filename.toLowerCase().endsWith('.mp4')) {
            const vid = document.createElement('video');
            vid.src = assetPath;
            vid.autoplay = true; vid.loop = true; vid.muted = true; vid.playsInline = true;
            vid.className = 'card-img';
            card.appendChild(vid);
        } else {
            const img = document.createElement('img');
            img.src = assetPath;
            img.className = 'card-img';
            img.draggable = false;
            img.onerror = function () { this.src = `https://picsum.photos/seed/${i + 100}/500/600`; };
            card.appendChild(img);
        }

        // Click Handling logic
        card.onmousedown = (e) => {
            if (!isClickable) return;
            lastMouseX = e.clientX; lastMouseY = e.clientY;
            clickStartX = e.clientX; clickStartY = e.clientY;
        };

        card.onmouseup = (e) => {
            if (!isClickable) return;
            const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
            if (dist < dragThreshold && !isResetting && !isFocused) {
                handleCardClick(card, title, description, data.videoFilename);
            }
        };

        grid.appendChild(card);
    }

    setupDragListeners();

    // Sequence for entry animation
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
                velocityX *= 0.6; velocityY *= 0.6;
                if (Math.hypot(velocityX, velocityY) < 0.5) {
                    velocityX = 0; velocityY = 0;
                    executeZoom(pendingZoomArgs);
                    pendingZoomArgs = null;
                }
            } else {
                velocityX *= friction; velocityY *= friction;
            }
            targetX += velocityX; targetY += velocityY;
        }

        const gridRect = grid.getBoundingClientRect();
        const limitX = Math.max(0, (gridRect.width - window.innerWidth) / 2);
        const limitY = Math.max(0, (gridRect.height - window.innerHeight) / 2);

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

    // --- Mouse ---
    viewport.onmousedown = (e) => {
        if (isFocused || isResetting || !isGridReady) return;
        isDragging = true;
        velocityX = 0; velocityY = 0;
        lastMouseX = e.clientX; lastMouseY = e.clientY;
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

    // --- Touch ---
    viewport.addEventListener('touchstart', (e) => {
        if (isFocused || isResetting || !isGridReady) return;
        isDragging = true;
        velocityX = 0; velocityY = 0;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        clickStartX = e.touches[0].clientX;
        clickStartY = e.touches[0].clientY;
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
        if (!isDragging || isFocused || isResetting || !isGridReady) return;
        const dx = e.touches[0].clientX - lastMouseX;
        const dy = e.touches[0].clientY - lastMouseY;
        targetX += dx; targetY += dy;
        velocityX = dx; velocityY = dy;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
        isDragging = false;
        // Treat a short tap as a card click
        const touch = e.changedTouches[0];
        const dist = Math.hypot(touch.clientX - clickStartX, touch.clientY - clickStartY);
        if (dist < dragThreshold && !isResetting && !isFocused && isClickable) {
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const card = target && target.closest('.card');
            if (card) {
                const title = card._title;
                const description = card._description;
                const videoFilename = card._videoFilename;
                if (title) handleCardClick(card, title, description, videoFilename);
            }
        }
    });
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

    document.body.classList.add('project-focused');
    viewport.classList.add('is-focused-mode');
    gridWrapper.classList.add('is-focused');

    document.querySelectorAll('.card').forEach(c => c.classList.remove('active-card'));
    clickedCard.classList.add('active-card');

    const wrapperRect = gridWrapper.getBoundingClientRect();
    const cardRect = clickedCard.getBoundingClientRect();
    const relX = (cardRect.left + cardRect.width / 2) - wrapperRect.left;
    const relY = (cardRect.top + cardRect.height / 2) - wrapperRect.top;

    const scale = 2.8;
    const zoomTargetX = (window.innerWidth / 2) - (wrapperRect.left - currentX) - (relX * scale);
    const zoomTargetY = (window.innerHeight / 2) - (wrapperRect.top - currentY) - (relY * scale);

    gridWrapper.style.transform = `translate3d(${zoomTargetX}px, ${zoomTargetY}px, 0px) scale(${scale})`;

    if (infoOverlay) {
        infoOverlay.classList.add('active');
        document.getElementById('focus-title').innerText = title;
        document.getElementById('focus-subtitle').innerText = description;
    }

    if (videoFilename) {
        const vid = document.createElement('video');
        // FIXED: Removed ../ for proper GitHub Pages pathing
        vid.src = `playgroundassets/${videoFilename}`;
        vid.autoplay = true; vid.muted = false; vid.loop = true; vid.playsInline = true;
        vid.className = 'card-video';
        vid.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.5s ease 0.5s;pointer-events:none;";
        clickedCard.appendChild(vid);
        vid.play().catch(() => { vid.muted = true; vid.play(); });
        setTimeout(() => { vid.style.opacity = '1'; }, 100);
    }
}

function resetView() {
    if (!isFocused) return;
    isFocused = false;
    isResetting = true;

    document.body.classList.remove('project-focused');
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
        const vids = card.querySelectorAll('.card-video');
        vids.forEach(v => {
            v.style.opacity = '0';
            setTimeout(() => v.remove(), 600);
        });
        card.classList.remove('active-card');
    });

    setTimeout(() => {
        isResetting = false;
        gridWrapper.classList.remove('is-resetting');
    }, 1200);
}

window.addEventListener('mousedown', (e) => {
    if (!isFocused || isResetting) return;
    if (!e.target.closest('.active-card') && !e.target.closest('#info-overlay')) {
        resetView();
    }
});

window.addEventListener('load', () => {
    if (document.getElementById('grid')) initGrid();
});