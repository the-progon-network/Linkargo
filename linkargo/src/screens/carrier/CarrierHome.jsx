import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Package, Weight, ChevronRight, Filter, TrendingUp, Zap } from 'lucide-react';
import Header from '../../components/Header';
import { jobs, quotes } from '../../api';
import { useApp } from '../../context/AppContext';
import './CarrierHome.css';

export default function CarrierHome({ onSendQuote }) {
  const { showToast, user } = useApp();
  const [jobList, setJobList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [filters, setFilters] = useState({ city: '', vehicle: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await jobs.list({ vehicle_type: filters.vehicle || undefined });
      setJobList(res.jobs || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOnline) load(); }, [isOnline, filters.vehicle]);

  return (
    <div className="carrier-home">
      <Header title="Browse Loads" />

      {/* Online Toggle */}
      <div className={`online-bar ${isOnline ? 'online' : 'offline'}`}>
        <div className="online-info">
          <div className={`online-dot ${isOnline ? 'active' : ''}`} />
          <span>{isOnline ? 'You are Online — Receiving jobs' : 'You are Offline'}</span>
        </div>
        <button
          className={`toggle-btn ${isOnline ? 'active' : ''}`}
          onClick={() => setIsOnline(s => !s)}
        >
          <span className="toggle-thumb" />
        </button>
      </div>

      {isOnline ? (
        <>
          {/* Filters */}
          <div className="carrier-filters">
            <select
              className="filter-select"
              value={filters.vehicle}
              onChange={e => setFilters(f => ({ ...f, vehicle: e.target.value }))}
            >
              <option value="">All vehicles</option>
              <option value="suzuki">Suzuki Pickup</option>
              <option value="hino_medium">Hino Medium</option>
              <option value="hino_large">Hino Large</option>
              <option value="container_20">Container 20ft</option>
              <option value="container_40">Container 40ft</option>
              <option value="flatbed">Flatbed</option>
              <option value="reefer">Refrigerated</option>
            </select>
            <input
              className="filter-input"
              placeholder="Filter by city..."
              value={filters.city}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
            />
          </div>

          {/* Stats bar */}
          <div className="carrier-stats">
            <div className="cstat">
              <TrendingUp size={16} />
              <span>{jobList.length} loads available</span>
            </div>
            <div className="cstat">
              <Zap size={16} />
              <span>Respond fast to win!</span>
            </div>
          </div>

          {/* Jobs */}
          <div className="carrier-jobs">
            {loading ? (
              <div className="loading-state">
                <div className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
                <p>Finding loads near you...</p>
              </div>
            ) : jobList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🚛</div>
                <div className="empty-state-title">No loads right now</div>
                <div className="empty-state-text">Check back in a few minutes or adjust your filters</div>
              </div>
            ) : (
              jobList
                .filter(j => !filters.city || j.pickup_city?.toLowerCase().includes(filters.city.toLowerCase()) || j.dropoff_city?.toLowerCase().includes(filters.city.toLowerCase()))
                .map(job => (
                  <CarrierJobCard key={job.id} job={job} onSendQuote={onSendQuote} />
                ))
            )}
          </div>
        </>
      ) : (
        <div className="offline-screen">
          <div className="offline-icon">📴</div>
          <h2>You're Offline</h2>
          <p>Toggle online to start receiving job requests from shippers</p>
          <button className="btn btn-primary btn-lg" onClick={() => setIsOnline(true)}>Go Online</button>
        </div>
      )}
    </div>
  );
}

function CarrierJobCard({ job, onSendQuote }) {
  return (
    <div className="carrier-job-card">
      <div className="cjc-header">
        <div className="cjc-goods">
          <Package size={15} />
          <span>{job.goods_type}</span>
        </div>
        <span className="cjc-time">
          <Clock size={12} />
          {timeAgo(job.created_at)}
        </span>
      </div>

      <div className="cjc-route">
        <div className="cjc-city">
          <span className="city-dot pickup" />
          <div>
            <div className="city-name">{job.pickup_city}</div>
            {job.pickup_address && <div className="city-addr">{job.pickup_address}</div>}
          </div>
        </div>
        <div className="cjc-arrow">→</div>
        <div className="cjc-city">
          <span className="city-dot dropoff" />
          <div>
            <div className="city-name">{job.dropoff_city}</div>
            {job.dropoff_address && <div className="city-addr">{job.dropoff_address}</div>}
          </div>
        </div>
      </div>

      <div className="cjc-chips">
        <span className="chip">{job.weight_kg} kg</span>
        <span className="chip">{job.vehicle_type?.replace(/_/g, ' ')}</span>
        <span className="chip">📅 {job.required_date}</span>
        {job.addons?.length > 0 && <span className="chip">+{job.addons.length} add-ons</span>}
      </div>

      {(job.budget_min || job.budget_max) && (
        <div className="cjc-budget">
          Budget: PKR {job.budget_min?.toLocaleString() || '?'} – {job.budget_max?.toLocaleString() || '?'}
        </div>
      )}

      <div className="cjc-footer">
        <span className="bids-info">{job.quote_count || 0} quotes sent</span>
        <button className="btn btn-primary btn-sm send-quote-btn" onClick={() => onSendQuote(job)}>
          Send Quote →
        </button>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
