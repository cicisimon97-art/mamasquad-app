import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './supabaseClient'

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
};

// ─── Data ───
const SAMPLE_EVENTS = [
  { id: 1, title: "Toddler Splash Pad Party", location: "Sunflower Park", time: "10:00 AM", date: "Mon", ages: "1-3", host: "Sarah M.", attendees: 8, maxAttendees: 15, comments: [{ user: "Jess K.", text: "Can't wait! Bringing extra towels 🌊", time: "2h ago" }, { user: "Maria T.", text: "Is there shade nearby?", time: "1h ago" }], color: "#FF6B8A" },
  { id: 2, title: "Nature Walk & Scavenger Hunt", location: "Maple Trail", time: "9:30 AM", date: "Tue", ages: "3-5", host: "Emily R.", attendees: 5, maxAttendees: 10, comments: [{ user: "Amy L.", text: "Perfect for my explorer! 🌿", time: "3h ago" }], color: "#4ECDC4" },
  { id: 3, title: "LEGO Build Challenge", location: "Community Center", time: "2:00 PM", date: "Wed", ages: "5-8", host: "Diana P.", attendees: 12, maxAttendees: 20, comments: [], color: "#FFD93D" },
  { id: 4, title: "Baby Sensory Play", location: "Little Stars Studio", time: "11:00 AM", date: "Thu", ages: "0-1", host: "Lisa W.", attendees: 6, maxAttendees: 8, comments: [{ user: "Kate B.", text: "My LO loved this last time!", time: "5h ago" }], color: "#A78BFA" },
  { id: 5, title: "Storytime & Crafts", location: "Public Library", time: "3:00 PM", date: "Fri", ages: "3-5", host: "Priya S.", attendees: 9, maxAttendees: 12, comments: [], color: "#F97316" },
  { id: 6, title: "Soccer Tots", location: "Green Meadow Field", time: "4:00 PM", date: "Sat", ages: "5-8", host: "Rachel H.", attendees: 14, maxAttendees: 18, comments: [{ user: "Meg D.", text: "Bringing oranges for halftime! 🍊", time: "30m ago" }], color: "#10B981" },
  { id: 7, title: "Mom & Baby Yoga", location: "Zen Space", time: "9:00 AM", date: "Sun", ages: "0-1", host: "Nina J.", attendees: 7, maxAttendees: 10, comments: [], color: "#EC4899" },
];

const SAMPLE_MOMS = [
  { id: 1, name: "Sarah Mitchell", avatar: "SM", bio: "Boy mom x2, coffee addict, always looking for outdoor adventures! Former teacher turned SAHM.", ages: "2, 4", interests: ["Outdoors", "Crafts", "Cooking"], area: "Westside", admin: true },
  { id: 2, name: "Emily Rodriguez", avatar: "ER", bio: "Plant-based mama of twins. Love hiking, farmers markets, and messy play!", ages: "3, 3", interests: ["Hiking", "Gardening", "Reading"], area: "Downtown" },
  { id: 3, name: "Diana Park", avatar: "DP", bio: "Engineer by day, LEGO builder by night. My 6yo runs the show.", ages: "6", interests: ["STEM", "Board Games", "Baking"], area: "Eastside", admin: true },
  { id: 4, name: "Lisa Wang", avatar: "LW", bio: "First-time mom figuring it out one day at a time. Love music and baby sensory activities!", ages: "8mo", interests: ["Music", "Yoga", "Photography"], area: "Northside" },
];

const SAMPLE_MESSAGES = [
  { id: 1, name: "Sarah Mitchell", avatar: "SM", lastMsg: "See you at the splash pad tomorrow!", time: "2m", unread: 2 },
  { id: 2, name: "Toddler Group Chat", avatar: "TG", lastMsg: "Emily: Who's bringing snacks?", time: "15m", unread: 5, isGroup: true },
  { id: 3, name: "Diana Park", avatar: "DP", lastMsg: "Thanks for the LEGO set recommendation!", time: "1h", unread: 0 },
  { id: 4, name: "Westside Moms", avatar: "WM", lastMsg: "Lisa: New event posted for Saturday!", time: "3h", unread: 12, isGroup: true },
];

const POLLS = [
  { id: 1, question: "Best time for Saturday playdate?", group: "Westside Moms", options: [{ text: "9:00 AM", votes: 8 }, { text: "10:30 AM", votes: 12 }, { text: "1:00 PM", votes: 5 }], totalVoters: 25, endsIn: "2 days" },
  { id: 2, question: "Where should we meet this week?", group: "Toddler Group", options: [{ text: "Sunflower Park", votes: 6 }, { text: "Community Center", votes: 4 }, { text: "Indoor Playground", votes: 9 }], totalVoters: 19, endsIn: "1 day" },
];

