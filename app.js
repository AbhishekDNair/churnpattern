// State Management
let appState = {
  allCustomers: [],
  filteredCustomers: [],
  currentPage: 1,
  pageSize: 10,
  sortBy: 'customerId',
  sortOrder: 'asc', // 'asc' or 'desc'
  selectedCustomer: null
};

// Chart references
let charts = {
  monthlyTrend: null,
  riskDist: null,
  contract: null,
  chargesDist: null
};

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Generate scaled mock dataset (2500 customers)
  appState.allCustomers = generateChurnData(2500);
  appState.filteredCustomers = [...appState.allCustomers];

  // Initialize Lucide Icons
  lucide.createIcons();

  // Setup Event Listeners
  setupEventListeners();

  // Initial Render
  updateDashboard();
});

function setupEventListeners() {
  // Filters
  const filters = ['filter-churn', 'filter-contract', 'filter-internet', 'filter-payment'];
  filters.forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      appState.currentPage = 1;
      applyFilters();
    });
  });

  // Range inputs
  const ticketsRange = document.getElementById('filter-tickets');
  const ticketsVal = document.getElementById('tickets-val');
  ticketsRange.addEventListener('input', (e) => {
    ticketsVal.textContent = e.target.value;
    appState.currentPage = 1;
    applyFilters();
  });

  const tenureRange = document.getElementById('filter-tenure');
  const tenureVal = document.getElementById('tenure-val');
  tenureRange.addEventListener('input', (e) => {
    tenureVal.textContent = `${e.target.value} mo`;
    appState.currentPage = 1;
    applyFilters();
  });

  // Search
  document.getElementById('search-customer').addEventListener('input', () => {
    appState.currentPage = 1;
    applyFilters();
  });

  // Reset Filters
  document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);

  // Table Sorting
  const headers = [
    { id: 'th-id', field: 'customerId' },
    { id: 'th-name', field: 'name' },
    { id: 'th-tenure', field: 'tenure' },
    { id: 'th-contract', field: 'contract' },
    { id: 'th-charges', field: 'monthlyCharges' },
    { id: 'th-status', field: 'churnStatus' }
  ];

  headers.forEach(h => {
    const el = document.getElementById(h.id);
    if (el) {
      el.addEventListener('click', () => {
        if (appState.sortBy === h.field) {
          appState.sortOrder = appState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          appState.sortBy = h.field;
          appState.sortOrder = 'asc';
        }
        
        // Update header sort icons
        headers.forEach(h2 => {
          const el2 = document.getElementById(h2.id);
          if (el2) {
            const icon = el2.querySelector('i');
            if (icon) icon.remove();
          }
        });

        const currentHeader = document.getElementById(h.id);
        const iconName = appState.sortOrder === 'asc' ? 'chevron-up' : 'chevron-down';
        currentHeader.insertAdjacentHTML('beforeend', ` <i data-lucide="${iconName}" style="display:inline-block; width:12px; vertical-align:middle;"></i>`);
        lucide.createIcons();

        renderTable();
      });
    }
  });

  // Pagination
  document.getElementById('btn-prev-page').addEventListener('click', () => {
    if (appState.currentPage > 1) {
      appState.currentPage--;
      renderTable();
    }
  });

  document.getElementById('btn-next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(appState.filteredCustomers.length / appState.pageSize);
    if (appState.currentPage < totalPages) {
      appState.currentPage++;
      renderTable();
    }
  });

  // Drawer Close
  document.getElementById('btn-close-drawer').addEventListener('click', closeDrawer);
  document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);
}

function applyFilters() {
  const churn = document.getElementById('filter-churn').value;
  const contract = document.getElementById('filter-contract').value;
  const internet = document.getElementById('filter-internet').value;
  const payment = document.getElementById('filter-payment').value;
  const maxTickets = parseInt(document.getElementById('filter-tickets').value);
  const minTenure = parseInt(document.getElementById('filter-tenure').value);
  const search = document.getElementById('search-customer').value.toLowerCase().trim();

  appState.filteredCustomers = appState.allCustomers.filter(cust => {
    if (churn !== 'all' && cust.churnStatus !== churn) return false;
    if (contract !== 'all' && cust.contract !== contract) return false;
    if (internet !== 'all' && cust.internetService !== internet) return false;
    if (payment !== 'all' && cust.paymentMethod !== payment) return false;
    if (cust.supportTickets > maxTickets) return false;
    if (cust.tenure < minTenure) return false;
    
    if (search) {
      const matchName = cust.name.toLowerCase().includes(search);
      const matchEmail = cust.email.toLowerCase().includes(search);
      const matchId = cust.customerId.toLowerCase().includes(search);
      if (!matchName && !matchEmail && !matchId) return false;
    }

    return true;
  });

  updateDashboard();
}

