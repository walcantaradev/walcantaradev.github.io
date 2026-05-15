// ===== CATEGORÍAS PREDEFINIDAS =====
const categoriasPredefinidas = [
    "Licencias", "Correo Electrónico", "Acceso", "Office 365",
    "Teams", "OneDrive", "Cuentas", "Otros"
];

// ===== DATOS =====
let respuestas = [];
let manuales = [];
let ordenActual = 'fecha'; // 'fecha' o 'uso'
let respuestaEnEdicion = null;

// ===== RESPUESTA DE EJEMPLO =====
const respuestaEjemplo = {
    id: Date.now(),
    titulo: "Licencia Office 365 - Solo versión web",
    categoria: "Licencias",
    contenido: `Estimado(a) estudiante,\n\nActualmente, la licencia educativa asignada a su cuenta corresponde al plan Office 365, el cual solo permite el acceso a las aplicaciones (Word, Excel, PowerPoint, entre otras) en su versión web, es decir, a través del navegador.\n\nEste cambio no está relacionado con un problema específico de su cuenta, sino con una actualización en las políticas de licenciamiento de Microsoft, mediante la cual se retiró el beneficio que permitía la instalación de las aplicaciones en equipos personales.`,
    usos: 0,
    fecha: Date.now()
};

// ===== INICIALIZACIÓN =====
function cargarDatos() {
    const savedRespuestas = localStorage.getItem('soporte_respuestas');
    const savedManuales = localStorage.getItem('soporte_manuales');
    
    if (savedRespuestas) {
        respuestas = JSON.parse(savedRespuestas);
    } else {
        respuestas = [respuestaEjemplo];
        guardarRespuestas();
    }
    
    if (savedManuales) {
        manuales = JSON.parse(savedManuales);
    } else {
        manuales = [];
        guardarManuales();
    }
    
    // Sincronizar modo oscuro con el portafolio
    sincronizarModoOscuro();
}

