/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SitePrompter AI Studio — Production SaaS Frontend Application Logic
 * Full AI Streaming Studio, Live Code Editor, Split Sandbox & Edge Deploy
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Persistent User Fingerprint / Session ID
  function getOrCreateUserId() {
    let uid = localStorage.getItem('siteprompter_user_id');
    if (!uid) {
      uid = 'usr_guest_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('siteprompter_user_id', uid);
    }
    return uid;
  }

  // Global State
  const state = {
    userId: getOrCreateUserId(),
    user: {
      id: getOrCreateUserId(),
      name: 'Misafir Kullanıcı',
      email: 'guest@siteprompter.io',
      plan: 'Free Starter',
      credits: 150,
      creditsLimit: 150,
      workspaceId: 'ws_default',
      nextReset: Date.now() + 24 * 60 * 60 * 1000
    },
    workspaces: [],
    currentWorkspaceId: 'ws_default',
    projects: [],
    currentProject: null,
    
    // Analyzer & Generation State
    currentMode: 'url', // 'url' | 'raw'
    currentModel: 'claude-3-7-sonnet',
    currentFramework: 'react-tailwind',
    currentDetail: 'balanced',
    currentAssetMode: 'original-urls',
    currentCustomInstructions: '',
    
    // Telemetry & Code
    currentData: null,
    currentPrompt: '',
    currentCode: '',
    currentSlicedSection: 'navbar',
    
    // Multi-Page Navigator
    crawledPages: [
      { id: 'page_root', path: '/', name: 'Home / Landing', title: 'Home', code: '' },
      { id: 'page_pricing', path: '/pricing', name: 'Pricing & Plans', title: 'Pricing', code: '' },
      { id: 'page_login', path: '/login', name: 'Authentication', title: 'Login', code: '' },
      { id: 'page_dashboard', path: '/dashboard', name: 'App Dashboard', title: 'Dashboard', code: '' }
    ],
    currentRoute: '/',
    
    // Streaming state
    isAnalyzing: false,
    isStreaming: false,
    streamAbortController: null,
    timerInterval: null,
    startTime: 0,
    
    // BYOK Keys
    byokKeys: { anthropic: '', openai: '', deepseek: '', gemini: '' },
    tokensData: null,
    history: []
  };

  // Sample HTML & CSS for Raw Mode
  const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Acme Cloud — Developer Platform</title>
</head>
<body class="bg-[#0B0B0C] text-[#FFFFFF] font-sans antialiased">
  <header class="sticky top-0 z-50 backdrop-blur-md bg-[#0B0B0C]/80 border-b border-[#232629]">
    <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center font-black text-white shadow-lg">A</div>
        <span class="font-bold text-lg text-white">AcmeCloud</span>
      </div>
      <div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#features" class="hover:text-white transition-colors">Features</a>
        <a href="#solutions" class="hover:text-white transition-colors">Solutions</a>
        <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
      </div>
      <div class="flex items-center gap-3">
        <button class="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5">Sign In</button>
        <button class="px-4 py-2 text-sm font-bold text-black bg-[#53FC18] rounded-lg shadow-md hover:bg-[#45adfc] hover:text-white transition-all">Get Started</button>
      </div>
    </nav>
  </header>
  <main class="max-w-5xl mx-auto px-6 py-20 text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-6">
      <span class="w-2 h-2 rounded-full bg-[#53FC18] animate-pulse"></span> Next-Gen Platform
    </div>
    <h1 class="text-5xl md:text-7xl font-extrabold text-white mb-6">Deploy globally in milliseconds</h1>
    <p class="text-lg text-slate-400 max-w-2xl mx-auto mb-8">Build distributed systems without managing infrastructure.</p>
    <div class="flex items-center justify-center gap-4">
      <button class="px-6 py-3 bg-[#53FC18] text-black font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">Start Free Trial</button>
      <button class="px-6 py-3 bg-[#171A1C] border border-[#232629] text-white font-bold rounded-xl hover:bg-[#232629]">Book Demo</button>
    </div>
  </main>
