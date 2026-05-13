// ===== CONTRASEÑA (CAMBIA ESTA PALABRA) =====
const SECRET_PASSWORD = "Dante";

// ===== COORDENADAS =====
const LIMA = { lat: -12.046374, lng: -77.042793 };
const MILAN = { lat: 45.464204, lng: 9.189982 };

// ===== LISTA DE CANCIONES (se guarda en localStorage) =====
let canciones = [];

// ===== COLA DE REPRODUCCIÓN =====
let colaReproduccion = [];
let reproductorActivo = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    iniciarReloj();
    cargarCanciones();
    cargarCola();
    setupPassword();
});

function setupPassword() {
    const overlay = document.getElementById('passwordOverlay');
    const mainContent = document.getElementById('mainContent');
    const unlockBtn = document.getElementById('unlockBtn');
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('errorMsg');

    passwordInput.addEventListener('input', () => {
        if (passwordInput.value === SECRET_PASSWORD) {
            unlockBtn.classList.add('correct');
            errorMsg.textContent = '';
        } else {
            unlockBtn.classList.remove('correct');
        }
    });

    unlockBtn.addEventListener('click', () => {
        if (passwordInput.value === SECRET_PASSWORD) {
            overlay.style.display = 'none';
            mainContent.style.display = 'block';
            inicializar();
        } else {
            errorMsg.textContent = '💔 Palabra incorrecta. Solo para ti';
            passwordInput.value = '';
            unlockBtn.classList.remove('correct');
        }
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') unlockBtn.click();
    });
}

function inicializar() {
    initMap();
    renderizarListaCanciones();
    renderizarCola();
    setupAddSongPanel();
}

function initMap() {
    const map = L.map('map').setView([(LIMA.lat + MILAN.lat)/2, (LIMA.lng + MILAN.lng)/2], 3);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    L.marker([LIMA.lat, LIMA.lng]).addTo(map).bindPopup('📍 Lima, Perú<br>Aquí estoy yo 💙');
    L.marker([MILAN.lat, MILAN.lng]).addTo(map).bindPopup('📍 Milán, Italia<br>Aquí estás tú 💖');
    
    const latlngs = [[LIMA.lat, LIMA.lng], [MILAN.lat, MILAN.lng]];
    const line = L.polyline(latlngs, { color: '#e8a8a8', weight: 2, dashArray: '8, 8' }).addTo(map);
    
    let offset = 0;
    setInterval(() => {
        offset = (offset + 1) % 24;
        line.setStyle({ dashOffset: offset });
    }, 100);
}