function sincronizarModoOscuro() {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    if (!isDarkMode) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

function guardarRespuestas() {
    localStorage.setItem('soporte_respuestas', JSON.stringify(respuestas));
}

function guardarManuales() {
    localStorage.setItem('soporte_manuales', JSON.stringify(manuales));
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

function ordenarRespuestas(respuestasArray) {
    if (ordenActual === 'fecha') {
        return [...respuestasArray].sort((a, b) => b.fecha - a.fecha);
    } else {
        return [...respuestasArray].sort((a, b) => (b.usos || 0) - (a.usos || 0));
    }
}

function renderizarRespuestas() {
    const container = document.getElementById('respuestasList');
    const countSpan = document.getElementById('respuestasCount');
    
    let filtradas = respuestas;
    if (filtroRespuestas) {
        const terminos = filtroRespuestas.toLowerCase().split(' ');
        filtradas = respuestas.filter(r => {
            const texto = `${r.titulo} ${r.categoria || ''} ${r.contenido}`.toLowerCase();
            return terminos.every(term => texto.includes(term));
        });
    }
    
    filtradas = ordenarRespuestas(filtradas);
    countSpan.textContent = filtradas.length;
    
    if (filtradas.length === 0) {
        container.innerHTML = `<div class="respuesta-card" style="text-align: center; grid-column: 1/-1;">
            No hay respuestas guardadas. Agrega una en la pestaña "Agregar"
        </div>`;
        return;
    }
    
    container.innerHTML = filtradas.map(r => `
        <div class="respuesta-card" onclick="abrirRespuesta(${r.id})">
            <div class="respuesta-titulo">${escapeHtml(r.titulo)}</div>
            ${r.categoria ? `<div class="respuesta-categoria">${escapeHtml(r.categoria)}</div>` : ''}
            <div class="respuesta-preview">${escapeHtml(r.contenido.substring(0, 100))}...</div>
            <div class="respuesta-usos"><i class="fas fa-chart-line"></i> Usada ${r.usos || 0} veces</div>
            <div class="respuesta-actions">
                <button class="btn-edit-card" onclick="event.stopPropagation(); abrirEdicion(${r.id})">Editar</button>
                <button class="btn-delete" onclick="event.stopPropagation(); eliminarRespuesta(${r.id})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

function abrirRespuesta(id) {
    const respuesta = respuestas.find(r => r.id === id);
    if (!respuesta) return;
    
    respuesta.usos = (respuesta.usos || 0) + 1;
    guardarRespuestas();
    renderizarRespuestas();
    
    document.getElementById('modalTitulo').textContent = respuesta.titulo;
    document.getElementById('modalContenido').textContent = respuesta.contenido;
    document.getElementById('respuestaModal').style.display = 'flex';
    
    const copyBtn = document.getElementById('copiarRespuestaBtn');
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(respuesta.contenido);
        mostrarToast('✅ Respuesta copiada al portapapeles');
    };
    
    const editBtn = document.getElementById('editarRespuestaModalBtn');
    editBtn.onclick = () => {
        document.getElementById('respuestaModal').style.display = 'none';
        abrirEdicion(id);
    };
}

function eliminarRespuesta(id) {
    if (confirm('¿Eliminar esta respuesta permanentemente?')) {
        respuestas = respuestas.filter(r => r.id !== id);
        guardarRespuestas();
        renderizarRespuestas();
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

function guardarEdicion() {
    if (!respuestaEnEdicion) return;
    
    const respuesta = respuestas.find(r => r.id === respuestaEnEdicion);
    if (respuesta) {
        respuesta.titulo = document.getElementById('editTitulo').value.trim();
        respuesta.categoria = document.getElementById('editCategoria').value || null;
        respuesta.contenido = document.getElementById('editContenido').value.trim();
        respuesta.fecha = Date.now();
        
        guardarRespuestas();
        renderizarRespuestas();
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
        container.innerHTML = `<div class="manual-card" style="text-align: center; grid-column: 1/-1;">
            No hay manuales subidos. Agrega uno en la pestaña "Agregar"
        </div>`;
        return;
    }
    
    container.innerHTML = filtradas.map(m => `
        <div class="manual-card">
            <div class="manual-icon"><i class="fas fa-file-pdf"></i></div>
            <div class="manual-titulo">${escapeHtml(m.nombre)}</div>
            ${m.descripcion ? `<div class="manual-desc">${escapeHtml(m.descripcion)}</div>` : ''}
            <div class="manual-size">📄 ${formatBytes(m.size)}</div>
            <div>
                <button class="btn-view-pdf" onclick="verPDF(${m.id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn-pdf" onclick="descargarManual(${m.id})">
                    <i class="fas fa-download"></i> Descargar
                </button>
                <button class="btn-delete" onclick="eliminarManual(${m.id})" style="margin-left: 8px;">Eliminar</button>
            </div>
        </div>
    `).join('');
}

function verPDF(id) {
    const manual = manuales.find(m => m.id === id);
    if (manual && manual.data) {
        document.getElementById('pdfModalTitulo').textContent = manual.nombre;
        document.getElementById('pdfIframe').src = manual.data;
        document.getElementById('pdfModal').style.display = 'flex';
    }
}

function eliminarManual(id) {
    if (confirm('¿Eliminar este manual?')) {
        manuales = manuales.filter(m => m.id !== id);
        guardarManuales();
        renderizarManuales();
        mostrarToast('Manual eliminado');
    }
}

function descargarManual(id) {
    const manual = manuales.find(m => m.id === id);
    if (manual && manual.data) {
        const link = document.createElement('a');
        link.href = manual.data;
        link.download = manual.nombre + '.pdf';
        link.click();
        mostrarToast('Descargando manual...');
    }
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ===== AGREGAR RESPUESTA =====
function agregarRespuesta() {
    const titulo = document.getElementById('newTitulo').value.trim();
    const categoria = document.getElementById('newCategoria').value;
    const contenido = document.getElementById('newContenido').value.trim();
    
    if (!titulo || !contenido) {
        mostrarToast('Completa al menos el título y el contenido', 'error');
        return;
    }
    
    respuestas.unshift({
        id: Date.now(),
        titulo: titulo,
        categoria: categoria || null,
        contenido: contenido,
        usos: 0,
        fecha: Date.now()
    });
    
    guardarRespuestas();
    renderizarRespuestas();
    
    document.getElementById('newTitulo').value = '';
    document.getElementById('newCategoria').value = '';
    document.getElementById('newContenido').value = '';
    
    mostrarToast('✅ Respuesta guardada correctamente');
}

// ===== AGREGAR MANUAL PDF =====
function agregarManual() {
    const nombre = document.getElementById('newManualNombre').value.trim();
    const descripcion = document.getElementById('newManualDesc').value.trim();
    const fileInput = document.getElementById('newManualFile');
    const file = fileInput.files[0];
    
    if (!nombre || !file || file.type !== 'application/pdf') {
        mostrarToast('Completa el nombre y selecciona un archivo PDF válido', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        manuales.unshift({
            id: Date.now(),
            nombre: nombre,
            descripcion: descripcion || null,
            data: e.target.result,
            size: file.size
        });
        
        guardarManuales();
        renderizarManuales();
        
        document.getElementById('newManualNombre').value = '';
        document.getElementById('newManualDesc').value = '';
        fileInput.value = '';
        
        mostrarToast('✅ Manual subido correctamente');
    };
    reader.readAsDataURL(file);
}

// ===== EXPORTAR / IMPORTAR =====
function exportarDatos() {
    const datos = {
        respuestas: respuestas,
        manuales: manuales,
        exportado: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soporte_respaldo_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    mostrarToast('✅ Datos exportados correctamente');
}

function importarDatos(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            if (datos.respuestas) respuestas = datos.respuestas;
            if (datos.manuales) manuales = datos.manuales;
            
            guardarRespuestas();
            guardarManuales();
            renderizarRespuestas();
            renderizarManuales();
            
            mostrarToast('✅ Datos importados correctamente');
        } catch (error) {
            mostrarToast('Error al importar: archivo inválido', 'error');
        }
    };
    reader.readAsText(file);
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
}

// ===== ORDENAMIENTO =====
function initSorting() {
    const sortFechaBtn = document.getElementById('sortFechaBtn');
    const sortUsoBtn = document.getElementById('sortUsoBtn');
    
    sortFechaBtn.addEventListener('click', () => {
        ordenActual = 'fecha';
        sortFechaBtn.classList.add('active');
        sortUsoBtn.classList.remove('active');
        renderizarRespuestas();
    });
    
    sortUsoBtn.addEventListener('click', () => {
        ordenActual = 'uso';
        sortUsoBtn.classList.add('active');
        sortFechaBtn.classList.remove('active');
        renderizarRespuestas();
    });
}

// ===== MODALES =====
function initModales() {
    const modal = document.getElementById('respuestaModal');
    const closeBtn = document.querySelector('.close-modal');
    closeBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
        if (e.target === document.getElementById('editarModal')) document.getElementById('editarModal').style.display = 'none';
        if (e.target === document.getElementById('pdfModal')) document.getElementById('pdfModal').style.display = 'none';
    };
    
    document.querySelector('.close-editar-modal').onclick = () => {
        document.getElementById('editarModal').style.display = 'none';
    };
    
    document.querySelector('.close-pdf-modal').onclick = () => {
        document.getElementById('pdfModal').style.display = 'none';
        document.getElementById('pdfIframe').src = '';
    };
    
    document.getElementById('guardarEdicionBtn').onclick = guardarEdicion;
    document.getElementById('cancelarEdicionBtn').onclick = () => {
        document.getElementById('editarModal').style.display = 'none';
    };
}

// ===== TECLADO RÁPIDO =====
function initTeclado() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + B: Enfocar buscador
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            document.getElementById('searchRespuestas').focus();
            mostrarToast('🔍 Buscador activado');
        }
        // Ctrl + N: Nueva respuesta (cambia a pestaña Agregar)
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            const agregarTab = document.querySelector('.tab-btn[data-tab="nueva"]');
            agregarTab.click();
            document.getElementById('newTitulo').focus();
            mostrarToast('📝 Creando nueva respuesta');
        }
    });
}

// ===== INICIALIZACIÓN =====
function init() {
    cargarDatos();
    renderizarRespuestas();
    renderizarManuales();
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

console.log('📋 Portal de Soporte cargado con todas las mejoras');