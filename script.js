// Your web app's Firebase configuration
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

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Get references to DOM elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginContainer = document.getElementById('login-form-container');
const registerContainer = document.getElementById('register-form-container');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

// Toggle between login and register forms
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'block';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerContainer.style.display = 'none';
    loginContainer.style.display = 'block';
});

// Handle registration form submission
registerForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User created:', userCredential.user.uid);
            return db.collection('users').doc(userCredential.user.uid).set({
                fullName: name,
                email: email,
                role: role,
                savedProposals: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert('Registration successful! Please log in.');
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'block';
            registerForm.reset(); 
        })
        .catch((error) => {
            console.error('Error during registration:', error);
            alert('Error: ' + error.message);
        });
});

// Handle login form submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User logged in:', userCredential.user.uid);
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error('Error during login:', error);
            alert('Error: ' + error.message);
        });
});