import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Search, X, Check } from 'lucide-react';
import Header from '../../components/Header';
import { jobs } from '../../api';
import { useApp } from '../../context/AppContext';
import './PostJob.css';

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Hyderabad', 'Peshawar', 'Quetta', 'Sialkot',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Dera Ghazi Khan',
  'Gujrat', 'Sahiwal', 'Wah Cantt', 'Mardan', 'Kasur',
  'Okara', 'Mingora', 'Nawabshah', 'Mirpur Khas', 'Abbottabad',
  'Muzaffarabad', 'Gilgit', 'Turbat', 'Khuzdar', 'Hub',
  'Jacobabad', 'Shikarpur', 'Dadu', 'Nowshera', 'Kohat',
  'Bannu', 'Dera Ismail Khan', 'Chakwal', 'Jhelum', 'Attock',
  'Mandi Bahauddin', 'Hafizabad', 'Chiniot', 'Khanewal', 'Pakpattan',
];

const GOODS_CATEGORIES = [
  {
    label: 'Household & Moving',
    items: [
      { id: 'furniture', label: 'Furniture', icon: '🛋️' },
      { id: 'home_shifting', label: 'Home Shifting', icon: '🏠' },
      { id: 'appliances', label: 'Appliances', icon: '📺' },
      { id: 'office_shifting', label: 'Office Shifting', icon: '🏢' },
    ],
  },
  {
    label: 'Food & Agriculture',
    items: [
      { id: 'food_grocery', label: 'Food / Grocery', icon: '🛒' },
      { id: 'fruits_vegetables', label: 'Fruits & Vegetables', icon: '🥦' },
      { id: 'grains_wheat', label: 'Grains / Wheat', icon: '🌾' },
      { id: 'cotton_bales', label: 'Cotton Bales', icon: '☁️' },
      { id: 'cattle', label: 'Cattle / Livestock', icon: '🐄' },
      { id: 'poultry', label: 'Poultry', icon: '🐔' },
      { id: 'cold_chain', label: 'Cold Chain / Dairy', icon: '🧊' },
    ],
  },
  {
    label: 'Industrial & Construction',
    items: [
      { id: 'steel_iron', label: 'Steel / Iron', icon: '⚙️' },
      { id: 'cement', label: 'Cement / Concrete', icon: '🧱' },
      { id: 'construction_material', label: 'Construction Material', icon: '🏗️' },
      { id: 'machinery', label: 'Machinery', icon: '🔩' },
      { id: 'chemicals', label: 'Chemicals', icon: '🧪' },
      { id: 'oil_fuel', label: 'Oil / Fuel', icon: '🛢️' },
      { id: 'tyres', label: 'Tyres / Auto Parts', icon: '🔧' },
    ],
  },
  {
    label: 'Textiles & Retail',
    items: [
      { id: 'garments_fabric', label: 'Garments / Fabric', icon: '👕' },
      { id: 'electronics', label: 'Electronics', icon: '📱' },
      { id: 'medicines', label: 'Medicines / Pharma', icon: '💊' },
      { id: 'paper_books', label: 'Paper / Books', icon: '📦' },
      { id: 'other', label: 'Other', icon: '📫' },
    ],
  },
];

const VEHICLE_TYPES = [
  { id: 'motorcycle_loader', label: 'Motorcycle Loader', icon: '🏍️', capacity: 'Up to 200 kg' },
  { id: 'shehzore', label: 'Shehzore / Ravi', icon: '🛺', capacity: '200–700 kg' },
  { id: 'suzuki_pickup', label: 'Suzuki Pickup', icon: '🛻', capacity: 'Up to 1 ton' },
  { id: 'mazda', label: 'Mazda / Loader', icon: '🚐', capacity: '1–2 tons' },
  { id: 'hino_medium', label: 'Hino Medium', icon: '🚛', capacity: '2–5 tons' },
  { id: 'hino_large', label: 'Hino Large', icon: '🚚', capacity: '5–10 tons' },
  { id: 'container_20', label: 'Container 20ft', icon: '📦', capacity: '10–18 tons' },
  { id: 'container_40', label: 'Container 40ft', icon: '🏗️', capacity: '18–28 tons' },
  { id: 'flatbed', label: 'Flatbed / Low Bed', icon: '🚜', capacity: 'Heavy / OOG' },
  { id: 'oil_tanker', label: 'Oil Tanker', icon: '🛢️', capacity: 'Liquids / Fuel' },
  { id: 'reefer', label: 'Refrigerated Truck', icon: '❄️', capacity: 'Cold Chain' },
  { id: 'cattle_carrier', label: 'Cattle Carrier', icon: '🐄', capacity: 'Livestock' },
];

