const byId = (id) => document.getElementById(id);
const canvas = byId("preview");
const width = canvas.width;
const height = canvas.height;
const margin = Math.ceil(width * 0.08);
const context = canvas.getContext("2d");
const carSelect = byId("car-select");
const previous = byId("previous");
const next = byId("next");
const badge = byId("fit-status");
const carGuide = byId("car-guide");
const message = byId("preview-message");
const controls = byId("edit-controls");
const approve = byId("approve");
const download = byId("download-png");
const exportButton = byId("export");
const saveStatus = byId("save-status");
const scaleInput = byId("scale");
const xInput = byId("position-x");
const yInput = byId("position-y");
const storageKey = "galeria-automotiva:enquadramentos:v1";
const approvalKey = (path) => `${storageKey}:${path}`;
const sourceRoot = new URL(document.documentElement.dataset.sourceRoot || "./", document.baseURI);
const defaultSaveStatus = "A aprovação fica salva neste navegador.";
const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

let cars = [];
let index = -1;
let source;
let placement;
const approvals = new Map();
let request;
let drag;
const drafts = new Map();
const loadedHashes = new Map();

function readApproval(path) {
  try {
    const record = JSON.parse(localStorage.getItem(approvalKey(path)));
    if (record?.path === path && record.placement) approvals.set(path, record);
    else approvals.delete(path);
  } catch {
    approvals.delete(path);
  }
}

function approvedFor(path) {
  const record = approvals.get(path);
  const hash = loadedHashes.get(path);
  return record && (!hash || record.sourceSha256 === hash) ? record : null;
}

function visibleBounds(image) {
  const scan = document.createElement("canvas");
  scan.width = image.naturalWidth;
  scan.height = image.naturalHeight;
  const scanContext = scan.getContext("2d", { willReadFrequently: true });
  scanContext.drawImage(image, 0, 0);
  const { data } = scanContext.getImageData(0, 0, scan.width, scan.height);
  let left = scan.width;
  let top = scan.height;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < scan.height; y++) {
    for (let x = 0; x < scan.width; x++) {
      if (data[(y * scan.width + x) * 4 + 3] < 24) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x + 1);
      bottom = Math.max(bottom, y + 1);
    }
  }

  if (right <= left || bottom <= top) throw new Error("PNG sem conteúdo visível");
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function originalPlacement(image, bounds) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  return {
    scale,
    cx: width / 2 + (bounds.x + (bounds.width - image.naturalWidth) / 2) * scale,
    cy: height / 2 + (bounds.y + (bounds.height - image.naturalHeight) / 2) * scale,
  };
}

function fitScale(bounds) {
  return Math.min((width - 2 * margin) / bounds.width, (height - 2 * margin) / bounds.height);
}

function visibleRect(bounds, frame) {
  const w = bounds.width * frame.scale;
  const h = bounds.height * frame.scale;
  return { x: frame.cx - w / 2, y: frame.cy - h / 2, width: w, height: h };
}

function isInside(rect) {
  const tolerance = 1e-6;
  return rect.x >= margin - tolerance && rect.y >= margin - tolerance
    && rect.x + rect.width <= width - margin + tolerance
    && rect.y + rect.height <= height - margin + tolerance;
}

function imageRect(asset, frame) {
  const rect = visibleRect(asset.bounds, frame);
  return {
    x: rect.x - asset.bounds.x * frame.scale,
    y: rect.y - asset.bounds.y * frame.scale,
    width: asset.image.naturalWidth * frame.scale,
    height: asset.image.naturalHeight * frame.scale,
  };
}

function draw(target, asset, frame) {
  const rect = imageRect(asset, frame);
  target.clearRect(0, 0, width, height);
  target.imageSmoothingQuality = "high";
  target.drawImage(asset.image, rect.x, rect.y, rect.width, rect.height);
}

function renderProgress() {
  const count = cars.filter((car) => approvedFor(car.image)).length;
  const progress = byId("review-progress");
  progress.max = Math.max(cars.length, 1);
  progress.value = count;
  byId("progress-label").textContent = cars.length ? `${count} de ${cars.length} aprovados` : "Acervo indisponível";
  exportButton.disabled = count === 0;
}

function updateOption(car, i) {
  const label = `${car.name} · ${car.year}`;
  carSelect.options[i].textContent = approvedFor(car.image) ? `✓ ${label}` : label;
}

