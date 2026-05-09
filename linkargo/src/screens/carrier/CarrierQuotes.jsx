import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';
import Header from '../../components/Header';
import { quotes, stats } from '../../api';
import { useApp } from '../../context/AppContext';
import './CarrierQuotes.css';

export default function CarrierQuotes() {
  const { showToast } = useApp();
  const [myQuotes, setMyQuotes] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [qRes, sRes] = await Promise.all([quotes.myQuotes(), stats.carrier()]);
        setMyQuotes(qRes.quotes || []);
        setMyStats(sRes);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="carrier-quotes-screen">
      <Header title="My Quotes & Earnings" />

      {/* Stats */}
      {myStats && (
        <div className="earnings-strip">
          <div className="earn-card">
            <DollarSign size={18} />
            <div>
              <div className="earn-val">PKR {Number(myStats.total_revenue || 0).toLocaleString()}</div>
              <div className="earn-label">Total Earned</div>
            </div>
          </div>
          <div className="earn-card">
            <CheckCircle size={18} />
            <div>
              <div className="earn-val">{myStats.completed_jobs || 0}</div>
              <div className="earn-label">Completed</div>
            </div>
          </div>
          <div className="earn-card">
            <TrendingUp size={18} />
            <div>
              <div className="earn-val">{myStats.acceptance_rate || '—'}%</div>
              <div className="earn-label">Win Rate</div>
            </div>
          </div>
        </div>
      )}

      <div className="carrier-quotes-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : myQuotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No quotes sent yet</div>
            <div className="empty-state-text">Browse loads and send quotes to start earning</div>
          </div>
        ) : (
          myQuotes.map(q => (
            <div key={q.id} className={`my-quote-card status-${q.status}`}>
              <div className="mqc-header">
                <div className="mqc-route">
                  {q.job?.pickup_city} → {q.job?.dropoff_city}
                </div>
                <StatusBadge status={q.status} />
              </div>
              <div className="mqc-goods">{q.job?.goods_type} · {q.job?.weight_kg} kg</div>
              <div className="mqc-price">PKR {q.amount?.toLocaleString()}</div>
              {q.note && <div className="mqc-note">"{q.note}"</div>}
              <div className="mqc-time">
                <Clock size={12} />
                Sent {timeAgo(q.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: ['badge-warning', 'Pending'],
    accepted: ['badge-success', '✓ Accepted'],
    rejected: ['badge-error', 'Declined'],
  };
  const [cls, label] = map[status] || ['badge-info', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
