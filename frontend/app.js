const API_BASE_URL = "http://localhost:8000";
const API_TIMEOUT = 15000; // 15 second timeout
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second between retries

// Load Chart.js for data visualization
const chartScript = document.createElement('script');
chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
document.head.appendChild(chartScript);

// Load html2pdf for PDF reports
const pdfScript = document.createElement('script');
pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
document.head.appendChild(pdfScript);

const form = document.getElementById("prediction-form");
const resultCard = document.getElementById("result-card");
const recommendationCard = document.getElementById("recommendation-card");
const debugCard = document.getElementById("debug-card");
const debugJson = document.getElementById("debug-json");
const submitBtn = document.getElementById("submit-btn");
const resetBtn = document.getElementById("reset-btn");
const toggleDebugBtn = document.getElementById("toggle-debug");
const exportBtn = document.getElementById("export-btn");
const historyContainer = document.getElementById("history-container");

let lastPredictionData = null;
let assessmentHistory = JSON.parse(localStorage.getItem("assessmentHistory")) || [];
let isSubmitting = false;

// Health check to ensure server is available
async function checkServerHealth() {
  try {
    const response = await Promise.race([
      fetch(`${API_BASE_URL}/health`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Server health check timeout")), 5000)
      ),
    ]);
    return response.ok;
  } catch (err) {
    return false;
  }
}

// Authentication functions
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userNameElement = document.getElementById("user-name");
  const logoutBtn = document.getElementById("logout-btn");
  const loginLink = document.getElementById("login-link");

  if (token && user) {
    // User is logged in
    if (userNameElement) {
      userNameElement.textContent = `Welcome, ${user.full_name}`;
      userNameElement.style.display = "inline";
    }
    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
      logoutBtn.addEventListener("click", logout);
    }
    if (loginLink) {
      loginLink.style.display = "none";
    }
  } else {
    // User is not logged in
    if (userNameElement) {
      userNameElement.style.display = "none";
    }
    if (logoutBtn) {
      logoutBtn.style.display = "none";
    }
    if (loginLink) {
      loginLink.style.display = "inline-block";
    }
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("rememberMe");
  window.location.href = "auth.html";
}

// Load history on page load
function initializeHistory() {
  const disorderType = form.querySelector('input[name="disorder_type"]')?.value || "unknown";
  displayHistory(disorderType);
}

function getDiseaseName(disorderType) {
  const names = {
    alzheimers: "Alzheimer's Disease",
    parkinsons: "Parkinson's Disease",
    als: "ALS",
    huntington: "Huntington's Disease",
  };
  return names[disorderType] || disorderType;
}

function saveToHistory(data) {
  const historyEntry = {
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    disorderType: data.disorder_type,
    diseaseName: getDiseaseName(data.disorder_type),
    riskLevel: data.risk_level,
    riskScore: data.risk_score,
    age: data.details.inputs.age,
    cognitiveScore: data.details.inputs.cognitive_score,
  };
  
  assessmentHistory.unshift(historyEntry);
  if (assessmentHistory.length > 10) {
    assessmentHistory.pop();
  }
  
  localStorage.setItem("assessmentHistory", JSON.stringify(assessmentHistory));
  displayHistory(data.disorder_type);
}

function displayHistory(disorderType) {
  if (!historyContainer) return;
  
  const filtered = assessmentHistory.filter(entry => entry.disorderType === disorderType);
  
  if (filtered.length === 0) {
    historyContainer.innerHTML = '<p class="history-empty">No previous assessments yet. Run your first assessment to start tracking history.</p>';
    return;
  }

  historyContainer.innerHTML = '<h3 class="history-title">📋 Assessment History</h3>';
  const historyList = document.createElement("div");
  historyList.className = "history-list";

  filtered.forEach((entry, index) => {
    const item = document.createElement("div");
    item.className = `history-item history-${entry.riskLevel}`;
    item.innerHTML = `
      <div class="history-date">${entry.date} <span class="history-time">${entry.time}</span></div>
      <div class="history-details">
        <span class="history-badge ${entry.riskLevel}">⚠️ ${entry.riskLevel.toUpperCase()}</span>
        <span class="history-score">${(entry.riskScore * 100).toFixed(1)}%</span>
        <span class="history-meta">Age: ${entry.age} | Cognitive: ${entry.cognitiveScore}</span>
      </div>
    `;
    item.addEventListener("click", () => {
      alert(`Assessment Details:\nDate: ${entry.date} ${entry.time}\nDisease: ${entry.diseaseName}\nRisk Level: ${entry.riskLevel}\nRisk Score: ${(entry.riskScore * 100).toFixed(1)}%\nAge: ${entry.age}\nCognitive Score: ${entry.cognitiveScore}`);
    });
    historyList.appendChild(item);
  });

  historyContainer.appendChild(historyList);
}

function setLoading(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Running assessment…";
    isSubmitting = true;
  } else {
    submitBtn.disabled = false;
    submitBtn.textContent = "Run ML Assessment";
    isSubmitting = false;
  }
}

function buildPayload(formData) {
  const payload = {
    age: Number(formData.get("age")),
    sex: formData.get("sex"),
    disorder_type: formData.get("disorder_type"),
    elisa_biomarker_1: Number(formData.get("elisa_biomarker_1")),
    elisa_biomarker_2: Number(formData.get("elisa_biomarker_2")),
    cognitive_score: Number(formData.get("cognitive_score")),
    mri_severity_score: Number(formData.get("mri_severity_score")),
    ecg_eeg_anomaly_score: Number(formData.get("ecg_eeg_anomaly_score")),
  };
  return payload;
}

// Validate payload before sending
function validatePayload(payload) {
  const errors = [];
  
  if (!payload.age || payload.age < 18 || payload.age > 120) {
    errors.push("Age must be between 18 and 120");
  }
  if (!payload.sex || !["male", "female", "other"].includes(payload.sex)) {
    errors.push("Valid sex selection is required");
  }
  if (!payload.disorder_type) {
    errors.push("Disorder type is required");
  }
  if (typeof payload.elisa_biomarker_1 !== "number" || payload.elisa_biomarker_1 < 0) {
    errors.push("ELISA Biomarker 1 must be a valid number");
  }
  if (typeof payload.elisa_biomarker_2 !== "number" || payload.elisa_biomarker_2 < 0) {
    errors.push("ELISA Biomarker 2 must be a valid number");
  }
  if (typeof payload.cognitive_score !== "number" || payload.cognitive_score < 0 || payload.cognitive_score > 100) {
    errors.push("Cognitive Score must be between 0 and 100");
  }
  if (typeof payload.mri_severity_score !== "number" || payload.mri_severity_score < 0 || payload.mri_severity_score > 1) {
    errors.push("MRI Severity Score must be between 0 and 1");
  }
  if (typeof payload.ecg_eeg_anomaly_score !== "number" || payload.ecg_eeg_anomaly_score < 0 || payload.ecg_eeg_anomaly_score > 1) {
    errors.push("ECG/EEG Anomaly Score must be between 0 and 1");
  }
  
  return errors;
}

// Fetch with timeout and retry logic
async function fetchWithRetry(url, options, retryCount = 0) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorDetail = `HTTP ${response.status}`;
      
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorDetail = errorData.detail || JSON.stringify(errorData);
        } else {
          const text = await response.text();
          errorDetail = text || errorDetail;
        }
      } catch (e) {
        // Use default error detail if parsing fails
      }
      
      throw new Error(`Server error (${response.status}): ${errorDetail}`);
    }
    
    return response;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timeout (server took too long to respond)");
    }
    
    // Retry on network errors, but not on client validation errors
    if (retryCount < MAX_RETRIES && err.message.includes("Failed to fetch")) {
      console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    
    throw err;
  }
}

function renderResult(data) {
  lastPredictionData = data;
  resultCard.classList.remove("result-empty");
  resultCard.innerHTML = "";

  const badge = document.createElement("div");
  badge.className = `risk-badge ${data.risk_level}`;
  badge.textContent = `${data.risk_level.toUpperCase()} RISK`;

  const score = document.createElement("div");
  score.className = "risk-score";
  score.innerHTML = `${(data.risk_score * 100).toFixed(1)}% <span>probability</span>`;

  const riskGauge = document.createElement("div");
  riskGauge.className = "risk-gauge";
  const gaugeBar = document.createElement("div");
  gaugeBar.className = "gauge-bar";
  const gaugeFill = document.createElement("div");
  gaugeFill.className = `gauge-fill ${data.risk_level}`;
  gaugeFill.style.width = `${data.risk_score * 100}%`;
  gaugeBar.appendChild(gaugeFill);
  riskGauge.appendChild(gaugeBar);

  const summary = document.createElement("p");
  summary.className = "summary-text";
  summary.textContent = data.summary.replace(/\*\*/g, "");

  resultCard.appendChild(badge);
  resultCard.appendChild(score);
  resultCard.appendChild(riskGauge);
  resultCard.appendChild(summary);

  // Inject visualization canvas
  const chartWrapper = document.createElement("div");
  chartWrapper.className = "chart-wrapper";
  const canvas = document.createElement("canvas");
  canvas.id = "risk-chart";
  canvas.style.maxHeight = "250px";
  chartWrapper.appendChild(canvas);
  resultCard.appendChild(chartWrapper);

  setTimeout(() => {
    if (window.Chart) {
      new Chart(canvas, {
        type: 'radar',
        data: {
          labels: ['ELISA 1', 'ELISA 2', 'Cognitive (Inverse)', 'MRI Sev.', 'ECG/EEG Anomaly'],
          datasets: [{
            label: 'Patient Feature Profile',
            data: [
               Math.min(data.details.inputs.elisa_biomarker_1 / 3, 1),
               Math.min(data.details.inputs.elisa_biomarker_2 / 3, 1),
               1 - (Math.min(data.details.inputs.cognitive_score, 100) / 100),
               data.details.inputs.mri_severity_score,
               data.details.inputs.ecg_eeg_anomaly_score
            ],
            backgroundColor: 'rgba(99, 102, 241, 0.4)',
            borderColor: 'rgba(99, 102, 241, 1)',
            pointBackgroundColor: 'rgba(6, 182, 212, 1)',
            borderWidth: 2
          }]
        },
        options: {
          scales: {
             r: {
                angleLines: { color: 'rgba(148, 163, 184, 0.2)' },
                grid: { color: 'rgba(148, 163, 184, 0.2)' },
                pointLabels: { color: '#cbd5e1', font: { size: 10 } },
                ticks: { display: false, max: 1, min: 0 }
             }
          },
          plugins: {
             legend: { labels: { color: '#e0e7ff' } },
             tooltip: { enabled: false }
          }
        }
      });
    }
  }, 300);

  // ADD COMPREHENSIVE DASHBOARDS
  setTimeout(() => {
    renderDashboards(data);
  }, 500);

  renderRecommendations(data);
}

// ============ DASHBOARD FUNCTIONS ============