function resetFilters() {
  document.getElementById('filter-churn').value = 'all';
  document.getElementById('filter-contract').value = 'all';
  document.getElementById('filter-internet').value = 'all';
  document.getElementById('filter-payment').value = 'all';
  
  document.getElementById('filter-tickets').value = 8;
  document.getElementById('tickets-val').textContent = '8';
  
  document.getElementById('filter-tenure').value = 1;
  document.getElementById('tenure-val').textContent = '1 mo';
  
  document.getElementById('search-customer').value = '';

  appState.currentPage = 1;
  appState.filteredCustomers = [...appState.allCustomers];
  updateDashboard();
}

function updateDashboard() {
  renderKPIs();
  renderForecastAndDrivers();
  renderRecommendations();
  renderHighRiskTable();
  renderTable();
  renderCharts();
}

function renderKPIs() {
  const count = appState.filteredCustomers.length;
  const churned = appState.filteredCustomers.filter(c => c.churnStatus === 'Yes');
  const churnCount = churned.length;
  
  const churnRate = count > 0 ? ((churnCount / count) * 100).toFixed(1) : "0.0";
  const revenueAtRisk = churned.reduce((acc, c) => acc + c.monthlyCharges, 0);
  const avgTenure = count > 0 ? (appState.filteredCustomers.reduce((acc, c) => acc + c.tenure, 0) / count).toFixed(1) : 0;

  document.getElementById('kpi-churn-rate').textContent = `${churnRate}%`;
  document.getElementById('kpi-total-cust').textContent = count.toLocaleString();
  document.getElementById('kpi-lost-rev').textContent = `$${Math.round(revenueAtRisk).toLocaleString()}`;
  document.getElementById('kpi-avg-tenure').textContent = `${avgTenure} mo`;

  // Render dynamic trends relative to overall base metrics
  renderTrendIndicators(churnRate, count, revenueAtRisk, avgTenure);
}

function renderTrendIndicators(currChurn, currCount, currRev, currTenure) {
  // Overall baseline values for mathematical trend comparisons
  const baseChurn = 18.6;
  const baseCount = 2500;
  const baseRev = 29500;
  const baseTenure = 32.4;

  const churnTrendEl = document.getElementById('kpi-churn-trend');
  const custTrendEl = document.getElementById('kpi-cust-trend');
  const revTrendEl = document.getElementById('kpi-rev-trend');
  const tenureTrendEl = document.getElementById('kpi-tenure-trend');

  // Churn Rate Trend (Down is good/positive)
  const churnDiff = (currChurn - baseChurn).toFixed(1);
  if (parseFloat(churnDiff) <= 0) {
    churnTrendEl.className = "kpi-trend trend-positive";
    churnTrendEl.innerHTML = `↓ ${Math.abs(churnDiff)}% <span class="trend-period">vs baseline</span>`;
  } else {
    churnTrendEl.className = "kpi-trend trend-negative";
    churnTrendEl.innerHTML = `↑ ${churnDiff}% <span class="trend-period">vs baseline</span>`;
  }

  // Total Customers Trend (Up is positive)
  const custPct = (((currCount - baseCount) / baseCount) * 100).toFixed(1);
  if (parseFloat(custPct) >= 0) {
    custTrendEl.className = "kpi-trend trend-positive";
    custTrendEl.innerHTML = `↑ ${custPct}% <span class="trend-period">vs baseline</span>`;
  } else {
    custTrendEl.className = "kpi-trend trend-negative";
    custTrendEl.innerHTML = `↓ ${Math.abs(custPct)}% <span class="trend-period">vs baseline</span>`;
  }

  // Revenue Trend (Down is positive)
  const revPct = (((currRev - baseRev) / baseRev) * 100).toFixed(1);
  if (parseFloat(revPct) <= 0) {
    revTrendEl.className = "kpi-trend trend-positive";
    revTrendEl.innerHTML = `↓ ${Math.abs(revPct)}% <span class="trend-period">vs baseline</span>`;
  } else {
    revTrendEl.className = "kpi-trend trend-negative";
    revTrendEl.innerHTML = `↑ ${revPct}% <span class="trend-period">vs baseline</span>`;
  }

  // Tenure Trend (Up is positive)
  const tenureDiff = (currTenure - baseTenure).toFixed(1);
  if (parseFloat(tenureDiff) >= 0) {
    tenureTrendEl.className = "kpi-trend trend-positive";
    tenureTrendEl.innerHTML = `↑ ${tenureDiff} mo <span class="trend-period">vs baseline</span>`;
  } else {
    tenureTrendEl.className = "kpi-trend trend-negative";
    tenureTrendEl.innerHTML = `↓ ${Math.abs(tenureDiff)} mo <span class="trend-period">vs baseline</span>`;
  }
}

