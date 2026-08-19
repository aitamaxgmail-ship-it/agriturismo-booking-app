const CONFIG = { STAFF_PASS: "max78", MASTER_PIN: "nikita78" };

const ROOMS = [
  { id: "101", name: "Camera 101", type: "Quadrupla", defaultAdultRate: 35, defaultChildRate: 20 },
  { id: "102", name: "Camera 102", type: "Tripla", defaultAdultRate: 35, defaultChildRate: 20 },
  { id: "103", name: "Camera 103", type: "Quadrupla", defaultAdultRate: 35, defaultChildRate: 20 },
  { id: "104", name: "Camera 104", type: "Matrimoniale", defaultAdultRate: 40, defaultChildRate: 20 },
  { id: "105", name: "Camera 105", type: "Quadrupla", defaultAdultRate: 35, defaultChildRate: 20 },
  { id: "106", name: "Camera 106", type: "Quadrupla", defaultAdultRate: 35, defaultChildRate: 20 },
  { id: "107", name: "Camera 107", type: "Tripla", defaultAdultRate: 35, defaultChildRate: 20 },
  { id: "108", name: "Camera 108", type: "Matrimoniale", defaultAdultRate: 40, defaultChildRate: 20 },
  { id: "109", name: "Camera 109", type: "Tripla", defaultAdultRate: 35, defaultChildRate: 20 },
  { id: "110", name: "Camera 110", type: "Suite SPA", defaultAdultRate: 50, defaultChildRate: 25 }
];

let bookings = JSON.parse(localStorage.getItem("agri_bookings")) || [];
let seasonalPrices = JSON.parse(localStorage.getItem("agri_seasons")) || [];

let pendingMasterAction = null; // 'report' o 'release'
let targetBookingId = null;

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split('T')[0];
  let tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  document.getElementById("home-date-from").value = today;
  document.getElementById("home-date-to").value = tomorrowStr;
  document.getElementById("report-date-from").value = today;
  document.getElementById("report-date-to").value = tomorrowStr;
});

function loginStaff() {
  if (document.getElementById("staff-pass-input").value === CONFIG.STAFF_PASS) {
    document.getElementById("login-modal").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    renderRooms();
  } else {
    document.getElementById("login-error").innerText = "Password errata!";
  }
}

// Rendering Griglia Camere in Home
function renderRooms() {
  const from = document.getElementById("home-date-from").value;
  const to = document.getElementById("home-date-to").value;
  const grid = document.getElementById("rooms-grid");
  grid.innerHTML = "";

  if (!from || !to) return;

  ROOMS.forEach(room => {
    // Trova se la camera ha una prenotazione sovrapposta al periodo cercato
    const activeBooking = bookings.find(b => 
      b.roomId === room.id && (from < b.checkOut && to > b.checkIn)
    );

    const card = document.createElement("div");
    card.className = `room-card ${activeBooking ? 'busy' : 'free'}`;

    if (!activeBooking) {
      card.onclick = () => openBookingModal(room, from, to);
      card.innerHTML = `
        <div class="room-number">${room.name}</div>
        <div class="room-type">${room.type}</div>
        <small style="margin-top:6px; font-weight:bold; color:#2ecc71;">LIBERA</small>
      `;
    } else {
      card.onclick = () => requestReleaseRoom(activeBooking);
      card.innerHTML = `
        <div class="room-number">${room.name}</div>
        <div class="room-guest">${activeBooking.guestName}</div>
        <div class="room-type">${activeBooking.adults} Ad. ${activeBooking.children ? '/ ' + activeBooking.children + ' Bimbi' : ''}</div>
        <small style="margin-top:4px; font-weight:bold; color:#ff9f43;">OCCUPATA (Clicca p/ Sbloccare)</small>
      `;
    }
    grid.appendChild(card);
  });
}

