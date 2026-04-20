import React, { useState, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './supabaseClient'
import { Capacitor } from '@capacitor/core'

// ─── Stripe ───
const STRIPE_PK = 'pk_test_51TFfVdEeHMnjyMgrcqhQWhNqUzFQDDQR8PSlbVoYUqIDi1NX98zpzUFMeFCu2ufrZ7gqiFKotNBmPuJD3F00DHCz00zvwKWI5B';
const SUPABASE_URL = 'https://khowgzwwculgcesoadlu.supabase.co';

// ─── Native Features ───
const isNative = Capacitor.isNativePlatform();

// Haptic feedback helper — only runs on native iOS
const haptic = async (style = 'Medium') => {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    if (style === 'Light') await Haptics.impact({ style: ImpactStyle.Light });
    else if (style === 'Heavy') await Haptics.impact({ style: ImpactStyle.Heavy });
    else await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {}
};

const hapticSuccess = async () => {
  if (!isNative) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch {}
};

// Push notifications setup — only on native
const setupPushNotifications = async () => {
  if (!isNative) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive === 'granted') {
      await PushNotifications.register();
    }
    PushNotifications.addListener('registration', token => {
      console.log('Push token:', token.value);
    });
    PushNotifications.addListener('registrationError', err => {
      console.error('Push registration error:', err);
    });
    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Push received:', notification);
    });
    PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.log('Push action:', notification);
    });
  } catch (e) {
    console.log('Push notifications not available:', e);
  }
};

// ─── Date Formatting ───
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatEventDate = (rawDate) => {
  if (!rawDate) return 'TBD';
  const dateStr = String(rawDate);
  // ISO format: 2026-04-04 or 2026-04-04T...
  if (dateStr.length >= 10 && dateStr[4] === '-' && dateStr[7] === '-') {
    const y = parseInt(dateStr.substring(0, 4));
    const m = parseInt(dateStr.substring(5, 7));
    const d = parseInt(dateStr.substring(8, 10));
    const date = new Date(y, m - 1, d);
    const dayName = SHORT_DAYS[date.getDay()];
    return `${dayName} ${m}/${d}/${String(y).slice(-2)}`;
  }
  // Full day name (Monday, Tuesday, etc.)
  const fullDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const fullIdx = fullDays.findIndex(d => dateStr.toLowerCase().startsWith(d.toLowerCase()));
  if (fullIdx >= 0) return SHORT_DAYS[(fullIdx + 1) % 7];
  // Month/Day/Year format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    const monthIdx = MONTHS.indexOf(parts[0]);
    if (monthIdx >= 0 && parts[1] && parts[2]) {
      const date = new Date(parseInt(parts[2]), monthIdx, parseInt(parts[1]));
      if (!isNaN(date)) {
        const dayName = SHORT_DAYS[date.getDay()];
        return `${dayName} ${monthIdx + 1}/${parts[1]}/${String(parts[2]).slice(-2)}`;
      }
    }
  }
  return dateStr;
};

// ─── Birthday Helpers ───
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const parseDateStr = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
};
const calcAge = (dateStr) => {
  const b = parseDateStr(dateStr);
  if (!b) return null;
  const today = new Date();
  let age = today.getFullYear() - b.year;
  const m = (today.getMonth() + 1) - b.month;
  if (m < 0 || (m === 0 && today.getDate() < b.day)) age--;
  return age;
};
const isBirthdayToday = (dateStr) => {
  const b = parseDateStr(dateStr);
  if (!b) return false;
  const today = new Date();
  return b.month === today.getMonth() + 1 && b.day === today.getDate();
};
const formatAge = (dateStr) => {
  const age = calcAge(dateStr);
  if (age === null) return '';
  if (age < 1) {
    const b = parseDateStr(dateStr);
    const today = new Date();
    const months = (today.getFullYear() - b.year) * 12 + (today.getMonth() + 1) - b.month;
    return months <= 0 ? 'Newborn' : `${months}mo`;
  }
  return `${age}`;
};
function BirthdayPicker({ value, onChange, label, inputStyle }) {
  // Parse from string directly to avoid timezone offset issues
  const parts = value ? value.split('-') : [];
  const y = parts.length === 3 ? parseInt(parts[0]) : '';
  const m = parts.length === 3 ? parseInt(parts[1]) : '';
  const d = parts.length === 3 ? parseInt(parts[2]) : '';
  const update = (newM, newD, newY) => {
    if (newM && newD && newY) {
      onChange(`${newY}-${String(newM).padStart(2,'0')}-${String(newD).padStart(2,'0')}`);
    } else {
      onChange('');
    }
  };
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 100; i--) years.push(i);
  const days = [];
  for (let i = 1; i <= 31; i++) days.push(i);
  return (
    <div>
      {label && <p style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 4 }}>{label}</p>}
      <div style={{ display: "flex", gap: 6 }}>
        <select style={{ ...inputStyle, flex: 2 }} value={m} onChange={e => update(e.target.value, d || 1, y || currentYear)}>
          <option value="">Month</option>
          {MONTHS.map((mn, i) => <option key={i} value={i + 1}>{mn}</option>)}
        </select>
        <select style={{ ...inputStyle, flex: 1 }} value={d} onChange={e => update(m || 1, e.target.value, y || currentYear)}>
          <option value="">Day</option>
          {days.map(day => <option key={day} value={day}>{day}</option>)}
        </select>
        <select style={{ ...inputStyle, flex: 1.2 }} value={y} onChange={e => update(m || 1, d || 1, e.target.value)}>
          <option value="">Year</option>
          {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Avatar Component ───
function Avatar({ url, name, size, style: extraStyle }) {
  const s = size || 40;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (url) {
    return <img src={url} alt={name} style={{ width: s, height: s, borderRadius: s / 2, objectFit: 'cover', ...extraStyle }} />;
  }
  return (
    <div style={{ width: s, height: s, borderRadius: s / 2, background: 'linear-gradient(135deg, #FAF0F2, #FAF0F2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: s * 0.35, color: '#4A1E2A', flexShrink: 0, ...extraStyle }}>
      {initials}
    </div>
  );
}

// ─── Address Autocomplete ───
function AddressInput({ value, onChange, inputStyle, placeholder, userArea }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [coords, setCoords] = useState(null);

  // Try to get user's location for better results
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const search = (query) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (query.length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        // If we have coords, search within a tight area first
        // Long Island / NYC area bounding box
        const nyViewbox = '-74.05,40.49,-71.85,41.15';
        let url;
        if (coords) {
          const offset = 0.3; // ~20 miles
          url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5&addressdetails=1&viewbox=${coords.lon - offset},${coords.lat + offset},${coords.lon + offset},${coords.lat - offset}&bounded=1`;
        } else {
          const localQuery = `${query}, New York`;
          url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(localQuery)}&countrycodes=us&limit=5&addressdetails=1&viewbox=${nyViewbox}&bounded=1`;
        }
        let res = await fetch(url);
        let data = await res.json();
        // If bounded search returned nothing, try with New York appended
        if (data.length === 0) {
          const fallbackQuery = `${query}, New York`;
          res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&countrycodes=us&limit=5&addressdetails=1&viewbox=${nyViewbox}`);
          data = await res.json();
        }
        // Filter to only New York state results
        data = data.filter(d => {
          const addr = d.address || {};
          return addr.state === 'New York' || (d.display_name || '').includes('New York');
        });
        // Shorten display names — keep just the useful parts
        setSuggestions(data.map(d => {
          const parts = d.display_name.split(', ');
          return parts.slice(0, Math.min(parts.length - 1, 3)).join(', ');
        }));
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 400);
    setDebounceTimer(timer);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        style={inputStyle}
        placeholder={placeholder || "Search for an address..."}
        value={value}
        onChange={e => { onChange(e.target.value); search(e.target.value); }}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #E8E8E8", zIndex: 50, maxHeight: 200, overflow: "auto", marginTop: 4 }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              style={{ padding: "10px 14px", fontSize: 13, color: "#2D2D2D", cursor: "pointer", borderBottom: i < suggestions.length - 1 ? "1px solid #f5f5f5" : "none" }}
              onMouseDown={() => { onChange(s); setShowSuggestions(false); }}
            >
              📍 {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Icons ───
const Icons = {
  home: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 12l9-8 9 8M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
  ),
  calendar: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  ),
  chat: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
  ),
  user: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  users: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
  ),
  plus: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
  ),
  search: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
  ),
  heart: (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
  ),
  send: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
  ),
  back: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
  ),
  check: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
  ),
  star: (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  ),
  vote: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  ),
  location: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
  ),
  clock: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  ),
  shield: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  lock: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
  ),
  globe: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
  ),
  group: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="19" cy="7" r="3"/><path d="M21 21v-2a3 3 0 00-2-2.83"/></svg>
  ),
  crown: (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h20l-2-12-5 5-3-7-3 7-5-5-2 12z"/></svg>
  ),
  info: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
  ),
  sparkle: (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z"/></svg>
  ),
  bell: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
  ),
  compass: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none"/></svg>
  ),
};

// ─── Data ───
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AGE_FILTERS = ["All Ages", "0-1", "1-3", "3-5", "5-8", "8+"];

const QUICK_QS = {
  kids: [
    { q: "{name} is best described as...", options: ["Social butterfly", "Slow to warm up", "Wild card"] },
    { q: "{name}'s perfect playdate is...", options: ["Outdoor adventures", "Arts and crafts", "Pure chaos"] },
    { q: "{name}'s nap schedule is...", options: ["Sacred", "Flexible", "What's a nap?"] },
  ],
  mom: [
    { q: "I show up to playdates...", options: ["Snacks packed and on time", "Fashionably late", "Forgot it was today"] },
    { q: "My parenting vibe is...", options: ["Schedule queen", "Go with the flow", "Controlled chaos... maybe?"] },
    { q: "During playdates I need...", options: ["Adult conversation", "Coffee", "Both or I won't survive"] },
    { q: "I'm the mom who always brings...", options: ["Homemade snacks", "Store-bought and proud", "The wine for later"] },
  ],
  matching: [
    { q: "My ideal playdate group size is...", options: ["Just one other family", "Small group", "The more the merrier"] },
    { q: "We're best matched with moms who are...", options: ["Laid-back", "Planners like me", "Somewhere in between"] },
  ],
};

// ─── App ───
function MamaSquadsApp() {
  const [screen, setScreen] = useState("welcome");
  const [isVerified, setIsVerified] = useState(false);
  const [isBetaMember, setIsBetaMember] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState(null);
  const [signupError, setSignupError] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [tab, setTabRaw] = useState("home");
  const mainContentRef = useRef(null);
  const setTab = (t) => { setTabRaw(t); if (mainContentRef.current) mainContentRef.current.scrollTop = 0; };
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const pullDist = useRef(0);
  const [pullIndicator, setPullIndicator] = useState(0);
  const handleTouchStart = (e) => { if (mainContentRef.current && mainContentRef.current.scrollTop <= 0) pullStartY.current = e.touches[0].clientY; else pullStartY.current = 0; };
  const handleTouchMove = (e) => { if (!pullStartY.current) return; pullDist.current = Math.max(0, e.touches[0].clientY - pullStartY.current); setPullIndicator(Math.min(pullDist.current / 2, 40)); };
  const handleTouchEnd = () => { if (pullDist.current > 80) { setPullRefreshing(true); setTimeout(() => { window.location.reload(); }, 300); } pullStartY.current = 0; pullDist.current = 0; setPullIndicator(0); };
  const [selectedDay, setSelectedDay] = useState("All");
  const [selectedAge, setSelectedAge] = useState("All Ages");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showAdminApply, setShowAdminApply] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const navHistory = useRef([]);
  const pushNav = (state) => {
    navHistory.current.push({
      selectedEvent, selectedProfile, showAdminApply, selectedGroup,
      showCreateGroup, showDiscover, showMyProfile, selectedConversation, selectedGroupChat, ...state
    });
  };
  const popNav = () => {
    if (navHistory.current.length === 0) {
      setSelectedEvent(null); setSelectedProfile(null); setShowAdminApply(false);
      setSelectedGroup(null); setShowCreateGroup(false); setShowDiscover(false); setShowMyProfile(false);
      setSelectedConversation(null); setSelectedGroupChat(null);
      return;
    }
    const prev = navHistory.current.pop();
    setSelectedEvent(prev.selectedEvent);
    setSelectedProfile(prev.selectedProfile);
    setShowAdminApply(prev.showAdminApply);
    setSelectedGroup(prev.selectedGroup);
    setShowCreateGroup(prev.showCreateGroup);
    setShowDiscover(prev.showDiscover);
    setSelectedConversation(prev.selectedConversation || null);
    setSelectedGroupChat(prev.selectedGroupChat || null);
    setShowMyProfile(prev.showMyProfile);
  };
  const [groupRequests, setGroupRequests] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [groups, setGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [pendingJoins, setPendingJoins] = useState([]);
  const [onboardStep, setOnboardStep] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [connections, setConnections] = useState([]);
  const [events, setEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [fadeIn, setFadeIn] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedGroupChat, setSelectedGroupChat] = useState(null);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('mamasquads_tutorial_v2'));
  const [tutorialStep, setTutorialStep] = useState(0);

  const navigate = useCallback((dest, data) => {
    setFadeIn(false);
    setTimeout(() => {
      if (dest === "event") setSelectedEvent(data);
      else if (dest === "profile") setSelectedProfile(data);
      else if (dest === "tab") setTab(data);
      else setScreen(data || dest);
      setFadeIn(true);
    }, 150);
  }, []);

  // ─── Auto-cleanup old data on mount ───
  useEffect(() => {
    const cleanup = async () => {
      const now = new Date();

      // Delete events older than 7 days past their date
      const { data: oldEvents } = await supabase
        .from('events')
        .select('id, event_date, created_at');
      if (oldEvents) {
        for (const evt of oldEvents) {
          // Parse event_date
          let eventDate = parseEventToDate(evt.event_date);
          // Fall back to created_at if date can't be parsed
          if (!eventDate) eventDate = new Date(evt.created_at);

          const daysSince = (now - eventDate) / (1000 * 60 * 60 * 24);
          if (daysSince > 7) {
            await supabase.from('comments').delete().eq('event_id', evt.id);
            await supabase.from('event_rsvps').delete().eq('event_id', evt.id);
            await supabase.from('events').delete().eq('id', evt.id);
          }
        }
      }

      // Delete polls (meetup_proposals) older than 14 days
      const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: oldPolls } = await supabase
        .from('meetup_proposals')
        .select('id')
        .lt('created_at', fourteenDaysAgo);
      if (oldPolls) {
        for (const poll of oldPolls) {
          await supabase.from('votes').delete().eq('proposal_id', poll.id);
          await supabase.from('meetup_proposals').delete().eq('id', poll.id);
        }
      }

      // Delete read notifications older than 30 days
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('notifications').delete().eq('is_read', true).lt('created_at', thirtyDaysAgo);
    };
    cleanup();
  }, []);

  // ─── Session restore on mount ───
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('users').select('*').eq('id', session.user.id).single()
          .then(({ data: profile }) => {
            if (profile) {
              setUser(profile);
              setIsVerified(profile.is_verified);
              setIsBetaMember(profile.is_founding_member);
              setScreen("main");
            } else {
              // Auth user exists but no profile — incomplete signup, sign them out
              supabase.auth.signOut();
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setIsVerified(false);
        setScreen("welcome");
      } else if (_event === 'PASSWORD_RECOVERY') {
        setShowResetPassword(true);
      } else if (_event === 'SIGNED_IN') {
        supabase.from('users').select('*').eq('id', session.user.id).single()
          .then(({ data: profile }) => {
            if (profile) {
              setUser(profile);
              setIsVerified(profile.is_verified);
              setIsBetaMember(profile.is_founding_member);
              setScreen("main");
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Init push notifications on native ───
  useEffect(() => { setupPushNotifications(); }, []);

  // ─── Load conversations ───
  useEffect(() => {
    if (!user) return;
    const loadConvos = async () => {
      const { data } = await supabase.from('conversations')
        .select('*, messages(id, text, sender_id, sender_name, created_at)')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      if (data) setConversations(data);
    };
    loadConvos();
    const poll = setInterval(loadConvos, 5000);
    return () => clearInterval(poll);
  }, [user]);

  // ─── Check for Stripe return (payment success) ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && user) {
      supabase.from('users').update({ verification_status: 'paid' }).eq('id', user.id)
        .then(() => { setUser(prev => ({ ...prev, verification_status: 'paid' })); });
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('identity') === 'complete' && user) {
      supabase.from('users').update({ verification_status: 'pending' }).eq('id', user.id)
        .then(() => { setUser(prev => ({ ...prev, verification_status: 'pending' })); });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  // ─── Forgot password handler ───
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const handleForgotPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl,
    });
    if (error) return { error: error.message };
    return { success: true };
  };

  // ─── Update password handler (after reset link) ───
  const handleUpdatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    setShowResetPassword(false);
    return { success: true };
  };

  // ─── Sign in handler (for existing users) ───
  const handleSignIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (!data.user) return { error: "Sign in failed. Please try again." };

    // Check if email is confirmed (if confirmation is still enabled)
    if (data.user.email_confirmed_at === null) {
      return { error: "Please confirm your email before signing in. Check your inbox." };
    }

    // Fetch profile
    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (!profile) {
      // Auth user exists but signup was never completed — sign out the dangling auth user
      await supabase.auth.signOut();
      return { error: "No account found. Please sign up first." };
    }

    setUser(profile);
    setIsVerified(profile.is_verified);
    setIsBetaMember(profile.is_founding_member);
    setScreen("main");
    return { success: true };
  };

  // ─── Signup handler (called when onboarding completes) ───
  const handleSignup = async (userData) => {
    setSignupError(null);
    const { email, password, name, area, bio, momBirthday, kids, interests, quickAnswers } = userData;

    let userId;

    // Try signup first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: siteUrl,
      },
    });

    if (authError) {
      // If user already registered (incomplete signup), try signing in instead
      if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already been registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setSignupError("An account with this email already exists. Try signing in or use a different email.");
          return;
        }
        userId = signInData.user.id;
        // Check if profile already exists
        const { data: existingProfile } = await supabase.from('users').select('id').eq('id', userId).single();
        if (existingProfile) {
          setSignupError("This account already exists. Please sign in instead.");
          return;
        }
      } else {
        setSignupError(authError.message);
        return;
      }
    } else {
      if (!authData.user) {
        setSignupError("Signup failed. Please try again.");
        return;
      }
      userId = authData.user.id;
    }
    const isFoundingMember = !!inviteCode;

    const { error: profileError } = await supabase.from('users').insert({
      id: userId,
      email,
      full_name: name,
      area,
      bio,
      mom_age: momBirthday || null,
      kids: kids || [],
      interests,
      quick_answers: quickAnswers || {},
      is_verified: isFoundingMember,
      is_founding_member: isFoundingMember,
    });

    if (profileError) {
      setSignupError(profileError.message);
      return;
    }

    // Mark invite code as used
    if (inviteCode) {
      await supabase.from('invite_codes').delete().eq('code', inviteCode);
    }

    setUser({ id: userId, email, full_name: name, area, bio, mom_age: momBirthday || null, kids: kids || [], interests: interests || [], quick_answers: quickAnswers || {}, is_verified: isFoundingMember, is_founding_member: isFoundingMember });

    if (isFoundingMember) {
      setIsVerified(true);
      setIsBetaMember(true);
      navigate("screen", "main");
    } else {
      navigate("screen", "main");
    }
  };

  // ─── Verification complete handler ───
  const handleVerificationComplete = async () => {
    if (user) {
      await supabase.from('users').update({ is_verified: true }).eq('id', user.id);
      setUser(prev => ({ ...prev, is_verified: true }));
    }
    setIsVerified(true);
    navigate("screen", "main");
  };

  // ─── Load groups from Supabase ───
  useEffect(() => {
    const loadGroups = async () => {
      const { data } = await supabase.from('groups').select('*, group_members(user_id, role), users!admin_id(full_name)');
      if (data && data.length > 0) {
        const supaGroups = data.map(g => {
          const adminName = g.users?.full_name || 'Admin';
          return {
          id: g.id,
          name: g.name,
          emoji: g.emoji || '👥',
          desc: g.description,
          isPrivate: g.is_private,
          admin: adminName,
          adminAvatar: adminName.split(' ').map(w => w[0]).join(''),
          adminId: g.admin_id,
          members: g.group_members?.length || 1,
          maxMembers: g.max_members || 30,
          ages: g.age_group || 'All Ages',
          area: g.area || '',
          rules: g.rules || [],
          joinQuestions: g.join_questions || [],
          acceptingMembers: g.accepting_members !== false,
          isHidden: g.is_hidden || false,
          inviteCode: g.invite_code || '',
          recentActivity: 'New group',
          color: g.color || '#6B2C3B',
          pendingRequests: [],
          fromSupabase: true,
        };});
        setGroups(supaGroups);
      }
    };
    loadGroups();
    const poll = setInterval(loadGroups, 15000);
    return () => clearInterval(poll);
  }, []);

  // ─── Load joined groups & pending joins from Supabase ───
  useEffect(() => {
    if (!user) return;
    const loadMemberships = async () => {
      // Groups the user is a member of
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      if (memberships) {
        setJoinedGroups(memberships.map(m => m.group_id));
      }
      // Pending join requests by this user
      const { data: pendingReqs } = await supabase
        .from('join_requests')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      if (pendingReqs) {
        setPendingJoins(pendingReqs.map(r => r.group_id));
      }
    };
    loadMemberships();
    const poll = setInterval(loadMemberships, 15000);
    return () => clearInterval(poll);
  }, [user]);

  // ─── Create group handler ───
  const handleCreateGroup = async (groupData) => {
    if (!user) return { error: 'Not logged in' };

    const genCode = () => { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code = ''; for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]; return code; };
    const { data, error } = await supabase.from('groups').insert({
      name: groupData.name,
      description: groupData.description,
      area: groupData.area,
      age_group: groupData.ageGroup,
      max_members: groupData.maxMembers || 30,
      is_private: groupData.isPrivate,
      rules: groupData.rules,
      join_questions: groupData.joinQuestions || [],
      invite_code: genCode(),
      emoji: groupData.emoji || '👥',
      color: groupData.color || '#6B2C3B',
      admin_id: user.id,
    }).select().single();

    if (error) return { error: error.message };

    // Add creator as admin member
    await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: user.id,
      role: 'admin',
    });

    // Add to local state
    const newGroup = {
      id: data.id,
      name: data.name,
      emoji: data.emoji || '👥',
      desc: data.description,
      isPrivate: data.is_private,
      admin: user.full_name || user.email,
      adminAvatar: (user.full_name || 'U').split(' ').map(w => w[0]).join(''),
      adminId: user.id,
      members: 1,
      maxMembers: data.max_members,
      ages: data.age_group || 'All Ages',
      area: data.area || '',
      rules: data.rules || [],
      joinQuestions: data.join_questions || [],
      acceptingMembers: true,
      isHidden: data.is_hidden || false,
      inviteCode: data.invite_code || '',
      recentActivity: 'Just created',
      color: data.color || '#6B2C3B',
      pendingRequests: [],
      fromSupabase: true,
    };
    setGroups(prev => [...prev, newGroup]);
    setJoinedGroups(prev => [...prev, data.id]);

    return { data: newGroup };
  };

  // ─── Join request handler ───
  const handleJoinRequest = async (groupId, message) => {
    if (!user) return { error: 'Not logged in' };

    const { error } = await supabase.from('join_requests').insert({
      group_id: groupId,
      user_id: user.id,
      message,
      status: 'pending',
    });

    if (error) return { error: error.message };
    hapticSuccess();
    setPendingJoins(prev => [...prev, groupId]);

    // Notify the group admin
    const group = (groups || []).find(g => g.id === groupId);
    if (group && group.adminId) {
      await supabase.from('notifications').insert({
        user_id: group.adminId,
        type: 'join_request',
        title: 'New Join Request',
        body: `${user.full_name || 'A mom'} wants to join ${group.name}. Review their request in the group.`,
        group_id: groupId,
        is_read: false,
      });
    }
    return { success: true };
  };

  // ─── Approve join request handler ───
  const handleApproveRequest = async (requestId, groupId, userId) => {
    const { error: reqErr } = await supabase.from('join_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);
    if (reqErr) { alert('Error approving request. Please try again.'); return; }

    const { error: memErr } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    });
    if (memErr) { alert('Error adding member to group.'); return; }

    // Update member count in local state
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, members: (g.members || 0) + 1 } : g
    ));

    // Notify the user they've been accepted
    const group = (groups || []).find(g => g.id === groupId);
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'group_accepted',
      title: 'Welcome to the group!',
      body: `You've been accepted into ${group?.name || 'a group'}. Check it out!`,
      group_id: groupId,
      is_read: false,
    });
  };

  // ─── Deny join request handler ───
  const handleDenyRequest = async (requestId) => {
    await supabase.from('join_requests')
      .update({ status: 'denied' })
      .eq('id', requestId);
  };

  // ─── Load events from Supabase ───
  useEffect(() => {
    const loadEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*, event_rsvps(user_id), comments(id), users!created_by(full_name)')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const supaEvents = data.map(e => ({
          id: e.id,
          title: e.title,
          location: e.location,
          time: e.event_time,
          date: e.event_date,
          ages: e.age_group || 'All Ages',
          host: e.users?.full_name || 'A mom',
          hostId: e.created_by,
          attendees: e.event_rsvps?.length || 0,
          maxAttendees: e.max_attendees || 15,
          comments: [],
          color: '#6B2C3B',
          description: e.description,
          groupId: e.group_id,
          fromSupabase: true,
        }));
        setEvents(supaEvents);
      }
    };
    loadEvents();
    const poll = setInterval(loadEvents, 15000);
    return () => clearInterval(poll);
  }, []);

  // ──�� Load RSVPs for current user ───
  useEffect(() => {
    if (!user) return;
    supabase.from('event_rsvps')
      .select('event_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setJoinedEvents(prev => [...new Set([...prev, ...data.map(r => r.event_id)])]);
        }
      });
  }, [user]);

  // ─── Create event handler ───
  const handleCreateEvent = async (eventData) => {
    if (!user) return { error: 'Not logged in' };

    const { data, error } = await supabase.from('events').insert({
      title: eventData.title,
      location: eventData.location,
      event_date: eventData.date,
      event_time: eventData.time,
      age_group: eventData.ages,
      max_attendees: eventData.maxAttendees || 15,
      description: eventData.description,
      created_by: user.id,
      group_id: eventData.groupId || null,
    }).select().single();

    if (error) return { error: error.message };

    // Auto-RSVP the creator
    await supabase.from('event_rsvps').insert({
      event_id: data.id,
      user_id: user.id,
    });

    const newEvent = {
      id: data.id,
      title: data.title,
      location: data.location,
      time: data.event_time,
      date: data.event_date,
      ages: data.age_group || 'All Ages',
      host: user.full_name || user.email,
      hostId: user.id,
      attendees: 1,
      maxAttendees: data.max_attendees,
      comments: [],
      color: '#6B2C3B',
      description: data.description,
      groupId: data.group_id,
      fromSupabase: true,
    };
    setEvents(prev => [newEvent, ...prev]);
    setJoinedEvents(prev => [...prev, data.id]);

    // Notify group members about the new event
    if (data.group_id) {
      const groupName = (groups || []).find(g => g.id === data.group_id)?.name || 'your group';
      await notifyGroupMembers(data.group_id, 'new_event', 'New Playdate', `${user.full_name || 'A mom'} posted a new playdate in ${groupName}: "${data.title}"`);
    }

    return { data: newEvent };
  };

  // ─── RSVP handler ───
  const handleRsvp = async (eventId, joining) => {
    if (!user) return;
    if (joining) {
      const { error } = await supabase.from('event_rsvps').insert({
        event_id: eventId,
        user_id: user.id,
      });
      if (error) { console.error('RSVP error:', error); alert('Could not RSVP. Please try again.'); return; }
      hapticSuccess();
      setJoinedEvents(prev => [...prev, eventId]);
      setEvents(prev => prev.map(e =>
        e.id === eventId ? { ...e, attendees: (e.attendees || 0) + 1 } : e
      ));
    } else {
      await supabase.from('event_rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);
      setJoinedEvents(prev => prev.filter(id => id !== eventId));
      setEvents(prev => prev.map(e =>
        e.id === eventId ? { ...e, attendees: Math.max(0, (e.attendees || 1) - 1) } : e
      ));
    }
  };

  // ─── Post comment handler ���──
  const handlePostComment = async (eventId, text) => {
    if (!user || !text.trim()) return null;

    const { data, error } = await supabase.from('comments').insert({
      event_id: eventId,
      user_id: user.id,
      content: text.trim(),
    }).select().single();

    if (error) return null;
    return {
      id: data.id,
      user: user.full_name || user.email,
      text: data.content,
      time: 'Just now',
      fromSupabase: true,
    };
  };

  // ─── Delete event handler ───
  const handleDeleteEvent = async (eventId) => {
    await supabase.from('comments').delete().eq('event_id', eventId);
    await supabase.from('event_rsvps').delete().eq('event_id', eventId);
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) { alert('Error deleting event. Please try again.'); return; }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setJoinedEvents(prev => prev.filter(id => id !== eventId));
  };

  // ─── Upload profile photo ───
  const uploadProfilePhoto = async (file) => {
    if (!user || !file) return null;
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (uploadError) return null;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Add cache buster to force refresh
    const urlWithBuster = `${publicUrl}?t=${Date.now()}`;

    // Save URL to user profile
    await supabase.from('users').update({ avatar_url: urlWithBuster }).eq('id', user.id);
    setUser(prev => ({ ...prev, avatar_url: urlWithBuster }));
    return urlWithBuster;
  };

  // ─── Save availability handler ───
  const handleSaveAvailability = async (groupId, availability, note) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from('availability')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    const payload = {
      group_id: groupId,
      user_id: user.id,
      schedule: availability,
      note: note || '',
    };

    if (existing) {
      await supabase.from('availability').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('availability').insert(payload);
    }
  };

  // ─── Load group availability ───
  const loadGroupAvailability = async (groupId) => {
    if (!user) return [];
    const { data } = await supabase
      .from('availability')
      .select('*, users!user_id(full_name)')
      .eq('group_id', groupId)
      .neq('user_id', user.id);
    return (data || []).map(a => {
      const name = a.users?.full_name || 'A mom';
      return {
        name,
        avatar: name.split(' ').map(w => w[0]).join(''),
        days: a.schedule || {},
        note: a.note || '',
        fromSupabase: true,
      };
    });
  };

  // ─── Load my availability for a group ───
  const loadMyAvailability = async (groupId) => {
    if (!user) return null;
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();
    if (data) return { days: data.schedule || {}, note: data.note || '' };
    return null;
  };

  // ─── Load notifications + poll for updates ───
  useEffect(() => {
    if (!user) return;
    const loadNotifs = () => {
      supabase.from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          if (data) setNotifications(data);
        });
    };
    loadNotifs();
    const poll = setInterval(loadNotifs, 5000);
    return () => clearInterval(poll);
  }, [user]);

  // ─── Create notification for group members ───
  const notifyGroupMembers = async (groupId, type, title, body) => {
    // Get all members of this group
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
    if (!members || members.length === 0) return;

    // Create a notification for each member (except the sender)
    const notifs = members
      .filter(m => m.user_id !== user?.id)
      .map(m => ({
        user_id: m.user_id,
        type,
        title,
        body,
        group_id: groupId,
        is_read: false,
      }));
    if (notifs.length > 0) {
      await supabase.from('notifications').insert(notifs);
    }
  };

  // ─── Load connections + poll for updates ───
  useEffect(() => {
    if (!user) return;
    const loadConns = () => {
      supabase.from('connections')
        .select('*, requester:users!requester_id(id, full_name, email, area, bio, kids, interests, mom_age), recipient:users!recipient_id(id, full_name, email, area, bio, kids, interests, mom_age)')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .then(({ data }) => {
          if (data) setConnections(data);
        });
    };
    loadConns();
    const poll = setInterval(loadConns, 5000);
    return () => clearInterval(poll);
  }, [user]);

  // ─── Send connection request ───
  const sendConnectionRequest = async (recipientId) => {
    if (!user) return { error: 'Not logged in' };

    // Check if there's already a pending incoming request from this person — auto-accept it
    const existing = connections.find(c =>
      c.status === 'pending' && c.requester_id === recipientId && c.recipient_id === user.id
    );
    if (existing) {
      await respondToConnection(existing.id, true, recipientId);
      return { success: true, autoAccepted: true };
    }

    const { data, error } = await supabase.from('connections').insert({
      requester_id: user.id,
      recipient_id: recipientId,
      status: 'pending',
    }).select().single();
    if (error) return { error: error.message };
    hapticSuccess();
    setConnections(prev => [...prev, data]);
    // Notify the recipient
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'connection_request',
      title: 'New Connection Request',
      body: `${user.full_name || 'A mom'} wants to connect with you!`,
      sender_id: user.id,
      is_read: false,
    });
    return { success: true };
  };

  // ─── Accept/decline connection ───
  const respondToConnection = async (connectionId, accept, otherUserId) => {
    const status = accept ? 'accepted' : 'declined';

    if (connectionId) {
      await supabase.from('connections').update({ status }).eq('id', connectionId);
      setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status } : c));
    } else if (accept && otherUserId) {
      const { data: newConn } = await supabase.from('connections').insert({
        requester_id: otherUserId,
        recipient_id: user.id,
        status: 'accepted',
      }).select().single();
      if (newConn) setConnections(prev => [...prev, newConn]);
    }

    // Notify the requester that their request was accepted
    if (accept && otherUserId) {
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'connection_accepted',
        title: 'Connection Accepted!',
        body: `${user.full_name || 'A mom'} accepted your connection request!`,
        sender_id: user.id,
        is_read: false,
      });
    }
  };

  // ─── Unsend a pending connection request ───
  const unsendConnectionRequest = async (otherId) => {
    const conn = connections.find(c =>
      c.requester_id === user?.id && c.recipient_id === otherId && c.status === 'pending'
    );
    if (conn) {
      await supabase.from('connections').delete().eq('id', conn.id);
      setConnections(prev => prev.filter(c => c.id !== conn.id));
      // Also remove the notification
      await supabase.from('notifications').delete()
        .eq('user_id', otherId)
        .eq('type', 'connection_request')
        .filter('body', 'ilike', `%${user.full_name || ''}%`);
    }
  };

  // ─── Disconnect from a user ───
  const disconnectUser = async (otherId) => {
    const conn = connections.find(c =>
      (c.requester_id === otherId || c.recipient_id === otherId) && c.status === 'accepted'
    );
    if (conn) {
      await supabase.from('connections').delete().eq('id', conn.id);
      setConnections(prev => prev.filter(c => c.id !== conn.id));
    }
  };

  // ─── Get connection status with a user ───
  const getConnectionStatus = (otherId) => {
    const conn = connections.find(c =>
      (c.requester_id === otherId || c.recipient_id === otherId)
    );
    if (!conn) return 'none';
    if (conn.status === 'accepted') return 'connected';
    if (conn.status === 'pending' && conn.requester_id === user?.id) return 'sent';
    if (conn.status === 'pending' && conn.recipient_id === user?.id) return 'received';
    return 'none';
  };

  // ─── Get list of connected user IDs ───
  const getConnectedIds = () => {
    return connections
      .filter(c => c.status === 'accepted')
      .map(c => c.requester_id === user?.id ? c.recipient_id : c.requester_id);
  };

  // ─── Propose meetup handler ───
  const handleProposeMeetup = async (groupId, proposal) => {
    if (!user) return { error: 'Not logged in' };
    console.log('Creating proposal:', { groupId, userId: user.id, title: proposal.title });
    const { data, error } = await supabase.from('meetup_proposals').insert({
      group_id: groupId,
      created_by: user.id,
      title: proposal.title,
      description: proposal.description,
      time_options: proposal.timeOptions,
      location_options: proposal.locationOptions,
      status: 'voting',
    }).select().single();

    if (error) {
      console.error('Proposal create error:', error);
      alert('Error creating poll: ' + error.message);
      return { error: error.message };
    }
    console.log('Proposal created:', data);

    // Notify group members about new poll
    const groupName = (groups || []).find(g => g.id === groupId)?.name || 'your group';
    await notifyGroupMembers(groupId, 'new_poll', 'New Poll', `${user.full_name || 'A member'} posted a new poll in ${groupName}: "${proposal.title}". Vote now!`);

    return { data };
  };

  // ─── Load meetup proposals for a group ───
  const loadMeetupProposals = async (groupId) => {
    const { data } = await supabase
      .from('meetup_proposals')
      .select('*, votes(id, user_id, vote_type, option_index, users!user_id(full_name)), users!created_by(full_name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    return data || [];
  };

  // ─── Vote on meetup option ───
  const handleVote = async (proposalId, optionType, optionValue) => {
    if (!user) return;
    // Remove existing vote for this type on this proposal
    const { error: delErr } = await supabase.from('votes')
      .delete()
      .eq('proposal_id', proposalId)
      .eq('user_id', user.id)
      .eq('vote_type', optionType);
    if (delErr) console.error('Vote delete error:', delErr);

    // Insert new vote
    const { error: insErr } = await supabase.from('votes').insert({
      proposal_id: proposalId,
      user_id: user.id,
      vote_type: optionType,
      option_index: optionValue,
    });
    if (insErr) {
      console.error('Vote insert error:', insErr);
      alert('Error saving vote: ' + insErr.message);
    } else {
      haptic('Light');
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.fullScreen, background: "#FFFBFC", justifyContent: "center", alignItems: "center" }}>
        <img src="/logo.png" alt="MamaSquads" style={{ width: "80%", maxWidth: 360, objectFit: "contain" }} />
        <p style={{ marginTop: 16, fontSize: 14, color: "#888" }}>Loading...</p>
      </div>
    );
  }

  // ─── Reset Password Screen (shown after clicking reset link in email) ───
  if (showResetPassword) {
    return <ResetPasswordScreen onUpdatePassword={handleUpdatePassword} />;
  }

  // Welcome / About Us / Onboarding / Access Path
  if (screen === "welcome") return <WelcomeScreen onContinue={() => navigate("screen", "about")} fadeIn={fadeIn} />;
  if (screen === "about") return <AboutScreen onContinue={() => navigate("screen", "access")} fadeIn={fadeIn} />;
  if (screen === "access") return (
    <AccessGateScreen
      onInviteCode={(code) => { setInviteCode(code); setIsBetaMember(true); navigate("screen", "onboard"); }}
      onPublicSignup={() => { setInviteCode(null); setIsBetaMember(false); navigate("screen", "onboard"); }}
      onSignIn={handleSignIn}
      onForgotPassword={handleForgotPassword}
      fadeIn={fadeIn}
    />
  );
  if (screen === "onboard") return (
    <OnboardingScreen
      step={onboardStep}
      setStep={setOnboardStep}
      onComplete={handleSignup}
      signupError={signupError}
      fadeIn={fadeIn}
    />
  );
  if (screen === "verify") return <VerificationScreen onComplete={handleVerificationComplete} fadeIn={fadeIn} />;

  // HARD GATE: Block unverified users from accessing anything
  if (screen === "main" && !isVerified) {
    return <VerificationBlockedScreen onVerify={() => navigate("screen", "verify")} user={user} />;
  }

  // Main App — only accessible to verified OR beta users
  if (screen === "main" && isVerified && showTutorial) {
    const tutorialSlides = [
      { emoji: "👋", title: "Welcome to MamaSquads!", desc: "Here's a quick tour of how everything works." },
      { emoji: "🏠", title: "Home", desc: "See upcoming playdates from your groups. Filter by day or age group. Tap any playdate to RSVP, comment, or see who's going." },
      { emoji: "👥", title: "Groups", desc: "Join groups to connect with local moms. Inside each group you can post playdates, propose meetups, create polls, share photos, and see other members." },
      { emoji: "➕", title: "Create", desc: "Tap the + button to create a new playdate. Pick a date, time, location, and age group. Other moms in your groups will be notified." },
      { emoji: "🔔", title: "Alerts", desc: "Get notified when someone posts a playdate, creates a poll, requests to join your group, or wants to connect. Tap any notification to go there." },
      { emoji: "👤", title: "Me", desc: "Your profile, availability, and settings are all here. Other moms can see your Quick Q's, interests, and kids' ages. Tap Discover to find and connect with moms near you." },
      { emoji: "🗳️", title: "Polls", desc: "Inside groups, propose a meetup by picking a day. Members vote on the best time. The winning time can become a playdate with one tap." },
      { emoji: "📲", title: "Add to Home Screen", desc: "For the best experience, add MamaSquads to your home screen!\n\niPhone: Tap the share button (□↑) at the bottom of Safari, then tap \"Add to Home Screen.\"\n\nAndroid: Tap the menu (⋮) in Chrome, then tap \"Add to Home screen.\"" },
      { emoji: "🎉", title: "You're all set!", desc: "Start by exploring groups or creating your first playdate. The more you engage, the more moms you'll meet!" },
    ];
    const slide = tutorialSlides[tutorialStep];
    return (
      <div style={{ ...styles.fullScreen, background: "#6B2C3B", justifyContent: "center", alignItems: "center" }}>
        <div style={{ maxWidth: 340, width: "100%", textAlign: "center", padding: 24 }}>
          <span style={{ fontSize: 64 }}>{slide.emoji}</span>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, color: "white", marginTop: 16 }}>{slide.title}</h2>
          <p style={{ fontSize: 15, color: "#D4B5BA", marginTop: 12, lineHeight: 1.6, whiteSpace: "pre-line" }}>{slide.desc}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24 }}>
            {tutorialSlides.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i === tutorialStep ? "white" : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {tutorialStep > 0 && (
              <button style={{ flex: 1, padding: "14px 0", borderRadius: 50, background: "none", border: "1px solid rgba(255,255,255,0.3)", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onClick={() => setTutorialStep(tutorialStep - 1)}>Back</button>
            )}
            <button
              style={{ flex: 1, padding: "14px 0", borderRadius: 50, background: "white", color: "#6B2C3B", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", border: "none" }}
              onClick={() => {
                if (tutorialStep >= tutorialSlides.length - 1) {
                  localStorage.setItem('mamasquads_tutorial_v2', 'true');
                  setShowTutorial(false);
                } else {
                  setTutorialStep(tutorialStep + 1);
                }
              }}
            >
              {tutorialStep >= tutorialSlides.length - 1 ? "Let's Go!" : "Next"}
            </button>
          </div>
          <button
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 16 }}
            onClick={() => { localStorage.setItem('mamasquads_tutorial_v2', 'true'); setShowTutorial(false); }}
          >
            Skip tutorial
          </button>
        </div>
      </div>
    );
  }

  if (screen === "main" && isVerified) {
    if (showMyProfile) return (
      <div style={{ ...styles.detailScreen, overflow: "auto", overflowY: "scroll", WebkitOverflowScrolling: "touch", paddingTop: "env(safe-area-inset-top, 20px)", paddingBottom: "calc(120px + env(safe-area-inset-bottom, 34px))" }}>
        <MyProfileTab
          isBetaMember={isBetaMember} user={user} setUser={setUser}
          joinedEvents={joinedEvents} joinedGroups={joinedGroups}
          connections={connections || []} onSwitchTab={() => {}}
          onShowDiscover={() => { setShowMyProfile(false); setTab("discover"); }}
          notifications={notifications} setNotifications={setNotifications}
          onUploadPhoto={uploadProfilePhoto} onBack={() => popNav()}
        />
      </div>
    );
    if (selectedEvent) return (
      <EventDetail event={selectedEvent} onBack={() => popNav()} newComment={newComment} setNewComment={setNewComment} joinedEvents={joinedEvents} setJoinedEvents={setJoinedEvents} onRsvp={handleRsvp} onPostComment={handlePostComment} user={user} onDelete={handleDeleteEvent} fadeIn={fadeIn} />
    );
    if (selectedProfile) return (
      <ProfileDetail profile={selectedProfile} onBack={() => popNav()} onConnect={sendConnectionRequest} onAccept={respondToConnection} onDisconnect={disconnectUser} onUnsend={unsendConnectionRequest} connectionStatus={selectedProfile ? getConnectionStatus(selectedProfile.id) : 'none'} connections={connections} user={user} fadeIn={fadeIn} onMessage={async (p) => {
        try {
          // Find existing conversation
          const { data: all, error: findErr } = await supabase.from('conversations').select('*');
          if (findErr) { alert('Error loading conversations: ' + findErr.message); return; }
          let convo = (all || []).find(c =>
            (c.participant_1 === user.id && c.participant_2 === p.id) ||
            (c.participant_1 === p.id && c.participant_2 === user.id)
          );
          if (!convo) {
            const { data: newConvo, error: createErr } = await supabase.from('conversations')
              .insert({ participant_1: user.id, participant_2: p.id })
              .select().single();
            if (createErr) { alert('Error creating conversation: ' + createErr.message); return; }
            convo = newConvo;
          }
          if (convo) {
            pushNav({});
            setSelectedConversation({ convo, other: { id: p.id, full_name: p.name, avatar_url: p.avatar_url } });
          } else {
            alert('Could not open conversation. Please try again.');
          }
        } catch (e) {
          alert('Error: ' + e.message);
        }
      }} />
    );
    if (tab === "create") return <CreateEventScreen onBack={() => setTab("home")} onSubmit={async (data) => { const result = await handleCreateEvent(data); if (!result.error) setTab("home"); return result; }} user={user} fadeIn={fadeIn} />;
    if (showAdminApply) return <AdminApplyScreen onBack={() => popNav()} user={user} fadeIn={fadeIn} />;
    if (showCreateGroup) return <CreateGroupScreen onBack={() => popNav()} onSubmit={handleCreateGroup} fadeIn={fadeIn} />;
    if (showDiscover) return (
      <div style={styles.detailScreen}>
        <div style={styles.detailHeader}>
          <button style={styles.backBtn} onClick={() => popNav()}>{Icons.back}</button>
          <h2 style={styles.detailTitle}>Discover Moms</h2>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <DiscoverTab
            user={user}
            onProfileSelect={(p) => { pushNav({}); setShowDiscover(false); setSelectedProfile(p); }}
            onAdminApply={() => { pushNav({}); setShowDiscover(false); setShowAdminApply(true); }}
          />
        </div>
      </div>
    );
    if (selectedConversation) return (
      <ChatScreen user={user} conversation={selectedConversation.convo} otherUser={selectedConversation.other} onBack={() => popNav()} />
    );
    if (selectedGroupChat) return (
      <ChatScreen user={user} group={selectedGroupChat} onBack={() => popNav()} />
    );
    if (selectedGroup) return (
      <GroupDetailScreen
        group={selectedGroup}
        onBack={() => popNav()}
        joinedGroups={joinedGroups}
        setJoinedGroups={setJoinedGroups}
        pendingJoins={pendingJoins}
        setPendingJoins={setPendingJoins}
        groupRequests={groupRequests}
        setGroupRequests={setGroupRequests}
        user={user}
        onJoinRequest={handleJoinRequest}
        onApproveRequest={handleApproveRequest}
        onDenyRequest={handleDenyRequest}
        onCreateEvent={handleCreateEvent}
        onSaveAvailability={handleSaveAvailability}
        loadGroupAvailability={loadGroupAvailability}
        loadMyAvailability={loadMyAvailability}
        onProposeMeetup={handleProposeMeetup}
        loadMeetupProposals={loadMeetupProposals}
        onVote={handleVote}
        events={events}
        joinedEvents={joinedEvents}
        onEventSelect={(e) => { pushNav({}); setSelectedEvent(e); }}
        onViewProfile={(req) => { pushNav({}); setSelectedProfile({ id: req.userId, name: req.name, avatar: req.avatar, bio: req.bio, ages: req.ages, area: '', interests: [], isVerified: true, fromSupabase: true }); }}
        fadeIn={fadeIn}
      />
    );

    return (
      <div style={styles.app}>
        {/* Profile avatar button — top right, Home tab only */}
        {tab === "home" && (
          <button
            onClick={() => { pushNav({}); setShowMyProfile(true); }}
            style={{
              position: "fixed", top: "max(14px, calc(10px + env(safe-area-inset-top, 14px)))", right: "calc(50% - 200px)",
              zIndex: 110, background: "white", border: "2.5px solid #6B2C3B", borderRadius: "50%",
              width: 42, height: 42, padding: 0, cursor: "pointer", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(107,44,59,0.25)",
            }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Me" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <span style={{ fontSize: 14, fontWeight: 700, color: "white", background: "#6B2C3B", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                {(user?.full_name || "M").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            )}
          </button>
        )}
        <div ref={mainContentRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ ...styles.mainContent, opacity: fadeIn ? 1 : 0, transition: "opacity 0.15s ease" }}>
          {pullIndicator > 0 && (
            <div style={{ textAlign: "center", padding: `${pullIndicator}px 0 0`, transition: "padding 0.1s", color: "#6B2C3B", fontSize: 13 }}>
              {pullIndicator >= 40 ? "Release to refresh" : "Pull to refresh"}
            </div>
          )}
          {pullRefreshing && <div style={{ textAlign: "center", padding: 12, color: "#6B2C3B", fontSize: 13 }}>Refreshing...</div>}
          {tab === "home" && (
            <HomeTab
              events={events}
              groups={groups}
              joinedGroups={joinedGroups}
              selectedDay={selectedDay} setSelectedDay={setSelectedDay}
              selectedAge={selectedAge} setSelectedAge={setSelectedAge}
              onEventSelect={(e) => { pushNav({}); navigate("event", e); }}
              onCreateEvent={() => setTab("create")}
              onGroupSelect={(g) => { pushNav({}); setSelectedGroup(g); }}
              joinedEvents={joinedEvents}
            />
          )}
          {tab === "discover" && (
            <DiscoverTab
              user={user}
              setUser={setUser}
              isBetaMember={isBetaMember}
              joinedEvents={joinedEvents}
              joinedGroups={joinedGroups}
              notifications={notifications}
              setNotifications={setNotifications}
              connections={connections}
              onUploadPhoto={uploadProfilePhoto}
              onProfileSelect={(p) => { pushNav({}); navigate("profile", p); }}
              onAdminApply={() => { pushNav({}); setShowAdminApply(true); }}
            />
          )}
          {tab === "groups" && (
            <GroupsTab
              groups={groups}
              onGroupSelect={(g) => { pushNav({}); setSelectedGroup(g); }}
              onCreateGroup={() => { pushNav({}); setShowCreateGroup(true); }}
              onAdminApply={() => { pushNav({}); setShowAdminApply(true); }}
              joinedGroups={joinedGroups}
              pendingJoins={pendingJoins}
              userRole={user?.role}
            />
          )}
          {tab === "notifications" && (
            <NotificationsTab notifications={notifications} setNotifications={setNotifications} user={user} groups={groups} onNavigate={async (notif) => {
              // Helper to navigate to a user's profile by ID
              const goToProfile = async (userId) => {
                if (!userId) return;
                const { data: profile } = await supabase.from('users').select('id, full_name, area, bio, kids, interests, is_verified, role, avatar_url, quick_answers').eq('id', userId).single();
                if (profile) {
                  const name = profile.full_name || 'A mom';
                  const kidAges = (profile.kids || []).map(k => formatAge(k.birthday)).filter(Boolean);
                  setSelectedProfile({
                    id: profile.id, name, avatar: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
                    bio: profile.bio || '', ages: kidAges.map(a => a.includes('mo') || a === 'Newborn' ? a : a + ' yrs').join(', '),
                    interests: profile.interests || [], area: profile.area || '',
                    isVerified: profile.is_verified, role: profile.role, avatar_url: profile.avatar_url, quick_answers: profile.quick_answers || {},
                  });
                }
              };

              pushNav({});

              // Join request → go to the group
              if (notif.type === 'join_request' && notif.group_id) {
                const group = (groups || []).find(g => g.id === notif.group_id);
                if (group) { setSelectedGroup(group); return; }
              }

              // Admin application → go to the applicant's profile
              if (notif.type === 'admin_application') {
                const senderId = notif.sender_id;
                if (senderId) { await goToProfile(senderId); return; }
                // Fallback: try matching name in notification body
                if (notif.body) {
                  const { data: allUsers } = await supabase.from('users').select('id, full_name').neq('id', user?.id || '');
                  const match = (allUsers || []).find(u => u.full_name && notif.body.includes(u.full_name));
                  if (match) { await goToProfile(match.id); return; }
                }
              }

              // New event → go to event or group
              if (notif.type === 'new_event' && notif.group_id) {
                const groupEvent = (events || []).find(e => e.groupId === notif.group_id);
                if (groupEvent) { setSelectedEvent(groupEvent); return; }
                const group = (groups || []).find(g => g.id === notif.group_id);
                if (group) { setSelectedGroup(group); return; }
              }

              // Connection request/accepted → go to their profile
              if (notif.type === 'connection_request' || notif.type === 'connection_accepted') {
                let senderId = notif.sender_id;
                if (!senderId && notif.body) {
                  const { data: allUsers } = await supabase.from('users').select('id, full_name').neq('id', user?.id || '');
                  const match = (allUsers || []).find(u => u.full_name && notif.body.includes(u.full_name));
                  if (match) senderId = match.id;
                }
                if (senderId) { await goToProfile(senderId); return; }
              }

              // Any other notification with a group → go to the group
              if (notif.group_id) {
                const group = (groups || []).find(g => g.id === notif.group_id);
                if (group) { setSelectedGroup(group); return; }
              }
            }} />
          )}
          {tab === "messages" && (
            <MessagesTab
              user={user}
              conversations={conversations}
              groups={groups}
              joinedGroups={joinedGroups}
              onOpenConvo={(convo, other) => { pushNav({}); setSelectedConversation({ convo, other }); }}
              onOpenGroupChat={(g) => { pushNav({}); setSelectedGroupChat(g); }}
            />
          )}
        </div>
        <BottomNav tab={tab} setTab={setTab} unreadNotifications={(notifications || []).filter(n => !n.is_read).length} unreadMessages={unreadMsgCount} />
      </div>
    );
  }
  return null;
}

