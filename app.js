/* ==========================================================================
   NEXUS // CHURN INTELLIGENCE ENGINE
   ========================================================================== */

// --- INITIAL STATE ---
let customers = [
    { id: "USR-8419", name: "Cyberdyne Systems", plan: "Enterprise", usage: 2, tickets: 8, billing: "Unpaid Invoice", mrr: 2450.00, risk: 87, status: "Pending" },
    { id: "USR-8418", name: "Initech Corporation", plan: "Pro", usage: 1, tickets: 11, billing: "Card Expiring", mrr: 450.00, risk: 94, status: "Pending" },
    { id: "USR-8417", name: "Stark Industries", plan: "Enterprise", usage: 4, tickets: 3, billing: "Nominal", mrr: 1850.00, risk: 38, status: "Pending" },
    { id: "USR-8416", name: "Wayne Enterprises", plan: "Enterprise", usage: 3, tickets: 5, billing: "Unpaid Invoice", mrr: 3100.00, risk: 62, status: "Pending" },
    { id: "USR-8415", name: "Tyrell Replicants", plan: "Pro", usage: 2, tickets: 9, billing: "Card Expiring", mrr: 650.00, risk: 81, status: "Pending" },
    { id: "USR-8414", name: "Umbrella Corp", plan: "Enterprise", usage: 1, tickets: 6, billing: "Nominal", mrr: 1200.00, risk: 78, status: "Pending" },
    { id: "USR-8413", name: "Hooli Tech", plan: "Pro", usage: 4, tickets: 4, billing: "Nominal", mrr: 380.00, risk: 32, status: "Pending" },
    { id: "USR-8412", name: "Acme Product Labs", plan: "Starter", usage: 1, tickets: 14, billing: "Billing Dispute", mrr: 99.00, risk: 99, status: "Pending" },
    { id: "USR-8411", name: "Massive Dynamic", plan: "Enterprise", usage: 3, tickets: 4, billing: "Unpaid Invoice", mrr: 1600.00, risk: 54, status: "Pending" },
    { id: "USR-8410", name: "Oscorp Holdings", plan: "Pro", usage: 2, tickets: 6, billing: "Nominal", mrr: 520.00, risk: 68, status: "Pending" },
    { id: "USR-8409", name: "Globex Corporation", plan: "Enterprise", usage: 5, tickets: 2, billing: "Nominal", mrr: 2100.00, risk: 18, status: "Pending" },
    { id: "USR-8408", name: "Soylent Green Co", plan: "Starter", usage: 2, tickets: 5, billing: "Card Expiring", mrr: 120.00, risk: 65, status: "Pending" },
    { id: "USR-8407", name: "LexCorp Industries", plan: "Enterprise", usage: 3, tickets: 7, billing: "Billing Dispute", mrr: 2800.00, risk: 74, status: "Pending" },
    { id: "USR-8406", name: "Virtucon Group", plan: "Starter", usage: 4, tickets: 3, billing: "Nominal", mrr: 85.00, risk: 29, status: "Pending" }
];

// Target Save Goals
let savesCount = 18;
const SAVES_GOAL_TARGET = 25;

// Table Filters & Pagination state
let filteredCustomers = [...customers];
let currentPage = 1;
const pageSize = 5;

// Chart reference
let churnTrendChart = null;

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialise Icons
    lucide.createIcons();

    // 2. Set Current Date in Header
    const dateElement = document.getElementById("current-date");
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('en-GB', options);

    // 3. Initialize Particle Background
    initParticleCanvas();

    // 4. Initialize Charts
    initCharts();

    // 5. Update KPI Cards & Table
    updateDashboard();

    // 6. Setup Event Handlers
    setupEventListeners();
    
    // 7. Initial calculation of simulator risk gauge
    calculatePredictiveRisk();
});

