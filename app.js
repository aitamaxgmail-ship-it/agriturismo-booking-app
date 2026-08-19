const CONFIG = { STAFF_PASS: "max78", MASTER_PIN: "nikita78" };

const ROOMS = [
  { id: "101", name: "Camera 101", type: "Quadrupla", cap: 4, defaultPP: 30 },
  { id: "102", name: "Camera 102", type: "Tripla", cap: 3, defaultPP: 30 },
  { id: "103", name: "Camera 103", type: "Quadrupla", cap: 4, defaultPP: 30 },
  { id: "104", name: "Camera 104", type: "Matrimoniale", cap: 2, defaultPP: 35 },
  { id: "105", name: "Camera 105", type: "Quadrupla", cap: 4, defaultPP: 30 },
  { id: "106", name: "Camera 106", type: "Quadrupla", cap: 4, defaultPP: 30 },
  { id: "107", name: "Camera 107", type: "Tripla", cap: 3, defaultPP: 30 },
  { id: "108", name: "Camera 108", type: "Matrimoniale", cap: 2, defaultPP: 35 },
  { id: "109", name: "Camera 109", type: "Tripla", cap: 3, defaultPP: 30 },
  { id: "spa", name: "Centro Benessere", type: "SPA / Notte", cap: 2, defaultPP: 50 }
];

let bookings = JSON.parse(localStorage.getItem("agri_bookings")) || [];
let seasonalPrices = JSON.parse(localStorage.getItem("agri_seasons")) || [];

function loginStaff() {
  if (document.getElementById("staff-pass-input").value === CONFIG.STAFF_PASS) {
    document.getElementById("login-modal").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    renderRooms();
  } else {
    document.getElementById("login-error").innerText = "Password errata!";
  }
}

function renderRooms() {
  const grid = document.getElementById("rooms-grid");
  grid.innerHTML = "";
  
  ROOMS.forEach(room => {
    const activeBooking = bookings.find(b => b.roomId === room.id);
    const card = document.createElement("div");
    card.className = `room-card ${activeBooking ? 'busy' : 'free'}`;
    
    if (!activeBooking) {
      card.onclick = () => openBookingModal(room);
      card.innerHTML = `
        <h3>${room.name}</h3>
        <p>${room.type} (max ${room.cap} p.)</p>
        <p style="margin-top:10px; font-weight:bold;">LIBERA - Clicca per prenotare</p>
      `;
    } else {
      card.innerHTML = `
        <h3>${room.name} - OCCUPATA</h3>
        <p><strong>Ospite:</strong> ${activeBooking.guestName}</p>
        <p><strong>Persone:</strong> ${activeBooking.guestsCount}</p>
        <p><strong>Dal:</strong> ${activeBooking.checkIn} <strong>Al:</strong> ${activeBooking.checkOut}</p>
      `;
    }
    grid.appendChild(card);
  });
}

function openBookingModal(room) {
  document.getElementById("modal-room-title").innerText = `Prenota ${room.name}`;
  document.getElementById("book-room-id").value = room.id;
  
  // Blocco date retroattive: la data minima selezionabile è OGGI
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("book-checkin").min = today;
  document.getElementById("book-checkout").min = today;
  
  document.getElementById("booking-modal").classList.remove("hidden");
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.add("hidden");
}

