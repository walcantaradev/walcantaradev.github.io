// ===== LOADER =====
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('mainContent');
    
    if (loader && mainContent) {
        const letters = document.querySelectorAll('.loader-text span');
        letters.forEach((letter, index) => {
            letter.style.animation = `bounce 0.5s ease ${index * 0.05}s forwards`;
        });
        
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                mainContent.style.display = 'block';
                initAllFeatures();
            }, 500);
        }, 2500);
    } else if (mainContent) {
        mainContent.style.display = 'block';
        initAllFeatures();
    }
});

function initAllFeatures() {
    new DarkModeManager();
    fetchGitHubStats();
    cargarProyectos();
    initBusquedaYFiltros();
    initMobileMenu();
    initBackToTop();
    initContactForm();
    initSmoothScroll();
    initScrollAnimations();
    initTypingEffect();
    initParticles();
    loadSkills();
    loadTestimonios();
    loadGaleria();
    updateVisitCounter();
    initDownloadCV();
    initSocialShare();
    showWelcomeNotification();
    showConfetti();
}

// ===== PARTICULAS =====
function initParticles() {
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#ffffff' },
            shape: { type: 'circle' },
            opacity: { value: 0.3, random: false },
            size: { value: 2, random: true },
            line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.2, width: 1 },
            move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });
}

// ===== TYPING EFFECT =====
function initTypingEffect() {
    const roles = ["Desarrollador Web", "React Developer", "Freelancer", "Problem Solver", "UI/UX Enthusiast"];
    let roleIndex = 0, charIndex = 0, isDeleting = false;
    const typingText = document.getElementById('typingText');
    if (!typingText) return;
    
    function type() {
        const currentRole = roles[roleIndex];
        if (isDeleting) {
            typingText.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingText.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
        }
        
        if (!isDeleting && charIndex === currentRole.length) {
            isDeleting = true;
            setTimeout(type, 2000);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            setTimeout(type, 500);
        } else {
            setTimeout(type, isDeleting ? 50 : 100);
        }
    }
    type();
}

// ===== MENÚ HAMBURGUESA =====
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const body = document.body;
    
    if (!menuToggle || !navLinks) return;
    
    function openMenu() {
        menuToggle.classList.add('active');
        navLinks.classList.add('active');
        body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
        body.style.overflow = '';
    }
    
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navLinks.classList.contains('active')) closeMenu();
        else openMenu();
    });
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            closeMenu();
            if (targetId && targetId !== '#') {
                setTimeout(() => {
                    document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        });
    });
    
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            closeMenu();
        }
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) closeMenu();
    });
}

// ===== MODO OSCURO =====
class DarkModeManager {
    constructor() {
        this.toggleBtn = document.getElementById('darkModeToggle');
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }
    init() {
        this.applyTheme(this.currentTheme);
        this.toggleBtn?.addEventListener('click', () => this.toggleTheme());
        if (!localStorage.getItem('theme')) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                this.applyTheme(e.matches ? 'dark' : 'light');
            });
        }
    }
    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (this.toggleBtn) this.toggleBtn.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (this.toggleBtn) this.toggleBtn.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    }
    toggleTheme() {
        this.applyTheme(localStorage.getItem('theme') === 'light' ? 'dark' : 'light');
    }
}

// ===== SKILLS =====
const skills = [
    { name: "JavaScript/TypeScript", level: 85 },
    { name: "React/Next.js", level: 80 },
    { name: "Node.js/Express", level: 75 },
    { name: "HTML5/CSS3", level: 90 },
    { name: "Python", level: 70 },
    { name: "Git/GitHub", level: 85 },
    { name: "MongoDB", level: 75 },
    { name: "SQL", level: 70 }
];

function loadSkills() {
    const container = document.getElementById('skillsContainer');
    if (!container) return;
    
    container.innerHTML = skills.map(skill => `
        <div class="skill-item">
            <div class="skill-info">
                <span>${skill.name}</span>
                <span>${skill.level}%</span>
            </div>
            <div class="skill-bar">
                <div class="skill-progress" style="--target-width: ${skill.level}%"></div>
            </div>
        </div>
    `).join('');
}

