import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { createClient } from '@supabase/supabase-js';
import './Messages.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const API_URL = process.env.REACT_APP_API_URL;

function getToken() {
  return localStorage.getItem('linkargo_token');
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function formatDateHeader(iso) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}

function Avatar({ name, size = 42 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const hue = name ? (name.charCodeAt(0) * 47) % 360 : 200;
  return (
    <div className="msg-avatar" style={{
      width: size, height: size,
      fontSize: size * 0.36,
      background: `hsl(${hue}, 55%, 52%)`,
    }}>
      {initials}
    </div>
  );
}

// ─── Conversations List ───────────────────────────────────────

export default function MessagesScreen() {
  const { user } = useApp();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiFetch('/messages/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();

    // Refresh list whenever we receive a new message
    const channel = supabase
      .channel('conv-refresh')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, loadConversations)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user.id, loadConversations]);

  if (activeConv) {
    return (
      <ChatScreen
        currentUser={user}
        conversation={activeConv}
        onBack={() => { setActiveConv(null); loadConversations(); }}
      />
    );
  }

  return (
    <div className="msg-screen">
      <div className="msg-header">
        <h1 className="msg-header-title">Messages</h1>
        {conversations.length > 0 && (
          <span className="msg-header-count">{conversations.length}</span>
        )}
      </div>

      {loading ? (
        <div className="msg-center"><div className="msg-spinner" /></div>
      ) : conversations.length === 0 ? (
        <div className="msg-empty">
          <div className="msg-empty-icon">💬</div>
          <h3 className="msg-empty-title">No messages yet</h3>
          <p className="msg-empty-text">
            {user.role === 'carrier'
              ? 'Quote on a job to start chatting with shippers.'
              : 'Accept a quote to start chatting with your carrier.'}
          </p>
        </div>
      ) : (
        <div className="msg-list">
          {conversations.map(conv => (
            <button
              key={conv.job_id}
              className="msg-conv-item"
              onClick={() => setActiveConv(conv)}
            >
              <div className="msg-conv-avatar-wrap">
                <Avatar name={conv.other_user?.name} size={48} />
                {conv.unread_count > 0 && <span className="msg-unread-dot" />}
              </div>
              <div className="msg-conv-body">
                <div className="msg-conv-top">
                  <span className="msg-conv-name">{conv.other_user?.name}</span>
                  <span className="msg-conv-time">{formatTime(conv.last_message_at)}</span>
                </div>
                <div className="msg-conv-route">
                  {conv.job?.pickup_city} → {conv.job?.dropoff_city}
                  <span className="msg-conv-goods"> · {conv.job?.goods_type}</span>
                </div>
                <div className="msg-conv-bottom">
                  <span className="msg-conv-preview">{conv.last_message}</span>
                  {conv.unread_count > 0 && (
                    <span className="msg-unread-badge">{conv.unread_count}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chat Screen ──────────────────────────────────────────────

function ChatScreen({ currentUser, conversation, onBack }) {
  const { job_id, job, other_user } = conversation;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 30);
  }, []);

  useEffect(() => {
    apiFetch(`/messages/${job_id}`)
      .then(data => { setMessages(data); scrollToBottom('instant'); })
      .catch(err => console.error('Failed to load messages:', err))
      .finally(() => setLoading(false));

    const channel = supabase
      .channel(`chat-${job_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `job_id=eq.${job_id}`,
      }, (payload) => {
        const msg = payload.new;
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, { ...msg, sender: { id: msg.sender_id }, receiver: { id: msg.receiver_id } }];
        });
        scrollToBottom();
        if (msg.receiver_id === currentUser.id) {
          apiFetch(`/messages/${job_id}/read`, { method: 'PATCH' }).catch(() => {});
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [job_id, currentUser.id, scrollToBottom]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    inputRef.current?.focus();

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      text: trimmed,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: { id: currentUser.id },
      receiver: { id: other_user.id },
    }]);
    scrollToBottom();

    try {
      const saved = await apiFetch(`/messages/${job_id}`, {
        method: 'POST',
        body: JSON.stringify({ text: trimmed, receiver_id: other_user.id }),
      });
      setMessages(prev => prev.map(m => m.id === tempId ? saved : m));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Build grouped list with date separators
  const grouped = [];
  let lastDate = null;
  for (const msg of messages) {
    const d = new Date(msg.created_at).toDateString();
    if (d !== lastDate) {
      grouped.push({ type: 'date', label: formatDateHeader(msg.created_at), key: `date-${d}` });
      lastDate = d;
    }
    grouped.push({ type: 'msg', msg });
  }

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <button className="chat-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar name={other_user?.name} size={38} />
        <div className="chat-header-info">
          <div className="chat-header-name">{other_user?.name}</div>
          <div className="chat-header-sub">
            {job?.pickup_city} → {job?.dropoff_city} · {job?.goods_type}
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="msg-center"><div className="msg-spinner" /></div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <span style={{ fontSize: 32 }}>👋</span>
            <p>Say hello to {other_user?.name}</p>
          </div>
        ) : (
          grouped.map(item => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className="chat-date-divider">
                  <span>{item.label}</span>
                </div>
              );
            }
            const { msg } = item;
            const isMine = msg.sender?.id === currentUser.id;
            const isTemp = String(msg.id).startsWith('temp-');
            return (
              <div key={msg.id} className={`chat-row ${isMine ? 'chat-row--mine' : 'chat-row--theirs'}`}>
                {!isMine && <Avatar name={other_user?.name} size={28} />}
                <div className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'} ${isTemp ? 'chat-bubble--sending' : ''}`}>
                  <p className="chat-bubble-text">{msg.text}</p>
                  <div className="chat-bubble-meta">
                    <span className="chat-bubble-time">{formatTime(msg.created_at)}</span>
                    {isMine && (
                      <span className="chat-tick">
                        {isTemp ? '⏱' : msg.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!text.trim() || sending}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