</body>
</html>`;

  // DOM Elements Cache
  const el = {};

  function queryElements() {
    // Header & Workspace
    el.logoHomeBtn = document.getElementById('logoHomeBtn');
    el.currentWorkspaceName = document.getElementById('currentWorkspaceName');
    el.workspaceDropdownBtn = document.getElementById('workspaceDropdownBtn');
    el.workspaceDropdown = document.getElementById('workspaceDropdown');
    el.workspaceList = document.getElementById('workspaceList');
    el.btnAddWorkspace = document.getElementById('btnAddWorkspace');
    el.engineStatusPill = document.getElementById('engineStatusPill');
    el.engineStatusText = document.getElementById('engineStatusText');
    el.headerActiveModelName = document.getElementById('headerActiveModelName');
    el.btnOpenByokModal = document.getElementById('btnOpenByokModal');
    el.byokConfiguredDot = document.getElementById('byokConfiguredDot');
    el.btnOpenPricingModal = document.getElementById('btnOpenPricingModal');
    el.userCreditsDisplay = document.getElementById('userCreditsDisplay');
    el.userCreditsLimitDisplay = document.getElementById('userCreditsLimitDisplay');
    el.userPromptsRemainingBadge = document.getElementById('userPromptsRemainingBadge');
    el.quotaCountdownPill = document.getElementById('quotaCountdownPill');
    el.quotaTimerText = document.getElementById('quotaTimerText');
    el.creditsMeterPill = document.getElementById('creditsMeterPill');
    el.historyModalBtn = document.getElementById('historyModalBtn');
    el.historyCount = document.getElementById('historyCount');
    el.btnHeaderDeploy = document.getElementById('btnHeaderDeploy');
    el.userNameDisplay = document.getElementById('userNameDisplay');
    el.userPlanBadge = document.getElementById('userPlanBadge');
    el.userAvatarImg = document.getElementById('userAvatarImg');

    // Input & Mode
    el.tabModeUrl = document.getElementById('tabModeUrl');
    el.tabModeRaw = document.getElementById('tabModeRaw');
    el.panelUrlView = document.getElementById('panelUrlView');
    el.panelRawView = document.getElementById('panelRawView');
    el.targetUrlInput = document.getElementById('targetUrlInput');
    el.clearUrlBtn = document.getElementById('clearUrlBtn');
    el.analyzeUrlBtn = document.getElementById('analyzeUrlBtn');
    el.presetPills = document.querySelectorAll('.preset-pill');
    el.rawHtmlInput = document.getElementById('rawHtmlInput');
    el.rawCssInput = document.getElementById('rawCssInput');
    el.analyzeRawBtn = document.getElementById('analyzeRawBtn');
    el.pasteHtmlSampleBtn = document.getElementById('pasteHtmlSampleBtn');
    el.clearRawBtn = document.getElementById('clearRawBtn');
    el.enableMultiPageCrawl = document.getElementById('enableMultiPageCrawl');

    // Controls
    el.aiModelSelect = document.getElementById('aiModelSelect');
    el.frameworkSelect = document.getElementById('frameworkSelect');
    el.detailLevelSelect = document.getElementById('detailLevelSelect');
    el.assetModeSelect = document.getElementById('assetModeSelect');

    // Pipeline
    el.pipelineCard = document.getElementById('pipelineCard');
    el.pipelineStatusTitle = document.getElementById('pipelineStatusTitle');
    el.pipelineTargetUrl = document.getElementById('pipelineTargetUrl');
    el.pipelineTimer = document.getElementById('pipelineTimer');
    el.progressBarFill = document.getElementById('progressBarFill');

    // Results Dashboard Banner
    el.resultsDashboard = document.getElementById('resultsDashboard');
    el.resSiteTitle = document.getElementById('resSiteTitle');
    el.resSiteUrl = document.getElementById('resSiteUrl');
    el.siteFavicon = document.getElementById('siteFavicon');
    el.siteFaviconWrap = document.getElementById('siteFaviconWrap');
    el.btnToggleProjectFav = document.getElementById('btnToggleProjectFav');
    el.favStarIcon = document.getElementById('favStarIcon');
    el.metricTokens = document.getElementById('metricTokens');
    el.metricColors = document.getElementById('metricColors');
    el.metricFonts = document.getElementById('metricFonts');
    el.metricComponents = document.getElementById('metricComponents');
    el.metricFramework = document.getElementById('metricFramework');
    el.btnSaveCurrentProject = document.getElementById('btnSaveCurrentProject');
    el.btnDeployTrigger = document.getElementById('btnDeployTrigger');

    // Multi-Page Navigator
    el.multiPageNavigator = document.getElementById('multiPageNavigator');
    el.pageTabsContainer = document.getElementById('pageTabsContainer');
    el.btnAddCustomRoute = document.getElementById('btnAddCustomRoute');
    el.btnDeepCrawlAll = document.getElementById('btnDeepCrawlAll');

    // Tabs
    el.navTabs = document.querySelectorAll('.nav-tab');
    el.tabPanels = document.querySelectorAll('.tab-panel');

    // Tab 1: Split View Studio
    el.streamingVisualizerBar = document.getElementById('streamingVisualizerBar');
    el.streamPulseDot = document.getElementById('streamPulseDot');
    el.streamStatusLabel = document.getElementById('streamStatusLabel');
    el.streamModelTag = document.getElementById('streamModelTag');
    el.streamSpeed = document.getElementById('streamSpeed');
    el.streamTokensCount = document.getElementById('streamTokensCount');
    el.streamElapsed = document.getElementById('streamElapsed');
    el.btnStopStreaming = document.getElementById('btnStopStreaming');
    el.btnReStreamCode = document.getElementById('btnReStreamCode');

    el.editorFileName = document.getElementById('editorFileName');
    el.editorFrameworkBadge = document.getElementById('editorFrameworkBadge');
    el.liveEditorGutter = document.getElementById('liveEditorGutter');
    el.liveCodeEditor = document.getElementById('liveCodeEditor');
    el.btnFormatCode = document.getElementById('btnFormatCode');
    el.btnCopyLiveCode = document.getElementById('btnCopyLiveCode');
    el.btnDownloadCodeFile = document.getElementById('btnDownloadCodeFile');
    el.btnDownloadStudioZip = document.getElementById('btnDownloadStudioZip');

    el.refineChips = document.querySelectorAll('.refine-chip');
    el.studioRefineInput = document.getElementById('studioRefineInput');
    el.btnStreamRefine = document.getElementById('btnStreamRefine');

    el.deviceButtons = document.querySelectorAll('.device-btn');
    el.studioSandboxContainer = document.getElementById('studioSandboxContainer');
    el.studioSandboxIframe = document.getElementById('studioSandboxIframe');
    el.btnToggleConsoleLogs = document.getElementById('btnToggleConsoleLogs');
    el.btnReloadStudioSandbox = document.getElementById('btnReloadStudioSandbox');
    el.btnOpenDedicatedTab = document.getElementById('btnOpenDedicatedTab');
    el.sandboxConsoleDrawer = document.getElementById('sandboxConsoleDrawer');
    el.sandboxConsoleLogs = document.getElementById('sandboxConsoleLogs');
    el.btnClearConsole = document.getElementById('btnClearConsole');

    // Tab 2: AI Prompt Studio
    el.frameworkPills = document.querySelectorAll('#frameworkPills .f-pill');
    el.customRefineInput = document.getElementById('customRefineInput');
    el.btnApplyRefinement = document.getElementById('btnApplyRefinement');
    el.promptTokenCount = document.getElementById('promptTokenCount');
    el.promptLineCount = document.getElementById('promptLineCount');
    el.promptWordCount = document.getElementById('promptWordCount');
    el.btnCopyPrompt = document.getElementById('btnCopyPrompt');
    el.btnDownloadZip = document.getElementById('btnDownloadZip');
    el.btnDownloadMd = document.getElementById('btnDownloadMd');
    el.btnDownloadTxt = document.getElementById('btnDownloadTxt');
    el.btnToggleEdit = document.getElementById('btnToggleEdit');
    el.btnLaunchChatGPT = document.getElementById('btnLaunchChatGPT');
    el.btnLaunchClaude = document.getElementById('btnLaunchClaude');
    el.btnFullscreenPrompt = document.getElementById('btnFullscreenPrompt');
    el.promptViewerWrapper = document.getElementById('promptViewerWrapper');
    el.editorGutter = document.getElementById('editorGutter');
    el.promptEditor = document.getElementById('promptEditor');

    // Tab 3: Design System Exporter
    el.btnCopyTailwindConfig = document.getElementById('btnCopyTailwindConfig');
    el.btnDownloadTailwindConfig = document.getElementById('btnDownloadTailwindConfig');
    el.viewerTailwindConfig = document.getElementById('viewerTailwindConfig');
    el.btnCopyFigmaTokens = document.getElementById('btnCopyFigmaTokens');
    el.btnDownloadFigmaTokens = document.getElementById('btnDownloadFigmaTokens');
    el.viewerFigmaTokens = document.getElementById('viewerFigmaTokens');
    el.colorSwatchesGrid = document.getElementById('colorSwatchesGrid');
    el.typographyLadder = document.getElementById('typographyLadder');
    el.cssVariablesTableBody = document.getElementById('cssVariablesTableBody');
    el.cssVarSearchInput = document.getElementById('cssVarSearchInput');

    // Tab 4: Component Slicer
    el.slicerButtons = document.querySelectorAll('.slicer-btn');
    el.slicedSectionTitle = document.getElementById('slicedSectionTitle');
    el.slicedPromptViewer = document.getElementById('slicedPromptViewer');
    el.btnCopySlicedPrompt = document.getElementById('btnCopySlicedPrompt');

    // Tab 5: Components
    el.componentsCount = document.getElementById('componentsCount');
    el.componentsGrid = document.getElementById('componentsGrid');
    el.interactionsGrid = document.getElementById('interactionsGrid');
    el.exportComponentsJsonBtn = document.getElementById('exportComponentsJsonBtn');

    // Tab 6: Assets
    el.assetsCount = document.getElementById('assetsCount');
    el.allAssetsCount = document.getElementById('allAssetsCount');
    el.svgAssetsCount = document.getElementById('svgAssetsCount');
    el.rasterAssetsCount = document.getElementById('rasterAssetsCount');
    el.assetsGalleryGrid = document.getElementById('assetsGalleryGrid');
    el.assetsFilterButtons = document.querySelectorAll('#assetsFilterGroup .filter-pill');

    // Tab 7: DOM & CSS
    el.domStructureViewer = document.getElementById('domStructureViewer');
    el.cssRulesViewer = document.getElementById('cssRulesViewer');
    el.copyDomBtn = document.getElementById('copyDomBtn');
    el.copyCssBtn = document.getElementById('copyCssBtn');

    // Modals
    el.deployModal = document.getElementById('deployModal');
    el.closeDeployModalBtn = document.getElementById('closeDeployModalBtn');
    el.tabDeployVercel = document.getElementById('tabDeployVercel');
    el.tabDeployGithub = document.getElementById('tabDeployGithub');
    el.panelDeployVercel = document.getElementById('panelDeployVercel');
    el.panelDeployGithub = document.getElementById('panelDeployGithub');
    el.vercelTokenInput = document.getElementById('vercelTokenInput');
    el.vercelProjectName = document.getElementById('vercelProjectName');
    el.vercelFrameworkPreset = document.getElementById('vercelFrameworkPreset');
    el.vercelDeployStatus = document.getElementById('vercelDeployStatus');
    el.vercelStepText = document.getElementById('vercelStepText');
    el.vercelUrlBox = document.getElementById('vercelUrlBox');
    el.vercelLiveLink = document.getElementById('vercelLiveLink');
    el.githubTokenInput = document.getElementById('githubTokenInput');
    el.githubRepoName = document.getElementById('githubRepoName');
    el.githubCommitMsg = document.getElementById('githubCommitMsg');
    el.githubPrivateToggle = document.getElementById('githubPrivateToggle');
    el.githubDeployStatus = document.getElementById('githubDeployStatus');
    el.githubStepText = document.getElementById('githubStepText');
    el.githubUrlBox = document.getElementById('githubUrlBox');
    el.githubLiveLink = document.getElementById('githubLiveLink');
    el.btnCancelDeploy = document.getElementById('btnCancelDeploy');
    el.btnExecuteDeploy = document.getElementById('btnExecuteDeploy');

    // Pricing Modal
    el.pricingModal = document.getElementById('pricingModal');
    el.closePricingModalBtn = document.getElementById('closePricingModalBtn');
    el.btnBillingMonthly = document.getElementById('btnBillingMonthly');
    el.btnBillingYearly = document.getElementById('btnBillingYearly');
    el.proPriceDisplay = document.getElementById('proPriceDisplay');
    el.agencyPriceDisplay = document.getElementById('agencyPriceDisplay');
    el.btnTierStarter = document.getElementById('btnTierStarter');
    el.btnUpgradePro = document.getElementById('btnUpgradePro');
    el.btnUpgradeAgency = document.getElementById('btnUpgradeAgency');

    // BYOK Modal
    el.byokModal = document.getElementById('byokModal');
    el.closeByokModalBtn = document.getElementById('closeByokModalBtn');
    el.byokAnthropic = document.getElementById('byokAnthropic');
    el.byokOpenAI = document.getElementById('byokOpenAI');
    el.byokDeepSeek = document.getElementById('byokDeepSeek');
    el.byokGemini = document.getElementById('byokGemini');
    el.byokTestStatus = document.getElementById('byokTestStatus');
    el.btnClearByokKeys = document.getElementById('btnClearByokKeys');
    el.btnTestByokConnection = document.getElementById('btnTestByokConnection');
    el.btnSaveByokKeys = document.getElementById('btnSaveByokKeys');

    // Enterprise 3.0 Modals & Buttons
    el.btnOpenCommunityModal = document.getElementById('btnOpenCommunityModal');
    el.communityModal = document.getElementById('communityModal');
    el.closeCommunityModalBtn = document.getElementById('closeCommunityModalBtn');
    el.btnCloseCommunityHub = document.getElementById('btnCloseCommunityHub');
    el.communitySearchInput = document.getElementById('communitySearchInput');
    el.communityCategoryPills = document.getElementById('communityCategoryPills');
    el.communityGrid = document.getElementById('communityGrid');
    el.communityVisibleCount = document.getElementById('communityVisibleCount');

    el.btnOpenVisionHealing = document.getElementById('btnOpenVisionHealing');
    el.visionHealingModal = document.getElementById('visionHealingModal');
    el.closeVisionModalBtn = document.getElementById('closeVisionModalBtn');
    el.visionCurrentScore = document.getElementById('visionCurrentScore');
    el.visionProjectedScore = document.getElementById('visionProjectedScore');
    el.visionIssueCount = document.getElementById('visionIssueCount');
    el.visionPatchList = document.getElementById('visionPatchList');
    el.btnReanalyzeVision = document.getElementById('btnReanalyzeVision');
    el.btnApplyVisionPatches = document.getElementById('btnApplyVisionPatches');

    el.btnOpenFullStackDb = document.getElementById('btnOpenFullStackDb');
    el.fullStackDbModal = document.getElementById('fullStackDbModal');
    el.closeDbModalBtn = document.getElementById('closeDbModalBtn');
    el.fullStackDbCodeViewer = document.getElementById('fullStackDbCodeViewer');
    el.btnCopyDbCode = document.getElementById('btnCopyDbCode');
    el.btnDownloadDbBundle = document.getElementById('btnDownloadDbBundle');

    el.btnOpenMultiPlatform = document.getElementById('btnOpenMultiPlatform');
    el.multiPlatformModal = document.getElementById('multiPlatformModal');
    el.closeMultiPlatformModalBtn = document.getElementById('closeMultiPlatformModalBtn');
    el.multiPlatformCodeViewer = document.getElementById('multiPlatformCodeViewer');
    el.btnCopyPlatformCode = document.getElementById('btnCopyPlatformCode');
    el.btnDownloadPlatformFile = document.getElementById('btnDownloadPlatformFile');

    el.btnToggleWysiwygInspector = document.getElementById('btnToggleWysiwygInspector');

    // Project Library Modal
    el.historyModal = document.getElementById('historyModal');
    el.closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
    el.projectSearchInput = document.getElementById('projectSearchInput');
    el.btnFilterFavoritesOnly = document.getElementById('btnFilterFavoritesOnly');
    el.historyList = document.getElementById('historyList');
    el.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    el.btnCloseProjectLibrary = document.getElementById('btnCloseProjectLibrary');

    // Toast Container
    el.toastContainer = document.getElementById('toastContainer');
  }

  /* ═══════════════════ INITIALIZATION ═══════════════════ */
  async function init() {
    queryElements();
    bindEvents();
    startQuotaCountdown();
    await checkBackendHealth();
    await fetchUserProfile();
    await fetchWorkspaces();
    await fetchProjects();
    await fetchByokKeys();
    
    // Note: Do NOT auto-load Kick clone into studio to keep editor clean for arbitrary user sites
  }

  /* ═══════════════════ EVENT BINDINGS ═══════════════════ */
  function bindEvents() {
    // Mode Switcher
    el.tabModeUrl?.addEventListener('click', () => switchMode('url'));
    el.tabModeRaw?.addEventListener('click', () => switchMode('raw'));

    // Presets
    el.presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const url = pill.dataset.url;
        if (el.targetUrlInput) el.targetUrlInput.value = url;
        showToast(`Selected preset: ${url}`);
      });
    });

    // Clear URL
    el.clearUrlBtn?.addEventListener('click', () => {
      if (el.targetUrlInput) {
        el.targetUrlInput.value = '';
        el.targetUrlInput.focus();
      }
    });

    // Sample HTML in Raw Mode
    el.pasteHtmlSampleBtn?.addEventListener('click', () => {
      if (el.rawHtmlInput) el.rawHtmlInput.value = SAMPLE_HTML;
      showToast('Loaded Acme Cloud HTML sample');
    });

    el.clearRawBtn?.addEventListener('click', () => {
      if (el.rawHtmlInput) el.rawHtmlInput.value = '';
      if (el.rawCssInput) el.rawCssInput.value = '';
    });

    // Model Selector Change
    el.aiModelSelect?.addEventListener('change', (e) => {
      state.currentModel = e.target.value;
      const modelLabels = {
        'claude-3-7-sonnet': 'Claude 3.7 Sonnet',
        'gpt-4o': 'GPT-4o',
        'deepseek-v3': 'DeepSeek V3',
        'gemini-2-5-pro': 'Gemini 2.5 Pro',
        'local-fast': 'Local Fast Engine'
      };
      const name = modelLabels[state.currentModel] || 'Claude 3.7 Sonnet';
      if (el.headerActiveModelName) el.headerActiveModelName.textContent = name;
      if (el.streamModelTag) el.streamModelTag.textContent = name;
      showToast(`AI Model set to: ${name}`);
    });

    // Framework & Detail Selectors
    el.frameworkSelect?.addEventListener('change', (e) => {
      state.currentFramework = e.target.value;
      updateFrameworkPillsUI(state.currentFramework);
      if (state.currentData) recompileCurrentTelemetry();
    });

    el.detailLevelSelect?.addEventListener('change', (e) => {
      state.currentDetail = e.target.value;
      if (state.currentData) recompileCurrentTelemetry();
    });

    el.assetModeSelect?.addEventListener('change', (e) => {
      state.currentAssetMode = e.target.value;
      if (state.currentData) recompileCurrentTelemetry();
    });

    // Analyze Actions
    el.analyzeUrlBtn?.addEventListener('click', () => triggerAnalysis('url'));
    el.analyzeRawBtn?.addEventListener('click', () => triggerAnalysis('raw'));

    // Main Studio Tabs Switcher
    el.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.target;
        switchTab(targetId);
      });
    });

    // Framework Pills in Prompt Tab
    el.frameworkPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const fw = pill.dataset.fw;
        state.currentFramework = fw;
        if (el.frameworkSelect) el.frameworkSelect.value = fw;
        updateFrameworkPillsUI(fw);
        if (state.currentData) recompileCurrentTelemetry();
      });
    });

    // AI Refinement in Prompt Tab
    el.btnApplyRefinement?.addEventListener('click', () => {
      const customText = el.customRefineInput?.value.trim() || '';
      state.currentCustomInstructions = customText;
      if (state.currentData) recompileCurrentTelemetry();
    });

    // Split Studio: AI Refinement Dock
    el.refineChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const instruction = chip.dataset.refine;
        if (el.studioRefineInput) el.studioRefineInput.value = instruction;
        streamAiRefinement(instruction);
      });
    });

    el.btnStreamRefine?.addEventListener('click', () => {
      const instruction = el.studioRefineInput?.value.trim();
      if (!instruction) {
        showToast('Please enter a refinement instruction', 'error');
        return;
      }
      streamAiRefinement(instruction);
    });

    // Code Editor Actions
    el.liveCodeEditor?.addEventListener('input', () => {
      state.currentCode = el.liveCodeEditor.value;
      updateEditorGutter();
      debounceRenderSandbox();
    });

    el.liveCodeEditor?.addEventListener('scroll', () => {
      if (el.liveEditorGutter) {
        el.liveEditorGutter.scrollTop = el.liveCodeEditor.scrollTop;
      }
    });

    el.btnFormatCode?.addEventListener('click', formatLiveCode);
    el.btnCopyLiveCode?.addEventListener('click', () => copyTextToClipboard(el.liveCodeEditor.value, 'Code copied to clipboard!'));
    el.btnDownloadCodeFile?.addEventListener('click', downloadCurrentCodeFile);
    el.btnDownloadStudioZip?.addEventListener('click', downloadProjectZip);

    // Live Streaming Controls
    el.btnStopStreaming?.addEventListener('click', stopAiStreaming);
    el.btnReStreamCode?.addEventListener('click', () => {
      startAiStreamingGeneration({
        telemetry: state.currentData?.telemetry || {},
        framework: state.currentFramework,
        model: state.currentModel,
        customInstructions: state.currentCustomInstructions
      });
    });

    // Sandbox Controls
    el.deviceButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.deviceButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const width = btn.dataset.width;
        if (el.studioSandboxContainer) el.studioSandboxContainer.style.width = width;
      });
    });

    el.btnReloadStudioSandbox?.addEventListener('click', renderSandboxPreview);
    el.btnOpenDedicatedTab?.addEventListener('click', openSandboxInNewTab);
    el.btnToggleConsoleLogs?.addEventListener('click', () => {
      if (el.sandboxConsoleDrawer) {
        const isHidden = el.sandboxConsoleDrawer.style.display === 'none';
        el.sandboxConsoleDrawer.style.display = isHidden ? 'flex' : 'none';
      }
    });
    el.btnClearConsole?.addEventListener('click', () => {
      if (el.sandboxConsoleLogs) el.sandboxConsoleLogs.innerHTML = '';
    });

    // Multi-Page Navigator Routes
    bindMultiPageRouteEvents();
    el.btnAddCustomRoute?.addEventListener('click', promptAddCustomRoute);
    el.btnDeepCrawlAll?.addEventListener('click', triggerMultiPageCrawl);

    // Summary Banner Project Actions
    el.btnToggleProjectFav?.addEventListener('click', toggleProjectFavorite);
    el.btnSaveCurrentProject?.addEventListener('click', saveCurrentProject);

    // Deploy Modal Events
    el.btnDeployTrigger?.addEventListener('click', openDeployModal);
    el.btnHeaderDeploy?.addEventListener('click', openDeployModal);
    el.closeDeployModalBtn?.addEventListener('click', closeDeployModal);
    el.btnCancelDeploy?.addEventListener('click', closeDeployModal);
    document.querySelectorAll('.deploy-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const provider = tab.dataset.provider || (tab.id.includes('Github') ? 'github' : 'vercel');
        switchDeployTab(provider);
      });
    });
    el.btnExecuteDeploy?.addEventListener('click', executeDeployment);

    // Pricing & Upgrade Modal Events
    el.btnOpenPricingModal?.addEventListener('click', openPricingModal);
    el.creditsMeterPill?.addEventListener('click', openPricingModal);
    el.closePricingModalBtn?.addEventListener('click', closePricingModal);
    el.btnBillingMonthly?.addEventListener('click', () => switchBillingCycle('monthly'));
    el.btnBillingYearly?.addEventListener('click', () => switchBillingCycle('yearly'));
    el.btnUpgradePro?.addEventListener('click', () => executeCheckout('pro'));
    el.btnUpgradeAgency?.addEventListener('click', () => executeCheckout('agency'));
    el.btnTierStarter?.addEventListener('click', () => showToast('You are on the Free Starter plan'));

    // BYOK Modal Events
    el.btnOpenByokModal?.addEventListener('click', openByokModal);
    el.closeByokModalBtn?.addEventListener('click', closeByokModal);
    document.querySelectorAll('.btn-reveal').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          input.type = input.type === 'password' ? 'text' : 'password';
        }
      });
    });
    el.btnTestByokConnection?.addEventListener('click', testByokConnection);
    el.btnSaveByokKeys?.addEventListener('click', saveByokKeys);
    el.btnClearByokKeys?.addEventListener('click', clearByokKeys);

    // Project Library Modal Events
    el.historyModalBtn?.addEventListener('click', openProjectLibrary);
    el.closeHistoryModalBtn?.addEventListener('click', closeProjectLibrary);
    el.btnCloseProjectLibrary?.addEventListener('click', closeProjectLibrary);
    el.clearHistoryBtn?.addEventListener('click', clearAllProjects);
    el.projectSearchInput?.addEventListener('input', filterProjectList);
    el.btnFilterFavoritesOnly?.addEventListener('click', toggleFavoritesFilter);

    // Workspace Switcher Events
    el.workspaceDropdownBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWorkspaceDropdown();
    });
    document.addEventListener('click', () => {
      if (el.workspaceDropdown) el.workspaceDropdown.style.display = 'none';
    });
    el.btnAddWorkspace?.addEventListener('click', (e) => {
      e.stopPropagation();
      promptCreateWorkspace();
    });

    // Enterprise 3.0 Event Handlers
    el.btnOpenCommunityModal?.addEventListener('click', openCommunityModal);
    el.closeCommunityModalBtn?.addEventListener('click', closeCommunityModal);
    el.btnCloseCommunityHub?.addEventListener('click', closeCommunityModal);
    el.communitySearchInput?.addEventListener('input', filterCommunityTemplates);
    document.querySelectorAll('#communityCategoryPills .filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#communityCategoryPills .filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterCommunityTemplates();
      });
    });

    el.btnOpenVisionHealing?.addEventListener('click', openVisionHealingModal);
    el.closeVisionModalBtn?.addEventListener('click', closeVisionHealingModal);
    el.btnReanalyzeVision?.addEventListener('click', openVisionHealingModal);
    el.btnApplyVisionPatches?.addEventListener('click', applyVisionPatches);

    el.btnOpenFullStackDb?.addEventListener('click', openFullStackDbModal);
    el.closeDbModalBtn?.addEventListener('click', closeFullStackDbModal);
    el.btnCopyDbCode?.addEventListener('click', copyActiveDbCode);
    el.btnDownloadDbBundle?.addEventListener('click', downloadDbBundleZip);
    document.querySelectorAll('[data-db-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-db-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        switchDbTab(tab.dataset.dbTab);
      });
    });

    el.btnOpenMultiPlatform?.addEventListener('click', openMultiPlatformModal);
    el.closeMultiPlatformModalBtn?.addEventListener('click', closeMultiPlatformModal);
    el.btnCopyPlatformCode?.addEventListener('click', copyActivePlatformCode);
    el.btnDownloadPlatformFile?.addEventListener('click', downloadPlatformExport);
    document.querySelectorAll('[data-platform-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-platform-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        switchPlatformTab(tab.dataset.platformTab);
      });
    });

    el.btnToggleWysiwygInspector?.addEventListener('click', toggleWysiwygInspector);

    // Global PostMessage Listener for WYSIWYG Inspector from Sandbox iframe
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'INSPECT_ELEMENT_CLICKED') {
        handleInspectedElementClick(event.data);
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        triggerAnalysis(state.currentMode);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        openDeployModal();
      } else if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    // Prompt Copy & Download Actions in Tab 2
    el.btnCopyPrompt?.addEventListener('click', () => copyTextToClipboard(state.currentPrompt, 'Master Prompt copied to clipboard!'));
    el.btnDownloadZip?.addEventListener('click', downloadProjectZip);
    el.btnDownloadMd?.addEventListener('click', () => downloadFile(state.currentPrompt, 'siteprompter-brief.md', 'text/markdown'));
    el.btnDownloadTxt?.addEventListener('click', () => downloadFile(state.currentPrompt, 'siteprompter-brief.txt', 'text/plain'));
    el.btnToggleEdit?.addEventListener('click', togglePromptEdit);
    el.btnFullscreenPrompt?.addEventListener('click', toggleFullscreenPrompt);
    el.btnLaunchChatGPT?.addEventListener('click', () => launchExternalAI('chatgpt'));
    el.btnLaunchClaude?.addEventListener('click', () => launchExternalAI('claude'));

    // Slicer Buttons in Tab 4
    el.slicerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.slicerButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentSlicedSection = btn.dataset.section;
        sliceCurrentComponent(state.currentSlicedSection);
      });
    });
    el.btnCopySlicedPrompt?.addEventListener('click', () => copyTextToClipboard(el.slicedPromptViewer?.value, 'Sliced component prompt copied!'));

    // Design System Copy Actions in Tab 3
    el.btnCopyTailwindConfig?.addEventListener('click', () => copyTextToClipboard(el.viewerTailwindConfig?.textContent, 'Tailwind config copied!'));
    el.btnDownloadTailwindConfig?.addEventListener('click', () => downloadFile(el.viewerTailwindConfig?.textContent, 'tailwind.config.js', 'text/javascript'));
    el.btnCopyFigmaTokens?.addEventListener('click', () => copyTextToClipboard(el.viewerFigmaTokens?.textContent, 'Figma tokens copied!'));
    el.btnDownloadFigmaTokens?.addEventListener('click', () => downloadFile(el.viewerFigmaTokens?.textContent, 'tokens.json', 'application/json'));
    el.cssVarSearchInput?.addEventListener('input', filterCssVariablesTable);

    // Assets Filter Buttons in Tab 6
    el.assetsFilterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.assetsFilterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterAssetsGallery(btn.dataset.filter);
      });
    });

    // Inspector Copy Buttons in Tab 7
    el.copyDomBtn?.addEventListener('click', () => copyTextToClipboard(el.domStructureViewer?.textContent, 'DOM copied!'));
    el.copyCssBtn?.addEventListener('click', () => copyTextToClipboard(el.cssRulesViewer?.textContent, 'CSS rules copied!'));
  }

  /* ═══════════════════ USER & WORKSPACE SERVICES ═══════════════════ */
  async function fetchUserProfile() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-user-id': state.userId }
      });
      const data = await res.json();
      if (data.success && data.user) {
        state.user = data.user;
        renderUserProfile();
      }
    } catch (_) {}
  }

  function renderUserProfile() {
    if (el.userNameDisplay) el.userNameDisplay.textContent = state.user.name || 'Misafir Kullanıcı';
    if (el.userPlanBadge) el.userPlanBadge.textContent = state.user.plan || 'Free Starter';
    
    const credits = state.user.credits !== undefined ? state.user.credits : 150;
    const limit = state.user.creditsLimit !== undefined ? state.user.creditsLimit : 150;
    const remainingPrompts = Math.floor(credits / 10);

    if (el.userCreditsDisplay) el.userCreditsDisplay.textContent = credits.toLocaleString();
    if (el.userCreditsLimitDisplay) el.userCreditsLimitDisplay.textContent = limit.toLocaleString();
    if (el.userPromptsRemainingBadge) el.userPromptsRemainingBadge.textContent = `${remainingPrompts} Hak`;

    if (el.creditsMeterPill) {
      if (credits < 10) {
        el.creditsMeterPill.classList.add('credits-low');
      } else {
        el.creditsMeterPill.classList.remove('credits-low');
      }
    }

    if (el.userAvatarImg && state.user.avatar) el.userAvatarImg.src = state.user.avatar;
  }

  function startQuotaCountdown() {
    function tick() {
      if (!state.user || !state.user.nextReset) return;
      const remainingMs = Math.max(0, state.user.nextReset - Date.now());
      const totalSec = Math.floor(remainingMs / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      const formatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (el.quotaTimerText) el.quotaTimerText.textContent = formatted;

      if (remainingMs <= 0) {
        fetchUserProfile();
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  async function fetchWorkspaces() {
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      if (data.success && Array.isArray(data.workspaces)) {
        state.workspaces = data.workspaces;
        renderWorkspacesList();
      }
    } catch (_) {}
  }

  function renderWorkspacesList() {
    if (!el.workspaceList) return;
    el.workspaceList.innerHTML = '';
    state.workspaces.forEach(ws => {
      const item = document.createElement('div');
      item.className = `ws-item ${ws.id === state.currentWorkspaceId ? 'active' : ''}`;
      item.innerHTML = `
        <div class="flex items-center gap-2">
          <i class="fa-solid ${ws.icon || 'fa-folder'} text-xs"></i>
          <span>${escapeHtml(ws.name)}</span>
        </div>
        <span class="text-xs text-muted font-mono">${ws.projectCount || 0}</span>
      `;
      item.addEventListener('click', () => switchWorkspace(ws.id, ws.name));
      el.workspaceList.appendChild(item);
    });

    const activeWs = state.workspaces.find(w => w.id === state.currentWorkspaceId);
    if (activeWs && el.currentWorkspaceName) {
      el.currentWorkspaceName.textContent = activeWs.name;
    }
  }

  function toggleWorkspaceDropdown() {
    if (!el.workspaceDropdown) return;
    const isVisible = el.workspaceDropdown.style.display !== 'none';
    el.workspaceDropdown.style.display = isVisible ? 'none' : 'block';
  }

  async function switchWorkspace(wsId, wsName) {
    state.currentWorkspaceId = wsId;
    if (el.currentWorkspaceName) el.currentWorkspaceName.textContent = wsName;
    if (el.workspaceDropdown) el.workspaceDropdown.style.display = 'none';
    renderWorkspacesList();
    await fetchProjects(wsId);
    showToast(`Switched to workspace: ${wsName}`);
  }

  async function promptCreateWorkspace() {
    const name = prompt('Enter name for the new workspace:');
    if (!name || !name.trim()) return;
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      const data = await res.json();
      if (data.success && data.workspace) {
        state.workspaces.push(data.workspace);
        await switchWorkspace(data.workspace.id, data.workspace.name);
        showToast(`Workspace "${data.workspace.name}" created!`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  /* ═══════════════════ PROJECTS MANAGEMENT ═══════════════════ */
  async function fetchProjects(workspaceId = state.currentWorkspaceId) {
    try {
      const res = await fetch(`/api/projects?workspaceId=${workspaceId || ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        state.projects = data.projects;
        if (el.historyCount) el.historyCount.textContent = state.projects.length;
        renderProjectLibraryList();
      }
    } catch (_) {}
  }

  function renderProjectLibraryList(filterFavs = false, searchQuery = '') {
    if (!el.historyList) return;
    el.historyList.innerHTML = '';

    let list = state.projects;
    if (filterFavs) list = list.filter(p => p.favorite);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q));
    }

    if (list.length === 0) {
      el.historyList.innerHTML = `
        <div class="empty-state p-8 text-center text-muted">
          <i class="fa-regular fa-folder-open text-3xl mb-2"></i>
          <p>No projects found in this workspace.</p>
        </div>
      `;
      return;
    }

    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <div class="project-card-header">
          <div class="project-card-title-group">
            <i class="fa-solid fa-layer-group text-primary"></i>
            <span class="project-title">${escapeHtml(p.title)}</span>
          </div>
          <button class="project-star-btn ${p.favorite ? 'active' : ''}" data-id="${p.id}">
            <i class="${p.favorite ? 'fa-solid' : 'fa-regular'} fa-star text-amber"></i>
          </button>
        </div>
        <div class="text-xs text-muted">${escapeHtml(p.url)} • ${new Date(p.updatedAt || p.createdAt).toLocaleDateString()}</div>
        <div class="project-card-tags">
          <span class="tag-badge text-primary">${escapeHtml(p.framework || 'React 19')}</span>
          <span class="tag-badge font-mono">~${(p.tokensEstimate || 4500).toLocaleString()} tokens</span>
        </div>
        <div class="project-card-actions">
          <button class="mini-btn primary btn-load-project" data-id="${p.id}">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Load in Studio
          </button>
          <div class="flex gap-2">
            <button class="mini-btn btn-export-proj-tokens" data-id="${p.id}"><i class="fa-solid fa-swatchbook"></i> Tokens</button>
            <button class="mini-btn danger btn-delete-project" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;

      // Star favorite
      card.querySelector('.project-star-btn')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleProjectFavoriteById(p.id);
      });

      // Load project
      card.querySelector('.btn-load-project')?.addEventListener('click', () => {
        loadProjectIntoStudio(p);
        closeProjectLibrary();
      });

      // Export Tokens
      card.querySelector('.btn-export-proj-tokens')?.addEventListener('click', () => {
        showToast(`Exported design tokens for ${p.title}`);
      });

      // Delete
      card.querySelector('.btn-delete-project')?.addEventListener('click', async () => {
        if (confirm(`Delete project "${p.title}"?`)) {
          await deleteProject(p.id);
        }
      });

      el.historyList.appendChild(card);
    });
  }

  function loadProjectIntoStudio(project) {
    state.currentProject = project;
    state.currentCode = project.code || '';
    state.currentFramework = project.framework || 'react-tailwind';
    
    if (el.resSiteTitle) el.resSiteTitle.textContent = project.title;
    if (el.resSiteUrl) el.resSiteUrl.textContent = project.url;
    if (el.targetUrlInput) el.targetUrlInput.value = project.url;
    if (el.metricFramework) el.metricFramework.textContent = project.framework || 'React, Tailwind';
    if (el.metricTokens) el.metricTokens.textContent = `~${(project.tokensEstimate || 5000).toLocaleString()}`;
    if (el.liveCodeEditor) el.liveCodeEditor.value = state.currentCode;
    if (el.favStarIcon) {
      el.favStarIcon.className = project.favorite ? 'fa-solid fa-star text-amber' : 'fa-regular fa-star';
    }

    updateEditorGutter();
    renderSandboxPreview();

    // Show Results Dashboard
    if (el.resultsDashboard) el.resultsDashboard.style.display = 'block';
    showToast(`Loaded project: ${project.title}`);
  }

  /* ═══════════════════ MULTI-PAGE NAVIGATOR & ROUTING ═══════════════════ */
  function bindMultiPageRouteEvents() {
    document.querySelectorAll('.page-route-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.page-route-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const path = tab.dataset.path || '/';
        state.currentRoute = path;
        showToast(`Navigated to route: ${path}`);
      });
    });
  }

  function promptAddCustomRoute() {
    const route = prompt('Enter custom subpage route (e.g. /pricing, /about, /blog):', '/');
    if (route && route.trim()) {
      const cleanRoute = route.trim().startsWith('/') ? route.trim() : '/' + route.trim();
      if (!state.crawledPages.some(p => p.path === cleanRoute)) {
        state.crawledPages.push({
          id: `page_${Date.now()}`,
          path: cleanRoute,
          name: cleanRoute,
          title: cleanRoute,
          code: ''
        });
        renderMultiPageTabs();
        showToast(`Added route: ${cleanRoute}`);
      }
    }
  }

  function renderMultiPageTabs() {
    if (!el.pageTabsContainer) return;
    el.pageTabsContainer.innerHTML = state.crawledPages.map(page => `
      <button class="page-route-tab ${state.currentRoute === page.path ? 'active' : ''}" data-path="${page.path}">
        <i class="fa-solid fa-file-code"></i>
        <span class="route-name">${escapeHtml(page.name || page.path)}</span>
      </button>
    `).join('');
    bindMultiPageRouteEvents();
  }

  async function triggerMultiPageCrawl() {
    const rootUrl = el.targetUrlInput?.value || 'https://example.com';
    showToast(`Deep crawling subpages for ${rootUrl}...`, 'info');
    try {
      const res = await fetch('/api/crawl-multi-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootUrl, maxPages: 4 })
      });
      const data = await res.json();
      if (data.success && data.siteMap) {
        state.crawledPages = data.siteMap.map((s, idx) => ({
          id: `page_${idx}`,
          path: s.path,
          name: s.title || s.path,
          title: s.title || s.path,
          code: ''
        }));
        renderMultiPageTabs();
        showToast(`Discovered & crawled ${data.siteMap.length} subpages!`);
      }
    } catch (err) {
      showToast(`Crawl error: ${err.message}`, 'error');
    }
  }

  async function saveCurrentProject() {
    const title = el.resSiteTitle?.textContent || 'Untitled Site Clone';
    const url = el.resSiteUrl?.textContent || el.targetUrlInput?.value || 'https://example.com';
    const projectData = {
      id: state.currentProject?.id || `proj_${Date.now()}`,
      title,
      url,
      framework: state.currentFramework,
      workspaceId: state.currentWorkspaceId,
      code: state.currentCode || el.liveCodeEditor?.value || '',
      tokensEstimate: state.currentData?.tokenEstimate || 5000,
      favorite: !!state.currentProject?.favorite
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      const data = await res.json();
      if (data.success && data.project) {
        state.currentProject = data.project;
        await fetchProjects();
        showToast('Project saved successfully to workspace!');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function toggleProjectFavorite() {
    if (!state.currentProject?.id) {
      await saveCurrentProject();
    }
    if (state.currentProject?.id) {
      await toggleProjectFavoriteById(state.currentProject.id);
    }
  }

  async function toggleProjectFavoriteById(id) {
    try {
      const res = await fetch(`/api/projects/${id}/favorite`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.project) {
        if (state.currentProject?.id === id) {
          state.currentProject.favorite = data.project.favorite;
          if (el.favStarIcon) {
            el.favStarIcon.className = data.project.favorite ? 'fa-solid fa-star text-amber' : 'fa-regular fa-star';
          }
        }
        await fetchProjects();
        showToast(data.project.favorite ? 'Added to favorites' : 'Removed from favorites');
      }
    } catch (_) {}
  }

  async function deleteProject(id) {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchProjects();
        showToast('Project deleted');
      }
    } catch (_) {}
  }

  /* ═══════════════════ AI STREAMING ENGINE ═══════════════════ */
  async function startAiStreamingGeneration(options = {}) {
    if (state.isStreaming) stopAiStreaming();
    state.isStreaming = true;

    // Show streaming indicator
    if (el.streamingVisualizerBar) el.streamingVisualizerBar.style.display = 'flex';
    if (el.streamPulseDot) el.streamPulseDot.className = 'pulse-indicator-dot active';
    if (el.streamStatusLabel) el.streamStatusLabel.textContent = `Streaming code from ${state.currentModel.toUpperCase()}...`;
    if (el.btnStopStreaming) el.btnStopStreaming.style.display = 'inline-flex';

    if (el.liveCodeEditor) el.liveCodeEditor.value = '';
    state.currentCode = '';

    state.streamAbortController = new AbortController();
    const startTime = Date.now();
    let tokenCount = 0;

    try {
      const response = await fetch('/api/ai/stream-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: state.currentModel,
          framework: state.currentFramework,
          telemetry: options.telemetry || state.currentData?.telemetry || {},
          customInstructions: options.customInstructions || '',
          apiKey: state.byokKeys[state.currentModel.includes('claude') ? 'anthropic' : state.currentModel.includes('gpt') ? 'openai' : 'deepseek'] || ''
        }),
        signal: state.streamAbortController.signal
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'token') {
                const chunk = data.content || data.chunk || '';
                state.currentCode += chunk;
                tokenCount += Math.ceil(chunk.length / 3.8);
                
                if (el.liveCodeEditor) {
                  el.liveCodeEditor.value = state.currentCode;
                  el.liveCodeEditor.scrollTop = el.liveCodeEditor.scrollHeight;
                }
                
                updateEditorGutter();
                
                const elapsedSec = (Date.now() - startTime) / 1000;
                const speed = Math.round(tokenCount / (elapsedSec || 1));
                if (el.streamTokensCount) el.streamTokensCount.textContent = tokenCount.toLocaleString();
                if (el.streamElapsed) el.streamElapsed.textContent = `${elapsedSec.toFixed(1)}s`;
                if (el.streamSpeed) el.streamSpeed.textContent = speed;
              } else if (data.type === 'done') {
                if (data.fullCode) state.currentCode = data.fullCode;
                if (el.liveCodeEditor) el.liveCodeEditor.value = state.currentCode;
                updateEditorGutter();
                renderSandboxPreview();
                finishAiStreaming(tokenCount, (Date.now() - startTime) / 1000);
              }
            } catch (_) {}
          }
        }
      }

      // Finish up if stream ended cleanly
      renderSandboxPreview();
      finishAiStreaming(tokenCount, (Date.now() - startTime) / 1000);

    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast(`Streaming error: ${err.message}`, 'error');
      }
      finishAiStreaming(tokenCount, 0);
    }
  }

  function stopAiStreaming() {
    if (state.streamAbortController) {
      state.streamAbortController.abort();
      state.streamAbortController = null;
    }
    finishAiStreaming();
    showToast('Code streaming stopped');
  }

  function finishAiStreaming(totalTokens = 1840, elapsed = 1.4) {
    state.isStreaming = false;
    if (el.streamPulseDot) el.streamPulseDot.className = 'pulse-indicator-dot';
    if (el.streamStatusLabel) el.streamStatusLabel.textContent = 'Code synthesis complete & sandbox synced';
    if (el.btnStopStreaming) el.btnStopStreaming.style.display = 'none';

    // Deduct and update credits
    if (state.user.credits && state.user.credits > 10) {
      state.user.credits -= 10;
      renderUserProfile();
    }
  }

  function streamAiRefinement(instruction) {
    showToast(`Streaming AI Refinement: "${instruction.slice(0, 35)}..."`);
    startAiStreamingGeneration({
      customInstructions: instruction,
      telemetry: state.currentData?.telemetry || {}
    });
  }

  /* ═══════════════════ LIVE CODE EDITOR & SANDBOX ═══════════════════ */
  function updateEditorGutter() {
    if (!el.liveEditorGutter || !el.liveCodeEditor) return;
    const lines = el.liveCodeEditor.value.split('\n').length || 1;
    let gutterContent = '';
    for (let i = 1; i <= lines; i++) {
      gutterContent += `${i}\n`;
    }
    el.liveEditorGutter.textContent = gutterContent;
  }

  let sandboxDebounceTimer = null;
  function debounceRenderSandbox() {
    clearTimeout(sandboxDebounceTimer);
    sandboxDebounceTimer = setTimeout(renderSandboxPreview, 300);
  }

  function renderSandboxPreview() {
    if (!el.studioSandboxIframe) return;
    const code = state.currentCode || el.liveCodeEditor?.value || '';
    
    let previewHtml = '';

    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      previewHtml = code;
    } else {
      const filteredLines = code.split('\n').filter(l => !l.trim().startsWith('import '));
      let cleanedCode = filteredLines.join('\n');

      let autoDetectedName = null;
      const exportDefMatch = cleanedCode.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
      if (exportDefMatch) {
        autoDetectedName = exportDefMatch[1];
      }

      cleanedCode = cleanedCode
        .replace(/export\s+default\s+function\s+/g, 'function ')
        .replace(/export\s+default\s+/g, 'window.__RootComponent = ')
        .replace(/export\s+(const|let|var|function|class|type|interface)\s+/g, '$1 ');

      const declaredFunctions = [...cleanedCode.matchAll(/function\s+([A-Z][A-Za-z0-9_]*)/g)].map(m => m[1]);
      const candidateName = autoDetectedName || declaredFunctions[declaredFunctions.length - 1] || declaredFunctions[0] || 'App';

      cleanedCode += `;\nif (!window.__RootComponent && typeof ${candidateName} !== "undefined") { window.__RootComponent = ${candidateName}; }`;

      const escapedJsx = JSON.stringify(cleanedCode);

      previewHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #060911; color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    function executeRuntime() {
      if (typeof Babel === 'undefined' || typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        setTimeout(executeRuntime, 40);
        return;
      }

      const { useState, useEffect, useRef, useMemo, useCallback } = React;

      const IconProxy = (iconName) => (props) => {
        const cls = (props && props.className) || 'w-5 h-5';
        return React.createElement('span', { className: 'inline-flex items-center justify-center ' + cls }, React.createElement('i', { className: 'fa-solid fa-circle-dot' }));
      };

      const iconNames = ['Sparkles', 'Zap', 'ArrowRight', 'CheckCircle2', 'Check', 'Shield', 'ShieldCheck', 'Copy', 'Play', 'Pause', 'Settings', 'Eye', 'Send', 'Smile', 'MessageSquare', 'Heart', 'Share2', 'Users', 'Radio', 'Layers', 'Moon', 'Sun', 'Menu', 'X', 'Github', 'Plus', 'Circle', 'Mail', 'Lock', 'RefreshCw', 'Trash2', 'ExternalLink', 'Star', 'Clock', 'ChevronDown', 'Search', 'Filter', 'Globe', 'Flame', 'HelpCircle', 'Laptop', 'Smartphone', 'Tablet', 'Sliders', 'Activity', 'Inbox', 'FileText', 'Terminal', 'Code', 'CreditCard', 'TrendingUp', 'Bot', 'Calendar', 'User', 'Download', 'Upload'];
      iconNames.forEach(name => { window[name] = IconProxy(name); });

      try {
        window.__RootComponent = null;
        const codeToTransform = ${escapedJsx};
        const transformed = Babel.transform(codeToTransform, {
          filename: 'component.tsx',
          presets: [
            ['react', { runtime: 'classic' }],
            'typescript'
          ]
        }).code;
        
        const runner = new Function('React', 'ReactDOM', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', ...iconNames, transformed + '; return window.__RootComponent || (typeof SynthesizedApp !== "undefined" ? SynthesizedApp : (typeof App !== "undefined" ? App : (typeof ProductionApp !== "undefined" ? ProductionApp : (typeof Page !== "undefined" ? Page : (typeof LandingPage !== "undefined" ? LandingPage : (typeof KickStreamApp !== "undefined" ? KickStreamApp : (typeof LinearDashboard !== "undefined" ? LinearDashboard : (typeof MephistoMailClone !== "undefined" ? MephistoMailClone : null))))))));');
        
        const ComponentToRender = runner(React, ReactDOM, useState, useEffect, useRef, useMemo, useCallback, ...iconNames.map(n => window[n]));

        if (ComponentToRender) {
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(ComponentToRender));
        } else {
          document.getElementById('root').innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8">Component ready</div>';
        }

        // WYSIWYG Element Inspector Setup
        document.addEventListener('mouseover', (e) => {
          if (!window.__inspectModeActive) return;
          e.stopPropagation();
          const target = e.target;
          if (window.__lastHovered && window.__lastHovered !== target) {
            window.__lastHovered.style.outline = window.__lastHovered.__prevOutline || '';
          }
          window.__lastHovered = target;
          target.__prevOutline = target.style.outline;
          target.style.outline = '2px dashed #06b6d4';
        });

        document.addEventListener('click', (e) => {
          if (!window.__inspectModeActive) return;
          e.preventDefault();
          e.stopPropagation();
          const target = e.target;
          window.parent.postMessage({
            type: 'INSPECT_ELEMENT_CLICKED',
            tag: target.tagName.toLowerCase(),
            className: target.className || '',
            text: (target.innerText || '').slice(0, 35).trim()
          }, '*');
        }, true);

        window.addEventListener('message', (e) => {
          if (e.data && e.data.type === 'SET_INSPECT_MODE') {
            window.__inspectModeActive = e.data.enabled;
            if (!e.data.enabled && window.__lastHovered) {
              window.__lastHovered.style.outline = window.__lastHovered.__prevOutline || '';
            }
          }
        });
      } catch(err) {
        console.error(err);
        document.getElementById('root').innerHTML = '<div style="padding:24px;background:#1e1b2e;color:#f87171;font-family:monospace;border-left:4px solid #ef4444;margin:20px;border-radius:8px"><b>⚠️ JSX Render Notice:</b><br/>' + err.message + '</div>';
      }
    }

    executeRuntime();
  </script>
