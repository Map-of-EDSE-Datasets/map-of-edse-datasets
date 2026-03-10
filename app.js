// ============================================================
// EDSE Dataset Map — Main Application
// ============================================================

let datasets = [];
let activeFilters = { domain: [], lifecycle: [], dataType: [], format: [] };
let graphNetwork = null;
let selectedDatasetId = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
    const resp = await fetch('datasets.json');
    datasets = await resp.json();
    buildFilters();
    renderTable();
    renderDashboard();
    updateResultCount();
    setupViewToggle();
    setupGraphLayers();
    setupDetailPanel();
    setupAboutModal();
    loadClustrMapsGlobe();
});

// ============================================================
// FILTERS
// ============================================================
function buildFilters() {
    const dims = [
        { key: 'domain', containerId: 'filter-domain' },
        { key: 'lifecycle', containerId: 'filter-lifecycle' },
        { key: 'dataType', containerId: 'filter-dataType' },
        { key: 'format', containerId: 'filter-format' },
    ];

    dims.forEach(({ key, containerId }) => {
        const container = document.getElementById(containerId);
        const values = [...new Set(datasets.map(d => d[key]))].sort();

        values.forEach(val => {
            const count = datasets.filter(d => d[key] === val).length;
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" data-dim="${key}" value="${val}">
                <span>${val}</span>
                <span class="filter-count">${count}</span>
            `;
            container.appendChild(label);
        });
    });

    // Listen for checkbox changes
    document.querySelectorAll('#filters-panel input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', onFilterChange);
    });

    // Clear all
    document.getElementById('clear-filters').addEventListener('click', () => {
        document.querySelectorAll('#filters-panel input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        activeFilters = { domain: [], lifecycle: [], dataType: [], format: [] };
        applyFilters();
    });
}

function onFilterChange(e) {
    const dim = e.target.dataset.dim;
    const val = e.target.value;
    if (e.target.checked) {
        activeFilters[dim].push(val);
    } else {
        activeFilters[dim] = activeFilters[dim].filter(v => v !== val);
    }
    applyFilters();
}

function getFilteredDatasets() {
    return datasets.filter(d => {
        for (const dim of Object.keys(activeFilters)) {
            if (activeFilters[dim].length > 0 && !activeFilters[dim].includes(d[dim])) {
                return false;
            }
        }
        return true;
    });
}

function applyFilters() {
    renderTable();
    updateResultCount();
    if (document.getElementById('dashboard-view').classList.contains('active')) {
        renderDashboard();
    }
    if (document.getElementById('graph-view').classList.contains('active')) {
        renderGraph();
    }
    updateFilterCounts();
}

function updateFilterCounts() {
    const filtered = getFilteredDatasets();
    document.querySelectorAll('#filters-panel input[type="checkbox"]').forEach(cb => {
        const dim = cb.dataset.dim;
        const val = cb.value;
        const count = filtered.filter(d => d[dim] === val).length;
        const countSpan = cb.parentElement.querySelector('.filter-count');
        countSpan.textContent = count;
    });
}

function updateResultCount() {
    const filtered = getFilteredDatasets();
    document.getElementById('result-count').textContent =
        `${filtered.length} of ${datasets.length} datasets`;
}

// ============================================================
// TABLE VIEW
// ============================================================
function renderTable() {
    const tbody = document.getElementById('dataset-tbody');
    const filtered = getFilteredDatasets();

    tbody.innerHTML = filtered.map(d => `
        <tr data-id="${d.id}">
            <td>
                <div class="dataset-name">${d.name}</div>
                <div class="dataset-source">${d.source}</div>
            </td>
            <td><span class="dim-badge badge-domain">${d.domain}${d.subdomain ? ' / ' + d.subdomain : ''}</span></td>
            <td><span class="dim-badge badge-lifecycle">${d.lifecycle}</span></td>
            <td><span class="dim-badge badge-datatype">${d.dataType}</span></td>
            <td><span class="dim-badge badge-format">${d.format} (${d.formatDetail})</span></td>
            <td>${d.primaryUse}</td>
        </tr>
    `).join('');

    // Re-apply selection if a dataset is currently selected
    if (selectedDatasetId) {
        const selectedRow = tbody.querySelector(`tr[data-id="${selectedDatasetId}"]`);
        if (selectedRow) selectedRow.classList.add('selected');
    }

    // Row click -> detail
    tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', () => {
            const ds = datasets.find(d => d.id === row.dataset.id);
            showDetail(ds);
        });
    });
}

// ============================================================
// GRAPH VIEW
// ============================================================
// Get which graph layers are visible
function getVisibleLayers() {
    const layers = {};
    document.querySelectorAll('#graph-layers .layer-toggle').forEach(label => {
        const key = label.dataset.layer;
        const checked = label.querySelector('input').checked;
        layers[key] = checked;
    });
    return layers;
}

function renderGraph() {
    const container = document.getElementById('graph-container');
    const filtered = getFilteredDatasets();
    const layers = getVisibleLayers();

    const nodes = [];
    const edges = [];
    const addedNodes = new Set();

    // Color maps
    const dimColors = {
        domain: '#0d9488',
        lifecycle: '#d97706',
        dataType: '#2563eb',
        format: '#7c3aed',
    };

    filtered.forEach(d => {
        // Dataset node
        if (!addedNodes.has(d.id)) {
            nodes.push({
                id: d.id,
                label: d.name,
                shape: 'box',
                color: { background: '#e0f2fe', border: '#2563eb' },
                font: { size: 12, face: 'sans-serif', bold: true },
                margin: 8,
            });
            addedNodes.add(d.id);
        }

        // Taxonomy term nodes and edges (only if layer is visible)
        const termMap = {
            domain: d.domain,
            lifecycle: d.lifecycle,
            dataType: d.dataType,
            format: d.format,
        };

        Object.entries(termMap).forEach(([dim, val]) => {
            if (!layers[dim]) return;
            const nodeId = `${dim}::${val}`;
            if (!addedNodes.has(nodeId)) {
                nodes.push({
                    id: nodeId,
                    label: val,
                    shape: 'ellipse',
                    color: { background: dimColors[dim] + '22', border: dimColors[dim] },
                    font: { size: 10, color: dimColors[dim] },
                });
                addedNodes.add(nodeId);
            }
            edges.push({
                from: d.id,
                to: nodeId,
                color: { color: dimColors[dim] + '88' },
                width: 1,
            });
        });

        // Tool nodes (only if tools layer is visible)
        if (layers.tools) {
            (d.tools || []).forEach(tool => {
                const toolId = `tool::${tool}`;
                if (!addedNodes.has(toolId)) {
                    nodes.push({
                        id: toolId,
                        label: tool,
                        shape: 'diamond',
                        color: { background: '#fef3c7', border: '#d97706' },
                        font: { size: 9 },
                        size: 12,
                    });
                    addedNodes.add(toolId);
                }
                edges.push({
                    from: d.id,
                    to: toolId,
                    color: { color: '#d9770644' },
                    width: 0.5,
                    dashes: true,
                });
            });
        }
    });

    const data = { nodes, edges };
    const options = {
        physics: {
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
                gravitationalConstant: -40,
                centralGravity: 0.005,
                springLength: 120,
                springConstant: 0.04,
                damping: 0.4,
            },
            stabilization: { iterations: 150 },
        },
        interaction: {
            hover: true,
            tooltipDelay: 100,
        },
        layout: { improvedLayout: true },
    };

    if (graphNetwork) {
        graphNetwork.destroy();
    }
    graphNetwork = new vis.Network(container, data, options);

    // Click on dataset node -> show detail
    graphNetwork.on('click', params => {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const ds = datasets.find(d => d.id === nodeId);
            if (ds) showDetail(ds);
        }
    });
}

function setupGraphLayers() {
    document.querySelectorAll('#graph-layers .layer-toggle input').forEach(cb => {
        cb.addEventListener('change', () => {
            if (document.getElementById('graph-view').classList.contains('active')) {
                renderGraph();
            }
        });
    });
}

// ============================================================
// VIEW TOGGLE
// ============================================================
function setupViewToggle() {
    const tabs = [
        { btn: document.getElementById('btn-dashboard'), view: document.getElementById('dashboard-view'), onActivate: () => renderDashboard() },
        { btn: document.getElementById('btn-graph'), view: document.getElementById('graph-view'), onActivate: () => renderGraph() },
        { btn: document.getElementById('btn-table'), view: document.getElementById('table-view') },
    ];

    tabs.forEach(tab => {
        tab.btn.addEventListener('click', () => {
            tabs.forEach(t => {
                t.btn.classList.remove('active');
                t.view.classList.remove('active');
            });
            tab.btn.classList.add('active');
            tab.view.classList.add('active');
            if (tab.onActivate) tab.onActivate();
        });
    });
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function renderDashboard() {
    const container = document.getElementById('dashboard-content');
    const filtered = getFilteredDatasets();

    // Helper: count occurrences of a field
    function countBy(arr, key) {
        const counts = {};
        arr.forEach(d => {
            const val = d[key];
            counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }

    // Helper: render horizontal bar chart
    function barChart(entries, colorClass, maxVal) {
        return entries.map(([label, count]) => `
            <div class="dash-bar-row">
                <span class="dash-bar-label">${label}</span>
                <div class="dash-bar-track">
                    <div class="dash-bar-fill ${colorClass}" style="width: ${(count / maxVal) * 100}%"></div>
                </div>
                <span class="dash-bar-count">${count}</span>
            </div>
        `).join('');
    }

    // Compute stats
    const totalDatasets = filtered.length;
    const totalPubs = filtered.reduce((s, d) => s + (d.publications ? d.publications.length : 0), 0);
    const uniqueTools = [...new Set(filtered.flatMap(d => d.tools || []))];
    const years = filtered.map(d => d.year).filter(Boolean);
    const yearMin = years.length ? Math.min(...years) : '—';
    const yearMax = years.length ? Math.max(...years) : '—';

    const domainCounts = countBy(filtered, 'domain');
    const lifecycleCounts = countBy(filtered, 'lifecycle');
    const dataTypeCounts = countBy(filtered, 'dataType');
    const formatCounts = countBy(filtered, 'format');
    const maxCount = Math.max(...[domainCounts, lifecycleCounts, dataTypeCounts, formatCounts].flatMap(c => c.map(e => e[1])), 1);

    container.innerHTML = `
        <div class="dash-summary">
            <div class="dash-stat">
                <div class="dash-stat-value">${totalDatasets}</div>
                <div class="dash-stat-label">Datasets</div>
            </div>
            <div class="dash-stat">
                <div class="dash-stat-value">${totalPubs}</div>
                <div class="dash-stat-label">Publications</div>
            </div>
            <div class="dash-stat">
                <div class="dash-stat-value">${uniqueTools.length}</div>
                <div class="dash-stat-label">Tools</div>
            </div>
            <div class="dash-stat">
                <div class="dash-stat-value">${yearMin}–${yearMax}</div>
                <div class="dash-stat-label">Year Range</div>
            </div>
        </div>

        <div class="dash-grid">
            <div class="dash-card">
                <h3><span class="dim-icon dim-domain">&#9679;</span> Engineering Domain</h3>
                ${barChart(domainCounts, 'bar-domain', maxCount)}
            </div>
            <div class="dash-card">
                <h3><span class="dim-icon dim-lifecycle">&#9679;</span> Lifecycle Stage</h3>
                ${barChart(lifecycleCounts, 'bar-lifecycle', maxCount)}
            </div>
            <div class="dash-card">
                <h3><span class="dim-icon dim-datatype">&#9679;</span> Data Type</h3>
                ${barChart(dataTypeCounts, 'bar-datatype', maxCount)}
            </div>
            <div class="dash-card">
                <h3><span class="dim-icon dim-format">&#9679;</span> Data Format</h3>
                ${barChart(formatCounts, 'bar-format', maxCount)}
            </div>
        </div>
    `;
}

// ============================================================
// DETAIL PANEL
// ============================================================
function setupDetailPanel() {
    document.getElementById('close-detail').addEventListener('click', () => {
        document.getElementById('detail-panel').classList.add('hidden');
        clearSelection();
    });
}

// ============================================================
// ABOUT / SPLASH MODAL
// ============================================================
function setupAboutModal() {
    const modal = document.getElementById('about-modal');
    const btnAbout = document.getElementById('btn-about');
    const closeAbout = document.getElementById('close-about');

    // Close modal and trigger orange highlight on button
    function closeModal() {
        modal.classList.add('hidden');
        btnAbout.classList.add('highlight');
        setTimeout(() => {
            btnAbout.classList.remove('highlight');
        }, 3000);
    }

    closeAbout.addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Re-open modal
    btnAbout.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });
}

function clearSelection() {
    selectedDatasetId = null;
    // Clear table highlight
    const prev = document.querySelector('#dataset-tbody tr.selected');
    if (prev) prev.classList.remove('selected');
    // Clear graph highlight
    if (graphNetwork) {
        graphNetwork.unselectAll();
    }
}

function highlightTableRow(id) {
    const prev = document.querySelector('#dataset-tbody tr.selected');
    if (prev) prev.classList.remove('selected');
    const row = document.querySelector(`#dataset-tbody tr[data-id="${id}"]`);
    if (row) {
        row.classList.add('selected');
        // Only scroll if table view is visible
        if (document.getElementById('table-view').classList.contains('active')) {
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

function highlightGraphNode(id) {
    if (!graphNetwork) return;
    // Select the dataset node and its directly connected nodes
    const connectedNodes = graphNetwork.getConnectedNodes(id) || [];
    const connectedEdges = graphNetwork.getConnectedEdges(id) || [];
    graphNetwork.selectNodes([id, ...connectedNodes]);
    graphNetwork.selectEdges(connectedEdges);
}

function showDetail(d) {
    selectedDatasetId = d.id;
    highlightTableRow(d.id);
    highlightGraphNode(d.id);

    const panel = document.getElementById('detail-panel');
    const content = document.getElementById('detail-content');

    content.innerHTML = `
        <h2>${d.name}</h2>
        <p class="detail-description">${d.description}</p>

        <dl class="detail-meta">
            <dt>Domain</dt>
            <dd><span class="dim-badge badge-domain">${d.domain}${d.subdomain ? ' / ' + d.subdomain : ''}</span></dd>

            <dt>Lifecycle</dt>
            <dd><span class="dim-badge badge-lifecycle">${d.lifecycle}</span></dd>

            <dt>Data Type</dt>
            <dd><span class="dim-badge badge-datatype">${d.dataType}</span></dd>

            <dt>Format</dt>
            <dd><span class="dim-badge badge-format">${d.format} (${d.formatDetail})</span></dd>

            <dt>Primary Use</dt>
            <dd>${d.primaryUse}</dd>

            <dt>Source</dt>
            <dd>${d.source}</dd>

            <dt>Year</dt>
            <dd>${d.year}</dd>

            <dt>License</dt>
            <dd>${d.license}</dd>

            <dt>Tools</dt>
            <dd>${(d.tools || []).join(', ') || 'N/A'}</dd>
        </dl>

        ${(d.publications && d.publications.length > 0) ? `
        <div class="detail-publications">
            <h3 class="detail-pub-heading">Key Publications</h3>
            <ul class="detail-pub-list">
                ${d.publications.map(p => `
                    <li>
                        <span class="pub-authors">${p.authors}</span>
                        <span class="pub-title">${p.title}</span>
                        <span class="pub-venue">${p.venue}, ${p.year}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="detail-tags">
            ${(d.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>

        ${d.notes ? `<p class="detail-notes"><strong>Note:</strong> ${d.notes}</p>` : ''}

        <div class="detail-actions">
            ${d.url ? `<a href="${d.url}" target="_blank" rel="noopener" class="detail-link">Access Dataset &rarr;</a>` : ''}
            <a href="https://scholar.google.com/scholar?q=%22${encodeURIComponent(d.name)}%22+dataset" target="_blank" rel="noopener" class="detail-scholar" title="Search Google Scholar for publications using this dataset">
                <svg class="scholar-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>
                </svg>
                Find on Google Scholar
            </a>
        </div>
    `;

    panel.classList.remove('hidden');
}

// ============================================================
// CLUSTRMAPS GLOBE (visitor counter)
// ============================================================
function loadClustrMapsGlobe() {
    const container = document.getElementById('clustrmaps-globe');
    if (!container || document.getElementById('clstr_globe')) return;

    // TODO: Replace this placeholder tracking ID with the actual ClustrMaps
    // tracking ID once the EDSE Map app is registered on https://clustrmaps.com
    const CLUSTRMAPS_ID = 'PLACEHOLDER_TRACKING_ID';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = 'clstr_globe';
    script.src = `https://clustrmaps.com/globe.js?d=${CLUSTRMAPS_ID}`;
    script.async = true;
    container.appendChild(script);
}
