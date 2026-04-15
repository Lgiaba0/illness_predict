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
const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const saveApiBaseUrlBtn = document.getElementById('saveApiBaseUrlBtn');
const languageSelect = document.getElementById('languageSelect');
const queryFatherSelect = document.getElementById('queryFather');
const queryMotherSelect = document.getElementById('queryMother');
const generationTemplate = document.getElementById('generationTemplate');
const nodeTemplate = document.getElementById('nodeTemplate');

const API_BASE_URL_STORAGE_KEY = 'pedigree.apiBaseUrl';
const LANGUAGE_STORAGE_KEY = 'pedigree.language';

const translations = {
  vi: {
    pageTitle: 'Pedigree Risk Studio',
    heroTitle: 'Vẽ phả hệ, thêm từng đời, và tính rủi ro di truyền ngay trên web.',
    heroDescription:
      'Mặc định có người cần xét và các node liên quan. Nhãn đời được đánh số tự động theo bố cục chiều cao của phả hệ, bạn có thể bấm thêm đời để nhập ông bà, cô dì, chú bác, rồi chạy suy luận autosomal recessive ngay lập tức.',
    heroCard1Label: 'Mặc định',
    heroCard1Title: 'Proband + Father + Mother',
    heroCard1Description: 'Các đời hiển thị theo số thứ tự tự động',
    heroCard2Label: 'Mở rộng',
    heroCard2Title: '+ 1 đời',
    heroCard2Description: 'Thêm ông bà hoặc các node cùng thế hệ',
    topbarTitle: 'Pedigree Builder',
    topbarDescription: 'Điền thông tin, thêm đời nếu cần, rồi bấm tính xác suất.',
    languageLabel: 'Ngôn ngữ',
    addGenerationBtn: '+ Thêm 1 đời',
    exampleBtn: 'Nạp ví dụ',
    inferBtn: 'Tính rủi ro',
    apiBaseUrlLabel: 'API Base URL',
    saveApiBaseUrlBtn: 'Lưu API',
    inheritanceModeLabel: 'Kiểu di truyền',
    alleleFrequencyLabel: 'Tần suất allele',
    queryFatherLabel: 'Cha truy vấn',
    queryMotherLabel: 'Mẹ truy vấn',
    pedigreePanelTitle: 'Phả hệ trực quan',
    pedigreePanelDescription: 'Xem nhanh các đời và quan hệ cha/mẹ-con',
    resultPanelTitle: 'Kết quả',
    payloadPanelTitle: 'Payload gửi API',
    copyPayloadBtn: 'Copy JSON',
    statusReady: 'Sẵn sàng',
    statusError: 'Lỗi',
    statusSuccess: 'Đã tính',
    statusMessages: {
      ready: 'Sẵn sàng. Nhập cây gia đình và bấm Tính rủi ro.',
      exampleLoaded: 'Đã nạp ví dụ. Bạn có thể sửa trực tiếp từng node.',
      needNode: 'Cần ít nhất một node hợp lệ trước khi chạy.',
      needApiBaseUrl: 'Hãy nhập API Base URL backend trước khi chạy trên GitHub Pages.',
      sendingRequest: 'Đang gửi dữ liệu lên API...',
      inferenceDone: 'Inference hoàn tất.',
      githubPagesHint: 'Đang chạy trên GitHub Pages. Hãy nhập API Base URL backend rồi bấm Lưu API.',
      copiedPayload: 'Đã copy payload JSON vào clipboard.',
      savedApiBaseUrl: (url) => `Đã lưu API Base URL: ${url}`,
      clearedApiBaseUrl: 'Đã xóa API Base URL đã lưu.',
      addedGeneration: (label) => `Đã thêm ${label}.`,
      inferenceFailed: 'Inference failed'
    },
    generationPrefix: 'Generation',
    currentGeneration: 'Current generation',
    nodePrefix: 'Node',
    noneOption: 'None',
    phenotypeAffected: 'Affected',
    phenotypeUnaffected: 'Unaffected',
    phenotypeUnknown: 'Unknown',
    inheritanceAuto: 'Auto infer from pedigree',
    inheritanceRecessive: 'Recessive',
    inheritanceDominant: 'Dominant',
    allelePreset: 'preset',
    alleleCustom: 'custom',
    alleleUnknown: 'unknown',
    alleleRare: 'rare (q=0.01)',
    alleleModerate: 'moderate (q=0.05)',
    alleleCommon: 'common (q=0.1)',
    modelRecessive: 'Recessive',
    modelDominant: 'Dominant',
    childProbability: 'Probability child affected',
    exploredStates: 'Explored states',
    modelInferred: 'Inferred model',
    modelFit: 'Model fit (auto)',
    genotype: 'Genotype',
    person: 'Person',
    posteriorDetails: 'Posterior details',
    addNodeBtn: '+ Add node in this generation',
    removeGenerationBtn: 'Remove generation',
    removeNodeBtn: 'Remove',
    nodeIdLabel: 'ID',
    nodePhenotypeLabel: 'Phenotype',
    nodeFatherLabel: 'Father',
    nodeMotherLabel: 'Mother',
    nodeIdPlaceholder: 'grandfather_paternal',
    pedigreeEmptyState: 'Pedigree diagram will update automatically as you enter data.',
    resultEmptyState: 'Results will appear here after you run inference.',
    emptyPedigree: 'No pedigree data yet.'
  },
  en: {
    pageTitle: 'Pedigree Risk Studio',
    heroTitle: 'Draw pedigrees, add generations, and calculate genetic risk in the browser.',
    heroDescription:
      'The app starts with the core relatives and auto-numbered generations. Add grandparents, aunts, or uncles as needed, then run autosomal-recessive inference instantly.',
    heroCard1Label: 'Default',
    heroCard1Title: 'Proband + Father + Mother',
    heroCard1Description: 'Generations are labeled automatically',
    heroCard2Label: 'Expanded',
    heroCard2Title: '+ 1 generation',
    heroCard2Description: 'Add grandparents or same-generation relatives',
    topbarTitle: 'Pedigree Builder',
    topbarDescription: 'Fill in the tree, add generations if needed, then compute risk.',
    languageLabel: 'Language',
    addGenerationBtn: '+ Add generation',
    exampleBtn: 'Load example',
    inferBtn: 'Calculate risk',
    apiBaseUrlLabel: 'API Base URL',
    saveApiBaseUrlBtn: 'Save API',
    inheritanceModeLabel: 'Inheritance mode',
    alleleFrequencyLabel: 'Allele frequency',
    queryFatherLabel: 'Query father',
    queryMotherLabel: 'Query mother',
    pedigreePanelTitle: 'Pedigree view',
    pedigreePanelDescription: 'Quick view of generations and parent-child links',
    resultPanelTitle: 'Results',
    payloadPanelTitle: 'API payload',
    copyPayloadBtn: 'Copy JSON',
    statusReady: 'Ready',
    statusError: 'Error',
    statusSuccess: 'Done',
    statusMessages: {
      ready: 'Ready. Enter a pedigree and click Calculate risk.',
      exampleLoaded: 'Example loaded. You can edit each node directly.',
      needNode: 'At least one valid node is required before running inference.',
      needApiBaseUrl: 'Enter the backend API Base URL before running on GitHub Pages.',
      sendingRequest: 'Sending data to the API...',
      inferenceDone: 'Inference completed.',
      githubPagesHint: 'Running on GitHub Pages. Enter the backend API Base URL and click Save API.',
      copiedPayload: 'Copied payload JSON to clipboard.',
      savedApiBaseUrl: (url) => `Saved API Base URL: ${url}`,
      clearedApiBaseUrl: 'Cleared saved API Base URL.',
      addedGeneration: (label) => `Added ${label}.`,
      inferenceFailed: 'Inference failed'
    },
    generationPrefix: 'Generation',
    currentGeneration: 'Current generation',
    nodePrefix: 'Node',
    noneOption: 'None',
    phenotypeAffected: 'Affected',
    phenotypeUnaffected: 'Unaffected',
    phenotypeUnknown: 'Unknown',
    inheritanceAuto: 'Auto infer from pedigree',
    inheritanceRecessive: 'Recessive',
    inheritanceDominant: 'Dominant',
    allelePreset: 'preset',
    alleleCustom: 'custom',
    alleleUnknown: 'unknown',
    alleleRare: 'rare (q=0.01)',
    alleleModerate: 'moderate (q=0.05)',
    alleleCommon: 'common (q=0.1)',
    modelRecessive: 'Recessive',
    modelDominant: 'Dominant',
    childProbability: 'Probability child affected',
    exploredStates: 'Explored states',
    modelInferred: 'Inferred model',
    modelFit: 'Model fit (auto)',
    genotype: 'Genotype',
    person: 'Person',
    posteriorDetails: 'Posterior details',
    addNodeBtn: '+ Add node in this generation',
    removeGenerationBtn: 'Remove generation',
    removeNodeBtn: 'Remove',
    nodeIdLabel: 'ID',
    nodePhenotypeLabel: 'Phenotype',
    nodeFatherLabel: 'Father',
    nodeMotherLabel: 'Mother',
    nodeIdPlaceholder: 'grandfather_paternal',
    pedigreeEmptyState: 'Pedigree diagram will update automatically as you enter data.',
    resultEmptyState: 'Results will appear here after you run inference.',
    emptyPedigree: 'No pedigree data yet.'
  }
};

let currentLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'vi';

function t(path, vars = {}) {
  const source = translations[currentLanguage] || translations.vi;
  const value = path.split('.').reduce((accumulator, key) => accumulator?.[key], source);
  if (typeof value === 'function') {
    return value(vars.url ?? vars.label ?? vars.value ?? '');
  }
  if (typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
  }
  return path;
}

function setLanguage(lang) {
  currentLanguage = lang === 'en' ? 'en' : 'vi';
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  document.documentElement.lang = currentLanguage;
  if (languageSelect && languageSelect.value !== currentLanguage) {
    languageSelect.value = currentLanguage;
  }
}

function applyLanguage() {
  setLanguage(currentLanguage);
  document.title = t('pageTitle');

  document.getElementById('heroTitle').textContent = t('heroTitle');
  document.getElementById('heroDescription').textContent = t('heroDescription');
  document.getElementById('heroCard1Label').textContent = t('heroCard1Label');
  document.getElementById('heroCard1Title').textContent = t('heroCard1Title');
  document.getElementById('heroCard1Description').textContent = t('heroCard1Description');
  document.getElementById('heroCard2Label').textContent = t('heroCard2Label');
  document.getElementById('heroCard2Title').textContent = t('heroCard2Title');
  document.getElementById('heroCard2Description').textContent = t('heroCard2Description');
  document.getElementById('topbarTitle').textContent = t('topbarTitle');
  document.getElementById('topbarDescription').textContent = t('topbarDescription');
  document.getElementById('languageLabel').textContent = t('languageLabel');
  document.getElementById('apiBaseUrlLabel').textContent = t('apiBaseUrlLabel');
  document.getElementById('inheritanceModeLabel').textContent = t('inheritanceModeLabel');
  document.getElementById('alleleFrequencyLabel').textContent = t('alleleFrequencyLabel');
  document.getElementById('queryFatherLabel').textContent = t('queryFatherLabel');
  document.getElementById('queryMotherLabel').textContent = t('queryMotherLabel');
  document.getElementById('pedigreePanelTitle').textContent = t('pedigreePanelTitle');
  document.getElementById('pedigreePanelDescription').textContent = t('pedigreePanelDescription');
  document.getElementById('resultPanelTitle').textContent = t('resultPanelTitle');
  document.getElementById('payloadPanelTitle').textContent = t('payloadPanelTitle');
  document.getElementById('saveApiBaseUrlBtn').textContent = t('saveApiBaseUrlBtn');
  document.getElementById('addGenerationBtn').textContent = t('addGenerationBtn');
  document.getElementById('exampleBtn').textContent = t('exampleBtn');
  document.getElementById('inferBtn').textContent = t('inferBtn');
  document.getElementById('copyPayloadBtn').textContent = t('copyPayloadBtn');

  const pedigreeEmptyState = document.getElementById('pedigreeEmptyState');
  if (pedigreeEmptyState) {
    pedigreeEmptyState.textContent = t('pedigreeEmptyState');
  }
  const resultEmptyState = document.getElementById('resultEmptyState');
  if (resultEmptyState) {
    resultEmptyState.textContent = t('resultEmptyState');
  }

  inheritanceModeSelect.options[0].textContent = t('inheritanceAuto');
  inheritanceModeSelect.options[1].textContent = t('inheritanceRecessive');
  inheritanceModeSelect.options[2].textContent = t('inheritanceDominant');
  alleleModeSelect.options[0].textContent = t('allelePreset');
  alleleModeSelect.options[1].textContent = t('alleleCustom');
  alleleModeSelect.options[2].textContent = t('alleleUnknown');
  allelePresetSelect.options[0].textContent = t('alleleRare');
  allelePresetSelect.options[1].textContent = t('alleleModerate');
  allelePresetSelect.options[2].textContent = t('alleleCommon');

  if (languageSelect) {
    languageSelect.options[0].textContent = currentLanguage === 'vi' ? 'Tiếng Việt' : 'Vietnamese';
    languageSelect.options[1].textContent = 'English';
  }

  render();

  if (lastResultData) {
    renderResult(lastResultData);
  } else if (isGithubPagesHost() && !getApiBaseUrl()) {
    setStatus(t('statusMessages.githubPagesHint'), 'neutral');
  } else {
    setStatus(t('statusMessages.ready'), 'neutral');
  }
}