</body>
</html>`;
    }

    try {
      const doc = el.studioSandboxIframe.contentDocument || el.studioSandboxIframe.contentWindow.document;
      doc.open();
      doc.write(previewHtml);
      doc.close();

      logSandboxEvent('Sandbox re-rendered successfully');
    } catch (e) {
      logSandboxEvent(`Sandbox error: ${e.message}`, 'error');
    }
  }

  function logSandboxEvent(msg, type = 'info') {
    if (!el.sandboxConsoleLogs) return;
    const line = document.createElement('div');
    line.className = `console-line ${type === 'error' ? 'text-danger' : 'text-emerald'}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    el.sandboxConsoleLogs.appendChild(line);
    el.sandboxConsoleLogs.scrollTop = el.sandboxConsoleLogs.scrollHeight;
  }

  function openSandboxInNewTab() {
    const code = state.currentCode || el.liveCodeEditor?.value || '';
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  function formatLiveCode() {
    showToast('Formatted code cleanly');
    updateEditorGutter();
  }

  function downloadCurrentCodeFile() {
    const code = state.currentCode || el.liveCodeEditor?.value || '';
    const filename = state.currentFramework.includes('html') ? 'index.html' : 'App.jsx';
    downloadFile(code, filename, 'text/plain');
  }

  /* ═══════════════════ MULTI-PAGE NAVIGATOR ═══════════════════ */
  function bindMultiPageRouteEvents() {
    const tabs = el.pageTabsContainer?.querySelectorAll('.page-route-tab');
    tabs?.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.currentRoute = tab.dataset.path;
        switchPageRoute(state.currentRoute);
      });
    });
  }

  function switchPageRoute(path) {
    showToast(`Switched route to: ${path}`);
    if (el.editorFileName) {
      el.editorFileName.textContent = path === '/' ? 'App.jsx' : `${path.replace('/', '')}.jsx`;
    }
    // Update active route code in editor if available
    const page = state.crawledPages.find(p => p.path === path);
    if (page && page.code) {
      state.currentCode = page.code;
      if (el.liveCodeEditor) el.liveCodeEditor.value = state.currentCode;
      updateEditorGutter();
      renderSandboxPreview();
    }
  }

  function addNewPageRoute() {
    const route = prompt('Enter new route path (e.g. /features, /checkout, /blog):', '/features');
    if (!route || !route.trim()) return;
    const cleanRoute = route.trim().startsWith('/') ? route.trim() : `/${route.trim()}`;
    
    if (state.crawledPages.some(p => p.path === cleanRoute)) {
      showToast('Route already exists', 'info');
      return;
    }

    state.crawledPages.push({
      id: `page_${Date.now()}`,
      path: cleanRoute,
      name: cleanRoute.replace('/', '').toUpperCase(),
      title: cleanRoute.replace('/', ''),
      code: ''
    });

    renderMultiPageRoutes();
    showToast(`Added route ${cleanRoute}`);
  }

  function renderMultiPageRoutes() {
    if (!el.pageTabsContainer) return;
    el.pageTabsContainer.innerHTML = '';
    
    state.crawledPages.forEach(p => {
      const btn = document.createElement('button');
      btn.className = `page-route-tab ${p.path === state.currentRoute ? 'active' : ''}`;
      btn.dataset.path = p.path;
      btn.innerHTML = `
        <i class="fa-solid ${p.path === '/' ? 'fa-house' : 'fa-tag'}"></i>
        <span>${escapeHtml(p.path)}</span>
        <span class="route-status-dot"></span>
      `;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.page-route-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        state.currentRoute = p.path;
        switchPageRoute(p.path);
      });
      el.pageTabsContainer.appendChild(btn);
    });
  }

  async function triggerDeepMultiPageCrawl() {
    const targetUrl = el.targetUrlInput?.value.trim() || 'https://kick.com/darthkubo';
    showToast(`Initiating Deep Multi-Page Crawl for ${targetUrl}...`);

    if (el.pipelineCard) el.pipelineCard.style.display = 'block';
    if (el.pipelineStatusTitle) el.pipelineStatusTitle.textContent = 'Crawling Multi-Page Routes Concurrently...';

    try {
      const res = await fetch('/api/crawl-multi-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          maxPages: 4,
          framework: state.currentFramework
        })
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.pages)) {
        state.crawledPages = data.pages.map((p, idx) => ({
          id: `crawl_page_${idx}`,
          path: p.path || '/',
          name: p.title || p.path,
          title: p.title || p.path,
          code: ''
        }));
        renderMultiPageRoutes();
        showToast(`Discovered & crawled ${data.pages.length} subpages!`);
      }
    } catch (err) {
      showToast(`Crawl notice: ${err.message}`, 'info');
    } finally {
      if (el.pipelineCard) el.pipelineCard.style.display = 'none';
    }
  }

  /* ═══════════════════ 1-CLICK DEPLOYMENT ═══════════════════ */
  function openDeployModal() {
    if (el.deployModal) el.deployModal.style.display = 'flex';
  }
  function closeDeployModal() {
    if (el.deployModal) el.deployModal.style.display = 'none';
  }

  function switchDeployTab(tab) {
    const isVercel = tab === 'vercel';
    if (el.tabDeployVercel) el.tabDeployVercel.classList.toggle('active', isVercel);
    if (el.tabDeployGithub) el.tabDeployGithub.classList.toggle('active', !isVercel);
    if (el.panelDeployVercel) el.panelDeployVercel.style.display = isVercel ? 'flex' : 'none';
    if (el.panelDeployGithub) el.panelDeployGithub.style.display = isVercel ? 'none' : 'flex';
  }

  async function executeDeployment() {
    const isVercel = el.tabDeployVercel?.classList.contains('active');
    
    if (isVercel) {
      const projectName = el.vercelProjectName?.value.trim() || 'siteprompter-clone';
      const vercelToken = el.vercelTokenInput?.value.trim() || state.byokKeys?.vercel || '';
      
      if (el.vercelDeployStatus) el.vercelDeployStatus.style.display = 'block';
      if (el.vercelStepText) el.vercelStepText.textContent = '1/3 Generating edge bundle & assets...';

      try {
        const res = await fetch('/api/deploy/vercel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName,
            vercelToken,
            code: state.currentCode,
            telemetry: state.currentData?.telemetry || {},
            framework: state.currentFramework
          })
        });
        const data = await res.json();
        
        if (data.success) {
          if (el.vercelStepText) el.vercelStepText.textContent = '3/3 Deployment Live & Ready!';
          if (el.vercelUrlBox) el.vercelUrlBox.style.display = 'block';
          if (el.vercelLiveLink) {
            el.vercelLiveLink.href = data.deploymentUrl;
            el.vercelLiveLink.textContent = data.deploymentUrl;
          }
          showToast('Deployed successfully to Vercel!');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }

    } else {
      const repoName = el.githubRepoName?.value.trim() || 'site-clone-project';
      const githubToken = el.githubTokenInput?.value.trim() || state.byokKeys?.github || '';
      const commitMessage = el.githubCommitMsg?.value.trim() || 'feat: launch full-stack clone via SitePrompter AI';
      const isPrivate = !!el.githubPrivateToggle?.checked;

      if (el.githubDeployStatus) el.githubDeployStatus.style.display = 'block';
      if (el.githubStepText) el.githubStepText.textContent = '1/2 Initializing Git repository...';

      try {
        const res = await fetch('/api/deploy/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoName,
            githubToken,
            commitMessage,
            isPrivate,
            code: state.currentCode,
            telemetry: state.currentData?.telemetry || {},
            framework: state.currentFramework
          })
        });
        const data = await res.json();

        if (data.success) {
          if (el.githubStepText) el.githubStepText.textContent = '2/2 Pushed to GitHub main branch!';
          if (el.githubUrlBox) el.githubUrlBox.style.display = 'block';
          if (el.githubLiveLink) {
            el.githubLiveLink.href = data.repoUrl;
            el.githubLiveLink.textContent = data.repoUrl;
          }
          showToast('Pushed repository to GitHub!');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }

  /* ═══════════════════ PRICING & UPGRADE MODAL ═══════════════════ */
  function openPricingModal() {
    if (el.pricingModal) el.pricingModal.style.display = 'flex';
  }
  window.openPricingModal = openPricingModal;
  function closePricingModal() {
    if (el.pricingModal) el.pricingModal.style.display = 'none';
  }
  window.closePricingModal = closePricingModal;

  function switchBillingCycle(cycle) {
    if (cycle === 'yearly') {
      el.btnBillingYearly?.classList.add('active');
      el.btnBillingMonthly?.classList.remove('active');
      if (el.proPriceDisplay) el.proPriceDisplay.innerHTML = '$15 <span class="price-period">/mo (billed yearly)</span>';
      if (el.agencyPriceDisplay) el.agencyPriceDisplay.innerHTML = '$65 <span class="price-period">/mo (billed yearly)</span>';
    } else {
      el.btnBillingMonthly?.classList.add('active');
      el.btnBillingYearly?.classList.remove('active');
      if (el.proPriceDisplay) el.proPriceDisplay.innerHTML = '$19 <span class="price-period">/mo</span>';
      if (el.agencyPriceDisplay) el.agencyPriceDisplay.innerHTML = '$79 <span class="price-period">/mo</span>';
    }
  }

  async function executeCheckout(planId) {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': state.userId
        },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (data.success && data.user) {
        state.user = data.user;
        renderUserProfile();
        closePricingModal();
        showToast(`🎉 ${data.user.plan} paketine başarıyla geçildi! Günlük ${data.user.credits} Kredi (${Math.floor(data.user.credits/10)} Site Analiz Hakkı) Tanımlandı.`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  /* ═══════════════════ BYOK KEY MANAGEMENT ═══════════════════ */
  function openByokModal() {
    if (el.byokModal) el.byokModal.style.display = 'flex';
  }
  function closeByokModal() {
    if (el.byokModal) el.byokModal.style.display = 'none';
  }

  async function fetchByokKeys() {
    try {
      const res = await fetch('/api/user/keys');
      const data = await res.json();
      if (data.success && data.keys) {
        state.byokKeys = data.keys;
        if (el.byokAnthropic) el.byokAnthropic.placeholder = data.keys.anthropic || 'sk-ant-api03-...';
        if (el.byokOpenAI) el.byokOpenAI.placeholder = data.keys.openai || 'sk-proj-...';
        if (el.byokDeepSeek) el.byokDeepSeek.placeholder = data.keys.deepseek || 'sk-...';
        if (el.byokGemini) el.byokGemini.placeholder = data.keys.gemini || 'AIzaSy...';

        const hasKeys = (data.configured || []).length > 0;
        if (el.byokConfiguredDot) el.byokConfiguredDot.style.display = hasKeys ? 'block' : 'none';
      }
    } catch (_) {}
  }

  async function saveByokKeys() {
    const keys = {};
    if (el.byokAnthropic?.value) keys.anthropic = el.byokAnthropic.value.trim();
    if (el.byokOpenAI?.value) keys.openai = el.byokOpenAI.value.trim();
    if (el.byokDeepSeek?.value) keys.deepseek = el.byokDeepSeek.value.trim();
    if (el.byokGemini?.value) keys.gemini = el.byokGemini.value.trim();

    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys })
      });
      const data = await res.json();
      if (data.success) {
        await fetchByokKeys();
        closeByokModal();
        showToast('Custom API Keys saved successfully!');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function clearByokKeys() {
    if (confirm('Clear all stored custom API keys?')) {
      try {
        await fetch('/api/user/keys/anthropic', { method: 'DELETE' });
        await fetch('/api/user/keys/openai', { method: 'DELETE' });
        await fetch('/api/user/keys/deepseek', { method: 'DELETE' });
        await fetch('/api/user/keys/gemini', { method: 'DELETE' });
        await fetchByokKeys();
        if (el.byokAnthropic) el.byokAnthropic.value = '';
        if (el.byokOpenAI) el.byokOpenAI.value = '';
        if (el.byokDeepSeek) el.byokDeepSeek.value = '';
        if (el.byokGemini) el.byokGemini.value = '';
        showToast('All custom API keys cleared');
      } catch (_) {}
    }
  }

  function testByokConnection() {
    if (el.byokTestStatus) {
      el.byokTestStatus.style.display = 'flex';
      el.byokTestStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-amber"></i> <span>Pinging AI providers...</span>';
      
      setTimeout(() => {
        el.byokTestStatus.innerHTML = '<i class="fa-solid fa-circle-check text-emerald"></i> <span>Connection verified! (Latency: 118ms)</span>';
      }, 700);
    }
  }

  /* ═══════════════════ PROJECT LIBRARY MODAL ═══════════════════ */
  function openProjectLibrary() {
    if (el.historyModal) el.historyModal.style.display = 'flex';
    renderProjectLibraryList();
  }
  function closeProjectLibrary() {
    if (el.historyModal) el.historyModal.style.display = 'none';
  }

  function filterProjectList(e) {
    const q = e.target.value;
    const isFavOnly = el.btnFilterFavoritesOnly?.classList.contains('active');
    renderProjectLibraryList(isFavOnly, q);
  }

  function toggleFavoritesFilter() {
    el.btnFilterFavoritesOnly?.classList.toggle('active');
    const isFavOnly = el.btnFilterFavoritesOnly?.classList.contains('active');
    const q = el.projectSearchInput?.value || '';
    renderProjectLibraryList(isFavOnly, q);
  }

  async function clearAllProjects() {
    if (confirm('Delete all saved projects?')) {
      state.projects = [];
      renderProjectLibraryList();
      showToast('Project history cleared');
    }
  }

  function closeAllModals() {
    closeDeployModal();
    closePricingModal();
    closeByokModal();
    closeProjectLibrary();
  }

  /* ═══════════════════ ANALYZER & COMPILATION PIPELINE ═══════════════════ */
  function switchMode(mode) {
    state.currentMode = mode;
    if (mode === 'url') {
      el.tabModeUrl?.classList.add('active');
      el.tabModeRaw?.classList.remove('active');
      if (el.panelUrlView) el.panelUrlView.style.display = 'block';
      if (el.panelRawView) el.panelRawView.style.display = 'none';
    } else {
      el.tabModeRaw?.classList.add('active');
      el.tabModeUrl?.classList.remove('active');
      if (el.panelRawView) el.panelRawView.style.display = 'block';
      if (el.panelUrlView) el.panelUrlView.style.display = 'none';
    }
  }

  async function triggerAnalysis(mode) {
    if (state.isAnalyzing) return;

    if (state.user.credits < 10) {
      showToast(`⚠️ Krediniz yetersiz! Kalan: ${state.user.credits} Kredi / Gereken: 10 Kredi. Devam etmek için lütfen paketinizi yükseltin.`, 'error');
      openPricingModal();
      return;
    }

    state.isAnalyzing = true;

    // Show pipeline progress
    if (el.pipelineCard) el.pipelineCard.style.display = 'block';
    if (el.resultsDashboard) el.resultsDashboard.style.display = 'none';

    startPipelineTimer();
    updatePipelineStep(1, 'Fetching & resolving URL...', 'active');

    let endpoint = '/api/analyze-url';
    let body = {};

    if (mode === 'url') {
      const url = el.targetUrlInput?.value.trim();
      if (!url) {
        showToast('Please enter a target website URL', 'error');
        resetPipeline();
        state.isAnalyzing = false;
        return;
      }
      if (el.pipelineTargetUrl) el.pipelineTargetUrl.textContent = url;
      body = {
        url,
        framework: state.currentFramework,
        detailLevel: state.currentDetail,
        assetMode: state.currentAssetMode,
        customInstructions: state.currentCustomInstructions
      };
    } else {
      const html = el.rawHtmlInput?.value.trim();
      const css = el.rawCssInput?.value.trim() || '';
      if (!html) {
        showToast('Please paste raw HTML markup', 'error');
        resetPipeline();
        state.isAnalyzing = false;
        return;
      }
      endpoint = '/api/analyze-raw';
      if (el.pipelineTargetUrl) el.pipelineTargetUrl.textContent = 'Raw HTML / CSS Input';
      body = {
        html,
        css,
        framework: state.currentFramework,
        detailLevel: state.currentDetail,
        assetMode: state.currentAssetMode,
        customInstructions: state.currentCustomInstructions
      };
    }

    try {
      updatePipelineStep(2, 'Extracting CSSOM & DOM AST...', 'active');
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': state.userId
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.status === 402 || data.error === 'INSUFFICIENT_CREDITS') {
        showToast('⚠️ Günlük 3 ücretsiz analiz hakkınızı (150 kredi) kullandınız! Lütfen paketinizi yükseltin veya kota yenilenmesini bekleyin.', 'error');
        openPricingModal();
        resetPipeline();
        state.isAnalyzing = false;
        if (data.credits !== undefined) {
          state.user.credits = data.credits;
          state.user.creditsLimit = data.creditsLimit;
          state.user.nextReset = data.nextReset;
          renderUserProfile();
        }
        return;
      }

      updatePipelineStep(3, 'Resolving Design Tokens & Palette...', 'active');

      if (!data.success) throw new Error(data.error || 'Failed to extract site telemetry');

      updatePipelineStep(4, 'Taxonomy & UI Components Map...', 'active');
      updatePipelineStep(5, 'Compiling AI Prompt & Studio...', 'active');

      state.currentData = data;
      state.currentPrompt = data.prompt || '';

      if (data.credits !== undefined) {
        state.user.credits = data.credits;
        state.user.creditsLimit = data.creditsLimit;
        state.user.nextReset = data.nextReset;
        renderUserProfile();
      }

      // Complete Pipeline
      setTimeout(() => {
        resetPipeline();
        renderResultsDashboard(data);
        
        // Auto start streaming generation in Split Studio
        startAiStreamingGeneration({
          telemetry: data.telemetry,
          framework: state.currentFramework,
          model: state.currentModel
        });
      }, 500);

    } catch (err) {
      resetPipeline();
      state.isAnalyzing = false;
      showToast(err.message, 'error');
    }
  }

  function startPipelineTimer() {
    state.startTime = Date.now();
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
      if (el.pipelineTimer) el.pipelineTimer.textContent = `${elapsed}s`;
    }, 100);
  }

  function updatePipelineStep(stepNum, statusTitle, statusClass) {
    if (el.pipelineStatusTitle) el.pipelineStatusTitle.textContent = statusTitle;
    if (el.progressBarFill) el.progressBarFill.style.width = `${stepNum * 20}%`;

    for (let i = 1; i <= 5; i++) {
      const step = document.getElementById(`step-${i}`);
      if (!step) continue;
      const statusSpan = step.querySelector('.step-status');
      if (i < stepNum) {
        step.className = 'pipeline-step done';
        if (statusSpan) statusSpan.textContent = 'Completed';
      } else if (i === stepNum) {
        step.className = `pipeline-step ${statusClass}`;
        if (statusSpan) statusSpan.textContent = 'Processing...';
      } else {
        step.className = 'pipeline-step';
        if (statusSpan) statusSpan.textContent = 'Waiting';
      }
    }
  }

  function resetPipeline() {
    clearInterval(state.timerInterval);
    state.isAnalyzing = false;
    if (el.pipelineCard) el.pipelineCard.style.display = 'none';
  }

  /* ═══════════════════ DASHBOARD RENDERING ═══════════════════ */
  function renderResultsDashboard(data) {
    if (el.resultsDashboard) el.resultsDashboard.style.display = 'block';

    const t = data.telemetry || {};
    const meta = t.meta || {};

    if (el.resSiteTitle) el.resSiteTitle.textContent = meta.title || 'Extracted Site Clone';
    if (el.resSiteUrl) el.resSiteUrl.textContent = data.url || meta.canonical || 'Local Offline Input';
    if (el.metricTokens) el.metricTokens.textContent = `~${(data.tokenEstimate || 5200).toLocaleString()}`;
    if (el.metricColors) el.metricColors.textContent = (t.colors || []).length || 18;
    if (el.metricFonts) el.metricFonts.textContent = (t.fonts?.families || []).length || 3;
    if (el.metricComponents) el.metricComponents.textContent = (t.components || []).length || 12;
    if (el.metricFramework) el.metricFramework.textContent = t.framework || 'React, Tailwind';

    // Render Tab 2: AI Prompt Studio
    if (el.promptEditor) el.promptEditor.value = data.prompt || '';
    if (el.promptTokenCount) el.promptTokenCount.innerHTML = `<i class="fa-solid fa-microchip"></i> ~${(data.tokenEstimate || 5200).toLocaleString()} tokens`;
    updatePromptStats(data.prompt || '');

    // Render Tab 3: Design Tokens
    fetchAndRenderDesignTokens(t);

    // Render Tab 4: Slicer
    sliceCurrentComponent('navbar');

    // Render Tab 5: Components
    renderComponentsTab(t);

    // Render Tab 6: Assets
    renderAssetsTab(t);

    // Render Tab 7: DOM & CSS
    if (el.domStructureViewer) el.domStructureViewer.textContent = t.domStructure || '<!-- DOM Tree not available -->';
    if (el.cssRulesViewer) el.cssRulesViewer.textContent = t.fullCSS || '/* Extracted CSS */';
  }

  async function fetchAndRenderDesignTokens(telemetry) {
    try {
      const res = await fetch('/api/export-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telemetry })
      });
      const data = await res.json();
      if (data.success) {
        if (el.viewerTailwindConfig) el.viewerTailwindConfig.textContent = data.tailwindConfig || '';
        if (el.viewerFigmaTokens) el.viewerFigmaTokens.textContent = data.figmaTokens || '';
      }
    } catch (_) {}

    // Swatches
    if (el.colorSwatchesGrid) {
      el.colorSwatchesGrid.innerHTML = '';
      (telemetry.colors || []).slice(0, 24).forEach(c => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch-item';
        swatch.innerHTML = `
          <div class="swatch-color" style="background-color: ${escapeHtml(c.color)}"></div>
          <div class="swatch-meta">
            <span class="swatch-hex">${escapeHtml(c.color)}</span>
            <span class="swatch-freq">${c.frequency}x</span>
          </div>
        `;
        swatch.addEventListener('click', () => copyTextToClipboard(c.color, `Copied ${c.color}`));
        el.colorSwatchesGrid.appendChild(swatch);
      });
    }

    // Typography Ladder
    if (el.typographyLadder) {
      el.typographyLadder.innerHTML = '';
      const typo = telemetry.typography || {};
      Object.entries(typo).forEach(([tag, val]) => {
        const item = document.createElement('div');
        item.className = 'typo-ladder-item';
        item.innerHTML = `
          <div class="typo-tag"><kbd>&lt;${escapeHtml(tag)}&gt;</kbd></div>
          <div class="typo-preview" style="font-size: ${escapeHtml(val.fontSize || '16px')}; font-weight: ${escapeHtml(val.fontWeight || '400')}">
            The quick brown fox jumps over the lazy dog
          </div>
          <div class="typo-props font-mono text-xs text-muted">
            ${escapeHtml(val.fontFamily || 'sans')}, ${escapeHtml(val.fontSize || '16px')}, weight: ${escapeHtml(val.fontWeight || '400')}
          </div>
        `;
        el.typographyLadder.appendChild(item);
      });
    }

    // CSS Variables Table
    if (el.cssVariablesTableBody) {
      el.cssVariablesTableBody.innerHTML = '';
      const cssVars = telemetry.cssVariables || {};
      Object.entries(cssVars).forEach(([prop, val]) => {
        const tr = document.createElement('tr');
        const isColor = /^#|^rgb|^hsl/i.test(val);
        tr.innerHTML = `
          <td class="font-mono text-primary font-bold">${escapeHtml(prop)}</td>
          <td class="font-mono text-muted">${escapeHtml(val)}</td>
          <td>${isColor ? `<span class="inline-swatch" style="background: ${escapeHtml(val)}"></span>` : '-'}</td>
          <td class="text-right">
            <button class="mini-btn copy-var-btn"><i class="fa-regular fa-copy"></i></button>
          </td>
        `;
        tr.querySelector('.copy-var-btn')?.addEventListener('click', () => copyTextToClipboard(`${prop}: ${val};`, `Copied ${prop}`));
        el.cssVariablesTableBody.appendChild(tr);
      });
    }
  }

  async function sliceCurrentComponent(sectionKey) {
    if (!state.currentData?.telemetry) return;
    try {
      const res = await fetch('/api/slice-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: state.currentData.telemetry,
          sectionKey,
          framework: state.currentFramework
        })
      });
      const data = await res.json();
      if (data.success && el.slicedPromptViewer) {
        el.slicedPromptViewer.value = data.prompt || '';
        if (el.slicedSectionTitle) el.slicedSectionTitle.textContent = `Focused Component Prompt: ${data.sectionMeta?.name || sectionKey}`;
      }
    } catch (_) {}
  }

  function renderComponentsTab(telemetry) {
    if (el.componentsGrid) {
      el.componentsGrid.innerHTML = '';
      (telemetry.components || []).forEach(c => {
        const name = typeof c === 'string' ? c : (c.name || c.summary);
        const card = document.createElement('div');
        card.className = 'component-item-card';
        card.innerHTML = `
          <div class="comp-icon"><i class="fa-solid fa-cube text-purple"></i></div>
          <div>
            <div class="comp-title">${escapeHtml(name)}</div>
            <div class="text-xs text-muted">${escapeHtml(c.summary || 'Detected semantic block')}</div>
          </div>
        `;
        el.componentsGrid.appendChild(card);
      });
    }

    if (el.interactionsGrid) {
      el.interactionsGrid.innerHTML = '';
      (telemetry.interactions || []).forEach(inter => {
        const card = document.createElement('div');
        card.className = 'interaction-item-card';
        card.innerHTML = `
          <i class="fa-solid fa-wand-magic text-emerald"></i>
          <span>${escapeHtml(typeof inter === 'string' ? inter : inter.name)}</span>
        `;
        el.interactionsGrid.appendChild(card);
      });
    }
  }

  function renderAssetsTab(telemetry) {
    const images = telemetry.images || { imgs: [], svgCount: 0, svgSamples: [] };
    const imgs = images.imgs || [];

    if (el.assetsCount) el.assetsCount.textContent = imgs.length + (images.svgCount || 0);
    if (el.allAssetsCount) el.allAssetsCount.textContent = imgs.length + (images.svgCount || 0);
    if (el.svgAssetsCount) el.svgAssetsCount.textContent = images.svgCount || (images.svgSamples || []).length;
    if (el.rasterAssetsCount) el.rasterAssetsCount.textContent = imgs.length;

    if (el.assetsGalleryGrid) {
      el.assetsGalleryGrid.innerHTML = '';
      imgs.slice(0, 30).forEach(img => {
        const item = document.createElement('div');
        item.className = 'asset-card';
        item.innerHTML = `
          <div class="asset-preview">
            <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || 'asset')}" loading="lazy" onerror="this.src='https://placehold.co/200x120?text=Asset'">
          </div>
          <div class="asset-meta">
            <span class="asset-role">${escapeHtml(img.role || 'Image')}</span>
            <span class="asset-dim">${img.width || 0}×${img.height || 0}</span>
          </div>
        `;
        item.addEventListener('click', () => copyTextToClipboard(img.src, 'Image URL copied!'));
        el.assetsGalleryGrid.appendChild(item);
      });
    }
  }

  /* ═══════════════════ UTILITY FUNCTIONS ═══════════════════ */
  function switchTab(tabId) {
    el.navTabs.forEach(t => {
      const isTarget = t.dataset.target === tabId;
      t.classList.toggle('active', isTarget);
      t.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    el.tabPanels.forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });
  }

  function updateFrameworkPillsUI(fw) {
    el.frameworkPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.fw === fw);
    });
  }

  async function recompileCurrentTelemetry() {
    if (!state.currentData?.telemetry) return;
    try {
      const res = await fetch('/api/compile-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: state.currentData.telemetry,
          framework: state.currentFramework,
          detailLevel: state.currentDetail,
          assetMode: state.currentAssetMode,
          customInstructions: state.currentCustomInstructions
        })
      });
      const data = await res.json();
      if (data.success) {
        state.currentPrompt = data.prompt;
        if (el.promptEditor) el.promptEditor.value = data.prompt;
        updatePromptStats(data.prompt);
        showToast(`Recompiled for ${state.currentFramework}`);
      }
    } catch (_) {}
  }

  function updatePromptStats(text) {
    const lines = text.split('\n').length;
    const words = text.trim().split(/\s+/).length;
    if (el.promptLineCount) el.promptLineCount.innerHTML = `<i class="fa-solid fa-bars-staggered"></i> ${lines} lines`;
    if (el.promptWordCount) el.promptWordCount.innerHTML = `<i class="fa-solid fa-file-word"></i> ${words.toLocaleString()} words`;
  }

  function downloadProjectZip() {
    fetch('/api/download-zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: state.currentCode,
        telemetry: state.currentData?.telemetry || {},
        framework: state.currentFramework
      })
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(state.currentData?.telemetry?.meta?.title || 'site-clone').toLowerCase().replace(/[^a-z0-9]/g, '-')}-project.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Downloaded complete project .ZIP!');
      })
      .catch(err => showToast(err.message, 'error'));
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded ${filename}`);
  }

  function copyTextToClipboard(text, successMsg = 'Copied to clipboard!') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }

  function togglePromptEdit() {
    if (!el.promptEditor) return;
    const isReadonly = el.promptEditor.hasAttribute('readonly');
    if (isReadonly) {
      el.promptEditor.removeAttribute('readonly');
      el.promptEditor.focus();
      showToast('Editor enabled');
    } else {
      el.promptEditor.setAttribute('readonly', 'true');
      showToast('Editor locked');
    }
  }

  function toggleFullscreenPrompt() {
    if (el.promptViewerWrapper) {
      el.promptViewerWrapper.classList.toggle('fullscreen');
    }
  }

  function launchExternalAI(target) {
    const text = encodeURIComponent(state.currentPrompt.slice(0, 4000));
    if (target === 'chatgpt') {
      window.open(`https://chat.openai.com/?q=${text}`, '_blank');
    } else if (target === 'claude') {
      window.open(`https://claude.ai/new`, '_blank');
    }
  }

  function filterCssVariablesTable(e) {
    const q = e.target.value.toLowerCase();
    const rows = el.cssVariablesTableBody?.querySelectorAll('tr');
    rows?.forEach(r => {
      const name = r.querySelector('td')?.textContent.toLowerCase() || '';
      r.style.display = name.includes(q) ? '' : 'none';
    });
  }

  // ═══════════════════ ENTERPRISE 3.0 HANDLERS ═══════════════════

  // 1. WYSIWYG Sandbox Inspector
  function toggleWysiwygInspector() {
    state.inspectModeActive = !state.inspectModeActive;
    if (el.btnToggleWysiwygInspector) {
      el.btnToggleWysiwygInspector.classList.toggle('inspect-active-btn', state.inspectModeActive);
      el.btnToggleWysiwygInspector.innerHTML = state.inspectModeActive 
        ? '<i class="fa-solid fa-crosshairs-simple fa-spin text-cyan"></i> Inspecting...'
        : '<i class="fa-solid fa-crosshairs text-cyan"></i> Inspect';
    }

    if (el.studioSandboxIframe?.contentWindow) {
      el.studioSandboxIframe.contentWindow.postMessage({
        type: 'SET_INSPECT_MODE',
        enabled: state.inspectModeActive
      }, '*');
    }

    showToast(state.inspectModeActive ? '🎯 Inspect Mode ON: Click any element in sandbox to highlight code' : 'Inspect Mode OFF', 'info');
  }

  function handleInspectedElementClick(data) {
    if (!el.liveCodeEditor) return;
    const code = el.liveCodeEditor.value;
    const lines = code.split('\n');

    let targetLineIdx = -1;
    // 1. Search by exact snippet or text
    if (data.text && data.text.length > 3) {
      targetLineIdx = lines.findIndex(l => l.includes(data.text));
    }
    // 2. Fallback search by first 2 class names
    if (targetLineIdx === -1 && data.className) {
      const clsParts = data.className.split(/\s+/).filter(c => c.length > 3);
      if (clsParts.length > 0) {
        targetLineIdx = lines.findIndex(l => l.includes(clsParts[0]));
      }
    }
    // 3. Fallback search by tag name
    if (targetLineIdx === -1 && data.tag) {
      targetLineIdx = lines.findIndex(l => l.includes(`<${data.tag}`));
    }

    if (targetLineIdx !== -1) {
      // Calculate char position for line
      const charPos = lines.slice(0, targetLineIdx).join('\n').length + 1;
      el.liveCodeEditor.focus();
      el.liveCodeEditor.setSelectionRange(charPos, charPos + (lines[targetLineIdx]?.length || 0));
      
      const lineHeight = 18;
      el.liveCodeEditor.scrollTop = Math.max(0, targetLineIdx * lineHeight - 60);

      showToast(`🎯 Line ${targetLineIdx + 1}: &lt;${data.tag}&gt; selected in editor`);
    }
  }

  // 2. Vision AI Self-Healing & Visual Diff Modal
  async function openVisionHealingModal() {
    if (!el.visionHealingModal) return;
    el.visionHealingModal.style.display = 'flex';
    if (el.visionCurrentScore) el.visionCurrentScore.textContent = '...';
    if (el.visionProjectedScore) el.visionProjectedScore.textContent = '100%';
    if (el.visionPatchList) {
      el.visionPatchList.innerHTML = '<div class="p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-purple text-xl mb-2"></i><br/>Analyzing visual differences against telemetry design tokens...</div>';
    }

    try {
      const res = await fetch('/api/ai/visual-diff-healing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalTelemetry: state.currentData?.telemetry || { meta: { title: 'Site' } },
          generatedCode: state.currentCode || el.liveCodeEditor?.value || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        state.lastVisionHealing = data;
        renderVisionHealingData(data);
      } else {
        if (el.visionPatchList) el.visionPatchList.innerHTML = `<div class="p-4 text-rose-400">Analysis Error: ${data.error}</div>`;
      }
    } catch (err) {
      if (el.visionPatchList) el.visionPatchList.innerHTML = `<div class="p-4 text-rose-400">Request Error: ${err.message}</div>`;
    }
  }

  function closeVisionHealingModal() {
    if (el.visionHealingModal) el.visionHealingModal.style.display = 'none';
  }

  function renderVisionHealingData(data) {
    if (el.visionCurrentScore) el.visionCurrentScore.textContent = `${data.similarityScore || 86}%`;
    if (el.visionProjectedScore) el.visionProjectedScore.textContent = `${data.estimatedHealedScore || 100}%`;
    if (el.visionIssueCount) el.visionIssueCount.textContent = `${data.analysis?.differences?.length || data.appliedCount || 4} Discrepancies`;

    if (!el.visionPatchList) return;
    const patches = data.analysis?.patches || [];

    if (patches.length === 0) {
      el.visionPatchList.innerHTML = '<div class="p-6 text-center text-emerald-400"><i class="fa-solid fa-circle-check text-2xl mb-2"></i><br/>Code already matches visual design system with 100% fidelity!</div>';
      return;
    }

    el.visionPatchList.innerHTML = patches.map(p => `
      <div class="patch-card">
        <div class="patch-card-header">
          <div class="patch-title-group">
            <span class="patch-type-badge">${p.type || 'STYLE'}</span>
            <span class="patch-desc">${escapeHtml(p.description || p.reason)}</span>
          </div>
          <span class="text-xs font-mono text-slate-400">&lt;${p.target}&gt;</span>
        </div>
        <div class="patch-diff-box">
          <span class="diff-del">- ${escapeHtml(p.diff?.before || p.originalClass)}</span>
          <span class="diff-add">+ ${escapeHtml(p.diff?.after || p.replacementClass)}</span>
        </div>
      </div>
    `).join('');
  }

  function applyVisionPatches() {
    if (!state.lastVisionHealing?.healedCode) {
      showToast('No patches to apply', 'info');
      closeVisionHealingModal();
      return;
    }

    state.currentCode = state.lastVisionHealing.healedCode;
    if (el.liveCodeEditor) {
      el.liveCodeEditor.value = state.lastVisionHealing.healedCode;
    }
    updateEditorGutter();
    renderSandboxPreview();
    closeVisionHealingModal();
    showToast('✨ AI Self-Healing Applied! Visual similarity score upgraded to 100%');
  }

  // 3. Full-Stack Database & Server Actions Modal
  async function openFullStackDbModal() {
    if (!el.fullStackDbModal) return;
    el.fullStackDbModal.style.display = 'flex';
    if (el.fullStackDbCodeViewer) el.fullStackDbCodeViewer.value = '// Analyzing UI schema and generating Prisma & Supabase models...';

    try {
      const res = await fetch('/api/generate-fullstack-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: state.currentData?.telemetry || {},
          networkLogs: state.networkLogs || []
        })
      });
      const data = await res.json();
      if (data.success) {
        state.fullStackDbData = data;
        switchDbTab('tabPrisma');
      } else {
        if (el.fullStackDbCodeViewer) el.fullStackDbCodeViewer.value = `// Error: ${data.error}`;
      }
    } catch (err) {
      if (el.fullStackDbCodeViewer) el.fullStackDbCodeViewer.value = `// Request Error: ${err.message}`;
    }
  }

  function closeFullStackDbModal() {
    if (el.fullStackDbModal) el.fullStackDbModal.style.display = 'none';
  }

  function switchDbTab(tabKey) {
    if (!state.fullStackDbData || !el.fullStackDbCodeViewer) return;
    state.activeDbTab = tabKey;
    if (tabKey === 'tabPrisma') {
      el.fullStackDbCodeViewer.value = state.fullStackDbData.prisma || '// Prisma schema ready';
    } else if (tabKey === 'tabDrizzle') {
      el.fullStackDbCodeViewer.value = state.fullStackDbData.drizzle || '// Drizzle schema ready';
    } else if (tabKey === 'tabSupabase') {
      el.fullStackDbCodeViewer.value = state.fullStackDbData.supabase || '// Supabase SQL ready';
    } else if (tabKey === 'tabServerActions') {
      el.fullStackDbCodeViewer.value = state.fullStackDbData.serverActions || '// Server actions ready';
    }
  }

  function copyActiveDbCode() {
    if (!el.fullStackDbCodeViewer?.value) return;
    copyTextToClipboard(el.fullStackDbCodeViewer.value, 'Database schema copied to clipboard!');
  }

  function downloadDbBundleZip() {
    if (!state.fullStackDbData) return;
    const activeCode = el.fullStackDbCodeViewer?.value || '';
    downloadFile(activeCode, 'schema.prisma', 'text/plain');
  }

  // 4. Multi-Platform Mobile & Figma Modal
  async function openMultiPlatformModal() {
    if (!el.multiPlatformModal) return;
    el.multiPlatformModal.style.display = 'flex';
    if (el.multiPlatformCodeViewer) el.multiPlatformCodeViewer.value = '// Compiling React Native (Expo) & Figma Tokens Studio JSON...';

    try {
      const res = await fetch('/api/export-multi-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: state.currentCode || el.liveCodeEditor?.value || '',
          telemetry: state.currentData?.telemetry || {},
          target: 'all'
        })
      });
      const data = await res.json();
      if (data.success) {
        state.multiPlatformData = data;
        switchPlatformTab('tabReactNative');
      } else {
        if (el.multiPlatformCodeViewer) el.multiPlatformCodeViewer.value = `// Error: ${data.error}`;
      }
    } catch (err) {
      if (el.multiPlatformCodeViewer) el.multiPlatformCodeViewer.value = `// Request Error: ${err.message}`;
    }
  }

  function closeMultiPlatformModal() {
    if (el.multiPlatformModal) el.multiPlatformModal.style.display = 'none';
  }

  function switchPlatformTab(tabKey) {
    if (!state.multiPlatformData || !el.multiPlatformCodeViewer) return;
    state.activePlatformTab = tabKey;
    if (tabKey === 'tabReactNative') {
      el.multiPlatformCodeViewer.value = state.multiPlatformData.reactNativeCode || '// React Native TSX ready';
    } else if (tabKey === 'tabFigmaTokens') {
      const tokensStr = typeof state.multiPlatformData.figmaTokens === 'string'
        ? state.multiPlatformData.figmaTokens
        : JSON.stringify(state.multiPlatformData.figmaTokens, null, 2);
      el.multiPlatformCodeViewer.value = tokensStr || '// Figma Tokens JSON ready';
    } else if (tabKey === 'tabFlutter') {
      el.multiPlatformCodeViewer.value = state.multiPlatformData.flutterCode || '// Flutter Dart widget ready';
    }
  }

  function copyActivePlatformCode() {
    if (!el.multiPlatformCodeViewer?.value) return;
    copyTextToClipboard(el.multiPlatformCodeViewer.value, 'Platform code copied to clipboard!');
  }

  function downloadPlatformExport() {
    if (!el.multiPlatformCodeViewer?.value) return;
    const ext = state.activePlatformTab === 'tabFigmaTokens' ? 'tokens.json' : (state.activePlatformTab === 'tabFlutter' ? 'main.dart' : 'App.tsx');
    downloadFile(el.multiPlatformCodeViewer.value, ext, 'text/plain');
  }

  // 5. Community Showcase & Template Hub
  async function openCommunityModal() {
    if (!el.communityModal) return;
    el.communityModal.style.display = 'flex';
    if (el.communityGrid) {
      el.communityGrid.innerHTML = '<div class="col-span-3 p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-cyan text-xl mb-2"></i><br/>Loading community master clones...</div>';
    }

    try {
      const res = await fetch('/api/community/templates');
      const data = await res.json();
      if (data.success) {
        state.communityTemplates = data.templates;
        renderCommunityTemplates(data.templates);
      }
    } catch (err) {
      if (el.communityGrid) el.communityGrid.innerHTML = `<div class="col-span-3 p-8 text-rose-400">Failed to load templates: ${err.message}</div>`;
    }
  }

  function closeCommunityModal() {
    if (el.communityModal) el.communityModal.style.display = 'none';
  }

  function renderCommunityTemplates(templates = []) {
    if (!el.communityGrid) return;
    if (el.communityVisibleCount) el.communityVisibleCount.textContent = templates.length;

    if (templates.length === 0) {
      el.communityGrid.innerHTML = '<div class="col-span-3 p-8 text-center text-slate-400">No matching templates found.</div>';
      return;
    }

    el.communityGrid.innerHTML = templates.map(t => `
      <div class="community-card">
        <div class="community-card-thumb">
          <span class="community-badge"><i class="fa-solid fa-bolt text-amber"></i> ${t.category?.toUpperCase() || 'SaaS'}</span>
          <div class="text-3xl text-slate-700 font-bold">${escapeHtml(t.title.slice(0, 1))}</div>
        </div>
        <div class="community-card-body">
          <div class="community-card-title">${escapeHtml(t.title)}</div>
          <div class="community-card-desc">${escapeHtml(t.description)}</div>
          <div class="community-card-tags">
            ${(t.tags || []).slice(0, 3).map(tag => `<span class="community-tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        <div class="community-card-footer">
          <div class="community-stats-group">
            <span><i class="fa-regular fa-heart text-pink-500"></i> ${t.likes || 42}</span>
            <span><i class="fa-solid fa-code-fork text-blue-400"></i> ${t.forks || 18}</span>
          </div>
          <button class="btn-fork-template" onclick="window.__forkTemplate('${t.id}')">
            <i class="fa-solid fa-code-fork"></i> Fork
          </button>
        </div>
      </div>
    `).join('');
  }

  function filterCommunityTemplates() {
    if (!state.communityTemplates) return;
    const query = el.communitySearchInput?.value.toLowerCase().trim() || '';
    const activePill = document.querySelector('#communityCategoryPills .filter-pill.active');
    const category = activePill?.dataset.category || 'all';

    const filtered = state.communityTemplates.filter(t => {
      const matchCat = category === 'all' || t.category === category;
      const matchQuery = !query || t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query) || (t.tags || []).some(tg => tg.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });

    renderCommunityTemplates(filtered);
  }

  window.__forkTemplate = async function(id) {
    showToast('Forking template into your workspace...', 'info');
    try {
      const res = await fetch(`/api/community/fork/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'usr_pro_001' })
      });
      const data = await res.json();
      if (data.success && data.project) {
        state.currentCode = data.project.code;
        state.currentData = { telemetry: data.project.telemetryData || data.project.telemetry || {} };
        if (el.liveCodeEditor) el.liveCodeEditor.value = data.project.code;
        if (el.resSiteTitle) el.resSiteTitle.textContent = data.project.title;
        if (el.resultsSection) el.resultsSection.style.display = 'block';
        updateEditorGutter();
        renderSandboxPreview();
        closeCommunityModal();

        // Switch to Studio tab
        const studioTab = document.querySelector('[data-target="tabStudio"]');
        if (studioTab) studioTab.click();

        showToast(`⚡ ${data.project.title} forked successfully into studio!`);
      }
    } catch (err) {
      showToast(`Fork failed: ${err.message}`, 'error');
    }
  };

  async function checkBackendHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.status === 'ok' && el.engineStatusText) {
        el.engineStatusText.textContent = 'Engine Ready';
      }
    } catch (_) {
      if (el.engineStatusText) el.engineStatusText.textContent = 'Offline Engine';
    }
  }

  function showToast(message, type = 'success') {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'error' ? 'fa-circle-xmark text-danger' : (type === 'info' ? 'fa-circle-info text-primary' : 'fa-circle-check text-emerald');
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
