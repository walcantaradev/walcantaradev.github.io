// ===== CONFIGURACIÓN DE SUPABASE =====
const SUPABASE_URL = "https://udroovphwlzppbesjopu.supabase.co";  // ← CAMBIA ESTO
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcm9vdnBod2x6cHBiZXNqb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTUyNTQsImV4cCI6MjA5NDQzMTI1NH0.UFy17btjMGBQsIHxbyJuTB4eOYBGYHh3gWn5A3DKekg";     // ← CAMBIA ESTO

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let respuestas = [];
let manuales = [];
let ordenActual = 'fecha';

// ===== FUNCIONES DE BASE DE DATOS =====
async function cargarRespuestas() {
    const { data, error } = await supabase
        .from('respuestas')
        .select('*')
        .order('fecha', { ascending: false });
    
    if (error) {
        console.error('Error cargando respuestas:', error);
        mostrarToast('Error al cargar respuestas', 'error');
        return;
    }
    
    respuestas = data;
    renderizarRespuestas();
    console.log(`✅ ${respuestas.length} respuestas cargadas`);
}

async function guardarRespuesta(respuesta) {
    const { error } = await supabase
        .from('respuestas')
        .upsert(respuesta, { onConflict: 'id' });
    
    if (error) {
        console.error('Error guardando:', error);
        mostrarToast('Error al guardar respuesta', 'error');
        return false;
    }
    
    return true;
}

async function eliminarRespuestaAPI(id) {
    const { error } = await supabase
        .from('respuestas')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error eliminando:', error);
        return false;
    }
    return true;
}

// ===== MANUALES =====
async function cargarManuales() {
    const { data, error } = await supabase
        .from('manuales')
        .select('*')
        .order('fecha', { ascending: false });
    
    if (error) {
        console.error('Error cargando manuales:', error);
        return;
    }
    
    manuales = data;
    renderizarManuales();
}

async function guardarManual(manual) {
    const { error } = await supabase
        .from('manuales')
        .upsert(manual, { onConflict: 'id' });
    
    if (error) {
        console.error('Error guardando manual:', error);
        mostrarToast('Error al guardar manual', 'error');
        return false;
    }
    return true;
}

async function eliminarManualAPI(id) {
    const { error } = await supabase
        .from('manuales')
        .delete()
        .eq('id', id);
    
    return !error;
}

// ===== FUNCIONES DE INTERFAZ (iguales que antes pero con await) =====
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

async function agregarManual() {
    const nombre = document.getElementById('newManualNombre').value.trim();
    const descripcion = document.getElementById('newManualDesc').value.trim();
    const url = document.getElementById('newManualUrl').value.trim();
    
    if (!nombre || !url) {
        mostrarToast('Completa nombre y enlace', 'error');
        return;
    }
    
    const nuevoManual = {
        id: Date.now(),
        nombre: nombre,
        descripcion: descripcion || null,
        url: url,
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

// (Mantén todas las demás funciones: initTabs, renderizarRespuestas, etc.)
// Solo asegúrate de que renderizarRespuestas y renderizarManuales usen los arrays locales

document.addEventListener('DOMContentLoaded', init);
