const CONFIG = { STAFF_PASS: "max78", MASTER_PIN: "nikita78" };

const ROOMS = [
  { id: "101", name: "101", type: "Quadrupla", cap: 4, defaultPP: 30 },
  { id: "102", name: "102", type: "Tripla", cap: 3, defaultPP: 30 },
  { id: "103", name: "103", type: "Quadrupla", cap: 4, defaultPP: 30 },
  { id: "104", name: "104", type: "Matrimoniale", cap: 2, defaultPP: 35 },
  { id: "105", name: "105", type: "Quadrupla", cap: 4, defaultPP: 30 },
  { id: "106", name: "106", type: "Quadrupla", cap: 4, defaultPP: 30 },
  { id: "107", name: "107", type: "Tripla", cap: 3, defaultPP: 30 },
  { id: "108", name: "108", type: "Matrimoniale", cap: 2, defaultPP: 35 },
  { id: "109", name: "109", type: "Tripla", cap: 3, defaultPP: 30 },
  { id: "spa", name: "SPA", type: "Centro Benessere", cap: 2, defaultPP: 50 }
];

let bookings = JSON.parse(localStorage.getItem("agri_bookings")) || [];
let seasonalPrices = JSON.parse(localStorage.getItem("agri_seasons")) || [];
let pendingAction = null;

// Imposta data odierna di default
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("view-date").value = today;
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

function renderRooms() {
  const selectedDate = document.getElementById("view-date").value;
  const grid = document.getElementById("rooms-grid");
  grid.innerHTML = "";

  ROOMS.forEach(room => {
    // Controlla se la camera è occupata nella data selezionata
    const activeBooking = bookings.find(b => 
      b.roomId === room.id && selectedDate >= b.checkIn && selectedDate < b.checkOut
    );

    const card = document.createElement("div");
    card.className = `room-card ${activeBooking ? 'busy' : 'free'}`;

    if (!activeBooking) {
      card.onclick = () => openBookingModal(room, selectedDate);
      card.innerHTML = `
        <div class="room-number">${room.name}</div>
        <div class="room-type">${room.type}</div>
        <small style="margin-top:5px; font-size:0.7rem;">LIBERA</small>
      `;
    } else {
      card.innerHTML = `
        <div class="room-number">${room.name}</div>
        <div class="room-type">${activeBooking.guestName}</div>
        <small style="margin-top:5px; font-size:0.7rem;">OCCUPATA</small>
      `;
    }
    grid.appendChild(card);
  });
}

function openBookingModal(room, checkInDate) {
  document.getElementById("modal-room-title").innerText = `Prenota Camera ${room.name}`;
  document.getElementById("book-room-id").value = room.id;
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("book-checkin").min = today;
  document.getElementById("book-checkout").min = today;

  document.getElementById("book-checkin").value = checkInDate;
  
  // Calcola Check-out automatico al giorno dopo
  let nextDay = new Date(checkInDate);
  nextDay.setDate(nextDay.getDate() + 1);
  document.getElementById("book-checkout").value = nextDay.toISOString().split('T')[0];

  document.getElementById("booking-modal").classList.remove("hidden");
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.add("hidden");
}

function saveBooking() {
  const roomId = document.getElementById("book-room-id").value;
  const guestName = document.getElementById("book-guest-name").value;
  const guestsCount = parseInt(document.getElementById("book-guests-count").value) || 1;
  const phone = document.getElementById("book-phone").value;
  const checkIn = document.getElementById("book-checkin").value;
  const checkOut = document.getElementById("book-checkout").value;
  const deposit = parseFloat(document.getElementById("book-deposit").value) || 0;
  const notes = document.getElementById("book-notes").value;

  const today = new Date().toISOString().split('T')[0];

  if (!guestName || !checkIn || !checkOut) {
    alert("Compila tutti i campi obbligatori!");
    return;
  }

  // Blocco date retroattive
  if (checkIn < today) {
    alert("Errore: Non puoi inserire una prenotazione con data passata!");
    return;
  }

  if (checkOut <= checkIn) {
    alert("La data di check-out deve essere successiva al check-in!");
    return;
  }

  const room = ROOMS.find(r => r.id === roomId);
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const ratePerPerson = getPriceForPeriod(checkIn, room.defaultPP);
  const totalPrice = ratePerPerson * guestsCount * nights;

  const newBooking = {
    id: Date.now().toString(),
    roomId,
    guestName,
    guestsCount,
    phone,
    checkIn,
    checkOut,
    nights,
    ratePerPerson,
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

function getPriceForPeriod(dateStr, defaultRate) {
  const season = seasonalPrices.find(s => dateStr >= s.start && dateStr <= s.end);
  return season ? season.ratePP : defaultRate;
}

// Gestione Master
function openMasterModal(action) {
  pendingAction = action;
  document.getElementById("master-modal").classList.remove("hidden");
}

function closeMasterModal() {
  document.getElementById("master-modal").classList.add("hidden");
  document.getElementById("master-pin-input").value = "";
  document.getElementById("master-error").innerText = "";
}

function loginMaster() {
  if (document.getElementById("master-pin-input").value === CONFIG.MASTER_PIN) {
    closeMasterModal();
    renderMasterReport();
  } else {
    document.getElementById("master-error").innerText = "PIN Errato!";
  }
}

function renderMasterReport() {
  document.querySelector(".main-content").classList.add("hidden");
  document.getElementById("master-report-section").classList.remove("hidden");

  const tbody = document.getElementById("master-table-body");
  tbody.innerHTML = "";

  bookings.forEach(b => {
    const room = ROOMS.find(r => r.id === b.roomId);
    tbody.innerHTML += `
      <tr>
        <td><strong>${room.name}</strong> (${room.type})</td>
        <td>${b.guestName}</td>
        <td>${b.phone || '-'}</td>
        <td>${b.guestsCount}</td>
        <td>${b.checkIn} / ${b.checkOut} (${b.nights}n)</td>
        <td>€ ${b.totalPrice.toFixed(2)}</td>
        <td style="color:#2ecc71;">€ ${b.deposit.toFixed(2)}</td>
        <td style="color:#e74c3c;"><strong>€ ${b.balance.toFixed(2)}</strong></td>
        <td class="no-print">
          <button onclick="deleteBooking('${b.id}')" style="background:#e74c3c; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">Cancella</button>
        </td>
      </tr>
    `;
  });
}

function deleteBooking(id) {
  if (confirm("Sei sicuro di voler cancellare questa prenotazione?")) {
    bookings = bookings.filter(b => b.id !== id);
    localStorage.setItem("agri_bookings", JSON.stringify(bookings));
    renderMasterReport();
    renderRooms();
  }
}

function closeMasterReport() {
  document.getElementById("master-report-section").classList.add("hidden");
  document.querySelector(".main-content").classList.remove("hidden");
}

function saveSeasonPrice() {
  const start = document.getElementById("season-start").value;
  const end = document.getElementById("season-end").value;
  const ratePP = parseFloat(document.getElementById("season-pp-price").value);

  if (!start || !end || isNaN(ratePP)) {
    alert("Inserisci date e prezzo validi!");
    return;
  }

  seasonalPrices.push({ start, end, ratePP });
  localStorage.setItem("agri_seasons", JSON.stringify(seasonalPrices));
  alert("Tariffa stagionale salvata!");
  renderMasterReport();
}
