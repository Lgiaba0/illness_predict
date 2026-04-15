const generationsEl = document.getElementById('generations');
const addGenerationBtn = document.getElementById('addGenerationBtn');
const inferBtn = document.getElementById('inferBtn');
const exampleBtn = document.getElementById('exampleBtn');
const copyPayloadBtn = document.getElementById('copyPayloadBtn');
const payloadPreview = document.getElementById('payloadPreview');
const statusBar = document.getElementById('statusBar');
const resultBody = document.getElementById('resultBody');
const resultBadge = document.getElementById('resultBadge');
const pedigreeCanvas = document.getElementById('pedigreeCanvas');
const inheritanceModeSelect = document.getElementById('inheritanceMode');
const alleleModeSelect = document.getElementById('alleleMode');
const allelePresetSelect = document.getElementById('allelePreset');
const alleleFrequencyInput = document.getElementById('alleleFrequency');
const queryFatherSelect = document.getElementById('queryFather');
const queryMotherSelect = document.getElementById('queryMother');
const generationTemplate = document.getElementById('generationTemplate');
const nodeTemplate = document.getElementById('nodeTemplate');

const state = {
  generations: []
};

let pedigreeRafHandle = null;
let pedigreeLevels = new Map();

function createNodeDefaults(generationIndex, nodeIndex) {
  const isRoot = generationIndex === 0;
  if (isRoot && nodeIndex === 0) {
    return { id: 'father', phenotype: 'unaffected', father_id: null, mother_id: null };
  }
  if (isRoot && nodeIndex === 1) {
    return { id: 'mother', phenotype: 'unaffected', father_id: null, mother_id: null };
  }
  return {
    id: `node_${generationIndex + 1}_${nodeIndex + 1}`,
    phenotype: 'unknown',
    father_id: null,
    mother_id: null
  };
}

function createGeneration(label, nodes) {
  return { label, nodes };
}

function getLevelOrderMap(levels) {
  const uniqueLevels = [...new Set(levels.values())].sort((a, b) => a - b);
  const orderMap = new Map();
  uniqueLevels.forEach((level, index) => {
    orderMap.set(level, index + 1);
  });
  return orderMap;
}

