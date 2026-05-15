// ===== CONFIGURACIÓN DE SUPABASE =====
// ⚠️ CAMBIA ESTOS VALORES POR LOS TUYOS ⚠️
const SUPABASE_URL = "https://udroovphwlzppbesjopu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcm9vdnBod2x6cHBiZXNqb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTUyNTQsImV4cCI6MjA5NDQzMTI1NH0.UFy17btjMGBQsIHxbyJuTB4eOYBGYHh3gWn5A3DKekg";

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let respuestas = [];
let manuales = [];
let ordenActual = 'fecha';
let respuestaEnEdicion = null;
let filtroRespuestas = '';
let filtroManuales = '';

// ===== FUNCIONES DE BASE DE DATOS =====
async function cargarRespuestas() {
    try {
        const { data, error } = await supabase
            .from('respuestas')
            .select('*')
            .order('fecha', { ascending: false });
        
        if (error) throw error;
        
        respuestas = data || [];
        renderizarRespuestas();
        console.log(`✅ ${respuestas.length} respuestas cargadas`);
    } catch (error) {
        console.error('Error cargando respuestas:', error);
        mostrarToast('Error al cargar respuestas', 'error');
    }
}

async function guardarRespuesta(respuesta) {
    try {
        const { error } = await supabase
            .from('respuestas')
            .upsert(respuesta, { onConflict: 'id' });
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error guardando:', error);
        mostrarToast('Error al guardar respuesta', 'error');
        return false;
    }
}

async function eliminarRespuestaAPI(id) {
    try {
        const { error } = await supabase
            .from('respuestas')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error eliminando:', error);
        return false;
    }
}

async function cargarManuales() {
    try {
        const { data, error } = await supabase
            .from('manuales')
            .select('*')
            .order('fecha', { ascending: false });
        
        if (error) throw error;
        
        manuales = data || [];
        renderizarManuales();
        console.log(`✅ ${manuales.length} manuales cargados`);
    } catch (error) {
        console.error('Error cargando manuales:', error);
        mostrarToast('Error al cargar manuales', 'error');
    }
}

async function guardarManual(manual) {
    try {
        const { error } = await supabase
            .from('manuales')
            .upsert(manual, { onConflict: 'id' });
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error guardando manual:', error);
        mostrarToast('Error al guardar manual', 'error');
        return false;
    }
}

async function eliminarManualAPI(id) {
    try {
        const { error } = await supabase
            .from('manuales')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error eliminando manual:', error);
        return false;
    }
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
    
    if (!container) return;
    
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
    
    // Incrementar contador de usos
    respuesta.usos = (respuesta.usos || 0) + 1;
    await guardarRespuesta(respuesta);
    
    // Actualizar localmente sin recargar
    const index = respuestas.findIndex(r => r.id === id);
    if (index !== -1) respuestas[index] = respuesta;
    renderizarRespuestas();
    
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
        const exito = await eliminarRespuestaAPI(id);
        if (exito) {
            respuestas = respuestas.filter(r => r.id !== id);
            renderizarRespuestas();
            mostrarToast('Respuesta eliminada');
        }
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
        
        const exito = await guardarRespuesta(respuesta);
        if (exito) {
            const index = respuestas.findIndex(r => r.id === respuestaEnEdicion);
            if (index !== -1) respuestas[index] = respuesta;
            renderizarRespuestas();
            mostrarToast('✅ Respuesta actualizada');
        }
    }
    
    document.getElementById('editarModal').style.display = 'none';
    respuestaEnEdicion = null;
}

// ===== MANUALES =====
function renderizarManuales() {
    const container = document.getElementById('manualesList');
    const countSpan = document.getElementById('manualesCount');
    
    if (!container) return;
    
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
        const exito = await eliminarManualAPI(id);
        if (exito) {
            manuales = manuales.filter(m => m.id !== id);
            renderizarManuales();
            mostrarToast('Manual eliminado');
        }
    }
}

// ===== AGREGAR NUEVO CONTENIDO =====
async function agregarRespuesta() {
    const titulo = document.getElementById('newTitulo').value.trim();
    const categoria = document.getElementById('newCategoria').value;
    const contenido = document.getElementById('newContenido').value.trim();
    
    if (!titulo || !contenido) {
        mostrarToast('Completa título y contenido', 'error');
        return;
    }
    
    const nuevaRespuesta = {
        id: Date.now(),
        titulo: titulo,
        categoria: categoria || null,
        contenido: contenido,
        usos: 0,
        fecha: Date.now()
    };
    
    const exito = await guardarRespuesta(nuevaRespuesta);
    
    if (exito) {
        respuestas.unshift(nuevaRespuesta);
        renderizarRespuestas();
        
        document.getElementById('newTitulo').value = '';
        document.getElementById('newCategoria').value = '';
        document.getElementById('newContenido').value = '';
        mostrarToast('✅ Respuesta guardada');
    }
}

async function agregarManual() {
    const nombre = document.getElementById('newManualNombre').value.trim();
    const descripcion = document.getElementById('newManualDesc').value.trim();
    const url = document.getElementById('newManualUrl').value.trim();
    
    if (!nombre || !url) {
        mostrarToast('Completa nombre y enlace', 'error');
        return;
    }
    
    let embedUrl = url;
    if (url.includes('/view')) {
        embedUrl = url.replace('/view', '/preview');
    }
    
    const nuevoManual = {
        id: Date.now(),
        nombre: nombre,
        descripcion: descripcion || null,
        url: embedUrl,
        fecha: Date.now()
    };
    
    const exito = await guardarManual(nuevoManual);
    
    if (exito) {
        manuales.unshift(nuevoManual);
        renderizarManuales();
        
        document.getElementById('newManualNombre').value = '';
        document.getElementById('newManualDesc').value = '';
        document.getElementById('newManualUrl').value = '';
        mostrarToast('✅ Manual agregado');
    }
}

// ===== PESTAÑAS =====
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

// ===== BUSCADORES =====
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

// ===== ORDENAMIENTO =====
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

// ===== MODALES =====
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

// ===== TECLADO =====
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

// ===== UTILIDAD =====
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// ===== INICIALIZACIÓN =====
async function init() {
    console.log('🚀 Iniciando portal con Supabase...');
    
    await cargarRespuestas();
    await cargarManuales();
    
    initTabs();
    initBuscadores();
    initSorting();
    initModales();
    initTeclado();
    
    document.getElementById('guardarRespuestaBtn').onclick = agregarRespuesta;
    document.getElementById('guardarManualBtn').onclick = agregarManual;
}

document.addEventListener('DOMContentLoaded', init);
