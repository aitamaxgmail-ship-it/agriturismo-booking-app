const CONFIG = { STAFF_PASS: "max78", MASTER_PIN: "nikita78" };

const ROOMS = [
  { id: "101", name: "Camera 101", type: "Quadrupla", cap: 4, basePrice: 120 },
  { id: "102", name: "Camera 102", type: "Tripla", cap: 3, basePrice: 90 },
  { id: "103", name: "Camera 103", type: "Quadrupla", cap: 4, basePrice: 120 },
  { id: "104", name: "Camera 104", type: "Matrimoniale", cap: 2, basePrice: 70 },
  { id: "105", name: "Camera 105", type: "Quadrupla", cap: 4, basePrice: 120 },
  { id: "106", name: "Camera 106", type: "Quadrupla", cap: 4, basePrice: 120 },
  { id: "107", name: "Camera 107", type: "Tripla", cap: 3, basePrice: 90 },
  { id: "108", name: "Camera 108", type: "Matrimoniale", cap: 2, basePrice: 70 },
  { id: "109", name: "Camera 109", type: "Tripla", cap: 3, basePrice: 90 },
  { id: "spa", name: "Centro Benessere", type: "SPA / Camera Matrimoniale", cap: 2, basePrice: 100 }
];

let bookings = JSON.parse(localStorage.getItem("agri_bookings")) || [];
let seasonalPrices = JSON.parse(localStorage.getItem("agri_seasons")) || [];

function loginStaff() {
  if (document.getElementById("staff-pass-input").value === CONFIG.STAFF_PASS) {
    document.getElementById("login-modal").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    populateRoomSelect();
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
    card.className = "card";
    
    let statusHTML = `<span class="status-badge status-free">Libera</span>`;
    let detailsHTML = `<p><strong>Capienza max:</strong> ${room.cap} persone</p>`;
    
    if (activeBooking) {
      statusHTML = `<span class="status-badge status-busy">Occupata</span>`;
      detailsHTML = `
        <p><strong>Ospite:</strong> ${activeBooking.guestName}</p>
        <p><strong>Presenze:</strong> ${activeBooking.guestsCount} persone</p>
        <p><strong>Dal:</strong> ${activeBooking.checkIn} <strong>Al:</strong> ${activeBooking.checkOut}</p>
        <button onclick="deleteBooking('${activeBooking.id}')" style="margin-top:10px; background:#d32f2f; color:white;">Cancella</button>
      `;
    }

    card.innerHTML = `
      <h3>${room.name} (${room.type})</h3>
      ${statusHTML}
      <div style="margin-top:10px;">${detailsHTML}</div>
    `;
    grid.appendChild(card);
  });
}

function openBookingModal() { document.getElementById("booking-modal").classList.remove("hidden"); }
function closeBookingModal() { document.getElementById("booking-modal").classList.add("hidden"); }

function populateRoomSelect() {
  const select = document.getElementById("book-room-id");
  select.innerHTML = "";
  ROOMS.forEach(r => select.innerHTML += `<option value="${r.id}">${r.name} - ${r.type}</option>`);
}

function saveBooking() {
  const newBooking = {
    id: Date.now().toString(),
    roomId: document.getElementById("book-room-id").value,
    guestName: document.getElementById("book-guest-name").value,
    guestsCount: parseInt(document.getElementById("book-guests-count").value) || 1,
    checkIn: document.getElementById("book-checkin").value,
    checkOut: document.getElementById("book-checkout").value
  };

  if(!newBooking.guestName || !newBooking.checkIn || !newBooking.checkOut) {
    alert("Compila tutti i campi!");
    return;
  }

  bookings.push(newBooking);
  localStorage.setItem("agri_bookings", JSON.stringify(bookings));
  closeBookingModal();
  renderRooms();
}

function deleteBooking(id) {
  bookings = bookings.filter(b => b.id !== id);
  localStorage.setItem("agri_bookings", JSON.stringify(bookings));
  renderRooms();
}

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
  let totalSum = 0;

  ROOMS.forEach(room => {
    const b = bookings.find(item => item.roomId === room.id);
    let totalRoom = room.basePrice;
    let perPerson = b ? (totalRoom / b.guestsCount).toFixed(2) : "-";

    if(b) totalSum += totalRoom;

    tbody.innerHTML += `
      <tr>
        <td><strong>${room.name}</strong> (${room.type})</td>
        <td>${b ? b.guestName : "<em>Nessuna</em>"}</td>
        <td>${b ? b.guestsCount : "-"}</td>
        <td>${b ? `${b.checkIn} / ${b.checkOut}` : "-"}</td>
        <td>€ ${b ? totalRoom.toFixed(2) : "0.00"}</td>
        <td><strong>€ ${perPerson}</strong></td>
      </tr>
    `;
  });

  document.getElementById("grand-total").innerHTML = `<strong>€ ${totalSum.toFixed(2)}</strong>`;
}

function closeMasterReport() {
  document.getElementById("master-report-section").classList.add("hidden");
  document.getElementById("rooms-grid").classList.remove("hidden");
}