function normalizeGenerationLabelsFromVisual(levels) {
  const levelOrderMap = getLevelOrderMap(levels);

  state.generations.forEach((generation, index) => {
    const levelCounts = new Map();
    generation.nodes.forEach((node) => {
      const nodeId = node.id.trim();
      if (!nodeId || !levels.has(nodeId)) {
        return;
      }
      const level = levels.get(nodeId);
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    });

    if (!levelCounts.size) {
      generation.label = `Đời ${index + 1}`;
      return;
    }

    const dominantLevel = [...levelCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    generation.label = `Đời ${levelOrderMap.get(dominantLevel)}`;
  });
}

function syncGenerationViews() {
  const visual = buildVisualPedigree();
  pedigreeLevels = visual.levels;
  normalizeGenerationLabelsFromVisual(visual.levels);

  const titles = generationsEl.querySelectorAll('.generation-title');
  state.generations.forEach((generation, index) => {
    if (titles[index]) {
      titles[index].textContent = generation.label;
    }
  });

  renderPedigreeView(visual);
}

function seedInitialState() {
  state.generations = [
    createGeneration('Đời hiện tại', [
      { id: 'proband', phenotype: 'unknown', father_id: 'father', mother_id: 'mother' }
    ]),
    createGeneration('Đời 2', [
      { id: 'father', phenotype: 'unaffected', father_id: null, mother_id: null },
      { id: 'mother', phenotype: 'unaffected', father_id: null, mother_id: null }
    ])
  ];
}

function allNodes() {
  return state.generations.flatMap((generation, generationIndex) =>
    generation.nodes.map((node, nodeIndex) => ({
      ...node,
      generationIndex,
      nodeIndex
    }))
  );
}

function nodeOptions(selectedValue = '') {
  const options = [{ value: '', label: 'None' }];
  for (const node of allNodes()) {
    options.push({ value: node.id, label: node.id });
  }
  return options
    .map(
      (option) =>
        `<option value="${option.value}" ${option.value === selectedValue ? 'selected' : ''}>${option.label}</option>`
    )
    .join('');
}

function syncQuerySelectors() {
  const nodes = allNodes();
  const nodeIds = new Set(nodes.map((node) => node.id));
  const fallbackFather = nodeIds.has('father') ? 'father' : nodes[0]?.id || '';
  const fallbackMother = nodeIds.has('mother') ? 'mother' : nodes[1]?.id || nodes[0]?.id || '';
  const currentFather = queryFatherSelect.value || fallbackFather;
  const currentMother = queryMotherSelect.value || fallbackMother;
  queryFatherSelect.innerHTML = nodes
    .map((node) => `<option value="${node.id}" ${node.id === currentFather ? 'selected' : ''}>${node.id}</option>`)
    .join('');
  queryMotherSelect.innerHTML = nodes
    .map((node) => `<option value="${node.id}" ${node.id === currentMother ? 'selected' : ''}>${node.id}</option>`)
    .join('');

  if (!queryFatherSelect.value && fallbackFather) {
    queryFatherSelect.value = fallbackFather;
  }
  if (!queryMotherSelect.value && fallbackMother) {
    queryMotherSelect.value = fallbackMother;
  }
}

function createSvgElement(name) {
  return document.createElementNS('http://www.w3.org/2000/svg', name);
}

function buildVisualPedigree() {
  const nodes = allNodes()
    .map((node) => ({ ...node, id: node.id.trim() }))
    .filter((node) => node.id);

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const levelMemo = new Map();

  const resolveLevel = (nodeId, stack = new Set()) => {
    if (levelMemo.has(nodeId)) {
      return levelMemo.get(nodeId);
    }
    if (stack.has(nodeId)) {
      return 0;
    }

    const node = nodeMap.get(nodeId);
    if (!node) {
      return 0;
    }

    stack.add(nodeId);
    const parentIds = [node.father_id, node.mother_id].filter((parentId) => parentId && nodeMap.has(parentId));
    const level = parentIds.length
      ? Math.max(...parentIds.map((parentId) => resolveLevel(parentId, stack))) + 1
      : 0;
    stack.delete(nodeId);

    levelMemo.set(nodeId, level);
    return level;
  };

  for (const node of nodes) {
    resolveLevel(node.id);
  }

  const grouped = new Map();
  for (const node of nodes) {
    const level = levelMemo.get(node.id) || 0;
    if (!grouped.has(level)) {
      grouped.set(level, []);
    }
    grouped.get(level).push(node);
  }

  const generations = Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([level, levelNodes], index) => ({
      key: level,
      label: `Đời ${index + 1}`,
      nodes: levelNodes
    }));

  return { nodes, levels: levelMemo, generations };
}