// ─── Welcome Screen ───
function WelcomeScreen({ onContinue, fadeIn }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);
  return (
    <div style={{ ...styles.fullScreen, background: "#F3E0E3" }}>
      <div style={{ ...styles.welcomeContent, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <img src="/logo.png" alt="MamaSquads" style={{ width: "100%", maxWidth: 500, objectFit: "contain", marginBottom: 20 }} />
        <p style={{ ...styles.welcomeSubtitle, marginTop: 0, color: "#6B2C3B" }}>The verified, moms-only community<br />where kids play & friendships bloom</p>
        <div style={{ ...styles.welcomeFeatures, opacity: show ? 1 : 0, transition: "opacity 1s ease 0.4s" }}>
          {["Verified moms only", "ID + background checked", "Safe, trusted playdates"].map((f, i) => (
            <div key={i} style={{ ...styles.welcomeFeature, color: "#6B2C3B", animationDelay: `${0.6 + i * 0.15}s` }}>
              <span style={{ ...styles.featureDot, background: "#6B2C3B" }} />{f}
            </div>
          ))}
        </div>
        <button style={{ ...styles.primaryBtn, background: "#6B2C3B", color: "white", boxShadow: "0 4px 16px rgba(107,44,59,0.3)" }} onClick={onContinue}>
          Get Started
        </button>
      </div>
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Verification Blocked Screen (Hard Gate) ───
function VerificationBlockedScreen({ onVerify, user }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(user?.verification_status || null);
  const [error, setError] = useState(null);

  // Check if user already paid but verification is pending
  useEffect(() => {
    if (user?.verification_status === 'pending') setStatus('pending');
    if (user?.verification_status === 'paid') setStatus('paid');
    if (user?.verification_status === 'failed') setStatus('failed');
  }, [user]);

  const handlePayAndVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) { setError('Not logged in. Please sign out and sign in again.'); setLoading(false); return; }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId: user?.id, email: user?.email }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) { setError(data.error || `Server error (${res.status}). Please try again.`); setLoading(false); return; }
      if (data.error) { setError(data.error); setLoading(false); return; }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('No checkout URL returned. Please try again.');
        setLoading(false);
      }
    } catch (e) {
      setError(e.name === 'AbortError' ? 'Request timed out. Please try again.' : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleStartIdentity = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-identity-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.fullScreen, background: "#FFFBFC" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, maxWidth: 340 }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#E65100" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M12 8v4M12 16h.01" strokeWidth="2"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#2D2D2D" }}>Verification Required</h2>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
          MamaSquads is a moms-only community. To protect every child and family, we verify every member before granting access.
        </p>

        {status === 'pending' ? (
          <>
            <div style={{ width: "100%", background: "#FFF8E1", borderRadius: 12, padding: 16 }}>
              <span style={{ fontSize: 32 }}>⏳</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#E65100", marginTop: 8 }}>Verification Under Review</h3>
              <p style={{ fontSize: 13, color: "#666", marginTop: 6, lineHeight: 1.5 }}>Your ID and selfie have been submitted. We'll notify you once your verification is approved. This usually takes a few minutes.</p>
            </div>
            <button style={{ ...styles.secondaryBtn, width: "100%" }} onClick={() => window.location.reload()}>
              Check Status
            </button>
          </>
        ) : status === 'paid' ? (
          <>
            <div style={{ width: "100%", background: "#E8F5E9", borderRadius: 12, padding: 16 }}>
              <span style={{ fontSize: 32 }}>✅</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2E7D32", marginTop: 8 }}>Payment Received!</h3>
              <p style={{ fontSize: 13, color: "#666", marginTop: 6, lineHeight: 1.5 }}>Now complete your ID verification. You'll need to upload a photo ID and take a selfie.</p>
            </div>
            <button
              style={{ ...styles.primaryBtn, background: "linear-gradient(135deg, #4CAF50, #388E3C)", boxShadow: "0 4px 16px rgba(76,175,80,0.3)", width: "100%", opacity: loading ? 0.6 : 1 }}
              disabled={loading}
              onClick={handleStartIdentity}
            >
              {loading ? "Loading..." : "Verify My Identity"}
            </button>
          </>
        ) : status === 'failed' ? (
          <>
            <div style={{ width: "100%", background: "#FFEBEE", borderRadius: 12, padding: 16 }}>
              <span style={{ fontSize: 32 }}>❌</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#C62828", marginTop: 8 }}>Verification Failed</h3>
              <p style={{ fontSize: 13, color: "#666", marginTop: 6, lineHeight: 1.5 }}>We couldn't verify your identity. This may be due to an unclear photo or a mismatch. Please try again.</p>
            </div>
            <button
              style={{ ...styles.primaryBtn, background: "linear-gradient(135deg, #4CAF50, #388E3C)", boxShadow: "0 4px 16px rgba(76,175,80,0.3)", width: "100%", opacity: loading ? 0.6 : 1 }}
              disabled={loading}
              onClick={handleStartIdentity}
            >
              {loading ? "Loading..." : "Try Again"}
            </button>
          </>
        ) : (
          <>
            <div style={{ width: "100%", background: "#FFF8E1", borderRadius: 12, padding: 16, textAlign: "left" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#E65100", marginBottom: 8 }}>What's included:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Government-issued photo ID verification",
                  "Live selfie facial matching",
                  "Background check screening",
                  "Lifetime access to MamaSquads",
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 10, background: "#FFE0B2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#E65100" }}>✓</span>
                    </div>
                    <span style={{ fontSize: 13, color: "#555" }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: "100%", background: "white", borderRadius: 12, padding: 16, border: "2px solid #6B2C3B" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#6B2C3B" }}>$9.99</p>
              <p style={{ fontSize: 12, color: "#888" }}>One-time verification fee</p>
            </div>
            <button
              style={{ ...styles.primaryBtn, background: "linear-gradient(135deg, #6B2C3B, #4A1D2A)", boxShadow: "0 4px 16px rgba(107,44,59,0.3)", width: "100%", opacity: loading ? 0.6 : 1 }}
              disabled={loading}
              onClick={handlePayAndVerify}
            >
              {loading ? "Loading..." : "Pay & Verify — $9.99"}
            </button>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {["256-bit Encrypted", "Secure Payment", "Powered by Stripe"].map((b, i) => (
                <span key={i} style={{ fontSize: 10, color: "#999", background: "#f5f5f5", padding: "3px 8px", borderRadius: 50 }}>{b}</span>
              ))}
            </div>
          </>
        )}
        {error && <p style={{ fontSize: 13, color: "#C62828" }}>{error}</p>}
        <p style={{ fontSize: 11, color: "#ACACAC" }}>Need help? <a href="mailto:mama.squads1@gmail.com" style={{ color: "#6B2C3B", textDecoration: "none" }}>mama.squads1@gmail.com</a></p>
        <button style={{ width: "100%", padding: "12px 0", borderRadius: 50, background: "none", border: "1.5px solid #ddd", color: "#666", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 12 }} onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}>Sign Out</button>
      </div>
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Reset Password Screen (shown after clicking reset link) ───
function ResetPasswordScreen({ onUpdatePassword }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    setSaving(true);
    setError(null);
    const result = await onUpdatePassword(newPassword);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div style={{ ...styles.fullScreen, background: "#FFFBFC", overflow: "auto", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 44 }}>🔑</span>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#2D2D2D", marginTop: 8 }}>
            {success ? "Password Updated!" : "Set New Password"}
          </h2>
          <p style={{ fontSize: 14, color: "#888", marginTop: 6 }}>
            {success ? "You can now sign in with your new password." : "Enter your new password below."}
          </p>
        </div>
        {success ? (
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 48 }}>✅</span>
            <p style={{ fontSize: 14, color: "#2E7D32", marginTop: 12, fontWeight: 600 }}>Your password has been reset successfully. The app will load momentarily.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              style={styles.input}
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setError(null); }}
            />
            <input
              style={styles.input}
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(null); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {error && <p style={{ fontSize: 12, color: "#E53935", textAlign: "center" }}>{error}</p>}
            <button
              style={{ ...styles.primaryBtn, opacity: saving ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}
      </div>
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Access Gate Screen (Beta Invite vs Public Signup) ───
function AccessGateScreen({ onInviteCode, onPublicSignup, onSignIn, onForgotPassword, fadeIn }) {
  const [mode, setMode] = useState(null); // null, "invite", "public", "signin"
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  const [checking, setChecking] = useState(false);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState(null);
  const [signingIn, setSigningIn] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState(null);

  const handleCodeSubmit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setChecking(true);
    setCodeError(false);

    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', trimmed)
      .single();

    setChecking(false);

    if (data && !error) {
      setCodeError(false);
      setCodeSuccess(true);
      setTimeout(() => onInviteCode(trimmed), 1200);
    } else {
      setCodeError(true);
      setCodeSuccess(false);
    }
  };

  return (
    <div style={{ ...styles.fullScreen, background: "#FFFBFC", overflow: "auto", justifyContent: "flex-start", paddingTop: 40 }}>
      <div style={{ width: "100%", maxWidth: 400, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease" }}>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/logo.png" alt="MamaSquads" style={{ width: "80%", maxWidth: 320, objectFit: "contain" }} />
          <p style={{ fontSize: 14, color: "#888", marginTop: 6, lineHeight: 1.5 }}>Choose how you'd like to get started</p>
        </div>

        {/* Option 1: Invite Code */}
        <div
          style={{
            ...ags.optionCard,
            border: mode === "invite" ? "2px solid #6B2C3B" : "2px solid #f0f0f0",
            background: mode === "invite" ? "#FAF0F2" : "white",
          }}
          onClick={() => setMode("invite")}
        >
          <div style={ags.optionHeader}>
            <div style={{ ...ags.optionIcon, background: "#FAF0F2" }}>⭐</div>
            <div style={{ flex: 1 }}>
              <h3 style={ags.optionTitle}>I Have an Invite Code</h3>
              <p style={ags.optionDesc}>For founding members personally invited by CiCi</p>
            </div>
            <div style={{ ...ags.radio, borderColor: mode === "invite" ? "#6B2C3B" : "#ddd" }}>
              {mode === "invite" && <div style={{ ...ags.radioDot, background: "#6B2C3B" }} />}
            </div>
          </div>
          {mode === "invite" && (
            <div style={{ marginTop: 14 }}>
              <div style={ags.betaBadgeRow}>
                <span style={ags.betaBadge}>FOUNDING MEMBER</span>
                <span style={{ fontSize: 11, color: "#888" }}>Early access, no verification fee</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                <input
                  style={{
                    ...styles.input,
                    borderColor: codeError ? "#E53935" : codeSuccess ? "#6B2C3B" : "#E8E8E8",
                    background: codeSuccess ? "#FAF0F2" : "white",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                  placeholder="Enter invite code"
                  value={code}
                  onChange={e => { setCode(e.target.value); setCodeError(false); }}
                  maxLength={20}
                />
                {codeError && (
                  <p style={{ fontSize: 12, color: "#E53935", textAlign: "center" }}>Invalid code. Check with CiCi for your invite code.</p>
                )}
                {codeSuccess && (
                  <div style={{ textAlign: "center", padding: 8 }}>
                    <span style={{ fontSize: 24 }}>🎉</span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#6B2C3B", marginTop: 4 }}>Welcome, Founding Mom!</p>
                  </div>
                )}
                {!codeSuccess && (
                  <button
                    style={{ ...styles.primaryBtn, background: "#6B2C3B", boxShadow: "0 4px 16px rgba(107,44,59,0.3)", marginTop: 4, opacity: checking ? 0.6 : 1 }}
                    onClick={handleCodeSubmit}
                    disabled={checking}
                  >
                    {checking ? "Checking..." : "Redeem Code"}
                  </button>
                )}
              </div>
              <div style={{ marginTop: 12, padding: 12, background: "#FAF0F2", borderRadius: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#6B2C3B", marginBottom: 6 }}>Founding member perks:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    "Skip the verification fee (free access!)",
                    "\"Founding Member\" badge on your profile forever",
                    "Help shape MamaSquads with direct feedback to CiCi",
                    "Priority access to all future features",
                    "Lifetime free membership when premium launches",
                  ].map((p, i) => (
                    <span key={i} style={{ fontSize: 12, color: "#555" }}>✓ {p}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Option 2: Public Signup */}
        <div
          style={{
            ...ags.optionCard,
            border: mode === "public" ? "2px solid #6B2C3B" : "2px solid #f0f0f0",
            background: mode === "public" ? "#FAF0F2" : "white",
            marginTop: 12,
          }}
          onClick={() => setMode("public")}
        >
          <div style={ags.optionHeader}>
            <div style={{ ...ags.optionIcon, background: "#FAF0F2" }}>🛡️</div>
            <div style={{ flex: 1 }}>
              <h3 style={ags.optionTitle}>Sign Up as a New Mom</h3>
              <p style={ags.optionDesc}>Full verification to keep our community safe</p>
            </div>
            <div style={{ ...ags.radio, borderColor: mode === "public" ? "#6B2C3B" : "#ddd" }}>
              {mode === "public" && <div style={{ ...ags.radioDot, background: "#6B2C3B" }} />}
            </div>
          </div>
          {mode === "public" && (
            <div style={{ marginTop: 14 }}>
              <div style={{ padding: 12, background: "white", borderRadius: 10, border: "1px solid #f0f0f0" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginBottom: 8 }}>Verification includes:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { icon: "🪪", text: "Government photo ID upload" },
                    { icon: "🤳", text: "Live selfie for facial matching" },
                    { icon: "📋", text: "Mom/guardian status confirmation" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{s.icon}</span>
                      <span style={{ fontSize: 12, color: "#555" }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 12px", background: "#FFF8E1", borderRadius: 8 }}>
                <span style={{ fontSize: 14 }}>💡</span>
                <p style={{ fontSize: 11, color: "#888", lineHeight: 1.3 }}>One-time $9.99 safety verification fee. Background checks will be available soon as an optional premium upgrade.</p>
              </div>
              <button style={{ ...styles.primaryBtn, marginTop: 12, background: "#6B2C3B", boxShadow: "0 4px 16px rgba(107,44,59,0.3)" }} onClick={onPublicSignup}>
                Continue to Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Sign In for existing users */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            style={{ background: "none", border: "none", fontSize: 14, color: "#888", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}
            onClick={() => setMode(mode === "signin" ? null : "signin")}
          >
            Already have an account? Sign In
          </button>
        </div>

        {mode === "signin" && (
          <div style={{ ...ags.optionCard, border: "2px solid #3B82F6", background: "#F0F7FF", marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>👋</span>
              <div>
                <h3 style={ags.optionTitle}>Welcome Back!</h3>
                <p style={ags.optionDesc}>Sign in with your email and password</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email address"
                value={signInEmail}
                onChange={e => { setSignInEmail(e.target.value); setSignInError(null); }}
              />
              <input
                style={styles.input}
                type="password"
                placeholder="Password"
                value={signInPassword}
                onChange={e => { setSignInPassword(e.target.value); setSignInError(null); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && signInEmail && signInPassword) {
                    setSigningIn(true);
                    setSignInError(null);
                    onSignIn(signInEmail, signInPassword).then(result => {
                      setSigningIn(false);
                      if (result.error) setSignInError(result.error);
                    });
                  }
                }}
              />
              {signInError && (
                <p style={{ fontSize: 12, color: "#E53935", textAlign: "center" }}>{signInError}</p>
              )}
              <button
                style={{ ...styles.primaryBtn, background: "linear-gradient(135deg, #3B82F6, #2563EB)", boxShadow: "0 4px 16px rgba(59,130,246,0.3)", opacity: signingIn ? 0.6 : 1 }}
                disabled={signingIn}
                onClick={async () => {
                  if (!signInEmail || !signInPassword) return;
                  setSigningIn(true);
                  setSignInError(null);
                  const result = await onSignIn(signInEmail, signInPassword);
                  setSigningIn(false);
                  if (result.error) setSignInError(result.error);
                }}
              >
                {signingIn ? "Signing in..." : "Sign In"}
              </button>
              <button
                style={{ background: "none", border: "none", fontSize: 13, color: "#3B82F6", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4, textAlign: "center", width: "100%" }}
                onClick={() => { setShowForgot(true); setForgotEmail(signInEmail); }}
              >
                Forgot password?
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password */}
        {showForgot && (
          <div style={{ ...ags.optionCard, border: "2px solid #F59E0B", background: "#FFFBEB", marginTop: 12 }}>
            {forgotSent ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <span style={{ fontSize: 36 }}>📧</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D", marginTop: 8 }}>Check Your Email!</h3>
                <p style={{ fontSize: 13, color: "#666", marginTop: 6, lineHeight: 1.5 }}>We sent a password reset link to <strong>{forgotEmail}</strong>. Click the link in the email to set a new password.</p>
                <button
                  style={{ ...styles.textBtn, marginTop: 12, fontSize: 13 }}
                  onClick={() => { setShowForgot(false); setForgotSent(false); }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🔑</span>
                    <h3 style={ags.optionTitle}>Reset Password</h3>
                  </div>
                  <button style={{ background: "none", border: "none", fontSize: 16, color: "#999", cursor: "pointer" }} onClick={() => setShowForgot(false)}>✕</button>
                </div>
                <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Enter your email and we'll send you a link to reset your password.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    style={styles.input}
                    type="email"
                    placeholder="Email address"
                    value={forgotEmail}
                    onChange={e => { setForgotEmail(e.target.value); setForgotError(null); }}
                  />
                  {forgotError && (
                    <p style={{ fontSize: 12, color: "#E53935", textAlign: "center" }}>{forgotError}</p>
                  )}
                  <button
                    style={{ ...styles.primaryBtn, background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.3)", opacity: forgotSending ? 0.6 : 1 }}
                    disabled={forgotSending}
                    onClick={async () => {
                      if (!forgotEmail.trim()) return;
                      setForgotSending(true);
                      setForgotError(null);
                      const result = await onForgotPassword(forgotEmail.trim());
                      setForgotSending(false);
                      if (result.error) {
                        setForgotError(result.error);
                      } else {
                        setForgotSent(true);
                      }
                    }}
                  >
                    {forgotSending ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Divider info */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 11, color: "#bbb", lineHeight: 1.4 }}>MamaSquads is currently in beta on Long Island & Westchester/CT.<br />Nationwide expansion coming 2027.</p>
        </div>
      </div>
      <style>{keyframes}</style>
    </div>
  );
}

// Access gate styles
const ags = {
  optionCard: { borderRadius: 16, padding: 18, cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" },
  optionHeader: { display: "flex", alignItems: "center", gap: 12 },
  optionIcon: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 },
  optionTitle: { fontSize: 15, fontWeight: 700, color: "#2D2D2D", fontFamily: "'DM Sans', sans-serif" },
  optionDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, border: "2px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  betaBadgeRow: { display: "flex", alignItems: "center", gap: 8 },
  betaBadge: { fontSize: 10, fontWeight: 700, color: "#FF8F00", background: "#FFF8E1", padding: "3px 10px", borderRadius: 50, letterSpacing: 1 },
};

// ─── About Us Screen ───
function AboutScreen({ onContinue, fadeIn }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);
  return (
    <div style={{ ...styles.fullScreen, background: "#FFFBFC", overflow: "auto", justifyContent: "flex-start", paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
      <div style={{ ...styles.aboutContent, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease" }}>
        <div style={styles.aboutHeader}>
          <span style={{ fontSize: 32 }}>💛</span>
          <h2 style={styles.aboutTitle}>Our Story</h2>
        </div>
        <div style={styles.aboutCard}>
          <p style={styles.aboutText}>
            MamaSquads was born from a simple truth — being a mom is beautiful, rewarding, and sometimes incredibly isolating. We saw too many amazing moms scrolling alone on their couches when there were other amazing moms just blocks away doing the same thing.
          </p>
          <p style={styles.aboutText}>
            We built MamaSquads to change that. To make it effortless to find your people — moms who get it, who live nearby, whose kids are the same age as yours, and who are just as eager to get out of the house.
          </p>
          <div style={styles.aboutDivider} />
          <p style={styles.aboutText}>
            Every playdate is a chance for your kids to learn, grow, and make friends — and for you to exhale, laugh, and feel seen. That's what this app is really about.
          </p>
        </div>
        <div style={styles.aboutFounder}>
          <div style={styles.founderBadge}>
            {Icons.sparkle}
          </div>
          <div>
            <p style={styles.founderLabel}>Founded by</p>
            <p style={styles.founderName}>CiCi Keyles</p>
            <p style={styles.founderRole}>Founder & Mom on a Mission</p>
          </div>
        </div>
        <div style={styles.aboutValues}>
          {[
            { icon: "🪪", title: "ID Verified", desc: "Every mom is identity checked" },
            { icon: "🛡️", title: "Background Checked", desc: "National database screening" },
            { icon: "🔒", title: "Moms Only", desc: "No exceptions, no workarounds" },
          ].map((v, i) => (
            <div key={i} style={styles.valueCard}>
              <span style={{ fontSize: 24 }}>{v.icon}</span>
              <strong style={styles.valueTitle}>{v.title}</strong>
              <span style={styles.valueDesc}>{v.desc}</span>
            </div>
          ))}
        </div>
        <button style={styles.primaryBtn} onClick={onContinue}>
          Create My Account
        </button>
        <p style={styles.aboutFootnote}>By continuing, you agree to our Terms & Privacy Policy</p>
      </div>
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Onboarding ───
function OnboardingScreen({ step, setStep, onComplete, signupError, fadeIn }) {
  const [show, setShow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Controlled form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [children, setChildren] = useState([{ gender: "", birthday: "" }]);
  const [momBirthday, setMomBirthday] = useState("");
  const [selectedInterests, setSelectedInterests] = useState({});
  const [quickAnswers, setQuickAnswers] = useState({});

  const addChild = () => setChildren(prev => [...prev, { gender: "", birthday: "" }]);
  const removeChild = (index) => setChildren(prev => prev.filter((_, i) => i !== index));
  const updateChild = (index, field, value) => {
    setChildren(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  // Dynamic step count: account, kids, vibe, [1 slide per child], about mom, matching
  const kidsWithGender = children.filter(c => c.gender);
  const numKidSlides = Math.max(kidsWithGender.length, 1);
  const totalSteps = 3 + numKidSlides + 2; // account + kids + vibe + [per-child slides] + mom + matching
  const goNext = async () => {
    setLocalError(null);
    // Validate password on step 0
    if (step === 0) {
      if (!email.trim() || !password || !name.trim()) {
        setLocalError("Please fill in your name, email, and password.");
        return;
      }
      const pw = password;
      if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
        setLocalError("Please meet all password requirements before continuing.");
        return;
      }
    }
    if (step >= totalSteps - 1) {
      setSubmitting(true);
      const interests = Object.keys(selectedInterests).filter(k => selectedInterests[k]);
      const kids = children.filter(c => c.gender || c.birthday);
      await onComplete({ email, password, name, area, bio, momBirthday, kids, interests, quickAnswers });
      setSubmitting(false);
      return;
    }
    setShow(false);
    setTimeout(() => {
      setStep(step + 1);
      setShow(true);
    }, 200);
  };

  const steps = [
    {
      title: "Create your account",
      subtitle: "Your login for MamaSquads",
      fields: (
        <div style={styles.onboardFields}>
          <input style={styles.input} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <input style={styles.input} placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input style={styles.input} placeholder="Create a password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: -4 }}>
            {[
              { label: "8+ characters", met: password.length >= 8 },
              { label: "1 uppercase", met: /[A-Z]/.test(password) },
              { label: "1 lowercase", met: /[a-z]/.test(password) },
              { label: "1 number", met: /[0-9]/.test(password) },
              { label: "1 special (!@#$)", met: /[^A-Za-z0-9]/.test(password) },
            ].map((req, i) => (
              <span key={i} style={{ fontSize: 11, color: password ? (req.met ? "#2E7D32" : "#E53935") : "#bbb", display: "flex", alignItems: "center", gap: 3 }}>
                {password ? (req.met ? "✓" : "✕") : "○"} {req.label}
              </span>
            ))}
          </div>
          <BirthdayPicker value={momBirthday} onChange={setMomBirthday} label="Your birthday" inputStyle={styles.input} />
          <input style={styles.input} placeholder="Your area / zip code" value={area} onChange={e => setArea(e.target.value)} />
          <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} placeholder="Write a short bio... (e.g., Coffee-loving boy mom, always at the park!)" value={bio} onChange={e => setBio(e.target.value)} />
        </div>
      ),
    },
    {
      title: "Your little ones",
      subtitle: "We'll match you with age-appropriate playdates",
      fields: (
        <div style={styles.onboardFields}>
          {children.map((child, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, padding: i > 0 ? "12px 0 0" : 0, borderTop: i > 0 ? "1px solid #f0f0f0" : "none" }}>
              {i > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Child {i + 1}</span>
                  <button
                    style={{ background: "none", border: "none", fontSize: 12, color: "#E53935", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                    onClick={() => removeChild(i)}
                  >
                    Remove
                  </button>
                </div>
              )}
              <select style={styles.input} value={child.gender || ''} onChange={e => updateChild(i, "gender", e.target.value)}>
                <option value="">Child's gender</option>
                <option value="Girl">Girl</option>
                <option value="Boy">Boy</option>
              </select>
              <BirthdayPicker value={child.birthday || ''} onChange={val => updateChild(i, "birthday", val)} label="Birthday" inputStyle={styles.input} />
            </div>
          ))}
          <button style={styles.addChildBtn} onClick={addChild}>+ Add another child</button>
        </div>
      ),
    },
    {
      title: "Your vibe",
      subtitle: "Pick what describes you best",
      fields: (
        <div style={styles.interestGrid}>
          {["🏕 Outdoorsy", "🎨 Artsy & Crafty", "📚 Bookworm", "🧘 Wellness", "🍳 Foodie", "🎮 Techy", "🏃 Active", "🎵 Music Lover", "🌱 Eco-Conscious", "☕ Coffee Dates", "🐕 Pet Lover", "🎲 Game Nights"].map((interest, i) => (
            <button
              key={i}
              style={{
                ...styles.interestChip,
                ...(selectedInterests[interest] ? styles.interestChipActive : {}),
              }}
              onClick={() => setSelectedInterests(a => ({ ...a, [interest]: !a[interest] }))}
            >
              {interest}
            </button>
          ))}
        </div>
      ),
    },
    ...(kidsWithGender.length > 0 ? kidsWithGender : [{ gender: "" }]).map((child, ci, arr) => {
      // Count how many of the same gender came before this one
      const sameGenderBefore = arr.slice(0, ci).filter(c => c.gender === child.gender).length;
      const sameGenderTotal = arr.filter(c => c.gender === child.gender).length;
      const number = sameGenderTotal > 1 ? ` ${sameGenderBefore + 1}` : "";
      const kidLabel = child.gender === "Girl" ? `Girl${number}` : child.gender === "Boy" ? `Boy${number}` : "Your child";
      return ({
      title: `Quick Q's: About ${kidLabel}`,
      subtitle: `Help us match ${kidLabel.toLowerCase()} with the right playdates`,
      fields: (
        <div style={styles.onboardFields}>
          {QUICK_QS.kids.map((item, i) => (
            <div key={i} style={styles.promptCard}>
              <p style={styles.promptQuestion}>{item.q.replace(/\{name\}/g, kidLabel)}</p>
              <select style={styles.input} value={quickAnswers[`kid_${ci}_${i}`] || ""} onChange={e => setQuickAnswers(a => ({ ...a, [`kid_${ci}_${i}`]: e.target.value }))}>
                <option value="">Choose one...</option>
                {item.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      ),
    });}),
    {
      title: "Quick Q's: About Mom",
      subtitle: "Let's see what kind of playdate mom you are",
      fields: (
        <div style={styles.onboardFields}>
          {QUICK_QS.mom.map((item, i) => (
            <div key={i} style={styles.promptCard}>
              <p style={styles.promptQuestion}>{item.q}</p>
              <select style={styles.input} value={quickAnswers[`mom_${i}`] || ""} onChange={e => setQuickAnswers(a => ({ ...a, [`mom_${i}`]: e.target.value }))}>
                <option value="">Choose one...</option>
                {item.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Quick Q's: Matching & Social Style",
      subtitle: "Help us find your perfect mom match",
      fields: (
        <div style={styles.onboardFields}>
          {QUICK_QS.matching.map((item, i) => (
            <div key={i} style={styles.promptCard}>
              <p style={styles.promptQuestion}>{item.q}</p>
              <select style={styles.input} value={quickAnswers[`matching_${i}`] || ""} onChange={e => setQuickAnswers(a => ({ ...a, [`matching_${i}`]: e.target.value }))}>
                <option value="">Choose one...</option>
                {item.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const s = steps[step];
  return (
    <div style={{ ...styles.fullScreen, background: "#FFFBFC", overflow: "auto" }}>
      <div style={{ ...styles.onboardContent, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(15px)", transition: "all 0.3s ease" }}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${((step + 1) / totalSteps) * 100}%` }} />
        </div>
        <p style={styles.stepLabel}>Step {step + 1} of {totalSteps}</p>
        <h2 style={styles.onboardTitle}>{s.title}</h2>
        <p style={styles.onboardSubtitle}>{s.subtitle}</p>
        {s.fields}
        {localError && (
          <p style={{ fontSize: 13, color: "#E53935", textAlign: "center", marginBottom: 8 }}>{localError}</p>
        )}
        {signupError && step >= totalSteps - 1 && (
          <p style={{ fontSize: 13, color: "#E53935", textAlign: "center", marginBottom: 8 }}>{signupError}</p>
        )}
        <button style={{ ...styles.primaryBtn, background: "#6B2C3B", boxShadow: "0 4px 16px rgba(107,44,59,0.3)", opacity: submitting ? 0.6 : 1 }} onClick={goNext} disabled={submitting}>
          {submitting ? "Creating account..." : step >= totalSteps - 1 ? "Let's Go! 🎉" : "Continue"}
        </button>
        {step > 0 && (
          <button style={styles.textBtn} onClick={() => { setShow(false); setTimeout(() => { setStep(step - 1); setShow(true); }, 200); }}>
            Back
          </button>
        )}
      </div>
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Identity Verification Screen ───
function VerificationScreen({ onComplete, fadeIn }) {
  const [step, setStep] = useState(0);
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [bgCheckConsent, setBgCheckConsent] = useState(false);
  const [parentConfirm, setParentConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [show, setShow] = useState(true);

  const fileInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  const goNext = () => {
    setShow(false);
    setTimeout(() => {
      setStep(s => s + 1);
      setShow(true);
    }, 200);
  };

  const startVerification = () => {
    setProcessing(true);
    setProcessStep(0);
    const steps = [1, 2, 3, 4, 5];
    steps.forEach((s, i) => {
      setTimeout(() => setProcessStep(s), (i + 1) * 1200);
    });
    setTimeout(() => {
      setProcessing(false);
      setStep(4);
    }, 7500);
  };

  const verifySteps = [
    // Step 0: Intro
    {
      content: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          <div style={vs.shieldContainer}>
            <div style={vs.shieldCircle}>
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#4CAF50" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" stroke="#4CAF50" strokeWidth="2"/></svg>
            </div>
            <div style={vs.shieldRing} />
            <div style={vs.shieldRing2} />
          </div>
          <h2 style={vs.title}>Safety First</h2>
          <p style={vs.subtitle}>MamaSquads is a moms-only community. To protect every child and parent, we verify every single member before they can access the app.</p>
          
          <div style={vs.safetyCard}>
            <div style={vs.safetyHeader}>
              <span style={{ fontSize: 18 }}>🔒</span>
              <strong style={{ fontSize: 14, color: "#2D2D2D" }}>Our 3-Step Verification</strong>
            </div>
            <div style={vs.safetySteps}>
              {[
                { num: "1", icon: "🪪", title: "Photo ID Upload", desc: "Government-issued ID to confirm your identity" },
                { num: "2", icon: "🤳", title: "Live Selfie Match", desc: "Real-time photo matched against your ID" },
                { num: "3", icon: "🛡️", title: "Background Check", desc: "National database screening for sex offender registry & criminal history" },
              ].map((s, i) => (
                <div key={i} style={vs.safetyStep}>
                  <div style={vs.stepNum}>{s.icon}</div>
                  <div>
                    <strong style={{ fontSize: 13, color: "#2D2D2D", display: "block", marginBottom: 2 }}>{s.title}</strong>
                    <span style={{ fontSize: 12, color: "#888", lineHeight: 1.3 }}>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={vs.trustBadges}>
            {["256-bit Encrypted", "COPPA Compliant", "Data Never Sold"].map((b, i) => (
              <span key={i} style={vs.trustBadge}>{b}</span>
            ))}
          </div>

          <button style={{ ...styles.primaryBtn, background: "linear-gradient(135deg, #4CAF50, #388E3C)", boxShadow: "0 4px 16px rgba(76,175,80,0.3)" }} onClick={goNext}>
            Begin Verification
          </button>
          <p style={{ fontSize: 11, color: "#ACACAC", lineHeight: 1.4 }}>Your data is encrypted and only used for identity verification. We comply with all federal and state privacy laws.</p>
        </div>
      ),
    },
    // Step 1: ID Upload
    {
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 40 }}>🪪</span>
            <h2 style={{ ...vs.title, fontSize: 22, marginTop: 8 }}>Upload Your Photo ID</h2>
            <p style={vs.subtitle}>Take a clear photo of a valid government-issued ID (driver's license, passport, or state ID).</p>
          </div>

          <div
            style={{ ...vs.uploadZone, ...(idUploaded ? vs.uploadZoneDone : {}) }}
            onClick={() => { if (!idUploaded) { setIdUploaded(true); } }}
          >
            {idUploaded ? (
              <div style={vs.uploadSuccess}>
                <div style={vs.checkCircle}>
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <strong style={{ fontSize: 15, color: "#2E7D32" }}>ID Photo Captured</strong>
                <span style={{ fontSize: 12, color: "#66BB6A" }}>Government_ID.jpg uploaded</span>
              </div>
            ) : (
              <div style={vs.uploadPrompt}>
                <div style={vs.cameraIcon}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#6B2C3B" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
                <strong style={{ fontSize: 14, color: "#2D2D2D" }}>Tap to Take Photo of ID</strong>
                <span style={{ fontSize: 12, color: "#ACACAC" }}>or upload from your camera roll</span>
              </div>
            )}
          </div>

          <div style={vs.requirementsList}>
            <p style={vs.reqTitle}>ID Requirements:</p>
            {["Must be a valid, non-expired government ID", "Full name must be clearly visible", "Photo on ID must be clearly visible", "All four corners of the ID must be in frame"].map((r, i) => (
              <div key={i} style={vs.reqRow}>
                <span style={vs.reqBullet}>✓</span>
                <span style={{ fontSize: 12, color: "#666" }}>{r}</span>
              </div>
            ))}
          </div>

          <button
            style={{ ...styles.primaryBtn, opacity: idUploaded ? 1 : 0.4, cursor: idUploaded ? "pointer" : "not-allowed" }}
            onClick={() => { if (idUploaded) goNext(); }}
          >
            Continue to Selfie
          </button>
        </div>
      ),
    },
    // Step 2: Selfie Verification
    {
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 40 }}>🤳</span>
            <h2 style={{ ...vs.title, fontSize: 22, marginTop: 8 }}>Take a Verification Selfie</h2>
            <p style={vs.subtitle}>We'll match your selfie to your ID photo to confirm you are who you say you are.</p>
          </div>

          <div
            style={{ ...vs.selfieZone, ...(selfieUploaded ? vs.selfieZoneDone : {}) }}
            onClick={() => { if (!selfieUploaded) setSelfieUploaded(true); }}
          >
            {selfieUploaded ? (
              <div style={vs.uploadSuccess}>
                <div style={vs.checkCircle}>
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <strong style={{ fontSize: 15, color: "#2E7D32" }}>Selfie Captured</strong>
                <span style={{ fontSize: 12, color: "#66BB6A" }}>Face verification photo ready</span>
              </div>
            ) : (
              <div style={vs.selfiePrompt}>
                <div style={vs.selfieFrame}>
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="#6B2C3B" strokeWidth="1"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeWidth="1"/></svg>
                </div>
                <strong style={{ fontSize: 14, color: "#2D2D2D" }}>Tap to Take Selfie</strong>
                <span style={{ fontSize: 12, color: "#ACACAC" }}>Position your face within the frame</span>
              </div>
            )}
          </div>

          <div style={vs.tipsCard}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginBottom: 8 }}>📸 Tips for a clear selfie:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {["Good lighting — face a window if possible", "Remove sunglasses and hats", "Look directly at the camera", "Make sure your full face is visible"].map((t, i) => (
                <span key={i} style={{ fontSize: 12, color: "#666" }}>• {t}</span>
              ))}
            </div>
          </div>

          <button
            style={{ ...styles.primaryBtn, opacity: selfieUploaded ? 1 : 0.4, cursor: selfieUploaded ? "pointer" : "not-allowed" }}
            onClick={() => { if (selfieUploaded) goNext(); }}
          >
            Continue to Background Check
          </button>
        </div>
      ),
    },
    // Step 3: Background Check Consent + Parent Confirmation
    {
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 40 }}>🛡️</span>
            <h2 style={{ ...vs.title, fontSize: 22, marginTop: 8 }}>Background Check & Confirmation</h2>
            <p style={vs.subtitle}>Final step. We run a background check to keep every child safe.</p>
          </div>

          <div style={vs.bgCheckCard}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#2D2D2D", marginBottom: 10 }}>What we screen for:</p>
            {[
              { icon: "🔍", text: "National Sex Offender Registry (NSOR)" },
              { icon: "⚖️", text: "Federal & state criminal records" },
              { icon: "🚨", text: "Violent crime & child endangerment history" },
              { icon: "📋", text: "Identity fraud & alias detection" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: "#444" }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Consent checkboxes */}
          <div style={vs.consentSection}>
            <div style={vs.consentRow} onClick={() => setBgCheckConsent(!bgCheckConsent)}>
              <div style={{ ...vs.checkbox, ...(bgCheckConsent ? vs.checkboxChecked : {}) }}>
                {bgCheckConsent && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <span style={{ fontSize: 13, color: "#444", lineHeight: 1.4, flex: 1 }}>I consent to a background check and understand that my personal information will be screened against national criminal and sex offender databases.</span>
            </div>

            <div style={vs.consentRow} onClick={() => setParentConfirm(!parentConfirm)}>
              <div style={{ ...vs.checkbox, ...(parentConfirm ? vs.checkboxChecked : {}) }}>
                {parentConfirm && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <span style={{ fontSize: 13, color: "#444", lineHeight: 1.4, flex: 1 }}>I confirm that I am a mother or legal female guardian of at least one child, and I understand that MamaSquads is exclusively for verified mothers/guardians.</span>
            </div>
          </div>

          <div style={vs.warningCard}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#D32F2F", marginBottom: 4 }}>⚠️ Important Notice</p>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>Providing false information, using someone else's identity, or failing the background check will result in permanent ban from MamaSquads. We report suspected fraud to the appropriate authorities.</p>
          </div>

          <button
            style={{
              ...styles.primaryBtn,
              background: (bgCheckConsent && parentConfirm) ? "linear-gradient(135deg, #4CAF50, #388E3C)" : undefined,
              boxShadow: (bgCheckConsent && parentConfirm) ? "0 4px 16px rgba(76,175,80,0.3)" : undefined,
              opacity: (bgCheckConsent && parentConfirm) ? 1 : 0.4,
              cursor: (bgCheckConsent && parentConfirm) ? "pointer" : "not-allowed",
            }}
            onClick={() => { if (bgCheckConsent && parentConfirm) startVerification(); }}
          >
            Submit for Verification
          </button>
        </div>
      ),
    },
    // Step 4: Approved!
    {
      content: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, paddingTop: 20 }}>
          <div style={vs.approvedBadge}>
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" strokeWidth="2.5"/></svg>
          </div>
          <h2 style={{ ...vs.title, color: "#2E7D32" }}>You're Verified! ✓</h2>
          <p style={vs.subtitle}>Welcome to MamaSquads' trusted community of verified moms. Your profile now carries a verification badge visible to all members.</p>

          <div style={vs.verifiedCard}>
            <div style={vs.verifiedRow}><span style={vs.verifiedCheck}>✓</span><span>Identity Confirmed</span></div>
            <div style={vs.verifiedRow}><span style={vs.verifiedCheck}>✓</span><span>Selfie Matched</span></div>
            <div style={vs.verifiedRow}><span style={vs.verifiedCheck}>✓</span><span>Background Check Cleared</span></div>
            <div style={vs.verifiedRow}><span style={vs.verifiedCheck}>✓</span><span>Mom Status Verified</span></div>
          </div>

          <div style={vs.badgePreview}>
            <div style={vs.miniAvatar}>JD</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong style={{ fontSize: 14, color: "#2D2D2D" }}>Jane Doe</strong>
                <span style={vs.verifiedBadgeSmall}>✓ Verified Mom</span>
              </div>
              <span style={{ fontSize: 12, color: "#999" }}>This badge will appear on your profile</span>
            </div>
          </div>

          <button style={{ ...styles.primaryBtn, background: "linear-gradient(135deg, #4CAF50, #388E3C)", boxShadow: "0 4px 16px rgba(76,175,80,0.3)" }} onClick={onComplete}>
            Enter MamaSquads 💛
          </button>
        </div>
      ),
    },
  ];

  // Processing overlay
  if (processing) {
    const processingSteps = [
      { label: "Encrypting your data...", icon: "🔐" },
      { label: "Verifying ID document...", icon: "🪪" },
      { label: "Matching selfie to ID...", icon: "🤳" },
      { label: "Running background check...", icon: "🛡️" },
      { label: "Finalizing verification...", icon: "✨" },
    ];
    return (
      <div style={{ ...styles.fullScreen, background: "#FFFBFC" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
          <div style={vs.processingSpinner}>
            <div style={vs.spinnerRing} />
          </div>
          <h2 style={{ ...vs.title, fontSize: 20 }}>Verifying Your Identity</h2>
          <p style={{ fontSize: 13, color: "#888" }}>This usually takes a few moments...</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
            {processingSteps.map((ps, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: processStep >= i + 1 ? 1 : 0.25, transition: "opacity 0.4s ease" }}>
                <span style={{ fontSize: 18 }}>{processStep > i + 1 ? "✅" : ps.icon}</span>
                <span style={{ fontSize: 13, color: processStep > i + 1 ? "#4CAF50" : "#444" }}>{ps.label}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{keyframes}{verifyKeyframes}</style>
      </div>
    );
  }

  return (
    <div style={{ ...styles.fullScreen, background: "#FFFBFC", overflow: "auto", justifyContent: "flex-start", paddingTop: 32 }}>
      <div style={{ width: "100%", maxWidth: 400, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(15px)", transition: "all 0.3s ease" }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= i ? "#4CAF50" : "#E8E8E8", transition: "background 0.3s ease" }} />
          ))}
        </div>

        {verifySteps[step]?.content}
      </div>
      <style>{keyframes}{verifyKeyframes}</style>
    </div>
  );
}

// Verification-specific styles
const vs = {
  shieldContainer: { position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" },
  shieldCircle: { width: 80, height: 80, borderRadius: 40, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 },
  shieldRing: { position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(76,175,80,0.2)", animation: "pulse 3s ease-in-out infinite" },
  shieldRing2: { position: "absolute", inset: -16, borderRadius: "50%", border: "1.5px solid rgba(76,175,80,0.1)", animation: "pulse 3s ease-in-out infinite 0.5s" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2D2D2D" },
  subtitle: { fontSize: 14, color: "#666", lineHeight: 1.6, maxWidth: 320 },
  safetyCard: { width: "100%", background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", textAlign: "left" },
  safetyHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  safetySteps: { display: "flex", flexDirection: "column", gap: 14 },
  safetyStep: { display: "flex", alignItems: "flex-start", gap: 12 },
  stepNum: { width: 40, height: 40, borderRadius: 12, background: "#F8FFF8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  trustBadges: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  trustBadge: { fontSize: 10, fontWeight: 600, padding: "5px 10px", borderRadius: 50, background: "#F0F7FF", color: "#3B82F6" },
  uploadZone: { width: "100%", padding: 32, borderRadius: 16, border: "2px dashed #E8E8E8", background: "#FAFAFA", cursor: "pointer", transition: "all 0.3s ease" },
  uploadZoneDone: { border: "2px solid #4CAF50", background: "#F1F8E9" },
  uploadSuccess: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  checkCircle: { width: 48, height: 48, borderRadius: 24, background: "#4CAF50", display: "flex", alignItems: "center", justifyContent: "center" },
  uploadPrompt: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  cameraIcon: { width: 64, height: 64, borderRadius: 32, background: "#FAF0F2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  requirementsList: { background: "#FAFAFA", borderRadius: 12, padding: 14 },
  reqTitle: { fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginBottom: 8 },
  reqRow: { display: "flex", alignItems: "center", gap: 8, padding: "3px 0" },
  reqBullet: { color: "#4CAF50", fontWeight: 700, fontSize: 12 },
  selfieZone: { width: "100%", padding: 32, borderRadius: 16, border: "2px dashed #E8E8E8", background: "#FAFAFA", cursor: "pointer", transition: "all 0.3s ease" },
  selfieZoneDone: { border: "2px solid #4CAF50", background: "#F1F8E9" },
  selfiePrompt: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  selfieFrame: { width: 80, height: 80, borderRadius: 40, border: "3px dashed #FFB4C6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  tipsCard: { background: "#FFF8E1", borderRadius: 12, padding: 14 },
  bgCheckCard: { background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" },
  consentSection: { display: "flex", flexDirection: "column", gap: 14 },
  consentRow: { display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" },
  checkbox: { width: 24, height: 24, borderRadius: 6, border: "2px solid #E8E8E8", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", marginTop: 1 },
  checkboxChecked: { background: "#4CAF50", borderColor: "#4CAF50" },
  warningCard: { background: "#FFF5F5", borderRadius: 12, padding: 14, border: "1px solid #FFCDD2" },
  processingSpinner: { width: 80, height: 80, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  spinnerRing: { width: 80, height: 80, borderRadius: 40, border: "4px solid #E8F5E9", borderTopColor: "#4CAF50", animation: "spin 1s linear infinite" },
  approvedBadge: { width: 96, height: 96, borderRadius: 48, background: "linear-gradient(135deg, #4CAF50, #2E7D32)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(76,175,80,0.3)" },
  verifiedCard: { width: "100%", background: "#F1F8E9", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 10 },
  verifiedRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#2D2D2D" },
  verifiedCheck: { width: 22, height: 22, borderRadius: 11, background: "#4CAF50", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 },
  badgePreview: { display: "flex", alignItems: "center", gap: 12, width: "100%", background: "white", borderRadius: 12, padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  miniAvatar: { width: 44, height: 44, borderRadius: 22, background: "linear-gradient(135deg, #6B2C3B, #4A1E2A)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15, flexShrink: 0 },
  verifiedBadgeSmall: { fontSize: 10, fontWeight: 600, color: "#2E7D32", background: "#E8F5E9", padding: "2px 8px", borderRadius: 50 },
};

const verifyKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ─── Home Tab ───
// Helper to get event date as a Date object for comparison
const parseEventToDate = (rawDate) => {
  if (!rawDate) return null;
  const dateStr = String(rawDate);
  // ISO format: 2026-04-04 or 2026-04-04T...
  if (dateStr.length >= 10 && dateStr[4] === '-' && dateStr[7] === '-') {
    const y = parseInt(dateStr.substring(0, 4));
    const m = parseInt(dateStr.substring(5, 7));
    const d = parseInt(dateStr.substring(8, 10));
    return new Date(y, m - 1, d);
  }
  // Month/Day/Year format: April/4/2026
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    const monthIdx = MONTHS.indexOf(parts[0]);
    if (monthIdx >= 0 && parts[1] && parts[2]) return new Date(parseInt(parts[2]), monthIdx, parseInt(parts[1]));
    // Numeric month: 4/4/2026
    if (parts[0] && parts[1] && parts[2]) return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  }
  // Full day name (Monday, etc.) — assume this week
  const fullDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayIdx = fullDays.findIndex(d => dateStr.toLowerCase().startsWith(d.toLowerCase()));
  if (dayIdx >= 0) {
    const today = new Date();
    const diff = dayIdx - today.getDay();
    const date = new Date(today);
    date.setDate(today.getDate() + (diff >= 0 ? diff : diff + 7));
    return date;
  }
  return null;
};

function HomeTab({ events, groups, joinedGroups, selectedDay, setSelectedDay, selectedAge, setSelectedAge, onEventSelect, onCreateEvent, onGroupSelect, joinedEvents }) {
  const [feedFilter, setFeedFilter] = useState("all");

  const publicGroupIds = (groups || []).filter(g => !g.isPrivate).map(g => g.id);
  const privateJoinedIds = (groups || []).filter(g => g.isPrivate && (joinedGroups || []).includes(g.id)).map(g => g.id);

  const visibleEvents = (events || []).filter(e => {
    // First: visibility check (can the user see this event?)
    if (e.groupId) {
      const isPublicGroup = publicGroupIds.includes(e.groupId);
      const isJoinedGroup = (joinedGroups || []).includes(e.groupId);
      if (!isPublicGroup && !isJoinedGroup) return false;
    }

    // Then: feed filter tab
    if (feedFilter === "my-groups") {
      return e.groupId && (joinedGroups || []).includes(e.groupId);
    }
    if (feedFilter === "public") {
      return !e.groupId || publicGroupIds.includes(e.groupId);
    }
    if (feedFilter === "my-playdates") {
      return joinedEvents.includes(e.id);
    }
    return true; // "all"
  });

  const filtered = visibleEvents.filter(e =>
    (() => {
      const eventDate = parseEventToDate(e.date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      // Hide past events in all views
      if (eventDate && eventDate < now) return false;
      if (selectedDay === "All") return true;
      if (!eventDate) return selectedDay === "All"; // unparseable dates only show in All
      if (selectedDay === "today") {
        return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth() && eventDate.getDate() === now.getDate();
      }
      // Compare with selected date key (YYYY-M-D where M is 0-indexed)
      const eventKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      return eventKey === selectedDay;
    })() &&
    (selectedAge === "All Ages" || e.ages === selectedAge || (e.ages || '').startsWith(selectedAge) || selectedAge.startsWith(e.ages || ''))
  ).sort((a, b) => {
    const dateA = parseEventToDate(a.date);
    const dateB = parseEventToDate(b.date);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA - dateB;
  });

  return (
    <div style={styles.tabContent}>
      <div style={styles.homeHeader}>
        <div>
          <p style={styles.greeting}>Good morning! ☀️</p>
          <h1 style={styles.pageTitle}>This Week's Playdates</h1>
        </div>
      </div>

      {/* Feed filter tabs */}
      <div style={styles.filterRow}>
        {[
          { id: "all", label: "All" },
          { id: "my-groups", label: "My Groups" },
          { id: "public", label: "🌐 Public" },
          { id: "my-playdates", label: "✓ Joined" },
        ].map(f => (
          <button
            key={f.id}
            style={{ ...styles.dayChip, ...(feedFilter === f.id ? styles.dayChipActive : {}) }}
            onClick={() => setFeedFilter(f.id)}
          >{f.label}</button>
        ))}
      </div>

      {/* Day filter — shows this week + next week */}
      <div style={styles.filterRow}>
        <button
          style={{ ...styles.dayChip, ...(selectedDay === "All" ? styles.dayChipActive : {}) }}
          onClick={() => setSelectedDay("All")}
        >All</button>
        <button
          style={{ ...styles.dayChip, ...(selectedDay === "today" ? styles.dayChipActive : {}) }}
          onClick={() => setSelectedDay("today")}
        >Today</button>
        {(() => {
          const today = new Date();
          const days = [];
          for (let i = 1; i <= 13; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const label = SHORT_DAYS[d.getDay()] + ' ' + (d.getMonth() + 1) + '/' + d.getDate();
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            days.push({ label, key, date: d });
          }
          return days.map(d => (
            <button
              key={d.key}
              style={{ ...styles.dayChip, ...(selectedDay === d.key ? styles.dayChipActive : {}), whiteSpace: "nowrap" }}
              onClick={() => setSelectedDay(d.key)}
            >{d.label}</button>
          ));
        })()}
      </div>

      {/* Age filter */}
      <div style={styles.filterRow}>
        {AGE_FILTERS.map(a => (
          <button
            key={a}
            style={{ ...styles.ageChip, ...(selectedAge === a ? styles.ageChipActive : {}) }}
            onClick={() => setSelectedAge(a)}
          >{a}</button>
        ))}
      </div>

      {/* Events */}
      <div style={styles.eventsList}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 40 }}>🌤</span>
            <p style={styles.emptyText}>No playdates for this filter yet</p>
            {(events || []).length === 0 && <button style={styles.secondaryBtn} onClick={onCreateEvent}>Create One!</button>}
          </div>
        ) : (
          filtered.map((event, i) => (
            <div
              key={event.id}
              style={{ ...styles.eventCard, animationDelay: `${i * 0.05}s` }}
              onClick={() => onEventSelect(event)}
            >
              <div style={{ ...styles.eventAccent, background: event.color }} />
              <div style={styles.eventBody}>
                {event.groupId && (() => {
                  const g = (groups || []).find(g => g.id === event.groupId);
                  return g ? <p style={{ fontSize: 11, fontWeight: 600, color: "#6B2C3B", marginBottom: 4 }}>{g.emoji || '👥'} {g.name}</p> : null;
                })()}
                <div style={styles.eventTop}>
                  <span style={styles.ageBadge}>{event.ages} yrs</span>
                  <span style={styles.eventDay}>{formatEventDate(event.date)}</span>
                </div>
                <h3 style={styles.eventTitle}>{event.title}</h3>
                <div style={styles.eventMeta}>
                  <span style={styles.metaItem}>{Icons.location} {event.location}</span>
                  <span style={styles.metaItem}>📅 {formatEventDate(event.date)}</span>
                  <span style={styles.metaItem}>{Icons.clock} {event.time}</span>
                </div>
                <div style={styles.eventBottom}>
                  <span style={styles.hostName}>by {event.host}</span>
                  <span style={styles.attendeeCount}>
                    {event.attendees}{event.groupId && (() => { const g = (groups || []).find(g => g.id === event.groupId); return g ? `/${g.members}` : ''; })()} going
                  </span>
                </div>
                {joinedEvents.includes(event.id) && (
                  <span style={styles.joinedBadge}>{Icons.check} Joined</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* My Groups section when All or My Groups filter is active */}
      {(feedFilter === "all" || feedFilter === "my-groups") && (() => {
        const myGroups = (groups || []).filter(g => (joinedGroups || []).includes(g.id));
        return myGroups.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D", marginBottom: 10 }}>My Groups</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myGroups.map(g => (
                <div key={g.id} style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }} onClick={() => onGroupSelect && onGroupSelect(g)}>
                  <span style={{ fontSize: 28 }}>{g.emoji || '👥'}</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{g.name}</strong>
                    {g.desc && <p style={{ fontSize: 12, color: "#888", marginTop: 2, lineHeight: 1.3 }}>{g.desc.slice(0, 80)}{g.desc.length > 80 ? '...' : ''}</p>}
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      {g.area && <span style={{ fontSize: 11, color: "#888" }}>📍 {g.area}</span>}
                      <span style={{ fontSize: 11, color: "#888" }}>👥 {g.members} members</span>
                      {g.isPrivate && <span style={{ fontSize: 11, color: "#888" }}>🔒 Private</span>}
                    </div>
                  </div>
                  <span style={{ color: "#ccc" }}>›</span>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Public Groups section when Public filter is active */}
      {feedFilter === "public" && (groups || []).filter(g => !g.isPrivate).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D", marginBottom: 10 }}>🌐 Public Groups</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(groups || []).filter(g => !g.isPrivate).map(g => (
              <div key={g.id} style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }} onClick={() => onGroupSelect && onGroupSelect(g)}>
                <span style={{ fontSize: 28 }}>{g.emoji || '👥'}</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{g.name}</strong>
                  {g.desc && <p style={{ fontSize: 12, color: "#888", marginTop: 2, lineHeight: 1.3 }}>{g.desc.slice(0, 80)}{g.desc.length > 80 ? '...' : ''}</p>}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {g.area && <span style={{ fontSize: 11, color: "#888" }}>📍 {g.area}</span>}
                    <span style={{ fontSize: 11, color: "#888" }}>👥 {g.members} members</span>
                  </div>
                </div>
                <span style={{ color: "#ccc" }}>›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <PageFooter />
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Event Detail ───
function EventDetail({ event, onBack, newComment, setNewComment, joinedEvents, setJoinedEvents, onRsvp, onPostComment, user, onDelete, fadeIn }) {
  const joined = joinedEvents.includes(event.id);
  const [comments, setComments] = useState(event.comments || []);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [localAttendees, setLocalAttendees] = useState(event.attendees);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [arrivingNotif, setArrivingNotif] = useState(false);
  const [attendeeList, setAttendeeList] = useState([]);
  const [showKidSelect, setShowKidSelect] = useState(false);
  const [selectedKids, setSelectedKids] = useState({});
  const [showAttendees, setShowAttendees] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const commentRef = useRef(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 50 ? offset : 0);
      if (offset > 50 && commentRef.current) {
        setTimeout(() => commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      }
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(event.title);
  const [editLocation, setEditLocation] = useState(event.location || '');
  const [editTime, setEditTime] = useState(event.time || '');
  const [editDesc, setEditDesc] = useState(event.description || '');
  const [saving, setSaving] = useState(false);
  const isCreator = user && event.hostId === user.id;

  // Load attendee list
  useEffect(() => {
    if (!event.fromSupabase) return;
    supabase.from('event_rsvps')
      .select('user_id, status, users!user_id(full_name, avatar_url, kids)')
      .eq('event_id', event.id)
      .then(({ data }) => {
        if (data) {
          setAttendeeList(data.map(r => {
            let attendingKids = r.users?.kids || [];
            // If status contains selected kids JSON, use that instead
            try {
              const parsed = JSON.parse(r.status);
              if (Array.isArray(parsed) && parsed.length > 0) attendingKids = parsed;
            } catch {}
            return {
              id: r.user_id,
              name: r.users?.full_name || 'A mom',
              avatar_url: r.users?.avatar_url,
              kids: attendingKids,
            };
          }));
        }
      });
  }, [event.id, event.fromSupabase, localAttendees]);

  // Load comments from Supabase for real events
  useEffect(() => {
    if (!event.fromSupabase) return;
    supabase.from('comments')
      .select('*, users!user_id(full_name)')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setComments(data.map(c => ({
            id: c.id,
            user: c.users?.full_name || 'A mom',
            text: c.content,
            time: new Date(c.created_at).toLocaleDateString(),
            fromSupabase: true,
          })));
        }
      });
  }, [event.id, event.fromSupabase]);

  const handleRsvpClick = async () => {
    if (event.fromSupabase && onRsvp) {
      setRsvpLoading(true);
      await onRsvp(event.id, !joined);
      setLocalAttendees(prev => joined ? Math.max(0, prev - 1) : prev + 1);
      setRsvpLoading(false);
    } else {
      if (joined) setJoinedEvents(j => j.filter(id => id !== event.id));
      else setJoinedEvents(j => [...j, event.id]);
      setLocalAttendees(prev => joined ? Math.max(0, prev - 1) : prev + 1);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    if (event.fromSupabase && onPostComment) {
      setCommentLoading(true);
      const result = await onPostComment(event.id, newComment);
      if (result) {
        setComments(prev => [...prev, result]);
      }
      setCommentLoading(false);
    } else {
      setComments(prev => [...prev, { user: "You", text: newComment, time: "Just now" }]);
    }
    setNewComment("");
  };

  return (
    <div style={styles.detailScreen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
        <h2 style={styles.detailTitle}>Event Details</h2>
        <div style={{ width: 40 }} />
      </div>
      <div style={styles.detailBody}>
        <div style={{ ...styles.eventBanner, background: `linear-gradient(135deg, ${event.color}22, ${event.color}44)` }}>
          <span style={styles.bannerAge}>{event.ages} yrs</span>
          <h2 style={{ ...styles.bannerTitle, color: event.color }}>{event.title}</h2>
          <div style={styles.bannerMeta}>
            <span>{Icons.location} {event.location}</span>
            <span>{Icons.clock} {event.time} · {formatEventDate(event.date)}</span>
          </div>
        </div>

        {event.description && (
          <div style={styles.detailSection}>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{event.description}</p>
          </div>
        )}

        <div style={styles.detailSection}>
          <div style={styles.hostRow}>
            <div style={{ ...styles.avatarSmall, background: event.color }}>{(event.host || "?").split(" ").map(n => n[0]).join("")}</div>
            <div>
              <p style={styles.hostLabel}>Hosted by</p>
              <p style={styles.hostNameLg}>{event.host}</p>
            </div>
          </div>
        </div>

        <div style={styles.detailSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowAttendees(!showAttendees)}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>👥 {localAttendees} going</p>
            <span style={{ fontSize: 12, color: "#6B2C3B", fontWeight: 600 }}>{showAttendees ? "Hide" : "See who's going ›"}</span>
          </div>
          {showAttendees && attendeeList.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {attendeeList.map((a, i) => {
                const kidAges = (a.kids || []).map(k => {
                  const age = formatAge(k.birthday);
                  const gender = k.gender === "Girl" ? "👧" : k.gender === "Boy" ? "👦" : "";
                  return age ? `${gender} ${age} yrs` : gender;
                }).filter(Boolean);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < attendeeList.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                    <Avatar url={a.avatar_url} name={a.name} size={36} />
                    <div>
                      <strong style={{ fontSize: 13, color: "#2D2D2D" }}>{a.name}</strong>
                      {kidAges.length > 0 && <p style={{ fontSize: 11, color: "#888", marginTop: 1 }}>Kids: {kidAges.join(', ')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {showAttendees && attendeeList.length === 0 && (
            <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No one has joined yet. Be the first!</p>
          )}
        </div>

        {joined ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              style={{ ...styles.primaryBtn, background: "#E8F5E9", color: "#2E7D32", width: "100%", boxShadow: "none" }}
              onClick={handleRsvpClick}
            >
              ✓ You're Going! (tap to leave)
            </button>
            {!arrived ? (
              <button
                style={{ width: "100%", padding: "12px 0", borderRadius: 50, background: "#6B2C3B", color: "white", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: arrivingNotif ? 0.6 : 1 }}
                disabled={arrivingNotif}
                onClick={async () => {
                  setArrivingNotif(true);
                  // Notify all other attendees
                  if (event.fromSupabase && user) {
                    const { data: rsvps } = await supabase.from('event_rsvps').select('user_id').eq('event_id', event.id);
                    if (rsvps) {
                      const notifs = rsvps
                        .filter(r => r.user_id !== user.id)
                        .map(r => ({
                          user_id: r.user_id,
                          type: 'arrived',
                          title: "Someone's here!",
                          body: `${user.full_name || 'A mom'} has arrived at ${event.title}! 📍`,
                          group_id: event.groupId || null,
                          is_read: false,
                        }));
                      if (notifs.length > 0) await supabase.from('notifications').insert(notifs);
                    }
                  }
                  setArrived(true);
                  setArrivingNotif(false);
                }}
              >
                {arrivingNotif ? "Notifying..." : "📍 I've Arrived!"}
              </button>
            ) : (
              <div style={{ textAlign: "center", padding: "10px 0", background: "#FAF0F2", borderRadius: 50 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#6B2C3B" }}>📍 You're here! Others have been notified.</p>
              </div>
            )}
          </div>
        ) : !showKidSelect ? (
          <button
            style={{ ...styles.primaryBtn, width: "100%" }}
            onClick={() => {
              if (user?.kids && user.kids.filter(k => k.gender || k.birthday).length > 0) {
                setShowKidSelect(true);
                // Pre-select all kids
                const sel = {};
                user.kids.forEach((_, i) => { sel[i] = true; });
                setSelectedKids(sel);
              } else {
                handleRsvpClick();
              }
            }}
          >
            Join This Playdate
          </button>
        ) : (
          <div style={{ background: "#FAF0F2", borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginBottom: 8 }}>Which kids are coming?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {(user?.kids || []).filter(k => k.gender || k.birthday).map((kid, i) => {
                const age = formatAge(kid.birthday);
                const icon = kid.gender === "Girl" ? "👧" : kid.gender === "Boy" ? "👦" : "👶";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "white", borderRadius: 8, cursor: "pointer", border: selectedKids[i] ? "2px solid #6B2C3B" : "1.5px solid #E8E8E8" }} onClick={() => setSelectedKids(prev => ({ ...prev, [i]: !prev[i] }))}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: selectedKids[i] ? "none" : "2px solid #ddd", background: selectedKids[i] ? "#6B2C3B" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selectedKids[i] && <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                    <span style={{ fontSize: 13, color: "#2D2D2D" }}>{icon} {kid.gender || "Child"}{age ? ` — ${age} yrs` : ''}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{ ...styles.primaryBtn, flex: 1, opacity: rsvpLoading ? 0.6 : 1 }}
                disabled={rsvpLoading}
                onClick={async () => {
                  // Store selected kids in RSVP status field
                  const kidsAttending = (user?.kids || []).filter((_, i) => selectedKids[i]);
                  await handleRsvpClick();
                  // Update the RSVP with kids info
                  if (event.fromSupabase && user) {
                    await supabase.from('event_rsvps').update({ status: JSON.stringify(kidsAttending) }).eq('event_id', event.id).eq('user_id', user.id);
                  }
                  setShowKidSelect(false);
                }}
              >
                {rsvpLoading ? "..." : "Confirm"}
              </button>
              <button style={{ ...styles.secondaryBtn, flex: 1 }} onClick={() => setShowKidSelect(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Edit button for creator */}
        {isCreator && event.fromSupabase && !editing && !showDeleteConfirm && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              style={{ flex: 1, padding: "12px 0", borderRadius: 50, background: "none", border: "1.5px solid #6B2C3B", color: "#6B2C3B", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              onClick={() => setEditing(true)}
            >
              ✏️ Edit Playdate
            </button>
            <button
              style={{ flex: 1, padding: "12px 0", borderRadius: 50, background: "none", border: "1.5px solid #E53935", color: "#E53935", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑️ Delete
            </button>
          </div>
        )}

        {/* Edit form for creator */}
        {isCreator && editing && (
          <div style={{ background: "#FAF0F2", borderRadius: 12, padding: 16, marginTop: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D", marginBottom: 10 }}>Edit Playdate</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={styles.input} placeholder="Title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              <AddressInput inputStyle={styles.input} placeholder="Location" value={editLocation} onChange={setEditLocation} />
              <select style={styles.input} value={editTime} onChange={e => setEditTime(e.target.value)}>
                <option value="">Select time</option>
                {["8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea style={{ ...styles.input, minHeight: 60, fontFamily: "inherit" }} placeholder="Description" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{ ...styles.primaryBtn, flex: 1, opacity: saving ? 0.6 : 1 }}
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    const { error } = await supabase.from('events').update({
                      title: editTitle.trim(),
                      location: editLocation.trim(),
                      event_time: editTime,
                      description: editDesc.trim(),
                    }).eq('id', event.id);
                    setSaving(false);
                    if (error) { alert('Error saving: ' + error.message); return; }
                    event.title = editTitle.trim();
                    event.location = editLocation.trim();
                    event.time = editTime;
                    event.description = editDesc.trim();
                    setEditing(false);
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button style={{ ...styles.secondaryBtn, flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {isCreator && showDeleteConfirm && (
          <div style={{ background: "#FFEBEE", borderRadius: 12, padding: 16, marginTop: 8, textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#C62828", marginBottom: 4 }}>Are you sure?</p>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>This will permanently delete this playdate and all RSVPs and comments.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{ flex: 1, padding: "10px 0", borderRadius: 50, background: "#E53935", color: "white", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: deleting ? 0.6 : 1 }}
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  await onDelete(event.id);
                  onBack();
                }}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                style={{ flex: 1, padding: "10px 0", borderRadius: 50, background: "white", color: "#666", fontSize: 14, fontWeight: 600, border: "1.5px solid #ddd", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Comments */}
        <div style={styles.commentsSection}>
          <h3 style={styles.sectionTitle}>Comments ({comments.length})</h3>
          {comments.map((c, i) => (
            <div key={c.id || i} style={styles.commentCard}>
              <div style={styles.commentAvatar}>{(c.user || "?").split(" ").map(n => n[0]).join("")}</div>
              <div style={styles.commentBody}>
                <div style={styles.commentTop}>
                  <strong style={styles.commentUser}>{c.user}</strong>
                  <span style={styles.commentTime}>{c.time}</span>
                </div>
                <p style={styles.commentText}>{c.text}</p>
              </div>
            </div>
          ))}
        <PageFooter />
        </div>
      </div>
      {/* Fixed comment input at bottom */}
      <div ref={commentRef} style={{ position: "fixed", bottom: keyboardOffset || 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "white", borderTop: "1px solid #f0f0f0", padding: keyboardOffset ? "10px 18px" : "10px 18px calc(10px + env(safe-area-inset-bottom, 20px))", display: "flex", gap: 8, zIndex: 60, transition: "bottom 0.15s ease" }}>
        <input
          style={{ ...styles.msgInput, flex: 1 }}
          placeholder="Add a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
        />
        <button style={{ ...styles.sendBtn, opacity: commentLoading ? 0.5 : 1 }} onClick={handleCommentSubmit} disabled={commentLoading}>{Icons.send}</button>
      </div>
    </div>
  );
}

// ─── Discover Tab ───
function DiscoverTab({ user, setUser, isBetaMember, joinedEvents, joinedGroups, connections, notifications, setNotifications, onUploadPhoto, onProfileSelect, onAdminApply }) {
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [zipSearch, setZipSearch] = useState("");
  const [distanceFilter, setDistanceFilter] = useState(15);
  const [realMoms, setRealMoms] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Zip code to approximate lat/lon (US zips)
  const zipCache = React.useRef({});
  const getZipCoords = async (zip) => {
    if (zipCache.current[zip]) return zipCache.current[zip];
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${zip}&countrycodes=us&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        zipCache.current[zip] = coords;
        return coords;
      }
    } catch {}
    return null;
  };

  // Haversine distance in miles
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const [myCoords, setMyCoords] = useState(null);
  const [momDistances, setMomDistances] = useState({});

  // Get user's location, default to Long Island if unavailable
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setMyCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setMyCoords({ lat: 40.7891, lon: -73.1350 }) // Default: Long Island, NY
      );
    } else {
      setMyCoords({ lat: 40.7891, lon: -73.1350 }); // Default: Long Island, NY
    }
  }, []);

  // Load real users from Supabase
  useEffect(() => {
    if (loaded) return;
    supabase.from('users')
      .select('id, full_name, area, bio, kids, interests, is_verified, role, mom_age, avatar_url, quick_answers')
      .neq('id', user?.id || '')
      .then(({ data }) => {
        if (data) {
          const mapped = data.map(m => {
            const name = m.full_name || 'A mom';
            const kidAges = (m.kids || []).map(k => formatAge(k.birthday)).filter(Boolean);
            return {
              id: m.id,
              name,
              avatar: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
              bio: m.bio || '',
              ages: kidAges.length > 0 ? kidAges.map(a => a.includes('mo') || a === 'Newborn' ? a : a + ' yrs').join(', ') : '',
              interests: m.interests || [],
              area: m.area || '',
              admin: m.role === 'admin' || m.role === 'founder',
              role: m.role,
              isVerified: m.is_verified,
              avatar_url: m.avatar_url,
              quick_answers: m.quick_answers || {},
              fromSupabase: true,
            };
          });
          setRealMoms(mapped);
        }
        setLoaded(true);
      });
  }, [loaded, user]);

  // Calculate distances when we have coords and moms
  useEffect(() => {
    const calcDistances = async () => {
      const baseCoords = zipSearch.length === 5 ? await getZipCoords(zipSearch) : myCoords;
      if (!baseCoords) return;
      const distances = {};
      for (const mom of realMoms) {
        if (mom.area) {
          // Extract zip from area if present, otherwise geocode the area
          const zipMatch = mom.area.match(/\b(\d{5})\b/);
          if (zipMatch) {
            const momCoords = await getZipCoords(zipMatch[1]);
            if (momCoords) distances[mom.id] = getDistance(baseCoords.lat, baseCoords.lon, momCoords.lat, momCoords.lon);
          } else {
            const momCoords = await getZipCoords(mom.area);
            if (momCoords) distances[mom.id] = getDistance(baseCoords.lat, baseCoords.lon, momCoords.lat, momCoords.lon);
          }
        }
      }
      setMomDistances(distances);
    };
    if ((myCoords || zipSearch.length === 5) && realMoms.length > 0) calcDistances();
  }, [myCoords, realMoms, zipSearch]);

  // Sort founder(s) first, then admins
  const allMoms = [...realMoms].sort((a, b) => {
    if (a.role === 'founder' && b.role !== 'founder') return -1;
    if (b.role === 'founder' && a.role !== 'founder') return 1;
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    return 0;
  });

  const filtered = allMoms.filter(m => {
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.interests || []).some(i => i.toLowerCase().includes(search.toLowerCase())) ||
      m.area.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (areaFilter === "nearby") {
      const dist = momDistances[m.id];
      if (dist === undefined) return false;
      return dist <= distanceFilter;
    }
    return true;
  });

  return (
    <div style={styles.tabContent}>
      <h1 style={styles.pageTitle}>Discover Moms</h1>
      <div style={styles.searchBar}>
        {Icons.search}
        <input style={styles.searchInput} placeholder="Search by name, interest, or area..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Area filter */}
      <div style={styles.filterRow}>
        <button style={{ ...styles.dayChip, ...(areaFilter === "all" ? styles.dayChipActive : {}) }} onClick={() => setAreaFilter("all")}>All</button>
        <button style={{ ...styles.dayChip, ...(areaFilter === "nearby" ? styles.dayChipActive : {}) }} onClick={() => setAreaFilter("nearby")}>📍 Near Me</button>
      </div>

      {areaFilter === "nearby" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <input
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #E8E8E8", fontSize: 14, fontFamily: "inherit", background: "white" }}
              placeholder="Search by zip code..."
              value={zipSearch}
              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); setZipSearch(v); }}
              inputMode="numeric"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>Within</span>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={distanceFilter}
              onChange={e => setDistanceFilter(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: "#6B2C3B" }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6B2C3B", whiteSpace: "nowrap" }}>{distanceFilter} mi</span>
          </div>
        </div>
      )}

      {!loaded ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 14, color: "#888" }}>Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <span style={{ fontSize: 40 }}>👩‍👧</span>
          <p style={{ fontSize: 14, color: "#888", marginTop: 12 }}>{search ? "No moms match your search" : "No other moms have joined yet. Be the first to invite!"}</p>
        </div>
      ) : (
        <div style={styles.profileGrid}>
          {filtered.map((mom, i) => (
            <div key={mom.id} style={{ ...styles.profileCard, animationDelay: `${i * 0.05}s` }} onClick={() => onProfileSelect(mom)}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar url={mom.avatar_url} name={mom.name} size={56} />
                {mom.isVerified && <div style={styles.verifiedDot} title="Verified Mom">✓</div>}
              </div>
              {mom.role === 'founder' && <span style={{ fontSize: 9, fontWeight: 700, color: "#6B2C3B", background: "#FAF0F2", padding: "2px 8px", borderRadius: 50 }}>👑 Founder</span>}
              {(mom.role === 'admin' || mom.role === 'founder') && <span style={styles.adminBadge}>{Icons.crown} Admin</span>}
              <h3 style={styles.profileName}>{mom.name}</h3>
              {mom.area && <p style={styles.profileArea}>{Icons.location} {mom.area}</p>}
              {mom.isVerified && <span style={styles.verifiedMomTag}>✓ Verified Mom</span>}
              {mom.ages && <p style={styles.profileAges}>Kids: {mom.ages}</p>}
              {(mom.interests || []).length > 0 && (
                <div style={styles.profileInterests}>
                  {mom.interests.slice(0, 2).map(i => (
                    <span key={i} style={styles.interestTag}>{i}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply to Be an Admin - Gated */}
      <div style={styles.adminApplyBanner}>
        <div style={styles.adminApplyLeft}>
          <div style={styles.adminApplyIconWrap}>{Icons.shield}</div>
          <div>
            <h3 style={styles.adminApplyTitle}>Want to lead playdates in your area?</h3>
            <p style={styles.adminApplyDesc}>Admins are hand-selected community leaders. Applications are reviewed by our team.</p>
          </div>
        </div>
        <button style={styles.adminApplyBtn} onClick={onAdminApply}>
          {Icons.shield} Apply to Be an Admin
        </button>
        <div style={styles.adminRequirements}>
          <p style={styles.adminReqLabel}>Requirements to apply:</p>
          <div style={styles.adminReqList}>
            <span style={styles.adminReqItem}>✓ Active member for 30+ days</span>
            <span style={styles.adminReqItem}>✓ Attended 3+ playdates</span>
            <span style={styles.adminReqItem}>✓ Background check consent</span>
            <span style={styles.adminReqItem}>✓ Community guidelines agreement</span>
          </div>
        </div>
      </div>
      <PageFooter />
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Profile Detail ───
function ProfileDetail({ profile, onBack, onConnect, onAccept, onDisconnect, onUnsend, connectionStatus, connections, user, onMessage }) {
  const [connectLoading, setConnectLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(connectionStatus);
  const [showConnectedPopup, setShowConnectedPopup] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  // Sync localStatus when connectionStatus changes, unless user manually changed it
  useEffect(() => {
    if (!manualOverride) setLocalStatus(connectionStatus);
  }, [connectionStatus]);
  return (
    <div style={styles.detailScreen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
        <h2 style={styles.detailTitle}>Profile</h2>
        <div style={{ width: 40 }} />
      </div>
      <div style={styles.detailBody}>
        <div style={styles.profileDetailTop}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Avatar url={profile.avatar_url} name={profile.name} size={80} />
            <div style={{ ...styles.verifiedDot, width: 24, height: 24, fontSize: 13, right: -2, bottom: -2 }} title="Verified Mom">✓</div>
          </div>
          {profile.isVerified && <span style={{ ...styles.verifiedMomTag, marginTop: 10, fontSize: 12, padding: "4px 12px" }}>✓ Verified Mom</span>}
          {profile.role === 'founder' && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6B2C3B", background: "#FAF0F2", padding: "3px 10px", borderRadius: 50, letterSpacing: 0.5, marginTop: 6, display: "inline-block" }}>👑 FOUNDER</span>
          )}
          {(profile.role === 'admin' || profile.role === 'founder') && (
            <span style={{ ...styles.adminBadge, position: "static", marginTop: 6 }}>{Icons.crown} Community Admin</span>
          )}
          <h2 style={styles.profileDetailName}>{profile.role === 'founder' ? '👑 ' : ''}{profile.name}</h2>
          {profile.area && <p style={styles.profileDetailArea}>{Icons.location} {profile.area}</p>}
        </div>

        {profile.bio && (
          <div style={styles.detailSection}>
            <h3 style={styles.sectionTitle}>About</h3>
            <p style={styles.bioText}>{profile.bio}</p>
          </div>
        )}

        {profile.ages && (
          <div style={styles.detailSection}>
            <h3 style={styles.sectionTitle}>Kids Ages</h3>
            <p style={styles.detailText}>{profile.ages}</p>
          </div>
        )}

        {(profile.interests || []).length > 0 && (
          <div style={styles.detailSection}>
            <h3 style={styles.sectionTitle}>Interests & Hobbies</h3>
            <div style={styles.interestRow}>
              {profile.interests.map(i => (
                <span key={i} style={styles.interestTagLg}>{i}</span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Q's */}
        {profile.quick_answers && Object.keys(profile.quick_answers).length > 0 && (() => {
          const qa = profile.quick_answers;
          const momQs = QUICK_QS.mom.map((item, i) => ({ q: item.q, a: qa[`mom_${i}`] })).filter(x => x.a);
          const matchQs = QUICK_QS.matching.map((item, i) => ({ q: item.q, a: qa[`matching_${i}`] })).filter(x => x.a);
          const allQs = [...momQs, ...matchQs];
          if (allQs.length === 0) return null;
          return (
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>Quick Q's</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {allQs.map((item, i) => (
                  <div key={i} style={{ background: "#FAFAFA", borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{item.q}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {localStatus === 'connected' ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 20 }}>
            <div
              role="button"
              tabIndex={0}
              style={{ width: "100%", padding: "14px 0", borderRadius: 50, background: "#6B2C3B", color: "white", fontSize: 15, fontWeight: 600, textAlign: "center", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", WebkitTapHighlightColor: "transparent", userSelect: "none" }}
              onTouchEnd={async (e) => { e.preventDefault(); if (onMessage) await onMessage(profile); }}
              onClick={async () => { if (onMessage) await onMessage(profile); }}
            >
              💬 Send Message
            </div>
            <div
              role="button"
              tabIndex={0}
              style={{ width: "100%", padding: "12px 0", borderRadius: 50, background: "#E8F5E9", color: "#2E7D32", fontSize: 14, fontWeight: 600, textAlign: "center", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              onTouchEnd={(e) => { e.preventDefault(); setShowDisconnectConfirm(true); }}
              onClick={() => setShowDisconnectConfirm(true)}
            >
              ✓ Connected — Tap to Disconnect
            </div>
          </div>
        ) : localStatus === 'received' ? (
          <button
            style={{ ...styles.primaryBtn, width: "100%", opacity: connectLoading ? 0.6 : 1 }}
            disabled={connectLoading}
            onClick={async () => {
              setConnectLoading(true);
              const conn = connections?.find(c => c.status === 'pending' && c.requester_id === profile.id && c.recipient_id === user?.id);
              if (onAccept) {
                await onAccept(conn?.id, true, profile.id);
              }
              setLocalStatus('connected');
              setShowConnectedPopup(true);
              setConnectLoading(false);
            }}
          >
            {connectLoading ? "..." : "Accept Request"}
          </button>
        ) : localStatus === 'sent' ? (
          <button
            style={{ ...styles.secondaryBtn, width: "100%", opacity: connectLoading ? 0.6 : 1 }}
            disabled={connectLoading}
            onClick={async () => {
              setConnectLoading(true);
              if (onUnsend) await onUnsend(profile.id);
              setLocalStatus('none');
              setConnectLoading(false);
            }}
          >
            {connectLoading ? "..." : "Unsend Request"}
          </button>
        ) : (
          <button
            style={{ ...styles.primaryBtn, width: "100%", opacity: connectLoading ? 0.6 : 1 }}
            disabled={connectLoading}
            onClick={async () => {
              if (onConnect && profile.id) {
                setConnectLoading(true);
                const result = await onConnect(profile.id);
                if (result?.autoAccepted) {
                  setLocalStatus('connected');
                  setShowConnectedPopup(true);
                } else {
                  setLocalStatus('sent');
                }
                setConnectLoading(false);
              }
            }}
          >
            {connectLoading ? "..." : "Connect"}
          </button>
        )}

        {showConnectedPopup && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 300, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2D2D2D", marginBottom: 8 }}>You're now connected!</h3>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 20 }}>You and {profile.name || profile.full_name} are now connected.</p>
              <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => setShowConnectedPopup(false)}>
                Done
              </button>
            </div>
          </div>
        )}

        {showDisconnectConfirm && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowDisconnectConfirm(false)}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 300, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2D2D2D", marginBottom: 8 }}>Disconnect?</h3>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 20 }}>Are you sure you want to disconnect from {profile.name || profile.full_name}?</p>
              <button
                style={{ ...styles.primaryBtn, width: "100%", background: "#C62828", marginBottom: 10 }}
                onClick={async () => {
                  setShowDisconnectConfirm(false);
                  if (onDisconnect) {
                    await onDisconnect(profile.id);
                  }
                  setManualOverride(true);
                  setLocalStatus('none');
                }}
              >
                Disconnect
              </button>
              <button style={{ ...styles.secondaryBtn, width: "100%" }} onClick={() => setShowDisconnectConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── My Profile Tab ───
function MyProfileTab({ isBetaMember, user, setUser, joinedEvents, joinedGroups, connections, onSwitchTab, onShowDiscover, notifications, setNotifications, onUploadPhoto, onBack }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuView, setMenuView] = useState(null); // null, "children", "notifications", "privacy", "about", "admin-panel"
  const [adminApps, setAdminApps] = useState([]);
  const [adminAppsLoaded, setAdminAppsLoaded] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || "");
  const [editArea, setEditArea] = useState(user?.area || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editChildren, setEditChildren] = useState(() => {
    if (user?.kids && user.kids.length > 0) return user.kids;
    return [{ gender: "", birthday: "" }];
  });
  const [editInterests, setEditInterests] = useState(user?.interests || []);
  const [photoToAdjust, setPhotoToAdjust] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoPos, setPhotoPos] = useState({ x: 0, y: 0 });
  const [photoDragging, setPhotoDragging] = useState(false);
  const [photoDragStart, setPhotoDragStart] = useState({ x: 0, y: 0 });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [mySchedule, setMySchedule] = useState(user?.general_availability || {});
  const [editingAvail, setEditingAvail] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  const displayName = user?.full_name || "Mom";
  const momBdayToday = isBirthdayToday(user?.mom_age);
  const momAgeDisplay = formatAge(user?.mom_age);
  const isAppFounder = user?.role === 'founder';
  const avatar = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isVerified = user?.is_verified;
  const isFoundingMember = user?.is_founding_member || isBetaMember;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const kids = editChildren.filter(c => c.gender || c.birthday);
    const updates = {
      full_name: editName.trim(),
      area: editArea.trim(),
      bio: editBio.trim(),
      kids,
      interests: editInterests,
    };
    const { error } = await supabase.from('users').update(updates).eq('id', user.id);
    setSaving(false);
    if (error) { alert('Error saving profile. Please try again.'); return; }
    setUser(prev => ({ ...prev, ...updates }));
    setEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const ALL_INTERESTS = ["Outdoors", "Artsy & Crafty", "Bookworm", "Wellness", "Foodie", "Techy", "Active", "Music Lover", "Eco-Conscious", "Coffee Dates", "Pet Lover", "Game Nights"];

  if (editing) {
    return (
      <div style={styles.tabContent}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h1 style={styles.pageTitle}>Edit Profile</h1>
          <button style={{ ...styles.textBtn, marginTop: 0, padding: 0, fontSize: 14 }} onClick={() => setEditing(false)}>Cancel</button>
        </div>
        <div style={styles.onboardFields}>
          <input style={styles.input} placeholder="Your name" value={editName} onChange={e => setEditName(e.target.value)} />
          <input style={styles.input} placeholder="Area / zip code" value={editArea} onChange={e => setEditArea(e.target.value)} />
          <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} placeholder="Bio" value={editBio} onChange={e => setEditBio(e.target.value)} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>Children</p>
          {editChildren.map((child, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select style={styles.input} value={child.gender || ''} onChange={e => setEditChildren(prev => prev.map((c, j) => j === i ? { ...c, gender: e.target.value } : c))}>
                <option value="">Child's gender</option>
                <option value="Girl">Girl</option>
                <option value="Boy">Boy</option>
              </select>
              <BirthdayPicker value={child.birthday || ''} onChange={val => setEditChildren(prev => prev.map((c, j) => j === i ? { ...c, birthday: val } : c))} label="Birthday" inputStyle={styles.input} />
              {i > 0 && (
                <button style={{ background: "none", border: "none", fontSize: 18, color: "#E53935", cursor: "pointer", padding: 4 }} onClick={() => setEditChildren(prev => prev.filter((_, j) => j !== i))}>✕</button>
              )}
            </div>
          ))}
          <button style={styles.addChildBtn} onClick={() => setEditChildren(prev => [...prev, { gender: "", birthday: "" }])}>+ Add another child</button>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginTop: 4 }}>Interests</p>
          <div style={styles.interestGrid}>
            {ALL_INTERESTS.map(interest => (
              <button
                key={interest}
                style={{
                  ...styles.interestChip,
                  ...(editInterests.includes(interest) ? styles.interestChipActive : {}),
                }}
                onClick={() => setEditInterests(prev =>
                  prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
                )}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
        <button
          style={{ ...styles.primaryBtn, width: "100%", marginTop: 16, opacity: saving ? 0.6 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <div style={{ height: 120 }} />
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {onBack && <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onBack}>{Icons.back}</button>}
        <h1 style={{ ...styles.pageTitle, marginBottom: 0 }}>My Profile</h1>
      </div>
      <div style={styles.myProfileCard}>
        <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto" }}>
          <div style={{ width: 80, height: 80, margin: "5px auto 0" }}>
            <Avatar url={user?.avatar_url} name={displayName} size={80} />
          </div>
          <label style={{ position: "absolute", bottom: 0, right: 2, width: 32, height: 32, borderRadius: 16, background: "#6B2C3B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.25)", zIndex: 5, border: "2px solid white" }}>
            <span style={{ color: "white", fontSize: 16, lineHeight: 1 }}>+</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPhotoToAdjust(file);
                setPhotoPreviewUrl(URL.createObjectURL(file));
                setPhotoZoom(1);
                setPhotoPos({ x: 0, y: 0 });
              }
            }} />
          </label>
        </div>
        {isVerified && <span style={{ ...styles.verifiedMomTag, marginTop: 6, fontSize: 11, padding: "3px 10px" }}>✓ Verified</span>}
        {isAppFounder && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6B2C3B", background: "#FAF0F2", padding: "3px 10px", borderRadius: 50, letterSpacing: 0.5 }}>👑 FOUNDER</span>
          </div>
        )}
        {!isAppFounder && isFoundingMember && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6B2C3B", background: "#FAF0F2", padding: "3px 10px", borderRadius: 50, letterSpacing: 0.5 }}>⭐ FOUNDING MEMBER</span>
          </div>
        )}
        <h2 style={styles.myName}>{momBdayToday ? '🎂 ' : ''}{isAppFounder ? '👑 ' : ''}{displayName}{momAgeDisplay ? `, ${momAgeDisplay}` : ''}</h2>
        {(user?.area) && <p style={styles.myArea}>{Icons.location} {user.area}</p>}
        <div style={styles.statRow}>
          <div style={styles.stat}><strong>{joinedEvents?.length || 0}</strong><span>Playdates</span></div>
          <div style={styles.stat}><strong>{(connections || []).filter(c => c.status === 'accepted').length}</strong><span>Connections</span></div>
          <div style={styles.stat}><strong>{joinedGroups?.length || 0}</strong><span>Groups</span></div>
        </div>
      </div>

      {user?.bio && (
        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Bio</h3>
          <p style={styles.bioText}>{user.bio}</p>
        </div>
      )}

      {(user?.kids && user.kids.length > 0) && (
        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>My Little Ones</h3>
          {user.kids.filter(k => k.gender || k.birthday).map((kid, i) => {
            const kidAge = formatAge(kid.birthday);
            const kidBday = isBirthdayToday(kid.birthday);
            const genderLabel = kid.gender === "Girl" ? "👧 Girl" : kid.gender === "Boy" ? "👦 Boy" : "Child";
            return <p key={i} style={styles.bioText}>{kidBday ? '🎂 ' : ''}{genderLabel}{kidAge ? ` — ${kidAge} yrs` : ''}</p>;
          })}
        </div>
      )}

      {(user?.interests || []).length > 0 && (
        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>My Interests</h3>
          <div style={styles.interestRow}>
            {user.interests.map(i => (
              <span key={i} style={styles.interestTagLg}>{i}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── My Quick Q's ── */}
      {user?.quick_answers && Object.keys(user.quick_answers).length > 0 && (() => {
        const qa = user.quick_answers;
        const momQs = QUICK_QS.mom.map((item, i) => ({ q: item.q, a: qa[`mom_${i}`] })).filter(x => x.a);
        const matchQs = QUICK_QS.matching.map((item, i) => ({ q: item.q, a: qa[`matching_${i}`] })).filter(x => x.a);
        const allQs = [...momQs, ...matchQs];
        if (allQs.length === 0) return null;
        return (
          <div style={styles.detailSection}>
            <h3 style={styles.sectionTitle}>My Quick Q's</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allQs.map((item, i) => (
                <div key={i} style={{ background: "#FAFAFA", borderRadius: 10, padding: 12 }}>
                  <p style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{item.q}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── My Availability ── */}
      <div style={styles.detailSection}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={styles.sectionTitle}>My Availability</h3>
          <button
            style={{ ...styles.secondaryBtn, padding: "6px 14px", fontSize: 12, opacity: savingAvail ? 0.6 : 1 }}
            disabled={savingAvail}
            onClick={async () => {
              if (editingAvail) {
                setSavingAvail(true);
                await supabase.from('users').update({ general_availability: mySchedule }).eq('id', user.id);
                setUser(prev => ({ ...prev, general_availability: mySchedule }));
                setSavingAvail(false);
                setEditingAvail(false);
              } else {
                setEditingAvail(true);
              }
            }}
          >
            {savingAvail ? "Saving..." : editingAvail ? "Save" : "✏️ Edit"}
          </button>
        </div>

        {editingAvail ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
              const daySlots = mySchedule[day] || [];
              return (
                <div key={day} style={{ background: "white", borderRadius: 12, padding: 12, border: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{day}</strong>
                    <button
                      style={{ fontSize: 11, color: daySlots.length > 0 && daySlots[0] === "all-day" ? "#2E7D32" : "#3B82F6", background: daySlots.length > 0 && daySlots[0] === "all-day" ? "#E8F5E9" : "#F0F7FF", border: "none", borderRadius: 50, padding: "4px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                      onClick={() => {
                        if (daySlots.length > 0 && daySlots[0] === "all-day") {
                          setMySchedule(prev => ({ ...prev, [day]: [] }));
                        } else {
                          setMySchedule(prev => ({ ...prev, [day]: ["all-day"] }));
                        }
                      }}
                    >
                      {daySlots.length > 0 && daySlots[0] === "all-day" ? "✓ All Day" : "All Day"}
                    </button>
                  </div>
                  {!(daySlots.length > 0 && daySlots[0] === "all-day") && (
                    <>
                      {daySlots.filter(s => s !== "all-day").map((slot, si) => (
                        <div key={si} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                          <select style={{ ...styles.input, flex: 1, padding: "8px 10px", fontSize: 12 }} value={slot.from || ''} onChange={e => {
                            setMySchedule(prev => {
                              const updated = [...(prev[day] || [])];
                              updated[si] = { ...updated[si], from: e.target.value };
                              return { ...prev, [day]: updated };
                            });
                          }}>
                            <option value="">From</option>
                            {["6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span style={{ fontSize: 12, color: "#888" }}>to</span>
                          <select style={{ ...styles.input, flex: 1, padding: "8px 10px", fontSize: 12 }} value={slot.to || ''} onChange={e => {
                            setMySchedule(prev => {
                              const updated = [...(prev[day] || [])];
                              updated[si] = { ...updated[si], to: e.target.value };
                              return { ...prev, [day]: updated };
                            });
                          }}>
                            <option value="">To</option>
                            {["7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM","9:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button style={{ background: "none", border: "none", fontSize: 16, color: "#E53935", cursor: "pointer" }} onClick={() => {
                            setMySchedule(prev => ({ ...prev, [day]: (prev[day] || []).filter((_, i) => i !== si) }));
                          }}>✕</button>
                        </div>
                      ))}
                      <button
                        style={{ fontSize: 12, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", padding: "4px 0" }}
                        onClick={() => setMySchedule(prev => ({ ...prev, [day]: [...(prev[day] || []).filter(s => s !== "all-day"), { from: "", to: "" }] }))}
                      >
                        + Add time slot
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {Object.keys(mySchedule).length === 0 || Object.values(mySchedule).every(v => !v || v.length === 0) ? (
              <div style={{ background: "#FFF8E1", borderRadius: 10, padding: 14, textAlign: "center" }}>
                <span style={{ fontSize: 24 }}>📅</span>
                <p style={{ fontSize: 13, color: "#666", marginTop: 6 }}>Tap Edit to set your weekly availability so other moms know when you're free!</p>
              </div>
            ) : (
              ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                const slots = mySchedule[day];
                if (!slots || slots.length === 0) return null;
                return (
                  <div key={day} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <strong style={{ fontSize: 13, color: "#2D2D2D", width: 36, flexShrink: 0 }}>{day.slice(0, 3)}</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {slots[0] === "all-day" ? (
                        <span style={{ fontSize: 12, color: "#2E7D32", background: "#E8F5E9", padding: "3px 10px", borderRadius: 50, fontWeight: 600 }}>All Day</span>
                      ) : (
                        slots.filter(s => s.from && s.to).map((slot, i) => (
                          <span key={i} style={{ fontSize: 12, color: "#3B82F6", background: "#F0F7FF", padding: "3px 10px", borderRadius: 50, fontWeight: 500 }}>{slot.from} – {slot.to}</span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div style={styles.menuList}>
        {[
          { label: "Edit Profile", icon: "✏️", action: () => setEditing(true) },
          { label: "My Children", icon: "👶", action: () => setMenuView("children") },
          { label: "Discover Moms", icon: "🔍", action: () => onShowDiscover && onShowDiscover() },
          { label: `Notifications${(notifications || []).filter(n => !n.is_read).length > 0 ? ` (${(notifications || []).filter(n => !n.is_read).length})` : ''}`, icon: "🔔", action: () => setMenuView("notifications") },
          { label: "Privacy & Safety", icon: "🔒", action: () => setMenuView("privacy") },
          ...(isAppFounder ? [{ label: "Admin Panel", icon: "👑", action: () => setMenuView("admin-panel") }] : []),
          { label: "About MamaSquads", icon: "💛", action: () => setMenuView("about") },
          { label: "Terms of Service", icon: "📄", action: () => setMenuView("terms") },
          { label: "Privacy Policy", icon: "🔐", action: () => setMenuView("privacy-policy") },
          { label: "Sign Out", icon: "👋", action: handleSignOut },
        ].map(item => (
          <div key={item.label} style={styles.menuItem} onClick={item.action}>
            <span>{item.icon} {item.label}</span>
            <span style={{ color: "#ccc" }}>›</span>
          </div>
        ))}
      </div>

      <PageFooter />

      {/* ── Photo Adjust Modal ── */}
      {photoToAdjust && photoPreviewUrl && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ maxWidth: 360, width: "100%", padding: 20 }}>
            <h3 style={{ color: "white", textAlign: "center", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Adjust Your Photo</h3>
            <p style={{ color: "#888", textAlign: "center", fontSize: 12, marginBottom: 16 }}>Drag to reposition, zoom to resize</p>

            {/* Crop area */}
            <div
              style={{ width: 240, height: 240, borderRadius: 120, overflow: "hidden", margin: "0 auto", border: "3px solid white", position: "relative", touchAction: "none", cursor: "grab" }}
              onMouseDown={e => { setPhotoDragging(true); setPhotoDragStart({ x: e.clientX - photoPos.x, y: e.clientY - photoPos.y }); }}
              onMouseMove={e => { if (photoDragging) setPhotoPos({ x: e.clientX - photoDragStart.x, y: e.clientY - photoDragStart.y }); }}
              onMouseUp={() => setPhotoDragging(false)}
              onMouseLeave={() => setPhotoDragging(false)}
              onTouchStart={e => { const t = e.touches[0]; setPhotoDragging(true); setPhotoDragStart({ x: t.clientX - photoPos.x, y: t.clientY - photoPos.y }); }}
              onTouchMove={e => { if (photoDragging) { const t = e.touches[0]; setPhotoPos({ x: t.clientX - photoDragStart.x, y: t.clientY - photoDragStart.y }); } }}
              onTouchEnd={() => setPhotoDragging(false)}
            >
              <img
                src={photoPreviewUrl}
                alt="Preview"
                draggable={false}
                style={{ position: "absolute", top: "50%", left: "50%", width: "100%", height: "auto", transform: `translate(calc(-50% + ${photoPos.x}px), calc(-50% + ${photoPos.y}px)) scale(${photoZoom})`, pointerEvents: "none" }}
                onLoad={(e) => {
                  const img = e.target;
                  if (img.naturalWidth < img.naturalHeight) {
                    img.style.width = "100%";
                    img.style.height = "auto";
                  } else {
                    img.style.width = "auto";
                    img.style.height = "100%";
                  }
                }}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <p style={{ color: "#aaa", fontSize: 12, textAlign: "center", marginBottom: 8 }}>Zoom</p>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={photoZoom}
                onChange={e => setPhotoZoom(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#6B2C3B" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                style={{ flex: 1, padding: "12px 0", borderRadius: 50, background: "none", border: "1px solid #666", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => { setPhotoToAdjust(null); setPhotoPreviewUrl(null); setPhotoZoom(1); setPhotoPos({ x: 0, y: 0 }); }}
              >
                Cancel
              </button>
              <button
                style={{ flex: 1, padding: "12px 0", borderRadius: 50, background: "#6B2C3B", border: "none", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: photoUploading ? 0.6 : 1 }}
                disabled={photoUploading}
                onClick={async () => {
                  setPhotoUploading(true);
                  // Crop using canvas
                  const canvas = document.createElement('canvas');
                  const size = 400;
                  canvas.width = size;
                  canvas.height = size;
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  img.src = photoPreviewUrl;
                  await new Promise(resolve => { img.onload = resolve; });

                  // Calculate crop
                  const scale = photoZoom;
                  const imgAspect = img.width / img.height;
                  let drawW, drawH;
                  if (imgAspect > 1) { drawH = size / scale; drawW = drawH * imgAspect; }
                  else { drawW = size / scale; drawH = drawW / imgAspect; }
                  const offsetX = (size - drawW * scale) / 2 + photoPos.x * (size / 240) * scale;
                  const offsetY = (size - drawH * scale) / 2 + photoPos.y * (size / 240) * scale;

                  // Clip to circle
                  ctx.beginPath();
                  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                  ctx.clip();
                  ctx.drawImage(img, offsetX, offsetY, drawW * scale, drawH * scale);

                  canvas.toBlob(async (blob) => {
                    if (blob && onUploadPhoto) {
                      const file = new File([blob], 'avatar.png', { type: 'image/png' });
                      await onUploadPhoto(file);
                    }
                    setPhotoUploading(false);
                    setPhotoToAdjust(null);
                    setPhotoPreviewUrl(null);
                    setPhotoZoom(1);
                    setPhotoPos({ x: 0, y: 0 });
                  }, 'image/png', 0.9);
                }}
              >
                {photoUploading ? "Uploading..." : "Save Photo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── My Children Sub-screen ── */}
      {menuView === "children" && (
        <div style={{ position: "fixed", inset: 0, background: "#FFFBFC", zIndex: 100, overflow: "auto", paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
          <div style={{ maxWidth: 430, margin: "0 auto", padding: 16, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuView(null)}>{Icons.back}</button>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#2D2D2D" }}>My Children</h2>
            </div>
            {(user?.kids || []).length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <span style={{ fontSize: 40 }}>👶</span>
                <p style={{ fontSize: 14, color: "#888", marginTop: 12 }}>No children added yet. Tap Edit Profile to add them.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {user.kids.filter(k => k.gender || k.birthday).map((kid, i) => {
                  const kidAge = formatAge(kid.birthday);
                  const kidBday = isBirthdayToday(kid.birthday);
                  return (
                    <div key={i} style={{ background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 22, background: "#6B2C3B22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                          {kidBday ? '🎂' : '👶'}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D" }}>{kidBday ? '🎂 ' : ''}{kid.gender === "Girl" ? "👧 Girl" : kid.gender === "Boy" ? "👦 Boy" : "Child"}</h3>
                          {kidAge && <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{kidAge} years old</p>}
                          {kid.birthday && <p style={{ fontSize: 12, color: "#bbb", marginTop: 2 }}>Birthday: {MONTHS[parseInt(kid.birthday.split('-')[1]) - 1]} {parseInt(kid.birthday.split('-')[2])}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button style={{ ...styles.textBtn, marginTop: 16 }} onClick={() => { setMenuView(null); setEditing(true); }}>Edit Children</button>
          </div>
        </div>
      )}

      {/* ── Notifications Sub-screen ── */}
      {menuView === "notifications" && (
        <div style={{ position: "fixed", inset: 0, background: "#FFFBFC", zIndex: 100, overflow: "auto", paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
          <div style={{ maxWidth: 430, margin: "0 auto", padding: 16, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuView(null)}>{Icons.back}</button>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#2D2D2D" }}>Notifications</h2>
              </div>
              {(notifications || []).some(n => !n.is_read) && (
                <button
                  style={{ background: "none", border: "none", fontSize: 12, color: "#3B82F6", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                  onClick={async () => {
                    if (user) {
                      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
                      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                    }
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
            {(!notifications || notifications.length === 0) ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <span style={{ fontSize: 40 }}>🔔</span>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#2D2D2D", marginTop: 12 }}>You're all caught up!</p>
                <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Notifications for polls, confirmed meetups, and group activity will appear here.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    style={{
                      background: notif.is_read ? "white" : "#F0F7FF",
                      borderRadius: 12, padding: 14,
                      border: notif.is_read ? "1px solid #f0f0f0" : "1px solid #BFDBFE",
                      cursor: "pointer",
                    }}
                    onClick={async () => {
                      if (!notif.is_read && user) {
                        await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                      }
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 22 }}>
                        {notif.type === 'new_poll' ? '🗳️' : notif.type === 'poll_confirmed' ? '✅' : '🔔'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: 13, color: "#2D2D2D" }}>{notif.title}</strong>
                          {!notif.is_read && <div style={{ width: 8, height: 8, borderRadius: 4, background: "#3B82F6", flexShrink: 0 }} />}
                        </div>
                        <p style={{ fontSize: 12, color: "#666", marginTop: 4, lineHeight: 1.4 }}>{notif.body}</p>
                        <p style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>{new Date(notif.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Privacy & Safety Sub-screen ── */}
      {menuView === "privacy" && (
        <div style={{ position: "fixed", inset: 0, background: "#FFFBFC", zIndex: 100, overflow: "auto", paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
          <div style={{ maxWidth: 430, margin: "0 auto", padding: 16, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuView(null)}>{Icons.back}</button>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#2D2D2D" }}>Privacy & Safety</h2>
            </div>

            {/* Profile Visibility Toggle */}
            <div style={{ background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0", marginBottom: 16 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "#2D2D2D", marginBottom: 12 }}>Profile Visibility</h4>
              {[
                { value: "public", label: "Public", desc: "All verified members can see your full profile, bio, interests, and kids' ages.", icon: "🌐" },
                { value: "private", label: "Private", desc: "Only moms you're connected with or in the same groups can see your full profile.", icon: "🔒" },
              ].map(opt => {
                const isSelected = (user?.profile_visibility || "public") === opt.value;
                return (
                  <div
                    key={opt.value}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 12, cursor: "pointer", marginBottom: 8,
                      border: isSelected ? "2px solid #6B2C3B" : "1.5px solid #f0f0f0",
                      background: isSelected ? "#FFF5F7" : "white",
                    }}
                    onClick={async () => {
                      if (user) {
                        await supabase.from('users').update({ profile_visibility: opt.value }).eq('id', user.id);
                        setUser(prev => ({ ...prev, profile_visibility: opt.value }));
                      }
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{opt.label}</strong>
                        {isSelected && <span style={{ fontSize: 11, fontWeight: 600, color: "#6B2C3B", background: "#FAF0F2", padding: "2px 8px", borderRadius: 50 }}>Current</span>}
                      </div>
                      <p style={{ fontSize: 12, color: "#888", marginTop: 4, lineHeight: 1.4 }}>{opt.desc}</p>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: 10, border: isSelected ? "none" : "2px solid #ddd", background: isSelected ? "#6B2C3B" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      {isSelected && <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "🔒", title: "Verified Community", desc: "Every member is identity-verified to keep our community safe for moms and kids." },
                { icon: "🛡️", title: "Data Protection", desc: "Your personal information is encrypted and never shared with third parties." },
                { icon: "🚫", title: "Blocking & Reporting", desc: "You can block or report any member. Our team reviews all reports within 24 hours." },
                { icon: "📍", title: "Location Privacy", desc: "Your exact location is never shared. Only your general area is visible to other moms." },
              ].map((item, i) => (
                <div key={i} style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>{item.title}</h4>
                      <p style={{ fontSize: 13, color: "#888", marginTop: 4, lineHeight: 1.4 }}>{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── About MamaSquads Sub-screen ── */}
      {menuView === "about" && (
        <div style={{ position: "fixed", inset: 0, background: "#FFFBFC", zIndex: 100, overflow: "auto", paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
          <div style={{ maxWidth: 430, margin: "0 auto", padding: 16, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuView(null)}>{Icons.back}</button>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#2D2D2D" }}>About MamaSquads</h2>
            </div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <img src="/logo.png" alt="MamaSquads" style={{ width: 120, height: 120, objectFit: "contain" }} />
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#2D2D2D", marginTop: 8 }}>MamaSquads</h3>
              <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>The verified, moms-only playdate community</p>
              <p style={{ fontSize: 12, color: "#bbb", marginTop: 8 }}>Version 1.0.0</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "💛", title: "Our Mission", desc: "To make it effortless for moms to find their people — nearby moms whose kids are the same age, who share their interests, and who are just as eager to get out of the house." },
                { icon: "🔒", title: "Safety First", desc: "Every single member is verified. No exceptions. We built MamaSquads so you never have to wonder if the person at the playdate is who they say they are." },
                { icon: "🌍", title: "Currently Available", desc: "Long Island & Westchester/CT (beta). Nationwide expansion coming 2027." },
                { icon: "📧", title: "Contact Us", desc: "mama.squads1@gmail.com", link: "mailto:mama.squads1@gmail.com" },
              ].map((item, i) => (
                <div key={i} style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>{item.title}</h4>
                      {item.link ? (
                        <a href={item.link} style={{ fontSize: 13, color: "#6B2C3B", marginTop: 4, lineHeight: 1.4, display: "block", textDecoration: "none" }}>{item.desc}</a>
                      ) : (
                        <p style={{ fontSize: 13, color: "#888", marginTop: 4, lineHeight: 1.4 }}>{item.desc}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Panel (Founder Only) ── */}
      {menuView === "admin-panel" && isAppFounder && (
        <div style={{ position: "fixed", inset: 0, background: "#FFFBFC", zIndex: 100, overflow: "auto", paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
          <div style={{ maxWidth: 430, margin: "0 auto", padding: 16, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuView(null)}>{Icons.back}</button>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#2D2D2D" }}>👑 Admin Panel</h2>
            </div>

            <AdminPanelContent
              user={user}
              adminApps={adminApps}
              setAdminApps={setAdminApps}
              adminAppsLoaded={adminAppsLoaded}
              setAdminAppsLoaded={setAdminAppsLoaded}
            />
          </div>
        </div>
      )}

      {/* ── Terms of Service ── */}
      {menuView === "terms" && (
        <div style={{ position: "fixed", inset: 0, background: "#FFFBFC", zIndex: 100, overflow: "auto", paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
          <div style={{ maxWidth: 430, margin: "0 auto", padding: 16, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuView(null)}>{Icons.back}</button>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#2D2D2D" }}>Terms of Service</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 12, color: "#888" }}>Last updated: March 2026</p>

              {[
                { title: "1. Acceptance of Terms", text: "By creating an account or using MamaSquads, you agree to these Terms of Service. If you do not agree, please do not use the app." },
                { title: "2. Eligibility", text: "MamaSquads is exclusively for verified mothers and legal guardians. You must be at least 18 years old to create an account. All members must complete identity verification before accessing community features." },
                { title: "3. Account Registration", text: "You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your password and for all activities under your account. Notify us immediately of any unauthorized access." },
                { title: "4. Identity Verification", text: "All members must complete our identity verification process. This may include government-issued photo ID verification, selfie verification, and parental/guardian status confirmation. Providing false information will result in permanent account termination." },
                { title: "5. Community Standards", text: "You agree to treat all members with respect and kindness. Harassment, bullying, discrimination, hate speech, and threatening behavior are strictly prohibited and will result in immediate account termination. All interactions must prioritize the safety of children." },
                { title: "6. Child Safety", text: "The safety of children is our highest priority. You agree to supervise your children at all playdates and events. Sharing photos of other members' children without explicit consent is prohibited. Any suspected child endangerment will be reported to authorities." },
                { title: "7. Content & Conduct", text: "You are responsible for all content you post. No soliciting, multi-level marketing, or commercial activity is allowed without admin approval. No sharing of explicit, violent, or inappropriate content. Content that violates these terms will be removed." },
                { title: "8. Privacy of Members", text: "You agree not to share other members' personal information, including full names, addresses, phone numbers, or photos, outside of the MamaSquads community without their explicit consent." },
                { title: "9. Playdates & Events", text: "MamaSquads facilitates connections between parents but is not responsible for what occurs at playdates or events. Parents are solely responsible for the supervision and safety of their children at all times." },
                { title: "10. Account Termination", text: "We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or pose a risk to the safety of our community. Users may delete their account at any time." },
                { title: "11. Limitation of Liability", text: "MamaSquads is provided \"as is\" without warranties of any kind. We are not liable for any damages arising from your use of the app, interactions with other members, or events organized through the platform." },
                { title: "12. Changes to Terms", text: "We may update these terms at any time. Continued use of MamaSquads after changes constitutes acceptance of the updated terms. Material changes will be communicated via the app." },
                { title: "13. Contact", text: "For questions about these terms, contact us at mama.squads1@gmail.com." },
              ].map((section, i) => (
                <div key={i}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D", marginBottom: 4 }}>{section.title}</h4>
                  <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{section.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Privacy Policy ── */}
      {menuView === "privacy-policy" && (
        <div style={{ position: "fixed", inset: 0, background: "#FFFBFC", zIndex: 100, overflow: "auto", paddingTop: "calc(48px + env(safe-area-inset-top, 0px))" }}>
          <div style={{ maxWidth: 430, margin: "0 auto", padding: 16, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuView(null)}>{Icons.back}</button>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#2D2D2D" }}>Privacy Policy</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 12, color: "#888" }}>Last updated: March 2026</p>

              {[
                { title: "1. Information We Collect", text: "We collect information you provide during registration: your name, email address, date of birth, area/zip code, bio, children's names and birthdates, interests, and profile photo. We also collect identity verification documents during the verification process." },
                { title: "2. How We Use Your Information", text: "We use your information to: create and manage your account, verify your identity, match you with nearby moms for playdates, display your profile to other verified members, send notifications about group activity and events, and improve our services." },
                { title: "3. Information Shared with Other Members", text: "Other verified members can see: your name, area (not exact address), bio, children's ages (not names or birthdates), interests, profile photo, and verification status. Children's names and exact birthdates are never shared publicly." },
                { title: "4. Identity Verification Data", text: "Government-issued ID and selfie photos submitted for verification are used solely for identity confirmation. This data is processed securely and is not shared with other members or third parties except as required by law." },
                { title: "5. Data Storage & Security", text: "Your data is stored securely using industry-standard encryption provided by our database partner (Supabase). We use HTTPS for all data transmission. Access to user data is restricted to authorized personnel only." },
                { title: "6. Children's Privacy", text: "We take children's privacy seriously. Children's names are only visible to their parent/guardian. Only ages are displayed to other members. We do not collect any information directly from children. We comply with COPPA (Children's Online Privacy Protection Act)." },
                { title: "7. Location Data", text: "We collect your general area or zip code to match you with nearby moms. We do not collect precise GPS location data. Your exact address is never stored or shared." },
                { title: "8. Cookies & Tracking", text: "We use essential cookies to maintain your login session. We do not use advertising cookies or sell your data to third-party advertisers." },
                { title: "9. Third-Party Services", text: "We use the following third-party services: Supabase (database and authentication), Vercel (hosting). These services have their own privacy policies and handle data according to industry standards." },
                { title: "10. Your Rights", text: "You have the right to: access your personal data, correct inaccurate data, delete your account and associated data, export your data, opt out of non-essential communications. To exercise these rights, contact us at mama.squads1@gmail.com." },
                { title: "11. Data Retention", text: "We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law." },
                { title: "12. Changes to This Policy", text: "We may update this Privacy Policy periodically. We will notify you of material changes via the app. Continued use after changes constitutes acceptance." },
                { title: "13. Contact Us", text: "For privacy-related questions or concerns, contact us at mama.squads1@gmail.com." },
              ].map((section, i) => (
                <div key={i}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D", marginBottom: 4 }}>{section.title}</h4>
                  <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{section.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Panel Content (Founder Only) ───
function AdminPanelContent({ user, adminApps, setAdminApps, adminAppsLoaded, setAdminAppsLoaded }) {
  const [processing, setProcessing] = useState(null);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [inviteCodesLoaded, setInviteCodesLoaded] = useState(false);
  const [newCodeName, setNewCodeName] = useState("");
  const [creatingCode, setCreatingCode] = useState(false);
  const [activeTab, setActiveTab] = useState("invites");

  // Load invite codes
  useEffect(() => {
    if (inviteCodesLoaded) return;
    supabase.from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setInviteCodes(data);
        setInviteCodesLoaded(true);
      });
  }, [inviteCodesLoaded]);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MS-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const createInviteCode = async () => {
    setCreatingCode(true);
    const code = generateCode();
    const { data, error } = await supabase.from('invite_codes').insert({
      code,
      created_by: user?.id,
    }).select().single();
    if (data) setInviteCodes(prev => [data, ...prev]);
    setCreatingCode(false);
  };

  const deleteInviteCode = async (id) => {
    await supabase.from('invite_codes').delete().eq('id', id);
    setInviteCodes(prev => prev.filter(c => c.id !== id));
  };

  // Load admin applications
  useEffect(() => {
    if (adminAppsLoaded) return;
    supabase.from('admin_applications')
      .select('*, users!user_id(full_name, email, area, bio)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAdminApps(data);
        setAdminAppsLoaded(true);
      });
  }, [adminAppsLoaded]);

  const handleApprove = async (app) => {
    setProcessing(app.id);
    // Update application status
    await supabase.from('admin_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', app.id);
    // Set user role to admin
    await supabase.from('users')
      .update({ role: 'admin' })
      .eq('id', app.user_id);
    // Update local state
    setAdminApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
    setProcessing(null);
  };

  const handleDeny = async (app) => {
    setProcessing(app.id);
    await supabase.from('admin_applications')
      .update({ status: 'denied', reviewed_at: new Date().toISOString() })
      .eq('id', app.id);
    setAdminApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'denied' } : a));
    setProcessing(null);
  };

  const pending = adminApps.filter(a => a.status === 'pending');
  const reviewed = adminApps.filter(a => a.status !== 'pending');

  if (!adminAppsLoaded || !inviteCodesLoaded) {
    return <p style={{ fontSize: 14, color: "#888", textAlign: "center", padding: 40 }}>Loading...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #f0f0f0" }}>
        {[
          { id: "invites", label: `Invite Codes (${inviteCodes.length})` },
          { id: "applications", label: `Applications (${pending.length})` },
        ].map(t => (
          <button key={t.id} style={{ flex: 1, padding: "10px 0", background: "none", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderBottom: activeTab === t.id ? "2px solid #6B2C3B" : "2px solid transparent", color: activeTab === t.id ? "#6B2C3B" : "#999" }} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Invite Codes Tab ── */}
      {activeTab === "invites" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: "linear-gradient(135deg, #6B2C3B, #4A1E2A)", color: "white", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: creatingCode ? 0.6 : 1 }}
            onClick={createInviteCode}
            disabled={creatingCode}
          >
            {creatingCode ? "Creating..." : "+ Generate Invite Code"}
          </button>

          {inviteCodes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <span style={{ fontSize: 32 }}>🎟️</span>
              <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No invite codes yet. Generate one to invite a mom!</p>
            </div>
          ) : (
            inviteCodes.map(ic => (
              <div key={ic.id} style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D", letterSpacing: 2, fontFamily: "monospace" }}>{ic.code}</p>
                  <p style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>Created {new Date(ic.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ padding: "6px 12px", borderRadius: 8, background: "#F0F7FF", border: "none", fontSize: 12, fontWeight: 600, color: "#3B82F6", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    onClick={() => {
                      navigator.clipboard?.writeText(ic.code);
                    }}
                  >
                    Copy
                  </button>
                  <button
                    style={{ padding: "6px 12px", borderRadius: 8, background: "#FFEBEE", border: "none", fontSize: 12, fontWeight: 600, color: "#C62828", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    onClick={() => deleteInviteCode(ic.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          <div style={{ background: "#F5F5F5", borderRadius: 10, padding: 12, marginTop: 4 }}>
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>💡 Each code can only be used once. After someone signs up with a code, it's automatically deleted. Share codes directly — don't post them publicly.</p>
          </div>
        </div>
      )}

      {/* ── Applications Tab ── */}
      {activeTab === "applications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "#FFF8E1", borderRadius: 12, padding: 14, textAlign: "center" }}>
          <strong style={{ fontSize: 22, color: "#F57F17" }}>{pending.length}</strong>
          <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Pending</p>
        </div>
        <div style={{ flex: 1, background: "#E8F5E9", borderRadius: 12, padding: 14, textAlign: "center" }}>
          <strong style={{ fontSize: 22, color: "#2E7D32" }}>{reviewed.filter(a => a.status === 'approved').length}</strong>
          <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Approved</p>
        </div>
        <div style={{ flex: 1, background: "#FFEBEE", borderRadius: 12, padding: 14, textAlign: "center" }}>
          <strong style={{ fontSize: 22, color: "#C62828" }}>{reviewed.filter(a => a.status === 'denied').length}</strong>
          <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Denied</p>
        </div>
      </div>

      {/* Pending Applications */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D" }}>Pending Applications</h3>
      {pending.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <span style={{ fontSize: 32 }}>✨</span>
          <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No pending applications</p>
        </div>
      ) : (
        pending.map(app => (
          <div key={app.id} style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: "#6B2C3B22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#6B2C3B", flexShrink: 0 }}>
                {(app.users?.full_name || '?').split(' ').map(w => w[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 15, color: "#2D2D2D" }}>{app.users?.full_name || 'Unknown'}</strong>
                <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{app.users?.email}</p>
                {app.area && <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {app.area}</p>}
                {app.reason && (
                  <div style={{ background: "#FAFAFA", borderRadius: 8, padding: 10, marginTop: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 2 }}>WHY THEY WANT TO BE AN ADMIN</p>
                    <p style={{ fontSize: 13, color: "#555", lineHeight: 1.4 }}>{app.reason}</p>
                  </div>
                )}
                {app.local_connections && <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Connects with: {app.local_connections}</p>}
                {app.experience && <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>Experience: {app.experience}</p>}
                <p style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>Applied {new Date(app.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#4CAF50", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: processing === app.id ? 0.6 : 1 }}
                onClick={() => handleApprove(app)}
                disabled={processing === app.id}
              >
                {processing === app.id ? "..." : "✓ Approve"}
              </button>
              <button
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#FFEBEE", color: "#C62828", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: processing === app.id ? 0.6 : 1 }}
                onClick={() => handleDeny(app)}
                disabled={processing === app.id}
              >
                Deny
              </button>
            </div>
          </div>
        ))
      )}

      {/* Reviewed Applications */}
      {reviewed.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D", marginTop: 8 }}>Reviewed</h3>
          {reviewed.map(app => (
            <div key={app.id} style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #f0f0f0", opacity: 0.7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{app.users?.full_name || 'Unknown'}</strong>
                  <p style={{ fontSize: 12, color: "#888" }}>{app.users?.email}</p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 50,
                  background: app.status === 'approved' ? "#E8F5E9" : "#FFEBEE",
                  color: app.status === 'approved' ? "#2E7D32" : "#C62828",
                }}>
                  {app.status === 'approved' ? '✓ Approved' : '✕ Denied'}
                </span>
              </div>
            </div>
          ))}
        </>
      )}

        </div>
      )}
    </div>
  );
}

// ─── Create Event Screen ───
function CreateEventScreen({ onBack, onSubmit, user }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [ages, setAges] = useState("All Ages");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSubmitting(true);
    setError(null);

    const result = await onSubmit({
      title: title.trim(),
      location: location.trim(),
      date: date.trim() || "TBD",
      time: time.trim() || "TBD",
      ages,
      maxAttendees: parseInt(maxAttendees) || 15,
      description: description.trim(),
    });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      onBack();
    }
  };

  return (
    <div style={styles.detailScreen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
        <h2 style={styles.detailTitle}>Create Playdate</h2>
        <div style={{ width: 40 }} />
      </div>
      <div style={styles.detailBody}>
        <div style={styles.onboardFields}>
          <input style={styles.input} placeholder="Playdate title (e.g., Park Day!)" value={title} onChange={e => setTitle(e.target.value)} />
          <AddressInput inputStyle={styles.input} placeholder="Search for a location..." value={location} onChange={setLocation} userArea={user?.area} />
          <p style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Date</p>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select style={{ ...styles.input, flex: 2 }} value={date.split('/')[0] || ''} onChange={e => { const parts = date.split('/'); setDate(`${e.target.value}/${parts[1] || ''}/${new Date().getFullYear()}`); }}>
              <option value="">Month</option>
              {MONTHS.map((m, i) => <option key={i} value={m}>{m}</option>)}
            </select>
            <select style={{ ...styles.input, flex: 1 }} value={date.split('/')[1] || ''} onChange={e => { const parts = date.split('/'); setDate(`${parts[0] || ''}/${e.target.value}/${new Date().getFullYear()}`); }}>
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D", padding: "0 8px" }}>{new Date().getFullYear()}</span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Time</p>
          <select style={styles.input} value={time} onChange={e => setTime(e.target.value)}>
            <option value="">Select a time</option>
            {["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select style={styles.input} value={ages} onChange={e => setAges(e.target.value)}>
            <option>All Ages</option>
            {AGE_FILTERS.slice(1).map(a => <option key={a} value={a}>{a} years</option>)}
          </select>
          <input style={styles.input} placeholder="Max attendees" type="number" value={maxAttendees} onChange={e => setMaxAttendees(e.target.value)} />
          <textarea style={{ ...styles.input, minHeight: 100, fontFamily: "inherit" }} placeholder="Describe the playdate... What should moms expect?" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        {error && <p style={{ fontSize: 13, color: "#E53935", textAlign: "center", marginTop: 8 }}>{error}</p>}
        <button
          style={{ ...styles.primaryBtn, width: "100%", marginTop: 20, opacity: submitting ? 0.6 : 1 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Posting..." : "Post Playdate 🎉"}
        </button>
      </div>
    </div>
  );
}

// ─── Group Polls Tab ───
function GroupPollsTab({ group, user, onProposeMeetup, loadMeetupProposals, onVote, onCreateEvent }) {
  const [polls, setPolls] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDay, setPollDay] = useState("");
  const [pollProposedTime, setPollProposedTime] = useState("");
  const [pollLocations, setPollLocations] = useState([""]);
  const [creating, setCreating] = useState(false);
  const [myVotes, setMyVotes] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'founder';

  const handleDeletePoll = async (pollId) => {
    setDeleting(pollId);
    await supabase.from('votes').delete().eq('proposal_id', pollId);
    await supabase.from('meetup_proposals').delete().eq('id', pollId);
    setPolls(prev => prev.filter(p => p.id !== pollId));
    setConfirmDelete(null);
    setDeleting(null);
  };

  const TIMES = ["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM"];

  useEffect(() => {
    if (loaded || !loadMeetupProposals || !group.fromSupabase) return;
    loadMeetupProposals(group.id).then(data => {
      setPolls(data);
      if (user && data.length > 0) {
        const votes = {};
        data.forEach(p => {
          (p.votes || []).forEach(v => {
            if (v.user_id === user.id) {
              if (v.vote_type === 'time') votes[p.id] = v.option_index;
              if (v.vote_type === 'location') votes[`${p.id}_loc`] = v.option_index;
            }
          });
        });
        setMyVotes(votes);
      }
      setLoaded(true);
    });
  }, [loaded, group.id]);

  const handleCreate = async () => {
    if (!pollTitle.trim() || !pollDay) return;
    setCreating(true);
    if (onProposeMeetup) {
      const proposedLabel = pollProposedTime ? `Proposed: ${pollProposedTime}` : '';
      const locs = pollLocations.map(l => l.trim()).filter(Boolean);
      const locationLabel = locs.length > 0 ? `📍 ${locs.length} location${locs.length > 1 ? 's' : ''}` : '';
      const descParts = [proposedLabel, locationLabel].filter(Boolean).join(' | ');
      const result = await onProposeMeetup(group.id, {
        title: pollTitle.trim(),
        description: `${descParts ? descParts + ' — ' : ''}What time works best on ${pollDay}?`,
        timeOptions: TIMES.slice(),
        locationOptions: locs,
      });
      if (result.data) {
        // Auto-vote for proposed time if set
        if (pollProposedTime && onVote) {
          await onVote(result.data.id, 'time', pollProposedTime);
          setMyVotes(prev => ({ ...prev, [result.data.id]: pollProposedTime }));
          setPolls(prev => [{ ...result.data, votes: [{ user_id: user?.id, vote_type: 'time', option_index: pollProposedTime }] }, ...prev]);
        } else {
          setPolls(prev => [{ ...result.data, votes: [] }, ...prev]);
        }
      }
    }
    setCreating(false);
    setPollTitle(""); setPollDay(""); setPollProposedTime(""); setPollLocations([""]);
    setShowCreate(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button
        style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: "#6B2C3B", color: "white", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
        onClick={() => setShowCreate(!showCreate)}
      >
        {showCreate ? "Cancel" : "+ Create a Poll"}
      </button>

      {showCreate && (
        <div style={{ background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D", marginBottom: 12 }}>New Time Poll</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#2D2D2D" }}
              placeholder="What's the occasion? (e.g., Park playdate)"
              value={pollTitle}
              onChange={e => setPollTitle(e.target.value)}
            />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>Pick a day</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                <button key={d} style={{ padding: "8px 14px", borderRadius: 50, fontSize: 13, cursor: "pointer", border: pollDay === d ? "2px solid #6B2C3B" : "1.5px solid #E8E8E8", background: pollDay === d ? "#FAF0F2" : "white", color: pollDay === d ? "#6B2C3B" : "#666", fontWeight: pollDay === d ? 600 : 400, fontFamily: "'DM Sans', sans-serif" }} onClick={() => setPollDay(d)}>{d}</button>
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginTop: 4 }}>Locations (optional — add options for members to vote on)</p>
            {pollLocations.map((loc, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <AddressInput
                    inputStyle={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#2D2D2D" }}
                    placeholder={`Location option ${i + 1}...`}
                    value={loc}
                    onChange={val => setPollLocations(prev => prev.map((l, j) => j === i ? val : l))}
                    userArea={user?.area || group.area}
                  />
                </div>
                {pollLocations.length > 1 && (
                  <button style={{ background: "none", border: "none", fontSize: 18, color: "#E53935", cursor: "pointer", padding: 4 }} onClick={() => setPollLocations(prev => prev.filter((_, j) => j !== i))}>✕</button>
                )}
              </div>
            ))}
            {pollLocations.length < 5 && (
              <button style={{ background: "none", border: "none", fontSize: 13, color: "#6B2C3B", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textAlign: "left", padding: 0 }} onClick={() => setPollLocations(prev => [...prev, ""])}>+ Add another location</button>
            )}
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginTop: 4 }}>Your proposed time</p>
            <select
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#2D2D2D", background: "white" }}
              value={pollProposedTime}
              onChange={e => setPollProposedTime(e.target.value)}
            >
              <option value="">Select your preferred time...</option>
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <p style={{ fontSize: 12, color: "#888" }}>Members can vote for your time or suggest a different one.</p>
            <button
              style={{ width: "100%", padding: "14px 0", borderRadius: 50, background: "#6B2C3B", color: "white", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: creating || !pollTitle.trim() || !pollDay ? 0.5 : 1 }}
              onClick={handleCreate}
              disabled={creating || !pollTitle.trim() || !pollDay}
            >
              {creating ? "Creating..." : "Post Poll"}
            </button>
          </div>
        </div>
      )}

      {!loaded && <p style={{ fontSize: 14, color: "#888", textAlign: "center", padding: 20 }}>Loading polls...</p>}

      {loaded && polls.length === 0 && !showCreate && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <span style={{ fontSize: 32 }}>🗳️</span>
          <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No polls yet. Create one to find the best time to meet!</p>
        </div>
      )}

      {polls.map(poll => {
        const voteCounts = {};
        const votersByTime = {};
        const locVoteCounts = {};
        const votersByLoc = {};
        (poll.votes || []).forEach(v => {
          if (v.vote_type === 'time') {
            voteCounts[v.option_index] = (voteCounts[v.option_index] || 0) + 1;
            if (!votersByTime[v.option_index]) votersByTime[v.option_index] = [];
            votersByTime[v.option_index].push(v.users?.full_name || 'A mom');
          }
          if (v.vote_type === 'location') {
            locVoteCounts[v.option_index] = (locVoteCounts[v.option_index] || 0) + 1;
            if (!votersByLoc[v.option_index]) votersByLoc[v.option_index] = [];
            votersByLoc[v.option_index].push(v.users?.full_name || 'A mom');
          }
        });
        const totalVotes = Object.values(voteCounts).reduce((s, c) => s + c, 0);
        const totalLocVotes = Object.values(locVoteCounts).reduce((s, c) => s + c, 0);
        const myVote = myVotes[poll.id];
        const myLocVote = myVotes[`${poll.id}_loc`];
        const topTimes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]).map(([time, votes]) => ({ time, votes, voters: votersByTime[time] || [] }));
        const topLocations = Object.entries(locVoteCounts).sort((a, b) => b[1] - a[1]).map(([loc, votes]) => ({ loc, votes, voters: votersByLoc[loc] || [] }));

        return (
          <div key={poll.id} style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6B2C3B", background: "#FAF0F2", padding: "3px 10px", borderRadius: 50 }}>🗳️ Poll</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#bbb" }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                {(isAdmin || poll.created_by === user?.id) && (
                  confirmDelete === poll.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={{ padding: "3px 8px", borderRadius: 6, background: "#C62828", color: "white", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: deleting === poll.id ? 0.5 : 1 }} onClick={() => handleDeletePoll(poll.id)} disabled={deleting === poll.id}>{deleting === poll.id ? "..." : "Delete"}</button>
                      <button style={{ padding: "3px 8px", borderRadius: 6, background: "#f0f0f0", color: "#666", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onClick={() => setConfirmDelete(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button style={{ background: "none", border: "none", fontSize: 14, color: "#ccc", cursor: "pointer", padding: "0 4px" }} onClick={() => setConfirmDelete(poll.id)}>🗑️</button>
                  )
                )}
              </div>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D", marginBottom: 2 }}>{poll.title}</h3>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>{poll.description}</p>
            {/* Location voting */}
            {poll.location_options && poll.location_options.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginBottom: 6 }}>{Icons.location} Location{poll.location_options.length > 1 ? ' — vote for your pick' : ''}</p>
                {poll.location_options.length === 1 ? (
                  <p style={{ fontSize: 12, color: "#6B2C3B" }}>📍 {poll.location_options[0]}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {poll.location_options.map((loc, li) => {
                      const locCount = locVoteCounts[loc] || 0;
                      const isMyLocVote = myLocVote === loc;
                      return (
                        <div key={li} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", textAlign: "left", border: isMyLocVote ? "2px solid #6B2C3B" : "1.5px solid #E8E8E8", background: isMyLocVote ? "#FAF0F2" : "white", color: isMyLocVote ? "#6B2C3B" : "#555", fontWeight: isMyLocVote ? 600 : 400, fontFamily: "'DM Sans', sans-serif" }}
                            onClick={async () => {
                              if (!onVote) return;
                              await onVote(poll.id, 'location', loc);
                              setMyVotes(prev => ({ ...prev, [`${poll.id}_loc`]: loc }));
                              setPolls(prev => prev.map(p => {
                                if (p.id !== poll.id) return p;
                                const filtered = (p.votes || []).filter(v => !(v.user_id === user?.id && v.vote_type === 'location'));
                                return { ...p, votes: [...filtered, { user_id: user?.id, vote_type: 'location', option_index: loc, users: { full_name: user?.full_name } }] };
                              }));
                            }}
                          >
                            📍 {loc} {locCount > 0 ? `(${locCount})` : ''}
                          </button>
                        </div>
                      );
                    })}
                    {topLocations.length > 0 && topLocations[0].voters.length > 0 && (
                      <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Top: {topLocations[0].loc.split(',')[0]} — {topLocations[0].voters.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {topTimes.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {/* Winner */}
                <div style={{ background: "#E8F5E9", borderRadius: 10, padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🏆</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#2E7D32" }}>Leading: {topTimes[0].time}</p>
                      <p style={{ fontSize: 11, color: "#888" }}>{topTimes[0].votes} vote{topTimes[0].votes !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {onCreateEvent && (
                    <button
                      style={{ padding: "6px 12px", borderRadius: 50, background: "#2E7D32", color: "white", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      onClick={async (e) => {
                        const btn = e.target;
                        btn.textContent = "Creating...";
                        btn.disabled = true;
                        const dayMatch = poll.description?.match(/on (\w+)\??/);
                        const dayName = dayMatch ? dayMatch[1] : "";
                        const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                        const targetDay = dayNames.findIndex(d => d.toLowerCase() === dayName.toLowerCase());
                        let dateStr = "TBD";
                        if (targetDay >= 0) {
                          const now = new Date();
                          const diff = (targetDay - now.getDay() + 7) % 7 || 7;
                          const next = new Date(now);
                          next.setDate(now.getDate() + diff);
                          dateStr = `${MONTHS[next.getMonth()]}/${next.getDate()}/${next.getFullYear()}`;
                        }
                        const result = await onCreateEvent({ title: poll.title, location: topLocations[0]?.loc || poll.location_options?.[0] || '', date: dateStr, time: topTimes[0].time, ages: group.ages || 'All Ages', maxAttendees: 15, description: `Created from poll — ${topTimes[0].votes} votes for this time`, groupId: group.id });
                        if (result?.error) {
                          alert('Error creating playdate: ' + result.error);
                          btn.textContent = "Create Playdate";
                          btn.disabled = false;
                        } else {
                          btn.textContent = "✓ Created!";
                          btn.style.background = "#1B5E20";
                        }
                      }}
                    >
                      Create Playdate
                    </button>
                  )}
                </div>

                {/* Runner-up */}
                {topTimes.length > 1 && (
                  <div style={{ background: "#FFF8E1", borderRadius: 10, padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🥈</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#F57F17" }}>Runner-up: {topTimes[1].time}</p>
                        <p style={{ fontSize: 11, color: "#888" }}>{topTimes[1].votes} vote{topTimes[1].votes !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {onCreateEvent && (
                      <button
                        style={{ padding: "6px 12px", borderRadius: 50, background: "#F57F17", color: "white", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                        onClick={async (e) => {
                          const btn = e.target;
                          btn.textContent = "Creating...";
                          btn.disabled = true;
                          const dayMatch = poll.description?.match(/on (\w+)\??/);
                          const dayName = dayMatch ? dayMatch[1] : "";
                          const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                          const targetDay = dayNames.findIndex(d => d.toLowerCase() === dayName.toLowerCase());
                          let dateStr = "TBD";
                          if (targetDay >= 0) {
                            const now = new Date();
                            const diff = (targetDay - now.getDay() + 7) % 7 || 7;
                            const next = new Date(now);
                            next.setDate(now.getDate() + diff);
                            dateStr = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
                          }
                          const result = await onCreateEvent({ title: `${poll.title} (Alt time)`, location: topLocations[0]?.loc || poll.location_options?.[0] || '', date: dateStr, time: topTimes[1].time, ages: group.ages || 'All Ages', maxAttendees: 15, description: `Created from poll runner-up — ${topTimes[1].votes} votes for this time`, groupId: group.id });
                          if (result?.error) {
                            alert('Error creating playdate: ' + result.error);
                            btn.textContent = "Create Playdate";
                            btn.disabled = false;
                          } else {
                            btn.textContent = "✓ Created!";
                            btn.style.background = "#E65100";
                          }
                        }}
                      >
                        Create Playdate
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {myVote ? (
              <div style={{ background: "#FAF0F2", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: "#6B2C3B" }}>✓ You voted for <strong>{myVote}</strong></p>
                <button
                  style={{ padding: "6px 14px", borderRadius: 50, fontSize: 12, color: "#6B2C3B", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 6, background: "white", border: "1.5px solid #6B2C3B", fontWeight: 600 }}
                  onClick={async () => {
                    // Remove old vote from DB
                    await supabase.from('votes').delete().eq('proposal_id', poll.id).eq('user_id', user?.id).eq('vote_type', 'time');
                    // Remove from local state
                    setPolls(prev => prev.map(p => {
                      if (p.id !== poll.id) return p;
                      return { ...p, votes: (p.votes || []).filter(v => !(v.user_id === user?.id && v.vote_type === 'time')) };
                    }));
                    setMyVotes(prev => { const n = { ...prev }; delete n[poll.id]; return n; });
                  }}
                >
                  ✏️ Change Vote
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginBottom: 6 }}>What time works for you?</p>
                {/* Quick vote for popular times */}
                {topTimes.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {topTimes.slice(0, 3).map((t, j) => (
                      <button
                        key={j}
                        style={{ padding: "8px 14px", borderRadius: 50, fontSize: 12, cursor: "pointer", border: "1.5px solid #6B2C3B", background: "#FAF0F2", color: "#6B2C3B", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                        onClick={async () => {
                          if (!onVote) return;
                          await onVote(poll.id, 'time', t.time);
                          setMyVotes(prev => ({ ...prev, [poll.id]: t.time }));
                          setPolls(prev => prev.map(p => {
                            if (p.id !== poll.id) return p;
                            const filtered = (p.votes || []).filter(v => !(v.user_id === user?.id && v.vote_type === 'time'));
                            return { ...p, votes: [...filtered, { user_id: user?.id, vote_type: 'time', option_index: t.time, users: { full_name: user?.full_name } }] };
                          }));
                        }}
                      >
                        {t.time} ({t.votes})
                      </button>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Or propose a different time:</p>
                <select
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#2D2D2D", background: "white" }}
                  value=""
                  onChange={async (e) => {
                    const time = e.target.value;
                    if (!time || !onVote) return;
                    await onVote(poll.id, 'time', time);
                    setMyVotes(prev => ({ ...prev, [poll.id]: time }));
                    setPolls(prev => prev.map(p => {
                      if (p.id !== poll.id) return p;
                      const filtered = (p.votes || []).filter(v => !(v.user_id === user?.id && v.vote_type === 'time'));
                      return { ...p, votes: [...filtered, { user_id: user?.id, vote_type: 'time', option_index: time, users: { full_name: user?.full_name } }] };
                    }));
                  }}
                >
                  <option value="">Select any time...</option>
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            {topTimes.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Results</p>
                {topTimes.slice(0, 5).map((t, j) => (
                  <div key={j} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <div style={{ flex: 1, height: 24, borderRadius: 6, background: "#f5f5f5", overflow: "hidden", position: "relative" }}>
                        <div style={{ height: "100%", background: j === 0 ? "#6B2C3B" : "#D4B5BA", borderRadius: 6, width: `${totalVotes > 0 ? (t.votes / totalVotes) * 100 : 0}%`, transition: "width 0.3s ease" }} />
                        <span style={{ position: "absolute", left: 8, top: 4, fontSize: 11, fontWeight: 600, color: j === 0 ? "white" : "#666" }}>{t.time}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#666", width: 20, textAlign: "right" }}>{t.votes}</span>
                    </div>
                    {t.voters.length > 0 && (
                      <p style={{ fontSize: 11, color: "#999", marginLeft: 4 }}>{t.voters.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Admin Application ───
function AdminApplyScreen({ onBack, user }) {
  const [agreed, setAgreed] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Controlled form fields
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [area, setArea] = useState(user?.area || "");
  const [phone, setPhone] = useState("");
  const [motivation, setMotivation] = useState("");
  const [networkSize, setNetworkSize] = useState("");
  const [experience, setExperience] = useState("");
  const [references, setReferences] = useState("");

  const requirements = [
    { id: "active", label: "I have been an active MamaSquads member for at least 30 days" },
    { id: "playdates", label: "I have attended or hosted at least 3 playdates" },
    { id: "background", label: "I consent to a background check verification" },
    { id: "guidelines", label: "I have read and agree to the Community Admin Guidelines" },
    { id: "commitment", label: "I can commit to organizing at least 2 events per month" },
  ];

  const allAgreed = requirements.every(r => agreed[r.id]);

  const handleSubmit = async () => {
    if (!allAgreed) return;
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('admin_applications').insert({
      user_id: user?.id,
      area: area.trim(),
      reason: motivation.trim(),
      local_connections: networkSize,
      experience: experience,
      status: 'pending',
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setSubmitted(true);
      // Notify the founder
      const { data: founders } = await supabase.from('users').select('id').eq('role', 'founder');
      if (founders) {
        for (const founder of founders) {
          await supabase.from('notifications').insert({
            user_id: founder.id,
            type: 'admin_application',
            title: 'New Admin Application',
            body: `${user?.full_name || 'A mom'} has applied to be an admin. Review their application in the Admin Panel.`,
            is_read: false,
          });
        }
      }
    }
  };

  if (submitted) {
    return (
      <div style={styles.detailScreen}>
        <div style={styles.detailHeader}>
          <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
          <h2 style={styles.detailTitle}>Application Submitted</h2>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ ...styles.detailBody, alignItems: "center", justifyContent: "center", textAlign: "center", paddingTop: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ ...styles.adminHeroTitle, fontSize: 22 }}>Application Received!</h2>
          <p style={{ ...styles.adminHeroText, maxWidth: 300, margin: "12px auto 0" }}>Our team will review your application and get back to you within 3–5 business days. We may reach out for a brief phone interview.</p>
          <div style={{ background: "#FFF8E1", borderRadius: 12, padding: 16, marginTop: 24, width: "100%" }}>
            <p style={{ fontSize: 13, color: "#F57F17", fontWeight: 600, marginBottom: 4 }}>What happens next?</p>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>1. Application review by our team{"\n"}2. Background check verification{"\n"}3. Brief phone or video interview{"\n"}4. Welcome to the admin team! 🌟</p>
          </div>
          <button style={{ ...styles.primaryBtn, marginTop: 24 }} onClick={onBack}>Back to Discover</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.detailScreen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
        <h2 style={styles.detailTitle}>Apply to Be an Admin</h2>
        <div style={{ width: 40 }} />
      </div>
      <div style={styles.detailBody}>
        <div style={styles.adminHero}>
          <div style={{ fontSize: 48 }}>🛡️</div>
          <h2 style={styles.adminHeroTitle}>Lead Your Local<br />Mom Community</h2>
          <p style={styles.adminHeroText}>Admins are hand-selected community leaders who organize playdates, moderate groups, and ensure a safe, welcoming space for moms and kids.</p>
        </div>

        <div style={{ background: "#FAF0F2", borderRadius: 12, padding: 14, marginBottom: 4 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#4A1E2A", marginBottom: 4 }}>⚠️ Admin positions are vetted</p>
          <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>Not everyone can be an admin. All applicants go through a review process including a background check and interview to ensure the safety of our community.</p>
        </div>

        <div style={styles.adminPerks}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#2D2D2D", marginBottom: 8 }}>What admins do:</p>
          {[
            { icon: "📅", text: "Create & manage events for your area" },
            { icon: "👥", text: "Build and moderate local mom groups" },
            { icon: "🛡️", text: "Enforce community safety guidelines" },
            { icon: "📊", text: "Access community analytics dashboard" },
            { icon: "⭐", text: "Verified admin badge on your profile" },
          ].map((perk, i) => (
            <div key={i} style={styles.perkRow}>
              <span style={{ fontSize: 20 }}>{perk.icon}</span>
              <span style={styles.perkText}>{perk.text}</span>
            </div>
          ))}
        </div>

        {/* Eligibility Checklist */}
        <div style={{ background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D", marginBottom: 14 }}>Eligibility Checklist</p>
          {requirements.map(req => (
            <div
              key={req.id}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}
              onClick={() => setAgreed(a => ({ ...a, [req.id]: !a[req.id] }))}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                border: agreed[req.id] ? "none" : "2px solid #E8E8E8",
                background: agreed[req.id] ? "#6B2C3B" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease",
              }}>
                {agreed[req.id] && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <span style={{ fontSize: 13, color: "#444", lineHeight: 1.4 }}>{req.label}</span>
            </div>
          ))}
        </div>

        {/* Application Form */}
        <div style={{ ...styles.onboardFields, marginTop: 4 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D", marginBottom: 4 }}>Your Application</p>
          <input style={styles.input} placeholder="Full legal name (for background check)" value={fullName} onChange={e => setFullName(e.target.value)} />
          <input style={styles.input} placeholder="Your area / neighborhood / zip code" value={area} onChange={e => setArea(e.target.value)} />
          <input style={styles.input} placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
          <textarea style={{ ...styles.input, minHeight: 100, fontFamily: "inherit" }} placeholder="Why do you want to be an admin? Tell us about your involvement with local families and any relevant experience..." value={motivation} onChange={e => setMotivation(e.target.value)} />
          <select style={styles.input} value={networkSize} onChange={e => setNetworkSize(e.target.value)}>
            <option value="">How many local moms do you connect with?</option>
            <option>1-5 moms</option>
            <option>5-15 moms</option>
            <option>15-30 moms</option>
            <option>30+ moms</option>
          </select>
          <select style={styles.input} value={experience} onChange={e => setExperience(e.target.value)}>
            <option value="">Do you have experience organizing group events?</option>
            <option>No, but I'm eager to learn</option>
            <option>Some informal experience</option>
            <option>Yes, regularly</option>
            <option>Yes, professionally</option>
          </select>
          <input style={styles.input} placeholder="Social media or community references (optional)" value={references} onChange={e => setReferences(e.target.value)} />
        </div>

        {error && <p style={{ fontSize: 13, color: "#E53935", textAlign: "center", marginTop: 8 }}>{error}</p>}

        <button
          style={{
            ...styles.primaryBtn,
            width: "100%", marginTop: 20,
            opacity: allAgreed && !submitting ? 1 : 0.4,
            cursor: allAgreed && !submitting ? "pointer" : "not-allowed",
          }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Application for Review"}
        </button>
        {!allAgreed && (
          <p style={{ fontSize: 12, color: "#ACACAC", textAlign: "center", marginTop: 8 }}>Please check all eligibility requirements above to submit</p>
        )}
        <p style={{ ...styles.aboutFootnote, marginTop: 8 }}>Applications are reviewed within 3–5 business days. Approved admins will be contacted for a brief interview before activation.</p>
      </div>
    </div>
  );
}

// ─── Groups Tab ───
function GroupsTab({ groups, onGroupSelect, onCreateGroup, onAdminApply, joinedGroups, pendingJoins, userRole }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [inviteCodeSearch, setInviteCodeSearch] = useState("");
  const [foundGroup, setFoundGroup] = useState(null);

  const filtered = (groups || []).filter(g => {
    // Hide hidden groups from non-members
    if (g.isHidden && !joinedGroups.includes(g.id)) return false;
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.area.toLowerCase().includes(search.toLowerCase());
    if (filter === "my") return matchesSearch && joinedGroups.includes(g.id);
    if (filter === "private") return matchesSearch && g.isPrivate;
    if (filter === "public") return matchesSearch && !g.isPrivate;
    return matchesSearch;
  });

  return (
    <div style={styles.tabContent}>
      <div style={styles.homeHeader}>
        <h1 style={styles.pageTitle}>Groups</h1>
        {(userRole === 'admin' || userRole === 'founder') ? (
          <button style={styles.secondaryBtn} onClick={onCreateGroup}>+ Create Squad</button>
        ) : (
          <button style={{ ...styles.secondaryBtn, background: "#FAF0F2", color: "#6B2C3B", border: "1.5px solid #6B2C3B" }} onClick={onAdminApply}>👑 Become an Admin</button>
        )}
      </div>

      <div style={styles.searchBar}>
        {Icons.search}
        <input style={styles.searchInput} placeholder="Search groups by name or area..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Invite code search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", fontSize: 14, fontFamily: "inherit", background: "white", letterSpacing: 2, textTransform: "uppercase" }}
          placeholder="Have an invite code?"
          value={inviteCodeSearch}
          onChange={e => { setInviteCodeSearch(e.target.value.toUpperCase()); setFoundGroup(null); }}
          maxLength={6}
        />
        <button
          style={{ padding: "10px 16px", borderRadius: 10, background: "#6B2C3B", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: inviteCodeSearch.length < 4 ? 0.5 : 1 }}
          disabled={inviteCodeSearch.length < 4}
          onClick={() => {
            const match = (groups || []).find(g => g.inviteCode && g.inviteCode.toUpperCase() === inviteCodeSearch.trim().toUpperCase());
            if (match) { setFoundGroup(match); }
            else { alert('No group found with that code. Check the code and try again.'); }
          }}
        >Find</button>
      </div>
      {foundGroup && (
        <div style={{ background: "#E8F5E9", borderRadius: 12, padding: 14, marginBottom: 12, cursor: "pointer" }} onClick={() => { onGroupSelect(foundGroup); setFoundGroup(null); setInviteCodeSearch(""); }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24 }}>{foundGroup.emoji}</span>
            <div>
              <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{foundGroup.name}</strong>
              <p style={{ fontSize: 12, color: "#888" }}>{foundGroup.desc?.slice(0, 60)}{foundGroup.desc?.length > 60 ? '...' : ''}</p>
              <p style={{ fontSize: 11, color: "#2E7D32", fontWeight: 600, marginTop: 4 }}>Tap to view and join →</p>
            </div>
          </div>
        </div>
      )}

      <div style={styles.filterRow}>
        {[
          { id: "all", label: "All Groups" },
          { id: "my", label: "My Groups" },
          { id: "private", label: "🔒 Private" },
          { id: "public", label: "🌐 Public" },
        ].map(f => (
          <button key={f.id} style={{ ...styles.dayChip, ...(filter === f.id ? styles.dayChipActive : {}) }} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 40 }}>👥</span>
            <p style={styles.emptyText}>No groups match your search</p>
          </div>
        ) : (
          filtered.map((group, i) => {
            const isMember = joinedGroups.includes(group.id);
            const isPending = pendingJoins.includes(group.id);
            return (
              <div key={group.id} style={{ ...styles.eventCard, animationDelay: `${i * 0.05}s` }} onClick={() => onGroupSelect(group)}>
                <div style={{ ...styles.eventAccent, background: group.color }} />
                <div style={styles.eventBody}>
                  <div style={styles.eventTop}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 20 }}>{group.emoji}</span>
                      {group.isPrivate ? (
                        <span style={gs.privBadge}>{Icons.lock} Private</span>
                      ) : (
                        <span style={gs.pubBadge}>{Icons.globe} Public</span>
                      )}
                    </div>
                    {isMember && <span style={styles.joinedBadge}>{Icons.check} Member</span>}
                    {isPending && <span style={gs.pendingBadge}>⏳ Pending</span>}
                  </div>
                  <h3 style={styles.eventTitle}>{group.name}</h3>
                  <p style={{ fontSize: 12, color: "#888", marginBottom: 6, lineHeight: 1.3 }}>{group.desc}</p>
                  <div style={styles.eventMeta}>
                    <span style={styles.metaItem}>{Icons.location} {group.area}</span>
                    <span style={styles.metaItem}>{Icons.users} {group.members} members</span>
                  </div>
                  <div style={styles.eventBottom}>
                    <span style={styles.hostName}>Admin: {group.admin}</span>
                    <span style={{ fontSize: 11, color: "#aaa" }}>{group.recentActivity}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Discover Moms link */}
      <div style={{ ...styles.adminApplyBanner, marginTop: 16, border: "1.5px solid #FAF0F2" }}>
        <div style={styles.adminApplyLeft}>
          <div style={{ ...styles.adminApplyIconWrap, background: "#FAF0F2" }}>
            {Icons.users}
          </div>
          <div>
            <h3 style={styles.adminApplyTitle}>Looking for individual moms?</h3>
            <p style={styles.adminApplyDesc}>Browse and connect with verified moms in your area on the Discover page.</p>
          </div>
        </div>
      </div>
      <PageFooter />
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Group Detail Screen ───
function GroupDetailScreen({ group, onBack, joinedGroups, setJoinedGroups, pendingJoins, setPendingJoins, groupRequests, setGroupRequests, user, onJoinRequest, onApproveRequest, onDenyRequest, onCreateEvent, onSaveAvailability, loadGroupAvailability, loadMyAvailability, onProposeMeetup, loadMeetupProposals, onVote, events, joinedEvents, onEventSelect, onViewProfile, fadeIn }) {
  const isMember = joinedGroups.includes(group.id);
  const isPending = pendingJoins.includes(group.id);
  const isAdmin = user ? (group.adminId === user.id || group.admin === user.full_name) : group.admin === "Sarah Mitchell";
  const [activeSection, setActiveSection] = useState(isMember ? "feed" : "about");

  const bodyRef = useRef(null);

  // Scroll to top on mount
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, []);

  // Switch to feed tab when membership updates
  useEffect(() => {
    if (isMember && activeSection === "about") setActiveSection("feed");
  }, [isMember]);
  const [requestMessage, setRequestMessage] = useState("");
  const [joinAnswers, setJoinAnswers] = useState({});
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSent, setJoinSent] = useState(false);
  const [showPostPlaydate, setShowPostPlaydate] = useState(false);
  const [showProposeMeetup, setShowProposeMeetup] = useState(false);
  const [showInlinePoll, setShowInlinePoll] = useState(false);
  const [groupPhotos, setGroupPhotos] = useState([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [editGroupName, setEditGroupName] = useState(group.name || "");
  const [editGroupDesc, setEditGroupDesc] = useState(group.desc || "");
  const [editGroupRules, setEditGroupRules] = useState((group.rules || []).join("\n"));
  const [editGroupAge, setEditGroupAge] = useState(group.ages || "All Ages");
  const [editGroupPrivate, setEditGroupPrivate] = useState(group.isPrivate);
  const [editGroupJoinQs, setEditGroupJoinQs] = useState((group.joinQuestions || []).join("\n"));
  const [acceptingMembers, setAcceptingMembers] = useState(group.acceptingMembers !== false);
  const [isHidden, setIsHidden] = useState(group.isHidden || false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [pdTitle, setPdTitle] = useState("");
  const [pdLocation, setPdLocation] = useState("");
  const [pdDate, setPdDate] = useState("");
  const [pdTime, setPdTime] = useState("");
  const [pdMax, setPdMax] = useState("");
  const [pdDesc, setPdDesc] = useState("");
  const [pdSubmitting, setPdSubmitting] = useState(false);
  const [mtTitle, setMtTitle] = useState("");
  const [mtDesc, setMtDesc] = useState("");
  const [mtDay, setMtDay] = useState("");
  const [mtSubmitting, setMtSubmitting] = useState(false);
  const [ipTitle, setIpTitle] = useState("");
  const [ipDay, setIpDay] = useState("");
  const [ipTime, setIpTime] = useState("");
  const [ipLocations, setIpLocations] = useState([""]);
  const [ipSubmitting, setIpSubmitting] = useState(false);
  const [meetups, setMeetups] = useState([]);
  const [meetupsLoaded, setMeetupsLoaded] = useState(false);
  const [myVotes, setMyVotes] = useState({});
  const [supaRequests, setSupaRequests] = useState([]);
  const [myAvailability, setMyAvailability] = useState({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
  });
  const [myAvailNote, setMyAvailNote] = useState("");

  // Load group photos
  useEffect(() => {
    if (!group.fromSupabase) return;
    supabase.storage.from('avatars').list(`groups/${group.id}`, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const urls = data.map(f => {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`groups/${group.id}/${f.name}`);
            return { name: f.name, url: publicUrl, created: f.created_at };
          });
          setGroupPhotos(urls);
        }
      });
  }, [group.id, group.fromSupabase]);

  const handlePhotoSelect = (file) => {
    if (!file) return;
    setPendingPhoto(file);
    setPendingPhotoPreview(URL.createObjectURL(file));
    setPhotoCaption("");
  };

  const uploadGroupPhoto = async () => {
    if (!user || !pendingPhoto) return;
    setPhotoUploading(true);
    const file = pendingPhoto;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `groups/${group.id}/${fileName}`;

    const { error } = await supabase.storage.from('avatars').upload(filePath, file);
    if (error) { alert('Error uploading photo: ' + error.message); setPhotoUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setGroupPhotos(prev => [{ name: fileName, url: publicUrl, caption: photoCaption.trim(), postedBy: user.full_name || 'A mom', created: new Date().toISOString() }, ...prev]);
    setPhotoUploading(false);
    setPendingPhoto(null);
    setPendingPhotoPreview(null);
    setPhotoCaption("");
  };

  // Load pending requests from Supabase for admin
  useEffect(() => {
    if (!isAdmin || !group.fromSupabase) return;
    supabase.from('join_requests')
      .select('*, users!user_id(full_name, bio, kids, area)')
      .eq('group_id', group.id)
      .eq('status', 'pending')
      .then(({ data }) => {
        if (data) setSupaRequests(data);
      });
  }, [isAdmin, group.id, group.fromSupabase]);

  // Load meetup proposals from Supabase
  useEffect(() => {
    if (!group.fromSupabase || !loadMeetupProposals || meetupsLoaded) return;
    loadMeetupProposals(group.id).then(data => {
      setMeetups(data);
      // Extract my existing votes
      if (user && data.length > 0) {
        const votes = {};
        data.forEach(p => {
          (p.votes || []).forEach(v => {
            if (v.user_id === user.id) {
              votes[`${p.id}_${v.vote_type}`] = v.option_index;
            }
          });
        });
        setMyVotes(votes);
      }
      setMeetupsLoaded(true);
    });
  }, [group.fromSupabase, group.id, meetupsLoaded]);

  // Merge sample pending requests with Supabase requests
  const approvedRequests = groupRequests[group.id]?.approved || [];
  const deniedRequests = groupRequests[group.id]?.denied || [];
  const samplePending = (group.pendingRequests || []).filter(
    r => !approvedRequests.includes(r.id) && !deniedRequests.includes(r.id)
  );
  // Resolve zip codes to city, state
  const [resolvedAreas, setResolvedAreas] = useState({});
  useEffect(() => {
    const resolveAreas = async () => {
      for (const r of supaRequests) {
        const area = r.users?.area || '';
        if (!area || resolvedAreas[area]) continue;
        const isZip = /^\d{5}$/.test(area.trim());
        if (isZip) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${area.trim()}&countrycodes=us&limit=1&addressdetails=1`);
            const data = await res.json();
            if (data.length > 0 && data[0].address) {
              const addr = data[0].address;
              const city = addr.city || addr.town || addr.village || addr.hamlet || '';
              const state = addr.state || '';
              if (city || state) {
                setResolvedAreas(prev => ({ ...prev, [area]: `${city}${city && state ? ', ' : ''}${state}` }));
              }
            }
          } catch {}
        }
      }
    };
    if (supaRequests.length > 0) resolveAreas();
  }, [supaRequests]);

  const pending = group.fromSupabase
    ? supaRequests.map(r => {
        const userName = r.users?.full_name || 'A mom';
        const kids = r.users?.kids || [];
        const rawArea = r.users?.area || '';
        return {
          id: r.id,
          userId: r.user_id,
          name: userName,
          avatar: userName.split(' ').map(w => w[0]).join(''),
          bio: r.users?.bio || r.message || '',
          area: resolvedAreas[rawArea] || rawArea,
          ages: kids.map(k => { const a = formatAge(k.birthday); const g = k.gender === "Girl" ? "👧" : k.gender === "Boy" ? "👦" : ""; const ageLabel = a ? (a.includes('mo') || a === 'Newborn' ? a : a + ' yrs') : ''; return `${g} ${ageLabel || k.gender || ''}`.trim(); }).filter(Boolean).join(', ') || '',
          requestedAt: new Date(r.created_at).toLocaleDateString(),
          fromSupabase: true,
        };
      })
    : samplePending;

  const handleApprove = async (reqId) => {
    const req = pending.find(r => r.id === reqId);
    if (req?.fromSupabase && onApproveRequest) {
      await onApproveRequest(reqId, group.id, req.userId);
      setSupaRequests(prev => prev.filter(r => r.id !== reqId));
    } else {
      setGroupRequests(prev => ({
        ...prev,
        [group.id]: {
          ...prev[group.id],
          approved: [...(prev[group.id]?.approved || []), reqId],
        }
      }));
    }
  };

  const handleDeny = async (reqId) => {
    const req = pending.find(r => r.id === reqId);
    if (req?.fromSupabase && onDenyRequest) {
      await onDenyRequest(reqId);
      setSupaRequests(prev => prev.filter(r => r.id !== reqId));
    } else {
      setGroupRequests(prev => ({
        ...prev,
        [group.id]: {
          ...prev[group.id],
          denied: [...(prev[group.id]?.denied || []), reqId],
        }
      }));
    }
  };

  const handleJoinRequest = async () => {
    if (group.isPrivate) {
      if (group.fromSupabase && onJoinRequest) {
        // Combine question answers with free text message
        const answerParts = (group.joinQuestions || []).map((q, i) => joinAnswers[i] ? `Q: ${q}\nA: ${joinAnswers[i]}` : '').filter(Boolean);
        const fullMessage = [...answerParts, requestMessage.trim()].filter(Boolean).join('\n\n');
        await onJoinRequest(group.id, fullMessage);
        setJoinAnswers({});
      } else {
        setPendingJoins(p => [...p, group.id]);
      }
      setJoinSent(true);
      setTimeout(() => setShowJoinModal(false), 1500);
    } else {
      if (group.fromSupabase && onJoinRequest) {
        await onJoinRequest(group.id, '');
        // For public groups, also add to group_members immediately
        if (user) {
          await supabase.from('join_requests').update({ status: 'approved' }).eq('group_id', group.id).eq('user_id', user.id);
          await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'member' });
        }
      }
      setJoinedGroups(j => [...j, group.id]);
    }
  };

  const handleLeave = () => {
    setJoinedGroups(j => j.filter(id => id !== group.id));
  };

  // Join request modal for private groups
  const joinModal = showJoinModal && (
    <div style={gs.modalOverlay} onClick={() => !joinSent && setShowJoinModal(false)}>
      <div style={gs.modal} onClick={e => e.stopPropagation()}>
        {joinSent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2D2D2D", marginBottom: 8 }}>Request Sent!</h3>
            <p style={{ fontSize: 13, color: "#888" }}>The group admin will review your request. You'll be notified when approved.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 24 }}>{group.emoji}</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D" }}>Request to Join</h3>
                <p style={{ fontSize: 12, color: "#888" }}>{group.name}</p>
              </div>
            </div>
            <div style={{ background: "#FFF8E1", borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: "#E65100" }}>{Icons.lock} This is a private group. The admin must approve your request before you can see members, events, or messages.</p>
            </div>
            {/* Show user's kids info */}
            {user?.kids && user.kids.length > 0 && (
              <div style={{ background: "#FAF0F2", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#6B2C3B", marginBottom: 6 }}>Your kids (visible to admin):</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {user.kids.filter(k => k.gender || k.birthday).map((kid, i) => {
                    const age = formatAge(kid.birthday);
                    const icon = kid.gender === "Girl" ? "👧" : kid.gender === "Boy" ? "👦" : "👶";
                    return <span key={i} style={{ fontSize: 12, color: "#6B2C3B", background: "white", padding: "4px 10px", borderRadius: 50 }}>{icon} {kid.gender || "Child"}{age ? ` — ${age} yrs` : ''}</span>;
                  })}
                </div>
              </div>
            )}
            {/* Admin's join questions */}
            {group.joinQuestions && group.joinQuestions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                {group.joinQuestions.map((q, i) => (
                  <div key={i}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginBottom: 4 }}>{q}</p>
                    <input
                      style={styles.input}
                      placeholder="Your answer..."
                      value={joinAnswers[i] || ''}
                      onChange={e => setJoinAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginBottom: 6 }}>Anything else you'd like to share:</p>
            <textarea
              style={{ ...styles.input, minHeight: 60, fontFamily: "inherit", marginBottom: 12 }}
              placeholder="Hi! I'd love to join because... (optional)"
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
            />
            <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>The admin will see your profile, kids' info, and your answers.</p>
            <button style={{ ...styles.primaryBtn, marginTop: 0 }} onClick={handleJoinRequest}>
              Send Join Request
            </button>
            <button style={styles.textBtn} onClick={() => setShowJoinModal(false)}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.detailScreen}>
      {joinModal}
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
        <h2 style={styles.detailTitle}>{group.emoji} {group.name}</h2>
        <div style={{ width: 40 }} />
      </div>
      <div ref={bodyRef} style={styles.detailBody}>
        {/* Group Banner — tappable to show rules */}
        <div style={{ ...styles.eventBanner, background: `linear-gradient(135deg, ${group.color}18, ${group.color}35)`, cursor: "pointer" }} onClick={() => setShowRules(!showRules)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {group.isPrivate ? (
              <span style={{ ...gs.privBadge, fontSize: 12, padding: "4px 12px" }}>{Icons.lock} Private</span>
            ) : (
              <span style={{ ...gs.pubBadge, fontSize: 12, padding: "4px 12px" }}>{Icons.globe} Public</span>
            )}
            <span style={styles.ageBadge}>{group.ages}</span>
            {acceptingMembers ? (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#2E7D32", background: "#E8F5E9", padding: "3px 10px", borderRadius: 50 }}>✅ Accepting Members</span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#C62828", background: "#FFEBEE", padding: "3px 10px", borderRadius: 50 }}>🚫 Closed</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#666", lineHeight: 1.4, marginBottom: 8 }}>{group.desc}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={styles.bannerMeta}>
              {group.area && <span>{Icons.location} {group.area}</span>}
              <span>{Icons.users} {group.members} members</span>
            </div>
            <span style={{ fontSize: 11, color: "#6B2C3B", fontWeight: 600 }}>{showRules ? "Hide rules ▲" : "View rules ▼"}</span>
          </div>
        </div>

        {/* Rules dropdown */}
        {showRules && (
          <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D" }}>Group Rules</h4>
              {isAdmin && group.fromSupabase && <button style={{ fontSize: 12, color: "#6B2C3B", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }} onClick={() => { setShowRules(false); setEditingGroup(true); setTimeout(() => document.getElementById('edit-group-form')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>✏️ Edit</button>}
            </div>
            {(group.rules || []).length === 0 ? (
              <p style={{ fontSize: 13, color: "#888" }}>No rules set yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(group.rules || []).map((rule, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: group.color, background: `${group.color}22`, width: 20, height: 20, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: "#444", lineHeight: 1.4 }}>{rule}</span>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 11, color: "#bbb", marginTop: 8 }}>Admin: {group.admin}</p>
          </div>
        )}

        {/* Invite code for admins — only when group is hidden */}
        {isAdmin && group.inviteCode && isHidden && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAF0F2", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6B2C3B", fontWeight: 600 }}>Invite Code:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#6B2C3B", letterSpacing: 3, fontFamily: "monospace" }}>{group.inviteCode}</span>
            </div>
            <button style={{ background: "#6B2C3B", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(group.inviteCode); const btn = e.target; btn.textContent = "Copied!"; setTimeout(() => { btn.textContent = "Copy"; }, 1500); }}>Copy</button>
          </div>
        )}

        {/* Inline edit group form */}
        {editingGroup && isAdmin && (
          <div id="edit-group-form" style={{ background: "#FAF0F2", borderRadius: 12, padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D", marginBottom: 10 }}>Edit Group</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={styles.input} placeholder="Group name" value={editGroupName} onChange={e => setEditGroupName(e.target.value)} />
              <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} placeholder="Description" value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)} />
              <select style={styles.input} value={editGroupAge} onChange={e => setEditGroupAge(e.target.value)}>
                <option>All Ages</option>
                <option>0-1 years</option>
                <option>1-3 years</option>
                <option>3-5 years</option>
                <option>5-8 years</option>
                <option>8+ years</option>
              </select>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "white", borderRadius: 12, border: "1.5px solid #E8E8E8" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>Accepting New Members</p>
                  <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{acceptingMembers ? "New members can request to join" : "Group is closed to new members"}</p>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", background: acceptingMembers ? "#4CAF50" : "#E8E8E8", transition: "background 0.2s ease" }} onClick={() => setAcceptingMembers(!acceptingMembers)}>
                  <div style={{ width: 20, height: 20, borderRadius: 10, background: "white", position: "absolute", top: 2, transition: "transform 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transform: acceptingMembers ? "translateX(20px)" : "translateX(2px)" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "white", borderRadius: 12, border: "1.5px solid #E8E8E8" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>Hidden Group</p>
                  <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{isHidden ? "Only findable by invite code" : "Visible to everyone in Groups tab"}</p>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", background: isHidden ? "#6B2C3B" : "#E8E8E8", transition: "background 0.2s ease" }} onClick={() => setIsHidden(!isHidden)}>
                  <div style={{ width: 20, height: 20, borderRadius: 10, background: "white", position: "absolute", top: 2, transition: "transform 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transform: isHidden ? "translateX(20px)" : "translateX(2px)" }} />
                </div>
              </div>
              {group.inviteCode && (
                <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1.5px solid #E8E8E8" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginBottom: 4 }}>Group Invite Code</p>
                  <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Share this code so people can find and join your group.</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#6B2C3B", letterSpacing: 3, fontFamily: "monospace", background: "#FAF0F2", padding: "8px 16px", borderRadius: 8 }}>{group.inviteCode}</span>
                    <button style={{ background: "none", border: "1px solid #6B2C3B", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#6B2C3B", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onClick={() => { navigator.clipboard?.writeText(group.inviteCode); alert('Invite code copied!'); }}>Copy</button>
                  </div>
                </div>
              )}
              <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>Rules (one per line)</p>
              <textarea style={{ ...styles.input, minHeight: 60, fontFamily: "inherit" }} placeholder="Be kind&#10;No spam" value={editGroupRules} onChange={e => setEditGroupRules(e.target.value)} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>Join Questions (one per line)</p>
              <textarea style={{ ...styles.input, minHeight: 60, fontFamily: "inherit" }} placeholder="What area are you in?&#10;How old are your kids?" value={editGroupJoinQs} onChange={e => setEditGroupJoinQs(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{ ...styles.primaryBtn, flex: 1, opacity: savingGroup ? 0.6 : 1 }}
                  disabled={savingGroup}
                  onClick={async () => {
                    setSavingGroup(true);
                    const updates = {
                      name: editGroupName.trim(),
                      description: editGroupDesc.trim(),
                      age_group: editGroupAge,
                      rules: editGroupRules.trim() ? editGroupRules.trim().split('\n').filter(Boolean) : [],
                      join_questions: editGroupJoinQs.trim() ? editGroupJoinQs.trim().split('\n').filter(Boolean) : [],
                      accepting_members: acceptingMembers,
                      is_hidden: isHidden,
                    };
                    const { error } = await supabase.from('groups').update(updates).eq('id', group.id);
                    if (error) { alert('Error saving: ' + error.message); setSavingGroup(false); return; }
                    group.name = updates.name;
                    group.desc = updates.description;
                    group.ages = updates.age_group;
                    group.rules = updates.rules;
                    group.joinQuestions = updates.join_questions;
                    group.acceptingMembers = updates.accepting_members;
                    group.isHidden = updates.is_hidden;
                    setSavingGroup(false);
                    setEditingGroup(false);
                  }}
                >
                  {savingGroup ? "Saving..." : "Save Changes"}
                </button>
                <button style={{ ...styles.secondaryBtn, flex: 1 }} onClick={() => setEditingGroup(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Member count + View Members */}
        {isMember && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "#FAF0F2", border: "none", fontSize: 13, fontWeight: 600, color: "#6B2C3B", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              onClick={() => { setShowMembersList(!showMembersList); if (!membersLoaded) setMembersLoaded(false); }}
            >
              👥 {group.members} Members {showMembersList ? "▲" : "▼"}
            </button>
            {!isAdmin && (
              <button style={{ padding: "10px 14px", borderRadius: 10, background: "#FFF5F5", border: "none", fontSize: 13, fontWeight: 600, color: "#C62828", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onClick={handleLeave}>Leave</button>
            )}
            {isAdmin && group.fromSupabase && (
              <button style={{ padding: "10px 14px", borderRadius: 10, background: "#FAF0F2", border: "none", fontSize: 12, fontWeight: 600, color: "#6B2C3B", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onClick={() => { setEditingGroup(true); setTimeout(() => document.getElementById('edit-group-form')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>✏️ Edit</button>
            )}
          </div>
        )}

        {/* Members list dropdown */}
        {showMembersList && isMember && (
          <MembersTab group={group} user={user} isAdmin={isAdmin} onViewProfile={onViewProfile} membersLoaded={membersLoaded} setMembersLoaded={setMembersLoaded} memberList={memberList} setMemberList={setMemberList} />
        )}

        {/* Join / Pending for non-members */}
        {!isMember && !isPending && acceptingMembers && (
          <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => group.isPrivate ? setShowJoinModal(true) : handleJoinRequest()}>
            {group.isPrivate ? "🔒 Request to Join" : "Join Group"}
          </button>
        )}
        {!isMember && !isPending && !acceptingMembers && (
          <div style={{ background: "#FFEBEE", borderRadius: 12, padding: 14, textAlign: "center" }}>
            <span style={{ fontSize: 24 }}>🚫</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#C62828", marginTop: 6 }}>Not Accepting New Members</p>
            <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>This group is currently closed to new members.</p>
          </div>
        )}
        {isPending && (
          <div style={gs.pendingCard}>
            <span style={{ fontSize: 24 }}>⏳</span>
            <div>
              <strong style={{ fontSize: 14, color: "#E65100", display: "block" }}>Request Pending</strong>
              <span style={{ fontSize: 12, color: "#888" }}>The admin is reviewing your request.</span>
            </div>
          </div>
        )}

        {/* Action buttons for members */}
        {isMember && (
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...gs.composeAction, flex: 1, padding: "12px 0", textAlign: "center" }} onClick={() => { setShowPostPlaydate(true); setShowProposeMeetup(false); setShowInlinePoll(false); setTimeout(() => document.getElementById('playdate-form')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>📅 Playdate</button>
            <button style={{ ...gs.composeAction, flex: 1, padding: "12px 0", textAlign: "center" }} onClick={() => { setShowProposeMeetup(true); setShowPostPlaydate(false); setShowInlinePoll(false); setTimeout(() => document.getElementById('meetup-form')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>📍 Meetup</button>
            <label style={{ ...gs.composeAction, flex: 1, padding: "12px 0", textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: photoUploading ? 0.5 : 1 }}>
              {photoUploading ? "..." : "📸 Photo"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhotoSelect(file); }} />
            </label>
            <button style={{ ...gs.composeAction, flex: 1, padding: "12px 0", textAlign: "center" }} onClick={() => { setShowInlinePoll(true); setShowPostPlaydate(false); setShowProposeMeetup(false); setTimeout(() => document.getElementById('inline-poll-form')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>🗳️ Poll</button>
          </div>
        )}

        {/* Photo preview + caption form */}
        {pendingPhotoPreview && (
          <div style={gs.inlineForm}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong style={{ fontSize: 14, color: "#2D2D2D" }}>📸 Post a Photo</strong>
              <button style={{ background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer" }} onClick={() => { setPendingPhoto(null); setPendingPhotoPreview(null); setPhotoCaption(""); }}>✕</button>
            </div>
            <img src={pendingPhotoPreview} alt="Preview" style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 12, marginBottom: 10 }} />
            <input
              style={gs.formInput}
              placeholder="Add a caption..."
              value={photoCaption}
              onChange={e => setPhotoCaption(e.target.value)}
            />
            <button
              style={{ ...styles.primaryBtn, marginTop: 8, opacity: photoUploading ? 0.6 : 1 }}
              disabled={photoUploading}
              onClick={uploadGroupPhoto}
            >
              {photoUploading ? "Uploading..." : "Post Photo to Group 📸"}
            </button>
          </div>
        )}

        {/* Post Playdate inline form */}
        {isMember && showPostPlaydate && (
          <div id="playdate-form" style={gs.inlineForm}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong style={{ fontSize: 14, color: "#2D2D2D" }}>📅 Post a Playdate</strong>
              <button style={{ background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer" }} onClick={() => setShowPostPlaydate(false)}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={gs.formInput} placeholder="Playdate title (e.g., Park Day!)" value={pdTitle} onChange={e => setPdTitle(e.target.value)} />
              <AddressInput inputStyle={gs.formInput} placeholder="Search for a location..." value={pdLocation} onChange={setPdLocation} userArea={user?.area || group.area} />
              <p style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Date</p>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select style={{ ...gs.formInput, flex: 2 }} value={pdDate.split('/')[0] || ''} onChange={e => { const parts = pdDate.split('/'); setPdDate(`${e.target.value}/${parts[1] || ''}/${new Date().getFullYear()}`); }}>
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={i} value={m}>{m}</option>)}
                </select>
                <select style={{ ...gs.formInput, flex: 1 }} value={pdDate.split('/')[1] || ''} onChange={e => { const parts = pdDate.split('/'); setPdDate(`${parts[0] || ''}/${e.target.value}/${new Date().getFullYear()}`); }}>
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D", padding: "0 8px" }}>{new Date().getFullYear()}</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Time</p>
              <select style={gs.formInput} value={pdTime} onChange={e => setPdTime(e.target.value)}>
                <option value="">Select a time</option>
                {["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input style={gs.formInput} placeholder="Max kids / families" type="number" value={pdMax} onChange={e => setPdMax(e.target.value)} />
              <textarea style={{ ...gs.formInput, minHeight: 60, resize: "vertical" }} placeholder="Details — what to bring, what to expect..." value={pdDesc} onChange={e => setPdDesc(e.target.value)} />
              <button
                style={{ ...styles.primaryBtn, marginTop: 4, opacity: pdSubmitting ? 0.6 : 1 }}
                disabled={pdSubmitting}
                onClick={async () => {
                  if (!pdTitle.trim()) return;
                  setPdSubmitting(true);
                  if (onCreateEvent) {
                    const result = await onCreateEvent({
                      title: pdTitle.trim(),
                      location: pdLocation.trim(),
                      date: pdDate.trim() || "TBD",
                      time: pdTime.trim() || "TBD",
                      ages: group.ages || "All Ages",
                      maxAttendees: parseInt(pdMax) || 15,
                      description: pdDesc.trim(),
                      groupId: group.fromSupabase ? group.id : null,
                    });
                    if (result?.error) { setPdSubmitting(false); alert('Error creating playdate: ' + result.error); return; }
                  }
                  setPdSubmitting(false);
                  setPdTitle(""); setPdLocation(""); setPdDate(""); setPdTime(""); setPdMax(""); setPdDesc("");
                  setShowPostPlaydate(false);
                }}
              >
                {pdSubmitting ? "Posting..." : "Post Playdate to Group 🎉"}
              </button>
            </div>
          </div>
        )}

        {/* Propose Meetup inline form */}
        {isMember && showProposeMeetup && (
          <div id="meetup-form" style={gs.inlineForm}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong style={{ fontSize: 14, color: "#2D2D2D" }}>📍 Propose a Meetup</strong>
              <button style={{ background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer" }} onClick={() => setShowProposeMeetup(false)}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Pick a day and let the group vote on the best time!</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={gs.formInput} placeholder="What's the meetup? (e.g., Park playdate)" value={mtTitle} onChange={e => setMtTitle(e.target.value)} />
              <textarea style={{ ...gs.formInput, minHeight: 50, resize: "vertical" }} placeholder="Any details or context..." value={mtDesc} onChange={e => setMtDesc(e.target.value)} />
              <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginTop: 4 }}>Pick a day</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                  <button key={d} style={{ padding: "8px 14px", borderRadius: 50, fontSize: 13, cursor: "pointer", border: mtDay === d ? "2px solid #6B2C3B" : "1.5px solid #E8E8E8", background: mtDay === d ? "#FAF0F2" : "white", color: mtDay === d ? "#6B2C3B" : "#666", fontWeight: mtDay === d ? 600 : 400, fontFamily: "'DM Sans', sans-serif" }} onClick={() => setMtDay(d)}>{d}</button>
                ))}
              </div>
              <button
                style={{ ...styles.primaryBtn, marginTop: 4, opacity: mtSubmitting || !mtTitle.trim() || !mtDay ? 0.5 : 1 }}
                disabled={mtSubmitting || !mtTitle.trim() || !mtDay}
                onClick={async () => {
                  if (!mtTitle.trim() || !mtDay) return;
                  setMtSubmitting(true);
                  if (onProposeMeetup && group.fromSupabase) {
                    const TIMES = ["8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM"];
                    const result = await onProposeMeetup(group.id, {
                      title: mtTitle.trim(),
                      description: `${mtDesc.trim() ? mtDesc.trim() + ' — ' : ''}What time works best on ${mtDay}?`,
                      timeOptions: TIMES,
                      locationOptions: [],
                    });
                    if (result.data) {
                      setMeetups(prev => [{ ...result.data, votes: [] }, ...prev]);
                    }
                  }
                  setMtSubmitting(false);
                  setMtTitle(""); setMtDesc(""); setMtDay("");
                  setShowProposeMeetup(false);
                }}
              >
                {mtSubmitting ? "Proposing..." : "Post Poll — Let the Group Vote! 🗳️"}
              </button>
            </div>
          </div>
        )}

        {/* Inline Poll creation form */}
        {isMember && showInlinePoll && (
          <div id="inline-poll-form" style={gs.inlineForm}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong style={{ fontSize: 14, color: "#2D2D2D" }}>🗳️ Create a Poll</strong>
              <button style={{ background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer" }} onClick={() => setShowInlinePoll(false)}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={gs.formInput} placeholder="What's the occasion? (e.g., Park playdate)" value={ipTitle} onChange={e => setIpTitle(e.target.value)} />
              <p style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Pick a day</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                  <button key={d} style={{ padding: "8px 14px", borderRadius: 50, fontSize: 13, cursor: "pointer", border: ipDay === d ? "2px solid #6B2C3B" : "1.5px solid #E8E8E8", background: ipDay === d ? "#FAF0F2" : "white", color: ipDay === d ? "#6B2C3B" : "#666", fontWeight: ipDay === d ? 600 : 400, fontFamily: "'DM Sans', sans-serif" }} onClick={() => setIpDay(d)}>{d}</button>
                ))}
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Location options (optional)</p>
              {ipLocations.map((loc, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <AddressInput inputStyle={gs.formInput} placeholder={`Location option ${i + 1}...`} value={loc} onChange={val => setIpLocations(prev => prev.map((l, j) => j === i ? val : l))} userArea={user?.area || group.area} />
                  </div>
                  {ipLocations.length > 1 && <button style={{ background: "none", border: "none", fontSize: 18, color: "#E53935", cursor: "pointer", padding: 4 }} onClick={() => setIpLocations(prev => prev.filter((_, j) => j !== i))}>✕</button>}
                </div>
              ))}
              {ipLocations.length < 5 && (
                <button style={{ background: "none", border: "none", fontSize: 13, color: "#6B2C3B", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textAlign: "left", padding: 0 }} onClick={() => setIpLocations(prev => [...prev, ""])}>+ Add another location</button>
              )}
              <p style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Your proposed time</p>
              <select style={gs.formInput} value={ipTime} onChange={e => setIpTime(e.target.value)}>
                <option value="">Select your preferred time...</option>
                {["8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button
                style={{ ...styles.primaryBtn, marginTop: 4, opacity: ipSubmitting || !ipTitle.trim() || !ipDay ? 0.5 : 1 }}
                disabled={ipSubmitting || !ipTitle.trim() || !ipDay}
                onClick={async () => {
                  if (!ipTitle.trim() || !ipDay) return;
                  setIpSubmitting(true);
                  const locs = ipLocations.map(l => l.trim()).filter(Boolean);
                  const proposedLabel = ipTime ? `Proposed: ${ipTime}` : '';
                  const locationLabel = locs.length > 0 ? `📍 ${locs.length} location${locs.length > 1 ? 's' : ''}` : '';
                  const descParts = [proposedLabel, locationLabel].filter(Boolean).join(' | ');
                  const TIMES = ["8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM"];
                  if (onProposeMeetup && group.fromSupabase) {
                    const result = await onProposeMeetup(group.id, {
                      title: ipTitle.trim(),
                      description: `${descParts ? descParts + ' — ' : ''}What time works best on ${ipDay}?`,
                      timeOptions: TIMES,
                      locationOptions: locs,
                    });
                    if (result.data) {
                      if (ipTime && onVote) {
                        await onVote(result.data.id, 'time', ipTime);
                        setMeetups(prev => [{ ...result.data, votes: [{ user_id: user?.id, vote_type: 'time', option_index: ipTime }] }, ...prev]);
                      } else {
                        setMeetups(prev => [{ ...result.data, votes: [] }, ...prev]);
                      }
                    }
                  }
                  setIpSubmitting(false);
                  setIpTitle(""); setIpDay(""); setIpTime(""); setIpLocations([""]);
                  setShowInlinePoll(false);
                }}
              >
                {ipSubmitting ? "Creating..." : "Post Poll 🗳️"}
              </button>
            </div>
          </div>
        )}

        {/* Admin: Pending Requests (inline above feed) */}
        {isAdmin && group.fromSupabase && pending.length > 0 && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "#F57F17", marginBottom: 8 }}>📬 {pending.length} Pending Request{pending.length !== 1 ? 's' : ''}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pending.map(req => (
                <div key={req.id} style={gs.requestCard}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ ...styles.avatarSmall, background: group.color }}>{req.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{req.name}</strong>
                        <span style={styles.verifiedMomTag}>✓ Verified</span>
                      </div>
                      {req.area && <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {req.area}</p>}
                      {req.ages && <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Kids: {req.ages}</p>}
                      {req.bio && <p style={{ fontSize: 13, color: "#555", marginTop: 4, lineHeight: 1.4 }}>{req.bio}</p>}
                      <p style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>Requested {req.requestedAt}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button style={gs.approveBtn} onClick={() => handleApprove(req.id)}>
                      {Icons.check} Approve
                    </button>
                    <button style={gs.denyBtn} onClick={() => handleDeny(req.id)}>
                      Decline
                    </button>
                    <button style={gs.viewProfileBtn} onClick={() => onViewProfile && onViewProfile(req)}>
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {isAdmin && group.fromSupabase && !showDeleteGroup && (
          <button style={{ width: "100%", padding: "8px 0", borderRadius: 50, background: "none", border: "1px solid #ddd", color: "#C62828", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onClick={() => setShowDeleteGroup(true)}>Delete Group</button>
        )}
        {showDeleteGroup && (
          <div style={{ background: "#FFEBEE", borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#C62828", marginBottom: 4 }}>Are you sure?</p>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 12, lineHeight: 1.4 }}>All data will be permanently lost.</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginBottom: 6 }}>Enter your password:</p>
            <input type="password" style={{ ...styles.input, marginBottom: 8 }} placeholder="Password" value={deletePassword} onChange={e => { setDeletePassword(e.target.value); setDeleteError(null); }} />
            {deleteError && <p style={{ fontSize: 12, color: "#C62828", marginBottom: 8 }}>{deleteError}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "10px 0", borderRadius: 50, background: "#C62828", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", opacity: deletingGroup ? 0.6 : 1 }} disabled={deletingGroup} onClick={async () => {
                if (!deletePassword) { setDeleteError("Enter your password"); return; }
                setDeletingGroup(true); setDeleteError(null);
                const { error: authError } = await supabase.auth.signInWithPassword({ email: user?.email, password: deletePassword });
                if (authError) { setDeleteError("Incorrect password"); setDeletingGroup(false); return; }
                await supabase.from('votes').delete().in('proposal_id', (await supabase.from('meetup_proposals').select('id').eq('group_id', group.id)).data?.map(p => p.id) || []);
                await supabase.from('meetup_proposals').delete().eq('group_id', group.id);
                await supabase.from('join_requests').delete().eq('group_id', group.id);
                await supabase.from('notifications').delete().eq('group_id', group.id);
                await supabase.from('availability').delete().eq('group_id', group.id);
                await supabase.from('comments').delete().in('event_id', (await supabase.from('events').select('id').eq('group_id', group.id)).data?.map(e => e.id) || []);
                await supabase.from('event_rsvps').delete().in('event_id', (await supabase.from('events').select('id').eq('group_id', group.id)).data?.map(e => e.id) || []);
                await supabase.from('events').delete().eq('group_id', group.id);
                await supabase.from('group_members').delete().eq('group_id', group.id);
                await supabase.from('groups').delete().eq('id', group.id);
                setDeletingGroup(false); onBack();
              }}>{deletingGroup ? "Deleting..." : "Yes, Delete"}</button>
              <button style={{ flex: 1, padding: "10px 0", borderRadius: 50, background: "white", color: "#666", fontSize: 13, fontWeight: 600, border: "1.5px solid #ddd", cursor: "pointer" }} onClick={() => { setShowDeleteGroup(false); setDeletePassword(""); setDeleteError(null); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── GROUP FEED: Playdates, Polls, Photos ── */}
        {isMember && (() => {
          const groupEvents = (events || []).filter(e => e.groupId === group.id);
          const activePolls = (meetups || []).filter(p => p.status === 'voting');
          const hasContent = groupEvents.length > 0 || activePolls.length > 0 || groupPhotos.length > 0;
          if (!hasContent) return null;

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D" }}>Group Feed</h4>

              {/* Upcoming Playdates */}
              {groupEvents.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D", marginBottom: 8 }}>📅 Upcoming Playdates</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {groupEvents.map(event => (
                      <div key={event.id} style={{ background: "white", borderRadius: 12, padding: 12, border: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => onEventSelect && onEventSelect(event)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{event.title}</strong>
                          <span style={{ fontSize: 11, color: "#6B2C3B", fontWeight: 600 }}>{formatEventDate(event.date)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#888" }}>
                          {event.location && <span>{Icons.location} {event.location.split(',')[0]}</span>}
                          {event.time && <span>{Icons.clock} {event.time}</span>}
                          <span>{Icons.users} {event.attendees} going</span>
                        </div>
                        {(joinedEvents || []).includes(event.id) && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#2E7D32", marginTop: 4, display: "inline-block" }}>✓ You're going</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Polls & Proposed Meetups */}
              {activePolls.length > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D" }}>🗳️ Polls & Proposed Meetups</h4>
                    <button style={{ background: "none", border: "none", fontSize: 12, color: "#6B2C3B", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onClick={() => setActiveSection("polls")}>Vote →</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activePolls.map(poll => {
                      const voteCounts = {};
                      (poll.votes || []).forEach(v => { if (v.vote_type === 'time') voteCounts[v.option_index] = (voteCounts[v.option_index] || 0) + 1; });
                      const totalVotes = Object.values(voteCounts).reduce((s, c) => s + c, 0);
                      const topTime = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
                      const hasVoted = (poll.votes || []).some(v => v.user_id === user?.id);
                      return (
                        <div key={poll.id} style={{ background: "white", borderRadius: 12, padding: 12, border: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => setActiveSection("polls")}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "#6B2C3B", background: "#FAF0F2", padding: "2px 8px", borderRadius: 50 }}>🗳️ Poll</span>
                              <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{poll.title}</strong>
                            </div>
                            <span style={{ fontSize: 11, color: "#bbb" }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#888" }}>
                            {poll.location_options && poll.location_options.length > 0 && (
                              <span>{Icons.location} {poll.location_options[0].split(',')[0]}</span>
                            )}
                            {topTime && <span>{Icons.clock} Leading: {topTime[0]}</span>}
                          </div>
                          {hasVoted ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#2E7D32", marginTop: 4, display: "inline-block" }}>✓ Voted</span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#6B2C3B", marginTop: 4, display: "inline-block" }}>Tap to vote</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Photos */}
              {groupPhotos.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D", marginBottom: 8 }}>📸 Photos ({groupPhotos.length})</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {groupPhotos.map((photo, i) => (
                      <div key={i} style={{ background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                        <img src={photo.url} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover", cursor: "pointer" }} onClick={() => setViewingPhoto(photo)} />
                        <div style={{ padding: "10px 12px" }}>
                          {photo.caption && <p style={{ fontSize: 14, color: "#2D2D2D", marginBottom: 4 }}>{photo.caption}</p>}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {photo.postedBy && <p style={{ fontSize: 11, color: "#999" }}>by {photo.postedBy}</p>}
                            {(isAdmin || photo.postedBy === user?.full_name) && (
                              <button
                                style={{ background: "none", border: "none", fontSize: 12, color: "#ccc", cursor: "pointer", padding: "2px 6px" }}
                                onClick={async () => {
                                  if (!confirm('Delete this photo?')) return;
                                  const { error } = await supabase.storage.from('avatars').remove([`groups/${group.id}/${photo.name}`]);
                                  if (error) { alert('Error deleting photo'); return; }
                                  setGroupPhotos(prev => prev.filter((_, j) => j !== i));
                                }}
                              >🗑️</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Edit Group form */}
        {editingGroup && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isMember ? (
              <>
                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...gs.composeAction, flex: 1, padding: "12px 0", textAlign: "center" }} onClick={() => { setShowPostPlaydate(true); setTimeout(() => document.getElementById('playdate-form')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>📅 Playdate</button>
                  <button style={{ ...gs.composeAction, flex: 1, padding: "12px 0", textAlign: "center" }} onClick={() => { setShowProposeMeetup(true); setTimeout(() => document.getElementById('meetup-form')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>📍 Meetup</button>
                  <label style={{ ...gs.composeAction, flex: 1, padding: "12px 0", textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: photoUploading ? 0.5 : 1 }}>
                    {photoUploading ? "..." : "📸 Photo"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoSelect(file);
                    }} />
                  </label>
                </div>

                {/* Group Photos */}
                {groupPhotos.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginBottom: 8 }}>📸 Photos ({groupPhotos.length})</h4>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                      {groupPhotos.map((photo, i) => (
                        <img key={i} src={photo.url} alt="" style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Playdate inline form */}
                {showPostPlaydate && (
                  <div id="playdate-form" style={gs.inlineForm}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <strong style={{ fontSize: 14, color: "#2D2D2D" }}>📅 Post a Playdate</strong>
                      <button style={{ background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer" }} onClick={() => setShowPostPlaydate(false)}>✕</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input style={gs.formInput} placeholder="Playdate title (e.g., Park Day!)" value={pdTitle} onChange={e => setPdTitle(e.target.value)} />
                      <AddressInput inputStyle={gs.formInput} placeholder="Search for a location..." value={pdLocation} onChange={setPdLocation} userArea={user?.area || group.area} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Date</p>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <select style={{ ...gs.formInput, flex: 2 }} value={pdDate.split('/')[0] || ''} onChange={e => { const parts = pdDate.split('/'); setPdDate(`${e.target.value}/${parts[1] || ''}/${new Date().getFullYear()}`); }}>
                          <option value="">Month</option>
                          {MONTHS.map((m, i) => <option key={i} value={m}>{m}</option>)}
                        </select>
                        <select style={{ ...gs.formInput, flex: 1 }} value={pdDate.split('/')[1] || ''} onChange={e => { const parts = pdDate.split('/'); setPdDate(`${parts[0] || ''}/${e.target.value}/${new Date().getFullYear()}`); }}>
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D", padding: "0 8px" }}>{new Date().getFullYear()}</span>
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Time</p>
                      <select style={gs.formInput} value={pdTime} onChange={e => setPdTime(e.target.value)}>
                        <option value="">Select a time</option>
                        {["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input style={gs.formInput} placeholder="Max kids / families" type="number" value={pdMax} onChange={e => setPdMax(e.target.value)} />
                      <textarea style={{ ...gs.formInput, minHeight: 60, resize: "vertical" }} placeholder="Details — what to bring, what to expect..." value={pdDesc} onChange={e => setPdDesc(e.target.value)} />
                      <button
                        style={{ ...styles.primaryBtn, marginTop: 4, opacity: pdSubmitting ? 0.6 : 1 }}
                        disabled={pdSubmitting}
                        onClick={async () => {
                          if (!pdTitle.trim()) return;
                          setPdSubmitting(true);
                          if (onCreateEvent) {
                            await onCreateEvent({
                              title: pdTitle.trim(),
                              location: pdLocation.trim(),
                              date: pdDate.trim() || "TBD",
                              time: pdTime.trim() || "TBD",
                              ages: group.ages || "All Ages",
                              maxAttendees: parseInt(pdMax) || 15,
                              description: pdDesc.trim(),
                              groupId: group.fromSupabase ? group.id : null,
                            });
                          }
                          setPdSubmitting(false);
                          setPdTitle(""); setPdLocation(""); setPdDate(""); setPdTime(""); setPdMax(""); setPdDesc("");
                          setShowPostPlaydate(false);
                        }}
                      >
                        {pdSubmitting ? "Posting..." : "Post Playdate to Group 🎉"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Propose Meetup inline form */}
                {showProposeMeetup && (
                  <div id="meetup-form" style={gs.inlineForm}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <strong style={{ fontSize: 14, color: "#2D2D2D" }}>📍 Propose a Meetup</strong>
                      <button style={{ background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer" }} onClick={() => setShowProposeMeetup(false)}>✕</button>
                    </div>
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Pick a day and let the group vote on the best time!</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input style={gs.formInput} placeholder="What's the meetup? (e.g., Park playdate)" value={mtTitle} onChange={e => setMtTitle(e.target.value)} />
                      <textarea style={{ ...gs.formInput, minHeight: 50, resize: "vertical" }} placeholder="Any details or context..." value={mtDesc} onChange={e => setMtDesc(e.target.value)} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginTop: 4 }}>Pick a day</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                          <button key={d} style={{ padding: "8px 14px", borderRadius: 50, fontSize: 13, cursor: "pointer", border: mtDay === d ? "2px solid #6B2C3B" : "1.5px solid #E8E8E8", background: mtDay === d ? "#FAF0F2" : "white", color: mtDay === d ? "#6B2C3B" : "#666", fontWeight: mtDay === d ? 600 : 400, fontFamily: "'DM Sans', sans-serif" }} onClick={() => setMtDay(d)}>{d}</button>
                        ))}
                      </div>
                      <button
                        style={{ ...styles.primaryBtn, marginTop: 4, opacity: mtSubmitting || !mtTitle.trim() || !mtDay ? 0.5 : 1 }}
                        disabled={mtSubmitting || !mtTitle.trim() || !mtDay}
                        onClick={async () => {
                          if (!mtTitle.trim() || !mtDay) return;
                          setMtSubmitting(true);
                          if (onProposeMeetup && group.fromSupabase) {
                            const TIMES = ["8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM"];
                            const result = await onProposeMeetup(group.id, {
                              title: mtTitle.trim(),
                              description: `${mtDesc.trim() ? mtDesc.trim() + ' — ' : ''}What time works best on ${mtDay}?`,
                              timeOptions: TIMES,
                              locationOptions: [],
                            });
                            if (result.data) {
                              setMeetups(prev => [{ ...result.data, votes: [] }, ...prev]);
                            }
                          }
                          setMtSubmitting(false);
                          setMtTitle(""); setMtDesc(""); setMtDay("");
                          setShowProposeMeetup(false);
                        }}
                      >
                        {mtSubmitting ? "Proposing..." : "Post Poll — Let the Group Vote! 🗳️"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty feed state */}
                <div style={{ textAlign: "center", padding: 24 }}>
                  <span style={{ fontSize: 32 }}>📝</span>
                  <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No posts yet. Start the conversation!</p>
                </div>
              </>
            ) : (
              <div style={{ background: "#F5F5F5", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <span style={{ fontSize: 36 }}>🔒</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D", marginTop: 10 }}>Members Only</p>
                <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Join this group to see posts, playdates, and discussions from members.</p>
              </div>
            )}
          </div>
        )}

        {/* ── POLLS TAB ── */}
        {activeSection === "polls" && isMember && (
          <GroupPollsTab group={group} user={user} onProposeMeetup={onProposeMeetup} loadMeetupProposals={loadMeetupProposals} onVote={onVote} onCreateEvent={onCreateEvent} />
        )}

        {/* ── AVAILABILITY TAB ── */}
        {activeSection === "avail" && isMember && (
          <AvailabilitySection
            myAvailability={myAvailability}
            setMyAvailability={setMyAvailability}
            myAvailNote={myAvailNote}
            setMyAvailNote={setMyAvailNote}
            groupColor={group.color}
            groupId={group.fromSupabase ? group.id : null}
            onSaveAvailability={onSaveAvailability}
            loadGroupAvailability={loadGroupAvailability}
            loadMyAvailability={loadMyAvailability}
          />
        )}

        {/* ── MEMBERS TAB ── */}
        {activeSection === "members" && isMember && (
          <MembersTab group={group} user={user} isAdmin={isAdmin} onViewProfile={onViewProfile} membersLoaded={membersLoaded} setMembersLoaded={setMembersLoaded} memberList={memberList} setMemberList={setMemberList} />
        )}

        {/* ── ABOUT TAB ── */}
        {activeSection === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isAdmin && group.fromSupabase && !editingGroup && (
              <button
                style={{ ...styles.secondaryBtn, alignSelf: "flex-end", padding: "6px 14px", fontSize: 12 }}
                onClick={() => setEditingGroup(true)}
              >
                ✏️ Edit Group
              </button>
            )}

            {editingGroup ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#2D2D2D" }}>Edit Group Info</p>
                <input style={styles.input} placeholder="Group name" value={editGroupName} onChange={e => setEditGroupName(e.target.value)} />
                <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} placeholder="Description" value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)} />
                <select style={styles.input} value={editGroupAge} onChange={e => setEditGroupAge(e.target.value)}>
                  <option>All Ages</option>
                  <option>0-1 years</option>
                  <option>1-3 years</option>
                  <option>3-5 years</option>
                  <option>5-8 years</option>
                  <option>8+ years</option>
                </select>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#FAFAFA", borderRadius: 12, border: "1.5px solid #E8E8E8" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>Private Group</p>
                    <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{editGroupPrivate ? "Members must request to join" : "Anyone can join instantly"}</p>
                  </div>
                  <div style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", background: editGroupPrivate ? "#6B2C3B" : "#E8E8E8", transition: "background 0.2s ease" }} onClick={() => setEditGroupPrivate(!editGroupPrivate)}>
                    <div style={{ width: 20, height: 20, borderRadius: 10, background: "white", position: "absolute", top: 2, transition: "transform 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transform: editGroupPrivate ? "translateX(20px)" : "translateX(2px)" }} />
                  </div>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>Rules (one per line)</p>
                <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} placeholder="Be kind&#10;No spam&#10;Keep kids supervised" value={editGroupRules} onChange={e => setEditGroupRules(e.target.value)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ ...styles.primaryBtn, flex: 1, opacity: savingGroup ? 0.6 : 1 }}
                    disabled={savingGroup}
                    onClick={async () => {
                      setSavingGroup(true);
                      const updates = {
                        name: editGroupName.trim(),
                        description: editGroupDesc.trim(),
                        age_group: editGroupAge,
                        is_private: editGroupPrivate,
                        rules: editGroupRules.trim() ? editGroupRules.trim().split('\n').filter(Boolean) : [],
                      };
                      await supabase.from('groups').update(updates).eq('id', group.id);
                      // Update local group object
                      group.name = updates.name;
                      group.desc = updates.description;
                      group.ages = updates.age_group;
                      group.isPrivate = updates.is_private;
                      group.rules = updates.rules;
                      setSavingGroup(false);
                      setEditingGroup(false);
                    }}
                  >
                    {savingGroup ? "Saving..." : "Save Changes"}
                  </button>
                  <button style={{ ...styles.secondaryBtn, flex: 1 }} onClick={() => setEditingGroup(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 style={styles.sectionTitle}>Age Group</h3>
                  <span style={{ ...styles.interestTagLg }}>{group.ages}</span>
                </div>
                <div>
                  <h3 style={styles.sectionTitle}>Description</h3>
                  <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{group.desc}</p>
                </div>
                {isMember && (
                  <div>
                    <h3 style={styles.sectionTitle}>What Members Can Do</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {["Post playdates & events for the group", "Propose meetups with time/location voting", "Comment and discuss on all group posts", "RSVP to meetups and playdates", "Share photos and updates"].map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#4CAF50", fontWeight: 700, fontSize: 12 }}>✓</span>
                          <span style={{ fontSize: 13, color: "#555" }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!isMember && (
                  <div style={{ background: "#F5F5F5", borderRadius: 12, padding: 16, textAlign: "center" }}>
                    <span style={{ fontSize: 28 }}>🔒</span>
                    <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>Member list, events, and discussions are only visible to members. Join to see more!</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeSection === "rules" && (
          <div>
            <h3 style={styles.sectionTitle}>Group Rules</h3>
            {(group.rules || []).length === 0 ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <span style={{ fontSize: 32 }}>📋</span>
                <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No rules have been set for this group yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(group.rules || []).map((rule, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: `${group.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: group.color }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: "#444", lineHeight: 1.4 }}>{rule}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === "requests" && isAdmin && (
          <div>
            <h3 style={styles.sectionTitle}>Pending Join Requests</h3>
            {pending.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <span style={{ fontSize: 32 }}>✨</span>
                <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No pending requests — you're all caught up!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pending.map(req => (
                  <div key={req.id} style={gs.requestCard}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ ...styles.avatarSmall, background: group.color }}>{req.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{req.name}</strong>
                          <span style={styles.verifiedMomTag}>✓ Verified</span>
                        </div>
                        {req.area && <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {req.area}</p>}
                        {req.ages && <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Kids: {req.ages}</p>}
                        {req.bio && <p style={{ fontSize: 13, color: "#555", marginTop: 4, lineHeight: 1.4 }}>{req.bio}</p>}
                        <p style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>Requested {req.requestedAt}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button style={gs.approveBtn} onClick={() => handleApprove(req.id)}>
                        {Icons.check} Approve
                      </button>
                      <button style={gs.denyBtn} onClick={() => handleDeny(req.id)}>
                        Decline
                      </button>
                      <button style={gs.viewProfileBtn} onClick={() => onViewProfile && onViewProfile(req)}>
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <PageFooter />
      </div>

      {/* Fullscreen photo viewer */}
      {viewingPhoto && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setViewingPhoto(null)}
        >
          <button style={{ position: "absolute", top: "calc(16px + env(safe-area-inset-top, 20px))", right: 16, background: "none", border: "none", color: "white", fontSize: 28, cursor: "pointer", zIndex: 201 }} onClick={() => setViewingPhoto(null)}>✕</button>
          <img src={viewingPhoto.url} alt="" style={{ maxWidth: "95%", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          {(viewingPhoto.caption || viewingPhoto.postedBy) && (
            <div style={{ marginTop: 12, textAlign: "center", padding: "0 20px" }} onClick={e => e.stopPropagation()}>
              {viewingPhoto.caption && <p style={{ fontSize: 15, color: "white", marginBottom: 4 }}>{viewingPhoto.caption}</p>}
              {viewingPhoto.postedBy && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>by {viewingPhoto.postedBy}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Members Tab ───
function MembersTab({ group, user, isAdmin, onViewProfile, membersLoaded, setMembersLoaded, memberList, setMemberList }) {
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (membersLoaded || !group.fromSupabase) return;
    supabase.from('group_members')
      .select('user_id, role, users!user_id(full_name, avatar_url, kids, area)')
      .eq('group_id', group.id)
      .then(({ data }) => {
        if (data) {
          setMemberList(data.map(m => ({
            userId: m.user_id,
            name: m.users?.full_name || 'A mom',
            avatar_url: m.users?.avatar_url,
            area: m.users?.area || '',
            kids: m.users?.kids || [],
            role: m.role,
          })));
        }
        setMembersLoaded(true);
      });
  }, [membersLoaded, group.id]);

  const handleRemove = async (userId) => {
    setRemoving(userId);
    await supabase.from('group_members').delete().eq('group_id', group.id).eq('user_id', userId);
    setMemberList(prev => prev.filter(m => m.userId !== userId));
    setRemoving(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D" }}>{memberList.length} Members</h3>
      {!membersLoaded ? (
        <p style={{ fontSize: 14, color: "#888", textAlign: "center", padding: 20 }}>Loading...</p>
      ) : memberList.length === 0 ? (
        <p style={{ fontSize: 13, color: "#888", textAlign: "center", padding: 20 }}>No members yet.</p>
      ) : (
        memberList.map((m, i) => {
          const kidAges = (m.kids || []).filter(k => k.gender || k.birthday).map(k => {
            const age = formatAge(k.birthday);
            const icon = k.gender === "Girl" ? "👧" : k.gender === "Boy" ? "👦" : "";
            return `${icon} ${age ? age + ' yrs' : ''}`.trim();
          }).filter(Boolean);

          return (
            <div key={i} style={{ background: "white", borderRadius: 12, padding: 12, border: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar url={m.avatar_url} name={m.name} size={44} />
              <div style={{ flex: 1 }} onClick={() => {
                if (onViewProfile && m.userId !== user?.id) {
                  onViewProfile({ userId: m.userId, name: m.name, avatar: m.name.split(' ').map(w => w[0]).join(''), bio: '', ages: kidAges.join(', '), area: m.area, interests: [] });
                }
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{m.name}</strong>
                  {m.role === 'admin' && <span style={{ fontSize: 9, fontWeight: 700, color: "#6B2C3B", background: "#FAF0F2", padding: "2px 6px", borderRadius: 50 }}>Admin</span>}
                  {m.userId === user?.id && <span style={{ fontSize: 9, fontWeight: 700, color: "#2E7D32", background: "#E8F5E9", padding: "2px 6px", borderRadius: 50 }}>You</span>}
                </div>
                {kidAges.length > 0 && <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{kidAges.join(', ')}</p>}
                {m.area && <p style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>📍 {m.area}</p>}
              </div>
              {isAdmin && m.role !== 'admin' && m.userId !== user?.id && (
                <button
                  style={{ padding: "6px 10px", borderRadius: 8, background: "#FFEBEE", border: "none", fontSize: 11, fontWeight: 600, color: "#C62828", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: removing === m.userId ? 0.5 : 1 }}
                  disabled={removing === m.userId}
                  onClick={() => {
                    if (window.confirm(`Remove ${m.name} from this group?`)) handleRemove(m.userId);
                  }}
                >
                  {removing === m.userId ? "..." : "Remove"}
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Availability Section ───
const TIME_SLOTS = ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)", "Evening (4-7)"];
const AVAIL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


function AvailabilitySection({ myAvailability, setMyAvailability, myAvailNote, setMyAvailNote, groupColor, groupId, onSaveAvailability, loadGroupAvailability, loadMyAvailability }) {
  const [editMode, setEditMode] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [selectedOverlapDay, setSelectedOverlapDay] = useState(null);
  const [membersAvail, setMembersAvail] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load availability from Supabase
  useEffect(() => {
    if (!groupId || loaded) return;
    const load = async () => {
      if (loadMyAvailability) {
        const myData = await loadMyAvailability(groupId);
        if (myData) {
          setMyAvailability(myData.days);
          setMyAvailNote(myData.note);
        }
      }
      if (loadGroupAvailability) {
        const others = await loadGroupAvailability(groupId);
        setMembersAvail(others);
      }
      setLoaded(true);
    };
    load();
  }, [groupId, loaded]);

  const toggleSlot = (day, slot) => {
    setMyAvailability(prev => {
      const current = prev[day] || [];
      return {
        ...prev,
        [day]: current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot],
      };
    });
  };

  const handleDone = async () => {
    if (groupId && onSaveAvailability) {
      setSaving(true);
      await onSaveAvailability(groupId, myAvailability, myAvailNote);
      // Reload others' availability
      if (loadGroupAvailability) {
        const others = await loadGroupAvailability(groupId);
        setMembersAvail(others);
      }
      setSaving(false);
    }
    setEditMode(false);
  };

  const hasAny = Object.values(myAvailability).some(slots => slots.length > 0);

  // Calculate overlap: for a given day/slot, how many members are available
  const getOverlapCount = (day, slot) => {
    return membersAvail.filter(m => (m.days[day] || []).includes(slot)).length;
  };

  // Best times: find slots with most overlap
  const bestTimes = [];
  AVAIL_DAYS.forEach(day => {
    TIME_SLOTS.forEach(slot => {
      const myFree = (myAvailability[day] || []).includes(slot);
      const othersCount = getOverlapCount(day, slot);
      if (myFree && othersCount > 0) {
        bestTimes.push({ day, slot, count: othersCount + 1 });
      }
    });
  });
  bestTimes.sort((a, b) => b.count - a.count);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* My Availability */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={styles.sectionTitle}>My Availability</h3>
        <button
          style={{ ...styles.secondaryBtn, padding: "6px 14px", fontSize: 12, opacity: saving ? 0.6 : 1 }}
          onClick={() => editMode ? handleDone() : setEditMode(true)}
          disabled={saving}
        >
          {saving ? "Saving..." : editMode ? "Done" : "✏️ Edit"}
        </button>
      </div>

      <p style={{ fontSize: 12, color: "#888", marginTop: -8 }}>
        {editMode
          ? "Tap time slots to toggle your availability. This helps the group find the best times to meet!"
          : "Your typical weekly availability. You can still join any event regardless of what's set here."}
      </p>

      {/* Availability grid */}
      <div style={avs.gridContainer}>
        {/* Header row */}
        <div style={avs.gridHeader}>
          <div style={avs.gridCorner} />
          {AVAIL_DAYS.map(day => (
            <div key={day} style={avs.gridDayHeader}>{day}</div>
          ))}
        </div>
        {/* Time rows */}
        {TIME_SLOTS.map(slot => (
          <div key={slot} style={avs.gridRow}>
            <div style={avs.gridTimeLabel}>{slot.split(" ")[0]}<br/><span style={{ fontSize: 9, color: "#bbb" }}>{slot.match(/\(([^)]+)\)/)?.[1]}</span></div>
            {AVAIL_DAYS.map(day => {
              const isAvail = (myAvailability[day] || []).includes(slot);
              const overlapCount = getOverlapCount(day, slot);
              return (
                <div
                  key={day}
                  style={{
                    ...avs.gridCell,
                    background: isAvail ? `${groupColor}30` : "#FAFAFA",
                    border: isAvail ? `1.5px solid ${groupColor}` : "1.5px solid #f0f0f0",
                    cursor: editMode ? "pointer" : "default",
                    position: "relative",
                  }}
                  onClick={() => editMode && toggleSlot(day, slot)}
                >
                  {isAvail && <span style={{ color: groupColor, fontSize: 14, fontWeight: 700 }}>✓</span>}
                  {!editMode && isAvail && overlapCount > 0 && (
                    <span style={{ ...avs.overlapDot, background: groupColor }}>{overlapCount}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Availability note */}
      {editMode ? (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginBottom: 6 }}>Add a note (optional)</p>
          <input
            style={styles.input}
            placeholder="e.g., Tuesdays are gymnastics, flexible on Fridays..."
            value={myAvailNote}
            onChange={e => setMyAvailNote(e.target.value)}
          />
        </div>
      ) : myAvailNote ? (
        <div style={{ background: "#FAFAFA", borderRadius: 10, padding: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 2 }}>MY NOTE</p>
          <p style={{ fontSize: 13, color: "#555" }}>{myAvailNote}</p>
        </div>
      ) : null}

      {!editMode && !hasAny && (
        <div style={{ background: "#FFF8E1", borderRadius: 12, padding: 16, textAlign: "center" }}>
          <span style={{ fontSize: 28 }}>📅</span>
          <p style={{ fontSize: 13, color: "#666", marginTop: 6 }}>You haven't set your availability yet. Tap <strong>Edit</strong> to let the group know when you're free!</p>
        </div>
      )}

      <div style={{ background: `${groupColor}10`, borderRadius: 10, padding: 12, display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 14 }}>💡</span>
        <p style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>This is your <strong>typical</strong> schedule — not a commitment. You can always join events outside these times, and skip ones during them. It just helps the group plan!</p>
      </div>

      {/* Best overlap times */}
      {hasAny && bestTimes.length > 0 && !editMode && (
        <div>
          <h3 style={styles.sectionTitle}>🔥 Best Times to Meet</h3>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 10, marginTop: -6 }}>Based on your availability + other members</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {bestTimes.slice(0, 5).map((bt, i) => (
              <div key={i} style={avs.bestTimeRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <div style={{ ...avs.bestTimeRank, background: i === 0 ? groupColor : i < 3 ? `${groupColor}88` : "#ddd", color: i < 3 ? "white" : "#666" }}>{i + 1}</div>
                  <div>
                    <strong style={{ fontSize: 13, color: "#2D2D2D" }}>{bt.day}</strong>
                    <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>{bt.slot}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={avs.overlapAvatars}>
                    {[...Array(Math.min(bt.count, 4))].map((_, j) => (
                      <div key={j} style={{ ...avs.miniAv, marginLeft: j > 0 ? -6 : 0, zIndex: 4 - j, background: `${groupColor}${60 + j * 20}` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: groupColor }}>{bt.count} free</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group members' availability */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={styles.sectionTitle}>Members' Availability</h3>
          <button
            style={{ ...styles.textBtn, fontSize: 12, marginTop: 0, padding: "4px 0" }}
            onClick={() => setShowMembers(!showMembers)}
          >
            {showMembers ? "Hide" : "Show"}
          </button>
        </div>
        {showMembers && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {membersAvail.map((member, i) => {
              const freeDays = AVAIL_DAYS.filter(d => (member.days[d] || []).length > 0);
              return (
                <div key={i} style={avs.memberAvailCard}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ ...styles.avatarSmall, background: groupColor, width: 34, height: 34, fontSize: 12 }}>{member.avatar}</div>
                    <strong style={{ fontSize: 13, color: "#2D2D2D" }}>{member.name}</strong>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                    {AVAIL_DAYS.map(day => {
                      const count = (member.days[day] || []).length;
                      return (
                        <div
                          key={day}
                          style={{
                            ...avs.memberDayPill,
                            background: count > 0 ? `${groupColor}${Math.min(15 + count * 10, 40).toString(16)}` : "#F5F5F5",
                            color: count > 0 ? groupColor : "#ccc",
                            borderColor: count > 0 ? `${groupColor}44` : "#f0f0f0",
                          }}
                          title={count > 0 ? `${count} time slots` : "Not available"}
                        >
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{day}</span>
                          {count > 0 && <span style={{ fontSize: 9 }}>({count})</span>}
                        </div>
                      );
                    })}
                  </div>
                  {member.note && (
                    <p style={{ fontSize: 11, color: "#999", fontStyle: "italic", lineHeight: 1.3 }}>"{member.note}"</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Availability styles
const avs = {
  gridContainer: { overflowX: "auto", borderRadius: 12, border: "1px solid #f0f0f0", background: "white" },
  gridHeader: { display: "flex", borderBottom: "1px solid #f0f0f0" },
  gridCorner: { width: 64, flexShrink: 0 },
  gridDayHeader: { flex: 1, minWidth: 40, textAlign: "center", padding: "8px 0", fontSize: 11, fontWeight: 600, color: "#888" },
  gridRow: { display: "flex", borderBottom: "1px solid #f8f8f8" },
  gridTimeLabel: { width: 64, flexShrink: 0, padding: "6px 6px", fontSize: 10, fontWeight: 600, color: "#666", display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: 1.2 },
  gridCell: { flex: 1, minWidth: 40, minHeight: 38, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, margin: 2, transition: "all 0.15s ease" },
  overlapDot: { position: "absolute", top: 1, right: 1, width: 14, height: 14, borderRadius: 7, color: "white", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  bestTimeRow: { display: "flex", alignItems: "center", padding: "10px 12px", background: "white", borderRadius: 10, border: "1px solid #f0f0f0" },
  bestTimeRank: { width: 22, height: 22, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  overlapAvatars: { display: "flex", alignItems: "center" },
  miniAv: { width: 20, height: 20, borderRadius: 10, border: "2px solid white" },
  memberAvailCard: { background: "white", borderRadius: 12, padding: 12, border: "1px solid #f0f0f0" },
  memberDayPill: { padding: "4px 8px", borderRadius: 8, border: "1px solid", display: "flex", alignItems: "center", gap: 3, flexDirection: "column" },
};

// ─── Create Group Screen ───
function CreateGroupScreen({ onBack, onSubmit, fadeIn }) {
  const [isPrivate, setIsPrivate] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [ageGroup, setAgeGroup] = useState("All Ages");
  const [maxMembers, setMaxMembers] = useState("");
  const [rules, setRules] = useState("");
  const [joinQuestions, setJoinQuestions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const COLORS = ["#6B2C3B", "#4ECDC4", "#FFD93D", "#A78BFA", "#F97316", "#10B981", "#EC4899", "#3B82F6"];
  const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Group name is required"); return; }
    setSubmitting(true);
    setError(null);

    const result = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      area: area.trim(),
      ageGroup,
      maxMembers: parseInt(maxMembers) || 30,
      isPrivate,
      rules: rules.trim() ? rules.trim().split('\n').filter(Boolean) : [],
      joinQuestions: joinQuestions.trim() ? joinQuestions.trim().split('\n').filter(Boolean) : [],
      color: randomColor,
    });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      onBack();
    }
  };

  return (
    <div style={styles.detailScreen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
        <h2 style={styles.detailTitle}>Create a Group</h2>
        <div style={{ width: 40 }} />
      </div>
      <div style={styles.detailBody}>
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <span style={{ fontSize: 40 }}>👥</span>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#2D2D2D", marginTop: 8 }}>Start Your Squad</h2>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Create a group for local moms to connect around shared interests or kids' ages.</p>
        </div>

        <div style={styles.onboardFields}>
          <input style={styles.input} placeholder="Group name (e.g., Westside Toddler Moms)" value={name} onChange={e => setName(e.target.value)} />
          <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} placeholder="Describe your group... What's it about? Who should join?" value={description} onChange={e => setDescription(e.target.value)} />
          <AddressInput inputStyle={styles.input} placeholder="Area / Neighborhood / Zip" value={area} onChange={setArea} />
          <select style={styles.input} value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
            <option>All Ages</option>
            <option>0-1 years</option>
            <option>1-3 years</option>
            <option>3-5 years</option>
            <option>5-8 years</option>
            <option>8+ years</option>
          </select>

          {/* Privacy toggle */}
          <div style={gs.privacyToggle}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>Private Group</p>
              <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                {isPrivate
                  ? "Members must request to join. You approve each person."
                  : "Anyone can join instantly. Group content is visible to all."}
              </p>
            </div>
            <div
              style={{ ...gs.toggle, background: isPrivate ? "#4CAF50" : "#E8E8E8" }}
              onClick={() => setIsPrivate(!isPrivate)}
            >
              <div style={{ ...gs.toggleDot, transform: isPrivate ? "translateX(20px)" : "translateX(2px)" }} />
            </div>
          </div>

          {isPrivate && (
            <div style={{ background: "#F1F8E9", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#2E7D32", marginBottom: 6 }}>🔒 Private group features:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  "You approve or deny every join request",
                  "Only members can see group content, events & members",
                  "Members can't invite others — they must apply",
                  "You can remove members at any time",
                ].map((f, i) => (
                  <span key={i} style={{ fontSize: 12, color: "#555" }}>✓ {f}</span>
                ))}
              </div>
            </div>
          )}

          <textarea style={{ ...styles.input, minHeight: 60, fontFamily: "inherit" }} placeholder="Group rules (one per line)..." value={rules} onChange={e => setRules(e.target.value)} />

          {isPrivate && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginTop: 4 }}>Join Questions (optional)</p>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Ask questions that people must answer when requesting to join. One per line.</p>
              <textarea style={{ ...styles.input, minHeight: 80, fontFamily: "inherit" }} placeholder={"What area are you in?\nHow old are your kids?\nHow did you hear about us?"} value={joinQuestions} onChange={e => setJoinQuestions(e.target.value)} />
            </>
          )}
        </div>

        {error && <p style={{ fontSize: 13, color: "#E53935", textAlign: "center", marginTop: 8 }}>{error}</p>}

        <button
          style={{ ...styles.primaryBtn, width: "100%", marginTop: 16, opacity: submitting ? 0.6 : 1 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Group 🎉"}
        </button>
      </div>
    </div>
  );
}

// Group-specific styles
const gs = {
  privBadge: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#E65100", background: "#FFF3E0", padding: "3px 8px", borderRadius: 50 },
  pubBadge: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#1565C0", background: "#E3F2FD", padding: "3px 8px", borderRadius: 50 },
  pendingBadge: { position: "absolute", top: 14, right: 16, fontSize: 11, fontWeight: 600, color: "#E65100", background: "#FFF3E0", padding: "3px 10px", borderRadius: 50 },
  pendingCard: { display: "flex", alignItems: "center", gap: 14, padding: 16, background: "#FFF8E1", borderRadius: 16, border: "1px solid #FFE082" },
  sectionTab: { flex: 1, padding: "10px 0", background: "none", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s ease" },
  requestCard: { background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0" },
  approveBtn: { display: "flex", alignItems: "center", gap: 4, flex: 1, padding: "10px 0", borderRadius: 10, background: "#4CAF50", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" },
  denyBtn: { flex: 1, padding: "10px 0", borderRadius: 10, background: "#FFEBEE", color: "#C62828", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  viewProfileBtn: { flex: 1, padding: "10px 0", borderRadius: 10, background: "#F5F5F5", color: "#666", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 },
  modal: { width: "100%", maxWidth: 430, background: "white", borderRadius: "20px 20px 0 0", padding: 24, paddingBottom: 40, maxHeight: "90vh", overflow: "auto", WebkitOverflowScrolling: "touch" },
  privacyToggle: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#FAFAFA", borderRadius: 12, border: "1.5px solid #E8E8E8" },
  toggle: { width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", transition: "background 0.2s ease", flexShrink: 0 },
  toggleDot: { width: 20, height: 20, borderRadius: 10, background: "white", position: "absolute", top: 2, transition: "transform 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" },
  composeBox: { background: "white", borderRadius: 16, padding: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0" },
  composeAction: { padding: "7px 12px", borderRadius: 50, background: "#F5F5F5", border: "none", fontSize: 12, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  inlineForm: { background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 14px rgba(0,0,0,0.06)", border: "1.5px solid #E8E8E8" },
  formInput: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#2D2D2D", background: "white" },
  feedPost: { background: "white", borderRadius: 16, padding: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #f5f5f5" },
  postTypeBadge: { display: "inline-block", fontSize: 10, fontWeight: 600, color: "#4A1E2A", background: "#FAF0F2", padding: "2px 8px", borderRadius: 50, marginTop: 4 },
  postDetails: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8, padding: "8px 12px", background: "#FAFAFA", borderRadius: 10 },
  postDetailItem: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#666" },
  postActions: { display: "flex", gap: 12, marginTop: 10, paddingTop: 8, borderTop: "1px solid #f5f5f5" },
  postActionBtn: { background: "none", border: "none", fontSize: 13, color: "#999", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "2px 0" },
  voteOption: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", background: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#2D2D2D", width: "100%", textAlign: "left" },
};

// ─── Bottom Nav ───
// ─── Notifications Tab ───
function NotificationsTab({ notifications, setNotifications, user, groups, onNavigate }) {
  return (
    <div style={styles.tabContent}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={styles.pageTitle}>Notifications</h1>
        {(notifications || []).some(n => !n.is_read) && (
          <button
            style={{ background: "none", border: "none", fontSize: 13, color: "#6B2C3B", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
            onClick={async () => {
              if (user) {
                await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
              }
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <span style={{ fontSize: 40 }}>🔔</span>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#2D2D2D", marginTop: 12 }}>You're all caught up!</p>
          <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Notifications for polls, playdates, and group activity will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map(notif => (
            <div
              key={notif.id}
              style={{
                background: notif.is_read ? "white" : "#FAF0F2",
                borderRadius: 12, padding: 14,
                border: notif.is_read ? "1px solid #f0f0f0" : "1px solid #D4B5BA",
                cursor: "pointer",
              }}
              onClick={async () => {
                if (!notif.is_read && user) {
                  await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
                  setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                }
                if (onNavigate) onNavigate(notif);
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>
                  {notif.type === 'new_poll' ? '🗳️' : notif.type === 'poll_confirmed' ? '✅' : notif.type === 'connection_request' ? '👋' : notif.type === 'connection_accepted' ? '🎉' : notif.type === 'new_message' ? '💬' : notif.type === 'group_accepted' ? '🎉' : notif.type === 'new_event' ? '📅' : notif.type === 'join_request' ? '📬' : notif.type === 'admin_application' ? '🛡️' : '🔔'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 13, color: "#2D2D2D" }}>{notif.title}</strong>
                    {!notif.is_read && <div style={{ width: 8, height: 8, borderRadius: 4, background: "#6B2C3B", flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontSize: 12, color: "#666", marginTop: 4, lineHeight: 1.4 }}>{notif.body}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <p style={{ fontSize: 11, color: "#bbb" }}>{new Date(notif.created_at).toLocaleDateString()}</p>
                    {notif.group_id && <span style={{ fontSize: 11, fontWeight: 600, color: "#6B2C3B" }}>View ›</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <PageFooter />
    </div>
  );
}

// ─── Page Footer ───
function PageFooter() {
  return (
    <div style={{ textAlign: "center", padding: "24px 0 16px", marginTop: 16 }}>
      <p style={{ fontSize: 10, color: "#ccc", letterSpacing: 0.5 }}>© {new Date().getFullYear()} MamaSquads. All rights reserved.</p>
    </div>
  );
}

// ─── Messages Inbox ───
function MessagesTab({ user, conversations, groups, joinedGroups, onOpenConvo, onOpenGroupChat }) {
  const [search, setSearch] = useState("");

  // Get other participant's info for each DM
  const [userNames, setUserNames] = useState({});
  useEffect(() => {
    const ids = conversations.map(c => c.participant_1 === user?.id ? c.participant_2 : c.participant_1).filter(Boolean);
    if (ids.length === 0) return;
    supabase.from('users').select('id, full_name, avatar_url').in('id', ids)
      .then(({ data }) => {
        if (data) {
          const map = {};
          data.forEach(u => { map[u.id] = u; });
          setUserNames(map);
        }
      });
  }, [conversations, user]);

  const myGroups = (groups || []).filter(g => (joinedGroups || []).includes(g.id));

  return (
    <div style={styles.tabContent}>
      <h1 style={styles.pageTitle}>Messages</h1>
      <div style={styles.searchBar}>
        {Icons.search}
        <input style={styles.searchInput} placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Group chats */}
      {myGroups.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8 }}>GROUP CHATS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {myGroups.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase())).map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "white", borderRadius: 12, cursor: "pointer", border: "1px solid #f0f0f0" }} onClick={() => onOpenGroupChat(g)}>
                <span style={{ fontSize: 28 }}>{g.emoji || '👥'}</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{g.name}</strong>
                  <p style={{ fontSize: 12, color: "#888" }}>{g.members} members</p>
                </div>
                <span style={{ color: "#ccc" }}>›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct messages */}
      <p style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8 }}>DIRECT MESSAGES</p>
      {conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30 }}>
          <span style={{ fontSize: 40 }}>💬</span>
          <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No messages yet. Connect with a mom and start chatting!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {conversations.map(c => {
            const otherId = c.participant_1 === user?.id ? c.participant_2 : c.participant_1;
            const other = userNames[otherId] || {};
            const lastMsg = (c.messages || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            const name = other.full_name || 'A mom';
            if (search && !name.toLowerCase().includes(search.toLowerCase())) return null;
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "white", borderRadius: 12, cursor: "pointer", border: "1px solid #f0f0f0" }} onClick={() => onOpenConvo(c, other)}>
                {other.avatar_url ? (
                  <img src={other.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: 22, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: "#6B2C3B", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700 }}>
                    {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 14, color: "#2D2D2D" }}>{name}</strong>
                  {lastMsg && <p style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastMsg.sender_id === user?.id ? 'You: ' : ''}{lastMsg.text}</p>}
                </div>
                {lastMsg && <span style={{ fontSize: 10, color: "#bbb", flexShrink: 0 }}>{new Date(lastMsg.created_at).toLocaleDateString()}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Chat Screen (DM or Group) ───
function ChatScreen({ user, conversation, otherUser, group, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const isGroup = !!group;
  const chatTitle = isGroup ? (group.emoji + ' ' + group.name) : (otherUser?.full_name || 'Chat');

  // Keyboard handling
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 50 ? offset : 0);
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // Load messages
  useEffect(() => {
    const loadMsgs = async () => {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100);
      if (isGroup) {
        query = query.eq('group_id', group.id);
      } else {
        query = query.eq('conversation_id', conversation.id);
      }
      const { data } = await query;
      if (data) { setMessages(data); setLoaded(true); }
    };
    loadMsgs();
    const poll = setInterval(loadMsgs, 3000);
    return () => clearInterval(poll);
  }, [conversation?.id, group?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: loaded ? 'smooth' : 'auto' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    const msgData = {
      sender_id: user.id,
      sender_name: user.full_name || 'A mom',
      text: newMsg.trim(),
    };
    if (isGroup) {
      msgData.group_id = group.id;
    } else {
      msgData.conversation_id = conversation.id;
      // Update last_message_at
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation.id);
    }
    const { error } = await supabase.from('messages').insert(msgData);
    if (error) { alert('Error sending message'); setSending(false); return; }
    setMessages(prev => [...prev, { ...msgData, id: Date.now(), created_at: new Date().toISOString() }]);
    setNewMsg("");
    setSending(false);
    haptic('Light');
  };

  return (
    <div style={styles.detailScreen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
        <h2 style={styles.detailTitle}>{chatTitle}</h2>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 6, WebkitOverflowScrolling: "touch" }}>
        {!loaded && <p style={{ textAlign: "center", color: "#888", fontSize: 13, padding: 20 }}>Loading...</p>}
        {loaded && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <span style={{ fontSize: 40 }}>💬</span>
            <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>{isGroup ? 'No messages yet. Start the conversation!' : `Say hi to ${otherUser?.full_name || 'your new friend'}!`}</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 2 }}>
              <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isMe ? "#6B2C3B" : "white", color: isMe ? "white" : "#2D2D2D", border: isMe ? "none" : "1px solid #f0f0f0" }}>
                {isGroup && !isMe && <p style={{ fontSize: 11, fontWeight: 600, color: isMe ? "rgba(255,255,255,0.7)" : "#6B2C3B", marginBottom: 2 }}>{msg.sender_name}</p>}
                <p style={{ fontSize: 14, lineHeight: 1.4 }}>{msg.text}</p>
                <p style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,0.5)" : "#bbb", marginTop: 4, textAlign: "right" }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ position: "fixed", bottom: keyboardOffset || 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "white", borderTop: "1px solid #f0f0f0", padding: keyboardOffset ? "10px 18px" : "10px 18px calc(10px + env(safe-area-inset-bottom, 20px))", display: "flex", gap: 8, zIndex: 60, transition: "bottom 0.15s ease" }}>
        <input
          style={{ ...styles.msgInput, flex: 1 }}
          placeholder={isGroup ? "Message the group..." : "Type a message..."}
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button style={{ ...styles.sendBtn, opacity: sending ? 0.5 : 1 }} onClick={handleSend} disabled={sending}>{Icons.send}</button>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, unreadNotifications, unreadMessages }) {
  const tabs = [
    { id: "home", icon: Icons.home, label: "Home" },
    { id: "groups", icon: Icons.group, label: "Groups" },
    { id: "messages", icon: Icons.chat, label: "Chat", badge: unreadMessages || 0 },
    { id: "notifications", icon: Icons.bell, label: "Alerts", badge: unreadNotifications || 0 },
    { id: "discover", icon: Icons.compass, label: "Discover" },
  ];

  return (
    <div style={styles.bottomNav}>
      {tabs.map(t => (
        <button
          key={t.id}
          style={{
            ...styles.navItem,
            ...(t.id === "create" ? styles.navCreate : {}),
            color: tab === t.id ? "#6B2C3B" : "#999",
            position: "relative",
          }}
          onClick={() => { haptic('Light'); setTab(t.id); }}
        >
          {t.id === "create" ? (
            <div style={styles.createBtn}>{t.icon}</div>
          ) : (
            <>
              <div style={{ position: "relative", display: "inline-block" }}>
                {t.icon}
                {t.badge > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -10, background: "#6B2C3B", color: "white", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 50, minWidth: 16, textAlign: "center" }}>{t.badge > 9 ? '9+' : t.badge}</span>
                )}
              </div>
              <span style={styles.navLabel}>{t.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Keyframes ───
const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Playfair+Display:wght@600;700&display=swap');
  
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.15); opacity: 0.1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  *::-webkit-scrollbar { width: 0; height: 0; }
  input, textarea, select, button { outline: none; }
`;

// ─── Styles ───
const font = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const display = "'Playfair Display', Georgia, serif";
const pink = "#6B2C3B";
const pinkLight = "#FAF0F2";
const pinkDark = "#4A1E2A";
const gray50 = "#FAFAFA";
const gray100 = "#F5F5F5";
const gray200 = "#E8E8E8";
const gray400 = "#ACACAC";
const gray600 = "#666";
const gray800 = "#2D2D2D";
const radius = 16;

const styles = {
  app: { fontFamily: font, maxWidth: 430, margin: "0 auto", height: "100dvh", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FFFBFC", position: "relative", overflow: "hidden", paddingTop: "max(12px, env(safe-area-inset-top, 12px))" },
  fullScreen: { fontFamily: font, maxWidth: 430, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, paddingTop: "calc(48px + env(safe-area-inset-top, 0px))", position: "relative" },
  mainContent: { flex: 1, overflow: "auto", overflowY: "scroll", paddingBottom: "calc(120px + env(safe-area-inset-bottom, 34px))", WebkitOverflowScrolling: "touch" },
  tabContent: { padding: "24px 18px", paddingTop: 28, paddingBottom: 60 },

  // Welcome
  welcomeContent: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  logoContainer: { position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoBubble: { width: 80, height: 80, borderRadius: 40, background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(255,107,138,0.2)", zIndex: 1 },
  logoRing: { position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid rgba(255,107,138,0.2)", animation: "pulse 3s ease-in-out infinite" },
  logoRing2: { position: "absolute", inset: -20, borderRadius: "50%", border: "1.5px solid rgba(255,107,138,0.1)", animation: "pulse 3s ease-in-out infinite" },
  welcomeTitle: { fontFamily: display, fontSize: 42, fontWeight: 700, color: gray800, letterSpacing: -1 },
  welcomeSubtitle: { fontSize: 16, color: gray600, lineHeight: 1.5, marginBottom: 12 },
  welcomeFeatures: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, alignItems: "flex-start" },
  welcomeFeature: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: gray600, animation: "fadeSlideUp 0.5s ease both" },
  featureDot: { width: 8, height: 8, borderRadius: 4, background: pink, flexShrink: 0 },

  // About
  aboutContent: { maxWidth: 400, width: "100%", padding: "40px 4px 32px", display: "flex", flexDirection: "column", gap: 20 },
  aboutHeader: { display: "flex", alignItems: "center", gap: 12 },
  aboutTitle: { fontFamily: display, fontSize: 28, color: gray800 },
  aboutCard: { background: "white", borderRadius: radius, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  aboutText: { fontSize: 14.5, lineHeight: 1.7, color: gray600, marginBottom: 12 },
  aboutDivider: { width: 40, height: 2, background: pink, borderRadius: 1, margin: "4px 0" },
  aboutFounder: { display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: pinkLight, borderRadius: radius },
  founderBadge: { width: 44, height: 44, borderRadius: 22, background: pink, display: "flex", alignItems: "center", justifyContent: "center", color: "white" },
  founderLabel: { fontSize: 11, color: gray400, textTransform: "uppercase", letterSpacing: 1 },
  founderName: { fontSize: 16, fontWeight: 700, color: gray800, marginTop: 2 },
  founderRole: { fontSize: 12, color: gray600, marginTop: 1 },
  aboutValues: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  valueCard: { background: "white", borderRadius: 12, padding: "16px 10px", textAlign: "center", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" },
  valueTitle: { fontSize: 12, color: gray800 },
  valueDesc: { fontSize: 11, color: gray400 },
  aboutFootnote: { fontSize: 12, color: gray400, textAlign: "center", marginTop: 4 },

  // Buttons
  primaryBtn: { width: "100%", padding: "15px 32px", borderRadius: 50, background: `linear-gradient(135deg, ${pink}, ${pinkDark})`, color: "white", fontSize: 16, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: font, boxShadow: `0 4px 16px ${pink}44`, transition: "transform 0.15s ease", marginTop: 8 },
  secondaryBtn: { padding: "12px 24px", borderRadius: 50, background: pinkLight, color: pink, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: font },
  textBtn: { background: "none", border: "none", color: gray400, fontSize: 14, cursor: "pointer", fontFamily: font, marginTop: 8, padding: 8 },

  // Onboarding
  onboardContent: { maxWidth: 400, width: "100%", padding: "40px 4px 32px", display: "flex", flexDirection: "column" },
  progressBar: { height: 4, background: gray100, borderRadius: 2, overflow: "hidden", marginBottom: 16 },
  progressFill: { height: "100%", background: "#6B2C3B", borderRadius: 2, transition: "width 0.4s ease" },
  stepLabel: { fontSize: 12, color: gray400, marginBottom: 4 },
  onboardTitle: { fontFamily: display, fontSize: 26, color: gray800, marginBottom: 4 },
  onboardSubtitle: { fontSize: 14, color: gray600, marginBottom: 20 },
  onboardFields: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
  input: { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${gray200}`, fontSize: 15, fontFamily: font, color: gray800, background: "white", transition: "border 0.2s ease", resize: "vertical" },
  addChildBtn: { padding: 12, borderRadius: 12, border: `1.5px dashed ${gray200}`, background: "none", color: pink, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: font },
  interestGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  interestChip: { padding: "10px 16px", borderRadius: 50, border: `1.5px solid ${gray200}`, background: "white", fontSize: 13, cursor: "pointer", fontFamily: font, transition: "all 0.2s ease", color: gray600 },
  interestChipActive: { borderColor: pink, background: pinkLight, color: pinkDark },
  promptCard: { background: gray50, borderRadius: 12, padding: 14 },
  promptQuestion: { fontSize: 13, fontWeight: 600, color: gray800, marginBottom: 8 },

  // Home
  homeHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { fontSize: 14, color: gray400, marginBottom: 2 },
  pageTitle: { fontFamily: display, fontSize: 26, fontWeight: 700, color: gray800, marginBottom: 12 },
  pollBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 50, background: "#F0F7FF", color: "#3B82F6", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: font },
  filterRow: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 4 },
  dayChip: { padding: "7px 14px", borderRadius: 50, border: "none", background: gray100, fontSize: 13, cursor: "pointer", fontFamily: font, color: gray600, whiteSpace: "nowrap", flexShrink: 0 },
  dayChipActive: { background: pink, color: "white" },
  ageChip: { padding: "6px 12px", borderRadius: 50, border: `1.5px solid ${gray200}`, background: "white", fontSize: 12, cursor: "pointer", fontFamily: font, color: gray600, whiteSpace: "nowrap", flexShrink: 0 },
  ageChipActive: { borderColor: pink, background: pinkLight, color: pinkDark },

  // Events
  eventsList: { display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 },
  eventCard: { display: "flex", borderRadius: radius, background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden", cursor: "pointer", animation: "fadeSlideUp 0.4s ease both", transition: "transform 0.15s ease" },
  eventAccent: { width: 5, flexShrink: 0 },
  eventBody: { flex: 1, padding: "14px 16px", position: "relative" },
  eventTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  ageBadge: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: pinkLight, color: pinkDark },
  eventDay: { fontSize: 12, fontWeight: 600, color: gray400 },
  eventTitle: { fontSize: 16, fontWeight: 700, color: gray800, marginBottom: 6, fontFamily: font },
  eventMeta: { display: "flex", gap: 14, marginBottom: 8 },
  metaItem: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: gray400 },
  eventBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  hostName: { fontSize: 12, color: gray400 },
  attendeeCount: { fontSize: 12, fontWeight: 600, color: pink },
  joinedBadge: { position: "absolute", top: 14, right: 16, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#2E7D32", background: "#E8F5E9", padding: "3px 10px", borderRadius: 50 },

  emptyState: { textAlign: "center", padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, color: gray400 },

  // Detail screens
  detailScreen: { fontFamily: font, maxWidth: 430, width: "100%", height: "100dvh", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FFFBFC", overflow: "hidden", position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 50 },
  detailHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 14px", paddingTop: "calc(48px + env(safe-area-inset-top, 0px))", borderBottom: `1px solid ${gray100}`, background: "white", flexShrink: 0, zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, background: gray50, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: gray800 },
  detailTitle: { fontSize: 19, fontWeight: 700, color: gray800 },
  detailBody: { flex: 1, overflow: "auto", overflowY: "scroll", padding: 18, paddingBottom: "calc(180px + env(safe-area-inset-bottom, 34px))", display: "flex", flexDirection: "column", gap: 16, WebkitOverflowScrolling: "touch" },
  detailSection: { marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: gray800, marginBottom: 10, fontFamily: font },

  // Event detail
  eventBanner: { borderRadius: radius, padding: 20, marginBottom: 4 },
  bannerAge: { fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 50, background: "white", display: "inline-block", marginBottom: 10 },
  bannerTitle: { fontSize: 22, fontWeight: 700, fontFamily: display, marginBottom: 10 },
  bannerMeta: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: gray600 },
  hostRow: { display: "flex", alignItems: "center", gap: 12 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14 },
  hostLabel: { fontSize: 11, color: gray400 },
  hostNameLg: { fontSize: 15, fontWeight: 600, color: gray800 },
  attendeeBar: { height: 8, background: gray100, borderRadius: 4, overflow: "hidden" },
  attendeeFill: { height: "100%", borderRadius: 4, transition: "width 0.5s ease" },
  attendeeText: { fontSize: 13, color: gray400, marginTop: 6 },

  // Comments
  commentsSection: { marginTop: 8 },
  commentCard: { display: "flex", gap: 10, padding: "12px 0", borderBottom: `1px solid ${gray100}` },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, background: pinkLight, color: pinkDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  commentBody: { flex: 1 },
  commentTop: { display: "flex", justifyContent: "space-between", marginBottom: 3 },
  commentUser: { fontSize: 13, color: gray800 },
  commentTime: { fontSize: 11, color: gray400 },
  commentText: { fontSize: 13, color: gray600, lineHeight: 1.4 },
  commentInput: { display: "flex", gap: 8, marginTop: 12, position: "sticky", bottom: 0, background: "#FFFBFC", padding: "8px 0" },

  // Messages
  chatList: { display: "flex", flexDirection: "column" },
  chatRow: { display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: `1px solid ${gray100}`, cursor: "pointer", animation: "fadeSlideUp 0.4s ease both" },
  chatAvatar: { width: 48, height: 48, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: gray600, flexShrink: 0 },
  chatInfo: { flex: 1, minWidth: 0 },
  chatTop: { display: "flex", justifyContent: "space-between", marginBottom: 3 },
  chatName: { fontSize: 15, color: gray800 },
  chatTime: { fontSize: 12, color: gray400 },
  chatPreview: { fontSize: 13, color: gray400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, background: pink, color: "white", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" },
  chatHeaderInfo: { textAlign: "center" },
  groupLabel: { display: "block", fontSize: 11, color: gray400 },

  // Chat detail
  messagesBody: { flex: 1, overflow: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 },
  messageBubbleRow: { display: "flex" },
  myBubble: { maxWidth: "78%", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", background: pink, color: "white" },
  theirBubble: { maxWidth: "78%", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  bubbleText: { fontSize: 14, lineHeight: 1.4 },
  bubbleTime: { fontSize: 10, opacity: 0.7, marginTop: 3, display: "block", textAlign: "right" },
  messageInputRow: { display: "flex", gap: 8, padding: "10px 18px", borderTop: `1px solid ${gray100}`, background: "white" },
  msgInput: { flex: 1, padding: "12px 16px", borderRadius: 50, border: `1.5px solid ${gray200}`, fontSize: 14, fontFamily: font, background: gray50 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, background: pink, border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  // Discover
  searchBar: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 50, background: "white", border: `1.5px solid ${gray200}`, marginBottom: 16, color: gray400 },
  searchInput: { flex: 1, border: "none", fontSize: 14, fontFamily: font, background: "none", color: gray800 },
  profileGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  profileCard: { background: "white", borderRadius: radius, padding: 16, textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", cursor: "pointer", position: "relative", animation: "fadeSlideUp 0.4s ease both" },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, background: `linear-gradient(135deg, ${pinkLight}, #FAF0F2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontWeight: 700, fontSize: 18, color: pinkDark },
  adminBadge: { position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#F59E0B", background: "#FEF3C7", padding: "3px 8px", borderRadius: 50 },
  profileName: { fontSize: 14, fontWeight: 700, color: gray800, marginBottom: 4, fontFamily: font },
  profileArea: { display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, color: gray400, marginBottom: 4 },
  profileAges: { fontSize: 12, color: gray600, marginBottom: 8 },
  profileInterests: { display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" },
  interestTag: { fontSize: 10, padding: "3px 8px", borderRadius: 50, background: gray100, color: gray600 },
  interestTagLg: { fontSize: 13, padding: "6px 14px", borderRadius: 50, background: pinkLight, color: pinkDark, fontWeight: 500 },
  interestRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  verifiedDot: { position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, background: "#4CAF50", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, border: "2px solid white", zIndex: 2 },
  verifiedMomTag: { display: "inline-block", fontSize: 10, fontWeight: 600, color: "#2E7D32", background: "#E8F5E9", padding: "3px 8px", borderRadius: 50, marginBottom: 4 },

  // Profile Detail
  profileDetailTop: { textAlign: "center", padding: "12px 0 8px" },
  profileDetailAvatar: { width: 80, height: 80, borderRadius: 40, background: `linear-gradient(135deg, ${pinkLight}, #FAF0F2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontWeight: 700, fontSize: 28, color: pinkDark },
  profileDetailName: { fontSize: 22, fontWeight: 700, color: gray800, fontFamily: display },
  profileDetailArea: { display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 13, color: gray400, marginTop: 4 },
  bioText: { fontSize: 14, lineHeight: 1.6, color: gray600 },
  detailText: { fontSize: 14, color: gray600 },

  // My Profile
  myProfileCard: { textAlign: "center", padding: 24, background: "white", borderRadius: radius, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", marginBottom: 16 },
  myAvatar: { width: 72, height: 72, borderRadius: 36, background: `linear-gradient(135deg, ${pink}, ${pinkDark})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontWeight: 700, fontSize: 24, color: "white" },
  myName: { fontSize: 20, fontWeight: 700, color: gray800, fontFamily: display },
  myArea: { display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 13, color: gray400, marginTop: 4 },
  statRow: { display: "flex", justifyContent: "center", gap: 32, marginTop: 16 },
  stat: { display: "flex", flexDirection: "column", alignItems: "center", fontSize: 12, color: gray400, gap: 2 },
  promptAnswer: { background: gray50, borderRadius: 12, padding: 14, marginBottom: 10 },
  promptQ: { fontSize: 12, fontWeight: 600, color: gray400, marginBottom: 4 },
  promptA: { fontSize: 14, color: gray800, lineHeight: 1.4 },
  menuList: { marginTop: 8, background: "white", borderRadius: radius, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  menuItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 18px", borderBottom: `1px solid ${gray100}`, fontSize: 14, color: gray800, cursor: "pointer" },

  // Admin Apply
  adminHero: { textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  adminHeroTitle: { fontFamily: display, fontSize: 24, color: gray800, lineHeight: 1.3 },
  adminHeroText: { fontSize: 14, color: gray600, lineHeight: 1.5 },
  adminPerks: { display: "flex", flexDirection: "column", gap: 12, padding: 16, background: "white", borderRadius: radius, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" },
  perkRow: { display: "flex", alignItems: "center", gap: 12 },
  perkText: { fontSize: 14, color: gray600 },
  adminCTA: { textAlign: "center", padding: 24, background: "white", borderRadius: radius, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  adminCTAIcon: { width: 48, height: 48, borderRadius: 24, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", color: "#4CAF50" },
  adminCTATitle: { fontSize: 16, fontWeight: 700, color: gray800, fontFamily: font },
  adminCTAText: { fontSize: 13, color: gray600, lineHeight: 1.4 },
  adminApplyBanner: { background: "white", borderRadius: radius, padding: 20, boxShadow: "0 2px 14px rgba(0,0,0,0.06)", border: `1.5px solid #E8F5E9`, display: "flex", flexDirection: "column", gap: 14 },
  adminApplyLeft: { display: "flex", gap: 12, alignItems: "flex-start" },
  adminApplyIconWrap: { width: 44, height: 44, borderRadius: 12, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", color: "#4CAF50", flexShrink: 0 },
  adminApplyTitle: { fontSize: 15, fontWeight: 700, color: gray800, marginBottom: 4, fontFamily: font },
  adminApplyDesc: { fontSize: 12, color: gray600, lineHeight: 1.4 },
  adminApplyBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px 20px", borderRadius: 50, background: `linear-gradient(135deg, #4CAF50, #388E3C)`, color: "white", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: font, boxShadow: "0 4px 12px rgba(76,175,80,0.3)" },
  adminRequirements: { background: "#F8FFF8", borderRadius: 10, padding: 12 },
  adminReqLabel: { fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  adminReqList: { display: "flex", flexDirection: "column", gap: 5 },
  adminReqItem: { fontSize: 12, color: "#4CAF50", fontWeight: 500 },

  // Polls
  pollCard: { background: "white", borderRadius: radius, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", marginBottom: 14 },
  pollGroup: { fontSize: 11, color: gray400, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  pollQuestion: { fontSize: 16, fontWeight: 700, color: gray800, marginBottom: 14, fontFamily: font },
  pollOptions: { display: "flex", flexDirection: "column", gap: 8 },
  pollOption: { position: "relative", display: "flex", alignItems: "center", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${gray200}`, background: "white", cursor: "pointer", overflow: "hidden", fontFamily: font, fontSize: 14, color: gray800, textAlign: "left", width: "100%" },
  pollOptionVoted: { borderColor: pink },
  pollBar: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 10, transition: "width 0.5s ease" },
  pollOptText: { position: "relative", flex: 1, zIndex: 1 },
  pollPct: { position: "relative", fontSize: 13, fontWeight: 600, color: gray400, zIndex: 1 },
  pollCheck: { position: "relative", color: pink, zIndex: 1, marginLeft: 6 },
  pollMeta: { fontSize: 12, color: gray400, marginTop: 12 },

  // Bottom Nav
  bottomNav: { display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0 calc(20px + env(safe-area-inset-bottom, 0px))", background: "white", borderTop: `1px solid ${gray100}`, position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, zIndex: 100 },
  navItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", fontFamily: font, padding: 4, transition: "color 0.2s ease" },
  navLabel: { fontSize: 10, fontWeight: 500 },
  navCreate: { marginTop: -16 },
  createBtn: { width: 48, height: 48, borderRadius: 24, background: "#6B2C3B", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 12px rgba(107,44,59,0.3)" },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MamaSquadsApp />
  </React.StrictMode>,
)