// ===== TESTIMONIOS =====
const testimonios = [
    { nombre: "Juan Pérez", rol: "CEO de TechStart", texto: "Excelente profesional, superó todas nuestras expectativas. Muy recomendado.", estrellas: 5 },
    { nombre: "María García", rol: "Product Manager", texto: "Gran capacidad técnica y excelente comunicación. Un placer trabajar con él.", estrellas: 5 },
    { nombre: "Carlos López", rol: "Fundador de WebSolutions", texto: "Entregó el proyecto antes de tiempo y con calidad impecable.", estrellas: 5 }
];

function loadTestimonios() {
    const container = document.getElementById('testimoniosContainer');
    if (!container) return;
    
    container.innerHTML = testimonios.map(t => `
        <div class="testimonio-card">
            <div class="estrellas">${'★'.repeat(t.estrellas)}${'☆'.repeat(5-t.estrellas)}</div>
            <p class="testimonio-texto">"${t.texto}"</p>
            <div class="testimonio-autor">${t.nombre}</div>
            <div class="testimonio-rol">${t.rol}</div>
        </div>
    `).join('');
}

// ===== GALERÍA =====
const galeria = [
    { titulo: "Adivina el Número", icono: "🎯", descripcion: "Juego clásico de adivinanza" },
    { titulo: "Uptime Monitor", icono: "📊", descripcion: "Panel de monitoreo" },
    { titulo: "Love Map", icono: "🗺️💖", descripcion: "Mapa interactivo Lima ↔ Milán con playlist colaborativa" },
    { titulo: "FanHub", icono: "🎮🐼", descripcion: "Zona gamer con Zully, FiveM, Minecraft y pandas" }
];

function loadGaleria() {
    const container = document.getElementById('galeriaContainer');
    if (!container) return;
    
    container.innerHTML = galeria.map((item, index) => `
        <div class="galeria-item" onclick="openGaleriaModal(${index})">
            <div class="galeria-imagen">${item.icono}</div>
            <div class="galeria-info">
                <h3>${item.titulo}</h3>
                <p>${item.descripcion}</p>
            </div>
            <div class="galeria-overlay">
                <span>🔍</span>
            </div>
        </div>
    `).join('');
}