function renderPedigreeLinks(container, linksSvg) {
  linksSvg.innerHTML = '';

  const containerRect = container.getBoundingClientRect();
  if (containerRect.width === 0 || containerRect.height === 0) {
    return;
  }

  linksSvg.setAttribute('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`);
  linksSvg.setAttribute('width', `${containerRect.width}`);
  linksSvg.setAttribute('height', `${containerRect.height}`);

  const nodeMap = new Map();
  container.querySelectorAll('.pedigree-node[data-node-id]').forEach((element) => {
    const nodeId = element.getAttribute('data-node-id');
    if (nodeId && !nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, element);
    }
  });

  const linkGroup = createSvgElement('g');
  linkGroup.setAttribute('class', 'pedigree-link-group');

  for (const child of allNodes()) {
      const childId = child.id.trim();
      if (!childId || !nodeMap.has(childId)) {
        continue;
      }

      const childElement = nodeMap.get(childId);
      const childRect = childElement.getBoundingClientRect();
      const childTopX = childRect.left - containerRect.left + childRect.width / 2;
      const childTopY = childRect.top - containerRect.top;

      [child.father_id, child.mother_id].forEach((parentId, index) => {
        if (!parentId || !nodeMap.has(parentId)) {
          return;
        }

        const childLevel = pedigreeLevels.get(childId);
        const parentLevel = pedigreeLevels.get(parentId);
        if (typeof childLevel === 'number' && typeof parentLevel === 'number' && parentLevel >= childLevel) {
          return;
        }

        const parentElement = nodeMap.get(parentId);
        const parentRect = parentElement.getBoundingClientRect();
        const parentBottomX = parentRect.left - containerRect.left + parentRect.width / 2;
        const parentBottomY = parentRect.bottom - containerRect.top;
        const bendY = parentBottomY + (childTopY - parentBottomY) * 0.5 - 8;

        const path = createSvgElement('path');
        path.setAttribute(
          'd',
          `M ${parentBottomX} ${parentBottomY} L ${parentBottomX} ${bendY} L ${childTopX + (index === 0 ? -6 : 6)} ${bendY} L ${childTopX + (index === 0 ? -6 : 6)} ${childTopY}`
        );
        path.setAttribute('class', `pedigree-link ${index === 0 ? 'father-link' : 'mother-link'}`);
        linkGroup.appendChild(path);
      });
  }

  linksSvg.appendChild(linkGroup);
}

function schedulePedigreeLinkRender() {
  if (!pedigreeCanvas) {
    return;
  }

  const linksSvg = pedigreeCanvas.querySelector('.pedigree-links');
  if (!linksSvg) {
    return;
  }

  if (pedigreeRafHandle) {
    window.cancelAnimationFrame(pedigreeRafHandle);
  }

  pedigreeRafHandle = window.requestAnimationFrame(() => {
    renderPedigreeLinks(pedigreeCanvas, linksSvg);
    pedigreeRafHandle = null;
  });
}

function renderPedigreeView(visualData = null) {
  if (!pedigreeCanvas) {
    return;
  }

  const visual = visualData || buildVisualPedigree();
  pedigreeLevels = visual.levels;

  if (!visual.nodes.length) {
    pedigreeCanvas.innerHTML = '<div class="empty-state">Chưa có dữ liệu phả hệ.</div>';
    return;
  }

  pedigreeCanvas.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'pedigree-layout';

  visual.generations.forEach((generation) => {
    const generationRow = document.createElement('section');
    generationRow.className = 'pedigree-generation';

    const generationLabel = document.createElement('div');
    generationLabel.className = 'pedigree-generation-label';
    generationLabel.textContent = generation.label;

    const lane = document.createElement('div');
    lane.className = 'pedigree-lane';

    generation.nodes.forEach((node) => {
      const nodeId = node.id.trim();
      if (!nodeId) {
        return;
      }

      const card = document.createElement('article');
      card.className = `pedigree-node ${node.phenotype}`;
      card.setAttribute('data-node-id', nodeId);

      const id = document.createElement('strong');
      id.textContent = nodeId;

      const meta = document.createElement('span');
      meta.className = 'pedigree-node-meta';
      meta.textContent =
        node.phenotype === 'affected'
          ? 'Bệnh'
          : node.phenotype === 'unaffected'
          ? 'Không bệnh'
          : 'Chưa rõ';

      card.appendChild(id);
      card.appendChild(meta);
      lane.appendChild(card);
    });

    generationRow.appendChild(generationLabel);
    generationRow.appendChild(lane);
    layout.appendChild(generationRow);
  });

  const linksSvg = createSvgElement('svg');
  linksSvg.setAttribute('class', 'pedigree-links');
  linksSvg.setAttribute('aria-hidden', 'true');

  pedigreeCanvas.appendChild(layout);
  pedigreeCanvas.appendChild(linksSvg);
  schedulePedigreeLinkRender();
}

