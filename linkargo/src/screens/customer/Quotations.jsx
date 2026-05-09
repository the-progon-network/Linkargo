import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Truck, Clock, Phone, MessageCircle, Check, X, Shield } from 'lucide-react';
import { quotes } from '../../api';
import { useApp } from '../../context/AppContext';
import './Quotations.css';

export default function Quotations({ job, onBack, onChat }) {
  const { showToast } = useApp();
  const [quoteList, setQuoteList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await quotes.listForJob(job.id);
        setQuoteList(res.quotes || []);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [job.id]);

  const handleAccept = async (quoteId) => {
    setAccepting(quoteId);
    try {
      await quotes.accept(quoteId);
      showToast('Quote accepted! Carrier has been notified 🎉', 'success');
      setQuoteList(prev => prev.map(q => ({
        ...q,
        status: q.id === quoteId ? 'accepted' : 'rejected',
      })));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (quoteId) => {
    try {
      await quotes.reject(quoteId);
      setQuoteList(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'rejected' } : q));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const lowestPrice = quoteList.length > 0 ? Math.min(...quoteList.map(q => q.amount)) : null;

  return (
    <div className="quotations-screen">
      {/* Header */}
      <div className="quotes-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={20} /></button>
        <div>
          <h1>{job.pickup_city} → {job.dropoff_city}</h1>
          <p>{job.goods_type} · {job.weight_kg} kg</p>
        </div>
      </div>

      {/* Summary bar */}
      {quoteList.length > 0 && (
        <div className="quotes-summary">
          <div className="qs-item">
            <span className="qs-val">{quoteList.length}</span>
            <span className="qs-label">Quotes</span>
          </div>
          <div className="qs-divider" />
          <div className="qs-item">
            <span className="qs-val">PKR {lowestPrice?.toLocaleString()}</span>
            <span className="qs-label">Lowest</span>
          </div>
          <div className="qs-divider" />
          <div className="qs-item">
            <span className="qs-val">{quoteList.filter(q => q.carrier?.verified).length}</span>
            <span className="qs-label">Verified</span>
          </div>
        </div>
      )}

      <div className="quotes-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <p>Loading quotes...</p>
          </div>
        ) : quoteList.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 24px' }}>
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-title">No quotes yet</div>
            <div className="empty-state-text">Carriers will start sending quotes shortly. Check back in a few minutes.</div>
          </div>
        ) : (
          quoteList
            .sort((a, b) => a.amount - b.amount)
            .map((q, idx) => (
              <QuoteCard
                key={q.id}
                quote={q}
                isBest={q.amount === lowestPrice}
                isFirst={idx === 0}
                onAccept={() => handleAccept(q.id)}
                onReject={() => handleReject(q.id)}
                onChat={() => onChat?.(q)}
                accepting={accepting === q.id}
              />
            ))
        )}
      </div>
    </div>
  );
}

function QuoteCard({ quote, isBest, onAccept, onReject, onChat, accepting }) {
  const carrier = quote.carrier || {};
  const isPending = quote.status === 'pending';
  const isAccepted = quote.status === 'accepted';
  const isRejected = quote.status === 'rejected';

  return (
    <div className={`quote-card ${isBest && isPending ? 'best' : ''} ${isAccepted ? 'accepted' : ''} ${isRejected ? 'rejected' : ''}`}>
      {isBest && isPending && (
        <div className="best-tag">⭐ Best Price</div>
      )}
      {isAccepted && <div className="best-tag accepted-tag">✓ Accepted</div>}

      <div className="qc-top">
        <div className="carrier-info">
          <div className="carrier-avatar">{carrier.name?.[0] || 'C'}</div>
          <div className="carrier-details">
            <div className="carrier-name">
              {carrier.name || 'Carrier'}
              {carrier.verified && <Shield size={13} className="verified-icon" />}
            </div>
            <div className="carrier-meta">
              <Star size={12} fill="#FFB400" color="#FFB400" />
              <span>{carrier.rating || '—'}</span>
              <span className="dot-sep">·</span>
              <span>{carrier.trips_completed || 0} trips</span>
            </div>
          </div>
        </div>
        <div className="quote-price">
          <span className="price-val">PKR {quote.amount?.toLocaleString()}</span>
        </div>
      </div>

      <div className="qc-details">
        <div className="qd-item">
          <Truck size={13} />
          <span>{carrier.vehicle_type?.replace(/_/g, ' ') || '—'}</span>
        </div>
        <div className="qd-item">
          <Clock size={13} />
          <span>ETA: {quote.eta_hours || '—'} hrs</span>
        </div>
      </div>

      {quote.note && (
        <div className="quote-note">"{quote.note}"</div>
      )}

      {isPending && (
        <div className="quote-actions">
          <button className="btn btn-ghost btn-sm" onClick={onChat}>
            <MessageCircle size={15} /> Chat
          </button>
          <button className="btn btn-ghost btn-sm reject-btn" onClick={onReject}>
            <X size={15} /> Decline
          </button>
          <button className="btn btn-primary btn-sm accept-btn" onClick={onAccept} disabled={accepting}>
            {accepting ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <><Check size={15} /> Accept</>}
          </button>
        </div>
      )}

      {isRejected && (
        <div className="rejected-label">Declined</div>
      )}
    </div>
  );
}
