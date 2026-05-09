import React from 'react';
import { ArrowLeft, LogOut, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Header.css';

export default function Header({ title, subtitle, showBack, onBack, actions }) {
  const { logout, user } = useApp();

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-left">
          {showBack && (
            <button className="back-btn" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="header-logo">
            {!showBack && <span className="logo-text">Link<span>argo</span></span>}
          </div>
        </div>

        <div className="header-title-block">
          {title && <h1 className="header-title">{title}</h1>}
          {subtitle && <p className="header-sub">{subtitle}</p>}
        </div>

        <div className="header-right">
          {actions}
          {!showBack && (
            <button className="icon-btn" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