function render() {
  const visual = buildVisualPedigree();
  pedigreeLevels = visual.levels;
  normalizeGenerationLabelsFromVisual(visual.levels);
  generationsEl.innerHTML = '';

  state.generations.forEach((generation, generationIndex) => {
    const fragment = generationTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.generation-card');
    const title = fragment.querySelector('.generation-title');
    const nodeList = fragment.querySelector('.node-list');
    const addNodeBtn = fragment.querySelector('.add-node-btn');
    const removeGenerationBtn = fragment.querySelector('.remove-generation-btn');

    title.textContent = generation.label;

    generation.nodes.forEach((node, nodeIndex) => {
      const nodeFragment = nodeTemplate.content.cloneNode(true);
      const nodeCard = nodeFragment.querySelector('.node-card');
      const indexEl = nodeFragment.querySelector('.node-index');
      const idInput = nodeFragment.querySelector('.node-id');
      const phenotypeSelect = nodeFragment.querySelector('.node-phenotype');
      const fatherSelect = nodeFragment.querySelector('.node-father');
      const motherSelect = nodeFragment.querySelector('.node-mother');
      const removeNodeBtn = nodeFragment.querySelector('.remove-node-btn');

      indexEl.textContent = node.id || `Node ${nodeIndex + 1}`;
      idInput.value = node.id;
      phenotypeSelect.value = node.phenotype;
      fatherSelect.innerHTML = nodeOptions(node.father_id);
      motherSelect.innerHTML = nodeOptions(node.mother_id);

      const updateOptions = () => {
        fatherSelect.innerHTML = nodeOptions(node.father_id);
        motherSelect.innerHTML = nodeOptions(node.mother_id);
      };

      idInput.addEventListener('input', (event) => {
        const previousId = node.id;
        node.id = event.target.value.trim();
        if (previousId && previousId !== node.id) {
          for (const generationItem of state.generations) {
            for (const sibling of generationItem.nodes) {
              if (sibling.father_id === previousId) {
                sibling.father_id = node.id || null;
              }
              if (sibling.mother_id === previousId) {
                sibling.mother_id = node.id || null;
              }
            }
          }
          if (queryFatherSelect.value === previousId) {
            queryFatherSelect.value = node.id;
          }
          if (queryMotherSelect.value === previousId) {
            queryMotherSelect.value = node.id;
          }
        }
        indexEl.textContent = node.id || `Node ${nodeIndex + 1}`;
        syncQuerySelectors();
        updateOptions();
        renderPayloadPreview();
        syncGenerationViews();
      });

      phenotypeSelect.addEventListener('change', (event) => {
        node.phenotype = event.target.value;
        renderPayloadPreview();
        syncGenerationViews();
      });

      fatherSelect.addEventListener('change', (event) => {
        node.father_id = event.target.value || null;
        renderPayloadPreview();
        syncGenerationViews();
      });

      motherSelect.addEventListener('change', (event) => {
        node.mother_id = event.target.value || null;
        renderPayloadPreview();
        syncGenerationViews();
      });

      removeNodeBtn.addEventListener('click', () => {
        generation.nodes.splice(nodeIndex, 1);
        if (generation.nodes.length === 0 && state.generations.length > 1) {
          state.generations.splice(generationIndex, 1);
        }
        syncQuerySelectors();
        render();
      });

      nodeList.appendChild(nodeFragment);
    });

    addNodeBtn.addEventListener('click', () => {
      generation.nodes.push(createNodeDefaults(generationIndex, generation.nodes.length));
      syncQuerySelectors();
      render();
    });

    removeGenerationBtn.addEventListener('click', () => {
      if (state.generations.length === 1) {
        return;
      }
      state.generations.splice(generationIndex, 1);
      syncQuerySelectors();
      render();
    });

    generationsEl.appendChild(fragment);
  });

  syncQuerySelectors();
  renderPedigreeView(visual);
  renderPayloadPreview();
}

