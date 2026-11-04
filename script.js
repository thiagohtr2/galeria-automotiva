const grid = document.querySelector("#car-grid");
const searchInput = document.querySelector("#search");
const filters = [...document.querySelectorAll(".filter")];
const visibleCount = document.querySelector("#visible-count");
const collectionCount = document.querySelector("#collection-count");
const emptyState = document.querySelector("#empty-state");
const clearFilters = document.querySelector("#clear-filters");
const viewer = document.querySelector("#viewer");
const viewerImage = document.querySelector("#viewer-image");
const viewerTitle = document.querySelector("#viewer-title");
const viewerMeta = document.querySelector("#viewer-meta");
const viewerFile = document.querySelector("#viewer-file");
const downloadImage = document.querySelector("#download-image");
const copyLink = document.querySelector("#copy-link");

let cars = [];
let activeFilter = "Todos";
let activeCar = null;

const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const cardTemplate = (car) => `
  <article class="car-card">
    <button class="card-visual checkerboard" type="button" data-open="${car.id}" aria-label="Ampliar ${car.name}">
      <span class="zoom-label">Ampliar</span>
      <img src="${car.image}" alt="${car.alt}" loading="lazy" width="${car.width}" height="${car.height}" />
    </button>
    <div class="card-content">
      <div>
        <p class="card-kicker">${car.year} · ${car.bodyType}</p>
        <h3 class="card-title">${car.name}</h3>
      </div>
      <a class="download-small" href="${car.image}" download="${car.filename}" aria-label="Baixar ${car.name}">↓</a>
    </div>
  </article>
`;

function filteredCars() {
  const query = normalize(searchInput.value.trim());
  return cars.filter((car) => {
    const matchesFilter = activeFilter === "Todos" || car.bodyType === activeFilter;
    const matchesQuery = normalize(`${car.name} ${car.year} ${car.bodyType}`).includes(query);
    return matchesFilter && matchesQuery;
  });
}

function render() {
  const visibleCars = filteredCars();
  grid.innerHTML = visibleCars.map(cardTemplate).join("");
  visibleCount.textContent = visibleCars.length;
  emptyState.hidden = visibleCars.length !== 0;
  grid.hidden = visibleCars.length === 0;
}

function resetFilters() {
  activeFilter = "Todos";
  searchInput.value = "";
  filters.forEach((button) => button.classList.toggle("is-active", button.dataset.filter === "Todos"));
  render();
}

function openViewer(car) {
  activeCar = car;
  viewerImage.src = car.image;
  viewerImage.alt = car.alt;
  viewerTitle.textContent = car.name;
  viewerMeta.textContent = `${car.year} · ${car.bodyType} · ${car.width} × ${car.height}`;
  viewerFile.textContent = car.filename;
  downloadImage.href = car.image;
  downloadImage.download = car.filename;
  copyLink.textContent = "Copiar URL";
  viewer.showModal();
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

searchInput.addEventListener("input", render);
clearFilters.addEventListener("click", resetFilters);

grid.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-open]");
  if (!trigger) return;
  const car = cars.find((item) => item.id === trigger.dataset.open);
  if (car) openViewer(car);
});

document.querySelector(".viewer-close").addEventListener("click", () => viewer.close());
viewer.addEventListener("click", (event) => {
  if (event.target === viewer) viewer.close();
});

copyLink.addEventListener("click", async () => {
  if (!activeCar) return;
  const url = new URL(activeCar.image, window.location.href).href;
  try {
    await navigator.clipboard.writeText(url);
    copyLink.textContent = "URL copiada";
  } catch {
    copyLink.textContent = "Não foi possível copiar";
  }
});

fetch("cars.json")
  .then((response) => {
    if (!response.ok) throw new Error("Manifesto indisponível");
    return response.json();
  })
  .then((manifest) => {
    cars = manifest.cars;
    collectionCount.textContent = cars.length;
    render();
  })
  .catch(() => {
    grid.innerHTML = '<p class="results-count">Não foi possível carregar o acervo.</p>';
  });
