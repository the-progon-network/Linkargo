import React from 'react';
import { Home, Plus, FileText, MessageCircle, User } from 'lucide-react';
import './BottomNav.css';

const shipperTabs = [
  { key: 'home',     icon: Home,          label: 'Home'    },
  { key: 'post',     icon: Plus,          label: 'Post Job' },
  { key: 'my-jobs',  icon: FileText,      label: 'My Jobs' },
  { key: 'messages', icon: MessageCircle, label: 'Messages' },
  { key: 'profile',  icon: User,          label: 'Profile' },
];

const carrierTabs = [
  { key: 'home',     icon: Home,          label: 'Browse'  },
  { key: 'quotes',   icon: FileText,      label: 'Quotes'  },
  { key: 'messages', icon: MessageCircle, label: 'Messages' },
  { key: 'profile',  icon: User,          label: 'Profile' },
];

export default function BottomNav({ activeTab, onTabChange, role }) {
  const tabs = role === 'carrier' ? carrierTabs : shipperTabs;

  return (
    <nav className="bottom-nav">
      {tabs.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          className={`nav-tab ${activeTab === key ? 'active' : ''}`}
          onClick={() => onTabChange(key)}
        >
          <div className="nav-icon-wrap">
            <Icon size={22} />
            {key === 'post' && <span className="post-dot" />}
          </div>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
