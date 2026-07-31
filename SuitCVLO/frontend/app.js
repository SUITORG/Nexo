const API = window.location.origin;
const API_TOKEN = '';  // vacio = sin auth; configurar desde .env para produccion

function apiHeaders(extra) {
  const h = extra || {};
  if (API_TOKEN) h['Authorization'] = 'Bearer ' + API_TOKEN;
  return h;
}

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const folderInput = document.getElementById('folder-input');
const btnFiles = document.getElementById('btn-select-files');
const btnFolder = document.getElementById('btn-select-folder');
const dropzoneContent = document.getElementById('dropzone-content');
const dropzonePreview = document.getElementById('dropzone-preview');
const previewImg = document.getElementById('preview-img');
const previewFilename = document.getElementById('preview-filename');
const uploadStatus = document.getElementById('upload-status');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const resultsSection = document.getElementById('results-section');
const resultsBody = document.getElementById('results-body');
const resultsSummary = document.getElementById('results-summary');
const downloads = document.getElementById('downloads');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');

let currentResults = null;

dropzone.addEventListener('click', () => fileInput.click());
btnFiles.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
btnFolder.addEventListener('click', (e) => { e.stopPropagation(); folderInput.click(); });

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('drag-over');
});
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) handleFiles(files);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) handleFiles(Array.from(fileInput.files));
});

folderInput.addEventListener('change', () => {
  if (folderInput.files.length > 0) handleFiles(Array.from(folderInput.files));
});

function handleFiles(files) {
  hideAllSections();
  const zips = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
  const photos = files.filter(f => !f.name.toLowerCase().endsWith('.zip') && /\.(jpg|jpeg|png|webp|cr3|arw|dng|tiff?|bmp|heic|heif)$/i.test(f.name));
  if (zips.length > 0 && photos.length > 0) {
    showError('No mezcles .zip y fotos. Sube uno de los dos tipos a la vez.');
    return;
  }
  if (zips.length > 1) {
    showError('Solo puedes subir un .zip a la vez.');
    return;
  }
  if (zips.length === 1) {
    handleFile(zips[0]);
    return;
  }
  if (photos.length === 0) {
    showError('No se encontraron archivos válidos (.jpg, .png, .webp, .cr3, .arw, .dng, .tiff, .bmp, .heic, .zip)');
    return;
  }
  if (photos.length === 1) {
    handleFile(photos[0]);
  } else {
    uploadMultiplePhotos(photos);
  }
}

function handleFile(file) {
  const isZip = file.name.toLowerCase().endsWith('.zip');
  showPreview(file, isZip);
  setStatus('info', `Subiendo ${file.name}...`);
  if (isZip) {
    uploadZip(file);
  } else {
    uploadPhoto(file);
  }
}

function showPreview(file, isZip) {
  dropzone.classList.add('has-file');
  dropzoneContent.classList.add('hidden');
  dropzonePreview.classList.remove('hidden');
  previewFilename.textContent = file.name;
  if (!isZip) {
    const reader = new FileReader();
    reader.onload = (e) => { previewImg.src = e.target.result; };
    reader.readAsDataURL(file);
    previewImg.classList.remove('hidden');
  } else {
    previewImg.classList.add('hidden');
  }
}

async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData, headers: apiHeaders() });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || `Error del servidor (HTTP ${res.status})`);
    }
    const data = await res.json();
    setStatus('success', `Procesado: ${data.image}`);
    currentResults = normalizeResults([data]);
    renderResults(currentResults);
  } catch (err) {
    showError(err.message);
  }
}

async function uploadMultiplePhotos(files) {
  progressContainer.classList.remove('hidden');
  const allResults = [];
  const total = files.length;
  let hasError = false;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    progressText.textContent = `Subiendo ${i+1}/${total}: ${f.name}`;
    progressFill.style.width = `${((i) / total) * 100}%`;
    try {
      const formData = new FormData();
      formData.append('file', f);
      const res = await fetch(`${API}/upload`, { method: 'POST', body: formData, headers: apiHeaders() });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `HTTP ${res.status}`);
      }
      const data = await res.json();
      allResults.push(data);
    } catch (err) {
      showError(`Error en ${f.name}: ${err.message}`);
      hasError = true;
      break;
    }
  }
  if (hasError) return;
  progressFill.style.width = '100%';
  progressText.textContent = 'Completado';
  setStatus('success', `Procesadas ${total} fotos`);
  currentResults = normalizeResults(allResults);
  renderResults(currentResults);
}

async function uploadZip(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`${API}/upload/zip`, { method: 'POST', body: formData, headers: apiHeaders() });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || `Error del servidor (HTTP ${res.status})`);
    }
    const { job_id } = await res.json();
    progressContainer.classList.remove('hidden');
    pollJob(job_id);
  } catch (err) {
    showError(err.message);
  }
}

