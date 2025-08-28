// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQAM4oJb72i0fYyREhfHQ-1TSdCMMDi3g",
  authDomain: "launchpad-bacef.firebaseapp.com",
  projectId: "launchpad-bacef",
  storageBucket: "launchpad-bacef.firebasestorage.app",
  messagingSenderId: "447722301108",
  appId: "1:447722301108:web:4e778e4d52977fcb72d9e1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    // Modal Elements
    const authModal = document.getElementById('auth-modal');
    const closeAuthModalBtn = document.getElementById('close-auth-modal');
    const loginBtnNav = document.getElementById('login-btn-nav');
    const signupBtnNav = document.getElementById('signup-btn-nav');
    const getStartedBtn = document.getElementById('get-started-btn');
    
    // Form Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    // --- Modal Logic ---
    const openModal = (showRegister = false) => {
        if (authModal) authModal.style.display = 'flex';
        if (showRegister) {
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
        } else {
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';
        }
    };

    const closeModal = () => {
        if (authModal) authModal.style.display = 'none';
    };

    if (loginBtnNav) loginBtnNav.addEventListener('click', () => openModal(false));
    if (signupBtnNav) signupBtnNav.addEventListener('click', () => openModal(true));
    if (getStartedBtn) getStartedBtn.addEventListener('click', () => openModal(true));
    if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', closeModal);
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeModal();
        });
    }

    // --- Form Toggle Logic ---
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        });
    }

    // --- Firebase Auth Logic ---
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const role = document.getElementById('register-role').value;
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    return db.collection('users').doc(userCredential.user.uid).set({
                        fullName: name, email: email, role: role, savedProposals: [],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    alert('Registration successful! Please log in.');
                    openModal(false);
                })
                .catch((error) => {
                    console.error('Error during registration:', error);
                    alert('Error: ' + error.message);
                });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            auth.signInWithEmailAndPassword(email, password)
                .then(() => { window.location.href = 'dashboard.html'; })
                .catch((error) => {
                    console.error('Error during login:', error);
                    alert('Error: ' + error.message);
                });
        });
    }
    
    initializeMap();
});


// Leaflet.js Map Initialization and Heatmap Logic
function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const heatmapData = [
        [12.9716, 77.5946, 1.0], // Bangalore
        [28.6139, 77.2090, 0.95], // Delhi
        [19.0760, 72.8777, 0.9], // Mumbai
        [17.3850, 78.4867, 0.8], // Hyderabad
        [18.5204, 73.8567, 0.75], // Pune
        [13.0827, 80.2707, 0.7], // Chennai
        [22.5726, 88.3639, 0.6],  // Kolkata
        [23.0225, 72.5714, 0.55], // Ahmedabad
        [30.7333, 76.7794, 0.5],  // Chandigarh
        [26.9124, 75.7873, 0.4],  // Jaipur
        [21.1702, 72.8311, 0.4]   // Surat
    ];

    const currentTheme = localStorage.getItem('theme');
    const isDarkMode = currentTheme === 'dark';

    const lightTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const tileUrl = isDarkMode ? darkTiles : lightTiles;

    const map = L.map('map', { scrollWheelZoom: false }).setView([22.5937, 78.9629], 5);

    L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // UPDATED: More vibrant and visible heatmap settings
    L.heatLayer(heatmapData, {
        minOpacity: 0.6, // Increased minimum opacity for better visibility
        radius: 35,      // Slightly larger radius
        blur: 20,
        maxZoom: 10,
        max: 1.0,
        gradient: {
            0.4: 'blue',
            0.65: 'lime',
            0.8: 'yellow',
            1.0: 'red'
        }
    }).addTo(map);
}