import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotal,
  createBookingReference,
  isValidSeat,
  normaliseSeats,
  parseSeat,
  seatLabels,
  seatLayout,
} from '../src/utils/seats.js';

test('seatLabels builds row-major labels', () => {
  assert.deepEqual(seatLabels(2, 3), ['A1', 'A2', 'A3', 'B1', 'B2', 'B3']);
  assert.equal(seatLabels(8, 10).length, 80);
  assert.equal(seatLabels(8, 10)[0], 'A1');
  assert.equal(seatLabels(8, 10).at(-1), 'H10');
});

test('parseSeat reads normal row and seat numbers', () => {
  assert.deepEqual(parseSeat('c7'), {
    row: 'C',
    rowIndex: 2,
    seatNumber: 7,
    label: 'C7',
  });
  assert.equal(parseSeat('A0'), null);
  assert.equal(parseSeat('1A'), null);
  assert.equal(parseSeat('AB2'), null);
  assert.equal(parseSeat(null), null);
});

test('isValidSeat respects screen bounds', () => {
  assert.equal(isValidSeat('A1', 8, 10), true);
  assert.equal(isValidSeat('H10', 8, 10), true);
  assert.equal(isValidSeat('I1', 8, 10), false);
  assert.equal(isValidSeat('A11', 8, 10), false);
  assert.equal(isValidSeat('0A', 8, 10), false);
  assert.equal(isValidSeat('a1', 8, 10), true);
});

test('normaliseSeats trims, uppercases and removes duplicates', () => {
  assert.deepEqual(normaliseSeats(['a1', ' A1', 'b2']), ['A1', 'B2']);
  assert.deepEqual(normaliseSeats('A1'), []);
  assert.deepEqual(normaliseSeats(undefined), []);
});

test('seatLayout marks booked seats and keeps availability', () => {
  const rows = seatLayout({ rows: 2, seatsPerRow: 2 }, ['A2']);

  assert.deepEqual(rows, [
    {
      row: 'A',
      seats: [
        { label: 'A1', status: 'available' },
        { label: 'A2', status: 'booked' },
      ],
    },
    {
      row: 'B',
      seats: [
        { label: 'B1', status: 'available' },
        { label: 'B2', status: 'available' },
      ],
    },
  ]);
});

test('calculateTotal rounds to two decimals', () => {
  assert.equal(calculateTotal(250, 3), 750);
  assert.equal(calculateTotal(250.5, 3), 751.5);
  assert.equal(calculateTotal(199.999, 1), 200);
  assert.equal(calculateTotal(0, 4), 0);
});

test('createBookingReference produces unique readable codes', () => {
  const references = new Set();

  for (let index = 0; index < 500; index += 1) {
    const reference = createBookingReference();
    assert.match(reference, /^IMO-[A-HJ-NP-Z2-9]{6}$/);
    references.add(reference);
  }

  assert.equal(references.size, 500);
});