// ==========================================================================
// BACKGROUND CANVAS PARTICLE ANIMATION
// ==========================================================================
function initParticleCanvas() {
    const canvas = document.getElementById("particle-canvas");
    const ctx = canvas.getContext("2d");

    let particles = [];
    const particleCount = 60;
    const maxConnectionDistance = 120;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(155, 81, 224, 0.15)";
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw connecting lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxConnectionDistance) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    const alpha = (1 - (dist / maxConnectionDistance)) * 0.06;
                    ctx.strokeStyle = `rgba(155, 81, 224, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}

// ==========================================================================
// CORE METRICS & NUMERIC ANIMATOR
// ==========================================================================
function updateDashboard() {
    // 1. Calculations
    const activeRiskList = customers.filter(c => c.status === "Pending");
    
    // Customers At Risk Count
    const totalRiskCount = activeRiskList.filter(c => c.risk >= 50).length;

    // Total MRR at Risk
    const totalMrrRisk = activeRiskList.reduce((acc, curr) => {
        // Only count MRR for users actually classified as Medium or High Risk (>= 50%)
        return curr.risk >= 50 ? acc + curr.mrr : acc;
    }, 0);

    // Churn Rate
    // Calculation: (Total Risk MRR / (Total Customer MRR + Risk MRR)) * Churn probability ratio
    const totalCompanyMrrBase = 220000; // Mock base MRR of company
    const churnRate = ((totalMrrRisk / totalCompanyMrrBase) * 65).toFixed(2); // relative factor

    // Progress percentage
    const progressPercent = Math.min(Math.round((savesCount / SAVES_GOAL_TARGET) * 100), 100);

    // 2. Animate KPI Text Counters
    const prevChurn = parseFloat(document.getElementById("kpi-churn-rate").textContent);
    animateValue("kpi-churn-rate", prevChurn, parseFloat(churnRate), false, true);

    const prevRisk = parseInt(document.getElementById("kpi-risk-count").textContent);
    animateValue("kpi-risk-count", prevRisk, totalRiskCount, false, false);

    const prevMrr = parseFloat(document.getElementById("kpi-mrr-risk").textContent.replace(/,/g, ''));
    animateValue("kpi-mrr-risk", prevMrr, totalMrrRisk, true, false);

    // Sales Saves Gauge Text and SVG Ring
    document.getElementById("current-saves").textContent = savesCount;
    document.getElementById("total-saves").textContent = SAVES_GOAL_TARGET;
    document.getElementById("save-percentage").textContent = `${progressPercent}%`;
    updateSaveCircle(progressPercent);

    // 3. Refresh At-Risk Table View
    filterAndPaginateTable();
}

// Roll Animation for values
function animateValue(id, start, end, formatCurrency = false, decimal = false) {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    if (start === end) {
        obj.textContent = formatNumberText(end, formatCurrency, decimal);
        return;
    }

    const duration = 1200;
    let startTimestamp = null;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = start + progress * (end - start);
        obj.textContent = formatNumberText(current, formatCurrency, decimal);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.textContent = formatNumberText(end, formatCurrency, decimal);
        }
    };
    window.requestAnimationFrame(step);
}

function formatNumberText(val, isCurrency, isDecimal) {
    if (isNaN(val)) return "0";
    if (isCurrency) {
        return val.toLocaleString('en-US', {
            minimumFractionDigits: isDecimal ? 2 : 0,
            maximumFractionDigits: isDecimal ? 2 : 0
        });
    }
    return val.toLocaleString('en-US', {
        minimumFractionDigits: isDecimal ? 2 : 0,
        maximumFractionDigits: isDecimal ? 2 : 0
    });
}

function updateSaveCircle(percent) {
    const circle = document.getElementById("save-progress-circle");
    if (!circle) return;
    
    const circumference = 251.2;
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

// ==========================================================================
// PREDICTIVE RISK SIMULATION SYSTEM
// ==========================================================================
function calculatePredictiveRisk() {
    const tickets = parseInt(document.getElementById("sim-tickets").value);
    const logins = parseInt(document.getElementById("sim-logins").value);
    const billing = parseInt(document.getElementById("sim-billing").value);
    const contract = document.getElementById("sim-contract").value;

    // Numerical formula weight models
    let score = 40; // Base score
    score += (tickets * 5.2); // Support ticket weight
    score -= (logins * 0.9);  // Activity login weight
    score += (billing * 7.5);  // Billing issues weight

    if (contract === "Month-to-Month") score += 12;
    if (contract === "1-Year") score -= 12;
    if (contract === "2-Year") score -= 22;

    // Clamp score
    score = Math.round(Math.max(2, Math.min(99, score)));

    // Update Simulator HTML gauges
    document.getElementById("sim-tickets-val").textContent = tickets;
    document.getElementById("sim-logins-val").textContent = logins;
    document.getElementById("sim-billing-val").textContent = billing;
    document.getElementById("sim-risk-percent").textContent = `${score}%`;

    // Circular Progress Ring Calculations
    // Circumference = 2 * PI * r = 2 * 3.14159 * 42 = 263.89
    const circle = document.getElementById("sim-gauge-circle");
    const circumference = 263.89;
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Gauge State Colors & Explanations
    const levelLabel = document.getElementById("sim-risk-level");
    const explainerText = document.getElementById("sim-explainer-text");

    if (score < 35) {
        levelLabel.textContent = "LOW RISK";
        levelLabel.style.color = "var(--neon-emerald)";
        circle.style.stroke = "var(--neon-emerald)";
        circle.style.filter = "drop-shadow(0 0 4px var(--neon-emerald-glow))";
        explainerText.textContent = "Telemetry suggests low risk. The client has consistent logins and manageable support ticket quantities, keeping attrition vulnerability nominal.";
    } else if (score < 65) {
        levelLabel.textContent = "MEDIUM RISK";
        levelLabel.style.color = "var(--neon-gold)";
        circle.style.stroke = "var(--neon-gold)";
        circle.style.filter = "drop-shadow(0 0 4px var(--neon-gold-glow))";
        explainerText.textContent = "Vulnerability is moderate. Although account activity exists, transaction friction (billing errors) and month-to-month contracts increase vulnerability.";
    } else {
        levelLabel.textContent = "HIGH CRITICAL";
        levelLabel.style.color = "var(--neon-rose)";
        circle.style.stroke = "var(--neon-rose)";
        circle.style.filter = "drop-shadow(0 0 4px var(--neon-rose-glow))";
        explainerText.textContent = "Vulnerability is critical! High support tickets coupled with sparse user logins point directly to low engagement and product frustration.";
    }
}

// ==========================================================================
// DATA CHART COMPONENT (CHART.JS)
// ==========================================================================
function initCharts() {
    const trendCtx = document.getElementById("churn-trend-chart").getContext("2d");
    
    // Custom gradient
    const gradient = trendCtx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(255, 42, 109, 0.25)');
    gradient.addColorStop(1, 'rgba(155, 81, 224, 0.00)');

    churnTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"],
            datasets: [
                {
                    label: 'Cohort Churn Rate (%)',
                    data: [3.84, 3.42, 2.91, 3.10, 2.78, 2.41],
                    borderColor: '#ff2a6d',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffac1c',
                    pointHoverRadius: 6,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.35
                },
                {
                    label: 'Target Baseline (%)',
                    data: [3.00, 3.00, 3.00, 3.00, 3.00, 3.00],
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#9791b0', font: { family: 'Inter', size: 11 } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
                    ticks: { color: '#9791b0', font: { family: 'Share Tech Mono', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
                    ticks: { 
                        color: '#9791b0', 
                        font: { family: 'Share Tech Mono', size: 11 },
                        callback: function(value) { return value.toFixed(2) + '%'; }
                    }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

function updateChartValue(newChurn) {
    if (churnTrendChart) {
        // Update the last month's churn rate to the active live calculated rate
        churnTrendChart.data.datasets[0].data[5] = parseFloat(newChurn);
        churnTrendChart.update('none');
    }
}

// ==========================================================================
// REGISTRY DATABASE TABLE FILTER & PLAYBOOK MITIGATION
// ==========================================================================
function filterAndPaginateTable() {
    const searchVal = document.getElementById("table-search").value.toLowerCase();
    const planVal = document.getElementById("plan-filter").value;

    filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchVal) || 
                              c.id.toLowerCase().includes(searchVal);
        const matchesPlan = (planVal === "ALL" || c.plan === planVal);
        return matchesSearch && matchesPlan;
    });

    const totalRows = filteredCustomers.length;
    const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1);
    
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageRows = filteredCustomers.slice(startIdx, endIdx);

    const tbody = document.getElementById("customers-tbody");
    tbody.innerHTML = "";

    if (pageRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="color: var(--text-muted); padding: 30px;">No at-risk customers match criteria</td></tr>`;
    } else {
        pageRows.forEach(c => {
            const row = document.createElement("tr");

            // Setup stars for usage
            let stars = "";
            for (let i = 1; i <= 5; i++) {
                if (i <= c.usage) stars += "★";
                else stars += "☆";
            }

            // Billing flags classes
            let billingClass = "status-text-pill";
            if (c.billing !== "Nominal") billingClass += " warning";

            // Risk configurations
            let riskClass = "risk-pill";
            let riskLabel = "LOW";
            if (c.risk >= 75) {
                riskClass += " high";
                riskLabel = "HIGH";
            } else if (c.risk >= 45) {
                riskClass += " medium";
                riskLabel = "MEDIUM";
            } else {
                riskClass += " low";
            }

            // Button configurations
            let actionBtn = "";
            if (c.status === "Saved") {
                actionBtn = `<button class="btn btn-sm btn-saved" disabled><i data-lucide="check"></i><span>Saved</span></button>`;
                billingClass = "status-text-pill success";
            } else {
                actionBtn = `<button class="btn btn-sm btn-playbook" onclick="executePlaybook('${c.id}')"><i data-lucide="gift"></i><span>Offer 15% Disc</span></button>`;
            }

            row.innerHTML = `
                <td style="font-family: var(--font-mono); color: var(--neon-cyan);">${c.id}</td>
                <td style="font-weight: 500;">${c.name}</td>
                <td><span class="category-tag">${c.plan}</span></td>
                <td class="text-center"><span class="rating-stars">${stars}</span></td>
                <td class="text-center" style="font-family: var(--font-mono);">${c.tickets}</td>
                <td><span class="${billingClass}">${c.billing}</span></td>
                <td class="text-right" style="font-family: var(--font-mono); font-weight: bold;">$${c.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="text-center"><span class="${riskClass}">${c.risk}% ${riskLabel}</span></td>
                <td class="text-center">${actionBtn}</td>
            `;
            tbody.appendChild(row);
        });
        lucide.createIcons(); // reload icons inside actions
    }

    document.getElementById("table-showing-text").textContent = `Showing ${pageRows.length} of ${totalRows} at-risk customers`;
    document.getElementById("page-num").textContent = `${currentPage} / ${totalPages}`;

    document.getElementById("prev-page").disabled = currentPage === 1;
    document.getElementById("next-page").disabled = currentPage === totalPages;
}

