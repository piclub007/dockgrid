// ===== DOCKGRID FIREBASE CORE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, onSnapshot, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBbrRHlakmOdKwuDGwYAx5qf-e6DOHW7s0",
    authDomain: "joefootball-15e7a.firebaseapp.com",
    projectId: "joefootball-15e7a",
    storageBucket: "joefootball-15e7a.firebasestorage.app",
    messagingSenderId: "976347287101",
    appId: "1:976347287101:web:6cbbb96d496d8221986454"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const COL = {
    USERS: 'DockGrid_Users',
    PAGES: 'DockGrid_Pages',
    WIDGETS: 'DockGrid_Widgets',
    SETTINGS: 'DockGrid_Settings',
    PROJECTS: 'DockGrid_Projects'
};

const IMGBB_KEY = 'ba8023ca74166460c442e8e703d2a1b0';
const DEFAULT_BGS = [
    'https://cdn.pixabay.com/photo/2020/07/25/14/23/cliff-5436923_1280.jpg',
    'https://cdn.pixabay.com/photo/2021/03/23/06/27/cliff-6116449_1280.jpg',
    'https://cdn.pixabay.com/photo/2022/09/16/00/39/city-7457513_1280.jpg',
    'https://cdn.pixabay.com/photo/2017/12/26/02/54/ho-chi-minh-3039579_1280.jpg',
    'https://cdn.pixabay.com/photo/2018/08/19/00/33/camara-de-lobos-city-3615829_1280.jpg',
    'https://cdn.pixabay.com/photo/2024/11/03/12/57/lion-tamarin-9171365_1280.jpg',
    'https://cdn.pixabay.com/photo/2020/06/20/11/09/cat-5320572_1280.jpg'
];

// Global state
window.DG = window.DG || {};
window.DG.FB = { COL, db, auth, doc, setDoc, getDoc, serverTimestamp, collection, onSnapshot, deleteDoc, query, where, IMGBB_KEY, DEFAULT_BGS, app };
window.DG.STATE = {
    currentBg: DEFAULT_BGS[0],
    colCount: 3,
    widgetOpacity: 96,
    widgetsData: [],
    currentUser: null,
    currentPageId: 'default',
    currentPageTitle: 'DockGrid Page',
    editingWidgetId: null,
    projectWidgets: {}
};

// Auth check
onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = 'sign.html'; return; }
    window.DG.STATE.currentUser = user;
    if (typeof window.DG.initApp === 'function') {
        window.DG.initApp(user);
    }
});

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    if (window.DG.STATE.currentUser && typeof window.DG.initApp === 'function') {
        window.DG.initApp(window.DG.STATE.currentUser);
    }
});

console.log('%c🔥 DockGrid Firebase %cReady %cby PIReactive',
    'font-size:16px;font-weight:900;color:#ff6b35;font-family:monospace;',
    'font-size:12px;color:#888;',
    'font-size:11px;color:#555;');
