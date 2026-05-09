import React, { useState, useEffect } from 'react';
import { MapPin, Clock, ChevronRight, Package, RefreshCw } from 'lucide-react';
import Header from '../../components/Header';
import { jobs, quotes } from '../../api';
import { useApp } from '../../context/AppContext';
import './MyJobs.css';

const STATUS_COLORS = {
  open: 'badge-success',
  in_progress: 'badge-info',
  completed: 'badge-primary',
  cancelled: 'badge-error',
};

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Done',
  cancelled: 'Cancelled',
};

export default function MyJobs({ onViewQuotes }) {
  const { showToast } = useApp();
  const [jobList, setJobList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open');

  const load = async () => {
    setLoading(true);
    try {
      const res = await jobs.myJobs();
      setJobList(res.jobs || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = jobList.filter(j => {
    if (tab === 'open') return j.status === 'open';
    if (tab === 'active') return j.status === 'in_progress';
    if (tab === 'done') return ['completed', 'cancelled'].includes(j.status);
    return true;
  });

  return (
    <div className="my-jobs-screen">
      <Header
        title="My Shipments"
        actions={
          <button className="icon-btn" onClick={load}>
            <RefreshCw size={16} />
          </button>
        }
      />

      <div className="jobs-tabs">
        {[['open', 'Accepting'], ['active', 'In Progress'], ['done', 'Completed']].map(([k, label]) => (
          <button key={k} className={`jobs-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {label}
            {k === 'open' && jobList.filter(j => j.status === 'open').length > 0 && (
              <span className="tab-count">{jobList.filter(j => j.status === 'open').length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="jobs-list-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p>Loading your shipments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No shipments yet</div>
            <div className="empty-state-text">Post a load to start receiving quotes from carriers</div>
          </div>
        ) : (
          filtered.map(job => (
            <JobCard key={job.id} job={job} onViewQuotes={onViewQuotes} />
          ))
        )}
      </div>
    </div>
  );
}

function JobCard({ job, onViewQuotes }) {
  return (
    <div className="job-card-item" onClick={() => onViewQuotes(job)}>
      <div className="jc-header">
        <div className="jc-goods">
          <Package size={16} />
          <span>{job.goods_type}</span>
        </div>
        <span className={`badge ${STATUS_COLORS[job.status] || 'badge-info'}`}>
          {STATUS_LABELS[job.status] || job.status}
        </span>
      </div>

      <div className="jc-route">
        <div className="jc-city">
          <span className="city-dot pickup" />
          <span>{job.pickup_city}</span>
        </div>
        <div className="route-arrow">→</div>
        <div className="jc-city">
          <span className="city-dot dropoff" />
          <span>{job.dropoff_city}</span>
        </div>
      </div>

      <div className="jc-meta">
        <span className="meta-chip"><Clock size={12} /> {new Date(job.created_at).toLocaleDateString()}</span>
        <span className="meta-chip">{job.weight_kg} kg</span>
        <span className="meta-chip">{job.vehicle_type?.replace(/_/g, ' ')}</span>
      </div>

      <div className="jc-footer">
        <div className="quotes-badge">
          <span className="quotes-count">{job.quote_count || 0}</span>
          <span>quote{job.quote_count !== 1 ? 's' : ''} received</span>
        </div>
        <div className="view-quotes">
          View quotes <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}
