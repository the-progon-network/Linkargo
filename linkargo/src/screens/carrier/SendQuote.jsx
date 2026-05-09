import React, { useState } from 'react';
import { X, Send, Clock, DollarSign } from 'lucide-react';
import { quotes } from '../../api';
import { useApp } from '../../context/AppContext';
import './SendQuote.css';

export default function SendQuote({ job, onClose, onSuccess }) {
  const { showToast } = useApp();
  const [form, setForm] = useState({ amount: '', eta_hours: '', note: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) { showToast('Please enter your price', 'error'); return; }
    setLoading(true);
    try {
      await quotes.submit(job.id, { ...form, amount: Number(form.amount), eta_hours: Number(form.eta_hours) });
      showToast('Quote sent! The shipper will review it soon ✅', 'success');
      onSuccess?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="modal-header">
          <div>
            <h2>Send Your Quote</h2>
            <p>{job.pickup_city} → {job.dropoff_city} · {job.goods_type}</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Job summary */}
        <div className="quote-job-summary">
          <div className="qjs-item"><span>Weight</span><strong>{job.weight_kg} kg</strong></div>
          <div className="qjs-item"><span>Vehicle</span><strong>{job.vehicle_type?.replace(/_/g, ' ')}</strong></div>
          <div className="qjs-item"><span>Date</span><strong>{job.required_date}</strong></div>
          {(job.budget_min || job.budget_max) && (
            <div className="qjs-item">
              <span>Budget</span>
              <strong>PKR {job.budget_min?.toLocaleString() || '?'} – {job.budget_max?.toLocaleString() || '?'}</strong>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="quote-form">
          <div className="form-group">
            <label className="form-label">Your Price (PKR)</label>
            <div className="input-icon-wrap">
              <DollarSign size={16} className="input-icon" />
              <input
                className="form-input padded-left"
                type="number"
                placeholder="e.g. 25000"
                value={form.amount}
                onChange={set('amount')}
                required
              />
            </div>
            {job.budget_min && (
              <p className="field-hint">Shipper's budget: PKR {Number(job.budget_min).toLocaleString()} – {Number(job.budget_max).toLocaleString()}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Time (hours)</label>
            <div className="input-icon-wrap">
              <Clock size={16} className="input-icon" />
              <input
                className="form-input padded-left"
                type="number"
                placeholder="e.g. 8"
                value={form.eta_hours}
                onChange={set('eta_hours')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Message to Shipper (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="E.g. I have 2 trips experience on this route, available tomorrow morning..."
              value={form.note}
              onChange={set('note')}
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <div className="spinner" /> : <><Send size={18} /> Send Quote</>}
          </button>
        </form>
      </div>
    </div>
  );
}