function renderPreview() {
  draw(context, source, placement);
  const rect = visibleRect(source.bounds, placement);
  const inside = isInside(rect);
  const record = approvedFor(cars[index].image);
  const isSaved = record && ["scale", "cx", "cy"].every((key) => record.placement[key] === placement[key]);

  for (const [key, value] of Object.entries(rect)) carGuide.setAttribute(key, value);
  carGuide.setAttribute("visibility", "visible");
  carGuide.dataset.outside = String(!inside);
  badge.dataset.outside = String(!inside);
  badge.textContent = isSaved ? "Aprovado" : inside ? "Dentro do grid" : "Fora do grid";
  badge.hidden = false;
  approve.disabled = !inside || Boolean(isSaved);
  download.disabled = !record;

  const relativeScale = placement.scale / source.original.scale * 100;
  const horizontal = (placement.cx / width - 0.5) * 100;
  const vertical = (placement.cy / height - 0.5) * 100;
  for (const [input, value] of [[scaleInput, relativeScale], [xInput, horizontal], [yInput, vertical]]) {
    input.value = value;
    byId(`${input.id}-value`).textContent = `${numberFormat.format(value)}%`;
  }
}

function updatePlacement(frame) {
  placement = frame;
  drafts.set(cars[index].image, { sourceSha256: source.hash, placement });
  saveStatus.textContent = approvedFor(cars[index].image)
    ? "Alteração em prévia. O PNG disponível é o da última aprovação."
    : defaultSaveStatus;
  renderPreview();
}