function saveBooking() {
  const roomId = document.getElementById("book-room-id").value;
  const guestName = document.getElementById("book-guest-name").value;
  const guestsCount = parseInt(document.getElementById("book-guests-count").value) || 1;
  const checkIn = document.getElementById("book-checkin").value;
  const checkOut = document.getElementById("book-checkout").value;
  const deposit = parseFloat(document.getElementById("book-deposit").value) || 0;
  
  const today = new Date().toISOString().split('T')[0];

  if (!guestName || !checkIn || !checkOut) {
    alert("Compila tutti i campi obbligatori!");
    return;
  }

  if (checkIn < today) {
    alert("Impossibile inserire prenotazioni retroattive!");
    return;
  }

  if (checkOut <= checkIn) {
    alert("La data di check-out deve essere successiva al check-in!");
    return;
  }

  const room = ROOMS.find(r => r.id === roomId);
  if (guestsCount > room.cap) {
    alert(`Capienza massima superata! Questa camera ospita al massimo ${room.cap} persone.`);
    return;
  }

  // Calcolo Notti e Prezzo a Persona
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const ratePerPerson = getPriceForPeriod(checkIn, room.defaultPP);
  const totalPrice = ratePerPerson * guestsCount * nights;

  const newBooking = {
    id: Date.now().toString(),
    roomId,
    guestName,
    guestsCount,
    checkIn,
    checkOut,
    nights,
    ratePerPerson,
    totalPrice,
    deposit,
    balance: totalPrice - deposit
  };

  bookings.push(newBooking);
  localStorage.setItem("agri_bookings", JSON.stringify(bookings));
  
  // Reset Form e Chiusura
  document.getElementById("book-guest-name").value = "";
  document.getElementById("book-deposit").value = "0";
  closeBookingModal();
  renderRooms();
}

function getPriceForPeriod(dateStr, defaultRate) {
  const season = seasonalPrices.find(s => dateStr >= s.start && dateStr <= s.end);
  return season ? season.ratePP : defaultRate;
}

function saveSeasonPrice() {
  const start = document.getElementById("season-start").value;
  const end = document.getElementById("season-end").value;
  const ratePP = parseFloat(document.getElementById("season-pp-price").value);

  if (!start || !end || isNaN(ratePP)) {
    alert("Inserisci date e prezzo validi per il periodo!");
    return;
  }

  seasonalPrices.push({ start, end, ratePP });
  localStorage.setItem("agri_seasons", JSON.stringify(seasonalPrices));
  alert("Periodo salvato con successo!");
  renderMasterReport();
}

// Master & Protezione Cancellazione
function openMasterModal() { document.getElementById("master-modal").classList.remove("hidden"); }
function closeMasterModal() { document.getElementById("master-modal").classList.add("hidden"); }

function loginMaster() {
  if (document.getElementById("master-pin-input").value === CONFIG.MASTER_PIN) {
    closeMasterModal();
    renderMasterReport();
  } else {
    document.getElementById("master-error").innerText = "PIN Errato!";
  }
}

function renderMasterReport() {
  document.getElementById("rooms-grid").classList.add("hidden");
  document.getElementById("master-report-section").classList.remove("hidden");
  
  const tbody = document.getElementById("master-table-body");
  tbody.innerHTML = "";

  bookings.forEach(b => {
    const room = ROOMS.find(r => r.id === b.roomId);
    tbody.innerHTML += `
      <tr>
        <td><strong>${room.name}</strong></td>
        <td>${b.guestName}</td>
        <td>${b.guestsCount}</td>
        <td>${b.nights} (${b.checkIn} / ${b.checkOut})</td>
        <td>€ ${b.ratePerPerson.toFixed(2)}</td>
        <td><strong>€ ${b.totalPrice.toFixed(2)}</strong></td>
        <td style="color:#2e7d32;">€ ${b.deposit.toFixed(2)}</td>
        <td style="color:#c62828;"><strong>€ ${b.balance.toFixed(2)}</strong></td>
        <td class="no-print"><button onclick="deleteBookingWithMaster('${b.id}')" style="background:#c62828; color:white;">Cancella</button></td>
      </tr>
    `;
  });
}

function deleteBookingWithMaster(id) {
  const pin = prompt("Inserisci PIN Master per autorizzare la cancellazione:");
  if (pin === CONFIG.MASTER_PIN) {
    bookings = bookings.filter(b => b.id !== id);
    localStorage.setItem("agri_bookings", JSON.stringify(bookings));
    renderRooms();
    renderMasterReport();
  } else {
    alert("PIN errato! Cancellazione non autorizzata.");
  }
}

function closeMasterReport() {
  document.getElementById("master-report-section").classList.add("hidden");
  document.getElementById("rooms-grid").classList.remove("hidden");
}
