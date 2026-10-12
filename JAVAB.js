// Variables globales
let isPlaying = false;
let currentSlide = 0;
let totalSlides = 0;
let enableMusic = false;

// Música de fondo (archivo local musica.mp3)
const bgMusic = new Audio('musica.mp3');
bgMusic.loop = true;
bgMusic.preload = 'auto';
bgMusic.volume = 0.85;
bgMusic.addEventListener('play', () => { isPlaying = true; updateMusicIcon(); });
bgMusic.addEventListener('pause', () => { isPlaying = false; updateMusicIcon(); });

function showMusicButton() {
    const musicPlayer = document.getElementById('musicPlayer');
    if (musicPlayer) musicPlayer.style.display = 'block';
}

function playMusic() {
    showMusicButton();
    const p = bgMusic.play();
    if (p && typeof p.catch === 'function') {
        p.catch(() => { isPlaying = false; updateMusicIcon(); });
    }
}

function closeWelcome() {
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.style.display = 'none';
}

// Botones del modal de bienvenida (se llaman directo desde el click,
// así iOS/Safari permite que suene la música)
function enterWithMusicClick() {
    enableMusic = true;
    closeWelcome();
    playMusic();
}

function enterWithoutMusicClick() {
    enableMusic = false;
    closeWelcome();
    showMusicButton();
}

function toggleMusic() {
    if (bgMusic.paused) {
        playMusic();
    } else {
        bgMusic.pause();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCountdown();
    initializeCarousel();

    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) musicToggle.addEventListener('click', toggleMusic);

    // Mostrar el modal de bienvenida para elegir con/sin música
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.style.display = 'flex';
    updateMusicIcon();
});

function updateMusicIcon() {
    const volumeIcon = document.getElementById('volumeIcon');
    if (!volumeIcon) return;
    if (isPlaying) {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#FFFFFF"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"></path>
        `;
    } else {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#FFFFFF"></polygon>
            <line x1="22" y1="9" x2="16" y2="15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"></line>
            <line x1="16" y1="9" x2="22" y2="15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"></line>
        `;
    }
}

// Countdown
function initializeCountdown() {
    const targetDate = new Date('2027-01-30T17:00:00-04:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;
        
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        } else {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Carrusel
function initializeCarousel() {
    const track = document.getElementById('carouselTrack');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (!track) return;

    // calcular total dinámicamente
    const items = track.querySelectorAll('.carousel-item');
    totalSlides = items.length;
    const totalSlidesElement = document.getElementById('totalSlides');
    if (totalSlidesElement) totalSlidesElement.textContent = totalSlides;

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        });
    }

    // Ajuste inicial para asegurar cálculo correcto tras el render
    updateCarousel();
    requestAnimationFrame(updateCarousel);
    setTimeout(updateCarousel, 200);

    // Auto-play del carrusel
    setInterval(() => {
        nextSlide();
    }, 2500);
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    if (track) {
        const items = track.querySelectorAll('.carousel-item');
        if (!items.length) return;
        const container = track.parentElement;

        // Temporarily reset transform to measure actual positions
        const previousTransform = track.style.transform;
        track.style.transform = 'none';

        const firstRect = items[0].getBoundingClientRect();
        const secondRect = items[1] ? items[1].getBoundingClientRect() : null;
        const stepWidth = Math.max(1, secondRect ? Math.round(secondRect.left - firstRect.left) : Math.round(firstRect.width));

        const containerWidth = Math.round(container.getBoundingClientRect().width);
        const visibleCount = Math.max(1, Math.floor((containerWidth + 1) / stepWidth));
        const maxIndex = Math.max(0, totalSlides - visibleCount);

        // Detecta si hay que dar la vuelta (de la última foto a la 1, o viceversa)
        let wrapped = false;
        if (currentSlide > maxIndex) { currentSlide = 0; wrapped = true; }
        if (currentSlide < 0) { currentSlide = maxIndex; wrapped = true; }

        const trackRect = track.getBoundingClientRect();
        const baseLeft = Math.round(firstRect.left - trackRect.left);
        const translateXpx = -Math.round(baseLeft + (currentSlide * stepWidth));

        if (wrapped) {
            // Al dar la vuelta, salta directo a la foto 1 sin animar el regreso
            // (evita el efecto de "devolverse" deslizando hacia atrás por todas las fotos)
            const prevTransition = track.style.transition;
            track.style.transition = 'none';
            track.style.transform = `translateX(${translateXpx}px)`;
            void track.offsetWidth; // fuerza reflow para aplicar el salto sin animación
            track.style.transition = prevTransition || '';
        } else {
            // Apply transform
            track.style.transform = `translateX(${translateXpx}px)`;
        }
        // console.log('Carousel moved to slide:', { currentSlide, visibleCount, maxIndex, translateXpx, stepWidth, baseLeft });
    }
    updateSlideCounter();
    markCenterCarouselItem();
}

function nextSlide() {
    currentSlide++;
    updateCarousel();
}

function previousSlide() {
    currentSlide--;
    updateCarousel();
}