async function pollJob(jobId) {
  try {
    const res = await fetch(`${API}/upload/zip/status/${jobId}`, { headers: apiHeaders() });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || `HTTP ${res.status}`);
    }
    const job = await res.json();
    progressText.textContent = job.progress !== '0/0' ? `Procesando ${job.progress}` : 'Extrayendo archivos...';
    if (job.progress !== '0/0') {
      const [done, total] = job.progress.split('/').map(Number);
      const pct = total > 0 ? (done / total) * 100 : 0;
      progressFill.style.width = `${Math.min(pct, 100)}%`;
    } else {
      progressFill.style.width = '10%';
    }
    if (job.status === 'done') {
      progressFill.style.width = '100%';
      progressText.textContent = 'Completado';
      setStatus('success', 'Procesamiento completo');
      await fetchResult(jobId);
    } else if (job.status === 'error') {
      showError(job.error || 'Error desconocido');
    } else {
      setTimeout(() => pollJob(jobId), 1500);
    }
  } catch (err) {
    showError(err.message);
  }
}

async function fetchResult(jobId) {
  try {
    const res = await fetch(`${API}/upload/zip/result/${jobId}`, { headers: apiHeaders() });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    currentResults = normalizeResults(results);
    renderResults(currentResults);
  } catch (err) {
    showError(err.message);
  }
}

function normalizeResults(results) {
  if (!Array.isArray(results)) return [];
  return results.map(r => {
    if (r.error) {
      return { image: r.image || 'unknown', error: r.error, billboards: [] };
    }
    if (Array.isArray(r.billboards)) return r;
    const bbs = [];
    if (Array.isArray(r.detected_objects)) {
      r.detected_objects.forEach(d => {
        bbs.push({
          bbox: d.bbox || [],
          confidence: d.confidence || 0,
          method: d.method || 'yolo',
          format: d.format || '',
          area_ratio: d.area_ratio || 0,
          ocr_text: d.ocr_text || r.panoramic_text || '',
          brand: d.brand || '',
          campaign_type: d.campaign_type || '',
          campaign_detail: d.campaign_detail || r.panoramic_text || '',
        });
      });
    }
    return {
      image: r.image || r.image_path || 'unknown',
      original_filename: r.original_filename || null,
      captured_at: r.captured_at || null,
      gps_lat: r.gps_lat || null,
      gps_lng: r.gps_lng || null,
      address: r.address || null,
      address_error: r.address_error || null,
      billboards: bbs,
    };
  });
}

function renderResults(results) {
  if (!Array.isArray(results) || results.length === 0) {
    showError('No se recibieron resultados');
    return;
  }
  resultsSection.classList.remove('hidden');

  const totalImages = results.length;
  const totalBillboards = results.reduce((s, r) => s + (Array.isArray(r.billboards) ? r.billboards.length : 0), 0);
  const brands = new Set();
  results.forEach(r => {
    if (Array.isArray(r.billboards)) {
      r.billboards.forEach(b => { if (b.brand && b.brand !== 'unknown') brands.add(b.brand); });
    }
  });

  resultsSummary.innerHTML = `
    <div class="summary-card">
      <div class="number">${totalImages}</div>
      <div class="label">Imágenes</div>
    </div>
    <div class="summary-card">
      <div class="number">${totalBillboards}</div>
      <div class="label">Anuncios</div>
    </div>
    <div class="summary-card">
      <div class="number">${brands.size}</div>
      <div class="label">Marcas</div>
    </div>
  `;

  downloads.innerHTML = `
    <button class="btn btn-primary" onclick="downloadPDF()">PDF</button>
    <button class="btn btn-success" onclick="downloadCSV()">CSV</button>
    <button class="btn btn-outline" onclick="downloadGeoJSON()">GeoJSON</button>
  `;

  resultsBody.innerHTML = '';
  results.forEach(r => {
    const bbs = Array.isArray(r.billboards) ? r.billboards : [];
    if (r.error) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${imageName(r.image)}<br>${imageThumb(r.image)}</td><td colspan="11" style="color:var(--error)">Error: ${escapeHtml(r.error)}</td>`;
      resultsBody.appendChild(tr);
    } else if (bbs.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${imageName(r.image)}<br>${imageThumb(r.image)}</td><td colspan="11" style="color:var(--text-dim)">Sin anuncios detectados</td>`;
      resultsBody.appendChild(tr);
    } else {
      bbs.forEach(bb => {
        const tr = document.createElement('tr');
        const formatLabel = escapeHtml(bb.format ? bb.format.charAt(0).toUpperCase() + bb.format.slice(1) : '—');
        const brandVal = bb.brand && bb.brand !== 'unknown' ? escapeHtml(bb.brand) : null;
        const brandHtml = brandVal
          ? `<span class="brand">${brandVal}</span>`
          : '<span style="color:var(--text-dim)">—</span>';
        const fecha = r.captured_at ? r.captured_at.substring(0, 10) : '—';
        const hora = r.captured_at ? r.captured_at.substring(11, 19) : '—';
        const dirLabel = r.address
          ? escapeHtml(r.address.substring(0, 30)) + (r.address.length > 30 ? '...' : '')
          : r.address_error === 'no_gps' ? '<span style="color:var(--text-dim)">Sin GPS</span>'
          : r.address_error ? '<span style="color:var(--error)">Error geo</span>'
          : '<span style="color:var(--text-dim)">—</span>';
        const dirTitle = r.address ? escapeHtml(r.address) : r.address_error ? 'address_error: ' + escapeHtml(r.address_error) : '—';
        const cat = escapeHtml(bb.campaign_type || bb.classification || '—');
        const detail = escapeHtml(bb.campaign_detail || bb.campaign_type || '—');
        tr.innerHTML = `
          <td>${imageName(r.image)}<br>${imageThumb(r.image)}</td>
          <td style="font-size:0.85em;word-break:break-all;max-width:160px">${escapeHtml(r.original_filename || '—')}</td>
          <td>${fecha}</td>
          <td>${hora}</td>
          <td title="${dirTitle}">${dirLabel}</td>
          <td>${cat}</td>
          <td>${brandHtml}</td>
          <td><span class="format-tag">${formatLabel}</span></td>
          <td>${detail}</td>
          <td>${(bb.confidence * 100).toFixed(0)}%</td>
          <td><span class="ocr-text" title="${escapeHtml(bb.ocr_text || '')}">${escapeHtml((bb.ocr_text || '').substring(0, 80))}${(bb.ocr_text || '').length > 80 ? '...' : ''}</span></td>
          <td style="font-size:0.85em;white-space:nowrap">${r.gps_lat && r.gps_lng ? `${r.gps_lat.toFixed(4)}, ${r.gps_lng.toFixed(4)}` : '<span style="color:var(--text-dim)">—</span>'}</td>
        `;
        resultsBody.appendChild(tr);
      });
    }
  });

  window.scrollTo({ top: resultsSection.offsetTop - 20, behavior: 'smooth' });
}