const ADDONS = [
  { id: 'labour', label: 'Loading Labour', icon: '💪' },
  { id: 'insurance', label: 'Cargo Insurance', icon: '🛡️' },
  { id: 'tracking', label: 'GPS Tracking', icon: '📍' },
  { id: 'packaging', label: 'Packaging Material', icon: '📦' },
  { id: 'fragile', label: 'Fragile Handling', icon: '⚠️' },
  { id: 'express', label: 'Express Delivery', icon: '⚡' },
];

const BUDGET_PRESETS = [
  { label: 'Under 5K', min: 0, max: 5000 },
  { label: '5K–15K', min: 5000, max: 15000 },
  { label: '15K–30K', min: 15000, max: 30000 },
  { label: '30K–50K', min: 30000, max: 50000 },
  { label: '50K–100K', min: 50000, max: 100000 },
  { label: '100K+', min: 100000, max: '' },
];

const STEPS = ['Route', 'Cargo', 'Vehicle', 'Review'];

function CitySearch({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = query.length > 0
    ? PAKISTAN_CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : PAKISTAN_CITIES.slice(0, 6);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (city) => {
    setQuery(city);
    onChange(city);
    setOpen(false);
  };

  return (
    <div className="form-group" ref={ref} style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 15 }}>🔍</span>
        <input
          className="form-input"
          style={{ paddingLeft: 36 }}
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 16 }}
            onClick={() => { setQuery(''); onChange(''); }}>✕</button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, background: 'white',
          border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-md)',
          zIndex: 999, boxShadow: 'var(--shadow-md)', overflow: 'hidden', marginTop: 4,
        }}>
          {filtered.map(city => (
            <div
              key={city}
              onClick={() => select(city)}
              style={{
                padding: '11px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <span>📍</span> {city}
              {city === value && <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostJob({ onBack, onSuccess }) {
  const { showToast } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [goodsSearch, setGoodsSearch] = useState('');

  const [form, setForm] = useState({
    pickup_city: '',
    pickup_address: '',
    dropoff_city: '',
    dropoff_address: '',
    goods_type: '',
    weight_kg: '',
    description: '',
    vehicle_type: '',
    required_date: '',
    addons: [],
    budget_min: '',
    budget_max: '',
    budget_preset: '',
  });

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const toggleAddon = (id) => {
    setForm(f => ({
      ...f,
      addons: f.addons.includes(id) ? f.addons.filter(a => a !== id) : [...f.addons, id],
    }));
  };

  const selectBudget = (preset) => {
    setForm(f => ({ ...f, budget_min: preset.min, budget_max: preset.max, budget_preset: preset.label }));
  };

  const allGoods = GOODS_CATEGORIES.flatMap(c => c.items);
  const filteredGoods = goodsSearch
    ? allGoods.filter(g => g.label.toLowerCase().includes(goodsSearch.toLowerCase()))
    : null;

  const nextStep = () => {
    if (step === 0 && (!form.pickup_city || !form.dropoff_city)) {
      showToast('Please select pickup and dropoff cities', 'error'); return;
    }
    if (step === 1 && (!form.goods_type || !form.weight_kg || !form.description)) {
      showToast('Please fill in all cargo details including description', 'error'); return;
    }
    if (step === 2 && !form.vehicle_type) {
      showToast('Please select a vehicle type', 'error'); return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!form.required_date) {
      showToast('Please select a required date', 'error'); return;
    }
    setLoading(true);
    try {
      const res = await jobs.create(form);
      showToast('Load posted! Carriers will send quotes soon 🎉', 'success');
      onSuccess?.(res.job);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / (STEPS.length - 1)) * 100;
  const selectedVehicle = VEHICLE_TYPES.find(v => v.id === form.vehicle_type);
  const selectedGoods = allGoods.find(g => g.id === form.goods_type);

  return (
    <div className="post-job-screen">
      <Header title="Post a Load" showBack onBack={step > 0 ? () => setStep(s => s - 1) : onBack} />

      <div className="post-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="step-labels">
          {STEPS.map((s, i) => (
            <span key={s} className={`step-label ${i <= step ? 'active' : ''}`}>{s}</span>
          ))}
        </div>
      </div>

      <div className="post-content">

        {/* ── Step 0: Route ── */}
        {step === 0 && (
          <div className="step-card">
            <h2 className="step-title">Where are you shipping?</h2>
            <div className="route-box">
              <div className="route-row">
                <div className="route-dot pickup" />
                <div className="route-inputs">
                  <CitySearch
                    label="From City"
                    value={form.pickup_city}
                    onChange={set('pickup_city')}
                    placeholder="Search city e.g. Karachi"
                  />
                  <div className="form-group">
                    <label className="form-label">Pickup Address / Landmark</label>
                    <input className="form-input" placeholder="Street, area or landmark" value={form.pickup_address} onChange={set('pickup_address')} />
                  </div>
                </div>
              </div>
              <div className="route-line" />
              <div className="route-row">
                <div className="route-dot dropoff" />
                <div className="route-inputs">
                  <CitySearch
                    label="To City"
                    value={form.dropoff_city}
                    onChange={set('dropoff_city')}
                    placeholder="Search city e.g. Lahore"
                  />
                  <div className="form-group">
                    <label className="form-label">Dropoff Address / Landmark</label>
                    <input className="form-input" placeholder="Street, area or landmark" value={form.dropoff_address} onChange={set('dropoff_address')} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Cargo ── */}
        {step === 1 && (
          <div className="step-card">
            <h2 className="step-title">What are you shipping?</h2>

            <div className="form-group">
              <label className="form-label">Goods Type</label>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>🔍</span>
                <input
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="Search goods type..."
                  value={goodsSearch}
                  onChange={e => setGoodsSearch(e.target.value)}
                />
              </div>

              {form.goods_type && !goodsSearch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--primary-light)', border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-md)', marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{selectedGoods?.icon}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{selectedGoods?.label}</span>
                  <button onClick={() => setForm(f => ({ ...f, goods_type: '' }))} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)' }}>✕</button>
                </div>
              )}

              {(goodsSearch ? [{ label: 'Results', items: filteredGoods }] : GOODS_CATEGORIES).map(cat => (
                cat.items && cat.items.length > 0 && (
                  <div key={cat.label} style={{ marginBottom: 12 }}>
                    {!goodsSearch && <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{cat.label}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {cat.items.map(g => (
                        <button
                          key={g.id}
                          onClick={() => { setForm(f => ({ ...f, goods_type: g.id })); setGoodsSearch(''); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                            border: form.goods_type === g.id ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)', background: form.goods_type === g.id ? 'var(--primary-light)' : 'white',
                            cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
                            color: form.goods_type === g.id ? 'var(--primary-dark)' : 'var(--text-primary)',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{g.icon}</span>
                          <span>{g.label}</span>
                          {form.goods_type === g.id && <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" placeholder="e.g. 5000" value={form.weight_kg} onChange={set('weight_kg')} />
            </div>

            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--secondary)', fontSize: 11 }}>Required</span></label>
              <textarea className="form-textarea" placeholder="Describe your cargo, any special handling instructions, fragility, dimensions, etc." value={form.description} onChange={set('description')} rows={3} />
            </div>

            <div className="form-group">
              <label className="form-label">Required By Date</label>
              <input className="form-input" type="date" value={form.required_date} onChange={set('required_date')}
                min={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="form-group">
              <label className="form-label">Budget Range (PKR)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {BUDGET_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => selectBudget(p)}
                    style={{
                      padding: '7px 14px', borderRadius: 'var(--radius-full)',
                      border: form.budget_preset === p.label ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                      background: form.budget_preset === p.label ? 'var(--primary)' : 'white',
                      color: form.budget_preset === p.label ? 'white' : 'var(--text-secondary)',
                      fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="form-input" type="number" placeholder="Min PKR" value={form.budget_min} onChange={set('budget_min')} />
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 700 }}>–</span>
                <input className="form-input" type="number" placeholder="Max PKR" value={form.budget_max} onChange={set('budget_max')} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Vehicle ── */}
        {step === 2 && (
          <div className="step-card">
            <h2 className="step-title">Vehicle & Add-ons</h2>
            <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Vehicle Type Required</label>
            <div className="vehicle-grid">
              {VEHICLE_TYPES.map(v => (
                <button
                  key={v.id}
                  className={`vehicle-btn ${form.vehicle_type === v.id ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, vehicle_type: v.id }))}
                >
                  <span className="v-icon">{v.icon}</span>
                  <span className="v-label">{v.label}</span>
                  <span className="v-cap">{v.capacity}</span>
                  {form.vehicle_type === v.id && <span style={{ position: 'absolute', top: 6, right: 6, background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>✓</span>}
                </button>
              ))}
            </div>

            <div className="divider" style={{ margin: '16px 0' }} />

            <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Add-on Services</label>
            <div className="addons-list">
              {ADDONS.map(a => (
                <button
                  key={a.id}
                  className={`addon-btn ${form.addons.includes(a.id) ? 'active' : ''}`}
                  onClick={() => toggleAddon(a.id)}
                >
                  <span>{a.icon} {a.label}</span>
                  <span className={`addon-check ${form.addons.includes(a.id) ? 'checked' : ''}`}>
                    {form.addons.includes(a.id) ? '✓' : '+'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div className="step-card">
            <h2 className="step-title">Review & Post</h2>
            <div className="review-card">
              <div className="review-row">
                <span className="r-label">Route</span>
                <span className="r-value">{form.pickup_city} → {form.dropoff_city}</span>
              </div>
              {form.pickup_address && (
                <div className="review-row">
                  <span className="r-label">Pickup</span>
                  <span className="r-value">{form.pickup_address}</span>
                </div>
              )}
              {form.dropoff_address && (
                <div className="review-row">
                  <span className="r-label">Dropoff</span>
                  <span className="r-value">{form.dropoff_address}</span>
                </div>
              )}
              <div className="review-row">
                <span className="r-label">Goods</span>
                <span className="r-value">{selectedGoods?.icon} {selectedGoods?.label} — {form.weight_kg} kg</span>
              </div>
              <div className="review-row">
                <span className="r-label">Description</span>
                <span className="r-value" style={{ maxWidth: '60%' }}>{form.description}</span>
              </div>
              <div className="review-row">
                <span className="r-label">Vehicle</span>
                <span className="r-value">{selectedVehicle?.icon} {selectedVehicle?.label}</span>
              </div>
              <div className="review-row">
                <span className="r-label">Date</span>
                <span className="r-value">{form.required_date}</span>
              </div>
              {form.addons.length > 0 && (
                <div className="review-row">
                  <span className="r-label">Add-ons</span>
                  <span className="r-value">{form.addons.join(', ')}</span>
                </div>
              )}
              {(form.budget_min || form.budget_max) && (
                <div className="review-row">
                  <span className="r-label">Budget</span>
                  <span className="r-value">PKR {Number(form.budget_min || 0).toLocaleString()} – {form.budget_max ? Number(form.budget_max).toLocaleString() : 'Open'}</span>
                </div>
              )}
            </div>
            <div className="post-info-box">
              <p>📢 Your load will be visible to all verified carriers. You'll receive quotes within minutes.</p>
            </div>
          </div>
        )}
      </div>

      <div className="post-footer">
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary btn-block btn-lg" onClick={nextStep}>
            Continue <ArrowRight size={18} />
          </button>
        ) : (
          <button className="btn btn-primary btn-block btn-lg" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" /> : '🚀 Post Load Now'}
          </button>
        )}
      </div>
    </div>
  );
}
