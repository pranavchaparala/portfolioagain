// components.js

const worksData = [
    { title: "Echoes of Presence", img: "echoesofpresence.png", link: "projects/echoes-of-presence/index.html" },
    { title: "ClanX", img: "clanx.png", link: "projects/clanx/index.html" },
    { title: "Lectrix EV", img: "lectrix.png", link: "projects/lectrix/index.html" },
    { title: "Nosie: Luna Ring", img: "lunaring.png", link: "projects/lunaring/index.html" },
    { title: "Noise: View Buds", img: "echoesofpresence.png", link: "projects/viewbuds/index.html" },
    { title: "OxygenOS 12", img: "lectrix.png", link: "projects/oxygen/index.html" },
    { title: "Gudz Logistics", img: "echoesofpresence.png", link: "projects/gudz/index.html" },
    { title: "Bezapp", img: "clanx.png", link: "projects/bezapp/index.html" },
    { title: "Inka", img: "lectrix.png", link: "projects/inka/index.html" },
    { title: "SĀR Rise Collection", img: "lunaring.png", link: "projects/sar/index.html" }
];

const getBasePath = () => {
    return window.location.pathname.includes('/projects/') ? '../../' : './';
};

const basePath = getBasePath();

function injectNavigation() {
    const isIndex = window.location.pathname.endsWith('index.html') && !window.location.pathname.includes('/projects/');
    const isWork = window.location.pathname.endsWith('work.html');
    const isPlay = window.location.pathname.endsWith('play.html');
    const isResearch = window.location.pathname.endsWith('research.html');
    const isAbout = window.location.pathname.endsWith('about.html');
    const isContact = window.location.pathname.endsWith('contact.html');
    const isProject = window.location.pathname.includes('/projects/');

    if (isProject) return;

    const brandClass = isIndex ? 'active-link' : 'brand';

    const navHTML = `
        <nav class="main-nav">
            <div class="nav-links">
                <a href="${basePath}index.html" class="${brandClass}">Pranav Chaparala</a>
                <a href="${basePath}work.html" class="${isWork ? 'active-link' : ''}">Work</a>
                <a href="${basePath}play.html" class="${isPlay ? 'active-link' : ''}">Play</a>
                <a href="${basePath}research.html" class="${isResearch ? 'active-link' : ''}">Research</a>
                <a href="${basePath}about.html" class="${isAbout ? 'active-link' : ''}">About</a>
                <a href="${basePath}contact.html" class="${isContact ? 'active-link' : ''}">Contact</a>
            </div>
        </nav>
    `;
    document.body.insertAdjacentHTML('beforeend', navHTML);
}

function setupTransitions() {
    // Add loading bar container
    const loadingBarHTML = `
        <div class="loading-bar-container">
            <div class="loading-bar-fill" id="loading-bar-fill"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', loadingBarHTML);

    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);

    window.addEventListener('load', () => {
        document.body.classList.add('page-loaded');
        const fill = document.getElementById('loading-bar-fill');
        if (fill) fill.style.width = '100%';
        setTimeout(() => {
            const container = document.querySelector('.loading-bar-container');
            if (container) container.style.opacity = '0';
        }, 500);
    });

    if (document.readyState === 'complete') {
        document.body.classList.add('page-loaded');
    }

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        const href = link ? link.getAttribute('href') : null;

        if (link && href && !href.startsWith('#') && link.target !== '_blank') {
            e.preventDefault();
            const targetUrl = link.href;

            document.body.classList.remove('page-loaded');
            document.body.classList.add('page-leaving');

            setTimeout(() => {
                window.location.href = targetUrl;
            }, 600);
        }
    });
}

function initWorksTrack() {
    const track = document.getElementById('track');
    if (!track) return;

    track.innerHTML = '';

    worksData.forEach(work => {
        const link = document.createElement('a');
        link.href = basePath + work.link;
        link.style.display = 'contents';

        const img = document.createElement('img');
        img.src = basePath + 'covers/' + work.img;
        img.className = 'project-img';

        link.appendChild(img);
        track.appendChild(link);
    });

    const imgs = Array.from(track.children);
    imgs.forEach(img => track.appendChild(img.cloneNode(true)));
    imgs.forEach(img => track.appendChild(img.cloneNode(true)));

    let scrollX = 0;
    let velocity = 0;
    const centerX = window.innerWidth / 2;

    // Mouse scroll
    window.addEventListener('wheel', (e) => {
        velocity += e.deltaY * 0.15;
    });

    // Touch drag for gallery
    let touchStartX = 0;
    let lastTouchX = 0;
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        lastTouchX = touchStartX;
        velocity = 0;
    }, { passive: true });
    track.addEventListener('touchmove', (e) => {
        const dx = lastTouchX - e.touches[0].clientX;
        velocity = dx * 0.5;
        lastTouchX = e.touches[0].clientX;
    }, { passive: true });

    function animate() {
        scrollX -= velocity;
        velocity *= 0.9;

        const limit = track.scrollWidth / 3;
        if (scrollX <= -limit) scrollX = 0;
        if (scrollX > 0) scrollX = -limit;

        track.style.transform = `translateX(${scrollX}px)`;

        const currentImgs = track.querySelectorAll('img');
        currentImgs.forEach(img => {
            const rect = img.getBoundingClientRect();
            const imgCenter = rect.left + rect.width / 2;

            const distance = (imgCenter - centerX) / centerX;
            const absDistance = Math.abs(distance);
            const scale = 1 + (0.1 * (1 - Math.min(absDistance, 1)));
            const parallax = distance * 30;

            img.style.transform = `scale(${scale}) translateX(${parallax}px)`;
        });

        requestAnimationFrame(animate);
    }
    animate();
}

function initWorksList() {
    const listContainer = document.querySelector('#work-list ul');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const hoverContainer = document.getElementById('hover-image-container');
    const hoverImg = document.getElementById('hover-preview');
    const hoverBg = document.getElementById('hover-bg-blur');

    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    worksData.forEach(work => {
        const li = document.createElement('li');
        li.setAttribute('data-img', work.img);

        const a = document.createElement('a');
        a.href = basePath + work.link;
        a.textContent = work.title;

        li.appendChild(a);
        listContainer.appendChild(li);

        if (!isTouch) {
            a.addEventListener('mouseenter', () => {
                const imgName = li.getAttribute('data-img');
                if (imgName && hoverImg && hoverBg && hoverContainer) {
                    const fullPath = basePath + 'covers/' + imgName;
                    hoverImg.src = fullPath;
                    hoverBg.src = fullPath;
                    hoverContainer.classList.add('active');
                }
            });

            a.addEventListener('mouseleave', () => {
                if (hoverContainer) {
                    hoverContainer.classList.remove('active');
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    injectNavigation();
    setupTransitions();
    initWorksTrack();
    initWorksList();
});
