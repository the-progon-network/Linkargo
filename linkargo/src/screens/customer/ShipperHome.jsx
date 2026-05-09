import React, { useState, useEffect } from 'react';
import { Plus, Package, ChevronRight, TrendingUp, Clock } from 'lucide-react';
import Header from '../../components/Header';
import { jobs, stats } from '../../api';
import { useApp } from '../../context/AppContext';
import './ShipperHome.css';

export default function ShipperHome({ onTabChange }) {
  const { user, showToast } = useApp();
  const [recentJobs, setRecentJobs] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [jRes, sRes] = await Promise.all([jobs.myJobs(), stats.shipper()]);
        setRecentJobs((jRes.jobs || []).slice(0, 3));
        setMyStats(sRes);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="shipper-home">
      <Header title={`Hi, ${user?.name?.split(' ')[0] || 'there'} 👋`} subtitle="Ready to ship something?" />

      {/* Hero CTA */}
      <div className="hero-card" onClick={() => onTabChange('post')}>
        <div className="hero-left">
          <h2>Ship something</h2>
          <p>Post a load &amp; get instant quotes from verified carriers</p>
          <div className="hero-btn">
            <Plus size={16} /> Post a Load
          </div>
        </div>
        <div className="hero-truck">🚛</div>
      </div>

      {/* Stats */}
      {myStats && (
        <div className="home-stats">
          <div className="hs-card">
            <Package size={20} />
            <div className="hs-val">{myStats.total_jobs || 0}</div>
            <div className="hs-label">Total Jobs</div>
          </div>
          <div className="hs-card">
            <TrendingUp size={20} />
            <div className="hs-val">{myStats.active_jobs || 0}</div>
            <div className="hs-label">Active</div>
          </div>
          <div className="hs-card">
            <Clock size={20} />
            <div className="hs-val">{myStats.pending_quotes || 0}</div>
            <div className="hs-label">New Quotes</div>
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div className="home-section">
        <div className="home-section-header">
          <h3>Recent Shipments</h3>
          <button className="see-all-btn" onClick={() => onTabChange('my-jobs')}>
            See all <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : recentJobs.length === 0 ? (
          <div className="home-empty">
            <p>No shipments yet. Post your first load!</p>
            <button className="btn btn-outline btn-sm" onClick={() => onTabChange('post')}>
              <Plus size={14} /> Post a Load
            </button>
          </div>
        ) : (
          recentJobs.map(job => (
            <div key={job.id} className="recent-job-card" onClick={() => onTabChange('my-jobs')}>
              <div className="rjc-left">
                <div className="rjc-route">{job.pickup_city} → {job.dropoff_city}</div>
                <div className="rjc-goods">{job.goods_type} · {job.weight_kg} kg</div>
              </div>
              <div className="rjc-right">
                {job.quote_count > 0 && (
                  <span className="rjc-quotes">{job.quote_count} quotes</span>
                )}
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* How it works */}
      <div className="home-section">
        <h3 className="how-title">How Linkargo Works</h3>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-num">1</div>
            <div>
              <strong>Post a Load</strong>
              <p>Describe your cargo, route & vehicle type</p>
            </div>
          </div>
          <div className="how-step">
            <div className="how-num">2</div>
            <div>
              <strong>Receive Quotes</strong>
              <p>Verified carriers send you competitive prices</p>
            </div>
          </div>
          <div className="how-step">
            <div className="how-num">3</div>
            <div>
              <strong>Hire & Ship</strong>
              <p>Accept the best quote and your cargo is on its way</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