async function loadSource(car, signal) {
  const response = await fetch(new URL(car.image, sourceRoot), { signal });
  if (!response.ok) throw new Error("Imagem indisponível");
  const blob = await response.blob();
  const hashBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
  const hash = Array.from(hashBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    signal.throwIfAborted();
    const bounds = visibleBounds(image);
    return { image, bounds, hash, original: originalPlacement(image, bounds) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function openCar(newIndex) {
  if (!cars[newIndex] || index === newIndex) return;
  request?.abort();
  request = new AbortController();
  const { signal } = request;
  index = newIndex;
  const car = cars[index];
  try {
    localStorage.setItem(storageKey, car.image);
  } catch {
    // Navigation is still available when browser storage is blocked.
  }

  drag = undefined;
  source = undefined;
  canvas.classList.remove("is-dragging");
  delete canvas.dataset.ready;
  carSelect.selectedIndex = index;
  previous.disabled = index === 0;
  next.disabled = index === cars.length - 1;
  byId("car-position").textContent = `${index + 1} / ${cars.length}`;
  byId("car-title").textContent = car.name;
  byId("car-meta").textContent = `${car.year} · ${car.bodyType} · ${car.filename}`;
  canvas.setAttribute("aria-label", `Prévia do enquadramento de ${car.name}`);
  context.clearRect(0, 0, width, height);
  carGuide.setAttribute("visibility", "hidden");
  badge.hidden = true;
  controls.disabled = approve.disabled = download.disabled = true;
  saveStatus.textContent = defaultSaveStatus;
  message.textContent = "Carregando imagem…";
  message.hidden = false;
  byId("stage").setAttribute("aria-busy", "true");

  try {
    const asset = await loadSource(car, signal);
    if (signal.aborted) return;
    source = asset;
    loadedHashes.set(car.image, asset.hash);
    const saved = approvedFor(car.image);
    const draft = drafts.get(car.image);
    placement = draft?.sourceSha256 === asset.hash ? draft.placement : saved?.placement || asset.original;
    const fitPercent = fitScale(asset.bounds) / asset.original.scale * 100;
    scaleInput.min = Math.min(1, fitPercent);
    scaleInput.max = Math.max(200, Math.ceil(fitPercent * 1.4));
    message.hidden = true;
    controls.disabled = false;
    canvas.dataset.ready = "true";
    if (saved) saveStatus.textContent = "Aprovação salva neste navegador.";
    else if (approvals.has(car.image)) saveStatus.textContent = "O PNG de origem mudou. Revise o enquadramento novamente.";
    updateOption(car, index);
    renderProgress();
    renderPreview();
  } catch {
    if (!signal.aborted) message.textContent = "Não foi possível abrir este PNG. Você pode avançar para outro carro.";
  } finally {
    if (!signal.aborted) byId("stage").setAttribute("aria-busy", "false");
  }
}

previous.addEventListener("click", () => openCar(index - 1));
next.addEventListener("click", () => openCar(index + 1));
carSelect.addEventListener("change", () => openCar(carSelect.selectedIndex));
byId("auto-fit").addEventListener("click", () => updatePlacement({
  scale: fitScale(source.bounds),
  cx: width / 2,
  cy: height / 2,
}));
byId("reset").addEventListener("click", () => updatePlacement(source.original));

scaleInput.addEventListener("input", () => updatePlacement({
  ...placement, scale: Number(scaleInput.value) / 100 * source.original.scale,
}));
xInput.addEventListener("input", () => updatePlacement({ ...placement, cx: (0.5 + Number(xInput.value) / 100) * width }));
yInput.addEventListener("input", () => updatePlacement({ ...placement, cy: (0.5 + Number(yInput.value) / 100) * height }));

canvas.addEventListener("pointerdown", (event) => {
  if (!source || event.button !== 0 || drag) return;
  canvas.setPointerCapture(event.pointerId);
  const rect = canvas.getBoundingClientRect();
  drag = {
    pointerId: event.pointerId, x: event.clientX, y: event.clientY,
    cx: placement.cx, cy: placement.cy, ratioX: width / rect.width, ratioY: height / rect.height,
  };
  canvas.classList.add("is-dragging");
});
canvas.addEventListener("pointermove", (event) => {
  if (drag?.pointerId !== event.pointerId) return;
  updatePlacement({
    ...placement,
    cx: Math.min(width, Math.max(0, drag.cx + (event.clientX - drag.x) * drag.ratioX)),
    cy: Math.min(height, Math.max(0, drag.cy + (event.clientY - drag.y) * drag.ratioY)),
  });
});
canvas.addEventListener("lostpointercapture", () => {
  drag = undefined;
  canvas.classList.remove("is-dragging");
});

approve.addEventListener("click", () => {
  if (!source || !isInside(visibleRect(source.bounds, placement))) return;
  const car = cars[index];
  const record = {
    path: car.image,
    filename: car.filename,
    sourceSha256: source.hash,
    sourceWidth: source.image.naturalWidth,
    sourceHeight: source.image.naturalHeight,
    placement,
    draw: imageRect(source, placement),
  };

  try {
    localStorage.setItem(approvalKey(car.image), JSON.stringify(record));
    approvals.set(car.image, record);
    saveStatus.textContent = "Aprovação salva. Você já pode avançar.";
    updateOption(car, index);
    renderProgress();
    renderPreview();
  } catch {
    saveStatus.textContent = "O navegador não conseguiu salvar a aprovação. Libere o armazenamento e tente de novo.";
  }
});

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

download.addEventListener("click", () => {
  const record = approvedFor(cars[index].image);
  if (!source || !record) return;
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  draw(output.getContext("2d"), source, record.placement);
  output.toBlob((blob) => {
    if (blob) downloadFile(blob, record.filename);
  }, "image/png");
});

exportButton.addEventListener("click", () => {
  const records = cars.map((car) => approvedFor(car.image)).filter(Boolean);
  const data = JSON.stringify({
    version: 1,
    repository: "thiagohtr2/galeria-automotiva",
    canvas: { width, height, margin },
    approvals: records,
  }, null, 2);
  downloadFile(new Blob([data], { type: "application/json" }), "enquadramentos-aprovados.json");
});

window.addEventListener("storage", (event) => {
  const changedIndex = cars.findIndex((car) => approvalKey(car.image) === event.key);
  if (changedIndex < 0) return;
  const car = cars[changedIndex];
  readApproval(car.image);
  updateOption(car, changedIndex);
  renderProgress();
  if (changedIndex === index && source) renderPreview();
});

async function start() {
  try {
    const response = await fetch(new URL("cars.json", sourceRoot));
    if (!response.ok) throw new Error("Acervo indisponível");
    const manifest = await response.json();
    cars = manifest.cars;
    if (!cars.length) throw new Error("Acervo vazio");
    carSelect.replaceChildren(...cars.map(() => new Option()));
    cars.forEach((car, i) => {
      readApproval(car.image);
      updateOption(car, i);
    });
    carSelect.disabled = false;
    renderProgress();
    let resumed = 0;
    try {
      const lastCar = localStorage.getItem(storageKey);
      resumed = Math.max(0, cars.findIndex((car) => car.image === lastCar));
    } catch {
      // Navigation is still available when browser storage is blocked.
    }
    openCar(resumed);
  } catch {
    message.textContent = "Não foi possível carregar o acervo. Recarregue a página para tentar novamente.";
    byId("stage").setAttribute("aria-busy", "false");
    renderProgress();
  }
}

start();