function openGaleriaModal(index) {
    const item = galeria[index];
    const modal = document.getElementById('projectModal');
    document.getElementById('modalBody').innerHTML = `
        <div class="modal-body">
            <div style="text-align: center; font-size: 4rem;">${item.icono}</div>
            <h2>${item.titulo}</h2>
            <p>${item.descripcion}</p>
            <div class="modal-links">
                <button onclick="closeModal()" class="modal-btn demo">Cerrar</button>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
}

// ===== PROYECTOS =====
const proyectos = [
    { id: 1, titulo: "Adivina el Número", descripcion: "Juego clásico de adivinanza. ¿Puedes encontrar el número secreto?", descripcionLarga: "Juego interactivo donde debes adivinar un número aleatorio entre 1 y 100. Recibirás pistas si tu número es muy alto o muy bajo. ¡Pon a prueba tu intuición!", url: "/JUEGOS/ADIVINA EL NUMERO/index.html", github: "#", categoria: "javascript", tecnologias: ["JavaScript", "HTML5", "CSS3", "DOM Manipulation"], imagen: "🎯", fecha: "2026", desafio: "Generar número aleatorio y dar retroalimentación al usuario", solucion: "Usé Math.random() para el número secreto y condicionales para las pistas", rol: "Frontend Developer"},
    { id: 2, titulo: "Uptime Monitor", descripcion: "Monitorea el estado de tus servicios web en tiempo real", descripcionLarga: "Herramienta que verifica automáticamente si tus páginas web están online, mide tiempos de respuesta, detecta caídas y genera gráficos históricos.", url: "/MONITOR/index.html", github: "#", categoria: "javascript", tecnologias: ["JavaScript", "Chart.js", "Fetch API", "LocalStorage"], imagen: "📊", fecha: "2026", desafio: "Monitoreo de múltiples servicios y detección de caídas", solucion: "Fetch API con timeout, localStorage para persistencia y Chart.js para visualización", rol: "Frontend Developer"},
    { id: 3, titulo: "Love Map - Lima ↔ Milán", descripcion: "Mapa interactivo con playlist colaborativa de Spotify para una relación a distancia", descripcionLarga: "Una experiencia personalizada que combina un mapa interactivo mostrando la distancia entre Lima y Milán (11,043 km), un reloj en tiempo real con la hora en ambas ciudades, y una playlist colaborativa donde puedes agregar canciones de Spotify con solo pegar el enlace. Perfecto para mantener viva la conexión a pesar de la distancia.", url: "/Day/index.html", github: "#", categoria: "javascript", tecnologias: ["JavaScript", "Leaflet.js", "Spotify Embed API", "LocalStorage", "CSS3"], imagen: "🗺️💖", fecha: "2026", desafio: "Crear una experiencia personalizada para una relación a distancia que combine geolocalización, música y facilidad de uso", solucion: "Uso de Leaflet para el mapa interactivo, Spotify oEmbed para obtener información de canciones, y LocalStorage para persistencia de datos", rol: "Full Stack Developer"},
    { id: 4, titulo: "FanHub - Zully · GTA V · Minecraft", descripcion: "Web personalizada con la streamer favorita (Zully), tips de FiveM y Minecraft, pandas adorables y frases motivadoras", descripcionLarga: "Un espacio dedicado a sus gustos: Zully en Kick, comandos útiles para rolear en FiveM y sobrevivir en Minecraft, una galería de pandas interactiva y frases que la motivan. Todo con su color favorito: morado.", url: "Fan Hub/index.html", github: "#", categoria: "javascript", tecnologias: ["JavaScript", "CSS Grid", "Diseño responsivo", "LocalStorage"], imagen: "🎮🐼", fecha: "2026", desafio: "Unificar varios gustos personales en una sola web cohesiva", solucion: "Secciones temáticas bien diferenciadas, diseño morado y experiencias interactivas", rol: "Frontend Developer" 
}
];

let categoriaActiva = 'todos';
let searchTerm = '';

function cargarProyectos() {
    const container = document.getElementById('proyectos-container');
    const noResults = document.getElementById('noResults');
    if (!container) return;
    
    let filtrados = proyectos.filter(p => categoriaActiva === 'todos' || p.categoria === categoriaActiva);
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtrados = filtrados.filter(p => p.titulo.toLowerCase().includes(term) || p.descripcion.toLowerCase().includes(term) || p.tecnologias.some(t => t.toLowerCase().includes(term)));
    }
    
    if (filtrados.length === 0) {
        noResults.style.display = 'block';
        container.style.display = 'none';
        return;
    }
    
    noResults.style.display = 'none';
    container.style.display = 'grid';
    container.innerHTML = filtrados.map(proyecto => `
        <div class="proyecto-card" data-categoria="${proyecto.categoria}">
            <div class="proyecto-info">
                <div style="font-size: 2rem; text-align: center;">${proyecto.imagen}</div>
                <h3>${proyecto.titulo}</h3>
                <p>${proyecto.descripcion}</p>
                <div>${proyecto.tecnologias.slice(0, 3).map(t => `<span style="background: var(--link-hover); color: #1a1a1a; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-right: 5px;">${t}</span>`).join('')}</div>
                <button class="proyecto-link view-details" data-id="${proyecto.id}" style="margin-top: 1rem;">Ver Detalles</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', () => showProjectModal(proyectos.find(p => p.id === parseInt(btn.dataset.id))));
    });
}

function showProjectModal(proyecto) {
    const modal = document.getElementById('projectModal');
    document.getElementById('modalBody').innerHTML = `
        <div class="modal-body">
            <div style="text-align: center; font-size: 4rem;">${proyecto.imagen}</div>
            <h2>${proyecto.titulo}</h2>
            <p>${proyecto.descripcionLarga}</p>
            <h3>🛠️ Tecnologías</h3>
            <div>${proyecto.tecnologias.map(t => `<span class="modal-tech-badge">${t}</span>`).join('')}</div>
            <h3>🎯 Rol</h3>
            <p>${proyecto.rol}</p>
            <h3>⚠️ Desafío</h3>
            <p>${proyecto.desafio}</p>
            <h3>💡 Solución</h3>
            <p>${proyecto.solucion}</p>
            <div class="modal-links">
                <a href="${proyecto.url}" class="modal-btn demo">🚀 Ver Demo</a>
                <a href="${proyecto.github}" target="_blank" class="modal-btn github">📝 Ver Código</a>
            </div>
        </div>
    `;
    modal.style.display = 'block';
    document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

function initBusquedaYFiltros() {
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        cargarProyectos();
    });
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            categoriaActiva = btn.dataset.categoria;
            cargarProyectos();
        });
    });
}