function iniciarReloj() {
    function actualizarHora() {
        const ahora = new Date();
        const limaDate = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Lima' }));
        const milanDate = new Date(ahora.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
        
        document.getElementById('limaTime').innerHTML = limaDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('milanTime').innerHTML = milanDate.toLocaleTimeString('es-IT', { hour: '2-digit', minute: '2-digit' });
    }
    actualizarHora();
    setInterval(actualizarHora, 1000);
}

// ===== FUNCIONES PARA CANCIONES =====
function guardarCanciones() {
    localStorage.setItem('love-songs', JSON.stringify(canciones));
}

function cargarCanciones() {
    const saved = localStorage.getItem('love-songs');
    if (saved && JSON.parse(saved).length > 0) {
        canciones = JSON.parse(saved);
    } else {
        // Canciones de ejemplo
        canciones = [
            { id: "4cOdK2wGLETKBW3PvgPWqT", titulo: "Blinding Lights", artista: "The Weeknd" },
            { id: "3n3Ppam7vgaVa1iaRUc9Lp", titulo: "Shape of You", artista: "Ed Sheeran" },
            { id: "6rPO02ozF3bM7ENnRXQgIC", titulo: "Dance Monkey", artista: "Tones and I" }
        ];
    }
}

function renderizarListaCanciones() {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    if (canciones.length === 0) {
        container.innerHTML = '<div class="loading-spinner">No hay canciones aún. ¡Agrega tu primera canción!</div>';
        return;
    }
    
    container.innerHTML = canciones.map((cancion, index) => `
        <div class="result-item">
            <div class="result-content">
                <div class="result-info">
                    <div class="result-title">${escapeHtml(cancion.titulo)}</div>
                    <div class="result-artist">${escapeHtml(cancion.artista)}</div>
                </div>
            </div>
            <div>
                <button class="btn-add-to-queue" data-id="${cancion.id}" data-title="${escapeHtml(cancion.titulo)}" data-artist="${escapeHtml(cancion.artista)}">
                    <i class="fas fa-plus"></i> Agregar
                </button>
                <button class="btn-remove-song" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.btn-add-to-queue').forEach(btn => {
        btn.addEventListener('click', () => {
            agregarACola({
                id: btn.dataset.id,
                titulo: btn.dataset.title,
                artista: btn.dataset.artist
            });
        });
    });
    
    document.querySelectorAll('.btn-remove-song').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            if (confirm('¿Eliminar esta canción de la lista?')) {
                canciones.splice(index, 1);
                guardarCanciones();
                renderizarListaCanciones();
            }
        });
    });
}

// ===== PANEL PARA AGREGAR CANCIONES (SIN CÓDIGO) =====
function extraerIdSpotify(url) {
    if (!url) return null;
    if (url.match(/^[a-zA-Z0-9]{22}$/)) return url;
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

async function obtenerInfoCancionSpotify(trackId) {
    try {
        const oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`;
        const response = await fetch(oembedUrl);
        const data = await response.json();
        
        const titleParts = data.title.split(' - ');
        return {
            titulo: titleParts[0] || "Canción",
            artista: titleParts[1] || "Artista",
            albumImage: data.thumbnail_url || ""
        };
    } catch (error) {
        console.error('Error obteniendo info:', error);
        return { titulo: "Canción", artista: "Artista" };
    }
}

function setupAddSongPanel() {
    const addBtn = document.getElementById('addSongFromLinkBtn');
    const linkInput = document.getElementById('spotifyLinkInput');
    const messageDiv = document.getElementById('addSongMessage');
    
    if (!addBtn) return;
    
    addBtn.addEventListener('click', async () => {
        const link = linkInput.value.trim();
        const trackId = extraerIdSpotify(link);
        
        if (!trackId) {
            messageDiv.innerHTML = '❌ Enlace no válido. Pega un enlace de Spotify';
            messageDiv.className = 'add-song-message error';
            setTimeout(() => messageDiv.innerHTML = '', 3000);
            return;
        }
        
        messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obteniendo información...';
        messageDiv.className = 'add-song-message';
        
        const info = await obtenerInfoCancionSpotify(trackId);
        
        canciones.push({
            id: trackId,
            titulo: info.titulo,
            artista: info.artista,
            albumImage: info.albumImage
        });
        
        guardarCanciones();
        renderizarListaCanciones();
        
        messageDiv.innerHTML = `✅ "${info.titulo}" agregada correctamente`;
        messageDiv.className = 'add-song-message success';
        linkInput.value = '';
        
        setTimeout(() => messageDiv.innerHTML = '', 3000);
    });
}

// ===== COLA DE REPRODUCCIÓN =====
function agregarACola(cancion) {
    colaReproduccion.push({
        id: cancion.id,
        titulo: cancion.titulo,
        artista: cancion.artista,
        agregadoEn: Date.now()
    });
    
    guardarCola();
    renderizarCola();
    
    const notificacion = document.createElement('div');
    notificacion.className = 'notification-success';
    notificacion.innerHTML = '✅ Canción agregada a la cola';
    document.getElementById('searchResults').prepend(notificacion);
    setTimeout(() => notificacion.remove(), 2000);
}

function eliminarDeCola(indice) {
    colaReproduccion.splice(indice, 1);
    guardarCola();
    renderizarCola();
}

function limpiarCola() {
    colaReproduccion = [];
    guardarCola();
    renderizarCola();
    detenerReproduccion();
}

function guardarCola() {
    localStorage.setItem('love-queue', JSON.stringify(colaReproduccion));
}

function cargarCola() {
    const saved = localStorage.getItem('love-queue');
    if (saved && JSON.parse(saved).length > 0) {
        colaReproduccion = JSON.parse(saved);
    }
}

function renderizarCola() {
    const container = document.getElementById('queueList');
    if (!container) return;
    
    if (colaReproduccion.length === 0) {
        container.innerHTML = `<div class="queue-item" style="justify-content: center; color: #5a6e7a;">
            <i class="fas fa-heart"></i> La cola está vacía. ¡Agrega canciones!
        </div>`;
        return;
    }
    
    container.innerHTML = colaReproduccion.map((cancion, index) => `
        <div class="queue-item ${reproductorActivo === index ? 'playing' : ''}">
            <div class="queue-info">
                <div class="queue-song-title">${escapeHtml(cancion.titulo)}</div>
                <div class="queue-song-artist">${escapeHtml(cancion.artista)}</div>
            </div>
            <div>
                <button class="btn-play-queue" data-index="${index}"><i class="fas fa-play"></i></button>
                <button class="btn-remove-queue" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.btn-play-queue').forEach(btn => {
        btn.addEventListener('click', () => reproducirEnIndice(parseInt(btn.dataset.index)));
    });
    document.querySelectorAll('.btn-remove-queue').forEach(btn => {
        btn.addEventListener('click', () => eliminarDeCola(parseInt(btn.dataset.index)));
    });
}

// ===== REPRODUCCIÓN =====
function reproducirEnIndice(indice) {
    if (indice < 0 || indice >= colaReproduccion.length) return;
    
    const cancion = colaReproduccion[indice];
    reproductorActivo = indice;
    
    document.getElementById('playerCard').style.display = 'block';
    document.getElementById('nowPlayingInfo').innerHTML = `<i class="fas fa-spinner fa-spin"></i> Cargando reproductor...`;
    document.getElementById('miniPlayerTitle').innerHTML = `${escapeHtml(cancion.titulo)} - ${escapeHtml(cancion.artista)}`;
    document.getElementById('miniPlayer').style.display = 'flex';
    
    document.getElementById('youtube-player').innerHTML = `
        <iframe 
            src="https://open.spotify.com/embed/track/${cancion.id}" 
            width="100%" 
            height="80" 
            frameborder="0" 
            allowtransparency="true" 
            allow="encrypted-media"
            style="border-radius: 12px;">
        </iframe>
        <div style="margin-top: 12px; text-align: center; font-size: 0.7rem; color: #5a6e7a;">
            🎵 Inicia sesión en Spotify para escuchar la canción completa
        </div>
    `;
    
    document.getElementById('nowPlayingInfo').innerHTML = `<i class="fas fa-music"></i> ♪ ${escapeHtml(cancion.titulo)} - ${escapeHtml(cancion.artista)}`;
    renderizarCola();
}

function reproducirSiguiente() {
    if (reproductorActivo !== null && reproductorActivo + 1 < colaReproduccion.length) {
        reproducirEnIndice(reproductorActivo + 1);
    } else {
        reproductorActivo = null;
        renderizarCola();
        detenerReproduccion();
    }
}

function detenerReproduccion() {
    reproductorActivo = null;
    document.getElementById('playerCard').style.display = 'none';
    document.getElementById('miniPlayer').style.display = 'none';
    document.getElementById('youtube-player').innerHTML = '';
}

// ===== EVENTOS GLOBALES =====
document.addEventListener('click', (e) => {
    if (e.target.id === 'closePlayerBtn') detenerReproduccion();
    if (e.target.id === 'stopPlaybackBtn') detenerReproduccion();
    if (e.target.id === 'clearQueueBtn') limpiarCola();
});

// ===== UTILIDADES =====
function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

console.log('💖 Love Map cargado - Lima ↔ Milán');