function renderForecastAndDrivers() {
  const activeRetained = appState.filteredCustomers.filter(c => c.churnStatus === 'No');
  
  // Predict churns based on expected value: sum of probabilities
  const expectedChurnsCount = activeRetained.reduce((acc, c) => acc + c.churnProbability, 0);
  const expectedLostMRR = activeRetained.reduce((acc, c) => acc + (c.churnProbability * c.monthlyCharges), 0);

  document.getElementById('forecast-value').textContent = `${Math.round(expectedChurnsCount)} Customers`;
  document.getElementById('forecast-mrr').textContent = `MRR at risk: $${Math.round(expectedLostMRR).toLocaleString()}`;

  // Analyze Churn Drivers (from filtered churned customers)
  const activeChurned = appState.filteredCustomers.filter(c => c.churnStatus === 'Yes');
  const totalChurned = activeChurned.length;

  let monthToMonthCount = 0;
  let highTicketsCount = 0; // >= 2 tickets
  let fiberOpticCount = 0;
  let elecCheckCount = 0;

  activeChurned.forEach(c => {
    if (c.contract === 'Month-to-month') monthToMonthCount++;
    if (c.supportTickets >= 2) highTicketsCount++;
    if (c.internetService === 'Fiber optic') fiberOpticCount++;
    if (c.paymentMethod === 'Electronic check') elecCheckCount++;
  });

  const drivers = [
    { name: 'Month-to-month Contract', pct: totalChurned > 0 ? Math.round((monthToMonthCount / totalChurned) * 100) : 0 },
    { name: 'Multiple Support Tickets (≥2)', pct: totalChurned > 0 ? Math.round((highTicketsCount / totalChurned) * 100) : 0 },
    { name: 'Fiber Optic Service Type', pct: totalChurned > 0 ? Math.round((fiberOpticCount / totalChurned) * 100) : 0 },
    { name: 'Electronic Check Billing', pct: totalChurned > 0 ? Math.round((elecCheckCount / totalChurned) * 100) : 0 }
  ];

  // Sort drivers descending
  drivers.sort((a, b) => b.pct - a.pct);

  const driversList = document.getElementById('drivers-list');
  driversList.innerHTML = '';
  
  drivers.forEach(d => {
    driversList.innerHTML += `
      <div class="driver-item">
        <div class="driver-info">
          <span class="driver-name">${d.name}</span>
          <span class="driver-value">${d.pct}% correlation</span>
        </div>
        <div class="driver-bar-bg">
          <div class="driver-bar-fill" style="width: ${d.pct}%;"></div>
        </div>
      </div>
    `;
  });
}

