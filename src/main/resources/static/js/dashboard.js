console.log("Dashboard loaded");

const API = "/api/subscriptions";
let subscriptions = [];

let monthlyChart = null;
let yearlyChart = null;
let cycleChart = null;

/* ---------------- Formatters ---------------- */

function formatINR(amount) {
    if (!amount) return "₹0";

    const currency = localStorage.getItem("currency") || "INR";

    const rates = {
        INR: 1,
        USD: 0.012,   // approx
        EUR: 0.011
    };

    const symbols = {
        INR: "₹",
        USD: "$",
        EUR: "€"
    };

    const converted = Number(amount) * rates[currency];

    return symbols[currency] + converted.toFixed(2);
}



function formatDate(date) {
    if (!date) return "-";

    const format = localStorage.getItem("dateFormat") || "DD/MM/YYYY";
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    if (format === "MM/DD/YYYY") {
        return `${month}/${day}/${year}`;
    }

    return `${day}/${month}/${year}`;
}


/* ---------------- Navigation ---------------- */

function showSection(event, id) {
    document.querySelectorAll(".section").forEach(sec =>
        sec.classList.remove("active-section")
    );
    document.getElementById(id).classList.add("active-section");

    document.querySelectorAll(".nav").forEach(nav =>
        nav.classList.remove("active")
    );
    event.currentTarget.classList.add("active");

    if (id === "analytics") {
        buildAnalytics();
    }
    if (id === "reminders") {
        loadReminders();
    }

}

/* ---------------- Load Subscriptions ---------------- */

function loadSubscriptions() {

    fetch(`${API}?page=0&size=100`)
        .then(res => res.json())
        .then(data => {
            subscriptions = data.content ? data.content : data;
            render(subscriptions);
            loadReminders();
        })
        .catch(err => {
            console.error("API error:", err);
            alert("Failed to load subscriptions.");
        });
}

/* ---------------- Render Dashboard ---------------- */

function render(data) {

    const body = document.querySelector("#subsTable tbody");
    const crud = document.getElementById("crudBody");
    const upcoming = document.getElementById("upcomingList");

    body.innerHTML = "";
    crud.innerHTML = "";
    upcoming.innerHTML = "";

    document.getElementById("totalSubs").innerText = data.length;

    let monthlyTotal = 0;
    let yearlyTotal = 0;
    let upcomingCount = 0;

    data.forEach(sub => {

        if (sub.billingCycle === "MONTHLY") {
            monthlyTotal += Number(sub.amount);
        }

        if (sub.billingCycle === "YEARLY") {
            yearlyTotal += Number(sub.amount);
        }

        body.innerHTML += `
            <tr>
                <td>${sub.serviceName}</td>
                <td>${formatINR(sub.amount)}</td>
                <td>${sub.billingCycle}</td>
                <td>${formatDate(sub.nextBillingDate)}</td>
            </tr>
        `;

        const statusText = sub.active ? "Stop" : "Resume";
        const statusClass = sub.active ? "stop" : "resume";

        crud.innerHTML += `
            <tr>
                <td>${sub.serviceName}</td>
                <td>${formatINR(sub.amount)}</td>
                <td>${sub.billingCycle}</td>
                <td>${formatDate(sub.nextBillingDate)}</td>
                <td>
                    <a class="status-btn ${statusClass}"
                       onclick="toggleSubscription('${sub.id}', ${sub.active})">
                        ${statusText}
                    </a>
                </td>
            </tr>
        `;

        if (sub.active) {
            upcomingCount++;
            upcoming.innerHTML += `
                <div class="item">
                    <strong>${sub.serviceName}</strong>
                    <div>${formatINR(sub.amount)} - ${formatDate(sub.nextBillingDate)}</div>
                </div>
            `;
        }
    });

    document.getElementById("monthlySpend").innerText = formatINR(monthlyTotal);
    document.getElementById("yearlySpend").innerText = formatINR(yearlyTotal);
    document.getElementById("upcomingCount").innerText = upcomingCount;
}

/* ---------------- Toggle Active ---------------- */

function toggleSubscription(id, active) {
    fetch(`${API}/${id}`, { method: "DELETE" })
        .then(() => loadSubscriptions())
        .catch(err => {
            console.error("Toggle failed", err);
            alert("Failed to update status");
        });
}

/* ---------------- Add Subscription ---------------- */

