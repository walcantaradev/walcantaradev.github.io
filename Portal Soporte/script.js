// ===== CONFIGURACIÓN - CAMBIA ESTA URL =====
const API_URL = "https://script.google.com/macros/s/AKfycbxkTW-KNC7IxNzzXsgok2mfPws5hGskarc7RfHMDbIEkH_XwnxSskVcIhcvuUkc-EW5/exec"; // ← PON TU URL DE APPS SCRIPT

let respuestas = [];
let manuales = [];
let ordenActual = 'fecha';
let respuestaEnEdicion = null;

// ===== FUNCIONES DE API =====
async function cargarRespuestas() {
    try {
        const response = await fetch(`${API_URL}?action=getRespuestas`);
        respuestas = await response.json();
        renderizarRespuestas();
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar respuestas', 'error');
    }
}

async function cargarManuales() {
    try {
        const response = await fetch(`${API_URL}?action=getManuales`);
        manuales = await response.json();
        renderizarManuales();
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar manuales', 'error');
    }
}

async function guardarRespuesta(respuesta) {
    const url = `${API_URL}?action=guardarRespuesta&id=${respuesta.id}&titulo=${encodeURIComponent(respuesta.titulo)}&categoria=${encodeURIComponent(respuesta.categoria || '')}&contenido=${encodeURIComponent(respuesta.contenido)}&usos=${respuesta.usos || 0}&fecha=${respuesta.fecha}`;
    await fetch(url);
    await cargarRespuestas();
}

async function eliminarRespuestaAPI(id) {
    await fetch(`${API_URL}?action=eliminarRespuesta&id=${id}`);
    await cargarRespuestas();
}

async function guardarManual(manual) {
    const url = `${API_URL}?action=guardarManual&id=${manual.id}&nombre=${encodeURIComponent(manual.nombre)}&descripcion=${encodeURIComponent(manual.descripcion || '')}&url=${encodeURIComponent(manual.url)}&fecha=${manual.fecha}`;
    await fetch(url);
    await cargarManuales();
}

async function eliminarManualAPI(id) {
    await fetch(`${API_URL}?action=eliminarManual&id=${id}`);
    await cargarManuales();
}

// ===== TOAST =====
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.style.background = tipo === 'success' ? '#10b981' : '#ef4444';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ===== RENDERIZAR RESPUESTAS =====
let filtroRespuestas = '';

function ordenarRespuestas(lista) {
    if (ordenActual === 'fecha') {
        return [...lista].sort((a, b) => b.fecha - a.fecha);
    } else {
        return [...lista].sort((a, b) => (b.usos || 0) - (a.usos || 0));
    }
}