// Apertura Modal Prenotazione
function openBookingModal(room, checkIn, checkOut) {
  document.getElementById("modal-room-title").innerText = `Prenota ${room.name}`;
  document.getElementById("book-room-id").value = room.id;
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("book-checkin").min = today;
  document.getElementById("book-checkout").min = today;

  document.getElementById("book-checkin").value = checkIn;
  
  if (checkOut <= checkIn) {
    let nextDay = new Date(checkIn);
    nextDay.setDate(nextDay.getDate() + 1);
    document.getElementById("book-checkout").value = nextDay.toISOString().split('T')[0];
  } else {
    document.getElementById("book-checkout").value = checkOut;
  }

  // Tariffe predefinite o stagionali
  const rates = getRatesForPeriod(checkIn, room);
  document.getElementById("book-rate-adult").value = rates.adultRate;
  document.getElementById("book-rate-child").value = rates.childRate;

  updateBookingTotal();
  document.getElementById("booking-modal").classList.remove("hidden");
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.add("hidden");
}

// Calcolo Dinamico Totale
function updateBookingTotal() {
  const checkIn = new Date(document.getElementById("book-checkin").value);
  const checkOut = new Date(document.getElementById("book-checkout").value);
  const adults = parseInt(document.getElementById("book-adults").value) || 0;
  const children = parseInt(document.getElementById("book-children").value) || 0;
  const rateAdult = parseFloat(document.getElementById("book-rate-adult").value) || 0;
  const rateChild = parseFloat(document.getElementById("book-rate-child").value) || 0;

  let nights = 0;
  if (checkOut > checkIn) {
    nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  }

  const dailyTotal = (adults * rateAdult) + (children * rateChild);
  const grandTotal = dailyTotal * nights;

  document.getElementById("summary-nights").innerText = nights;
  document.getElementById("summary-total").innerText = grandTotal.toFixed(2);
}

// Salvataggio Nuova Prenotazione
function saveBooking() {
  const roomId = document.getElementById("book-room-id").value;
  const guestName = document.getElementById("book-guest-name").value.trim();
  const phone = document.getElementById("book-phone").value.trim();
  const adults = parseInt(document.getElementById("book-adults").value) || 1;
  const children = parseInt(document.getElementById("book-children").value) || 0;
  const checkIn = document.getElementById("book-checkin").value;
  const checkOut = document.getElementById("book-checkout").value;
  const rateAdult = parseFloat(document.getElementById("book-rate-adult").value) || 0;
  const rateChild = parseFloat(document.getElementById("book-rate-child").value) || 0;
  const deposit = parseFloat(document.getElementById("book-deposit").value) || 0;
  const notes = document.getElementById("book-notes").value;

  const today = new Date().toISOString().split('T')[0];

  if (!guestName || !checkIn || !checkOut) {
    alert("Compila tutti i campi obbligatori!");
    return;
  }

  if (checkIn < today) {
    alert("Errore: Non puoi inserire una prenotazione nel passato!");
    return;
  }

  if (checkOut <= checkIn) {
    alert("La data di check-out deve essere successiva al check-in!");
    return;
  }

  // Verifica sovrapposizioni
  const hasConflict = bookings.some(b => 
    b.roomId === roomId && (checkIn < b.checkOut && checkOut > b.checkIn)
  );

  if (hasConflict) {
    alert("Errore: La camera risulta già occupata in questo periodo!");
    return;
  }

  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const totalPrice = ((adults * rateAdult) + (children * rateChild)) * nights;

  const newBooking = {
    id: Date.now().toString(),
    roomId,
    guestName,
    phone,
    adults,
    children,
    checkIn,
    checkOut,
    nights,
    rateAdult,
    rateChild,
    totalPrice,
    deposit,
    balance: totalPrice - deposit,
    notes
  };

  bookings.push(newBooking);
  localStorage.setItem("agri_bookings", JSON.stringify(bookings));

  closeBookingModal();
  renderRooms();
}

// Sblocco Camera tramite PIN Master
function requestReleaseRoom(booking) {
  targetBookingId = booking.id;
  pendingMasterAction = 'release';
  document.getElementById("master-prompt-text").innerText = `Liberare ${getRoomName(booking.roomId)} (${booking.guestName})? Inserisci PIN Master:`;
  document.getElementById("master-modal").classList.remove("hidden");
}