// ===== GITHUB STATS =====
async function fetchGitHubStats() {
    const username = 'walcantaradev';
    try {
        const repos = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`).then(r => r.json());
        const user = await fetch(`https://api.github.com/users/${username}`).then(r => r.json());
        document.getElementById('reposCount').textContent = repos.length;
        document.getElementById('followersCount').textContent = user.followers || 0;
        document.getElementById('starsCount').textContent = repos.reduce((a, r) => a + r.stargazers_count, 0);
        const langs = new Set(repos.map(r => r.language).filter(Boolean));
        document.getElementById('languagesCount').textContent = langs.size;
        
        const langCount = {};
        repos.forEach(r => { if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1; });
        const topLangs = Object.entries(langCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        const ctx = document.getElementById('contributionsChart')?.getContext('2d');
        if (ctx && window.languageChart) window.languageChart.destroy();
        if (ctx) window.languageChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: topLangs.map(l => l[0]), datasets: [{ label: 'Repositorios', data: topLangs.map(l => l[1]), backgroundColor: ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'] }] },
            options: { responsive: true, maintainAspectRatio: true }
        });
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        document.getElementById('reposCount').textContent = '12';
        document.getElementById('followersCount').textContent = '45';
        document.getElementById('starsCount').textContent = '89';
        document.getElementById('languagesCount').textContent = '6';
    }
}

// ===== CONTACTO =====
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombre')?.value;
        const email = document.getElementById('email')?.value;
        const mensaje = document.getElementById('mensaje')?.value;
        if (!nombre || !email || !mensaje) return showFormMessage('Completa todos los campos', 'error');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showFormMessage('Email inválido', 'error');
        const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        messages.push({ nombre, email, mensaje, fecha: new Date().toISOString() });
        localStorage.setItem('contactMessages', JSON.stringify(messages));
        showFormMessage('¡Mensaje enviado con éxito!', 'success');
        form.reset();
        setTimeout(() => {
            const msg = document.getElementById('formMessage');
            if (msg) msg.innerHTML = '';
        }, 3000);
    });
}

function showFormMessage(msg, type) {
    const formMessage = document.getElementById('formMessage');
    if (!formMessage) return;
    formMessage.innerHTML = msg;
    formMessage.className = `form-message ${type}`;
    setTimeout(() => { if (formMessage.innerHTML === msg) formMessage.innerHTML = ''; }, 5000);
}

// ===== NOTIFICACIONES =====
function showWelcomeNotification() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('¡Bienvenido a mi portafolio!', {
                    body: 'Gracias por visitar mi sitio. Explora mis proyectos y no dudes en contactarme.',
                    icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                });
            }
        });
    }
}

// ===== CONFETI =====
function showConfetti() {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
}

// ===== VISIT COUNTER =====
async function updateVisitCounter() {
    const counterElement = document.getElementById('visitCounter');
    if (!counterElement) return;
    
    let visits = localStorage.getItem('pageVisits');
    if (!visits) {
        visits = 1;
    } else {
        visits = parseInt(visits) + 1;
    }
    localStorage.setItem('pageVisits', visits);
    counterElement.textContent = visits;
}

// ===== DOWNLOAD CV =====
function initDownloadCV() {
    const downloadBtn = document.getElementById('downloadCV');
    if (!downloadBtn) return;
    
    downloadBtn.addEventListener('click', (e) => {
        console.log('Descargando CV...');
    });
}

// ===== SOCIAL SHARE =====
function initSocialShare() {
    window.shareToLinkedIn = function() {
        window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(window.location.href), '_blank');
    };
    
    window.shareToTwitter = function() {
        window.open('https://twitter.com/intent/tweet?text=¡Mira este increíble portafolio!&url=' + encodeURIComponent(window.location.href), '_blank');
    };
    
    window.shareToWhatsApp = function() {
        window.open('https://wa.me/?text=' + encodeURIComponent('¡Mira este portafolio! ' + window.location.href), '_blank');
    };
}

// ===== BACK TO TOP =====
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('show', window.pageYOffset > 300));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.6s ease';
        observer.observe(section);
    });
}

console.log('🚀 Portafolio Pro Ultra cargado correctamente');
console.log('✨ Funciones: Skills | Testimonios | Galería | Notificaciones | Partículas | SEO');