function buildPayload() {
  const individuals = [];
  for (const generation of state.generations) {
    for (const node of generation.nodes) {
      if (!node.id.trim()) {
        continue;
      }
      individuals.push({
        id: node.id.trim(),
        phenotype: node.phenotype,
        father_id: node.father_id || null,
        mother_id: node.mother_id || null
      });
    }
  }

  return {
    individuals,
    query: {
      father_id: queryFatherSelect.value,
      mother_id: queryMotherSelect.value,
      inheritance_mode: inheritanceModeSelect.value,
      allele_frequency: 
        alleleModeSelect.value === 'unknown' 
          ? null 
          : alleleModeSelect.value === 'preset'
          ? Number(allelePresetSelect.value)
          : alleleFrequencyInput.value ? Number(alleleFrequencyInput.value) : null
    }
  };
}


function renderPayloadPreview() {
  payloadPreview.textContent = JSON.stringify(buildPayload(), null, 2);
}

function syncAlleleControls() {
  const mode = alleleModeSelect.value;
  allelePresetSelect.style.display = mode === 'preset' ? 'block' : 'none';
  alleleFrequencyInput.style.display = mode === 'custom' ? 'block' : 'none';
}

function setStatus(message, kind = 'neutral') {
  statusBar.textContent = message;
  resultBadge.className = `badge ${kind}`;
  resultBadge.textContent = kind === 'success' ? 'Đã tính' : kind === 'error' ? 'Lỗi' : 'Sẵn sàng';
}