function renderRecommendations() {
  const list = document.getElementById('recommendations-list');
  list.innerHTML = '';

  const activeChurned = appState.filteredCustomers.filter(c => c.churnStatus === 'Yes');
  const totalChurned = activeChurned.length;

  let m2mCount = 0, ticketCount = 0, fiberCount = 0, checkCount = 0;
  activeChurned.forEach(c => {
    if (c.contract === 'Month-to-month') m2mCount++;
    if (c.supportTickets >= 2) ticketCount++;
    if (c.internetService === 'Fiber optic') fiberCount++;
    if (c.paymentMethod === 'Electronic check') checkCount++;
  });

  // Dynamic content logic based on top active drivers
  let recs = [];
  if (m2mCount >= totalChurned * 0.4 && totalChurned > 0) {
    recs.push({
      title: "Contract Upgrade Campaign",
      desc: "Target Month-to-month contracts. Offer $15/mo discount for moving to 1-Year plans.",
      type: "rec-danger",
      icon: "arrow-up-circle"
    });
  }
  if (ticketCount >= totalChurned * 0.4 && totalChurned > 0) {
    recs.push({
      title: "VIP Support Intervention",
      desc: "Assign dedicated Service Managers to high-risk customers with 2+ tickets.",
      type: "rec-warning",
      icon: "phone"
    });
  }
  if (fiberCount >= totalChurned * 0.3 && totalChurned > 0) {
    recs.push({
      title: "Fiber Optic Quality Audit",
      desc: "Initiate proactive connection audits for Fiber customers reporting slow speeds.",
      type: "rec-warning",
      icon: "activity"
    });
  }
  if (checkCount >= totalChurned * 0.3 && totalChurned > 0) {
    recs.push({
      title: "Auto-Pay Migration Incentive",
      desc: "Offer a $10 invoice credit for migrating Electronic Check users to Auto-Credit Card billing.",
      type: "rec-primary",
      icon: "credit-card"
    });
  }

  // Fallbacks if no churned data
  if (recs.length === 0) {
    recs = [
      {
        title: "Standard Customer Retention",
        desc: "Regular quarterly follow-ups with all clients whose tenure is under 6 months.",
        type: "rec-primary",
        icon: "shield"
      },
      {
        title: "Loyalty Bonus Program",
        desc: "Reward 24+ months tenure customers with device upgrade priority vouchers.",
        type: "rec-primary",
        icon: "gift"
      }
    ];
  }

  recs.forEach(r => {
    list.innerHTML += `
      <div class="recommendation-item">
        <div class="rec-icon ${r.type}">
          <i data-lucide="${r.icon}" style="width:16px; height:16px;"></i>
        </div>
        <div class="rec-details">
          <span class="rec-title">${r.title}</span>
          <span class="rec-desc">${r.desc}</span>
        </div>
      </div>
    `;
  });

  lucide.createIcons();
}

function renderHighRiskTable() {
  // High Risk = active customers (retained) sorted by riskScore descending
  const activeRetained = appState.filteredCustomers.filter(c => c.churnStatus === 'No');
  activeRetained.sort((a, b) => b.riskScore - a.riskScore);

  const topHighRisk = activeRetained.slice(0, 5);
  const tbody = document.getElementById('high-risk-table-body');
  tbody.innerHTML = '';

  document.getElementById('high-risk-count-badge').textContent = `${activeRetained.filter(c => c.riskScore >= 70).length} High Risk`;

  if (topHighRisk.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 16px 0;">No active customers under current filters.</td></tr>`;
    return;
  }

  topHighRisk.forEach(cust => {
    const row = document.createElement('tr');
    
    // Choose progress bar color class based on score
    let colorClass = 'risk-low';
    if (cust.riskScore >= 70) colorClass = 'risk-high';
    else if (cust.riskScore >= 35) colorClass = 'risk-medium';

    row.innerHTML = `
      <td style="font-weight:600; color: var(--text-bright);">${cust.name}</td>
      <td>
        <div class="risk-progress-bg">
          <div class="risk-progress-fill ${colorClass}" style="width: ${cust.riskScore}%;"></div>
        </div>
        <span>${cust.riskScore}</span>
      </td>
      <td>${cust.tenure} mo</td>
      <td>$${cust.monthlyCharges.toFixed(0)}</td>
      <td style="font-weight: 500;">${Math.round(cust.churnProbability * 100)}%</td>
    `;

    row.addEventListener('click', () => openDrawer(cust));
    tbody.appendChild(row);
  });
}