function addSubscription() {

    const service = document.getElementById("service").value.trim();
    const amount = document.getElementById("amount").value;
    const cycle = document.getElementById("cycle").value;
    const nextDate = document.getElementById("nextDate").value;

    if (!service || !amount || !nextDate) {
        alert("Please fill all fields");
        return;
    }

    const payload = {
        serviceName: service,
        amount: amount,
        billingCycle: cycle,
        startDate: nextDate
    };

    fetch(API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    })
        .then(() => {
            document.getElementById("service").value = "";
            document.getElementById("amount").value = "";
            document.getElementById("nextDate").value = "";
            loadSubscriptions();
        })
        .catch(err => {
            console.error("Save error:", err);
            alert("Failed to save subscription.");
        });
}

/* ---------------- Search ---------------- */

function searchSubscriptions() {
    const keyword = document.getElementById("search").value.toLowerCase();
    const filtered = subscriptions.filter(s =>
        s.serviceName.toLowerCase().includes(keyword)
    );
    render(filtered);
}

/* ---------------- Logout ---------------- */

function logout() {
    window.location.href = "/login.html";
}

/* ======================================================
   ===================== ANALYTICS ======================
   ====================================================== */

function buildAnalytics() {
    buildMonthlyTrend();
    buildYearlyTrend();
    buildCycleChart();
    buildSmartInsights();
}

/* -------- Utility: Get Current + Next Month -------- */

function getNextTwoMonths() {
    const today = new Date();
    const months = [];

    for (let i = 0; i < 2; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);

        months.push({
            year: d.getFullYear(),
            month: d.getMonth(),   // 0-based
            label: d.toLocaleString("en-IN", { month: "short", year: "numeric" })
        });
    }

    return months;
}

/* -------- Monthly Trend (FIXED LOGIC) -------- */

function buildMonthlyTrend() {

    if (monthlyChart) monthlyChart.destroy();

    const months = getNextTwoMonths();
    const labels = months.map(m => m.label);
    const values = months.map(() => 0);

    subscriptions.forEach(sub => {
        if (sub.billingCycle !== "MONTHLY") return;

        const billDate = new Date(sub.nextBillingDate);

        months.forEach((m, index) => {
            if (
                billDate.getFullYear() === m.year &&
                billDate.getMonth() === m.month
            ) {
                values[index] += Number(sub.amount);
            }
        });
    });

    const ctx = document.getElementById("monthlyChart");

    monthlyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Monthly Spend (\u20B9)",
                data: values,
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    ticks: {
                        callback: value => "\u20B9" + value.toLocaleString("en-IN")
                    }
                }
            }
        }
    });
}

/* -------- Yearly Trend (FIXED LOGIC) -------- */

function buildYearlyTrend() {

    if (yearlyChart) yearlyChart.destroy();

    const months = getNextTwoMonths();
    const labels = months.map(m => m.label);
    const values = months.map(() => 0);

    subscriptions.forEach(sub => {
        if (sub.billingCycle !== "YEARLY") return;

        const billDate = new Date(sub.nextBillingDate);

        months.forEach((m, index) => {
            if (
                billDate.getFullYear() === m.year &&
                billDate.getMonth() === m.month
            ) {
                values[index] += Number(sub.amount);
            }
        });
    });

    const ctx = document.getElementById("yearlyChart");

    yearlyChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Yearly Spend (\u20B9)",
                data: values,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    ticks: {
                        callback: value => "\u20B9" + value.toLocaleString("en-IN")
                    }
                }
            }
        }
    });
}

/* -------- Billing Cycle Pie -------- */

function buildCycleChart() {

    if (cycleChart) cycleChart.destroy();

    let monthly = 0;
    let yearly = 0;

    subscriptions.forEach(s => {
        if (s.billingCycle === "MONTHLY") monthly += Number(s.amount);
        if (s.billingCycle === "YEARLY") yearly += Number(s.amount);
    });

    const ctx = document.getElementById("cycleChart");

    cycleChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Monthly", "Yearly"],
            datasets: [{
                data: [monthly, yearly],
                borderWidth: 2
            }]
        },
        options: { responsive: true }
    });
}

/* -------- Smart Insights -------- */