async function downloadPDF() {
  const url = `${API}/reports/pdf?user_id=frontend`;
  try {
    const res = await fetch(url, { headers: apiHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    downloadBlob(blob, 'suitcvlo_report.pdf', 'application/pdf');
  } catch (err) {
    showError('Error descargando PDF: ' + err.message);
  }
}

function downloadCSV() {
  const rows = [['imagen','archivo_original','fecha','hora','direccion','address_error','categoria','marca','formato','campania','confianza','texto_ocr','lat','lng']];
  (currentResults || []).forEach(r => {
    const bbs = Array.isArray(r.billboards) ? r.billboards : [];
    bbs.forEach(bb => {
      const fecha = r.captured_at ? r.captured_at.substring(0, 10) : '';
      const hora = r.captured_at ? r.captured_at.substring(11, 19) : '';
      rows.push([r.image, r.original_filename || '', fecha, hora, r.address || '', r.address_error || '', bb.campaign_type || '', bb.brand || '', bb.format || '', bb.campaign_detail || '', (bb.confidence || 0).toFixed(2), (bb.ocr_text || '').replace(/"/g, '""'), r.gps_lat ?? '', r.gps_lng ?? '']);
    });
  });
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  downloadBlob(csv, 'suitcvlo_results.csv', 'text/csv');
}

function downloadGeoJSON() {
  const features = [];
  (currentResults || []).forEach(r => {
    if (!r.gps_lat || !r.gps_lng) return;
    const bbs = Array.isArray(r.billboards) ? r.billboards : [];
    bbs.forEach(bb => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.gps_lng, r.gps_lat] },
        properties: {
          image: r.image,
          brand: bb.brand || '',
          format: bb.format || '',
          campaign: bb.campaign_detail || '',
          confidence: bb.confidence || 0,
          ocr_text: (bb.ocr_text || '').substring(0, 200),
        }
      });
    });
  });
  const geojson = JSON.stringify({ type: 'FeatureCollection', features }, null, 2);
  downloadBlob(geojson, 'suitcvlo_results.geojson', 'application/geo+json');
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function setStatus(type, msg) {
  uploadStatus.className = `status ${type}`;
  uploadStatus.textContent = msg;
  uploadStatus.classList.remove('hidden');
}

function showError(msg) {
  errorSection.classList.remove('hidden');
  errorMessage.textContent = msg;
  setStatus('error', msg);
  progressContainer.classList.add('hidden');
}

function hideAllSections() {
  resultsSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  uploadStatus.classList.add('hidden');
  progressContainer.classList.add('hidden');
}

function imageName(name) {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return name.substring(0, 12);
  const base = name.substring(0, 8);
  const ext = name.substring(dot);
  return base + '..' + ext;
}

function imageThumb(name) {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '');
  return `<img src="/uploads/${safe}" style="width:64px;height:48px;object-fit:cover;border-radius:4px;margin-top:4px;display:block" onerror="this.style.display='none'">`;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
