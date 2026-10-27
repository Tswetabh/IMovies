import { useState } from 'react';
import api, { apiMessage } from '../../services/api.js';
import ErrorAlert from '../ErrorAlert.jsx';

const EMPTY_SCREEN = { name: 'Screen 1', rows: 8, seatsPerRow: 10, format: '2D' };

export default function TheatresPanel({ theatres, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', address: '' });
  const [screenForm, setScreenForm] = useState(EMPTY_SCREEN);
  const [addingTo, setAddingTo] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const updateScreen = (field) => (event) =>
    setScreenForm((current) => ({ ...current, [field]: event.target.value }));

  const createTheatre = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api.post('/theatres', {
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        screens: [
          {
            ...screenForm,
            rows: Number(screenForm.rows),
            seatsPerRow: Number(screenForm.seatsPerRow),
          },
        ],
      });

      setForm({ name: '', city: '', address: '' });
      setScreenForm(EMPTY_SCREEN);
      setOpen(false);
      await onRefresh();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not create the theatre.'));
    } finally {
      setBusy(false);
    }
  };

  const addScreen = async (theatre) => {
    setBusy(true);
    setError('');

    try {
      await api.post(`/theatres/${theatre.id}/screens`, {
        ...screenForm,
        rows: Number(screenForm.rows),
        seatsPerRow: Number(screenForm.seatsPerRow),
      });

      setAddingTo(null);
      setScreenForm(EMPTY_SCREEN);
      await onRefresh();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not add the screen.'));
    } finally {
      setBusy(false);
    }
  };

  const removeTheatre = async (theatre) => {
    if (!window.confirm(`Delete "${theatre.name}"?`)) return;
    setError('');

    try {
      await api.delete(`/theatres/${theatre.id}`);
      await onRefresh();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not delete the theatre.'));
    }
  };

  const removeScreen = async (theatre, screen) => {
    if (!window.confirm(`Delete ${screen.name} from ${theatre.name}?`)) return;
    setError('');

    try {
      await api.delete(`/theatres/${theatre.id}/screens/${screen.id}`);
      await onRefresh();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not delete the screen.'));
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <h2>Theatres ({theatres.length})</h2>
        <button
          type="button"
          className="btn btn-gold"
          onClick={() => {
            setOpen((current) => !current);
            setError('');
          }}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" /> New theatre
        </button>
      </div>

      <ErrorAlert message={error} />

      {open && (
        <form className="admin-form" onSubmit={createTheatre}>
          <div className="form-grid">
            <label>
              Theatre name
              <input
                className="form-control"
                required
                value={form.name}
                onChange={update('name')}
                placeholder="PVR Icon, Andheri"
              />
            </label>
            <label>
              City
              <input
                className="form-control"
                required
                value={form.city}
                onChange={update('city')}
                placeholder="Mumbai"
              />
            </label>
            <label>
              Address
              <input
                className="form-control"
                value={form.address}
                onChange={update('address')}
              />
            </label>
          </div>

          <fieldset className="screen-fieldset">
            <legend>First screen</legend>
            <div className="form-grid">
              <label>
                Screen name
                <input
                  className="form-control"
                  required
                  value={screenForm.name}
                  onChange={updateScreen('name')}
                />
              </label>
              <label>
                Rows (A–Z)
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="26"
                  required
                  value={screenForm.rows}
                  onChange={updateScreen('rows')}
                />
              </label>
              <label>
                Seats per row
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="40"
                  required
                  value={screenForm.seatsPerRow}
                  onChange={updateScreen('seatsPerRow')}
                />
              </label>
              <label>
                Format
                <select
                  className="form-select"
                  value={screenForm.format}
                  onChange={updateScreen('format')}
                >
                  {['2D', '3D', 'IMAX', '4DX'].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-gold" disabled={busy}>
              {busy ? 'Saving…' : 'Create theatre'}
            </button>
            <button type="button" className="btn btn-outline-light" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="theatre-admin-grid">
        {theatres.map((theatre) => (
          <article key={theatre.id} className="theatre-admin-card">
            <div className="theatre-admin-head">
              <div>
                <h3>{theatre.name}</h3>
                <p>
                  {theatre.city}
                  {theatre.address ? ` · ${theatre.address}` : ''}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => removeTheatre(theatre)}
              >
                Delete
              </button>
            </div>

            <ul className="screen-list">
              {theatre.screens.map((screen) => (
                <li key={screen.id}>
                  <div>
                    <strong>{screen.name}</strong>
                    <span>
                      {screen.rows} rows × {screen.seatsPerRow} seats · {screen.format} ·{' '}
                      {screen.rows * screen.seatsPerRow} seats
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeScreen(theatre, screen)}
                    aria-label={`Delete ${screen.name}`}
                  >
                    <i className="bi bi-trash" aria-hidden="true" />
                  </button>
                </li>
              ))}
              {theatre.screens.length === 0 && <li className="muted">No screens yet.</li>}
            </ul>

            {addingTo === theatre.id ? (
              <div className="inline-screen-form">
                <div className="form-grid">
                  <label>
                    Name
                    <input
                      className="form-control form-control-sm"
                      value={screenForm.name}
                      onChange={updateScreen('name')}
                    />
                  </label>
                  <label>
                    Rows
                    <input
                      type="number"
                      min="1"
                      max="26"
                      className="form-control form-control-sm"
                      value={screenForm.rows}
                      onChange={updateScreen('rows')}
                    />
                  </label>
                  <label>
                    Seats/row
                    <input
                      type="number"
                      min="1"
                      max="40"
                      className="form-control form-control-sm"
                      value={screenForm.seatsPerRow}
                      onChange={updateScreen('seatsPerRow')}
                    />
                  </label>
                  <label>
                    Format
                    <select
                      className="form-select form-select-sm"
                      value={screenForm.format}
                      onChange={updateScreen('format')}
                    >
                      {['2D', '3D', 'IMAX', '4DX'].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-gold"
                    disabled={busy}
                    onClick={() => addScreen(theatre)}
                  >
                    Add screen
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setAddingTo(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => {
                  setAddingTo(theatre.id);
                  setScreenForm({ ...EMPTY_SCREEN, name: `Screen ${theatre.screens.length + 1}` });
                }}
              >
                <i className="bi bi-plus" aria-hidden="true" /> Add screen
              </button>
            )}
          </article>
        ))}
        {theatres.length === 0 && <p className="muted">No theatres yet.</p>}
      </div>
    </section>
  );
}