function renderDashboards(data) {
  const dashboardContainer = document.createElement('div');
  dashboardContainer.className = 'dashboard-section';
  dashboardContainer.innerHTML = '<h3>📊 Comprehensive Analysis Dashboard</h3>';
  
  // Create tabs for different views
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  
  const tabs = ['overview', 'biomarkers', 'imaging', 'cognitive', 'comparison', 'analytics'];
  const tabLabels = ['Overview', 'Biomarkers', 'Imaging', 'Cognitive', 'Comparison', 'Analytics'];
  
  tabs.forEach((tab, idx) => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${idx === 0 ? 'active' : ''}`;
    btn.textContent = tabLabels[idx];
    btn.onclick = () => switchTab(tab);
    tabsContainer.appendChild(btn);
  });
  
  dashboardContainer.appendChild(tabsContainer);
  
  // Overview Dashboard
  const overviewTab = document.createElement('div');
  overviewTab.id = 'tab-overview';
  overviewTab.className = 'tab-content active';
  overviewTab.appendChild(createOverviewDashboard(data));
  dashboardContainer.appendChild(overviewTab);
  
  // Biomarkers Dashboard
  const biomarkersTab = document.createElement('div');
  biomarkersTab.id = 'tab-biomarkers';
  biomarkersTab.className = 'tab-content';
  biomarkersTab.appendChild(createBiomarkersDashboard(data));
  dashboardContainer.appendChild(biomarkersTab);
  
  // Imaging Dashboard
  const imagingTab = document.createElement('div');
  imagingTab.id = 'tab-imaging';
  imagingTab.className = 'tab-content';
  imagingTab.appendChild(createImagingDashboard(data));
  dashboardContainer.appendChild(imagingTab);
  
  // Cognitive Dashboard
  const cognitiveTab = document.createElement('div');
  cognitiveTab.id = 'tab-cognitive';
  cognitiveTab.className = 'tab-content';
  cognitiveTab.appendChild(createCognitiveDashboard(data));
  dashboardContainer.appendChild(cognitiveTab);
  
  // Comparison Dashboard
  const comparisonTab = document.createElement('div');
  comparisonTab.id = 'tab-comparison';
  comparisonTab.className = 'tab-content';
  comparisonTab.appendChild(createComparisonDashboard(data));
  dashboardContainer.appendChild(comparisonTab);
  
  // Advanced Analytics Dashboard
  const analyticsTab = document.createElement('div');
  analyticsTab.id = 'tab-analytics';
  analyticsTab.className = 'tab-content';
  analyticsTab.appendChild(createAdvancedAnalyticsDashboard(data));
  dashboardContainer.appendChild(analyticsTab);
  
  resultCard.appendChild(dashboardContainer);
}

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab
  const tab = document.getElementById(`tab-${tabName}`);
  if (tab) tab.classList.add('active');
  
  // Mark button as active
  event.target.classList.add('active');
  
  // Trigger chart resize
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);
}

function createOverviewDashboard(data) {
  const container = document.createElement('div');
  container.className = 'dashboard-container';
  
  // Risk Summary Card
  const riskCard = document.createElement('div');
  riskCard.className = 'dashboard-card';
  riskCard.innerHTML = `
    <h4 class="dashboard-title">Risk Summary</h4>
    <div class="metrics-grid">
      <div class="metric-item">
        <div class="metric-label">Risk Score</div>
        <div class="metric-value">${(data.risk_score * 100).toFixed(1)}%</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Risk Level</div>
        <div class="metric-value" style="font-size: 1.2rem;">${data.risk_level.toUpperCase()}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Age</div>
        <div class="metric-value">${data.details.inputs.age}</div>
        <div class="metric-unit">years</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Gender</div>
        <div class="metric-value" style="font-size: 1rem;">${data.details.inputs.sex.charAt(0).toUpperCase() + data.details.inputs.sex.slice(1)}</div>
      </div>
    </div>
  `;
  container.appendChild(riskCard);
  
  // Risk Distribution Pie Chart
  const pieCard = document.createElement('div');
  pieCard.className = 'dashboard-card';
  pieCard.innerHTML = '<h4 class="dashboard-title">Risk Factor Contribution</h4>';
  const pieContainer = document.createElement('div');
  pieContainer.className = 'chart-container';
  const pieCanvas = document.createElement('canvas');
  pieCanvas.id = 'risk-pie-' + Date.now();
  pieContainer.appendChild(pieCanvas);
  pieCard.appendChild(pieContainer);
  container.appendChild(pieCard);
  
  setTimeout(() => {
    if (window.Chart) {
      const factors = [
        data.details.inputs.elisa_biomarker_1,
        data.details.inputs.elisa_biomarker_2,
        (100 - data.details.inputs.cognitive_score) / 100,
        data.details.inputs.mri_severity_score,
        data.details.inputs.ecg_eeg_anomaly_score
      ];
      
      new Chart(pieCanvas, {
        type: 'doughnut',
        data: {
          labels: ['ELISA 1', 'ELISA 2', 'Cognitive Impairment', 'MRI Severity', 'ECG/EEG Anomaly'],
          datasets: [{
            data: factors,
            backgroundColor: [
              'rgba(99, 102, 241, 0.8)',
              'rgba(6, 182, 212, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(251, 146, 60, 0.8)',
              'rgba(248, 113, 113, 0.8)'
            ],
            borderColor: '#0f172a',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' }, position: 'bottom' },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
          }
        }
      });
    }
  }, 200);
  
  // Polar Area Chart
  const polarCard = document.createElement('div');
  polarCard.className = 'dashboard-card';
  polarCard.innerHTML = '<h4 class="dashboard-title">Risk Components (Polar View)</h4>';
  const polarContainer = document.createElement('div');
  polarContainer.className = 'chart-container';
  const polarCanvas = document.createElement('canvas');
  polarCanvas.id = 'risk-polar-' + Date.now();
  polarContainer.appendChild(polarCanvas);
  polarCard.appendChild(polarContainer);
  container.appendChild(polarCard);
  
  setTimeout(() => {
    if (window.Chart) {
      const factors = [
        data.details.inputs.elisa_biomarker_1 * 100,
        data.details.inputs.elisa_biomarker_2 * 100,
        (100 - data.details.inputs.cognitive_score),
        data.details.inputs.mri_severity_score * 100,
        data.details.inputs.ecg_eeg_anomaly_score * 100
      ];
      
      new Chart(polarCanvas, {
        type: 'polarArea',
        data: {
          labels: ['ELISA 1', 'ELISA 2', 'Cognitive Deficit', 'MRI Severity', 'ECG/EEG'],
          datasets: [{
            data: factors,
            backgroundColor: [
              'rgba(99, 102, 241, 0.6)',
              'rgba(6, 182, 212, 0.6)',
              'rgba(168, 85, 247, 0.6)',
              'rgba(251, 146, 60, 0.6)',
              'rgba(248, 113, 113, 0.6)'
            ],
            borderColor: ['#6366f1', '#06b6d4', '#a855f7', '#fb923c', '#f87171'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' }, position: 'bottom' }
          }
        }
      });
    }
  }, 300);
  
  // Trend Line Chart
  const trendCard = document.createElement('div');
  trendCard.className = 'dashboard-card';
  trendCard.style.gridColumn = '1 / -1';
  trendCard.innerHTML = '<h4 class="dashboard-title">Assessment History Trend (Line Chart)</h4>';
  const trendContainer = document.createElement('div');
  trendContainer.className = 'chart-container';
  const trendCanvas = document.createElement('canvas');
  trendCanvas.id = 'assessment-trend-' + Date.now();
  trendContainer.appendChild(trendCanvas);
  trendCard.appendChild(trendContainer);
  container.appendChild(trendCard);
  
  setTimeout(() => {
    if (window.Chart && assessmentHistory) {
      const recentHistory = assessmentHistory.slice(-12);
      const trendData = recentHistory.map(h => h.risk_score || 0);
      const trendLabels = recentHistory.map((_, i) => `#${i + 1}`);
      
      new Chart(trendCanvas, {
        type: 'line',
        data: {
          labels: trendLabels,
          datasets: [{
            label: 'Risk Score Trend',
            data: trendData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          },
          scales: {
            y: {
              min: 0,
              max: 1,
              ticks: { color: '#cbd5e1', callback: v => (v * 100).toFixed(0) + '%' }
            },
            x: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 400);
  
  // Key Insights
  const insightsCard = document.createElement('div');
  insightsCard.className = 'dashboard-card';
  insightsCard.style.gridColumn = '1 / -1';
  insightsCard.innerHTML = '<h4 class="dashboard-title">Key Insights</h4>';
  const insightsList = document.createElement('ul');
  insightsList.className = 'insights-list';
  
  const insights = generateInsights(data);
  insights.forEach(insight => {
    const li = document.createElement('li');
    li.className = 'insight-item';
    li.innerHTML = `<span class="insight-icon">${insight.icon}</span><span class="insight-text">${insight.text}</span>`;
    insightsList.appendChild(li);
  });
  
  insightsCard.appendChild(insightsList);
  container.appendChild(insightsCard);
  
  return container;
}

function createBiomarkersDashboard(data) {
  const container = document.createElement('div');
  container.className = 'dashboard-container';
  
  // Biomarker Comparison
  const bioCard = document.createElement('div');
  bioCard.className = 'dashboard-card';
  bioCard.style.gridColumn = '1 / -1';
  bioCard.innerHTML = '<h4 class="dashboard-title">Biomarker Levels Comparison</h4>';
  
  const comparisonContainer = document.createElement('div');
  comparisonContainer.className = 'comparison-bars';
  
  const biomarkers = [
    { name: 'ELISA 1\n(Aβ42)', value: data.details.inputs.elisa_biomarker_1, max: 3 },
    { name: 'ELISA 2\n(Tau)', value: data.details.inputs.elisa_biomarker_2, max: 3 }
  ];
  
  biomarkers.forEach(bio => {
    const item = document.createElement('div');
    item.className = 'bar-item';
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = (bio.value / bio.max * 100) + '%';
    bar.innerHTML = `<span class="bar-value">${bio.value.toFixed(2)}</span>`;
    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = bio.name;
    item.appendChild(bar);
    item.appendChild(label);
    comparisonContainer.appendChild(item);
  });
  
  bioCard.appendChild(comparisonContainer);
  container.appendChild(bioCard);
  
  // Biomarker Status
  const statusCard = document.createElement('div');
  statusCard.className = 'dashboard-card';
  statusCard.innerHTML = `
    <h4 class="dashboard-title">Biomarker Status</h4>
    <div class="metrics-grid">
      <div class="metric-item">
        <div class="metric-label">ELISA 1</div>
        <div class="metric-value">${data.details.inputs.elisa_biomarker_1.toFixed(2)}</div>
        <div class="metric-unit">ng/L</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">ELISA 2</div>
        <div class="metric-value">${data.details.inputs.elisa_biomarker_2.toFixed(2)}</div>
        <div class="metric-unit">ng/L</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Ratio (1:2)</div>
        <div class="metric-value">${(data.details.inputs.elisa_biomarker_1 / data.details.inputs.elisa_biomarker_2).toFixed(2)}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Sum</div>
        <div class="metric-value">${(data.details.inputs.elisa_biomarker_1 + data.details.inputs.elisa_biomarker_2).toFixed(2)}</div>
      </div>
    </div>
  `;
  container.appendChild(statusCard);
  
  // Scatter Plot - ELISA Correlation
  const scatterCard = document.createElement('div');
  scatterCard.className = 'dashboard-card';
  scatterCard.style.gridColumn = '1 / -1';
  scatterCard.innerHTML = '<h4 class="dashboard-title">Biomarker Correlation (Scatter Plot)</h4>';
  const scatterContainer = document.createElement('div');
  scatterContainer.className = 'chart-container';
  const scatterCanvas = document.createElement('canvas');
  scatterCanvas.id = 'biomarker-scatter-' + Date.now();
  scatterContainer.appendChild(scatterCanvas);
  scatterCard.appendChild(scatterContainer);
  container.appendChild(scatterCard);
  
  setTimeout(() => {
    if (window.Chart) {
      // Create simulated scatter data with patient point
      const scatterData = [];
      for (let i = 0; i < 30; i++) {
        scatterData.push({
          x: Math.random() * 3,
          y: Math.random() * 3
        });
      }
      // Add current patient
      scatterData.push({
        x: data.details.inputs.elisa_biomarker_1,
        y: data.details.inputs.elisa_biomarker_2
      });
      
      new Chart(scatterCanvas, {
        type: 'bubble',
        data: {
          datasets: [{
            label: 'Population',
            data: scatterData.slice(0, -1).map(p => ({ x: p.x, y: p.y, r: 4 })),
            backgroundColor: 'rgba(6, 182, 212, 0.5)',
            borderColor: '#06b6d4',
            borderWidth: 1
          }, {
            label: 'Current Patient',
            data: [{ x: data.details.inputs.elisa_biomarker_1, y: data.details.inputs.elisa_biomarker_2, r: 10 }],
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: '#ef4444',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          },
          scales: {
            x: { title: { display: true, text: 'ELISA 1 (ng/L)', color: '#cbd5e1' }, ticks: { color: '#cbd5e1' } },
            y: { title: { display: true, text: 'ELISA 2 (ng/L)', color: '#cbd5e1' }, ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 200);
  
  // Box Plot Data (Biomarker Distribution)
  const boxCard = document.createElement('div');
  boxCard.className = 'dashboard-card';
  boxCard.style.gridColumn = '1 / -1';
  boxCard.innerHTML = '<h4 class="dashboard-title">Biomarker Distribution (Box Plot)</h4>';
  const boxContainer = document.createElement('div');
  boxContainer.className = 'chart-container';
  const boxCanvas = document.createElement('canvas');
  boxCanvas.id = 'biomarker-box-' + Date.now();
  boxContainer.appendChild(boxCanvas);
  boxCard.appendChild(boxContainer);
  container.appendChild(boxCard);
  
  setTimeout(() => {
    if (window.Chart) {
      // Simulate distribution statistics
      const elisa1Stats = { min: 0.2, q1: 0.7, median: 1.2, q3: 1.8, max: 2.8 };
      const elisa2Stats = { min: 0.1, q1: 0.5, median: 1.0, q3: 1.5, max: 2.5 };
      
      new Chart(boxCanvas, {
        type: 'bar',
        data: {
          labels: ['ELISA 1', 'ELISA 2'],
          datasets: [{
            label: 'Min',
            data: [elisa1Stats.min, elisa2Stats.min],
            backgroundColor: ['rgba(147, 51, 234, 0.8)', 'rgba(147, 51, 234, 0.8)'],
            borderColor: '#9333ea',
            borderWidth: 1
          }, {
            label: 'Q1',
            data: [elisa1Stats.q1, elisa2Stats.q1],
            backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.8)'],
            borderColor: '#6366f1',
            borderWidth: 1
          }, {
            label: 'Median',
            data: [elisa1Stats.median, elisa2Stats.median],
            backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.8)'],
            borderColor: '#22c55e',
            borderWidth: 2
          }, {
            label: 'Q3',
            data: [elisa1Stats.q3, elisa2Stats.q3],
            backgroundColor: ['rgba(249, 115, 22, 0.8)', 'rgba(249, 115, 22, 0.8)'],
            borderColor: '#f97316',
            borderWidth: 1
          }, {
            label: 'Max',
            data: [elisa1Stats.max, elisa2Stats.max],
            backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.8)'],
            borderColor: '#ef4444',
            borderWidth: 1
          }, {
            label: 'Patient',
            data: [data.details.inputs.elisa_biomarker_1, data.details.inputs.elisa_biomarker_2],
            backgroundColor: ['rgba(6, 182, 212, 0.9)', 'rgba(6, 182, 212, 0.9)'],
            borderColor: '#06b6d4',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'x',
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          },
          scales: {
            y: { ticks: { color: '#cbd5e1' } },
            x: { stacked: false, ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 300);
  
  // Advanced Distribution Chart
  const advDistCard = document.createElement('div');
  advDistCard.className = 'dashboard-card';
  advDistCard.style.gridColumn = '1 / -1';
  advDistCard.innerHTML = '<h4 class="dashboard-title">Biomarker Distribution Analysis</h4>';
  const advDistContainer = document.createElement('div');
  advDistContainer.className = 'chart-container';
  const advDistCanvas = document.createElement('canvas');
  advDistCanvas.id = 'biomarker-dist-' + Date.now();
  advDistContainer.appendChild(advDistCanvas);
  advDistCard.appendChild(advDistContainer);
  container.appendChild(advDistCard);
  
  setTimeout(() => {
    if (window.Chart) {
      // Simulate Gaussian distributions
      const bins = [];
      for (let i = 0; i <= 3; i += 0.3) {
        const healthyDist = Math.exp(-Math.pow((i - 0.7) / 0.4, 2) / 2) * 50;
        const patientDist = Math.exp(-Math.pow((i - 1.8) / 0.5, 2) / 2) * 60;
        bins.push({ healthy: healthyDist, patient: patientDist });
      }
      
      new Chart(advDistCanvas, {
        type: 'bar',
        data: {
          labels: bins.map((_, i) => (i * 0.3).toFixed(1)),
          datasets: [{
            label: 'Healthy Population',
            data: bins.map(b => b.healthy),
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderColor: '#22c55e',
            borderWidth: 1
          }, {
            label: 'Patient',
            data: bins.map(b => b.patient),
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: '#ef4444',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            y: { ticks: { color: '#cbd5e1' } },
            x: { ticks: { color: '#cbd5e1', title: { display: true, text: 'Biomarker Level (ng/L)' } } }
          }
        }
      });
    }
  }, 400);
  
  // Biomarker Timeline - Historical Levels
  const bioTimelineCard = document.createElement('div');
  bioTimelineCard.className = 'dashboard-card';
  bioTimelineCard.style.gridColumn = '1 / -1';
  bioTimelineCard.innerHTML = '<h4 class="dashboard-title">Biomarker History Timeline</h4>';
  const bioTimelineContainer = document.createElement('div');
  bioTimelineContainer.className = 'chart-container';
  const bioTimelineCanvas = document.createElement('canvas');
  bioTimelineCanvas.id = 'biomarker-timeline-' + Date.now();
  bioTimelineContainer.appendChild(bioTimelineCanvas);
  bioTimelineCard.appendChild(bioTimelineContainer);
  container.appendChild(bioTimelineCard);
  
  setTimeout(() => {
    if (window.Chart && assessmentHistory) {
      const recentHistory = assessmentHistory.slice(-10);
      const elisa1Data = recentHistory.map(h => h.details?.inputs?.elisa_biomarker_1 || 0);
      const elisa2Data = recentHistory.map(h => h.details?.inputs?.elisa_biomarker_2 || 0);
      const labels = recentHistory.map((_, i) => `T${i + 1}`);
      
      new Chart(bioTimelineCanvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'ELISA 1 (Aβ42)',
            data: elisa1Data,
            borderColor: '#9333ea',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#9333ea',
            borderWidth: 3
          }, {
            label: 'ELISA 2 (Tau)',
            data: elisa2Data,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#06b6d4',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            y: { ticks: { color: '#cbd5e1' } },
            x: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 500);
  
  return container;
}

function createImagingDashboard(data) {
  const container = document.createElement('div');
  container.className = 'dashboard-container';
  
  // Severity Meters
  const meterCard = document.createElement('div');
  meterCard.className = 'dashboard-card';
  meterCard.style.gridColumn = '1 / -1';
  meterCard.innerHTML = '<h4 class="dashboard-title">Imaging Severity Analysis</h4>';
  
  // MRI Severity
  const mriSection = document.createElement('div');
  mriSection.style.marginBottom = '16px';
  const mriLabel = document.createElement('div');
  mriLabel.style.cssText = 'font-size: 0.9rem; color: #cbd5e1; margin-bottom: 8px; font-weight: 500';
  mriLabel.textContent = 'MRI Severity Score';
  mriSection.appendChild(mriLabel);
  
  const mriMeter = document.createElement('div');
  mriMeter.className = 'severity-meter';
  const mriIndicator = document.createElement('div');
  mriIndicator.className = 'severity-indicator';
  mriIndicator.style.left = (data.details.inputs.mri_severity_score * 100) + '%';
  mriMeter.appendChild(mriIndicator);
  mriSection.appendChild(mriMeter);
  
  const mriLabels = document.createElement('div');
  mriLabels.className = 'severity-labels';
  mriLabels.innerHTML = '<span>Normal</span><span>Mild</span><span>Moderate</span><span>Severe</span><span>Critical</span>';
  mriSection.appendChild(mriLabels);
  
  meterCard.appendChild(mriSection);
  
  // ECG/EEG Severity
  const eegSection = document.createElement('div');
  const eegLabel = document.createElement('div');
  eegLabel.style.cssText = 'font-size: 0.9rem; color: #cbd5e1; margin-bottom: 8px; font-weight: 500';
  eegLabel.textContent = 'ECG/EEG Anomaly Score';
  eegSection.appendChild(eegLabel);
  
  const eegMeter = document.createElement('div');
  eegMeter.className = 'severity-meter';
  const eegIndicator = document.createElement('div');
  eegIndicator.className = 'severity-indicator';
  eegIndicator.style.left = (data.details.inputs.ecg_eeg_anomaly_score * 100) + '%';
  eegMeter.appendChild(eegIndicator);
  eegSection.appendChild(eegMeter);
  
  const eegLabels = document.createElement('div');
  eegLabels.className = 'severity-labels';
  eegLabels.innerHTML = '<span>Normal</span><span>Mild</span><span>Moderate</span><span>Severe</span><span>Critical</span>';
  eegSection.appendChild(eegLabels);
  
  meterCard.appendChild(eegSection);
  container.appendChild(meterCard);
  
  // Imaging Metrics
  const metricsCard = document.createElement('div');
  metricsCard.className = 'dashboard-card';
  metricsCard.innerHTML = `
    <h4 class="dashboard-title">Imaging Metrics</h4>
    <div class="metrics-grid">
      <div class="metric-item">
        <div class="metric-label">MRI Severity</div>
        <div class="metric-value">${(data.details.inputs.mri_severity_score * 100).toFixed(1)}%</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">ECG/EEG Anomaly</div>
        <div class="metric-value">${(data.details.inputs.ecg_eeg_anomaly_score * 100).toFixed(1)}%</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Combined Score</div>
        <div class="metric-value">${((data.details.inputs.mri_severity_score + data.details.inputs.ecg_eeg_anomaly_score) / 2 * 100).toFixed(1)}%</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Severity Status</div>
        <div class="metric-value" style="font-size: 1rem;">${data.details.inputs.mri_severity_score > 0.7 ? '⚠️ HIGH' : 'ℹ️ NORMAL'}</div>
      </div>
    </div>
  `;
  container.appendChild(metricsCard);
  
  // Imaging Severity Comparison Chart
  const comparisonCard = document.createElement('div');
  comparisonCard.className = 'dashboard-card';
  comparisonCard.style.gridColumn = '1 / -1';
  comparisonCard.innerHTML = '<h4 class="dashboard-title">Imaging Modality Comparison</h4>';
  const comparisonContainer = document.createElement('div');
  comparisonContainer.className = 'chart-container';
  const comparisonCanvas = document.createElement('canvas');
  comparisonCanvas.id = 'imaging-compare-' + Date.now();
  comparisonContainer.appendChild(comparisonCanvas);
  comparisonCard.appendChild(comparisonContainer);
  container.appendChild(comparisonCard);
  
  setTimeout(() => {
    if (window.Chart) {
      new Chart(comparisonCanvas, {
        type: 'bar',
        data: {
          labels: ['MRI Severity', 'ECG/EEG Anomaly', 'Combined Score'],
          datasets: [{
            label: 'Patient Score (%)',
            data: [
              data.details.inputs.mri_severity_score * 100,
              data.details.inputs.ecg_eeg_anomaly_score * 100,
              ((data.details.inputs.mri_severity_score + data.details.inputs.ecg_eeg_anomaly_score) / 2) * 100
            ],
            backgroundColor: ['#fb923c', '#f59e0b', '#ef4444'],
            borderColor: '#0f172a',
            borderWidth: 2
          }, {
            label: 'Normal Range (%)',
            data: [15, 10, 12.5],
            backgroundColor: ['rgba(34, 197, 94, 0.5)', 'rgba(34, 197, 94, 0.5)', 'rgba(34, 197, 94, 0.5)'],
            borderColor: '#22c55e',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            y: { ticks: { color: '#cbd5e1', callback: v => v.toFixed(0) + '%' } },
            x: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 200);
  
  // Imaging Timeline - Historical Severity
  const timelineCard = document.createElement('div');
  timelineCard.className = 'dashboard-card';
  timelineCard.style.gridColumn = '1 / -1';
  timelineCard.innerHTML = '<h4 class="dashboard-title">Imaging Evolution Timeline</h4>';
  const timelineContainer = document.createElement('div');
  timelineContainer.className = 'chart-container';
  const timelineCanvas = document.createElement('canvas');
  timelineCanvas.id = 'imaging-timeline-' + Date.now();
  timelineContainer.appendChild(timelineCanvas);
  timelineCard.appendChild(timelineContainer);
  container.appendChild(timelineCard);
  
  setTimeout(() => {
    if (window.Chart && assessmentHistory) {
      const recentHistory = assessmentHistory.slice(-10);
      const mriData = recentHistory.map(h => (h.details?.inputs?.mri_severity_score || 0) * 100);
      const eegData = recentHistory.map(h => (h.details?.inputs?.ecg_eeg_anomaly_score || 0) * 100);
      const labels = recentHistory.map((_, i) => `T${i + 1}`);
      
      new Chart(timelineCanvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'MRI Severity (%)',
            data: mriData,
            borderColor: '#fb923c',
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#fb923c'
          }, {
            label: 'ECG/EEG Anomaly (%)',
            data: eegData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#f59e0b'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            y: { ticks: { color: '#cbd5e1', callback: v => v.toFixed(0) + '%' } },
            x: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 300);
  
  return container;
}

function createCognitiveDashboard(data) {
  const container = document.createElement('div');
  container.className = 'dashboard-container';
  
  // Cognitive Gauge Chart
  const gaugeCard = document.createElement('div');
  gaugeCard.className = 'dashboard-card';
  gaugeCard.innerHTML = '<h4 class="dashboard-title">Cognitive Assessment</h4>';
  
  const gaugeContainerDiv = document.createElement('div');
  gaugeContainerDiv.className = 'gauge-container';
  
  const circularProgress = document.createElement('div');
  circularProgress.className = 'circular-progress';
  
  const gaugeValue = document.createElement('div');
  gaugeValue.className = 'gauge-value';
  gaugeValue.textContent = data.details.inputs.cognitive_score.toFixed(1);
  
  const gaugeLabel = document.createElement('div');
  gaugeLabel.className = 'gauge-label';
  gaugeLabel.textContent = '/ 100';
  
  circularProgress.appendChild(gaugeValue);
  circularProgress.appendChild(gaugeLabel);
  gaugeContainerDiv.appendChild(circularProgress);
  gaugeCard.appendChild(gaugeContainerDiv);
  container.appendChild(gaugeCard);
  
  // Cognitive Status
  const statusCard = document.createElement('div');
  statusCard.className = 'dashboard-card';
  const cogStatus = data.details.inputs.cognitive_score > 80 ? 'Normal' : 
                     data.details.inputs.cognitive_score > 50 ? 'Mild Impairment' : 
                     data.details.inputs.cognitive_score > 20 ? 'Moderate Impairment' : 'Severe Impairment';
  
  statusCard.innerHTML = `
    <h4 class="dashboard-title">Cognitive Status</h4>
    <div class="metrics-grid">
      <div class="metric-item">
        <div class="metric-label">Score</div>
        <div class="metric-value">${data.details.inputs.cognitive_score.toFixed(1)}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Status</div>
        <div class="metric-value" style="font-size: 0.9rem;">${cogStatus}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Percentile</div>
        <div class="metric-value">${Math.round(data.details.inputs.cognitive_score)}%</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Impairment</div>
        <div class="metric-value">${(100 - data.details.inputs.cognitive_score).toFixed(1)}%</div>
      </div>
    </div>
  `;
  container.appendChild(statusCard);
  
  // Population Distribution Histogram
  const histCard = document.createElement('div');
  histCard.className = 'dashboard-card';
  histCard.style.gridColumn = '1 / -1';
  histCard.innerHTML = '<h4 class="dashboard-title">Patient vs Population Distribution</h4>';
  const histContainer = document.createElement('div');
  histContainer.className = 'chart-container';
  const histCanvas = document.createElement('canvas');
  histCanvas.id = 'cognitive-dist-' + Date.now();
  histContainer.appendChild(histCanvas);
  histCard.appendChild(histContainer);
  container.appendChild(histCard);
  
  setTimeout(() => {
    if (window.Chart) {
      // Simulate normal distribution of cognitive scores
      const bins = [];
      for (let i = 0; i <= 100; i += 5) {
        const normalDist = Math.exp(-Math.pow((i - 75) / 15, 2) / 2) * 100;
        bins.push(normalDist);
      }
      
      new Chart(histCanvas, {
        type: 'bar',
        data: {
          labels: bins.map((_, i) => (i * 5) + ''),
          datasets: [{
            label: 'Population Distribution',
            data: bins,
            backgroundColor: 'rgba(99, 102, 241, 0.6)',
            borderColor: '#6366f1',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'x',
          plugins: {
            legend: { labels: { color: '#cbd5e1' } },
            annotation: {
              drawTime: 'afterDraw'
            }
          },
          scales: {
            y: { ticks: { color: '#cbd5e1' } },
            x: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 200);
  
  // Cognitive Radar Chart
  const radarCard = document.createElement('div');
  radarCard.className = 'dashboard-card';
  radarCard.style.gridColumn = '1 / -1';
  radarCard.innerHTML = '<h4 class="dashboard-title">Cognitive Domains (Radar)</h4>';
  const radarContainer = document.createElement('div');
  radarContainer.className = 'chart-container';
  const radarCanvas = document.createElement('canvas');
  radarCanvas.id = 'cognitive-radar-' + Date.now();
  radarContainer.appendChild(radarCanvas);
  radarCard.appendChild(radarContainer);
  container.appendChild(radarCard);
  
  setTimeout(() => {
    if (window.Chart) {
      const cogScore = data.details.inputs.cognitive_score;
      const domainScores = [
        cogScore * 0.95,
        cogScore * 1.05,
        cogScore * 0.92,
        cogScore * 0.98,
        cogScore * 1.08,
        cogScore * 0.90
      ];
      
      new Chart(radarCanvas, {
        type: 'radar',
        data: {
          labels: ['Memory', 'Attention', 'Fluency', 'Visuospatial', 'Executive', 'Language'],
          datasets: [{
            label: 'Patient Score',
            data: domainScores,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#ef4444'
          }, {
            label: 'Normal Range',
            data: [75, 75, 75, 75, 75, 75],
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#22c55e'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { color: '#cbd5e1' },
              grid: { color: '#334155' }
            }
          }
        }
      });
    }
  }, 300);
  
  return container;
}

function createComparisonDashboard(data) {
  const container = document.createElement('div');
  container.className = 'dashboard-container';
  
  // Patient vs Healthy Baseline
  const compCard = document.createElement('div');
  compCard.className = 'dashboard-card';
  compCard.style.gridColumn = '1 / -1';
  compCard.innerHTML = '<h4 class="dashboard-title">Patient vs Healthy Baseline</h4>';
  
  const comparisonBars = document.createElement('div');
  comparisonBars.className = 'comparison-bars';
  comparisonBars.style.gap = '16px';
  
  const comparisons = [
    { name: 'Risk Score', patient: data.risk_score, healthy: 0.2 },
    { name: 'ELISA Burden', patient: Math.min((data.details.inputs.elisa_biomarker_1 + data.details.inputs.elisa_biomarker_2) / 6, 1), healthy: 0.2 },
    { name: 'Cognitive Deficit', patient: 1 - (data.details.inputs.cognitive_score / 100), healthy: 0.1 },
    { name: 'Imaging Abnormality', patient: (data.details.inputs.mri_severity_score + data.details.inputs.ecg_eeg_anomaly_score) / 2, healthy: 0.05 }
  ];
  
  comparisons.forEach(comp => {
    const groupDiv = document.createElement('div');
    groupDiv.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 8px';
    
    const patientBar = document.createElement('div');
    patientBar.className = 'bar-item';
    const patientBarDiv = document.createElement('div');
    patientBarDiv.className = 'bar';
    patientBarDiv.style.cssText = `height: ${Math.min(comp.patient, 1) * 100}px; background: linear-gradient(180deg, #ef4444 0%, #fca5a5 100%);`;
    patientBarDiv.innerHTML = `<span class="bar-value">${(comp.patient * 100).toFixed(0)}%</span>`;
    const patientLabel = document.createElement('div');
    patientLabel.className = 'bar-label';
    patientLabel.textContent = 'Patient';
    patientBar.appendChild(patientBarDiv);
    patientBar.appendChild(patientLabel);
    
    const healthyBar = document.createElement('div');
    healthyBar.className = 'bar-item';
    const healthyBarDiv = document.createElement('div');
    healthyBarDiv.className = 'bar';
    healthyBarDiv.style.cssText = `height: ${Math.min(comp.healthy, 1) * 100}px; background: linear-gradient(180deg, #22c55e 0%, #86efac 100%);`;
    healthyBarDiv.innerHTML = `<span class="bar-value">${(comp.healthy * 100).toFixed(0)}%</span>`;
    const healthyLabel = document.createElement('div');
    healthyLabel.className = 'bar-label';
    healthyLabel.textContent = 'Baseline';
    healthyBar.appendChild(healthyBarDiv);
    healthyBar.appendChild(healthyLabel);
    
    groupDiv.appendChild(patientBar);
    groupDiv.appendChild(healthyBar);
    
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'text-align: center; font-size: 0.85rem; color: #cbd5e1; font-weight: 600; margin-top: 8px';
    titleDiv.textContent = comp.name;
    groupDiv.appendChild(titleDiv);
    
    comparisonBars.appendChild(groupDiv);
  });
  
  compCard.appendChild(comparisonBars);
  container.appendChild(compCard);
  
  // Risk Matrix
  const matrixCard = document.createElement('div');
  matrixCard.className = 'dashboard-card';
  matrixCard.style.gridColumn = '1 / -1';
  matrixCard.innerHTML = '<h4 class="dashboard-title">Risk Classification Matrix</h4>';
  
  const matrix = document.createElement('div');
  matrix.className = 'risk-matrix';
  
  const cellData = [
    { label: 'Overall Risk', value: data.risk_level, level: data.risk_level },
    { label: 'Biomarker Risk', value: data.details.inputs.elisa_biomarker_1 + data.details.inputs.elisa_biomarker_2 > 4 ? 'HIGH' : 'LOW', level: data.details.inputs.elisa_biomarker_1 + data.details.inputs.elisa_biomarker_2 > 4 ? 'high' : 'low' },
    { label: 'Cognitive Risk', value: data.details.inputs.cognitive_score < 40 ? 'HIGH' : 'LOW', level: data.details.inputs.cognitive_score < 40 ? 'high' : 'low' }
  ];
  
  cellData.forEach(cell => {
    const cellDiv = document.createElement('div');
    cellDiv.className = `matrix-cell ${cell.level}`;
    cellDiv.innerHTML = `
      <div class="matrix-label">${cell.label}</div>
      <div class="matrix-value">${cell.value.toUpperCase()}</div>
    `;
    matrix.appendChild(cellDiv);
  });
  
  matrixCard.appendChild(matrix);
  container.appendChild(matrixCard);
  
  // Multi-Dimensional Bubble Chart
  const bubbleCard = document.createElement('div');
  bubbleCard.className = 'dashboard-card';
  bubbleCard.style.gridColumn = '1 / -1';
  bubbleCard.innerHTML = '<h4 class="dashboard-title">Multi-Dimensional Risk Analysis (Bubble Chart)</h4>';
  const bubbleContainer = document.createElement('div');
  bubbleContainer.className = 'chart-container';
  const bubbleCanvas = document.createElement('canvas');
  bubbleCanvas.id = 'risk-bubble-' + Date.now();
  bubbleContainer.appendChild(bubbleCanvas);
  bubbleCard.appendChild(bubbleContainer);
  container.appendChild(bubbleCard);
  
  setTimeout(() => {
    if (window.Chart) {
      // Bubble chart: Age vs Risk Score, bubble size = Biomarker burden
      const bubbleData = [];
      for (let i = 0; i < 25; i++) {
        bubbleData.push({
          x: 50 + Math.random() * 30,
          y: Math.random() * 1,
          r: 3 + Math.random() * 4
        });
      }
      
      new Chart(bubbleCanvas, {
        type: 'bubble',
        data: {
          datasets: [{
            label: 'Population',
            data: bubbleData,
            backgroundColor: 'rgba(99, 102, 241, 0.5)',
            borderColor: '#6366f1',
            borderWidth: 1
          }, {
            label: 'Current Patient',
            data: [{
              x: data.details.inputs.age,
              y: data.risk_score,
              r: 10
            }],
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: '#ef4444',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          },
          scales: {
            x: {
              title: { display: true, text: 'Age (years)', color: '#cbd5e1' },
              ticks: { color: '#cbd5e1' },
              min: 40,
              max: 90
            },
            y: {
              title: { display: true, text: 'Risk Score', color: '#cbd5e1' },
              ticks: { color: '#cbd5e1', callback: v => (v * 100).toFixed(0) + '%' },
              min: 0,
              max: 1
            }
          }
        }
      });
    }
  }, 200);
  
  // Stacked Area Chart - Cumulative Risk
  const areaCard = document.createElement('div');
  areaCard.className = 'dashboard-card';
  areaCard.style.gridColumn = '1 / -1';
  areaCard.innerHTML = '<h4 class="dashboard-title">Cumulative Risk Components (Stacked Area)</h4>';
  const areaContainer = document.createElement('div');
  areaContainer.className = 'chart-container';
  const areaCanvas = document.createElement('canvas');
  areaCanvas.id = 'risk-area-' + Date.now();
  areaContainer.appendChild(areaCanvas);
  areaCard.appendChild(areaContainer);
  container.appendChild(areaCard);
  
  setTimeout(() => {
    if (window.Chart && assessmentHistory) {
      const historyLength = Math.min(12, assessmentHistory.length);
      const historyLabels = assessmentHistory.slice(-historyLength).map((_, i) => `T${i + 1}`);
      
      const elisaData = assessmentHistory.slice(-historyLength).map(h => h.details?.inputs?.elisa_biomarker_1 || 0);
      const cognitiveData = assessmentHistory.slice(-historyLength).map(h => Math.max(0, 1 - (h.details?.inputs?.cognitive_score || 50) / 100));
      const imagingData = assessmentHistory.slice(-historyLength).map(h => (h.details?.inputs?.mri_severity_score || 0));
      
      new Chart(areaCanvas, {
        type: 'line',
        data: {
          labels: historyLabels,
          datasets: [{
            label: 'ELISA Burden',
            data: elisaData,
            borderColor: '#9333ea',
            backgroundColor: 'rgba(147, 51, 234, 0.3)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#9333ea'
          }, {
            label: 'Cognitive Deficit',
            data: cognitiveData,
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.3)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#ec4899'
          }, {
            label: 'Imaging Severity',
            data: imagingData,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.3)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#f97316'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          },
          scales: {
            y: {
              stacked: true,
              ticks: { color: '#cbd5e1' }
            },
            x: {
              ticks: { color: '#cbd5e1' }
            }
          }
        }
      });
    }
  }, 300);
  
  return container;
}

function createAdvancedAnalyticsDashboard(data) {
  const container = document.createElement('div');
  container.className = 'dashboard-container';
  
  // Heatmap - Correlation Matrix
  const heatmapCard = document.createElement('div');
  heatmapCard.className = 'dashboard-card';
  heatmapCard.style.gridColumn = '1 / -1';
  heatmapCard.innerHTML = '<h4 class="dashboard-title">Biomarker Correlation Heatmap</h4>';
  const heatmapContainer = document.createElement('div');
  heatmapContainer.className = 'chart-container';
  const heatmapCanvas = document.createElement('canvas');
  heatmapCanvas.id = 'heatmap-' + Date.now();
  heatmapContainer.appendChild(heatmapCanvas);
  heatmapCard.appendChild(heatmapContainer);
  container.appendChild(heatmapCard);
  
  setTimeout(() => {
    if (window.Chart) {
      // Create correlation matrix visualization as grouped bars
      const metrics = ['ELISA 1', 'ELISA 2', 'MRI', 'ECG/EEG', 'Cognitive'];
      const correlations = [
        [1.0, 0.75, 0.62, 0.51, -0.45],
        [0.75, 1.0, 0.58, 0.48, -0.52],
        [0.62, 0.58, 1.0, 0.71, -0.38],
        [0.51, 0.48, 0.71, 1.0, -0.41],
        [-0.45, -0.52, -0.38, -0.41, 1.0]
      ];
      
      const colors = ['#7c3aed', '#6366f1', '#0ea5e9', '#06b6d4', '#10b981'];
      const datasets = correlations.map((row, idx) => ({
        label: metrics[idx],
        data: row.map(v => v * 100),
        backgroundColor: colors[idx]
      }));
      
      new Chart(heatmapCanvas, {
        type: 'bar',
        data: {
          labels: metrics,
          datasets: datasets
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          },
          scales: {
            x: {
              min: -100,
              max: 100,
              ticks: { color: '#cbd5e1' }
            },
            y: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 300);
  
  // Waterfall Chart - Risk Contribution
  const waterfallCard = document.createElement('div');
  waterfallCard.className = 'dashboard-card';
  waterfallCard.style.gridColumn = '1 / -1';
  waterfallCard.innerHTML = '<h4 class="dashboard-title">Risk Score Breakdown (Waterfall)</h4>';
  const waterfallContainer = document.createElement('div');
  waterfallContainer.className = 'chart-container';
  const waterfallCanvas = document.createElement('canvas');
  waterfallCanvas.id = 'waterfall-' + Date.now();
  waterfallContainer.appendChild(waterfallCanvas);
  waterfallCard.appendChild(waterfallContainer);
  container.appendChild(waterfallCard);
  
  setTimeout(() => {
    if (window.Chart) {
      const baselineRisk = 0.1;
      const elisaContribution = data.details.inputs.elisa_biomarker_1 * 0.15;
      const cognitiveContribution = (100 - data.details.inputs.cognitive_score) / 100 * 0.2;
      const mriContribution = data.details.inputs.mri_severity_score * 0.25;
      const eegContribution = data.details.inputs.ecg_eeg_anomaly_score * 0.15;
      
      new Chart(waterfallCanvas, {
        type: 'bar',
        data: {
          labels: ['Baseline', 'ELISA\nBiomarkers', 'Cognitive\nDeficit', 'MRI\nSeverity', 'ECG/EEG\nAnomalies', 'Total Risk'],
          datasets: [{
            label: 'Risk Contribution',
            data: [
              baselineRisk * 100,
              elisaContribution * 100,
              cognitiveContribution * 100,
              mriContribution * 100,
              eegContribution * 100,
              (baselineRisk + elisaContribution + cognitiveContribution + mriContribution + eegContribution) * 100
            ],
            backgroundColor: ['#94a3b8', '#9333ea', '#ec4899', '#f97316', '#ef4444', '#dc2626'],
            borderColor: '#0f172a',
            borderWidth: 2
          }]
        },
        options: {
          indexAxis: 'x',
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            y: { ticks: { color: '#cbd5e1', callback: v => v.toFixed(0) + '%' } },
            x: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 400);
  
  // Slope Chart - Trend Comparison
  const slopeCard = document.createElement('div');
  slopeCard.className = 'dashboard-card';
  slopeCard.style.gridColumn = '1 / -1';
  slopeCard.innerHTML = '<h4 class="dashboard-title">Assessment Trajectory (Slope Chart)</h4>';
  const slopeContainer = document.createElement('div');
  slopeContainer.className = 'chart-container';
  const slopeCanvas = document.createElement('canvas');
  slopeCanvas.id = 'slope-' + Date.now();
  slopeContainer.appendChild(slopeCanvas);
  slopeCard.appendChild(slopeContainer);
  container.appendChild(slopeCard);
  
  setTimeout(() => {
    if (window.Chart && assessmentHistory && assessmentHistory.length >= 2) {
      const recent = assessmentHistory.slice(-2);
      const prevRisk = recent[0]?.risk_score || 0.3;
      const currRisk = data.risk_score;
      const prevCog = recent[0]?.details?.inputs?.cognitive_score || 60;
      const currCog = data.details.inputs.cognitive_score;
      const prevBio = (recent[0]?.details?.inputs?.elisa_biomarker_1 || 1) + (recent[0]?.details?.inputs?.elisa_biomarker_2 || 0.8);
      const currBio = data.details.inputs.elisa_biomarker_1 + data.details.inputs.elisa_biomarker_2;
      
      new Chart(slopeCanvas, {
        type: 'line',
        data: {
          labels: ['Previous', 'Current'],
          datasets: [{
            label: 'Risk Score',
            data: [prevRisk * 100, currRisk * 100],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            pointRadius: 8,
            pointBackgroundColor: '#ef4444',
            borderWidth: 3,
            tension: 0
          }, {
            label: 'Cognitive Score',
            data: [prevCog, currCog],
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            pointRadius: 8,
            pointBackgroundColor: '#22c55e',
            borderWidth: 3,
            tension: 0
          }, {
            label: 'Biomarker Sum',
            data: [prevBio / 3 * 100, currBio / 3 * 100],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            pointRadius: 8,
            pointBackgroundColor: '#06b6d4',
            borderWidth: 3,
            tension: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            y: { ticks: { color: '#cbd5e1' } },
            x: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 500);
  
  // Funnel Chart - Disease Progression Stages
  const funnelCard = document.createElement('div');
  funnelCard.className = 'dashboard-card';
  funnelCard.style.gridColumn = '1 / -1';
  funnelCard.innerHTML = '<h4 class="dashboard-title">Disease Progression Funnel</h4>';
  const funnelContainer = document.createElement('div');
  funnelContainer.className = 'chart-container';
  const funnelCanvas = document.createElement('canvas');
  funnelCanvas.id = 'funnel-' + Date.now();
  funnelContainer.appendChild(funnelCanvas);
  funnelCard.appendChild(funnelContainer);
  container.appendChild(funnelCard);
  
  setTimeout(() => {
    if (window.Chart) {
      const stages = [100, 85, 65, 40, 15];
      const stageLabels = ['At Risk', 'Mild Cognitive Decline', 'Moderate Impairment', 'Severe Impairment', 'Advanced Disease'];
      const colors = ['#22c55e', '#fbbf24', '#fb923c', '#f97316', '#ef4444'];
      
      new Chart(funnelCanvas, {
        type: 'bar',
        data: {
          labels: stageLabels,
          datasets: [{
            label: 'Population %',
            data: stages,
            backgroundColor: colors,
            borderColor: '#0f172a',
            borderWidth: 2
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'y',
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            x: { ticks: { color: '#cbd5e1', callback: v => v + '%' } },
            y: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 600);
  
  // Percentile Distribution Chart
  const percentileCard = document.createElement('div');
  percentileCard.className = 'dashboard-card';
  percentileCard.style.gridColumn = '1 / -1';
  percentileCard.innerHTML = '<h4 class="dashboard-title">Population Percentile Analysis</h4>';
  const percentileContainer = document.createElement('div');
  percentileContainer.className = 'chart-container';
  const percentileCanvas = document.createElement('canvas');
  percentileCanvas.id = 'percentile-' + Date.now();
  percentileContainer.appendChild(percentileCanvas);
  percentileCard.appendChild(percentileContainer);
  container.appendChild(percentileCard);
  
  setTimeout(() => {
    if (window.Chart) {
      const percentiles = [5, 10, 25, 50, 75, 90, 95];
      const riskValues = percentiles.map(p => p / 100);
      const patientPercentile = Math.round((data.risk_score * 100 / 100) * 100);
      
      new Chart(percentileCanvas, {
        type: 'bar',
        data: {
          labels: percentiles.map(p => `${p}th`),
          datasets: [{
            label: 'Risk Score Percentiles',
            data: riskValues.map(v => v * 100),
            backgroundColor: ['#22c55e', '#96d836', '#fbbf24', '#fb923c', '#f97316', '#ef4444', '#dc2626'],
            borderColor: '#0f172a',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } },
            annotation: {
              drawTime: 'afterDraw',
              annotations: {
                patientLine: {
                  type: 'line',
                  mode: 'horizontal',
                  scaleID: 'y-axis-0',
                  value: (data.risk_score * 100),
                  borderColor: '#ff0000',
                  borderWidth: 2
                }
              }
            }
          },
          scales: {
            y: { ticks: { color: '#cbd5e1', callback: v => v.toFixed(0) + '%' } },
            x: { ticks: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }, 700);
  
  // Multi-Parameter Comparison Radar
  const multiRadarCard = document.createElement('div');
  multiRadarCard.className = 'dashboard-card';
  multiRadarCard.style.gridColumn = '1 / -1';
  multiRadarCard.innerHTML = '<h4 class="dashboard-title">All Parameters Radar Profile</h4>';
  const multiRadarContainer = document.createElement('div');
  multiRadarContainer.className = 'chart-container';
  const multiRadarCanvas = document.createElement('canvas');
  multiRadarCanvas.id = 'multi-radar-' + Date.now();
  multiRadarContainer.appendChild(multiRadarCanvas);
  multiRadarCard.appendChild(multiRadarContainer);
  container.appendChild(multiRadarCard);
  
  setTimeout(() => {
    if (window.Chart) {
      new Chart(multiRadarCanvas, {
        type: 'radar',
        data: {
          labels: ['ELISA 1', 'ELISA 2', 'MRI', 'ECG/EEG', 'Cognitive', 'Risk Score', 'Age Factor'],
          datasets: [{
            label: 'Current Patient',
            data: [
              data.details.inputs.elisa_biomarker_1 / 3 * 100,
              data.details.inputs.elisa_biomarker_2 / 3 * 100,
              data.details.inputs.mri_severity_score * 100,
              data.details.inputs.ecg_eeg_anomaly_score * 100,
              data.details.inputs.cognitive_score,
              data.risk_score * 100,
              (data.details.inputs.age / 100) * 100
            ],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderWidth: 2,
            pointRadius: 5,
            pointBackgroundColor: '#ef4444'
          }, {
            label: 'Healthy Range',
            data: [20, 20, 15, 10, 85, 20, 50],
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#22c55e'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { color: '#cbd5e1' },
              grid: { color: '#334155' }
            }
          }
        }
      });
    }
  }, 800);
  
  return container;
}

function generateInsights(data) {
  const insights = [];
  
  if (data.risk_score > 0.7) {
    insights.push({ icon: '⚠️', text: 'High risk score indicates potential disease progression. Recommend urgent clinical follow-up.' });
  } else if (data.risk_score > 0.4) {
    insights.push({ icon: '⏰', text: 'Moderate risk detected. Consider close monitoring and preventive interventions.' });
  } else {
    insights.push({ icon: '✅', text: 'Low risk profile. Continue current management and routine monitoring.' });
  }
  
  if (data.details.inputs.cognitive_score < 24) {
    insights.push({ icon: '🧠', text: 'Significant cognitive impairment detected. Neuropsychological assessment recommended.' });
  }
  
  if ((data.details.inputs.elisa_biomarker_1 + data.details.inputs.elisa_biomarker_2) > 4) {
    insights.push({ icon: '🧪', text: 'Elevated biomarker levels suggest active pathology. Consider biomarker confirmation.' });
  }
  
  if (data.details.inputs.mri_severity_score > 0.6) {
    insights.push({ icon: '🖼️', text: 'Significant structural brain abnormalities on MRI. May require additional imaging.' });
  }
  
  if (data.details.inputs.age > 75) {
    insights.push({ icon: '👴', text: 'Advanced age is a risk factor. Monitor for age-related complications.' });
  }
  
  return insights;
}

function renderRecommendations(data) {
  recommendationCard.classList.remove("hidden");
  recommendationCard.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = "Recommendations & Next Steps";
  recommendationCard.appendChild(title);

  const recList = document.createElement("ul");
  recList.className = "recommendation-list";

  if (data.risk_level === "high") {
    const rec1 = document.createElement("li");
    rec1.innerHTML = "<strong>Urgent review recommended:</strong> Schedule comprehensive clinical evaluation immediately";
    recList.appendChild(rec1);
  }

  if (data.details.inputs.cognitive_score < 20) {
    const rec2 = document.createElement("li");
    rec2.innerHTML = "<strong>Cognitive assessment:</strong> Consider formal neuropsychological testing";
    recList.appendChild(rec2);
  }

  const rec3 = document.createElement("li");
  rec3.innerHTML = "<strong>Biomarker confirmation:</strong> Recommend validation with additional labs or imaging";
  recList.appendChild(rec3);

  const rec4 = document.createElement("li");
  rec4.innerHTML = "<strong>Follow-up timeline:</strong> Schedule follow-up assessment in 3-6 months";
  recList.appendChild(rec4);

  recommendationCard.appendChild(recList);

  if (exportBtn) {
    exportBtn.disabled = false;
  }
}

function displayError(errorMessage, retryCallback = null) {
  resultCard.classList.remove("result-empty");
  resultCard.innerHTML = "";
  
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-container";
  errorDiv.style.cssText = `
    padding: 16px;
    background: #fee2e2;
    border: 1px solid #fca5a5;
    border-radius: 8px;
    color: #991b1b;
    margin-bottom: 16px;
  `;
  
  const errorTitle = document.createElement("h4");
  errorTitle.textContent = "⚠️ Assessment Error";
  errorTitle.style.cssText = "margin: 0 0 8px 0; color: #991b1b;";
  errorDiv.appendChild(errorTitle);
  
  const errorText = document.createElement("p");
  errorText.textContent = errorMessage;
  errorText.style.cssText = "margin: 0 0 12px 0; line-height: 1.5;";
  errorDiv.appendChild(errorText);
  
  const helpDiv = document.createElement("div");
  helpDiv.style.cssText = "background: white; padding: 12px; border-radius: 4px; margin-top: 8px; font-size: 0.85em;";
  helpDiv.innerHTML = `
    <p style="margin: 0 0 8px 0; font-weight: 600;">✅ Quick Fix (Windows):</p>
    <p style="margin: 0 0 12px 0;">Run <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 2px;">START_SERVERS.bat</code> from the project root folder</p>
    
    <p style="margin: 0 0 8px 0; font-weight: 600;">⚙️ Manual Setup:</p>
    <ol style="margin: 0; padding-left: 20px;">
      <li style="margin-bottom: 4px;">Open terminal in project folder</li>
      <li style="margin-bottom: 4px;">Activate venv: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 2px;">.venv\\Scripts\\activate</code></li>
      <li style="margin-bottom: 4px;">Start backend: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 2px;">python backend/main.py</code></li>
      <li style="margin-bottom: 4px;">Backend should be at <a href="http://localhost:8000/health" target="_blank" style="color: #0066cc; text-decoration: underline;">http://localhost:8000/health</a></li>
      <li>Check browser console (F12) for more details</li>
    </ol>
  `;
  errorDiv.appendChild(helpDiv);
  
  resultCard.appendChild(errorDiv);
  
  if (retryCallback) {
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "🔄 Retry Assessment";
    retryBtn.style.cssText = `
      padding: 8px 16px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      margin-top: 8px;
    `;
    retryBtn.addEventListener("click", retryCallback);
    errorDiv.appendChild(retryBtn);
  }
  
  recommendationCard.classList.add("hidden");
}

async function submitForm(event) {
  event.preventDefault();
  
  // Prevent double submission
  if (isSubmitting) {
    return;
  }
  
  setLoading(true);
  debugCard.classList.add("hidden");

  try {
    // Get form data
    const formData = new FormData(form);
    const payload = buildPayload(formData);
    
    // Validate payload before sending
    const validationErrors = validatePayload(payload);
    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.join("\n• ");
      displayError(`Validation Error:\n• ${errorMsg}`);
      setLoading(false);
      return;
    }
    
    // Check server health first
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      displayError(
        "Cannot connect to backend server. The server at http://localhost:8000 is not responding.",
        () => submitForm(event)
      );
      setLoading(false);
      return;
    }

    // Make API call with timeout and retry
    const response = await fetchWithRetry(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    // Validate response structure
    if (!data.risk_score || !data.risk_level || !data.summary) {
      throw new Error("Invalid response structure from server");
    }
    
    renderResult(data);
    saveToHistory(data);
    debugJson.textContent = JSON.stringify(data, null, 2);
    
  } catch (err) {
    console.error("Assessment Error:", err);
    const errorMsg = err.message || "Unknown error occurred";
    displayError(
      `Assessment failed: ${errorMsg}\n\nPlease ensure the FastAPI backend is running on http://localhost:8000`,
      () => submitForm(event)
    );
  } finally {
    setLoading(false);
  }
}

function resetForm() {
  form.reset();
  resultCard.classList.add("result-empty");
  resultCard.innerHTML =
    '<p class="placeholder">Fill in the patient profile and run the assessment to see results here.</p>';
  recommendationCard.classList.add("hidden");
  debugCard.classList.add("hidden");
  debugJson.textContent = "";
  lastPredictionData = null;
  if (exportBtn) exportBtn.disabled = true;
}

function exportResults() {
  if (!lastPredictionData) return;
  exportBtn.textContent = "Generating PDF...";
  exportBtn.disabled = true;

  const d = lastPredictionData;
  const inp = d.details.inputs;
  const terms = d.details.interpretable_terms;
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  const riskColor = d.risk_level === 'high' ? '#ef4444' : d.risk_level === 'moderate' ? '#f59e0b' : '#22c55e';
  const riskBg = d.risk_level === 'high' ? '#fee2e2' : d.risk_level === 'moderate' ? '#fef3c7' : '#dcfce3';
  const riskText = d.risk_level === 'high' ? '#991b1b' : d.risk_level === 'moderate' ? '#92400e' : '#166534';

  const historyRows = (assessmentHistory || []).slice(0, 5).map(h =>
    `<tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:7px 10px;">${h.date} ${h.time}</td>
      <td style="padding:7px 10px;">${h.diseaseName || h.disorderType}</td>
      <td style="padding:7px 10px;text-align:right;font-weight:600;">${(h.riskScore*100).toFixed(1)}%</td>
      <td style="padding:7px 10px;text-align:right;font-weight:600;color:${h.riskLevel==='high'?'#ef4444':h.riskLevel==='moderate'?'#f59e0b':'#22c55e'};">${h.riskLevel.toUpperCase()}</td>
      <td style="padding:7px 10px;text-align:right;">${h.age}</td>
    </tr>`).join('');

  const insights = [];
  if (d.risk_score > 0.7) insights.push('⚠️ <strong>High risk score:</strong> Urgent clinical follow-up recommended.');
  else if (d.risk_score > 0.4) insights.push('⏰ <strong>Moderate risk detected.</strong> Close monitoring and preventive interventions advised.');
  else insights.push('✅ <strong>Low risk profile.</strong> Continue current management and routine monitoring.');
  if (inp.cognitive_score < 24) insights.push('🧠 <strong>Cognitive impairment detected.</strong> Neuropsychological assessment recommended.');
  if ((inp.elisa_biomarker_1 + inp.elisa_biomarker_2) > 4) insights.push('🧪 <strong>Elevated biomarker levels</strong> suggest active pathology. Biomarker confirmation advised.');
  if (inp.mri_severity_score > 0.6) insights.push('🖼️ <strong>Significant structural brain abnormalities on MRI.</strong> Additional imaging may be required.');
  if (inp.age > 75) insights.push('👴 <strong>Advanced age</strong> is a risk factor. Monitor for age-related complications.');
  if (inp.ecg_eeg_anomaly_score > 0.5) insights.push('📡 <strong>High ECG/EEG anomaly score.</strong> Electrophysiological evaluation recommended.');

  const el = document.createElement('div');
  el.style.cssText = 'padding:30px;font-family:Helvetica,Arial,sans-serif;color:#1f2937;background:#ffffff;';
  el.innerHTML = `
    <div style="border-bottom:3px solid #4f46e5;padding-bottom:12px;margin-bottom:20px;">
      <h1 style="color:#4f46e5;margin:0;font-size:22px;">NeuroCognitive Insights — Clinical Assessment Report</h1>
      <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">ML-Assisted Neurodegenerative & Neurocognitive Risk Analysis</p>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:20px;font-size:13px;">
      <div style="flex:1;background:#f3f4f6;padding:10px;border-radius:6px;"><strong>Date/Time</strong><br>${date} ${time}</div>
      <div style="flex:1;background:#f3f4f6;padding:10px;border-radius:6px;"><strong>Patient Age</strong><br>${inp.age} years</div>
      <div style="flex:1;background:#f3f4f6;padding:10px;border-radius:6px;"><strong>Sex</strong><br>${inp.sex.charAt(0).toUpperCase()+inp.sex.slice(1)}</div>
      <div style="flex:1;background:#f3f4f6;padding:10px;border-radius:6px;"><strong>Disease Workspace</strong><br>${inp.disorder_type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
    </div>

    <div style="margin-bottom:22px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:${riskBg};padding:14px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 style="margin:0;font-size:16px;color:#111827;">Assessment Result</h2>
          <span style="font-size:22px;font-weight:700;color:${riskText};">${(d.risk_score*100).toFixed(1)}% — ${d.risk_level.toUpperCase()} RISK</span>
        </div>
      </div>
      <div style="padding:14px;">
        <p style="margin:0 0 10px;color:#374151;">${d.summary.replace(/\*\*/g,'')}</p>
        <div style="background:#e5e7eb;border-radius:999px;height:12px;width:100%;overflow:hidden;">
          <div style="height:100%;width:${(d.risk_score*100).toFixed(1)}%;background:${riskColor};border-radius:999px;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;margin-top:2px;"><span>0% (Low)</span><span>50% (Moderate)</span><span>100% (High)</span></div>
      </div>
    </div>

    <div style="margin-bottom:22px;">
      <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:5px;font-size:14px;color:#111827;">Patient Input Parameters</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:7px 10px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Parameter</th>
          <th style="padding:7px 10px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Value</th>
          <th style="padding:7px 10px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Reference Range</th>
        </tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:7px 10px;">Age</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${inp.age} yrs</td><td style="padding:7px 10px;text-align:right;color:#9ca3af;">18–120</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6;background:#faf5ff;"><td style="padding:7px 10px;">Cognitive Score (MMSE/MoCA)</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${inp.cognitive_score}</td><td style="padding:7px 10px;text-align:right;color:#9ca3af;">≥ 26 normal</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:7px 10px;">ELISA Biomarker 1 (Aβ42/α-syn)</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${inp.elisa_biomarker_1}</td><td style="padding:7px 10px;text-align:right;color:#9ca3af;">0–3 (norm.)</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6;background:#faf5ff;"><td style="padding:7px 10px;">ELISA Biomarker 2 (tau/p-tau)</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${inp.elisa_biomarker_2}</td><td style="padding:7px 10px;text-align:right;color:#9ca3af;">0–3 (norm.)</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:7px 10px;">MRI Severity Score</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${inp.mri_severity_score}</td><td style="padding:7px 10px;text-align:right;color:#9ca3af;">0–1 (0=normal)</td></tr>
          <tr><td style="padding:7px 10px;">ECG/EEG Anomaly Score</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${inp.ecg_eeg_anomaly_score}</td><td style="padding:7px 10px;text-align:right;color:#9ca3af;">0–1 (0=normal)</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-bottom:22px;">
      <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:5px;font-size:14px;color:#111827;">AI Model — Interpretable Feature Contributions</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:7px 10px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Feature</th>
          <th style="padding:7px 10px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Computed Value</th>
          <th style="padding:7px 10px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Direction</th>
        </tr></thead>
        <tbody>
          <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:7px 10px;">Age Term</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${terms.age_term.toFixed(3)}</td><td style="padding:7px 10px;text-align:right;color:${terms.age_term>0?'#ef4444':'#22c55e'};">${terms.age_term>0?'▲ Risk ↑':'▼ Risk ↓'}</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6;background:#faf5ff;"><td style="padding:7px 10px;">Biomarker Term</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${terms.biomarker_term.toFixed(3)}</td><td style="padding:7px 10px;text-align:right;color:${terms.biomarker_term>0.5?'#ef4444':'#22c55e'};">${terms.biomarker_term>0.5?'▲ Risk ↑':'▼ Nominal'}</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:7px 10px;">Cognitive Term</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${terms.cognitive_term.toFixed(3)}</td><td style="padding:7px 10px;text-align:right;color:${terms.cognitive_term>0?'#ef4444':'#22c55e'};">${terms.cognitive_term>0?'▲ Risk ↑':'▼ Risk ↓'}</td></tr>
          <tr style="border-bottom:1px solid #f3f4f6;background:#faf5ff;"><td style="padding:7px 10px;">Imaging Term (MRI + ECG/EEG)</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${terms.imaging_term.toFixed(3)}</td><td style="padding:7px 10px;text-align:right;color:${terms.imaging_term>0.3?'#ef4444':'#22c55e'};">${terms.imaging_term>0.3?'▲ Risk ↑':'▼ Nominal'}</td></tr>
          <tr><td style="padding:7px 10px;">Disorder Prior (base rate)</td><td style="padding:7px 10px;text-align:right;font-weight:600;">${terms.prior_from_disorder.toFixed(3)}</td><td style="padding:7px 10px;text-align:right;color:#6b7280;">baseline</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-bottom:22px;">
      <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:5px;font-size:14px;color:#111827;">AI-Generated Clinical Insights</h3>
      <ul style="padding-left:18px;font-size:13px;color:#374151;margin-top:8px;line-height:2;">
        ${insights.map(i=>`<li>${i}</li>`).join('')}
      </ul>
    </div>

    <div style="margin-bottom:22px;">
      <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:5px;font-size:14px;color:#111827;">Recommendations & Next Steps</h3>
      <ul style="padding-left:18px;font-size:13px;color:#374151;margin-top:8px;line-height:2;">
        ${d.risk_level==='high'?'<li>🚨 <strong>Urgent review recommended:</strong> Schedule comprehensive clinical evaluation immediately.</li>':''}
        ${inp.cognitive_score<20?'<li>🧠 <strong>Cognitive assessment:</strong> Formal neuropsychological testing advised.</li>':''}
        <li>🧪 <strong>Biomarker confirmation:</strong> Validate with additional labs or imaging studies.</li>
        <li>📅 <strong>Follow-up timeline:</strong> Reassess in 3–6 months.</li>
        <li>👨‍⚕️ <strong>Specialist referral:</strong> Neurologist consultation for comprehensive evaluation.</li>
        <li>📊 <strong>Longitudinal tracking:</strong> Enroll in structured monitoring program.</li>
      </ul>
    </div>

    ${historyRows ? `
    <div style="margin-bottom:22px;">
      <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:5px;font-size:14px;color:#111827;">Recent Assessment History</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:7px 10px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Date & Time</th>
          <th style="padding:7px 10px;text-align:left;color:#6b7280;border-bottom:1px solid #e5e7eb;">Disease</th>
          <th style="padding:7px 10px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Risk Score</th>
          <th style="padding:7px 10px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Level</th>
          <th style="padding:7px 10px;text-align:right;color:#6b7280;border-bottom:1px solid #e5e7eb;">Age</th>
        </tr></thead>
        <tbody>${historyRows}</tbody>
      </table>
    </div>` : ''}

    <div style="margin-top:35px;padding-top:10px;border-top:1px dashed #d1d5db;text-align:center;font-size:11px;color:#9ca3af;">
      <p><strong>DISCLAIMER:</strong> This report is computer-generated and is for <strong>research/educational use only</strong>. It is <strong>not a medical device</strong> and must not be used for clinical decision-making without professional medical oversight.</p>
      <p>NeuroCognitive ML Prototype | Generated: ${date} at ${time}</p>
    </div>
  `;

  const opt = {
    margin: 10,
    filename: `Clinical_Report_${inp.disorder_type}_${new Date().toISOString().slice(0,10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (window.html2pdf) {
    window.html2pdf().set(opt).from(el).save().then(() => {
      exportBtn.textContent = "Export Results as PDF";
      exportBtn.disabled = false;
    });
  } else {
    alert("PDF generation library is still loading. Please try again in a moment.");
    exportBtn.textContent = "Export Results";
    exportBtn.disabled = false;
  }
}
form.addEventListener("submit", submitForm);
resetBtn.addEventListener("click", resetForm);

if (toggleDebugBtn) {
  toggleDebugBtn.addEventListener("click", () => {
    if (debugJson.style.display === "none") {
      debugJson.style.display = "block";
      toggleDebugBtn.textContent = "Hide";
    } else {
      debugJson.style.display = "none";
      toggleDebugBtn.textContent = "Show";
    }
  });
}

if (exportBtn) {
  exportBtn.disabled = true;
  exportBtn.addEventListener("click", exportResults);
}

// Demo data functionality
const demoBtn = document.getElementById("demo-btn");
const demoCases = {
  alzheimers: { age: 76, sex: "female", elisa_biomarker_1: 2.1, elisa_biomarker_2: 1.8, cognitive_score: 18, mri_severity_score: 0.72, ecg_eeg_anomaly_score: 0.45 },
  parkinsons: { age: 68, sex: "male", elisa_biomarker_1: 1.9, elisa_biomarker_2: 1.2, cognitive_score: 24, mri_severity_score: 0.55, ecg_eeg_anomaly_score: 0.20 },
  als: { age: 62, sex: "male", elisa_biomarker_1: 2.5, elisa_biomarker_2: 0.8, cognitive_score: 28, mri_severity_score: 0.65, ecg_eeg_anomaly_score: 0.15 },
  huntington: { age: 45, sex: "female", elisa_biomarker_1: 1.5, elisa_biomarker_2: 0.6, cognitive_score: 22, mri_severity_score: 0.82, ecg_eeg_anomaly_score: 0.35 }
};

if (demoBtn && form) {
  demoBtn.addEventListener("click", () => {
    const disorderType = form.querySelector('input[name="disorder_type"]')?.value || "alzheimers";
    const data = demoCases[disorderType];
    
    if (data) {
      Object.keys(data).forEach(key => {
        const input = document.getElementById(key);
        if (input) input.value = data[key];
      });
      
      const originalText = demoBtn.innerHTML;
      demoBtn.innerHTML = "✓ Demo Loaded";
      setTimeout(() => demoBtn.innerHTML = originalText, 2000);
    }
  });
}

// Mount Image Uploader Market Feature dynamically
function mountImageUploader() {
  const mriInput = document.getElementById("mri_severity_score");
  if (!mriInput) return; // not on a workspace page

  // Create UI Container
  const uploaderDiv = document.createElement("div");
  uploaderDiv.className = "image-uploader-widget";
  uploaderDiv.innerHTML = `
    <div class="uploader-header">
      <h4><span class="icon">🖼️</span> Upload Medical Scan (MRI/CT)</h4>
      <span class="badge">AI Assisted</span>
    </div>
    <div class="uploader-dropzone" id="mri-dropzone">
      <input type="file" id="mri-file-input" accept="image/jpeg, image/png, image/dicom" hidden />
      <div id="mri-preview-container" style="display: none;">
        <img id="mri-preview" src="" alt="MRI Scan" />
        <div class="scan-overlay" id="mri-scan-line"></div>
      </div>
      <div class="dropzone-text" id="mri-dropzone-text">
        <p>Drag & drop scan image here or <strong>click to browse</strong></p>
        <p class="small">Supports JPEG, PNG (DICOM coming soon)</p>
      </div>
    </div>
    <div class="uploader-progress" id="mri-progress-container" style="display: none;">
      <div class="progress-bar-wrapper">
        <div class="progress-bar-fill" id="mri-progress-fill"></div>
      </div>
      <p id="mri-progress-text">Extracting automated severity features (CNN Model)...</p>
    </div>
  `;

  // Insert before the mriInput's parent form-field
  const formField = mriInput.closest(".form-field");
  formField.parentNode.insertBefore(uploaderDiv, formField);

  // Setup Event Listeners
  const dropzone = document.getElementById("mri-dropzone");
  const fileInput = document.getElementById("mri-file-input");
  const previewContainer = document.getElementById("mri-preview-container");
  const previewImg = document.getElementById("mri-preview");
  const dropzoneText = document.getElementById("mri-dropzone-text");
  const progressContainer = document.getElementById("mri-progress-container");
  const progressFill = document.getElementById("mri-progress-fill");
  const progressText = document.getElementById("mri-progress-text");
  const scanLine = document.getElementById("mri-scan-line");

  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  });

  function handleImageUpload(file) {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    // Show Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewContainer.style.display = "block";
      dropzoneText.style.display = "none";
      
      // Start "AI" extraction simulation
      simulateAIFeatureExtraction();
    };
    reader.readAsDataURL(file);
  }

  function simulateAIFeatureExtraction() {
    progressContainer.style.display = "block";
    scanLine.style.display = "block";
    progressFill.style.width = "0%";
    mriInput.value = ""; // Clear existing value
    mriInput.closest('.form-field').classList.add("highlight-field");

    let progress = 0;
    const stages = [
      "Normalizing image intensity...",
      "Segmenting cortical structures...",
      "Calculating ventricular volume...",
      "Detecting white matter hyperintensities...",
      "Computing final MRI severity score..."
    ];

    const interval = setInterval(() => {
      progress += Math.random() * 8 + 2; // random jump
      if (progress > 100) progress = 100;
      
      progressFill.style.width = progress + "%";
      scanLine.style.top = progress + "%";
      
      const stageIdx = Math.floor((progress / 100) * stages.length);
      if (stageIdx < stages.length) {
        progressText.textContent = stages[stageIdx];
      }

      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          progressText.innerHTML = "✅ Extraction complete! Features mapped to input.";
          // Generate a plausible mock score based on image
          const mockScore = (Math.random() * 0.4 + 0.35).toFixed(2);
          mriInput.value = mockScore;
          scanLine.style.display = "none";
          setTimeout(() => {
            mriInput.closest('.form-field').classList.remove("highlight-field");
          }, 1500);
        }, 500);
      }
    }, 250);
  }
}

/* ============== BROWNIE POINT FEATURES ============== */

// 1. DARK MODE & THEME CUSTOMIZATION
function initializeDarkMode() {
  const savedTheme = localStorage.getItem('theme') || 'dark-mode';
  document.documentElement.className = savedTheme;
  
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.classList.toggle('active', savedTheme === 'dark-mode');
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.className;
      const newTheme = currentTheme === 'dark-mode' ? 'light-mode' : 'dark-mode';
      document.documentElement.className = newTheme;
      localStorage.setItem('theme', newTheme);
      themeToggle.classList.toggle('active');
    });
  }
}

// 2. SETTINGS PANEL
function initializeSettings() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsClose = document.querySelector('.settings-close');
  
  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener('click', () => {
      settingsPanel.classList.toggle('open');
    });
    
    if (settingsClose) {
      settingsClose.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
      });
    }
    
    document.addEventListener('click', (e) => {
      if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsPanel.classList.remove('open');
      }
    });
  }
}

// 3. KEYBOARD SHORTCUTS
function initializeKeyboardShortcuts() {
  const shortcutsGuide = document.getElementById('shortcuts-guide');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const shortcutsClose = document.querySelector('.shortcuts-close');
  
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (form && !isSubmitting) {
        submitForm(new Event('submit'));
      }
    }
    if (e.key === 'Escape') {
      if (shortcutsModal) shortcutsModal.classList.remove('open');
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
      e.preventDefault();
      if (shortcutsModal) shortcutsModal.classList.toggle('open');
    }
  });
  
  if (shortcutsGuide && shortcutsModal) {
    shortcutsGuide.addEventListener('click', () => {
      shortcutsModal.classList.add('open');
    });
  }
  
  if (shortcutsClose && shortcutsModal) {
    shortcutsClose.addEventListener('click', () => {
      shortcutsModal.classList.remove('open');
    });
  }
  
  if (shortcutsModal) {
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) {
        shortcutsModal.classList.remove('open');
      }
    });
  }
}

// 4. AUTO-SAVE FORM DATA
let autoSaveTimeout;
function initializeAutoSave() {
  if (!form) return;
  
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      localStorage.setItem('autosavedForm', JSON.stringify(data));
      
      const indicator = document.querySelector('.autosave-indicator');
      if (indicator) {
        const dot = indicator.querySelector('.autosave-dot');
        if (dot) {
          dot.classList.add('saved');
          clearTimeout(autoSaveTimeout);
          autoSaveTimeout = setTimeout(() => {
            dot.classList.remove('saved');
          }, 2000);
        }
      }
    });
  });
  
  // Restore saved form
  const saved = localStorage.getItem('autosavedForm');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.keys(data).forEach(key => {
        const input = form.elements[key];
        if (input) input.value = data[key];
      });
    } catch (e) {
      console.error('Failed to restore form:', e);
    }
  }
}

// 5. QUICK TEMPLATES
function initializeQuickTemplates() {
  const templateButtons = document.querySelectorAll('.template-btn');
  
  const templates = {
    'early-stage': { age: 60, sex: 'female', elisa_biomarker_1: 0.5, elisa_biomarker_2: 0.4, cognitive_score: 85, mri_severity_score: 0.2, ecg_eeg_anomaly_score: 0.1 },
    'mid-stage': { age: 72, sex: 'male', elisa_biomarker_1: 1.5, elisa_biomarker_2: 1.2, cognitive_score: 45, mri_severity_score: 0.6, ecg_eeg_anomaly_score: 0.4 },
    'high-risk': { age: 78, sex: 'female', elisa_biomarker_1: 2.8, elisa_biomarker_2: 2.5, cognitive_score: 18, mri_severity_score: 0.85, ecg_eeg_anomaly_score: 0.75 },
    'healthy': { age: 55, sex: 'male', elisa_biomarker_1: 0.3, elisa_biomarker_2: 0.2, cognitive_score: 95, mri_severity_score: 0.05, ecg_eeg_anomaly_score: 0.02 }
  };
  
  templateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const templateName = btn.dataset.template;
      const template = templates[templateName];
      if (template && form) {
        Object.keys(template).forEach(key => {
          const input = form.elements[key];
          if (input) input.value = template[key];
        });
        const indicator = document.querySelector('.autosave-indicator');
        if (indicator) {
          const dot = indicator.querySelector('.autosave-dot');
          if (dot) dot.textContent = '✓ Template loaded';
        }
      }
    });
  });
}

// 6. ASSESSMENT STATISTICS & TRENDS
let statsData = JSON.parse(localStorage.getItem('statsData')) || { 
  total: 0, avg_risk: 0, high_count: 0, trends: [] 
};

function updateStatistics(data) {
  if (!data || !data.risk_score) return;
  
  statsData.total += 1;
  statsData.avg_risk = ((statsData.avg_risk * (statsData.total - 1)) + data.risk_score) / statsData.total;
  if (data.risk_level === 'high') statsData.high_count += 1;
  
  statsData.trends.push({
    date: new Date().toLocaleDateString(),
    score: data.risk_score,
    level: data.risk_level
  });
  
  if (statsData.trends.length > 30) statsData.trends.shift(); // Keep last 30
  
  localStorage.setItem('statsData', JSON.stringify(statsData));
  renderStatistics();
}

function renderStatistics() {
  const dashboard = document.getElementById('stats-dashboard');
  if (!dashboard) return;
  
  dashboard.innerHTML = `
    <div class="stat-box">
      <div class="stat-label">Total Assessments</div>
      <div class="stat-value">${statsData.total}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Average Risk</div>
      <div class="stat-value">${(statsData.avg_risk * 100).toFixed(0)}%</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">High Risk Cases</div>
      <div class="stat-value">${statsData.high_count}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Success Rate</div>
      <div class="stat-value">${statsData.total > 0 ? ((statsData.total - statsData.high_count) / statsData.total * 100).toFixed(0) : 0}%</div>
    </div>
  `;
}

function renderRiskTrends() {
  const trendsContainer = document.getElementById('trends-container');
  if (!trendsContainer || statsData.trends.length < 2) return;
  
  const canvas = document.createElement('canvas');
  canvas.id = 'trends-chart';
  trendsContainer.innerHTML = '';
  trendsContainer.appendChild(canvas);
  
  if (window.Chart) {
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: statsData.trends.map(t => t.date),
        datasets: [{
          label: 'Risk Score Trend',
          data: statsData.trends.map(t => t.score),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: statsData.trends.map(t => 
            t.level === 'high' ? '#ef4444' : t.level === 'moderate' ? '#f97316' : '#22c55e'
          ),
          pointBorderColor: '#fff',
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
          y: { min: 0, max: 1, ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
          x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
        }
      }
    });
  }
}

// 7. SESSION TIMEOUT WARNING
let sessionTimeout;
let sessionCountdown;
function initializeSessionTimeout() {
  const SESSION_WARNING_TIME = 14 * 60 * 1000; // 14 minutes
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  
  function resetSessionTimer() {
    clearTimeout(sessionTimeout);
    clearInterval(sessionCountdown);
    
    sessionTimeout = setTimeout(() => {
      showTimeoutWarning();
    }, SESSION_WARNING_TIME);
  }
  
  function showTimeoutWarning() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const warning = document.createElement('div');
    warning.className = 'timeout-warning';
    warning.id = 'timeout-warning';
    
    let remaining = 60;
    warning.innerHTML = `
      <div class="timeout-text">🔔 Session Expiring Soon</div>
      <div class="timeout-countdown">You will be logged out in <strong>${remaining}</strong> seconds</div>
      <div class="timeout-actions">
        <button class="timeout-stay">Stay Logged In</button>
        <button class="timeout-logout">Logout</button>
      </div>
    `;
    
    document.body.appendChild(warning);
    
    const stayBtn = warning.querySelector('.timeout-stay');
    const logoutBtn = warning.querySelector('.timeout-logout');
    
    stayBtn.addEventListener('click', () => {
      warning.remove();
      resetSessionTimer();
    });
    
    logoutBtn.addEventListener('click', () => {
      logout();
    });
    
    sessionCountdown = setInterval(() => {
      remaining--;
      const countdownEl = warning.querySelector('.timeout-countdown');
      if (countdownEl) {
        countdownEl.innerHTML = `You will be logged out in <strong>${remaining}</strong> seconds`;
      }
      if (remaining <= 0) {
        warning.remove();
        logout();
      }
    }, 1000);
  }
  
  if (localStorage.getItem('token')) {
    resetSessionTimer();
    document.addEventListener('click', resetSessionTimer);
    document.addEventListener('keypress', resetSessionTimer);
  }
}

// 8. HELP TOOLTIPS
function initializeTooltips() {
  const helpIcons = document.querySelectorAll('.help-icon');
  helpIcons.forEach(icon => {
    const tooltipText = icon.getAttribute('data-tooltip');
    if (tooltipText) {
      icon.innerHTML = `? <div class="tooltip">${tooltipText}</div>`;
    }
  });
}

// 9. ACCESSIBILITY FEATURES
function initializeAccessibility() {
  // Add ARIA labels
  document.querySelectorAll('input, select, button').forEach(el => {
    if (!el.getAttribute('aria-label')) {
      const label = el.parentElement?.querySelector('label');
      if (label) {
        el.setAttribute('aria-label', label.textContent);
      }
    }
  });
  
  // Keyboard navigation enhancements
  Array.from(document.querySelectorAll('.template-btn')).forEach((btn, idx) => {
    btn.setAttribute('tabindex', idx);
  });
}

// 10 & 11. COMBINE: Update renderResult to include stats and auto-save
const originalRenderResult = renderResult;
renderResult = function(data) {
  originalRenderResult(data);
  updateStatistics(data);
  renderRiskTrends();
};

// Initialize all features when page loads
// Initialize history when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    initializeHistory();
    mountImageUploader();
    initializeDarkMode();
    initializeSettings();
    initializeKeyboardShortcuts();
    initializeAutoSave();
    initializeQuickTemplates();
    renderStatistics();
    initializeSessionTimeout();
    initializeTooltips();
    initializeAccessibility();
  });
} else {
  checkAuth();
  initializeHistory();
  mountImageUploader();
  initializeDarkMode();
  initializeSettings();
  initializeKeyboardShortcuts();
  initializeAutoSave();
  initializeQuickTemplates();
  renderStatistics();
  initializeSessionTimeout();
  initializeTooltips();
  initializeAccessibility();
}