function renderTable() {
  // Sort main customer data
  const sorted = [...appState.filteredCustomers].sort((a, b) => {
    let valA = a[appState.sortBy];
    let valB = b[appState.sortBy];

    if (typeof valA === 'string') {
      return appState.sortOrder === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    } else {
      return appState.sortOrder === 'asc' 
        ? valA - valB 
        : valB - valA;
    }
  });

  const totalRecords = sorted.length;
  const totalPages = Math.ceil(totalRecords / appState.pageSize) || 1;
  if (appState.currentPage > totalPages) appState.currentPage = totalPages;

  const startIndex = (appState.currentPage - 1) * appState.pageSize;
  const endIndex = Math.min(startIndex + appState.pageSize, totalRecords);
  
  const pageData = sorted.slice(startIndex, endIndex);
  const tbody = document.getElementById('customer-table-body');
  tbody.innerHTML = '';

  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px 0;">No matching customers found.</td></tr>`;
    document.getElementById('pagination-info').textContent = `Showing 0 to 0 of 0 entries`;
    document.getElementById('btn-prev-page').disabled = true;
    document.getElementById('btn-next-page').disabled = true;
    return;
  }

  pageData.forEach(cust => {
    const row = document.createElement('tr');
    const badgeClass = cust.churnStatus === 'Yes' ? 'badge-churned' : 'badge-retained';
    const badgeText = cust.churnStatus === 'Yes' ? 'Churned' : 'Retained';
    
    row.innerHTML = `
      <td style="font-weight: 600; color: var(--primary);">${cust.customerId}</td>
      <td>${cust.name}</td>
      <td>${cust.tenure} months</td>
      <td>${cust.contract}</td>
      <td>$${cust.monthlyCharges.toFixed(2)}</td>
      <td><span class="badge ${badgeClass}">${badgeText}</span></td>
    `;
    
    row.addEventListener('click', () => openDrawer(cust));
    tbody.appendChild(row);
  });

  document.getElementById('pagination-info').textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords} entries`;
  document.getElementById('btn-prev-page').disabled = appState.currentPage === 1;
  document.getElementById('btn-next-page').disabled = appState.currentPage === totalPages;
}

// Drawer Controller
function openDrawer(cust) {
  appState.selectedCustomer = cust;
  document.getElementById('drawer-cust-name').textContent = cust.name;
  
  const drawerContent = document.getElementById('drawer-content');
  const churnReasonSection = cust.churnStatus === 'Yes' ? `
    <div class="churn-reason-box">
      <div class="churn-reason-title">Churn Reason (${cust.churnCategory})</div>
      <div class="churn-reason-desc">"${cust.churnReason}"</div>
    </div>
  ` : `
    <div class="churn-reason-box" style="background-color: var(--primary-glow); border-color: var(--primary);">
      <div class="churn-reason-title" style="color: var(--primary);">Risk Assessment Analysis</div>
      <div class="churn-reason-desc" style="color: var(--text-bright);">Calculated Churn Risk: <b>${cust.riskScore}/100</b>. Recommendations: Proactive retention checkup.</div>
    </div>
  `;

  drawerContent.innerHTML = `
    <div class="detail-section">
      <h4>Basic Demographics</h4>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${cust.email}</span></div>
      <div class="detail-row"><span class="detail-label">Gender</span><span class="detail-value">${cust.gender}</span></div>
      <div class="detail-row"><span class="detail-label">Senior Citizen</span><span class="detail-value">${cust.isSenior}</span></div>
    </div>
    
    <div class="detail-section">
      <h4>Subscription & Contract</h4>
      <div class="detail-row"><span class="detail-label">Contract Type</span><span class="detail-value">${cust.contract}</span></div>
      <div class="detail-row"><span class="detail-label">Internet Service</span><span class="detail-value">${cust.internetService}</span></div>
      <div class="detail-row"><span class="detail-label">Payment Method</span><span class="detail-value">${cust.paymentMethod}</span></div>
      <div class="detail-row"><span class="detail-label">Tenure</span><span class="detail-value">${cust.tenure} months</span></div>
    </div>

    <div class="detail-section">
      <h4>Financial Metrics</h4>
      <div class="detail-row"><span class="detail-label">Monthly Charges</span><span class="detail-value" style="color: var(--warning); font-size: 1.05rem;">$${cust.monthlyCharges.toFixed(2)}</span></div>
      <div class="detail-row"><span class="detail-label">Total Revenue Paid</span><span class="detail-value" style="color: var(--success); font-size: 1.05rem;">$${cust.totalCharges.toFixed(2)}</span></div>
    </div>

    <div class="detail-section">
      <h4>Customer Support History</h4>
      <div class="detail-row"><span class="detail-label">Support Tickets Raised</span><span class="detail-value">${cust.supportTickets} tickets</span></div>
    </div>

    ${churnReasonSection}
  `;

  document.getElementById('drawer').classList.add('active');
  document.getElementById('drawer-overlay').classList.add('active');
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('active');
  document.getElementById('drawer-overlay').classList.remove('active');
  appState.selectedCustomer = null;
}

// Chart.js Visualizations
function renderCharts() {
  const data = appState.filteredCustomers;

  // Chart 1: Monthly Churn Trend (Line Chart - Churned only)
  const churnedData = data.filter(c => c.churnStatus === 'Yes');
  const monthlyStats = Array(12).fill(0);
  churnedData.forEach(c => {
    if (c.churnMonth && c.churnMonth >= 1 && c.churnMonth <= 12) {
      monthlyStats[c.churnMonth - 1]++;
    }
  });

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (charts.monthlyTrend) {
    charts.monthlyTrend.data.datasets[0].data = monthlyStats;
    charts.monthlyTrend.update();
  } else {
    const ctx = document.getElementById('chart-monthly-trend').getContext('2d');
    charts.monthlyTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Customer Churns',
          data: monthlyStats,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#f43f5e'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8b8ea8' } },
          y: { grid: { color: '#242436' }, ticks: { color: '#8b8ea8' }, min: 0 }
        }
      }
    });
  }

  // Chart 2: Customer Risk Score Distribution (Donut - Low, Med, High)
  let lowRisk = 0, medRisk = 0, highRisk = 0;
  data.forEach(c => {
    if (c.riskScore < 30) lowRisk++;
    else if (c.riskScore < 70) medRisk++;
    else highRisk++;
  });

  const riskLabels = ['Low Risk (<30)', 'Medium Risk (30-69)', 'High Risk (≥70)'];
  const riskData = [lowRisk, medRisk, highRisk];

  if (charts.riskDist) {
    charts.riskDist.data.datasets[0].data = riskData;
    charts.riskDist.update();
  } else {
    const ctx = document.getElementById('chart-risk-dist').getContext('2d');
    charts.riskDist = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: riskLabels,
        datasets: [{
          data: riskData,
          backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
          borderWidth: 2,
          borderColor: '#181825'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#8b8ea8', font: { family: 'Plus Jakarta Sans' } } }
        },
        cutout: '65%'
      }
    });
  }

  // Chart 3: Contract Type (Grouped Bar - Retained vs Churned)
  const contractStats = {
    "Month-to-month": { retained: 0, churned: 0 },
    "One year": { retained: 0, churned: 0 },
    "Two year": { retained: 0, churned: 0 }
  };
  data.forEach(c => {
    if (contractStats[c.contract]) {
      if (c.churnStatus === 'Yes') contractStats[c.contract].churned++;
      else contractStats[c.contract].retained++;
    }
  });

  const contractLabels = Object.keys(contractStats);
  const contractRetained = contractLabels.map(l => contractStats[l].retained);
  const contractChurned = contractLabels.map(l => contractStats[l].churned);

  if (charts.contract) {
    charts.contract.data.datasets[0].data = contractRetained;
    charts.contract.data.datasets[1].data = contractChurned;
    charts.contract.update();
  } else {
    const ctx = document.getElementById('chart-contract').getContext('2d');
    charts.contract = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: contractLabels,
        datasets: [
          {
            label: 'Retained',
            data: contractRetained,
            backgroundColor: '#10b981',
            borderRadius: 6
          },
          {
            label: 'Churned',
            data: contractChurned,
            backgroundColor: '#f43f5e',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8b8ea8', font: { family: 'Plus Jakarta Sans' } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8b8ea8' } },
          y: { grid: { color: '#242436' }, ticks: { color: '#8b8ea8' } }
        }
      }
    });
  }

  // Chart 4: Service Type (Grouped Bar comparing Retained vs Churned)
  const serviceStats = {
    "DSL": { retained: 0, churned: 0 },
    "Fiber optic": { retained: 0, churned: 0 },
    "No": { retained: 0, churned: 0 }
  };
  data.forEach(c => {
    if (serviceStats[c.internetService]) {
      if (c.churnStatus === 'Yes') serviceStats[c.internetService].churned++;
      else serviceStats[c.internetService].retained++;
    }
  });

  const serviceLabels = ["DSL Service", "Fiber Optic", "No Internet"];
  const serviceRetained = [serviceStats["DSL"].retained, serviceStats["Fiber optic"].retained, serviceStats["No"].retained];
  const serviceChurned = [serviceStats["DSL"].churned, serviceStats["Fiber optic"].churned, serviceStats["No"].churned];

  if (charts.chargesDist) {
    charts.chargesDist.data.datasets[0].data = serviceRetained;
    charts.chargesDist.data.datasets[1].data = serviceChurned;
    charts.chargesDist.update();
  } else {
    const ctx = document.getElementById('chart-charges-dist').getContext('2d');
    charts.chargesDist = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: serviceLabels,
        datasets: [
          {
            label: 'Retained',
            data: serviceRetained,
            backgroundColor: '#10b981',
            borderRadius: 6
          },
          {
            label: 'Churned',
            data: serviceChurned,
            backgroundColor: '#f43f5e',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8b8ea8', font: { family: 'Plus Jakarta Sans' } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8b8ea8' } },
          y: { grid: { color: '#242436' }, ticks: { color: '#8b8ea8' } }
        }
      }
    });
  }
}