const SAMPLE_GROUPS = [
  { id: 1, name: "Westside Toddler Moms", emoji: "🧸", desc: "For moms with toddlers (1-3) in the Westside area. Weekly park meetups, messy play, and coffee runs!", isPrivate: true, admin: "Sarah Mitchell", adminAvatar: "SM", members: 24, maxMembers: 30, ages: "1-3", area: "Westside", rules: ["Be kind & respectful", "No selling or soliciting", "Keep kids supervised", "RSVP if you commit"], recentActivity: "New event posted 2h ago", color: "#FF6B8A", pendingRequests: [
    { id: 101, name: "Anna Chen", avatar: "AC", bio: "Mom of a 2-year-old. Just moved to Westside!", ages: "2", requestedAt: "1 day ago" },
    { id: 102, name: "Rachel Kim", avatar: "RK", bio: "Twin boys, 18 months. Looking for playdate friends!", ages: "1.5, 1.5", requestedAt: "3 hours ago" },
  ]},
  { id: 2, name: "STEM Kids Collective", emoji: "🔬", desc: "Science experiments, coding for kids, robotics meetups. For curious minds ages 5-8!", isPrivate: true, admin: "Diana Park", adminAvatar: "DP", members: 18, maxMembers: 20, ages: "5-8", area: "Eastside", rules: ["Bring your own supplies when noted", "Ages 5-8 only", "Parents must stay for activities"], recentActivity: "LEGO challenge this Saturday", color: "#4ECDC4", pendingRequests: [
    { id: 103, name: "Priya Sharma", avatar: "PS", bio: "My 6yo is obsessed with dinosaurs and volcanoes!", ages: "6", requestedAt: "5 hours ago" },
  ]},
  { id: 3, name: "Downtown Mama Runners", emoji: "🏃‍♀️", desc: "Stroller-friendly running group! We meet 3x/week for jogs and let the kids play after.", isPrivate: false, admin: "Emily Rodriguez", adminAvatar: "ER", members: 31, maxMembers: 50, ages: "All Ages", area: "Downtown", rules: ["All paces welcome", "Bring water & snacks", "Weather cancellations posted by 7am"], recentActivity: "Morning run tomorrow at 7:30am", color: "#FFD93D", pendingRequests: [] },
  { id: 4, name: "Baby's First Year", emoji: "👶", desc: "Safe space for first-time moms with babies 0-12 months. No judgment, just support.", isPrivate: true, admin: "Lisa Wang", adminAvatar: "LW", members: 15, maxMembers: 15, ages: "0-1", area: "Northside", rules: ["First-time moms preferred", "What's shared here stays here", "No unsolicited advice unless asked", "Nursing/pumping always welcome"], recentActivity: "Sensory play meetup Thursday", color: "#A78BFA", pendingRequests: [
    { id: 104, name: "Maria Torres", avatar: "MT", bio: "Due in 3 weeks! Looking for mom friends before baby arrives.", ages: "expecting", requestedAt: "2 days ago" },
    { id: 105, name: "Jen Liu", avatar: "JL", bio: "4-month-old girl. Sleep-deprived but loving it!", ages: "4mo", requestedAt: "12 hours ago" },
    { id: 106, name: "Sophie Brown", avatar: "SB", bio: "Boy mom, 7 months. Miss adult conversation!", ages: "7mo", requestedAt: "6 hours ago" },
  ]},
  { id: 5, name: "Crafty Mamas", emoji: "🎨", desc: "Arts, crafts, and creative projects for kids of all ages. We share ideas and meet up for craft days!", isPrivate: false, admin: "Sarah Mitchell", adminAvatar: "SM", members: 42, maxMembers: 60, ages: "All Ages", area: "Citywide", rules: ["Share supply lists in advance", "Clean up after projects", "All skill levels welcome"], recentActivity: "Painted rocks event this Sunday", color: "#F97316", pendingRequests: [] },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AGE_FILTERS = ["All Ages", "0-1", "1-3", "3-5", "5-8", "8+"];

const SAMPLE_GROUP_POSTS = [
  { name: "Sarah M.", avatar: "SM", time: "1h ago", type: "playdate", text: "Splash pad playdate this Friday! Bring towels and sunscreen. I'll have extra snacks and juice boxes. Let's do 10am before it gets too hot 🌊☀️", likes: 8, comments: 4, details: { location: "Sunflower Park Splash Pad", time: "Fri 10:00 AM", spots: "8/15 spots" } },
  { name: "Emily R.", avatar: "ER", time: "3h ago", type: "meetup", text: "Anyone want to do a nature walk this weekend? I was thinking Maple Trail — it's shady and stroller-friendly. Let's vote on time!", likes: 12, comments: 6, options: [{ text: "Saturday 9:00 AM", votes: 7 }, { text: "Saturday 10:30 AM", votes: 4 }, { text: "Sunday 9:00 AM", votes: 3 }] },
  { name: "Diana P.", avatar: "DP", time: "5h ago", type: "post", text: "Just found out the community center has free open play on Wednesdays from 2-4pm! It's not on their website yet. Who's in?? 🎉", likes: 15, comments: 9 },
  { name: "Lisa W.", avatar: "LW", time: "1d ago", type: "playdate", text: "Baby sensory session at my house! I set up a mini ball pit, water beads (supervised!), and some texture boards. Moms get coffee ☕", likes: 11, comments: 7, details: { location: "Lisa's home (address in DM)", time: "Thu 11:00 AM", spots: "4/6 spots" } },
  { name: "Sarah M.", avatar: "SM", time: "2d ago", type: "poll", text: "Should we do a group potluck picnic next month? Thinking we could each bring a dish and let the kids run wild at the park 🧺", likes: 22, comments: 14 },
];

const SAMPLE_GROUP_MEETUPS = [
  { title: "Splash Pad Friday", location: "Sunflower Park", time: "10:00 AM", date: "This Fri", proposedBy: "Sarah M.", going: 8, comments: 4, confirmed: true },
  { title: "Nature Walk", location: "Maple Trail", time: "TBD — Voting", date: "This Sat", proposedBy: "Emily R.", going: 5, comments: 6, confirmed: false },
  { title: "Baby Sensory Play", location: "Lisa's home", time: "11:00 AM", date: "This Thu", proposedBy: "Lisa W.", going: 4, comments: 7, confirmed: true },
  { title: "Group Potluck Picnic", location: "TBD — Voting", time: "TBD", date: "Next month", proposedBy: "Sarah M.", going: 0, comments: 14, confirmed: false },
];

const LIFESTYLE_QUESTIONS = [
  "What's your parenting style?",
  "Indoor or outdoor activities?",
  "Morning or afternoon playdates?",
  "What's your go-to snack for the kids?",
  "Coffee or tea mom?",
  "Favorite family weekend activity?",
];

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
  const [tab, setTab] = useState("home");
  const [selectedDay, setSelectedDay] = useState("All");
  const [selectedAge, setSelectedAge] = useState("All Ages");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [showAdminApply, setShowAdminApply] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [groupRequests, setGroupRequests] = useState({});
  const [groups, setGroups] = useState(SAMPLE_GROUPS);
  const [joinedGroups, setJoinedGroups] = useState([3, 5]);
  const [pendingJoins, setPendingJoins] = useState([]);
  const [onboardStep, setOnboardStep] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [votedPolls, setVotedPolls] = useState({});
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [fadeIn, setFadeIn] = useState(true);

  const navigate = useCallback((dest, data) => {
    setFadeIn(false);
    setTimeout(() => {
      if (dest === "event") setSelectedEvent(data);
      else if (dest === "chat") setSelectedChat(data);
      else if (dest === "profile") setSelectedProfile(data);
      else if (dest === "tab") setTab(data);
      else setScreen(data || dest);
      setFadeIn(true);
    }, 150);
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
    const { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (profileError || !profile) {
      // User exists in auth but not in users table — create a basic profile
      const newProfile = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.email.split('@')[0],
      };
      const { error: insertError } = await supabase.from('users').insert(newProfile);
      if (insertError) {
        // If insert fails due to duplicate, try fetching again
        const { data: retryProfile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        if (retryProfile) {
          setUser(retryProfile);
          setIsVerified(retryProfile.is_verified);
          setIsBetaMember(retryProfile.is_founding_member);
          setScreen("main");
          return { success: true };
        }
        return { error: "Could not create your profile: " + insertError.message };
      }

      setUser({ ...newProfile, is_verified: false, is_founding_member: false, kids: [], interests: [] });
      setIsVerified(false);
      setScreen("main");
      return { success: true };
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
    const { email, password, name, area, bio, kids, interests } = userData;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: siteUrl,
      },
    });

    if (authError) {
      setSignupError(authError.message);
      return;
    }

    // If email confirmation is enabled and no session, the user still exists
    if (!authData.user) {
      setSignupError("Signup failed. Please try again.");
      return;
    }

    const userId = authData.user.id;
    const isFoundingMember = !!inviteCode;

    const { error: profileError } = await supabase.from('users').insert({
      id: userId,
      email,
      name,
      area,
      bio,
      kids: kids || [],
      interests,
      is_verified: isFoundingMember,
      is_founding_member: isFoundingMember,
      invite_code: inviteCode,
    });

    if (profileError) {
      setSignupError(profileError.message);
      return;
    }

    // Mark invite code as used
    if (inviteCode) {
      await supabase.from('invite_codes').update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString(),
      }).eq('code', inviteCode);
    }

    setUser({ id: userId, email, name, is_verified: isFoundingMember, is_founding_member: isFoundingMember });

    if (isFoundingMember) {
      setIsVerified(true);
      setIsBetaMember(true);
      navigate("screen", "main");
    } else {
      navigate("screen", "verify");
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
      const { data } = await supabase.from('groups').select('*, group_members(user_id, role)');
      if (data && data.length > 0) {
        const supaGroups = data.map(g => ({
          id: g.id,
          name: g.name,
          emoji: g.emoji || '👥',
          desc: g.description,
          isPrivate: g.is_private,
          admin: g.admin_name,
          adminAvatar: g.admin_name ? g.admin_name.split(' ').map(w => w[0]).join('') : '??',
          adminId: g.admin_id,
          members: g.group_members?.length || 1,
          maxMembers: g.max_members || 30,
          ages: g.age_group || 'All Ages',
          area: g.area || '',
          rules: g.rules || [],
          recentActivity: 'New group',
          color: g.color || '#FF6B8A',
          pendingRequests: [],
          fromSupabase: true,
        }));
        setGroups(prev => [...SAMPLE_GROUPS, ...supaGroups]);
      }
    };
    loadGroups();
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
        setJoinedGroups(prev => [...new Set([...prev, ...memberships.map(m => m.group_id)])]);
      }
      // Pending join requests by this user
      const { data: pendingReqs } = await supabase
        .from('join_requests')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      if (pendingReqs) {
        setPendingJoins(prev => [...new Set([...prev, ...pendingReqs.map(r => r.group_id)])]);
      }
    };
    loadMemberships();
  }, [user]);

  // ─── Create group handler ───
  const handleCreateGroup = async (groupData) => {
    if (!user) return { error: 'Not logged in' };

    const { data, error } = await supabase.from('groups').insert({
      name: groupData.name,
      description: groupData.description,
      area: groupData.area,
      age_group: groupData.ageGroup,
      max_members: groupData.maxMembers || 30,
      is_private: groupData.isPrivate,
      rules: groupData.rules,
      emoji: groupData.emoji || '👥',
      color: groupData.color || '#FF6B8A',
      admin_id: user.id,
      admin_name: user.name || user.email,
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
      admin: user.name || user.email,
      adminAvatar: (user.name || 'U').split(' ').map(w => w[0]).join(''),
      adminId: user.id,
      members: 1,
      maxMembers: data.max_members,
      ages: data.age_group || 'All Ages',
      area: data.area || '',
      rules: data.rules || [],
      recentActivity: 'Just created',
      color: data.color || '#FF6B8A',
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
      user_name: user.name || user.email,
      user_avatar: (user.name || 'U').split(' ').map(w => w[0]).join(''),
      user_bio: user.bio || '',
      child_age: (user.kids && user.kids[0]?.age) || '',
      message,
      status: 'pending',
    });

    if (error) return { error: error.message };
    setPendingJoins(prev => [...prev, groupId]);
    return { success: true };
  };

  // ─── Approve join request handler ───
  const handleApproveRequest = async (requestId, groupId, userId) => {
    await supabase.from('join_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    });

    // Update member count in local state
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, members: (g.members || 0) + 1 } : g
    ));
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
        .select('*, event_rsvps(user_id), comments(id)')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const supaEvents = data.map(e => ({
          id: e.id,
          title: e.title,
          location: e.location,
          time: e.time,
          date: e.date,
          ages: e.ages || 'All Ages',
          host: e.host_name,
          hostId: e.host_id,
          attendees: e.event_rsvps?.length || 0,
          maxAttendees: e.max_attendees || 15,
          comments: [],
          color: e.color || '#FF6B8A',
          description: e.description,
          groupId: e.group_id,
          fromSupabase: true,
        }));
        setEvents(prev => [...SAMPLE_EVENTS, ...supaEvents]);
      }
    };
    loadEvents();
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

    const COLORS = ["#FF6B8A", "#4ECDC4", "#FFD93D", "#A78BFA", "#F97316", "#10B981", "#EC4899"];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const { data, error } = await supabase.from('events').insert({
      title: eventData.title,
      location: eventData.location,
      date: eventData.date,
      time: eventData.time,
      ages: eventData.ages,
      max_attendees: eventData.maxAttendees || 15,
      description: eventData.description,
      host_id: user.id,
      host_name: user.name || user.email,
      group_id: eventData.groupId || null,
      color,
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
      time: data.time,
      date: data.date,
      ages: data.ages || 'All Ages',
      host: user.name || user.email,
      hostId: user.id,
      attendees: 1,
      maxAttendees: data.max_attendees,
      comments: [],
      color,
      description: data.description,
      groupId: data.group_id,
      fromSupabase: true,
    };
    setEvents(prev => [newEvent, ...prev]);
    setJoinedEvents(prev => [...prev, data.id]);

    return { data: newEvent };
  };

  // ─── RSVP handler ───
  const handleRsvp = async (eventId, joining) => {
    if (!user) return;
    if (joining) {
      await supabase.from('event_rsvps').insert({
        event_id: eventId,
        user_id: user.id,
      });
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
      user_name: user.name || user.email,
      text: text.trim(),
    }).select().single();

    if (error) return null;
    return {
      id: data.id,
      user: data.user_name,
      text: data.text,
      time: 'Just now',
      fromSupabase: true,
    };
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
      user_name: user.name || user.email,
      user_avatar: (user.name || 'U').split(' ').map(w => w[0]).join(''),
      days: availability,
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
      .select('*')
      .eq('group_id', groupId)
      .neq('user_id', user.id);
    return (data || []).map(a => ({
      name: a.user_name,
      avatar: a.user_avatar,
      days: a.days || {},
      note: a.note || '',
      fromSupabase: true,
    }));
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
    if (data) return { days: data.days || {}, note: data.note || '' };
    return null;
  };

  // ─── Propose meetup handler ───
  const handleProposeMeetup = async (groupId, proposal) => {
    if (!user) return { error: 'Not logged in' };
    const { data, error } = await supabase.from('meetup_proposals').insert({
      group_id: groupId,
      proposed_by: user.id,
      proposed_by_name: user.name || user.email,
      title: proposal.title,
      description: proposal.description,
      time_options: proposal.timeOptions,
      location_options: proposal.locationOptions,
      status: 'voting',
    }).select().single();

    if (error) return { error: error.message };
    return { data };
  };

  // ─── Load meetup proposals for a group ───
  const loadMeetupProposals = async (groupId) => {
    const { data } = await supabase
      .from('meetup_proposals')
      .select('*, votes(id, user_id, option_type, option_value)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    return data || [];
  };

  // ─── Vote on meetup option ───
  const handleVote = async (proposalId, optionType, optionValue) => {
    if (!user) return;
    // Remove existing vote for this type on this proposal
    await supabase.from('votes')
      .delete()
      .eq('proposal_id', proposalId)
      .eq('user_id', user.id)
      .eq('option_type', optionType);

    // Insert new vote
    await supabase.from('votes').insert({
      proposal_id: proposalId,
      user_id: user.id,
      option_type: optionType,
      option_value: optionValue,
    });
  };

  if (loading) {
    return (
      <div style={{ ...styles.fullScreen, background: "#FFFBFC", justifyContent: "center", alignItems: "center" }}>
        <span style={{ fontSize: 40 }}>🌸</span>
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
    return <VerificationBlockedScreen onVerify={() => navigate("screen", "verify")} />;
  }

  // Main App — only accessible to verified OR beta users
  if (screen === "main" && isVerified) {
    if (selectedEvent) return (
      <EventDetail event={selectedEvent} onBack={() => { setSelectedEvent(null); }} newComment={newComment} setNewComment={setNewComment} joinedEvents={joinedEvents} setJoinedEvents={setJoinedEvents} onRsvp={handleRsvp} onPostComment={handlePostComment} fadeIn={fadeIn} />
    );
    if (selectedChat) return (
      <ChatDetail chat={selectedChat} onBack={() => setSelectedChat(null)} newMessage={newMessage} setNewMessage={setNewMessage} fadeIn={fadeIn} />
    );
    if (selectedProfile) return (
      <ProfileDetail profile={selectedProfile} onBack={() => setSelectedProfile(null)} onMessage={() => { setSelectedProfile(null); setTab("messages"); }} fadeIn={fadeIn} />
    );
    if (showCreateEvent) return <CreateEventScreen onBack={() => setShowCreateEvent(false)} onSubmit={handleCreateEvent} fadeIn={fadeIn} />;
    if (showPoll) return <PollScreen polls={POLLS} votedPolls={votedPolls} setVotedPolls={setVotedPolls} onBack={() => setShowPoll(false)} fadeIn={fadeIn} />;
    if (showAdminApply) return <AdminApplyScreen onBack={() => setShowAdminApply(false)} user={user} fadeIn={fadeIn} />;
    if (showCreateGroup) return <CreateGroupScreen onBack={() => setShowCreateGroup(false)} onSubmit={handleCreateGroup} fadeIn={fadeIn} />;
    if (showDiscover) return (
      <div style={styles.detailScreen}>
        <div style={styles.detailHeader}>
          <button style={styles.backBtn} onClick={() => setShowDiscover(false)}>{Icons.back}</button>
          <h2 style={styles.detailTitle}>Discover Moms</h2>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <DiscoverTab
            onProfileSelect={(p) => { setShowDiscover(false); setSelectedProfile(p); }}
            onAdminApply={() => { setShowDiscover(false); setShowAdminApply(true); }}
          />
        </div>
      </div>
    );
    if (selectedGroup) return (
      <GroupDetailScreen
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
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
        fadeIn={fadeIn}
      />
    );

    return (
      <div style={styles.app}>
        <div style={{ ...styles.mainContent, opacity: fadeIn ? 1 : 0, transition: "opacity 0.15s ease" }}>
          {tab === "home" && (
            <HomeTab
              events={events}
              selectedDay={selectedDay} setSelectedDay={setSelectedDay}
              selectedAge={selectedAge} setSelectedAge={setSelectedAge}
              onEventSelect={(e) => navigate("event", e)}
              onCreateEvent={() => setShowCreateEvent(true)}
              onPoll={() => setShowPoll(true)}
              joinedEvents={joinedEvents}
            />
          )}
          {tab === "discover" && (
            <DiscoverTab
              onProfileSelect={(p) => navigate("profile", p)}
              onAdminApply={() => setShowAdminApply(true)}
            />
          )}
          {tab === "groups" && (
            <GroupsTab
              groups={groups}
              onGroupSelect={(g) => setSelectedGroup(g)}
              onCreateGroup={() => setShowCreateGroup(true)}
              joinedGroups={joinedGroups}
              pendingJoins={pendingJoins}
            />
          )}
          {tab === "messages" && (
            <MessagesTab onChatSelect={(c) => navigate("chat", c)} />
          )}
          {tab === "profile" && (
            <MyProfileTab isBetaMember={isBetaMember} user={user} setUser={setUser} joinedEvents={joinedEvents} joinedGroups={joinedGroups} />
          )}
        </div>
        <BottomNav tab={tab} setTab={setTab} onCreateEvent={() => setShowCreateEvent(true)} />
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
    <div style={{ ...styles.fullScreen, background: "linear-gradient(145deg, #FFF5F7 0%, #FEE2E8 30%, #FECDD6 60%, #FDB4C4 100%)" }}>
      <div style={{ ...styles.welcomeContent, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div style={styles.logoContainer}>
          <div style={styles.logoBubble}>
            <span style={{ fontSize: 44 }}>🌸</span>
          </div>
          <div style={{ ...styles.logoRing, animationDelay: "0s" }} />
          <div style={{ ...styles.logoRing2, animationDelay: "0.5s" }} />
        </div>
        <h1 style={styles.welcomeTitle}>MamaSquads</h1>
        <p style={styles.welcomeSubtitle}>The verified, moms-only community<br />where kids play & friendships bloom</p>
        <div style={{ ...styles.welcomeFeatures, opacity: show ? 1 : 0, transition: "opacity 1s ease 0.4s" }}>
          {["Verified moms only", "ID + background checked", "Safe, trusted playdates"].map((f, i) => (
            <div key={i} style={{ ...styles.welcomeFeature, animationDelay: `${0.6 + i * 0.15}s` }}>
              <span style={styles.featureDot} />{f}
            </div>
          ))}
        </div>
        <button style={styles.primaryBtn} onClick={onContinue}>
          Get Started
        </button>
      </div>
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Verification Blocked Screen (Hard Gate) ───
function VerificationBlockedScreen({ onVerify }) {
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
          MamaSquads is a verified, moms-only community. To protect every child and family, you must complete identity verification before accessing the app.
        </p>
        <div style={{ width: "100%", background: "#FFF8E1", borderRadius: 12, padding: 16, textAlign: "left" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#E65100", marginBottom: 8 }}>You cannot access MamaSquads until you:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Upload a valid government-issued photo ID",
              "Take a live selfie for facial matching",
              "Pass a national background check",
              "Confirm your status as a mother/guardian",
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: "#FFE0B2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#E65100" }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 13, color: "#555" }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: "100%", background: "#FFEBEE", borderRadius: 12, padding: 14, border: "1px solid #FFCDD2" }}>
          <p style={{ fontSize: 12, color: "#C62828", lineHeight: 1.5 }}>
            <strong>Zero tolerance policy:</strong> Unverified profiles cannot view member profiles, events, messages, or any community content. This is non-negotiable — it's how we keep kids safe.
          </p>
        </div>
        <button
          style={{ ...styles.primaryBtn, background: "linear-gradient(135deg, #E65100, #BF360C)", boxShadow: "0 4px 16px rgba(230,81,0,0.3)", width: "100%" }}
          onClick={onVerify}
        >
          Complete Verification Now
        </button>
        <p style={{ fontSize: 11, color: "#ACACAC" }}>Need help? Contact support@mamasquads.com</p>
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
      .eq('is_used', false)
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
          <span style={{ fontSize: 44 }}>🌸</span>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2D2D2D", marginTop: 8 }}>Join MamaSquads</h2>
          <p style={{ fontSize: 14, color: "#888", marginTop: 6, lineHeight: 1.5 }}>Choose how you'd like to get started</p>
        </div>

        {/* Option 1: Invite Code */}
        <div
          style={{
            ...ags.optionCard,
            border: mode === "invite" ? "2px solid #4CAF50" : "2px solid #f0f0f0",
            background: mode === "invite" ? "#F8FFF8" : "white",
          }}
          onClick={() => setMode("invite")}
        >
          <div style={ags.optionHeader}>
            <div style={{ ...ags.optionIcon, background: "#E8F5E9" }}>⭐</div>
            <div style={{ flex: 1 }}>
              <h3 style={ags.optionTitle}>I Have an Invite Code</h3>
              <p style={ags.optionDesc}>For founding members personally invited by CiCi</p>
            </div>
            <div style={{ ...ags.radio, borderColor: mode === "invite" ? "#4CAF50" : "#ddd" }}>
              {mode === "invite" && <div style={{ ...ags.radioDot, background: "#4CAF50" }} />}
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
                    borderColor: codeError ? "#E53935" : codeSuccess ? "#4CAF50" : "#E8E8E8",
                    background: codeSuccess ? "#F1F8E9" : "white",
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
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#2E7D32", marginTop: 4 }}>Welcome, Founding Mom!</p>
                  </div>
                )}
                {!codeSuccess && (
                  <button
                    style={{ ...styles.primaryBtn, background: "linear-gradient(135deg, #4CAF50, #388E3C)", boxShadow: "0 4px 16px rgba(76,175,80,0.3)", marginTop: 4, opacity: checking ? 0.6 : 1 }}
                    onClick={handleCodeSubmit}
                    disabled={checking}
                  >
                    {checking ? "Checking..." : "Redeem Code"}
                  </button>
                )}
              </div>
              <div style={{ marginTop: 12, padding: 12, background: "#F1F8E9", borderRadius: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#2E7D32", marginBottom: 6 }}>Founding member perks:</p>
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
            border: mode === "public" ? "2px solid #FF6B8A" : "2px solid #f0f0f0",
            background: mode === "public" ? "#FFF5F7" : "white",
            marginTop: 12,
          }}
          onClick={() => setMode("public")}
        >
          <div style={ags.optionHeader}>
            <div style={{ ...ags.optionIcon, background: "#FFF0F3" }}>🛡️</div>
            <div style={{ flex: 1 }}>
              <h3 style={ags.optionTitle}>Sign Up as a New Mom</h3>
              <p style={ags.optionDesc}>Full verification to keep our community safe</p>
            </div>
            <div style={{ ...ags.radio, borderColor: mode === "public" ? "#FF6B8A" : "#ddd" }}>
              {mode === "public" && <div style={{ ...ags.radioDot, background: "#FF6B8A" }} />}
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
              <button style={{ ...styles.primaryBtn, marginTop: 12 }} onClick={onPublicSignup}>
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
    <div style={{ ...styles.fullScreen, background: "#FFFBFC", overflow: "auto" }}>
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

  // Controlled form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [children, setChildren] = useState([{ name: "", age: "" }]);
  const [selectedInterests, setSelectedInterests] = useState({});
  const [quickAnswers, setQuickAnswers] = useState({});

  const addChild = () => setChildren(prev => [...prev, { name: "", age: "" }]);
  const removeChild = (index) => setChildren(prev => prev.filter((_, i) => i !== index));
  const updateChild = (index, field, value) => {
    setChildren(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const goNext = async () => {
    if (step >= 3) {
      setSubmitting(true);
      const interests = Object.keys(selectedInterests).filter(k => selectedInterests[k]);
      const kids = children.filter(c => c.name.trim() || c.age.trim());
      await onComplete({ email, password, name, area, bio, kids, interests });
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
              <input style={styles.input} placeholder="Child's name" value={child.name} onChange={e => updateChild(i, "name", e.target.value)} />
              <input style={styles.input} placeholder="Child's age (e.g., 2 years)" value={child.age} onChange={e => updateChild(i, "age", e.target.value)} />
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
    {
      title: "Quick Q's",
      subtitle: "Fun prompts to show your personality",
      fields: (
        <div style={styles.onboardFields}>
          {LIFESTYLE_QUESTIONS.slice(0, 3).map((q, i) => (
            <div key={i} style={styles.promptCard}>
              <p style={styles.promptQuestion}>{q}</p>
              <input style={styles.input} placeholder="Your answer..." value={quickAnswers[i] || ""} onChange={e => setQuickAnswers(a => ({ ...a, [i]: e.target.value }))} />
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
          <div style={{ ...styles.progressFill, width: `${((step + 1) / 4) * 100}%` }} />
        </div>
        <p style={styles.stepLabel}>Step {step + 1} of 4</p>
        <h2 style={styles.onboardTitle}>{s.title}</h2>
        <p style={styles.onboardSubtitle}>{s.subtitle}</p>
        {s.fields}
        {signupError && step >= 3 && (
          <p style={{ fontSize: 13, color: "#E53935", textAlign: "center", marginBottom: 8 }}>{signupError}</p>
        )}
        <button style={{ ...styles.primaryBtn, opacity: submitting ? 0.6 : 1 }} onClick={goNext} disabled={submitting}>
          {submitting ? "Creating account..." : step >= 3 ? "Let's Go! 🎉" : "Continue"}
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
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#FF6B8A" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
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
                  <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="#FF6B8A" strokeWidth="1"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeWidth="1"/></svg>
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
  cameraIcon: { width: 64, height: 64, borderRadius: 32, background: "#FFF0F3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
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
  miniAvatar: { width: 44, height: 44, borderRadius: 22, background: "linear-gradient(135deg, #FF6B8A, #E8526E)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15, flexShrink: 0 },
  verifiedBadgeSmall: { fontSize: 10, fontWeight: 600, color: "#2E7D32", background: "#E8F5E9", padding: "2px 8px", borderRadius: 50 },
};

const verifyKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ─── Home Tab ───
function HomeTab({ events, selectedDay, setSelectedDay, selectedAge, setSelectedAge, onEventSelect, onCreateEvent, onPoll, joinedEvents }) {
  const filtered = (events || SAMPLE_EVENTS).filter(e =>
    (selectedDay === "All" || e.date === selectedDay) &&
    (selectedAge === "All Ages" || e.ages === selectedAge)
  );

  return (
    <div style={styles.tabContent}>
      <div style={styles.homeHeader}>
        <div>
          <p style={styles.greeting}>Good morning! ☀️</p>
          <h1 style={styles.pageTitle}>This Week's Playdates</h1>
        </div>
        <button style={styles.pollBtn} onClick={onPoll}>{Icons.vote} Polls</button>
      </div>

      {/* Day filter */}
      <div style={styles.filterRow}>
        <button
          style={{ ...styles.dayChip, ...(selectedDay === "All" ? styles.dayChipActive : {}) }}
          onClick={() => setSelectedDay("All")}
        >All</button>
        {DAYS.map(d => (
          <button
            key={d}
            style={{ ...styles.dayChip, ...(selectedDay === d ? styles.dayChipActive : {}) }}
            onClick={() => setSelectedDay(d)}
          >{d}</button>
        ))}
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
            <button style={styles.secondaryBtn} onClick={onCreateEvent}>Create One!</button>
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
                <div style={styles.eventTop}>
                  <span style={styles.ageBadge}>{event.ages} yrs</span>
                  <span style={styles.eventDay}>{event.date}</span>
                </div>
                <h3 style={styles.eventTitle}>{event.title}</h3>
                <div style={styles.eventMeta}>
                  <span style={styles.metaItem}>{Icons.location} {event.location}</span>
                  <span style={styles.metaItem}>{Icons.clock} {event.time}</span>
                </div>
                <div style={styles.eventBottom}>
                  <span style={styles.hostName}>by {event.host}</span>
                  <span style={styles.attendeeCount}>
                    {event.attendees}/{event.maxAttendees} going
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
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Event Detail ───
function EventDetail({ event, onBack, newComment, setNewComment, joinedEvents, setJoinedEvents, onRsvp, onPostComment, fadeIn }) {
  const joined = joinedEvents.includes(event.id);
  const [comments, setComments] = useState(event.comments || []);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [localAttendees, setLocalAttendees] = useState(event.attendees);

  // Load comments from Supabase for real events
  useEffect(() => {
    if (!event.fromSupabase) return;
    supabase.from('comments')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setComments(data.map(c => ({
            id: c.id,
            user: c.user_name,
            text: c.text,
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
            <span>{Icons.clock} {event.time} · {event.date}</span>
          </div>
        </div>

        {event.description && (
          <div style={styles.detailSection}>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{event.description}</p>
          </div>
        )}

        <div style={styles.detailSection}>
          <div style={styles.hostRow}>
            <div style={{ ...styles.avatarSmall, background: event.color }}>{event.host.split(" ").map(n => n[0]).join("")}</div>
            <div>
              <p style={styles.hostLabel}>Hosted by</p>
              <p style={styles.hostNameLg}>{event.host}</p>
            </div>
          </div>
        </div>

        <div style={styles.detailSection}>
          <div style={styles.attendeeBar}>
            <div style={{ ...styles.attendeeFill, width: `${(localAttendees / event.maxAttendees) * 100}%`, background: event.color }} />
          </div>
          <p style={styles.attendeeText}>{localAttendees} of {event.maxAttendees} spots filled</p>
        </div>

        <button
          style={{ ...styles.primaryBtn, background: joined ? "#E8F5E9" : undefined, color: joined ? "#2E7D32" : undefined, width: "100%", opacity: rsvpLoading ? 0.6 : 1 }}
          onClick={handleRsvpClick}
          disabled={rsvpLoading}
        >
          {rsvpLoading ? "..." : joined ? "✓ You're Going!" : "Join This Playdate"}
        </button>

        {/* Comments */}
        <div style={styles.commentsSection}>
          <h3 style={styles.sectionTitle}>Comments ({comments.length})</h3>
          {comments.map((c, i) => (
            <div key={c.id || i} style={styles.commentCard}>
              <div style={styles.commentAvatar}>{c.user.split(" ").map(n => n[0]).join("")}</div>
              <div style={styles.commentBody}>
                <div style={styles.commentTop}>
                  <strong style={styles.commentUser}>{c.user}</strong>
                  <span style={styles.commentTime}>{c.time}</span>
                </div>
                <p style={styles.commentText}>{c.text}</p>
              </div>
            </div>
          ))}
          <div style={styles.commentInput}>
            <input
              style={styles.msgInput}
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
            />
            <button style={{ ...styles.sendBtn, opacity: commentLoading ? 0.5 : 1 }} onClick={handleCommentSubmit} disabled={commentLoading}>{Icons.send}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discover Tab ───
function DiscoverTab({ onProfileSelect, onAdminApply }) {
  const [search, setSearch] = useState("");
  const filtered = SAMPLE_MOMS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.interests.some(i => i.toLowerCase().includes(search.toLowerCase())) ||
    m.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.tabContent}>
      <h1 style={styles.pageTitle}>Discover Moms</h1>
      <div style={styles.searchBar}>
        {Icons.search}
        <input style={styles.searchInput} placeholder="Search by name, interest, or area..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={styles.profileGrid}>
        {filtered.map((mom, i) => (
          <div key={mom.id} style={{ ...styles.profileCard, animationDelay: `${i * 0.05}s` }} onClick={() => onProfileSelect(mom)}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div style={styles.profileAvatar}>{mom.avatar}</div>
              <div style={styles.verifiedDot} title="Verified Mom">✓</div>
            </div>
            {mom.admin && <span style={styles.adminBadge}>{Icons.crown} Admin</span>}
            <h3 style={styles.profileName}>{mom.name}</h3>
            <p style={styles.profileArea}>{Icons.location} {mom.area}</p>
            <span style={styles.verifiedMomTag}>✓ Verified Mom</span>
            <p style={styles.profileAges}>Kids: {mom.ages}</p>
            <div style={styles.profileInterests}>
              {mom.interests.slice(0, 2).map(i => (
                <span key={i} style={styles.interestTag}>{i}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

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
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Profile Detail ───
function ProfileDetail({ profile, onBack, onMessage }) {
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
            <div style={styles.profileDetailAvatar}>{profile.avatar}</div>
            <div style={{ ...styles.verifiedDot, width: 24, height: 24, fontSize: 13, right: -2, bottom: -2 }} title="Verified Mom">✓</div>
          </div>
          <span style={{ ...styles.verifiedMomTag, marginTop: 10, fontSize: 12, padding: "4px 12px" }}>✓ Verified Mom</span>
          {profile.admin && <span style={{ ...styles.adminBadge, position: "static", marginTop: 6 }}>{Icons.crown} Community Admin</span>}
          <h2 style={styles.profileDetailName}>{profile.name}</h2>
          <p style={styles.profileDetailArea}>{Icons.location} {profile.area}</p>
        </div>

        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>About</h3>
          <p style={styles.bioText}>{profile.bio}</p>
        </div>

        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Kids Ages</h3>
          <p style={styles.detailText}>{profile.ages}</p>
        </div>

        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Interests & Hobbies</h3>
          <div style={styles.interestRow}>
            {profile.interests.map(i => (
              <span key={i} style={styles.interestTagLg}>{i}</span>
            ))}
          </div>
        </div>

        <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={onMessage}>
          Send Message
        </button>
      </div>
    </div>
  );
}

// ─── Messages Tab ───
function MessagesTab({ onChatSelect }) {
  return (
    <div style={styles.tabContent}>
      <h1 style={styles.pageTitle}>Messages</h1>
      <div style={styles.chatList}>
        {SAMPLE_MESSAGES.map((chat, i) => (
          <div key={chat.id} style={{ ...styles.chatRow, animationDelay: `${i * 0.04}s` }} onClick={() => onChatSelect(chat)}>
            <div style={{ ...styles.chatAvatar, background: chat.isGroup ? "#E8F5E9" : "#FEE2E8" }}>
              {chat.isGroup ? Icons.users : chat.avatar}
            </div>
            <div style={styles.chatInfo}>
              <div style={styles.chatTop}>
                <strong style={styles.chatName}>{chat.name}</strong>
                <span style={styles.chatTime}>{chat.time}</span>
              </div>
              <p style={styles.chatPreview}>{chat.lastMsg}</p>
            </div>
            {chat.unread > 0 && <span style={styles.unreadBadge}>{chat.unread}</span>}
          </div>
        ))}
      </div>
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Chat Detail ───
function ChatDetail({ chat, onBack, newMessage, setNewMessage }) {
  const sampleMsgs = [
    { from: "them", text: "Hey! Are you coming to the playdate tomorrow?", time: "10:30 AM" },
    { from: "me", text: "Yes! Can't wait. Should I bring anything?", time: "10:32 AM" },
    { from: "them", text: "Maybe some extra sunscreen? It's going to be hot!", time: "10:33 AM" },
    { from: "me", text: "Perfect, I'll grab some. See you there! 🌞", time: "10:35 AM" },
  ];

  return (
    <div style={styles.detailScreen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
        <div style={styles.chatHeaderInfo}>
          <strong>{chat.name}</strong>
          {chat.isGroup && <span style={styles.groupLabel}>Group · {Math.floor(Math.random() * 15 + 5)} members</span>}
        </div>
        <div style={{ width: 40 }} />
      </div>
      <div style={styles.messagesBody}>
        {sampleMsgs.map((msg, i) => (
          <div key={i} style={{ ...styles.messageBubbleRow, justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
            <div style={{ ...(msg.from === "me" ? styles.myBubble : styles.theirBubble) }}>
              <p style={styles.bubbleText}>{msg.text}</p>
              <span style={styles.bubbleTime}>{msg.time}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={styles.messageInputRow}>
        <input style={styles.msgInput} placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
        <button style={styles.sendBtn}>{Icons.send}</button>
      </div>
    </div>
  );
}

// ─── My Profile Tab ───
function MyProfileTab({ isBetaMember, user, setUser, joinedEvents, joinedGroups }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editArea, setEditArea] = useState(user?.area || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editChildren, setEditChildren] = useState(() => {
    if (user?.kids && user.kids.length > 0) return user.kids;
    if (user?.kids && user.kids.length > 0) return user.kids;
    return [{ name: "", age: "" }];
  });
  const [editInterests, setEditInterests] = useState(user?.interests || []);

  const displayName = user?.name || "Mom";
  const avatar = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isVerified = user?.is_verified;
  const isFoundingMember = user?.is_founding_member || isBetaMember;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const kids = editChildren.filter(c => c.name.trim() || c.age.trim());
    const updates = {
      name: editName.trim(),
      area: editArea.trim(),
      bio: editBio.trim(),
      kids,
      interests: editInterests,
    };
    await supabase.from('users').update(updates).eq('id', user.id);
    setUser(prev => ({ ...prev, ...updates }));
    setSaving(false);
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
              <input style={{ ...styles.input, flex: 1 }} placeholder="Child's name" value={child.name} onChange={e => setEditChildren(prev => prev.map((c, j) => j === i ? { ...c, name: e.target.value } : c))} />
              <input style={{ ...styles.input, flex: 1 }} placeholder="Age" value={child.age} onChange={e => setEditChildren(prev => prev.map((c, j) => j === i ? { ...c, age: e.target.value } : c))} />
              {i > 0 && (
                <button style={{ background: "none", border: "none", fontSize: 18, color: "#E53935", cursor: "pointer", padding: 4 }} onClick={() => setEditChildren(prev => prev.filter((_, j) => j !== i))}>✕</button>
              )}
            </div>
          ))}
          <button style={styles.addChildBtn} onClick={() => setEditChildren(prev => [...prev, { name: "", age: "" }])}>+ Add another child</button>
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
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <h1 style={styles.pageTitle}>My Profile</h1>
      <div style={styles.myProfileCard}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={styles.myAvatar}>{avatar}</div>
          {isVerified && <div style={{ ...styles.verifiedDot, width: 24, height: 24, fontSize: 13 }} title="Verified">✓</div>}
        </div>
        {isFoundingMember && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#FF8F00", background: "#FFF8E1", padding: "3px 10px", borderRadius: 50, letterSpacing: 0.5 }}>⭐ FOUNDING MEMBER</span>
          </div>
        )}
        {isVerified && <span style={{ ...styles.verifiedMomTag, marginTop: 6, fontSize: 12, padding: "4px 12px" }}>✓ Verified Mom</span>}
        <h2 style={styles.myName}>{displayName}</h2>
        {(user?.area) && <p style={styles.myArea}>{Icons.location} {user.area}</p>}
        <div style={styles.statRow}>
          <div style={styles.stat}><strong>{joinedEvents?.length || 0}</strong><span>Playdates</span></div>
          <div style={styles.stat}><strong>0</strong><span>Connections</span></div>
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
          {user.kids.filter(k => k.name || k.age).map((kid, i) => (
            <p key={i} style={styles.bioText}>{kid.name}{kid.age ? ` (${kid.age})` : ''}</p>
          ))}
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

      <div style={styles.menuList}>
        {[
          { label: "Edit Profile", icon: "✏️", action: () => setEditing(true) },
          { label: "My Children", icon: "👶" },
          { label: "Discover Moms", icon: "🔍" },
          { label: "Notifications", icon: "🔔" },
          { label: "Privacy & Safety", icon: "🔒" },
          { label: "About MamaSquads", icon: "💛" },
          { label: "Sign Out", icon: "👋", action: handleSignOut },
        ].map(item => (
          <div key={item.label} style={styles.menuItem} onClick={item.action || undefined}>
            <span>{item.icon} {item.label}</span>
            <span style={{ color: "#ccc" }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Create Event Screen ───
function CreateEventScreen({ onBack, onSubmit }) {
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
          <input style={styles.input} placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Date (e.g., Mon, Sat)" value={date} onChange={e => setDate(e.target.value)} />
            <input style={{ ...styles.input, flex: 1 }} placeholder="Time (e.g., 10:00 AM)" value={time} onChange={e => setTime(e.target.value)} />
          </div>
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

// ─── Poll Screen ───
function PollScreen({ polls, votedPolls, setVotedPolls, onBack }) {
  return (
    <div style={styles.detailScreen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>{Icons.back}</button>
        <h2 style={styles.detailTitle}>Group Polls</h2>
        <div style={{ width: 40 }} />
      </div>
      <div style={styles.detailBody}>
        {polls.map(poll => {
          const voted = votedPolls[poll.id];
          const maxVotes = Math.max(...poll.options.map(o => o.votes));
          return (
            <div key={poll.id} style={styles.pollCard}>
              <p style={styles.pollGroup}>{poll.group}</p>
              <h3 style={styles.pollQuestion}>{poll.question}</h3>
              <div style={styles.pollOptions}>
                {poll.options.map((opt, i) => {
                  const pct = Math.round((opt.votes / poll.totalVoters) * 100);
                  const isWinning = opt.votes === maxVotes;
                  return (
                    <button
                      key={i}
                      style={{ ...styles.pollOption, ...(voted === i ? styles.pollOptionVoted : {}) }}
                      onClick={() => setVotedPolls(v => ({ ...v, [poll.id]: i }))}
                    >
                      <div style={{ ...styles.pollBar, width: `${pct}%`, background: isWinning ? "#FF6B8A22" : "#f0f0f0" }} />
                      <span style={styles.pollOptText}>{opt.text}</span>
                      <span style={styles.pollPct}>{pct}%</span>
                      {voted === i && <span style={styles.pollCheck}>{Icons.check}</span>}
                    </button>
                  );
                })}
              </div>
              <p style={styles.pollMeta}>{poll.totalVoters} votes · Ends in {poll.endsIn}</p>
            </div>
          );
        })}

        <button style={{ ...styles.secondaryBtn, width: "100%", marginTop: 16 }}>
          Create New Poll
        </button>
      </div>
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
  const [fullName, setFullName] = useState(user?.name || "");
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
      full_name: fullName.trim(),
      area: area.trim(),
      phone: phone.trim(),
      motivation: motivation.trim(),
      network_size: networkSize,
      event_experience: experience,
      references: references.trim(),
      checklist: agreed,
      status: 'pending',
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setSubmitted(true);
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

        <div style={{ background: "#FFF0F3", borderRadius: 12, padding: 14, marginBottom: 4 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#E8526E", marginBottom: 4 }}>⚠️ Admin positions are vetted</p>
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
                background: agreed[req.id] ? "#FF6B8A" : "white",
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
function GroupsTab({ groups, onGroupSelect, onCreateGroup, joinedGroups, pendingJoins }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = (groups || SAMPLE_GROUPS).filter(g => {
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
        <button style={styles.secondaryBtn} onClick={onCreateGroup}>+ Create Group</button>
      </div>

      <div style={styles.searchBar}>
        {Icons.search}
        <input style={styles.searchInput} placeholder="Search groups by name or area..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

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
                    <span style={styles.metaItem}>{Icons.users} {group.members}/{group.maxMembers}</span>
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
      <div style={{ ...styles.adminApplyBanner, marginTop: 16, border: "1.5px solid #FEE2E8" }}>
        <div style={styles.adminApplyLeft}>
          <div style={{ ...styles.adminApplyIconWrap, background: "#FFF0F3" }}>
            {Icons.users}
          </div>
          <div>
            <h3 style={styles.adminApplyTitle}>Looking for individual moms?</h3>
            <p style={styles.adminApplyDesc}>Browse and connect with verified moms in your area on the Discover page.</p>
          </div>
        </div>
      </div>
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Group Detail Screen ───
function GroupDetailScreen({ group, onBack, joinedGroups, setJoinedGroups, pendingJoins, setPendingJoins, groupRequests, setGroupRequests, user, onJoinRequest, onApproveRequest, onDenyRequest, onCreateEvent, onSaveAvailability, loadGroupAvailability, loadMyAvailability, onProposeMeetup, loadMeetupProposals, onVote, fadeIn }) {
  const isMember = joinedGroups.includes(group.id);
  const isPending = pendingJoins.includes(group.id);
  const isAdmin = user ? (group.adminId === user.id || group.admin === user.name) : group.admin === "Sarah Mitchell";
  const [activeSection, setActiveSection] = useState("feed");
  const [requestMessage, setRequestMessage] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSent, setJoinSent] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [showPostPlaydate, setShowPostPlaydate] = useState(false);
  const [showProposeMeetup, setShowProposeMeetup] = useState(false);
  const [pdTitle, setPdTitle] = useState("");
  const [pdLocation, setPdLocation] = useState("");
  const [pdDate, setPdDate] = useState("");
  const [pdTime, setPdTime] = useState("");
  const [pdMax, setPdMax] = useState("");
  const [pdDesc, setPdDesc] = useState("");
  const [pdSubmitting, setPdSubmitting] = useState(false);
  const [mtTitle, setMtTitle] = useState("");
  const [mtDesc, setMtDesc] = useState("");
  const [mtTime1, setMtTime1] = useState("");
  const [mtTime2, setMtTime2] = useState("");
  const [mtTime3, setMtTime3] = useState("");
  const [mtLoc1, setMtLoc1] = useState("");
  const [mtLoc2, setMtLoc2] = useState("");
  const [mtSubmitting, setMtSubmitting] = useState(false);
  const [meetups, setMeetups] = useState([]);
  const [meetupsLoaded, setMeetupsLoaded] = useState(false);
  const [myVotes, setMyVotes] = useState({});
  const [supaRequests, setSupaRequests] = useState([]);
  const [myAvailability, setMyAvailability] = useState({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
  });
  const [myAvailNote, setMyAvailNote] = useState("");

  // Load pending requests from Supabase for admin
  useEffect(() => {
    if (!isAdmin || !group.fromSupabase) return;
    supabase.from('join_requests')
      .select('*')
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
              votes[`${p.id}_${v.option_type}`] = v.option_value;
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
  const pending = group.fromSupabase
    ? supaRequests.map(r => ({
        id: r.id,
        userId: r.user_id,
        name: r.user_name,
        avatar: r.user_avatar,
        bio: r.user_bio || r.message || '',
        ages: r.child_age || '',
        requestedAt: new Date(r.created_at).toLocaleDateString(),
        fromSupabase: true,
      }))
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
        await onJoinRequest(group.id, requestMessage);
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
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginBottom: 6 }}>Tell the admin why you'd like to join:</p>
            <textarea
              style={{ ...styles.input, minHeight: 80, fontFamily: "inherit", marginBottom: 12 }}
              placeholder="Hi! I'd love to join because..."
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
            />
            <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>The admin will see your verified profile, bio, kids' ages, and this message.</p>
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
      <div style={styles.detailBody}>
        {/* Group Banner */}
        <div style={{ ...styles.eventBanner, background: `linear-gradient(135deg, ${group.color}18, ${group.color}35)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {group.isPrivate ? (
              <span style={{ ...gs.privBadge, fontSize: 12, padding: "4px 12px" }}>{Icons.lock} Private Group</span>
            ) : (
              <span style={{ ...gs.pubBadge, fontSize: 12, padding: "4px 12px" }}>{Icons.globe} Public Group</span>
            )}
            <span style={styles.ageBadge}>{group.ages}</span>
          </div>
          <h2 style={{ ...styles.bannerTitle, color: group.color, fontSize: 20 }}>{group.name}</h2>
          <p style={{ fontSize: 13, color: "#666", lineHeight: 1.4, marginBottom: 10 }}>{group.desc}</p>
          <div style={styles.bannerMeta}>
            <span>{Icons.location} {group.area}</span>
            <span>{Icons.users} {group.members} of {group.maxMembers} members</span>
          </div>
        </div>

        {/* Admin info */}
        <div style={styles.hostRow}>
          <div style={{ ...styles.avatarSmall, background: group.color }}>{group.adminAvatar}</div>
          <div>
            <p style={styles.hostLabel}>Group Admin</p>
            <p style={styles.hostNameLg}>{group.admin}</p>
          </div>
          {isAdmin && <span style={{ ...styles.adminBadge, position: "static", marginLeft: "auto" }}>{Icons.crown} You</span>}
        </div>

        {/* Capacity bar */}
        <div>
          <div style={styles.attendeeBar}>
            <div style={{ ...styles.attendeeFill, width: `${(group.members / group.maxMembers) * 100}%`, background: group.color }} />
          </div>
          <p style={styles.attendeeText}>{group.members} of {group.maxMembers} spots filled</p>
        </div>

        {/* Join / Leave / Pending */}
        {!isMember && !isPending && (
          <button
            style={{ ...styles.primaryBtn, width: "100%" }}
            onClick={() => group.isPrivate ? setShowJoinModal(true) : handleJoinRequest()}
          >
            {group.isPrivate ? "🔒 Request to Join" : "Join Group"}
          </button>
        )}
        {isPending && (
          <div style={gs.pendingCard}>
            <span style={{ fontSize: 24 }}>⏳</span>
            <div>
              <strong style={{ fontSize: 14, color: "#E65100", display: "block" }}>Request Pending</strong>
              <span style={{ fontSize: 12, color: "#888" }}>The admin is reviewing your request. You'll be notified once approved.</span>
            </div>
          </div>
        )}
        {isMember && (
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...styles.primaryBtn, flex: 1, background: "#E8F5E9", color: "#2E7D32", boxShadow: "none", cursor: "default" }}>
              ✓ You're a Member
            </button>
            <button style={{ ...styles.secondaryBtn, padding: "12px 16px", background: "#FFF5F5", color: "#C62828" }} onClick={handleLeave}>
              Leave
            </button>
          </div>
        )}

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #f0f0f0", paddingBottom: 0 }}>
          {[
            { id: "feed", label: "Feed" },
            { id: "meetups", label: "Meetups" },
            ...(isMember ? [{ id: "avail", label: "Availability" }] : []),
            { id: "about", label: "About" },
            { id: "rules", label: "Rules" },
            ...(isAdmin && group.isPrivate ? [{ id: "requests", label: `Requests (${pending.length})` }] : []),
          ].map(s => (
            <button
              key={s.id}
              style={{
                ...gs.sectionTab,
                borderBottom: activeSection === s.id ? "2px solid #FF6B8A" : "2px solid transparent",
                color: activeSection === s.id ? "#FF6B8A" : "#999",
              }}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── FEED TAB ── */}
        {activeSection === "feed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isMember ? (
              <>
                {/* Compose box */}
                <div style={gs.composeBox}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <div style={{ ...styles.avatarSmall, background: "#FF6B8A", width: 34, height: 34, fontSize: 12 }}>JD</div>
                    <input
                      style={{ ...styles.input, borderRadius: 50, padding: "10px 16px", fontSize: 13, flex: 1, margin: 0 }}
                      placeholder="Share something with the group..."
                      value={newPost}
                      onChange={e => setNewPost(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={gs.composeAction} onClick={() => setShowPostPlaydate(true)}>📅 Post Playdate</button>
                    <button style={gs.composeAction} onClick={() => setShowProposeMeetup(true)}>📍 Propose Meetup</button>
                    <button style={gs.composeAction}>📸 Photo</button>
                  </div>
                </div>

                {/* Post Playdate inline form */}
                {showPostPlaydate && (
                  <div style={gs.inlineForm}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <strong style={{ fontSize: 14, color: "#2D2D2D" }}>📅 Post a Playdate</strong>
                      <button style={{ background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer" }} onClick={() => setShowPostPlaydate(false)}>✕</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input style={gs.formInput} placeholder="Playdate title (e.g., Park Day!)" value={pdTitle} onChange={e => setPdTitle(e.target.value)} />
                      <input style={gs.formInput} placeholder="Location" value={pdLocation} onChange={e => setPdLocation(e.target.value)} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...gs.formInput, flex: 1 }} placeholder="Date" value={pdDate} onChange={e => setPdDate(e.target.value)} />
                        <input style={{ ...gs.formInput, flex: 1 }} placeholder="Time" value={pdTime} onChange={e => setPdTime(e.target.value)} />
                      </div>
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
                  <div style={gs.inlineForm}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <strong style={{ fontSize: 14, color: "#2D2D2D" }}>📍 Propose a Meetup</strong>
                      <button style={{ background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer" }} onClick={() => setShowProposeMeetup(false)}>✕</button>
                    </div>
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Suggest a meetup and let the group vote on time & place!</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input style={gs.formInput} placeholder="What's the meetup idea?" value={mtTitle} onChange={e => setMtTitle(e.target.value)} />
                      <textarea style={{ ...gs.formInput, minHeight: 50, resize: "vertical" }} placeholder="Any details or context..." value={mtDesc} onChange={e => setMtDesc(e.target.value)} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginTop: 4 }}>Suggest times (members will vote):</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...gs.formInput, flex: 1 }} placeholder="Option 1 (e.g., Sat 10am)" value={mtTime1} onChange={e => setMtTime1(e.target.value)} />
                        <input style={{ ...gs.formInput, flex: 1 }} placeholder="Option 2" value={mtTime2} onChange={e => setMtTime2(e.target.value)} />
                      </div>
                      <input style={gs.formInput} placeholder="Option 3 (optional)" value={mtTime3} onChange={e => setMtTime3(e.target.value)} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginTop: 4 }}>Suggest locations (members will vote):</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...gs.formInput, flex: 1 }} placeholder="Location 1" value={mtLoc1} onChange={e => setMtLoc1(e.target.value)} />
                        <input style={{ ...gs.formInput, flex: 1 }} placeholder="Location 2" value={mtLoc2} onChange={e => setMtLoc2(e.target.value)} />
                      </div>
                      <button
                        style={{ ...styles.primaryBtn, marginTop: 4, opacity: mtSubmitting ? 0.6 : 1 }}
                        disabled={mtSubmitting}
                        onClick={async () => {
                          if (!mtTitle.trim()) return;
                          setMtSubmitting(true);
                          if (onProposeMeetup && group.fromSupabase) {
                            const timeOptions = [mtTime1, mtTime2, mtTime3].map(t => t.trim()).filter(Boolean);
                            const locationOptions = [mtLoc1, mtLoc2].map(l => l.trim()).filter(Boolean);
                            const result = await onProposeMeetup(group.id, {
                              title: mtTitle.trim(),
                              description: mtDesc.trim(),
                              timeOptions,
                              locationOptions,
                            });
                            if (result.data) {
                              setMeetups(prev => [{ ...result.data, votes: [] }, ...prev]);
                            }
                          }
                          setMtSubmitting(false);
                          setMtTitle(""); setMtDesc(""); setMtTime1(""); setMtTime2(""); setMtTime3(""); setMtLoc1(""); setMtLoc2("");
                          setShowProposeMeetup(false);
                        }}
                      >
                        {mtSubmitting ? "Proposing..." : "Propose to Group — Let's Vote! 🗳️"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Sample feed posts */}
                {SAMPLE_GROUP_POSTS.map((post, i) => (
                  <div key={i} style={gs.feedPost}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ ...styles.avatarSmall, background: group.color, width: 36, height: 36, fontSize: 12 }}>{post.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: 13, color: "#2D2D2D" }}>{post.name}</strong>
                          <span style={{ fontSize: 11, color: "#bbb" }}>{post.time}</span>
                        </div>
                        {post.type === "playdate" && <span style={gs.postTypeBadge}>📅 Playdate</span>}
                        {post.type === "meetup" && <span style={{ ...gs.postTypeBadge, background: "#E3F2FD", color: "#1565C0" }}>📍 Meetup Proposal</span>}
                        {post.type === "poll" && <span style={{ ...gs.postTypeBadge, background: "#F3E5F5", color: "#7B1FA2" }}>🗳️ Vote</span>}
                        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5, marginTop: 4 }}>{post.text}</p>
                        {post.details && (
                          <div style={gs.postDetails}>
                            {post.details.location && <span style={gs.postDetailItem}>{Icons.location} {post.details.location}</span>}
                            {post.details.time && <span style={gs.postDetailItem}>{Icons.clock} {post.details.time}</span>}
                            {post.details.spots && <span style={gs.postDetailItem}>{Icons.users} {post.details.spots}</span>}
                          </div>
                        )}
                        {post.type === "meetup" && post.options && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                            {post.options.map((opt, j) => (
                              <button key={j} style={gs.voteOption}>
                                <span>{opt.text}</span>
                                <span style={{ fontSize: 12, color: "#aaa" }}>{opt.votes} votes</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div style={gs.postActions}>
                          <button style={gs.postActionBtn}>❤️ {post.likes}</button>
                          <button style={gs.postActionBtn}>💬 {post.comments}</button>
                          {post.type === "playdate" && <button style={{ ...gs.postActionBtn, color: "#FF6B8A", fontWeight: 600 }}>Join</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

        {/* ── MEETUPS TAB ── */}
        {activeSection === "meetups" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isMember ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={styles.sectionTitle}>Upcoming Meetups</h3>
                  <button style={{ ...styles.secondaryBtn, padding: "8px 14px", fontSize: 12 }} onClick={() => { setActiveSection("feed"); setShowProposeMeetup(true); }}>+ Propose</button>
                </div>
                {/* Supabase meetup proposals */}
                {group.fromSupabase && meetups.map((proposal, i) => {
                  const timeVotes = {};
                  const locVotes = {};
                  (proposal.votes || []).forEach(v => {
                    if (v.option_type === 'time') timeVotes[v.option_value] = (timeVotes[v.option_value] || 0) + 1;
                    if (v.option_type === 'location') locVotes[v.option_value] = (locVotes[v.option_value] || 0) + 1;
                  });
                  const myTimeVote = myVotes[`${proposal.id}_time`];
                  const myLocVote = myVotes[`${proposal.id}_location`];

                  return (
                    <div key={proposal.id} style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0", animation: `fadeSlideUp 0.4s ease both ${i * 0.05}s` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ ...styles.ageBadge, background: proposal.status === 'confirmed' ? "#E8F5E9" : "#FFF3E0", color: proposal.status === 'confirmed' ? "#2E7D32" : "#E65100" }}>
                          {proposal.status === 'confirmed' ? "✓ Confirmed" : "🗳 Voting"}
                        </span>
                        <span style={{ fontSize: 11, color: "#bbb" }}>{new Date(proposal.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2D2D", marginBottom: 4 }}>{proposal.title}</h3>
                      {proposal.description && <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>{proposal.description}</p>}
                      <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>by {proposal.proposed_by_name}</p>

                      {/* Time voting */}
                      {(proposal.time_options || []).length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginBottom: 6 }}>🕐 Vote for time:</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {proposal.time_options.map((opt, j) => {
                              const votes = timeVotes[opt] || 0;
                              const isMyVote = myTimeVote === opt;
                              return (
                                <button
                                  key={j}
                                  style={{
                                    padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                                    border: isMyVote ? `2px solid ${group.color}` : "1.5px solid #E8E8E8",
                                    background: isMyVote ? `${group.color}15` : "white",
                                    color: "#2D2D2D", fontFamily: "'DM Sans', sans-serif",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                  }}
                                  onClick={async () => {
                                    if (onVote) {
                                      await onVote(proposal.id, 'time', opt);
                                      setMyVotes(prev => ({ ...prev, [`${proposal.id}_time`]: opt }));
                                      // Update local vote counts
                                      setMeetups(prev => prev.map(p => {
                                        if (p.id !== proposal.id) return p;
                                        const newVotes = (p.votes || []).filter(v => !(v.user_id === user?.id && v.option_type === 'time'));
                                        newVotes.push({ user_id: user?.id, option_type: 'time', option_value: opt });
                                        return { ...p, votes: newVotes };
                                      }));
                                    }
                                  }}
                                >
                                  <span>{opt}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: group.color }}>{votes} {votes === 1 ? 'vote' : 'votes'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Location voting */}
                      {(proposal.location_options || []).length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#2D2D2D", marginBottom: 6 }}>📍 Vote for location:</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {proposal.location_options.map((opt, j) => {
                              const votes = locVotes[opt] || 0;
                              const isMyVote = myLocVote === opt;
                              return (
                                <button
                                  key={j}
                                  style={{
                                    padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                                    border: isMyVote ? `2px solid ${group.color}` : "1.5px solid #E8E8E8",
                                    background: isMyVote ? `${group.color}15` : "white",
                                    color: "#2D2D2D", fontFamily: "'DM Sans', sans-serif",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                  }}
                                  onClick={async () => {
                                    if (onVote) {
                                      await onVote(proposal.id, 'location', opt);
                                      setMyVotes(prev => ({ ...prev, [`${proposal.id}_location`]: opt }));
                                      setMeetups(prev => prev.map(p => {
                                        if (p.id !== proposal.id) return p;
                                        const newVotes = (p.votes || []).filter(v => !(v.user_id === user?.id && v.option_type === 'location'));
                                        newVotes.push({ user_id: user?.id, option_type: 'location', option_value: opt });
                                        return { ...p, votes: newVotes };
                                      }));
                                    }
                                  }}
                                >
                                  <span>{opt}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: group.color }}>{votes} {votes === 1 ? 'vote' : 'votes'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Sample meetups for demo groups */}
                {!group.fromSupabase && SAMPLE_GROUP_MEETUPS.map((meetup, i) => (
                  <div key={i} style={{ ...styles.eventCard, animation: `fadeSlideUp 0.4s ease both ${i * 0.05}s` }}>
                    <div style={{ ...styles.eventAccent, background: group.color }} />
                    <div style={styles.eventBody}>
                      <div style={styles.eventTop}>
                        <span style={{ ...styles.ageBadge, background: meetup.confirmed ? "#E8F5E9" : "#FFF3E0", color: meetup.confirmed ? "#2E7D32" : "#E65100" }}>
                          {meetup.confirmed ? "✓ Confirmed" : "🗳 Voting"}
                        </span>
                        <span style={styles.eventDay}>{meetup.date}</span>
                      </div>
                      <h3 style={styles.eventTitle}>{meetup.title}</h3>
                      <div style={styles.eventMeta}>
                        <span style={styles.metaItem}>{Icons.location} {meetup.location}</span>
                        <span style={styles.metaItem}>{Icons.clock} {meetup.time}</span>
                      </div>
                      <div style={styles.eventBottom}>
                        <span style={styles.hostName}>by {meetup.proposedBy}</span>
                        <span style={styles.attendeeCount}>{meetup.going} going</span>
                      </div>
                    </div>
                  </div>
                ))}
                {group.fromSupabase && meetups.length === 0 && (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <span style={{ fontSize: 32 }}>📍</span>
                    <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>No meetups proposed yet. Be the first!</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: "#F5F5F5", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <span style={{ fontSize: 36 }}>🔒</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D", marginTop: 10 }}>Members Only</p>
                <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Join this group to see and propose meetups.</p>
              </div>
            )}
          </div>
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

        {/* ── ABOUT TAB ── */}
        {activeSection === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <h3 style={styles.sectionTitle}>Age Group</h3>
              <span style={{ ...styles.interestTagLg }}>{group.ages} years</span>
            </div>
            <div>
              <h3 style={styles.sectionTitle}>Recent Activity</h3>
              <p style={{ fontSize: 13, color: "#666" }}>{group.recentActivity}</p>
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
            {group.isPrivate && !isMember && (
              <div style={{ background: "#F5F5F5", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <span style={{ fontSize: 28 }}>🔒</span>
                <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>Member list, events, and discussions are only visible to approved members.</p>
              </div>
            )}
          </div>
        )}

        {activeSection === "rules" && (
          <div>
            <h3 style={styles.sectionTitle}>Group Rules</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.rules.map((rule, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: `${group.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: group.color }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: "#444", lineHeight: 1.4 }}>{rule}</span>
                </div>
              ))}
            </div>
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
                        <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Kids: {req.ages}</p>
                        <p style={{ fontSize: 13, color: "#555", marginTop: 4, lineHeight: 1.4 }}>{req.bio}</p>
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
                      <button style={gs.viewProfileBtn}>
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Availability Section ───
const TIME_SLOTS = ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)", "Evening (4-7)"];
const AVAIL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MEMBERS_AVAILABILITY = [
  { name: "Sarah M.", avatar: "SM", days: { Mon: ["Morning (8-11)", "Midday (11-1)"], Tue: [], Wed: ["Morning (8-11)"], Thu: ["Morning (8-11)", "Midday (11-1)"], Fri: ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)"], Sat: ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)", "Evening (4-7)"], Sun: ["Midday (11-1)"] }, note: "Flexible on Fridays! No Tuesdays — gymnastics" },
  { name: "Emily R.", avatar: "ER", days: { Mon: ["Afternoon (1-4)"], Tue: ["Morning (8-11)", "Midday (11-1)"], Wed: ["Afternoon (1-4)"], Thu: [], Fri: ["Morning (8-11)"], Sat: ["Morning (8-11)", "Midday (11-1)"], Sun: ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)"] }, note: "WFH Mon/Wed so afternoons only those days" },
  { name: "Diana P.", avatar: "DP", days: { Mon: [], Tue: [], Wed: ["Evening (4-7)"], Thu: [], Fri: ["Evening (4-7)"], Sat: ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)", "Evening (4-7)"], Sun: ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)"] }, note: "Work weekdays — weekends are best!" },
  { name: "Lisa W.", avatar: "LW", days: { Mon: ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)"], Tue: ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)"], Wed: ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)"], Thu: ["Morning (8-11)", "Midday (11-1)"], Fri: ["Morning (8-11)", "Midday (11-1)", "Afternoon (1-4)"], Sat: ["Morning (8-11)"], Sun: [] }, note: "Baby naps 2-4 Thu, so mornings better. Sundays are family day" },
];

function AvailabilitySection({ myAvailability, setMyAvailability, myAvailNote, setMyAvailNote, groupColor, groupId, onSaveAvailability, loadGroupAvailability, loadMyAvailability }) {
  const [editMode, setEditMode] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [selectedOverlapDay, setSelectedOverlapDay] = useState(null);
  const [membersAvail, setMembersAvail] = useState(groupId ? [] : MEMBERS_AVAILABILITY);
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const COLORS = ["#FF6B8A", "#4ECDC4", "#FFD93D", "#A78BFA", "#F97316", "#10B981", "#EC4899", "#3B82F6"];
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
          <input style={styles.input} placeholder="Area / Neighborhood" value={area} onChange={e => setArea(e.target.value)} />
          <select style={styles.input} value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
            <option>All Ages</option>
            <option>0-1 years</option>
            <option>1-3 years</option>
            <option>3-5 years</option>
            <option>5-8 years</option>
            <option>8+ years</option>
          </select>
          <input style={styles.input} placeholder="Max members (e.g., 30)" type="number" value={maxMembers} onChange={e => setMaxMembers(e.target.value)} />

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
  modal: { width: "100%", maxWidth: 430, background: "white", borderRadius: "20px 20px 0 0", padding: 24, maxHeight: "85vh", overflow: "auto" },
  privacyToggle: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#FAFAFA", borderRadius: 12, border: "1.5px solid #E8E8E8" },
  toggle: { width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", transition: "background 0.2s ease", flexShrink: 0 },
  toggleDot: { width: 20, height: 20, borderRadius: 10, background: "white", position: "absolute", top: 2, transition: "transform 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" },
  composeBox: { background: "white", borderRadius: 16, padding: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0" },
  composeAction: { padding: "7px 12px", borderRadius: 50, background: "#F5F5F5", border: "none", fontSize: 12, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  inlineForm: { background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 14px rgba(0,0,0,0.06)", border: "1.5px solid #E8E8E8" },
  formInput: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#2D2D2D", background: "white" },
  feedPost: { background: "white", borderRadius: 16, padding: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #f5f5f5" },
  postTypeBadge: { display: "inline-block", fontSize: 10, fontWeight: 600, color: "#E8526E", background: "#FFF0F3", padding: "2px 8px", borderRadius: 50, marginTop: 4 },
  postDetails: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8, padding: "8px 12px", background: "#FAFAFA", borderRadius: 10 },
  postDetailItem: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#666" },
  postActions: { display: "flex", gap: 12, marginTop: 10, paddingTop: 8, borderTop: "1px solid #f5f5f5" },
  postActionBtn: { background: "none", border: "none", fontSize: 13, color: "#999", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "2px 0" },
  voteOption: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", background: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#2D2D2D", width: "100%", textAlign: "left" },
};

// ─── Bottom Nav ───
function BottomNav({ tab, setTab, onCreateEvent }) {
  const tabs = [
    { id: "home", icon: Icons.home, label: "Home" },
    { id: "groups", icon: Icons.group, label: "Groups" },
    { id: "create", icon: Icons.plus, label: "Create" },
    { id: "messages", icon: Icons.chat, label: "Chat" },
    { id: "profile", icon: Icons.user, label: "Profile" },
  ];

  return (
    <div style={styles.bottomNav}>
      {tabs.map(t => (
        <button
          key={t.id}
          style={{
            ...styles.navItem,
            ...(t.id === "create" ? styles.navCreate : {}),
            color: tab === t.id ? "#FF6B8A" : "#999",
          }}
          onClick={() => t.id === "create" ? onCreateEvent() : setTab(t.id)}
        >
          {t.id === "create" ? (
            <div style={styles.createBtn}>{t.icon}</div>
          ) : (
            <>
              {t.icon}
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
const pink = "#FF6B8A";
const pinkLight = "#FFF0F3";
const pinkDark = "#E8526E";
const gray50 = "#FAFAFA";
const gray100 = "#F5F5F5";
const gray200 = "#E8E8E8";
const gray400 = "#ACACAC";
const gray600 = "#666";
const gray800 = "#2D2D2D";
const radius = 16;

const styles = {
  app: { fontFamily: font, maxWidth: 430, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", background: "#FFFBFC", position: "relative", overflow: "hidden" },
  fullScreen: { fontFamily: font, maxWidth: 430, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" },
  mainContent: { flex: 1, overflow: "auto", paddingBottom: 80 },
  tabContent: { padding: "16px 18px" },

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
  progressFill: { height: "100%", background: pink, borderRadius: 2, transition: "width 0.4s ease" },
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
  greeting: { fontSize: 13, color: gray400, marginBottom: 2 },
  pageTitle: { fontFamily: display, fontSize: 24, color: gray800, marginBottom: 12 },
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
  detailScreen: { fontFamily: font, maxWidth: 430, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", background: "#FFFBFC" },
  detailHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${gray100}`, background: "white", position: "sticky", top: 0, zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, background: gray50, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: gray800 },
  detailTitle: { fontSize: 16, fontWeight: 600, color: gray800 },
  detailBody: { flex: 1, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 16 },
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
  profileAvatar: { width: 56, height: 56, borderRadius: 28, background: `linear-gradient(135deg, ${pinkLight}, #FFD5DD)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontWeight: 700, fontSize: 18, color: pinkDark },
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
  profileDetailAvatar: { width: 80, height: 80, borderRadius: 40, background: `linear-gradient(135deg, ${pinkLight}, #FFD5DD)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontWeight: 700, fontSize: 28, color: pinkDark },
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
  bottomNav: { display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0 20px", background: "white", borderTop: `1px solid ${gray100}`, position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, zIndex: 100 },
  navItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", fontFamily: font, padding: 4, transition: "color 0.2s ease" },
  navLabel: { fontSize: 10, fontWeight: 500 },
  navCreate: { marginTop: -16 },
  createBtn: { width: 48, height: 48, borderRadius: 24, background: `linear-gradient(135deg, ${pink}, ${pinkDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: `0 4px 12px ${pink}44` },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MamaSquadsApp />
  </React.StrictMode>,
)
