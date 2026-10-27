export const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function seatLabels(rows, seatsPerRow) {
  const labels = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber += 1) {
      labels.push(`${ROW_LABELS[rowIndex]}${seatNumber}`);
    }
  }

  return labels;
}

export function parseSeat(label) {
  if (typeof label !== 'string') return null;

  const match = /^([A-Z])([1-9][0-9]?)$/.exec(label.trim().toUpperCase());
  if (!match) return null;

  return {
    row: match[1],
    rowIndex: ROW_LABELS.indexOf(match[1]),
    seatNumber: Number(match[2]),
    label: `${match[1]}${match[2]}`,
  };
}

export function isValidSeat(label, rows, seatsPerRow) {
  const seat = parseSeat(label);
  if (!seat) return false;

  return (
    seat.rowIndex >= 0 &&
    seat.rowIndex < rows &&
    seat.seatNumber >= 1 &&
    seat.seatNumber <= seatsPerRow
  );
}

export function normaliseSeats(seats) {
  if (!Array.isArray(seats)) return [];

  return [...new Set(seats.map((seat) => String(seat).trim().toUpperCase()))];
}

export function seatLayout(screen, bookedSeats = []) {
  const booked = new Set(bookedSeats.map((seat) => String(seat).toUpperCase()));
  const rows = [];

  for (let rowIndex = 0; rowIndex < screen.rows; rowIndex += 1) {
    const row = ROW_LABELS[rowIndex];
    const seats = [];

    for (let seatNumber = 1; seatNumber <= screen.seatsPerRow; seatNumber += 1) {
      const label = `${row}${seatNumber}`;
      seats.push({
        label,
        status: booked.has(label) ? 'booked' : 'available',
      });
    }

    rows.push({ row, seats });
  }

  return rows;
}

export function calculateTotal(ticketPrice, seatCount) {
  return Math.round(Number(ticketPrice) * seatCount * 100) / 100;
}

export function createBookingReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `IMO-${suffix}`;
}