function renderResult(data) {
  const childProbability = (data.child_affected_probability * 100).toFixed(2);
  const fatherId = data.parent_marginals ? Object.keys(data.parent_marginals)[0] : 'father';
  const motherId = data.parent_marginals ? Object.keys(data.parent_marginals)[1] : 'mother';
  const fatherPosterior = data.parent_marginals?.[fatherId] || {};
  const motherPosterior = data.parent_marginals?.[motherId] || {};

  const selectedMode = data.inheritance_mode || 'recessive';
  const modeLabel = selectedMode === 'dominant' ? 'Trội' : 'Lặn';
  const recessiveScore = (Number(data.model_scores?.recessive || 0) * 100).toFixed(1);
  const dominantScore = (Number(data.model_scores?.dominant || 0) * 100).toFixed(1);

  const toRows = (posterior) =>
    ['AA', 'Aa', 'aa']
      .map(
        (genotype) => `
          <tr>
            <td>${genotype}</td>
            <td>${((posterior[genotype] || 0) * 100).toFixed(2)}%</td>
          </tr>`
      )
      .join('');

  resultBody.innerHTML = `
    <div class="result-grid">
      <div class="metric">
        <div class="metric-label">Xác suất con bị bệnh</div>
        <div class="metric-value">${childProbability}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Số trạng thái đã duyệt</div>
        <div class="metric-value">${data.metadata?.explored_states ?? 0}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Mô hình suy ra</div>
        <div class="metric-value">${modeLabel}</div>
      </div>
    </div>

    <div class="metric">
      <div class="metric-label">Độ phù hợp mô hình (auto)</div>
      <div class="metric-label">Recessive: ${recessiveScore}% | Dominant: ${dominantScore}%</div>
    </div>

    <table class="posterior-table">
      <thead>
        <tr><th>Genotype</th><th>${fatherId}</th><th>${motherId}</th></tr>
      </thead>
      <tbody>
        <tr><td>AA</td><td>${((fatherPosterior.AA || 0) * 100).toFixed(2)}%</td><td>${((motherPosterior.AA || 0) * 100).toFixed(2)}%</td></tr>
        <tr><td>Aa</td><td>${((fatherPosterior.Aa || 0) * 100).toFixed(2)}%</td><td>${((motherPosterior.Aa || 0) * 100).toFixed(2)}%</td></tr>
        <tr><td>aa</td><td>${((fatherPosterior.aa || 0) * 100).toFixed(2)}%</td><td>${((motherPosterior.aa || 0) * 100).toFixed(2)}%</td></tr>
      </tbody>
    </table>

    <h4>Posterior chi tiết</h4>
    <table class="posterior-table">
      <thead>
        <tr><th>Người</th><th>AA</th><th>Aa</th><th>aa</th></tr>
      </thead>
      <tbody>
        ${Object.entries(data.genotype_posteriors || {})
          .map(
            ([personId, posterior]) => `
              <tr>
                <td>${personId}</td>
                <td>${((posterior.AA || 0) * 100).toFixed(2)}%</td>
                <td>${((posterior.Aa || 0) * 100).toFixed(2)}%</td>
                <td>${((posterior.aa || 0) * 100).toFixed(2)}%</td>
              </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function loadExample() {
  state.generations = [
    createGeneration('Đời hiện tại', [
      { id: 'proband', phenotype: 'affected', father_id: 'father', mother_id: 'mother' }
    ]),
    createGeneration('Đời 2', [
      { id: 'father', phenotype: 'unaffected', father_id: 'grandfather_p', mother_id: 'grandmother_p' },
      { id: 'mother', phenotype: 'unaffected', father_id: 'grandfather_m', mother_id: 'grandmother_m' }
    ]),
    createGeneration('Đời 3', [
      { id: 'grandfather_p', phenotype: 'unknown', father_id: null, mother_id: null },
      { id: 'grandmother_p', phenotype: 'unknown', father_id: null, mother_id: null },
      { id: 'grandfather_m', phenotype: 'unknown', father_id: null, mother_id: null },
      { id: 'grandmother_m', phenotype: 'unknown', father_id: null, mother_id: null }
    ])
  ];

  syncQuerySelectors();
  render();
  setStatus('Đã nạp ví dụ. Bạn có thể sửa trực tiếp từng node.', 'neutral');
}

async function infer() {
  const payload = buildPayload();
  payloadPreview.textContent = JSON.stringify(payload, null, 2);

  if (!payload.individuals.length) {
    setStatus('Cần ít nhất một node hợp lệ trước khi chạy.', 'error');
    return;
  }

  setStatus('Đang gửi dữ liệu lên API...', 'neutral');
  inferBtn.disabled = true;

  try {
    const response = await fetch('/v1/infer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      const message = typeof data?.detail === 'string' ? data.detail : 'Inference failed';
      throw new Error(message);
    }

    renderResult(data);
    setStatus('Inference hoàn tất.', 'success');
  } catch (error) {
    resultBody.innerHTML = `<div class="empty-state">${error.message}</div>`;
    setStatus(error.message, 'error');
  } finally {
    inferBtn.disabled = false;
  }
}

addGenerationBtn.addEventListener('click', () => {
  const generationIndex = state.generations.length;
  const placeholders = [0, 1, 2, 3].map((nodeIndex) => createNodeDefaults(generationIndex, nodeIndex));
  state.generations.push(createGeneration('', placeholders));
  render();
  setStatus(`Đã thêm ${state.generations[state.generations.length - 1].label}.`, 'neutral');
});

inferBtn.addEventListener('click', infer);
exampleBtn.addEventListener('click', loadExample);
copyPayloadBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(payloadPreview.textContent);
  setStatus('Đã copy payload JSON vào clipboard.', 'success');
});

alleleFrequencyInput.addEventListener('input', renderPayloadPreview);
allelePresetSelect.addEventListener('change', renderPayloadPreview);
alleleModeSelect.addEventListener('change', () => {
  syncAlleleControls();
  renderPayloadPreview();
});
inheritanceModeSelect.addEventListener('change', renderPayloadPreview);
queryFatherSelect.addEventListener('change', renderPayloadPreview);
queryMotherSelect.addEventListener('change', renderPayloadPreview);
window.addEventListener('resize', schedulePedigreeLinkRender);

seedInitialState();
render();
syncAlleleControls();
setStatus('Sẵn sàng. Các đời được đánh số tự động theo bố cục node.', 'neutral');