function renderizarRespuestas() {
    const container = document.getElementById('respuestasList');
    const countSpan = document.getElementById('respuestasCount');
    
    let filtradas = respuestas;
    if (filtroRespuestas) {
        const term = filtroRespuestas.toLowerCase();
        filtradas = respuestas.filter(r => 
            r.titulo.toLowerCase().includes(term) || 
            (r.categoria && r.categoria.toLowerCase().includes(term)) ||
            r.contenido.toLowerCase().includes(term)
        );
    }
    
    filtradas = ordenarRespuestas(filtradas);
    countSpan.textContent = filtradas.length;
    
    if (filtradas.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:2rem;">No hay respuestas. ¡Agrega una!</div>`;
        return;
    }
    
    container.innerHTML = filtradas.map(r => `
        <div class="respuesta-card" onclick="abrirRespuesta(${r.id})">
            <div class="respuesta-titulo">${escapeHtml(r.titulo)}</div>
            ${r.categoria ? `<div class="respuesta-categoria">${escapeHtml(r.categoria)}</div>` : ''}
            <div class="respuesta-preview">${escapeHtml(r.contenido.substring(0, 80))}...</div>
            <div class="respuesta-usos">📊 Usada ${r.usos || 0} veces</div>
            <div class="respuesta-actions">
                <button class="btn-edit-card" onclick="event.stopPropagation(); abrirEdicion(${r.id})">Editar</button>
                <button class="btn-delete" onclick="event.stopPropagation(); eliminarRespuesta(${r.id})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

async function abrirRespuesta(id) {
    const respuesta = respuestas.find(r => r.id === id);
    if (!respuesta) return;
    
    respuesta.usos = (respuesta.usos || 0) + 1;
    await guardarRespuesta(respuesta);
    
    document.getElementById('modalTitulo').textContent = respuesta.titulo;
    document.getElementById('modalContenido').textContent = respuesta.contenido;
    document.getElementById('respuestaModal').style.display = 'flex';
    
    document.getElementById('copiarRespuestaBtn').onclick = () => {
        navigator.clipboard.writeText(respuesta.contenido);
        mostrarToast('✅ Respuesta copiada');
    };
    
    document.getElementById('editarRespuestaModalBtn').onclick = () => {
        document.getElementById('respuestaModal').style.display = 'none';
        abrirEdicion(id);
    };
}

async function eliminarRespuesta(id) {
    if (confirm('¿Eliminar esta respuesta?')) {
        await eliminarRespuestaAPI(id);
        mostrarToast('Respuesta eliminada');
    }
}

function abrirEdicion(id) {
    const respuesta = respuestas.find(r => r.id === id);
    if (!respuesta) return;
    
    respuestaEnEdicion = id;
    document.getElementById('editTitulo').value = respuesta.titulo;
    document.getElementById('editCategoria').value = respuesta.categoria || '';
    document.getElementById('editContenido').value = respuesta.contenido;
    document.getElementById('editarModal').style.display = 'flex';
}

async function guardarEdicion() {
    if (!respuestaEnEdicion) return;
    
    const respuesta = respuestas.find(r => r.id === respuestaEnEdicion);
    if (respuesta) {
        respuesta.titulo = document.getElementById('editTitulo').value.trim();
        respuesta.categoria = document.getElementById('editCategoria').value;
        respuesta.contenido = document.getElementById('editContenido').value.trim();
        respuesta.fecha = Date.now();
        await guardarRespuesta(respuesta);
        mostrarToast('✅ Respuesta actualizada');
    }
    
    document.getElementById('editarModal').style.display = 'none';
    respuestaEnEdicion = null;
}

// ===== RENDERIZAR MANUALES =====
let filtroManuales = '';

function renderizarManuales() {
    const container = document.getElementById('manualesList');
    const countSpan = document.getElementById('manualesCount');
    
    let filtradas = manuales;
    if (filtroManuales) {
        const term = filtroManuales.toLowerCase();
        filtradas = manuales.filter(m => 
            m.nombre.toLowerCase().includes(term) || 
            (m.descripcion && m.descripcion.toLowerCase().includes(term))
        );
    }
    
    countSpan.textContent = filtradas.length;
    
    if (filtradas.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:2rem;">No hay manuales. ¡Agrega uno!</div>`;
        return;
    }
    
    container.innerHTML = filtradas.map(m => `
        <div class="manual-card">
            <div class="manual-icon"><i class="fas fa-file-pdf"></i></div>
            <div class="manual-titulo">${escapeHtml(m.nombre)}</div>
            ${m.descripcion ? `<div class="manual-desc">${escapeHtml(m.descripcion)}</div>` : ''}
            <div style="margin-top: 0.75rem;">
                <button class="btn-view-pdf" onclick="verPDF('${m.url}', '${escapeHtml(m.nombre)}')">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <a href="${m.url.replace('/preview', '/view')}" target="_blank" class="btn-pdf" style="margin-left: 8px;">
                    <i class="fas fa-download"></i> Descargar
                </a>
                <button class="btn-delete" onclick="eliminarManual(${m.id})" style="margin-left: 8px;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

function verPDF(url, titulo) {
    document.getElementById('pdfModalTitulo').textContent = titulo;
    document.getElementById('pdfIframe').src = url;
    document.getElementById('pdfModal').style.display = 'flex';
}

async function eliminarManual(id) {
    if (confirm('¿Eliminar este manual?')) {
        await eliminarManualAPI(id);
        mostrarToast('Manual eliminado');
    }
}

// ===== AGREGAR RESPUESTA =====
async function agregarRespuesta() {
    const titulo = document.getElementById('newTitulo').value.trim();
    const categoria = document.getElementById('newCategoria').value;
    const contenido = document.getElementById('newContenido').value.trim();
    
    if (!titulo || !contenido) {
        mostrarToast('Completa título y contenido', 'error');
        return;
    }
    
    await guardarRespuesta({
        id: Date.now(),
        titulo: titulo,
        categoria: categoria || null,
        contenido: contenido,
        usos: 0,
        fecha: Date.now()
    });
    
    document.getElementById('newTitulo').value = '';
    document.getElementById('newCategoria').value = '';
    document.getElementById('newContenido').value = '';
    mostrarToast('✅ Respuesta guardada');
}

// ===== AGREGAR MANUAL =====
async function agregarManual() {
    const nombre = document.getElementById('newManualNombre').value.trim();
    const descripcion = document.getElementById('newManualDesc').value.trim();
    const url = document.getElementById('newManualUrl').value.trim();
    
    if (!nombre || !url) {
        mostrarToast('Completa nombre y enlace de Drive', 'error');
        return;
    }
    
    let embedUrl = url;
    if (url.includes('/view')) {
        embedUrl = url.replace('/view', '/preview');
    }
    
    await guardarManual({
        id: Date.now(),
        nombre: nombre,
        descripcion: descripcion || null,
        url: embedUrl,
        fecha: Date.now()
    });
    
    document.getElementById('newManualNombre').value = '';
    document.getElementById('newManualDesc').value = '';
    document.getElementById('newManualUrl').value = '';
    mostrarToast('✅ Manual agregado');
}

// ===== EXPORTAR/IMPORTAR =====
async function exportarDatos() {
    await cargarRespuestas();
    await cargarManuales();
    const datos = { respuestas, manuales, exportado: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soporte_respaldo_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('✅ Datos exportados');
}

function importarDatos(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const datos = JSON.parse(e.target.result);
            if (datos.respuestas) {
                for (const r of datos.respuestas) {
                    await guardarRespuesta(r);
                }
            }
            if (datos.manuales) {
                for (const m of datos.manuales) {
                    await guardarManual(m);
                }
            }
            mostrarToast('✅ Datos importados');
        } catch (error) {
            mostrarToast('Error al importar', 'error');
        }
    };
    reader.readAsText(file);
}

// ===== INICIALIZACIÓN =====
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
        });
    });
}

function initBuscadores() {
    document.getElementById('searchRespuestas').addEventListener('input', (e) => {
        filtroRespuestas = e.target.value;
        renderizarRespuestas();
    });
    document.getElementById('searchManuales').addEventListener('input', (e) => {
        filtroManuales = e.target.value;
        renderizarManuales();
    });
}

function initSorting() {
    document.getElementById('sortFechaBtn').addEventListener('click', () => {
        ordenActual = 'fecha';
        document.getElementById('sortFechaBtn').classList.add('active');
        document.getElementById('sortUsoBtn').classList.remove('active');
        renderizarRespuestas();
    });
    document.getElementById('sortUsoBtn').addEventListener('click', () => {
        ordenActual = 'uso';
        document.getElementById('sortUsoBtn').classList.add('active');
        document.getElementById('sortFechaBtn').classList.remove('active');
        renderizarRespuestas();
    });
}

function initModales() {
    document.querySelector('.close-modal').onclick = () => {
        document.getElementById('respuestaModal').style.display = 'none';
    };
    document.querySelector('.close-editar-modal').onclick = () => {
        document.getElementById('editarModal').style.display = 'none';
    };
    document.querySelector('.close-pdf-modal').onclick = () => {
        document.getElementById('pdfModal').style.display = 'none';
        document.getElementById('pdfIframe').src = '';
    };
    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        }
    };
    document.getElementById('guardarEdicionBtn').onclick = guardarEdicion;
    document.getElementById('cancelarEdicionBtn').onclick = () => {
        document.getElementById('editarModal').style.display = 'none';
    };
}

function initTeclado() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            document.getElementById('searchRespuestas').focus();
            mostrarToast('🔍 Buscador activado');
        }
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            document.querySelector('.tab-btn[data-tab="nueva"]').click();
            document.getElementById('newTitulo').focus();
            mostrarToast('📝 Creando nueva respuesta');
        }
    });
}

async function init() {
    await cargarRespuestas();
    await cargarManuales();
    initTabs();
    initBuscadores();
    initSorting();
    initModales();
    initTeclado();
    
    document.getElementById('guardarRespuestaBtn').onclick = agregarRespuesta;
    document.getElementById('guardarManualBtn').onclick = agregarManual;
    document.getElementById('exportarBtn').onclick = exportarDatos;
    document.getElementById('importarBtn').onclick = () => {
        document.getElementById('importarInput').click();
    };
    document.getElementById('importarInput').onchange = (e) => {
        if (e.target.files[0]) importarDatos(e.target.files[0]);
        e.target.value = '';
    };
}

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);