function openMasterModal(action) {
  pendingMasterAction = action;
  document.getElementById("master-prompt-text").innerText = "Inserisci il PIN Master per accedere al Registro:";
  document.getElementById("master-modal").classList.remove("hidden");
}

function closeMasterModal() {
  document.getElementById("master-modal").classList.add("hidden");
  document.getElementById("master-pin-input").value = "";
  document.getElementById("master-error").innerText = "";
  targetBookingId = null;
}

function submitMasterPin() {
  if (document.getElementById("master-pin-input").value === CONFIG.MASTER_PIN) {
    const action = pendingMasterAction;
    const bookingId = targetBookingId;
    closeMasterModal();

    if (action === 'release' && bookingId) {
      deleteBooking(bookingId);
    } else if (action === 'report') {
      renderMasterReport();
    }
  } else {
    document.getElementById("master-error").innerText = "PIN Master errato!";
  }
}

// Registro Economico e Stampa Report
function renderMasterReport() {
  document.querySelector(".main-content").classList.add("hidden");
  document.getElementById("master-report-section").classList.remove("hidden");

  const from = document.getElementById("report-date-from").value;
  const to = document.getElementById("report-date-to").value;
  const tbody = document.getElementById("master-table-body");
  tbody.innerHTML = "";

  const filteredBookings = bookings.filter(b => {
    if (!from || !to) return true;
    return (from <= b.checkOut && to >= b.checkIn);
  });

  filteredBookings.forEach(b => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${getRoomName(b.roomId)}</strong></td>
        <td>${b.guestName}</td>
        <td>${b.phone || '-'}</td>
        <td>${b.adults} Ad. ${b.children ? '/ ' + b.children + ' Bimbi' : ''}</td>
        <td>${b.checkIn} ➔ ${b.checkOut} (${b.nights}n)</td>
        <td>€ ${b.rateAdult} / € ${b.rateChild}</td>
        <td><strong>€ ${b.totalPrice.toFixed(2)}</strong></td>
        <td style="color:#2ecc71;">€ ${b.deposit.toFixed(2)}</td>
        <td style="color:#e74c3c;"><strong>€ ${b.balance.toFixed(2)}</strong></td>
        <td class="no-print">
          <button onclick="requestReleaseRoomDirect('${b.id}')" style="background:#e74c3c; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">Elimina</button>
        </td>
      </tr>
    `;
  });
}

function requestReleaseRoomDirect(bookingId) {
  const b = bookings.find(item => item.id === bookingId);
  if (b) requestReleaseRoom(b);
}

function deleteBooking(id) {
  bookings = bookings.filter(b => b.id !== id);
  localStorage.setItem("agri_bookings", JSON.stringify(bookings));
  renderRooms();
  if (!document.getElementById("master-report-section").classList.contains("hidden")) {
    renderMasterReport();
  }
}

// Ritorno al Menu Principale
function closeMasterReport() {
  document.getElementById("master-report-section").classList.add("hidden");
  document.querySelector(".main-content").classList.remove("hidden");
  renderRooms();
}

// Gestione Tariffe Stagionali
function saveSeasonPrice() {
  const start = document.getElementById("season-start").value;
  const end = document.getElementById("season-end").value;
  const adultRate = parseFloat(document.getElementById("season-adult-price").value);
  const childRate = parseFloat(document.getElementById("season-child-price").value) || 0;

  if (!start || !end || isNaN(adultRate)) {
    alert("Inserisci date e tariffa adulto valide!");
    return;
  }

  seasonalPrices.push({ start, end, adultRate, childRate });
  localStorage.setItem("agri_seasons", JSON.stringify(seasonalPrices));
  alert("Tariffa stagionale salvata con successo!");
}

function getRatesForPeriod(dateStr, room) {
  const season = seasonalPrices.find(s => dateStr >= s.start && dateStr <= s.end);
  return {
    adultRate: season ? season.adultRate : room.defaultAdultRate,
    childRate: season ? season.childRate : room.defaultChildRate
  };
}

function getRoomName(roomId) {
  const room = ROOMS.find(r => r.id === roomId);
  return room ? room.name : `Cam. ${roomId}`;
}
