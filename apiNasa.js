// Guarda la clave de API de la NASA (actualmente es la clave de demostración "DEMO_KEY")
const API_KEY = "fzEb2JB6AuM9DH7ZQ3pFuxCHArJEUCAeeb3WPPgv";
// Guarda la URL base de la API de Astronomy Picture of the Day (APOD) de la NASA
const BASE_URL = "https://api.nasa.gov/planetary/apod";

let currentApod = null;
let favorites = JSON.parse(localStorage.getItem("apodFavorites")) || [];

const dateInput = document.getElementById("date-input");
const fetchBtn = document.getElementById("fetch-btn");
const titleEl = document.getElementById("title");
const dateDisplay = document.getElementById("date-display");
const mediaContainer = document.getElementById("media-container");
const explanationEl = document.getElementById("explanation");
const favoriteBtn = document.getElementById("favorite-btn");
const favoritesList = document.getElementById("favorites-list");

// Configurar fecha máxima al dia actual.
const today = new Date().toISOString().split("T")[0];
dateInput.max = today;
dateInput.value = today;

// Función para obtener API
async function fetchApod(date = null) {
  let url = `${BASE_URL}?api_key=${API_KEY}`;
  if (date) url += `&date=${date}`;

  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      if (res.status === 500) {
        throw new Error("La NASA está teniendo problemas en su servidor (Error 500). Intenta con una fecha anterior.");
      } else if (res.status === 429) {
        throw new Error("Límite de peticiones alcanzado. Espera unos minutos.");
      } else {
        throw new Error(`Error ${res.status} al obtener datos de la NASA`);
      }
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error en fetchApod:", error); // Para que veas más info en la consola
    alert("❌ " + error.message);
    return null;
  }
}

function displayApod(data) {
  if (!data) return;
  currentApod = data;

  titleEl.textContent = data.title;
  dateDisplay.textContent = `📅 Fecha: ${data.date}`;

  mediaContainer.innerHTML = "";

  if (data.media_type === "image") {
    const img = document.createElement("img");
    img.src = data.hdurl || data.url;
    img.alt = data.title;
    mediaContainer.appendChild(img);
  } 
  else if (data.media_type === "video") {
    const iframe = document.createElement("iframe");
    iframe.src = data.url;
    iframe.allowFullscreen = true;
    mediaContainer.appendChild(iframe);
  } 
  else {
    mediaContainer.innerHTML = `<p style="color:white; padding:30px; text-align:center;">Tipo de medio no soportado</p>`;
  }

  explanationEl.innerHTML = `
    <strong>Explicación científica:</strong><br><br>
    ${data.explanation}
    ${data.copyright ? `<br><br><small>© ${data.copyright}</small>` : ""}
  `;

  favoriteBtn.style.display = "inline-block";
}

async function loadTodaysApod() {
  let data = await fetchApod();   
  if (!data) {
    console.log("Intentando con fecha de ayer...");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    data = await fetchApod(yesterdayStr);
  }
  
  if (data) {
    displayApod(data);
  } else {
    titleEl.textContent = "No se pudo cargar el APOD";
    dateDisplay.textContent = "";
    mediaContainer.innerHTML = `<p style="color:#ff7777; padding:40px; text-align:center;">La API de NASA está teniendo problemas en este momento.<br>Intenta más tarde o selecciona otra fecha.</p>`;
  }
}

// Buscar por fecha
async function handleSearch() {
  const selectedDate = dateInput.value;
  if (!selectedDate) return;
  
  const data = await fetchApod(selectedDate);
  if (data) displayApod(data);
}

// Guardar en favoritos
function saveFavorite() {
  if (!currentApod) return;

  if (favorites.some(fav => fav.date === currentApod.date)) {
    alert("✅ Esta imagen ya está en favoritos");
    return;
  }

  favorites.unshift(currentApod);
  localStorage.setItem("apodFavorites", JSON.stringify(favorites));
  renderFavorites();
  alert("⭐ ¡Guardado en favoritos!");
}

// Renderizar lista de favoritos
function renderFavorites() {
  favoritesList.innerHTML = "";

  if (favorites.length === 0) {
    favoritesList.innerHTML = `<li style="padding:20px; text-align:center; opacity:0.6;">Aún no tienes favoritos</li>`;
    return;
  }

  favorites.forEach((fav, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${fav.date}</strong><br>
        <small>${fav.title}</small>
      </div>
      <button class="remove-btn" data-index="${index}">🗑️</button>
    `;

    li.addEventListener("click", (e) => {
      if (!e.target.classList.contains("remove-btn")) {
        displayApod(fav);
        dateInput.value = fav.date;
      }
    });

    favoritesList.appendChild(li);
  });
}

// Eventos
fetchBtn.addEventListener("click", handleSearch);
dateInput.addEventListener("change", handleSearch);
favoriteBtn.addEventListener("click", saveFavorite);

// Eliminar favorito
favoritesList.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-btn")) {
    const index = parseInt(e.target.dataset.index);
    favorites.splice(index, 1);
    localStorage.setItem("apodFavorites", JSON.stringify(favorites));
    renderFavorites();
  }
});

// Inicializar la aplicación
window.onload = () => {
  loadTodaysApod();
  renderFavorites();
};