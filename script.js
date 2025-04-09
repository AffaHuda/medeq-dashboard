// script.js - Firebase Dashboard with PPM Highlighting, Filters & Stats

const firebaseConfig = {
  apiKey: "AIzaSyB__6QcoCnxUgIjngy7u6LF_sackbG2hPU",
  authDomain: "medicaldevicetrackingsystem.firebaseapp.com",
  databaseURL: "https://medicaldevicetrackingsystem-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "medicaldevicetrackingsystem",
  storageBucket: "medicaldevicetrackingsystem.appspot.com",
  messagingSenderId: "966828148980",
  appId: "1:966828148980:web:ee2501054fd7b02885b6a1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Elements
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const deviceContainer = document.getElementById("deviceContainer");
const totalDevices = document.getElementById("totalDevices");
const ppmToday = document.getElementById("ppmToday");
const highRisk = document.getElementById("highRisk");

const PASSWORD = "2025";
let allDevices = [];

// Login System
loginBtn.onclick = tryLogin;
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") tryLogin();
});

function tryLogin() {
  if (passwordInput.value === PASSWORD) {
    loginScreen.style.display = "none";
    dashboard.style.display = "flex";
    fetchDevicesFromFirebase();
  } else {
    alert("Incorrect password. Try again.");
    passwordInput.value = "";
  }
}

logoutBtn.onclick = () => {
  dashboard.style.display = "none";
  loginScreen.style.display = "flex";
  passwordInput.value = "";
};

// Firebase Fetch
function fetchDevicesFromFirebase() {
  db.ref("deviceLogs").on("value", (snapshot) => {
    const data = snapshot.val();
    allDevices = [];
    const today = new Date();
    let ppmCount = 0;
    let riskCount = 0;

    for (let key in data) {
      const device = data[key];
      let status = "normal";
      let isPPMToday = false;

      if (Array.isArray(device.ppm_schedule)) {
        for (let ppmDate of device.ppm_schedule) {
          const ppm = new Date(ppmDate);
          const diff = Math.ceil((ppm - today) / (1000 * 60 * 60 * 24));
          if (diff === 0) {
            status = "ppm-today";
            isPPMToday = true;
            break;
          } else if (diff > 0 && diff <= 7 && status !== "ppm-today") {
            status = "ppm-soon";
          }
        }
      }

      if (device.risk === "High") riskCount++;
      if (isPPMToday) ppmCount++;

      allDevices.push({
        name: key,
        serial: device.serial || "-",
        lastSeen: device.timestamp || "-",
        ward: device.ward || "-",
        risk: device.risk || "Unknown",
        asset: device.asset || "-",
        model: device.model || "-",
        ppm: device.ppm_schedule || [],
        status
      });
    }

    totalDevices.textContent = `Total Devices: ${allDevices.length}`;
    ppmToday.textContent = `PPM Today: ${ppmCount}`;
    highRisk.textContent = `High Risk: ${riskCount}`;

    renderDevices(allDevices);
  });
}

// Filter
filterSelect.onchange = () => renderDevices(allDevices);

function renderDevices(devices) {
  const filter = filterSelect.value;
  deviceContainer.innerHTML = "";

  devices.forEach((dev) => {
    if (
      (filter === "ppm-today" && dev.status !== "ppm-today") ||
      (filter === "ppm-soon" && dev.status !== "ppm-soon") ||
      (filter === "risk-low" && dev.risk !== "Low") ||
      (filter === "risk-high" && dev.risk !== "High")
    ) return;

    const highlightClass =
      dev.status === "ppm-today" ? "ppm-today" :
      dev.status === "ppm-soon" ? "ppm-soon" :
      dev.risk === "High" ? "red" :
      dev.risk === "Low" ? "green" : "orange";

    const ppmBadge =
      dev.status === "ppm-today"
        ? '<span class="ppm-badge">⚠ PPM Today</span>'
        : dev.status === "ppm-soon"
        ? '<span class="ppm-badge ppm-soon-badge">🕒 PPM Soon</span>'
        : "";

    const card = document.createElement("div");
    card.className = `device-card ${highlightClass}`;
    card.innerHTML = `
      <h3><strong>Device:</strong> ${dev.name} ${ppmBadge}</h3>
      <p><strong>Serial Number:</strong> ${dev.serial}</p>
      <p><strong>Last Seen:</strong> ${dev.lastSeen}</p>
      <p><strong>Ward:</strong> ${dev.ward}</p>
    `;

    card.onclick = () => toggleDetails(card, dev);
    deviceContainer.appendChild(card);
  });
}

function toggleDetails(card, dev) {
  const existingDetails = card.querySelector(".details");
  if (existingDetails) {
    existingDetails.classList.remove("show");
    setTimeout(() => existingDetails.remove(), 300);
    return;
  }

  const extra = document.createElement("div");
  extra.className = "details";
  extra.innerHTML = `
    <p><strong>Risk:</strong> <span style="color:${
      dev.risk === "Low" ? "green" :
      dev.risk === "Medium" ? "orange" : "red"
    }">${dev.risk}</span></p>
    ${dev.asset ? `<p><strong>Asset Number:</strong> ${dev.asset}</p>` : ""}
    ${dev.model ? `<p><strong>Model:</strong> ${dev.model}</p>` : ""}
    ${dev.ppm.length ? `<p><strong>PPM dates:</strong><br>${dev.ppm.join("<br>")}</p>` : ""}
  `;
  card.appendChild(extra);
  setTimeout(() => extra.classList.add("show"), 10);
}

// Search
searchInput.oninput = (e) => {
  const value = e.target.value.toLowerCase();
  const cards = Array.from(deviceContainer.children);
  cards.forEach((card) => {
    card.style.display = card.innerText.toLowerCase().includes(value) ? "block" : "none";
  });
};
