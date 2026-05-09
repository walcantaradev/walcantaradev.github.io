// ===== MODO OSCURO/CLARO =====
class DarkModeManager {
    constructor() {
        this.toggleBtn = document.getElementById('darkModeToggle');
        this.currentTheme = localStorage.getItem('monitor-theme') || 'light';
        this.init();
    }
    init() {
        this.applyTheme(this.currentTheme);
        this.toggleBtn?.addEventListener('click', () => this.toggleTheme());
    }
    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (this.toggleBtn) this.toggleBtn.textContent = '☀️';
            localStorage.setItem('monitor-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (this.toggleBtn) this.toggleBtn.textContent = '🌙';
            localStorage.setItem('monitor-theme', 'light');
        }
    }
    toggleTheme() {
        const newTheme = localStorage.getItem('monitor-theme') === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
}

// ===== CONFIGURACIÓN INICIAL =====
let servicios = [
    { id: 1, nombre: "Google", url: "https://www.google.com", status: "checking", responseTime: 0, history: [] },
    { id: 2, nombre: "GitHub", url: "https://github.com", status: "checking", responseTime: 0, history: [] },
    { id: 3, nombre: "Mi Portafolio", url: "https://walcantaradev.github.io", status: "checking", responseTime: 0, history: [] }
];

function loadServices() {
    const saved = localStorage.getItem('uptime-monitor-services');
    if (saved) {
        servicios = JSON.parse(saved);
    }
    servicios.forEach(s => {
        if (!s.history) s.history = [];
        if (!s.id) s.id = Date.now() + Math.random();
    });
    saveServices();
}

function saveServices() {
    localStorage.setItem('uptime-monitor-services', JSON.stringify(servicios));
}

// ===== VERIFICAR SERVICIO =====
async function checkService(service) {
    service.status = "checking";
    updateUI();
    
    const startTime = Date.now();
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        await fetch(service.url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        service.status = "online";
        service.responseTime = Date.now() - startTime;
        
    } catch (error) {
        service.status = "offline";
        service.responseTime = 0;
    }
    
    service.history.push({
        timestamp: Date.now(),
        responseTime: service.responseTime,
        status: service.status
    });
    
    if (service.history.length > 24) service.history.shift();
    
    saveServices();
    updateUI();
}

// ===== VERIFICAR TODOS =====
async function checkAllServices() {
    updateUI();
    const promises = servicios.map(service => checkService(service));
    await Promise.all(promises);
    updateStats();
    updateChart();
    updateUI();
    document.getElementById('lastCheck').innerHTML = new Date().toLocaleTimeString();
}

// ===== ACTUALIZAR UI =====
function updateUI() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    
    grid.innerHTML = servicios.map(service => `
        <div class="service-card ${service.status}" data-id="${service.id}">
            <div class="service-name">${escapeHtml(service.nombre)}</div>
            <div class="service-url">${escapeHtml(service.url)}</div>
            <div class="service-status">
                <span class="status-badge ${service.status}">
                    ${service.status === 'online' ? '✅ Online' : service.status === 'offline' ? '❌ Offline' : '⏳ Verificando...'}
                </span>
                ${service.responseTime > 0 ? `<span class="response-time">⏱️ ${service.responseTime}ms</span>` : ''}
            </div>
            <div class="last-check">
                ${service.history.length > 0 ? `Última: ${new Date(service.history[service.history.length-1].timestamp).toLocaleTimeString()}` : 'No verificada'}
            </div>
            <div class="service-actions">
                <button class="btn-remove" onclick="removeService(${service.id})">Eliminar</button>
            </div>
        </div>
    `).join('');
    
    updateStats();
}

function updateStats() {
    const onlineCount = servicios.filter(s => s.status === 'online').length;
    const avgResponse = servicios.filter(s => s.responseTime > 0).reduce((sum, s) => sum + s.responseTime, 0) / (servicios.filter(s => s.responseTime > 0).length || 1);
    const uptimePercent = servicios.length > 0 ? (onlineCount / servicios.length * 100).toFixed(1) : 100;
    
    document.getElementById('onlineCount').innerHTML = `${onlineCount}<span style="font-size:1rem;">/${servicios.length}</span>`;
    document.getElementById('avgResponse').innerHTML = `${Math.round(avgResponse)}<span style="font-size:1rem;">ms</span>`;
    document.getElementById('uptimePercent').innerHTML = `${uptimePercent}<span style="font-size:1rem;">%</span>`;
}

// ===== GRÁFICO CON DETECCIÓN DE CAÍDAS =====
let responseChart = null;

