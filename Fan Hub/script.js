// ===== FRASES MOTIVADORAS (GAMER Y PERSONALES) =====
const frases = [
    "💜 Eres más fuerte que un jefe en Minecraft",
    "🐼 Como un panda, eres única y especial",
    "🚔 En el roleplay de FiveM, tú eres la protagonista",
    "✨ Cada día es un nuevo mundo por explorar",
    "🎮 Tus partidas son épicas, como tú",
    "💜 El morado es el color de la realeza y tú eres una reina",
    "👑 Zully estaría orgullosa de tenerte como fan",
    "⛏️ Construyes realidades, dentro y fuera del juego",
    "🎲 La suerte está de tu lado, siempre",
    "💖 Eres la mejor compañera de juegos",
    "🐼 Los pandas te envían un abrazo virtual",
    "🚔 Cada misión en GTA V es una aventura, como contigo",
    "💜 Eres mi persona favorita para rolear y construir castillos"
];

// ===== MENSAJES ROTATORIOS SOBRE ZULLY =====
const mensajesZully = [
    "💜 Zully está en directo... ¡y tú puedes estar jugando GTA V!",
    "🐼 Un panda te dice: 'Disfruta del stream de Zully'",
    "🎮 ¿Ya preparaste tu personaje para rolear en FiveM?",
    "⛏️ Minecraft y Zully: la combinación perfecta",
    "✨ Zully te manda un saludo virtual (bueno, casi)",
    "👑 Mientras ves a Zully, recuerda que tú también eres una crack",
    "💜 Zully te inspira, y tú inspiras a otros con tus partidas",
    "🎮 Zully en Kick, tú conquistando Los Santos. ¡Equipo soñado!"
];

// ===== PANDAS (con emojis y nombres bonitos) =====
const pandas = [
    { emoji: "🐼", nombre: "Panda Dormilón" },
    { emoji: "🐼‍🖌️", nombre: "Panda Artista" },
    { emoji: "🐼💜", nombre: "Panda Romántico" },
    { emoji: "🐼🎮", nombre: "Panda Gamer" },
    { emoji: "🐼✨", nombre: "Panda Mágico" },
    { emoji: "🐼🍿", nombre: "Panda Cinéfilo" },
    { emoji: "🐼🚔", nombre: "Panda Poli" },
    { emoji: "🐼⛏️", nombre: "Panda Constructor" }
];

// ===== CARGAR PANDAS (con evento de clic) =====
function cargarPandas() {
    const container = document.getElementById('pandaGrid');
    if (!container) return;
    
    container.innerHTML = pandas.map(panda => `
        <div class="panda-card" onclick="mostrarMensajePanda('${panda.nombre}')">
            <span class="panda-emoji">${panda.emoji}</span>
            <span class="panda-name">${panda.nombre}</span>
        </div>
    `).join('');
}

function mostrarMensajePanda(nombre) {
    const mensajes = [
        `🐼 ¡${nombre} te manda un abrazo!`,
        `🐼 ${nombre} dice: "Eres increíble"`,
        `🐼 ${nombre} quiere jugar contigo`,
        `🐼 ${nombre} sonríe porque existes`,
        `🐼 ${nombre} te regala un bambú virtual`
    ];
    const random = Math.floor(Math.random() * mensajes.length);
    alert(mensajes[random]);
}

// ===== MENSAJE ALEATORIO (FRASES) =====
function actualizarMensaje() {
    const messageElement = document.getElementById('dailyMessage');
    if (!messageElement) return;
    
    const randomIndex = Math.floor(Math.random() * frases.length);
    messageElement.textContent = frases[randomIndex];
}

// ===== MENSAJE ROTATORIO SOBRE ZULLY =====
let mensajeIndex = 0;

function rotarMensajeZully() {
    const messageSpan = document.getElementById('rotatingMessage');
    if (!messageSpan) return;
    
    mensajeIndex = (mensajeIndex + 1) % mensajesZully.length;
    messageSpan.textContent = mensajesZully[mensajeIndex];
}

// ===== INICIALIZACIÓN =====
function init() {
    cargarPandas();
    actualizarMensaje();
    
    // Rotar mensaje de Zully cada 10 segundos
    setInterval(rotarMensajeZully, 10000);
    
    const refreshBtn = document.getElementById('newMessageBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', actualizarMensaje);
    }
}

document.addEventListener('DOMContentLoaded', init);

console.log('🎮 FanHub cargado - GTA V · Minecraft · Zully · Pandas 💜');