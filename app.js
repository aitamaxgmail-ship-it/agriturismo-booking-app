// Credenziali di Accesso
const CONFIG = {
  STAFF_PASS: "max78",
  MASTER_PIN: "nikita78"
};

// Catalogo completo delle 10 Unità
const ROOMS = [
  { id: "101", name: "Camera 101", type: "Quadrupla", capacity: 4 },
  { id: "102", name: "Camera 102", type: "Tripla", capacity: 3 },
  { id: "103", name: "Camera 103", type: "Quadrupla", capacity: 4 },
  { id: "104", name: "Camera 104", type: "Matrimoniale", capacity: 2 },
  { id: "105", name: "Camera 105", type: "Quadrupla", capacity: 4 },
  { id: "106", name: "Camera 106", type: "Quadrupla", capacity: 4 },
  { id: "107", name: "Camera 107", type: "Tripla", capacity: 3 },
  { id: "108", name: "Camera 108", type: "Matrimoniale", capacity: 2 },
  { id: "109", name: "Camera 109", type: "Tripla", capacity: 3 },
  { id: "spa", name: "Centro Benessere", type: "Ibrida (A ore / Notte)", capacity: 2 }
];

// Login Staff (Password: max78)
function loginStaff() {
  const pass = document.getElementById("staff-pass-input").value;
  if (pass === CONFIG.STAFF_PASS) {
    document.getElementById("login-modal").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    renderRooms();
  } else {
    document.getElementById("login-error").innerText = "Password errata!";
  }
}

// Gestione Modal Direzione
function openMasterModal() {
  document.getElementById("master-modal").classList.remove("hidden");
}

function closeMasterModal() {
  document.getElementById("master-modal").classList.add("hidden");
  document.getElementById("master-pin-input").value = "";
  document.getElementById("master-error").innerText = "";
}

// Login Direzione (PIN: nikita78)
function loginMaster() {
  const pin = document.getElementById("master-pin-input").value;
  if (pin === CONFIG.MASTER_PIN) {
    alert("Accesso Direzione effettuato con successo!");
    closeMasterModal();
  } else {
    document.getElementById("master-error").innerText = "PIN Errato!";
  }
}

// Generazione Schede Camere a Schermo
function renderRooms() {
  const grid = document.getElementById("rooms-grid");
  grid.innerHTML = "";
  
  ROOMS.forEach(room => {
    const card = document.createElement("div");
    card.style.background = "white";
    card.style.padding = "20px";
    card.style.borderRadius = "8px";
    card.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
    
    card.innerHTML = `
      <h3>${room.name}</h3>
      <p style="margin-top: 10px;"><strong>Tipologia:</strong> ${room.type}</p>
      <p><strong>Posti letto:</strong> ${room.capacity}</p>
      <p style="color: #2e7d32; font-weight: bold; margin-top: 10px;">Stato: Libera</p>
    `;
    grid.appendChild(card);
  });
}
