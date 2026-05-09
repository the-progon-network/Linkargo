import React, { useState, useEffect } from 'react';
import { User, Truck, Star, Package, DollarSign, LogOut, Phone, Mail, Edit2, Check } from 'lucide-react';
import Header from '../components/Header';
import { profiles, stats } from '../api';
import { useApp } from '../context/AppContext';
import './Profile.css';

export default function ProfileScreen() {
  const { user, logout, showToast } = useApp();
  const [myStats, setMyStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', company_name: user?.company_name || '' });

  useEffect(() => {
    (async () => {
      try {
        const res = user?.role === 'carrier' ? await stats.carrier() : await stats.shipper();
        setMyStats(res);
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    try {
      await profiles.update(form);
      showToast('Profile updated!', 'success');
      setEditing(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const isCarrier = user?.role === 'carrier';

  return (
    <div className="profile-screen">
      <Header title="My Profile" />

      {/* Avatar block */}
      <div className="profile-hero">
        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
        {editing ? (
          <input className="form-input name-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        ) : (
          <h2 className="profile-name">{user?.name || 'User'}</h2>
        )}
        <div className={`role-badge ${isCarrier ? 'carrier' : 'shipper'}`}>
          {isCarrier ? <Truck size={12} /> : <Package size={12} />}
          {isCarrier ? 'Carrier' : 'Shipper'}
        </div>
        {myStats?.rating && (
          <div className="profile-rating">
            <Star size={14} fill="#FFB400" color="#FFB400" />
            <span>{myStats.rating}</span>
            <span className="review-count">({myStats.review_count || 0} reviews)</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {myStats && (
        <div className="profile-stats">
          {isCarrier ? (
            <>
              <div className="pstat">
                <div className="pstat-val">PKR {Number(myStats.total_revenue || 0).toLocaleString()}</div>
                <div className="pstat-label">Total Earned</div>
              </div>
              <div className="pstat">
                <div className="pstat-val">{myStats.completed_jobs || 0}</div>
                <div className="pstat-label">Completed</div>
              </div>
              <div className="pstat">
                <div className="pstat-val">{myStats.acceptance_rate || '—'}%</div>
                <div className="pstat-label">Win Rate</div>
              </div>
            </>
          ) : (
            <>
              <div className="pstat">
                <div className="pstat-val">{myStats.total_jobs || 0}</div>
                <div className="pstat-label">Jobs Posted</div>
              </div>
              <div className="pstat">
                <div className="pstat-val">{myStats.completed_jobs || 0}</div>
                <div className="pstat-label">Completed</div>
              </div>
              <div className="pstat">
                <div className="pstat-val">PKR {Number(myStats.total_spent || 0).toLocaleString()}</div>
                <div className="pstat-label">Total Spent</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info */}
      <div className="profile-section">
        <div className="section-title-row">
          <h3>Contact Info</h3>
          <button className="edit-btn" onClick={() => editing ? handleSave() : setEditing(true)}>
            {editing ? <><Check size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
          </button>
        </div>

        <div className="info-row">
          <Mail size={16} />
          <span>{user?.email}</span>
        </div>

        {editing ? (
          <div className="info-row editing">
            <Phone size={16} />
            <input className="inline-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
          </div>
        ) : (
          <div className="info-row">
            <Phone size={16} />
            <span>{user?.phone || '—'}</span>
          </div>
        )}

        {!isCarrier && (
          editing ? (
            <div className="info-row editing">
              <Package size={16} />
              <input className="inline-input" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Company name" />
            </div>
          ) : user?.company_name && (
            <div className="info-row">
              <Package size={16} />
              <span>{user.company_name}</span>
            </div>
          )
        )}

        {isCarrier && user?.vehicle_type && (
          <div className="info-row">
            <Truck size={16} />
            <span>{user.vehicle_type?.replace(/_/g, ' ')} · {user.license_plate}</span>
          </div>
        )}
      </div>

      <div className="profile-section">
        <button className="logout-row" onClick={logout}>
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
