import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './styles/global.css';

// Screens
import AuthScreen from './screens/AuthScreen';
import PostJob from './screens/customer/PostJob';
import MyJobs from './screens/customer/MyJobs';
import Quotations from './screens/customer/Quotations';
import CarrierHome from './screens/carrier/CarrierHome';
import CarrierQuotes from './screens/carrier/CarrierQuotes';
import SendQuote from './screens/carrier/SendQuote';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav from './components/BottomNav';
import ShipperHome from './screens/customer/ShipperHome';

function AppInner() {
  const { user } = useApp();

  // Navigation state
  const [tab, setTab] = useState('home');
  const [overlay, setOverlay] = useState(null); // { type, data }

  if (!user) return <AuthScreen />;

  const isCarrier = user.role === 'carrier';

  const closeOverlay = () => setOverlay(null);

  const renderTab = () => {
    if (isCarrier) {
      switch (tab) {
        case 'home':    return <CarrierHome onSendQuote={(job) => setOverlay({ type: 'sendQuote', job })} />;
        case 'quotes':  return <CarrierQuotes />;
        case 'messages': return <MessagesPlaceholder />;
        case 'profile': return <ProfileScreen />;
        default:        return <CarrierHome onSendQuote={(job) => setOverlay({ type: 'sendQuote', job })} />;
      }
    } else {
      switch (tab) {
        case 'home':    return <ShipperHome onTabChange={setTab} />;
        case 'post':    return <PostJob onBack={() => setTab('home')} onSuccess={() => { setTab('my-jobs'); }} />;
        case 'my-jobs': return <MyJobs onViewQuotes={(job) => setOverlay({ type: 'quotes', job })} />;
        case 'messages': return <MessagesPlaceholder />;
        case 'profile': return <ProfileScreen />;
        default:        return <ShipperHome onTabChange={setTab} />;
      }
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', minHeight: '100vh' }}>
      {renderTab()}

      {/* Overlays */}
      {overlay?.type === 'quotes' && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 150, maxWidth: 480, margin: '0 auto', overflowY: 'auto' }}>
          <Quotations job={overlay.job} onBack={closeOverlay} onChat={(q) => setOverlay({ type: 'chat', quote: q })} />
        </div>
      )}

      {overlay?.type === 'sendQuote' && (
        <SendQuote job={overlay.job} onClose={closeOverlay} onSuccess={closeOverlay} />
      )}

      {/* Bottom Nav — hidden during post flow on mobile for clean UX */}
      {tab !== 'post' && (
        <BottomNav activeTab={tab} onTabChange={setTab} role={user.role} />
      )}
    </div>
  );
}

function MessagesPlaceholder() {
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
      <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Messages</h2>
      <p style={{ color: 'var(--text-secondary)' }}>In-app messaging coming in v2. For now, carriers' phone numbers are visible on accepted quotes.</p>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
