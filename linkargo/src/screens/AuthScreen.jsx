import React, { useState } from 'react';
import { Truck, Package, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { auth } from '../api';
import { useApp } from '../context/AppContext';
import './Auth.css';

export default function AuthScreen() {
  const { login, setToken, showToast } = useApp();
  const [mode, setMode] = useState('login'); // login | register
  const [role, setRole] = useState('shipper');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    company_name: '', vehicle_type: '', license_plate: '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await auth.login({ email: form.email, password: form.password });
      } else {
        res = await auth.register({ ...form, role });
      }
      setToken(res.token);
      login(res.user);
      showToast(`Welcome${res.user.name ? ', ' + res.user.name.split(' ')[0] : ''}! 👋`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-logo">Link<span>argo</span></div>
        <p className="auth-tagline">Pakistan's freight marketplace</p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
          <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Register</button>
        </div>

        {mode === 'register' && (
          <div className="role-picker">
            <button
              className={`role-btn ${role === 'shipper' ? 'active' : ''}`}
              onClick={() => setRole('shipper')}
            >
              <Package size={24} />
              <span>I need to ship</span>
              <small>Post loads & get quotes</small>
            </button>
            <button
              className={`role-btn ${role === 'carrier' ? 'active' : ''}`}
              onClick={() => setRole('carrier')}
            >
              <Truck size={24} />
              <span>I'm a carrier</span>
              <small>Browse jobs & earn</small>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Muhammad Ali" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" placeholder="03xx-xxxxxxx" value={form.phone} onChange={set('phone')} required />
              </div>
              {role === 'shipper' && (
                <div className="form-group">
                  <label className="form-label">Company Name (optional)</label>
                  <input className="form-input" placeholder="ABC Traders" value={form.company_name} onChange={set('company_name')} />
                </div>
              )}
              {role === 'carrier' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Vehicle Type</label>
                    <select className="form-select" value={form.vehicle_type} onChange={set('vehicle_type')} required>
                      <option value="">Select vehicle</option>
                      <option>Suzuki Pickup</option>
                      <option>Hino Medium (1-5 ton)</option>
                      <option>Hino Large (5-10 ton)</option>
                      <option>Container (20ft)</option>
                      <option>Container (40ft)</option>
                      <option>Flatbed</option>
                      <option>Refrigerated Truck</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Plate</label>
                    <input className="form-input" placeholder="ABC-1234" value={form.license_plate} onChange={set('license_plate')} required />
                  </div>
                </>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="pass-wrap">
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={set('password')}
                required
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <div className="spinner" /> : (
              <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <p className="auth-hint">
          {mode === 'login' ? "Don't have an account? " : "Already registered? "}
          <button className="link-btn" onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register here' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