const state = { generations: [] };
let pedigreeRafHandle = null;
let pedigreeLevels = new Map();
let lastResultData = null;

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
  uniqueLevels.forEach((level, index) => orderMap.set(level, index + 1));
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
      generation.label = `${t('generationPrefix')} ${index + 1}`;
      return;
    }

    const dominantLevel = [...levelCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    generation.label = `${t('generationPrefix')} ${levelOrderMap.get(dominantLevel)}`;
  });
}

function seedInitialState() {
  state.generations = [
    createGeneration(t('currentGeneration'), [
      { id: 'proband', phenotype: 'unknown', father_id: 'father', mother_id: 'mother' }
    ]),
    createGeneration(`${t('generationPrefix')} 2`, [
      { id: 'father', phenotype: 'unaffected', father_id: null, mother_id: null },
      { id: 'mother', phenotype: 'unaffected', father_id: null, mother_id: null }
    ])
  ];
}

function allNodes() {
  return state.generations.flatMap((generation, generationIndex) =>
    generation.nodes.map((node, nodeIndex) => ({ ...node, generationIndex, nodeIndex }))
  );
}

function nodeOptions(selectedValue = '') {
  const options = [{ value: '', label: t('noneOption') }];
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
    .map(([level, levelNodes], index) => ({ key: level, label: `${t('generationPrefix')} ${index + 1}`, nodes: levelNodes }));

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
    pedigreeCanvas.innerHTML = `<div id="pedigreeEmptyState" class="empty-state">${t('emptyPedigree')}</div>`;
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
      meta.textContent = node.phenotype === 'affected' ? t('phenotypeAffected') : node.phenotype === 'unaffected' ? t('phenotypeUnaffected') : t('phenotypeUnknown');

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
    const title = fragment.querySelector('.generation-title');
    const nodeList = fragment.querySelector('.node-list');
    const addNodeBtn = fragment.querySelector('.add-node-btn');
    const removeGenerationBtn = fragment.querySelector('.remove-generation-btn');
    const generationKicker = fragment.querySelector('.generation-kicker');

    title.textContent = generation.label;
    generationKicker.textContent = t('generationPrefix');
    addNodeBtn.textContent = t('addNodeBtn');
    removeGenerationBtn.textContent = t('removeGenerationBtn');

    generation.nodes.forEach((node, nodeIndex) => {
      const nodeFragment = nodeTemplate.content.cloneNode(true);
      const indexEl = nodeFragment.querySelector('.node-index');
      const idInput = nodeFragment.querySelector('.node-id');
      const phenotypeSelect = nodeFragment.querySelector('.node-phenotype');
      const fatherSelect = nodeFragment.querySelector('.node-father');
      const motherSelect = nodeFragment.querySelector('.node-mother');
      const removeNodeBtn = nodeFragment.querySelector('.remove-node-btn');
      const nodeIdLabel = nodeFragment.querySelector('.node-id-label');
      const nodePhenotypeLabel = nodeFragment.querySelector('.node-phenotype-label');
      const nodeFatherLabel = nodeFragment.querySelector('.node-father-label');
      const nodeMotherLabel = nodeFragment.querySelector('.node-mother-label');

      indexEl.textContent = node.id || `${t('nodePrefix')} ${nodeIndex + 1}`;
      idInput.value = node.id;
      idInput.placeholder = t('nodeIdPlaceholder');
      phenotypeSelect.value = node.phenotype;
      fatherSelect.innerHTML = nodeOptions(node.father_id);
      motherSelect.innerHTML = nodeOptions(node.mother_id);
      removeNodeBtn.textContent = t('removeNodeBtn');
      nodeIdLabel.textContent = t('nodeIdLabel');
      nodePhenotypeLabel.textContent = t('nodePhenotypeLabel');
      nodeFatherLabel.textContent = t('nodeFatherLabel');
      nodeMotherLabel.textContent = t('nodeMotherLabel');

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
              if (sibling.father_id === previousId) sibling.father_id = node.id || null;
              if (sibling.mother_id === previousId) sibling.mother_id = node.id || null;
            }
          }
          if (queryFatherSelect.value === previousId) queryFatherSelect.value = node.id;
          if (queryMotherSelect.value === previousId) queryMotherSelect.value = node.id;
        }
        indexEl.textContent = node.id || `${t('nodePrefix')} ${nodeIndex + 1}`;
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
            : alleleFrequencyInput.value
              ? Number(alleleFrequencyInput.value)
              : null
    }
  };
}

function normalizeApiBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function isGithubPagesHost() {
  return window.location.hostname.endsWith('github.io');
}

function getApiBaseUrl() {
  const typed = normalizeApiBaseUrl(apiBaseUrlInput?.value);
  if (typed) {
    return typed;
  }

  const saved = normalizeApiBaseUrl(window.localStorage.getItem(API_BASE_URL_STORAGE_KEY));
  if (saved) {
    return saved;
  }

  return isGithubPagesHost() ? '' : window.location.origin;
}

function inferEndpoint() {
  const base = getApiBaseUrl();
  return base ? `${base}/v1/infer` : '/v1/infer';
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
  resultBadge.textContent = kind === 'success' ? t('statusSuccess') : kind === 'error' ? t('statusError') : t('statusReady');
}

function renderResult(data) {
  lastResultData = data;
  const childProbability = (data.child_affected_probability * 100).toFixed(2);
  const fatherId = data.parent_marginals ? Object.keys(data.parent_marginals)[0] : 'father';
  const motherId = data.parent_marginals ? Object.keys(data.parent_marginals)[1] : 'mother';
  const fatherPosterior = data.parent_marginals?.[fatherId] || {};
  const motherPosterior = data.parent_marginals?.[motherId] || {};
  const selectedMode = data.inheritance_mode || 'recessive';
  const modeLabel = selectedMode === 'dominant' ? t('modelDominant') : t('modelRecessive');
  const recessiveScore = (Number(data.model_scores?.recessive || 0) * 100).toFixed(1);
  const dominantScore = (Number(data.model_scores?.dominant || 0) * 100).toFixed(1);

  resultBody.innerHTML = `
    <div class="result-grid">
      <div class="metric">
        <div class="metric-label">${t('childProbability')}</div>
        <div class="metric-value">${childProbability}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">${t('exploredStates')}</div>
        <div class="metric-value">${data.metadata?.explored_states ?? 0}</div>
      </div>
      <div class="metric">
        <div class="metric-label">${t('modelInferred')}</div>
        <div class="metric-value">${modeLabel}</div>
      </div>
    </div>

    <div class="metric">
      <div class="metric-label">${t('modelFit')}</div>
      <div class="metric-label">${t('modelRecessive')}: ${recessiveScore}% | ${t('modelDominant')}: ${dominantScore}%</div>
    </div>

    <table class="posterior-table">
      <thead>
        <tr><th>${t('genotype')}</th><th>${fatherId}</th><th>${motherId}</th></tr>
      </thead>
      <tbody>
        <tr><td>AA</td><td>${((fatherPosterior.AA || 0) * 100).toFixed(2)}%</td><td>${((motherPosterior.AA || 0) * 100).toFixed(2)}%</td></tr>
        <tr><td>Aa</td><td>${((fatherPosterior.Aa || 0) * 100).toFixed(2)}%</td><td>${((motherPosterior.Aa || 0) * 100).toFixed(2)}%</td></tr>
        <tr><td>aa</td><td>${((fatherPosterior.aa || 0) * 100).toFixed(2)}%</td><td>${((motherPosterior.aa || 0) * 100).toFixed(2)}%</td></tr>
      </tbody>
    </table>

    <h4>${t('posteriorDetails')}</h4>
    <table class="posterior-table">
      <thead>
        <tr><th>${t('person')}</th><th>AA</th><th>Aa</th><th>aa</th></tr>
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
    createGeneration(t('currentGeneration'), [
      { id: 'proband', phenotype: 'affected', father_id: 'father', mother_id: 'mother' }
    ]),
    createGeneration(`${t('generationPrefix')} 2`, [
      { id: 'father', phenotype: 'unaffected', father_id: 'grandfather_p', mother_id: 'grandmother_p' },
      { id: 'mother', phenotype: 'unaffected', father_id: 'grandfather_m', mother_id: 'grandmother_m' }
    ]),
    createGeneration(`${t('generationPrefix')} 3`, [
      { id: 'grandfather_p', phenotype: 'unknown', father_id: null, mother_id: null },
      { id: 'grandmother_p', phenotype: 'unknown', father_id: null, mother_id: null },
      { id: 'grandfather_m', phenotype: 'unknown', father_id: null, mother_id: null },
      { id: 'grandmother_m', phenotype: 'unknown', father_id: null, mother_id: null }
    ])
  ];

  syncQuerySelectors();
  render();
  setStatus(t('statusMessages.exampleLoaded'), 'neutral');
}

async function infer() {
  const payload = buildPayload();
  payloadPreview.textContent = JSON.stringify(payload, null, 2);

  if (!payload.individuals.length) {
    setStatus(t('statusMessages.needNode'), 'error');
    return;
  }

  if (isGithubPagesHost() && !getApiBaseUrl()) {
    setStatus(t('statusMessages.needApiBaseUrl'), 'error');
    return;
  }

  setStatus(t('statusMessages.sendingRequest'), 'neutral');
  inferBtn.disabled = true;

  try {
    const response = await fetch(inferEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      const message = typeof data?.detail === 'string' ? data.detail : t('statusMessages.inferenceFailed');
      throw new Error(message);
    }

    renderResult(data);
    setStatus(t('statusMessages.inferenceDone'), 'success');
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
  setStatus(t('statusMessages.addedGeneration', { label: state.generations[state.generations.length - 1].label }), 'neutral');
});

inferBtn.addEventListener('click', infer);
exampleBtn.addEventListener('click', loadExample);
copyPayloadBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(payloadPreview.textContent);
  setStatus(t('statusMessages.copiedPayload'), 'success');
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

if (languageSelect) {
  languageSelect.value = currentLanguage;
  languageSelect.addEventListener('change', () => {
    setLanguage(languageSelect.value);
    applyLanguage();
  });
}

if (apiBaseUrlInput && saveApiBaseUrlBtn) {
  const savedApiBase = normalizeApiBaseUrl(window.localStorage.getItem(API_BASE_URL_STORAGE_KEY));
  if (savedApiBase) {
    apiBaseUrlInput.value = savedApiBase;
  } else if (!isGithubPagesHost()) {
    apiBaseUrlInput.value = window.location.origin;
  }

  saveApiBaseUrlBtn.addEventListener('click', () => {
    const normalized = normalizeApiBaseUrl(apiBaseUrlInput.value);
    if (normalized) {
      window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalized);
      apiBaseUrlInput.value = normalized;
      setStatus(t('statusMessages.savedApiBaseUrl', { url: normalized }), 'success');
      return;
    }

    window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
    setStatus(t('statusMessages.clearedApiBaseUrl'), 'neutral');
  });
}

window.addEventListener('resize', schedulePedigreeLinkRender);

seedInitialState();
applyLanguage();
syncAlleleControls();