function updateChart() {
    const ctx = document.getElementById('responseChart')?.getContext('2d');
    if (!ctx) return;
    
    const horas = [];
    const tiemposPromedio = [];
    const coloresBackground = [];
    const estadoPorHora = [];
    
    for (let i = 23; i >= 0; i--) {
        const hora = new Date();
        hora.setHours(hora.getHours() - i, 0, 0, 0);
        horas.push(hora.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }));
        
        let totalTiempo = 0;
        let serviciosEnHora = 0;
        let serviciosCaidos = 0;
        let serviciosTotalesEnHora = 0;
        
        servicios.forEach(service => {
            const checkEnHora = service.history.find(h => {
                const fechaHora = new Date(h.timestamp);
                return fechaHora.getHours() === hora.getHours() && 
                       fechaHora.getDate() === hora.getDate();
            });
            
            if (checkEnHora) {
                serviciosTotalesEnHora++;
                if (checkEnHora.status === 'offline') serviciosCaidos++;
                if (checkEnHora.responseTime > 0) {
                    totalTiempo += checkEnHora.responseTime;
                    serviciosEnHora++;
                }
            }
        });
        
        const avgTime = serviciosEnHora > 0 ? Math.round(totalTiempo / serviciosEnHora) : 0;
        tiemposPromedio.push(avgTime);
        
        const porcentajeCaidas = serviciosTotalesEnHora > 0 ? (serviciosCaidos / serviciosTotalesEnHora) * 100 : 0;
        estadoPorHora.push(porcentajeCaidas);
        
        if (porcentajeCaidas >= 50) {
            coloresBackground.push('rgba(184, 139, 122, 0.4)');
        } else if (porcentajeCaidas > 0) {
            coloresBackground.push('rgba(212, 167, 106, 0.4)');
        } else {
            coloresBackground.push('rgba(124, 154, 110, 0.3)');
        }
    }
    
    if (responseChart) responseChart.destroy();
    
    responseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: horas,
            datasets: [
                {
                    label: '📊 Tiempo de Respuesta (ms)',
                    data: tiemposPromedio,
                    borderColor: '#c9b896',
                    backgroundColor: 'rgba(201, 184, 150, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointBackgroundColor: tiemposPromedio.map((t, i) => {
                        if (estadoPorHora[i] >= 50) return '#b88b7a';
                        if (estadoPorHora[i] > 0) return '#d4a76a';
                        return '#7c9a6e';
                    }),
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: '⚠️ Caídas detectadas (%)',
                    data: estadoPorHora,
                    type: 'bar',
                    borderColor: 'rgba(184, 139, 122, 0.8)',
                    backgroundColor: coloresBackground,
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y1',
                    barPercentage: 0.8,
                    categoryPercentage: 0.9
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label.includes('Caídas')) {
                                return `${context.dataset.label}: ${context.raw}%`;
                            }
                            return `${context.dataset.label}: ${context.raw} ms`;
                        }
                    }
                },
                legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#3a3a3a' } }
            },
            scales: {
                y: {
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Tiempo de Respuesta (ms)', color: '#c9b896' },
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#6b6b6b' },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Caídas (%)', color: '#b88b7a' },
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#6b6b6b', callback: v => v + '%' },
                    grid: { display: false }
                },
                x: { 
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#6b6b6b', maxRotation: 45, minRotation: 45 },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });
}

// ===== AGREGAR SERVICIO =====
function addService() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>➕ Agregar Servicio</h2>
            <input type="text" id="serviceName" placeholder="Nombre del servicio" autocomplete="off">
            <input type="url" id="serviceUrl" placeholder="https://ejemplo.com" autocomplete="off">
            <div class="modal-buttons">
                <button class="cancel" onclick="this.closest('.modal').remove()">Cancelar</button>
                <button class="save" onclick="saveNewService()">Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    window.saveNewService = function() {
        const name = document.getElementById('serviceName').value.trim();
        const url = document.getElementById('serviceUrl').value.trim();
        
        if (!name || !url) {
            alert('Completa todos los campos');
            return;
        }
        
        const newService = {
            id: Date.now(),
            nombre: name,
            url: url,
            status: 'checking',
            responseTime: 0,
            history: []
        };
        
        servicios.push(newService);
        saveServices();
        checkService(newService).then(() => {
            updateUI();
            updateChart();
        });
        modal.remove();
    };
}

// ===== ELIMINAR SERVICIO =====
function removeService(id) {
    if (confirm('¿Eliminar este servicio del monitoreo?')) {
        servicios = servicios.filter(s => s.id !== id);
        saveServices();
        updateUI();
        updateChart();
    }
}

// ===== UTILIDADES =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== INICIALIZACIÓN =====
function init() {
    new DarkModeManager();
    loadServices();
    checkAllServices();
    setInterval(checkAllServices, 30000);
}

document.addEventListener('DOMContentLoaded', init);