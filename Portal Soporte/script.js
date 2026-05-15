// ===== CONFIGURACIÓN DE SUPABASE =====
// ⚠️ CAMBIA ESTOS DOS VALORES POR LOS TUYOS ⚠️
const SUPABASE_URL = "https://udroovphwlzppbesjopu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcm9vdnBod2x6cHBiZXNqb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTUyNTQsImV4cCI6MjA5NDQzMTI1NH0.UFy17btjMGBQsIHxbyJuTB4eOYBGYHh3gWn5A3DKekg";

// Inicializar Supabase
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let respuestas = [];
let manuales = [];
let categorias = [];
let ordenActual = 'fecha';
let respuestaEnEdicion = null;
let categoriaEnEdicion = null;
let filtroRespuestas = '';
let filtroManuales = '';
let filtroCategorias = '';

// ===== TOAST =====
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.style.background = tipo === 'success' ? '#10b981' : '#ef4444';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ===== FUNCIONES DE CATEGORÍAS =====
async function cargarCategorias() {
    try {
        const { data, error } = await sb
            .from('categorias')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        categorias = data || [];
        renderizarCategorias();
        actualizarSelectCategorias();
        console.log(`✅ ${categorias.length} categorías cargadas`);
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

function actualizarSelectCategorias() {
    const selectNew = document.getElementById('newCategoria');
    const selectEdit = document.getElementById('editCategoria');
    
    if (selectNew) {
        selectNew.innerHTML = '<option value="">Seleccionar...</option>' +
            categorias.map(c => `<option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>`).join('');
    }
    
    if (selectEdit) {
        selectEdit.innerHTML = '<option value="">Sin categoría</option>' +
            categorias.map(c => `<option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>`).join('');
    }
}

async function guardarCategoria() {
    const nombre = document.getElementById('categoriaNombre').value.trim();
    
    if (!nombre) {
        mostrarToast('Escribe un nombre para la categoría', 'error');
        return;
    }
    
    if (categoriaEnEdicion) {
        const { error } = await sb
            .from('categorias')
            .update({ nombre: nombre, fecha: Date.now() })
            .eq('id', categoriaEnEdicion);
        
        if (error) {
            mostrarToast('Error al actualizar', 'error');
            return;
        }
        
        const categoriaAnterior = categorias.find(c => c.id === categoriaEnEdicion)?.nombre;
        if (categoriaAnterior && categoriaAnterior !== nombre) {
            await sb
                .from('respuestas')
                .update({ categoria: nombre })
                .eq('categoria', categoriaAnterior);
            await cargarRespuestas();
        }
        
        mostrarToast('✅ Categoría actualizada');
    } else {
        const { error } = await sb
            .from('categorias')
            .insert({ id: Date.now(), nombre: nombre, fecha: Date.now() });
        
        if (error) {
            mostrarToast('Error al guardar', 'error');
            return;
        }
        mostrarToast('✅ Categoría agregada');
    }
    
    document.getElementById('categoriaModal').style.display = 'none';
    categoriaEnEdicion = null;
    await cargarCategorias();
}

async function eliminarCategoria(id, nombre) {
    const respuestasConCategoria = respuestas.filter(r => r.categoria === nombre);
    
    if (respuestasConCategoria.length > 0) {
        if (!confirm(`La categoría "${nombre}" está siendo usada en ${respuestasConCategoria.length} respuesta(s). ¿Eliminar? Las respuestas quedarán sin categoría.`)) {
            return;
        }
        await sb.from('respuestas').update({ categoria: null }).eq('categoria', nombre);
        await cargarRespuestas();
    }
    
    const { error } = await sb.from('categorias').delete().eq('id', id);
    if (error) {
        mostrarToast('Error al eliminar', 'error');
        return;
    }
    
    mostrarToast('✅ Categoría eliminada');
    await cargarCategorias();
}

function abrirModalCategoria(id = null) {
    categoriaEnEdicion = id;
    const modal = document.getElementById('categoriaModal');
    const titulo = document.getElementById('categoriaModalTitulo');
    const input = document.getElementById('categoriaNombre');
    
    if (id) {
        const categoria = categorias.find(c => c.id === id);
        titulo.textContent = '✏️ Editar categoría';
        input.value = categoria.nombre;
    } else {
        titulo.textContent = '➕ Nueva categoría';
        input.value = '';
    }
    
    modal.style.display = 'flex';
}

function renderizarCategorias() {
    const container = document.getElementById('categoriasList');
    const countSpan = document.getElementById('categoriasCount');
    
    if (!container) return;
    
    let filtradas = categorias;
    if (filtroCategorias) {
        const term = filtroCategorias.toLowerCase();
        filtradas = categorias.filter(c => c.nombre.toLowerCase().includes(term));
    }
    
    countSpan.textContent = filtradas.length;
    
    if (filtradas.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:2rem;">No hay categorías. ¡Agrega una!</div>`;
        return;
    }
    
    container.innerHTML = filtradas.map(c => `
        <div class="categoria-card">
            <div class="categoria-nombre">${escapeHtml(c.nombre)}</div>
            <div class="categoria-actions">
                <button class="btn-edit-categoria" onclick="abrirModalCategoria(${c.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete-categoria" onclick="eliminarCategoria(${c.id}, '${escapeHtml(c.nombre)}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ===== FUNCIONES DE RESPUESTAS =====
async function cargarRespuestas() {
    try {
        const { data, error } = await sb
            .from('respuestas')
            .select('*')
            .order('fecha', { ascending: false });
        
        if (error) throw error;
        respuestas = data || [];
        renderizarRespuestas();
        console.log(`✅ ${respuestas.length} respuestas cargadas`);
    } catch (error) {
        console.error('Error cargando respuestas:', error);
    }
}

async function guardarRespuesta(respuesta) {
    try {
        const { error } = await sb
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
        const { error } = await sb
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

// ===== FUNCIONES DE MANUALES =====
async function cargarManuales() {
    try {
        const { data, error } = await sb
            .from('manuales')
            .select('*')
            .order('fecha', { ascending: false });
        
        if (error) throw error;
        manuales = data || [];
        renderizarManuales();
        console.log(`✅ ${manuales.length} manuales cargados`);
    } catch (error) {
        console.error('Error cargando manuales:', error);
    }
}

function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return { icon: '📄', class: 'pdf' };
    if (fileType.includes('word') || fileType.includes('document')) return { icon: '📝', class: 'word' };
    if (fileType.includes('sheet') || fileType.includes('excel')) return { icon: '📊', class: 'excel' };
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return { icon: '📽️', class: 'ppt' };
    return { icon: '📁', class: '' };
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function subirArchivo(file, nombre) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${nombre.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
    const filePath = `manuales/${fileName}`;
    
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = document.querySelector('.progress-bar');
    progressDiv.style.display = 'flex';
    
    const { error } = await sb.storage
        .from('manuales')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                progressBar.style.width = `${percent}%`;
            }
        });
    
    if (error) throw error;
    
    progressDiv.style.display = 'none';
    progressBar.style.width = '0%';
    
    return filePath;
}

async function guardarManual(manual) {
    try {
        const { error } = await sb.from('manuales').insert(manual);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error guardando manual:', error);
        return false;
    }
}

async function eliminarManualAPI(id, filePath) {
    try {
        if (filePath) {
            await sb.storage.from('manuales').remove([filePath]);
        }
        const { error } = await sb.from('manuales').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error eliminando manual:', error);
        return false;
    }
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

window.abrirRespuesta = async function(id) {
    const respuesta = respuestas.find(r => r.id === id);
    if (!respuesta) return;
    
    respuesta.usos = (respuesta.usos || 0) + 1;
    await guardarRespuesta(respuesta);
    
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
};

window.eliminarRespuesta = async function(id) {
    if (confirm('¿Eliminar esta respuesta?')) {
        const exito = await eliminarRespuestaAPI(id);
        if (exito) {
            respuestas = respuestas.filter(r => r.id !== id);
            renderizarRespuestas();
            mostrarToast('Respuesta eliminada');
        }
    }
};

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

// ===== RENDERIZAR MANUALES =====
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
    
    container.innerHTML = filtradas.map(m => {
        const fileIcon = getFileIcon(m.file_type);
        return `
        <div class="manual-card">
            <div class="manual-icon ${fileIcon.class}">${fileIcon.icon}</div>
            <div class="manual-titulo">${escapeHtml(m.nombre)}</div>
            ${m.descripcion ? `<div class="manual-desc">${escapeHtml(m.descripcion)}</div>` : ''}
            <div class="manual-size">📄 ${formatFileSize(m.file_size)}</div>
            <div>
                <button class="btn-view" onclick="verArchivo('${m.file_path}', '${escapeHtml(m.nombre)}')">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <a href="${sb.storage.from('manuales').getPublicUrl(m.file_path).data.publicUrl}" download class="btn-download">
                    <i class="fas fa-download"></i> Descargar
                </a>
                <button class="btn-delete" onclick="eliminarManual(${m.id}, '${m.file_path}')" style="margin-left: 8px;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `}).join('');
}

window.verArchivo = function(filePath, titulo) {
    const url = sb.storage.from('manuales').getPublicUrl(filePath).data.publicUrl;
    const extension = filePath.split('.').pop().toLowerCase();
    
    document.getElementById('fileModalTitulo').textContent = titulo;
    
    if (extension === 'pdf') {
        document.getElementById('fileIframe').src = url;
    } else {
        document.getElementById('fileIframe').src = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }
    document.getElementById('fileModal').style.display = 'flex';
};

window.eliminarManual = async function(id, filePath) {
    if (confirm('¿Eliminar este manual?')) {
        const exito = await eliminarManualAPI(id, filePath);
        if (exito) {
            manuales = manuales.filter(m => m.id !== id);
            renderizarManuales();
            mostrarToast('Manual eliminado');
        }
    }
};

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
        
        document.querySelector('.tab-btn[data-tab="respuestas"]').click();
    }
}

async function agregarManual() {
    const nombre = document.getElementById('newManualNombre').value.trim();
    const descripcion = document.getElementById('newManualDesc').value.trim();
    const fileInput = document.getElementById('newManualFile');
    const file = fileInput.files[0];
    
    if (!nombre || !file) {
        mostrarToast('Completa nombre y selecciona un archivo', 'error');
        return;
    }
    
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!allowedTypes.includes(file.type)) {
        mostrarToast('Formato no permitido. Usa PDF, Word, Excel o PowerPoint', 'error');
        return;
    }
    
    mostrarToast('Subiendo archivo...', 'success');
    
    try {
        const filePath = await subirArchivo(file, nombre);
        
        const nuevoManual = {
            id: Date.now(),
            nombre: nombre,
            descripcion: descripcion || null,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            fecha: Date.now()
        };
        
        const exito = await guardarManual(nuevoManual);
        
        if (exito) {
            manuales.unshift(nuevoManual);
            renderizarManuales();
            
            document.getElementById('newManualNombre').value = '';
            document.getElementById('newManualDesc').value = '';
            document.getElementById('newManualFile').value = '';
            mostrarToast('✅ Manual subido correctamente');
            
            document.querySelector('.tab-btn[data-tab="manuales"]').click();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al subir el archivo', 'error');
    }
}

// ===== PESTAÑAS =====
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`).classList.add('active');
        });
    });
}

// ===== BUSCADORES =====
function initBuscadores() {
    const searchRespuestas = document.getElementById('searchRespuestas');
    const searchManuales = document.getElementById('searchManuales');
    const searchCategorias = document.getElementById('searchCategorias');
    
    if (searchRespuestas) {
        searchRespuestas.addEventListener('input', (e) => {
            filtroRespuestas = e.target.value;
            renderizarRespuestas();
        });
    }
    
    if (searchManuales) {
        searchManuales.addEventListener('input', (e) => {
            filtroManuales = e.target.value;
            renderizarManuales();
        });
    }
    
    if (searchCategorias) {
        searchCategorias.addEventListener('input', (e) => {
            filtroCategorias = e.target.value;
            renderizarCategorias();
        });
    }
}

// ===== ORDENAMIENTO =====
function initSorting() {
    const sortFecha = document.getElementById('sortFechaBtn');
    const sortUso = document.getElementById('sortUsoBtn');
    
    if (sortFecha) {
        sortFecha.addEventListener('click', () => {
            ordenActual = 'fecha';
            sortFecha.classList.add('active');
            sortUso.classList.remove('active');
            renderizarRespuestas();
        });
    }
    
    if (sortUso) {
        sortUso.addEventListener('click', () => {
            ordenActual = 'uso';
            sortUso.classList.add('active');
            sortFecha.classList.remove('active');
            renderizarRespuestas();
        });
    }
}

// ===== MODALES =====
function initModales() {
    const closeModal = document.querySelector('.close-modal');
    const closeEditar = document.querySelector('.close-editar-modal');
    const closeFile = document.querySelector('.close-file-modal');
    const closeCategoria = document.querySelector('.close-categoria-modal');
    const guardarEdicionBtn = document.getElementById('guardarEdicionBtn');
    const cancelarEdicionBtn = document.getElementById('cancelarEdicionBtn');
    const guardarCategoriaBtn = document.getElementById('guardarCategoriaBtn');
    const cancelarCategoriaBtn = document.getElementById('cancelarCategoriaBtn');
    const agregarCategoriaBtn = document.getElementById('agregarCategoriaBtn');
    
    if (closeModal) closeModal.onclick = () => document.getElementById('respuestaModal').style.display = 'none';
    if (closeEditar) closeEditar.onclick = () => document.getElementById('editarModal').style.display = 'none';
    if (closeFile) {
        closeFile.onclick = () => {
            document.getElementById('fileModal').style.display = 'none';
            document.getElementById('fileIframe').src = '';
        };
    }
    if (closeCategoria) {
        closeCategoria.onclick = () => {
            document.getElementById('categoriaModal').style.display = 'none';
            categoriaEnEdicion = null;
        };
    }
    
    window.onclick = (e) => {
        if (e.target.classList && e.target.classList.contains('modal')) {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            document.getElementById('fileIframe').src = '';
            categoriaEnEdicion = null;
        }
    };
    
    if (guardarEdicionBtn) guardarEdicionBtn.onclick = guardarEdicion;
    if (cancelarEdicionBtn) {
        cancelarEdicionBtn.onclick = () => document.getElementById('editarModal').style.display = 'none';
    }
    if (guardarCategoriaBtn) guardarCategoriaBtn.onclick = guardarCategoria;
    if (cancelarCategoriaBtn) {
        cancelarCategoriaBtn.onclick = () => {
            document.getElementById('categoriaModal').style.display = 'none';
            categoriaEnEdicion = null;
        };
    }
    if (agregarCategoriaBtn) agregarCategoriaBtn.onclick = () => abrirModalCategoria();
}

// ===== TECLADO =====
function initTeclado() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            const searchInput = document.getElementById('searchRespuestas');
            if (searchInput) {
                searchInput.focus();
                mostrarToast('🔍 Buscador activado');
            }
        }
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            const nuevaTab = document.querySelector('.tab-btn[data-tab="nueva"]');
            if (nuevaTab) {
                nuevaTab.click();
                const tituloInput = document.getElementById('newTitulo');
                if (tituloInput) tituloInput.focus();
                mostrarToast('📝 Creando nueva respuesta');
            }
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
    
    await cargarCategorias();
    await cargarRespuestas();
    await cargarManuales();
    
    initTabs();
    initBuscadores();
    initSorting();
    initModales();
    initTeclado();
    
    const guardarRespuestaBtn = document.getElementById('guardarRespuestaBtn');
    const guardarManualBtn = document.getElementById('guardarManualBtn');
    
    if (guardarRespuestaBtn) guardarRespuestaBtn.onclick = agregarRespuesta;
    if (guardarManualBtn) guardarManualBtn.onclick = agregarManual;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}