function buildSmartInsights() {

    const total = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0);

    const highest = subscriptions.reduce((max, s) =>
            !max || Number(s.amount) > Number(max.amount) ? s : max
        , null);

    const monthlyCount = subscriptions.filter(s => s.billingCycle === "MONTHLY").length;
    const yearlyCount = subscriptions.filter(s => s.billingCycle === "YEARLY").length;

    document.getElementById("insightTotal").innerText =
        `Total Spend: ${formatINR(total)}`;

    document.getElementById("insightHighest").innerText =
        highest
            ? `Highest Subscription: ${highest.serviceName} (${formatINR(highest.amount)})`
            : "Highest Subscription: -";

    document.getElementById("insightMonthly").innerText =
        `Monthly Plans: ${monthlyCount}`;

    document.getElementById("insightYearly").innerText =
        `Yearly Plans: ${yearlyCount}`;
}

function daysBetween(date1, date2) {

    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function loadReminders() {

    if (!subscriptions || subscriptions.length === 0) return;

    const daysLimit = Number(document.getElementById("notifyDays").value);
    const reminderList = document.getElementById("reminderList");
    reminderList.innerHTML = "";

    const today = new Date();

    const upcoming = subscriptions.filter(sub => {

        if (!sub.active) return false;

        const billDate = new Date(sub.nextBillingDate);
        const diffDays = daysBetween(today, billDate);

        return diffDays >= 0 && diffDays <= daysLimit;
    });

    if (upcoming.length === 0) {
        reminderList.innerHTML =
            `<p style="color:white;">No upcoming payments in next ${daysLimit} days.</p>`;
        return;
    }

    upcoming
        .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate))
        .forEach(sub => {

            const billDate = new Date(sub.nextBillingDate);
            const remaining = daysBetween(today, billDate);

            reminderList.innerHTML += `
                <div class="reminder-card">
                    <h4>${sub.serviceName}</h4>
                    <p>Amount: ${formatINR(sub.amount)}</p>
                    <p>Billing Date: ${formatDate(sub.nextBillingDate)}</p>
                    <p>Due in: ${remaining} days</p>
                </div>
            `;
        });
}

/* ================= SETTINGS ================= */

function loadSettings() {
    document.getElementById("defaultNotify").value =
        localStorage.getItem("defaultNotify") || "3";

    document.getElementById("enableReminders").checked =
        localStorage.getItem("enableReminders") !== "false";

    document.getElementById("currencySelect").value =
        localStorage.getItem("currency") || "INR";

    document.getElementById("dateFormat").value =
        localStorage.getItem("dateFormat") || "DD/MM/YYYY";
}

function saveSettings() {
    localStorage.setItem("defaultNotify",
        document.getElementById("defaultNotify").value);

    localStorage.setItem("enableReminders",
        document.getElementById("enableReminders").checked);

    localStorage.setItem("currency",
        document.getElementById("currencySelect").value);

    localStorage.setItem("dateFormat",
        document.getElementById("dateFormat").value);
}

document.addEventListener("change", saveSettings);
window.addEventListener("load", loadSettings);

function exportData() {
    const csv = [
        ["Service","Amount","Cycle","Next Billing"],
        ...subscriptions.map(s => [
            s.serviceName,
            s.amount,
            s.billingCycle,
            s.nextBillingDate
        ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "subscriptions.csv";
    link.click();
}

function clearAllData() {
    if (!confirm("Are you sure? This will delete all subscriptions.")) return;

    Promise.all(subscriptions.map(s =>
        fetch(`${API}/${s.id}`, { method: "DELETE" })
    )).then(() => loadSubscriptions());
}

/* ================= IMPORT CSV (FIXED) ================= */

async function importData() {
    const fileInput = document.getElementById("importFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a CSV file first.");
        return;
    }

    const text = await file.text();
    const rows = text.split("\n").map(r => r.trim()).filter(r => r.length);

    if (rows.length <= 1) {
        alert("CSV file is empty or invalid.");
        return;
    }

    const dataRows = rows.slice(1); // Skip header
    let successCount = 0;

    for (const row of dataRows) {
        const cols = row.split(",");

        if (cols.length < 4) continue;

        const payload = {
            serviceName: cols[0].trim(),
            amount: Number(cols[1].trim()),
            billingCycle: cols[2].trim().toUpperCase(),
            startDate: cols[3].trim()
        };

        if (!payload.serviceName || !payload.amount || !payload.startDate) continue;

        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                successCount++;
            }
        } catch (err) {
            console.error("Import failed for row:", payload, err);
        }
    }

    alert(`Import completed: ${successCount} records added.`);
    loadSubscriptions();
}


document.addEventListener("change", () => {
    render(subscriptions);
    buildAnalytics();
});



/* ---------------- Init ---------------- */

window.onload = loadSubscriptions;
