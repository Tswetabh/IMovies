export default function SeatGrid({ rows, selected = [], onToggle }) {
  const selectedSet = new Set(selected);

  return (
    <div className="seat-area">
      <div className="screen-curve">
        <span>SCREEN</span>
      </div>

      <div className="seat-rows">
        {rows.map(({ row, seats }) => (
          <div className="seat-row" key={row}>
            <span className="row-label" aria-hidden="true">
              {row}
            </span>

            <div
              className="seat-row-seats"
              style={{ gridTemplateColumns: `repeat(${seats.length}, minmax(22px, 1fr))` }}
            >
              {seats.map((seat) => {
                const isSelected = selectedSet.has(seat.label);
                const isBooked = seat.status === 'booked';
                const state = isBooked ? 'booked' : isSelected ? 'selected' : 'available';

                return (
                  <button
                    key={seat.label}
                    type="button"
                    className={`seat seat-${state}`}
                    disabled={isBooked}
                    aria-pressed={isSelected}
                    aria-label={`Seat ${seat.label}, ${state}`}
                    title={`${seat.label} · ${state}`}
                    onClick={() => onToggle(seat.label)}
                  >
                    {seat.label.slice(1)}
                  </button>
                );
              })}
            </div>

            <span className="row-label" aria-hidden="true">
              {row}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