function updateSlideCounter() {
    const currentSlideElement = document.getElementById('currentSlide');
    const totalSlidesElement = document.getElementById('totalSlides');
    if (currentSlideElement) currentSlideElement.textContent = (currentSlide + 1);
    if (totalSlidesElement) totalSlidesElement.textContent = totalSlides;
}

// Mark center carousel item on desktop
function markCenterCarouselItem() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    const items = Array.from(track.querySelectorAll('.carousel-item'));
    if (!items.length) return;
    items.forEach(it => it.classList.remove('is-center'));

    const firstItem = items[0];
    const container = track.parentElement;
    const itemWidth = firstItem.getBoundingClientRect().width;
    const containerWidth = container.getBoundingClientRect().width;
    const visibleCount = Math.max(1, Math.floor(containerWidth / itemWidth));

    const centerIndex = (currentSlide + Math.floor(visibleCount / 2)) % items.length;
    items[centerIndex].classList.add('is-center');
}

// Hook into carousel updates
const _origUpdateCarousel = typeof updateCarousel === 'function' ? updateCarousel : null;
if (_origUpdateCarousel) {
    window.updateCarousel = function() {
        _origUpdateCarousel();
        markCenterCarouselItem();
    };
}

window.addEventListener('resize', markCenterCarouselItem);

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(markCenterCarouselItem, 200);
});

// Funciones de los botones
function openLocation(location) {
    // Enlaces de ejemplo (dirección ficticia) - ceremonia y celebración
    const mapsUrls = {
        ceremony: "https://maps.app.goo.gl/To3j4JzUpoWVSnoX8",
        reception: "https://maps.app.goo.gl/To3j4JzUpoWVSnoX8"
    };
    const mapsUrl = mapsUrls[location] || mapsUrls.ceremony;
    window.open(mapsUrl, '_blank');
}

// NOTA: esta es una plantilla de ejemplo. Reemplaza el contenido de estas
// funciones con tu propio enlace (Google Drive, Google Form, lista de
// regalos, etc.) cuando personalices la invitación.

function sharePhotos() {
    // Ejemplo: aquí se debe colocar el enlace real a la carpeta de Google Drive.
    window.open('https://photos.app.goo.gl/JKghJ3BQMotVFu7U8', '_blank');
}

function showDressCode() {
    const modal = document.getElementById('dresscodeModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeDressCodeModal() {
    // El click dentro de la tarjeta del modal usa stopPropagation(), así que
    // esta función solo se dispara al hacer click en el fondo oscuro o en la X.
    const modal = document.getElementById('dresscodeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}


function confirmAttendance() {
    // Ejemplo: aquí se debe colocar el enlace real al formulario de Google Forms.
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSdIYoM33yAkMmS4DZCRVmO9_IE0gZT4eEw8cV0r2PgWlYE0Ag/viewform?usp=header', '_blank');
}

// Sistema de Toast
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastContent = document.getElementById('toastContent');
    
    toastContent.innerHTML = `
        <h4 style="font-weight: 700; color: #fff; margin-bottom: 0.35rem; letter-spacing: 0.2px;">${title}</h4>
        <p style="color: #ddd;">${message}</p>
    `;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Nota: el efecto de portada ahora se logra 100% con CSS (hero fijo detrás
// del contenido, ver .hero-section y .content en CCSB.css), igual que en
// boda100L. Ya no hace falta mover nada por JS en el scroll.


// Forzar limpieza de caches en clientes antiguos
(function() {
  function clearCaches() {
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      }).catch(() => {});
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearCaches);
  } else {
    clearCaches();
  }
})();


// Botones "Copiar" de la Mesa de Regalos
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const text = btn.getAttribute('data-copy');
    const done = () => {
        const prev = btn.textContent;
        btn.textContent = 'Copiado';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('copied'); }, 1800);
    };
    const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (err) {}
        document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
        fallback();
    }
});


// Modal Mesa de Regalos
function showGifts() {
    const modal = document.getElementById('giftsModal');
    if (modal) modal.style.display = 'flex';
}
function closeGiftsModal() {
    const modal = document.getElementById('giftsModal');
    if (modal) modal.style.display = 'none';
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeGiftsModal(); if (typeof closeDressCodeModal === 'function') closeDressCodeModal(); }
});


// Aparición suave de los elementos al hacer scroll
(function () {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const selectors = [
        '.section-divider img',
        '.section-title', '.section-subtitle',
        '.countdown-item',
        '.event-icon', '.event-title', '.event-details', '.event-card .btn-wedding',
        '.camera-icon', '.carousel-container', '.carousel-counter',
        '.party-card',
        '.gift-icon', '.gifts-container .btn-wedding',
        '.whatsapp-icon', '.rsvp-container .btn-wedding',
        '.footer-content > *'
    ];
    function start() {
        const items = document.querySelectorAll(selectors.join(','));
        document.documentElement.classList.add('js-reveal');
        const groups = new Map();
        items.forEach(el => {
            el.classList.add('reveal');
            const parent = el.parentElement;
            const i = groups.get(parent) || 0;
            groups.set(parent, i + 1);
            el.style.setProperty('--reveal-delay', Math.min(i * 0.12, 0.6) + 's');
        });
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.01, rootMargin: '0px' });
        items.forEach(el => io.observe(el));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