// Global execution handle for Playbook mitigation triggers
window.executePlaybook = function(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || customer.status === "Saved") return;

    // Apply mitigation changes
    customer.status = "Saved";
    customer.risk = 12; // Risk drops to low
    customer.billing = "Saved (15% Disc)";

    // Update saves counters
    savesCount++;

    // Notification
    pushToast("Playbook Deployed", `${customer.name} saved! Discount applied, risk mitigated.`, "success");

    // Recalculate dashboard aggregates
    updateDashboard();

    // Redraw Cohort Chart values
    const activeRiskList = customers.filter(c => c.status === "Pending");
    const totalMrrRisk = activeRiskList.reduce((acc, curr) => curr.risk >= 50 ? acc + curr.mrr : acc, 0);
    const totalCompanyMrrBase = 220000;
    const newChurn = ((totalMrrRisk / totalCompanyMrrBase) * 65).toFixed(2);
    updateChartValue(newChurn);
};

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function pushToast(title, message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icon = type === "success" ? "check-circle" : "info";
    
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.add("fade-out");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 4000);
}

// ==========================================================================
// VIEW EVENT HANDLERS
// ==========================================================================
function setupEventListeners() {
    // Simulator input change listeners
    document.querySelectorAll(".sim-slider").forEach(slider => {
        slider.addEventListener("input", calculatePredictiveRisk);
    });

    document.getElementById("sim-contract").addEventListener("change", calculatePredictiveRisk);

    // Table pagination events
    document.getElementById("prev-page").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            filterAndPaginateTable();
        }
    });

    document.getElementById("next-page").addEventListener("click", () => {
        const totalRows = filteredCustomers.length;
        const totalPages = Math.ceil(totalRows / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            filterAndPaginateTable();
        }
    });

    // Table search filter events
    document.getElementById("table-search").addEventListener("input", () => {
        currentPage = 1;
        filterAndPaginateTable();
    });

    document.getElementById("plan-filter").addEventListener("change", () => {
        currentPage = 1;
        filterAndPaginateTable();
    });

    // Reset filters
    document.getElementById("reset-filters").addEventListener("click", () => {
        document.getElementById("table-search").value = "";
        document.getElementById("plan-filter").value = "ALL";
        currentPage = 1;
        filterAndPaginateTable();
        pushToast("Filters Cleared", "Registry data filters reset to nominal.", "info");
    });
}
