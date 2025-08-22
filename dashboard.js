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

// --- DOM ELEMENT REFERENCES ---
const userDetails = document.getElementById('user-details');
const logoutButton = document.getElementById('logout-button');
const roleSpecificFormsContainer = document.getElementById('role-specific-forms');
const proposalsList = document.getElementById('proposals-list');
const investorsList = document.getElementById('investors-list');
const savedProposalsList = document.getElementById('saved-proposals-list');
const loansList = document.getElementById('loans-list');
const articlesList = document.getElementById('articles-list');
const tabs = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');
const filterButton = document.getElementById('filter-button');

// --- TAB SWITCHING LOGIC ---
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tabContents.forEach(content => {
            content.id === tab.dataset.tab ? content.classList.add('active') : content.classList.remove('active');
        });
    });
});

// --- DATA FETCHING & DISPLAY FUNCTIONS ---
const fetchAndDisplayProposals = async (industry = '', searchTerm = '') => {
    proposalsList.innerHTML = '';
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();
    const savedProposals = userData.savedProposals || [];

    let query = db.collection('businessProposals').orderBy('submittedAt', 'desc');
    if (industry) {
        query = query.where('industry', '==', industry);
    }

    query.get().then((snapshot) => {
        let proposals = snapshot.docs;
        if (searchTerm) {
            proposals = proposals.filter(doc => doc.data().title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (proposals.length === 0) {
            proposalsList.innerHTML = '<p>No business proposals found matching your criteria.</p>';
            return;
        }

        proposals.forEach((doc) => {
            const p = doc.data();
            const isSaved = savedProposals.includes(doc.id);
            const savedClass = isSaved ? 'saved' : '';
            
            let saveButtonHTML = '';
            if (userData.role === 'investor') {
                saveButtonHTML = `
                    <button class="save-btn ${savedClass}" data-id="${doc.id}">
                        <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>`;
            }
            
            proposalsList.innerHTML += `
                <div class="card proposal-card">
                    ${saveButtonHTML}
                    <h3>${p.title}</h3>
                    <p class="industry">${p.industry}</p>
                    <p>${p.description}</p>
                    <p class="funding">Funding Required: $${p.fundingRequired.toLocaleString()}</p>
                </div>`;
        });
    });
};

const fetchAndDisplayInvestors = () => {
    investorsList.innerHTML = '';
    db.collection('investorProposals').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (snapshot.empty) {
            investorsList.innerHTML = '<p>No investors have created a profile yet.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const i = doc.data();
            investorsList.innerHTML += `<div class="card investor-card"><h3>${i.fullName}</h3><p><b>Bio:</b> ${i.bio}</p><p class="range"><b>Range:</b> ${i.range}</p><p><b>Interested in:</b> ${i.industries}</p></div>`;
        });
    });
};

const fetchAndDisplaySavedProposals = async () => {
    savedProposalsList.innerHTML = '';
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const savedIds = userDoc.data().savedProposals || [];

    if (savedIds.length === 0) {
        savedProposalsList.innerHTML = '<p>You have not saved any proposals yet.</p>';
        return;
    }

    const proposalsSnapshot = await db.collection('businessProposals').where(firebase.firestore.FieldPath.documentId(), 'in', savedIds).get();
    
    proposalsSnapshot.forEach(doc => {
        const p = doc.data();
        savedProposalsList.innerHTML += `
            <div class="card proposal-card">
                <h3>${p.title}</h3>
                <p class="industry">${p.industry}</p>
                <p>${p.description}</p>
                <p class="funding">Funding Required: $${p.fundingRequired.toLocaleString()}</p>
            </div>`;
    });
};

const fetchAndDisplayLoans = () => {
    loansList.innerHTML = '';
    db.collection('loanOffers').orderBy('postedAt', 'desc').get().then(snapshot => {
        if(snapshot.empty) {
            loansList.innerHTML = '<p>No loan offers posted yet.</p>';
            return;
        }
        snapshot.forEach(doc => {
            const l = doc.data();
            loansList.innerHTML += `<div class="card loan-card"><h3>${l.title}</h3><p class="bank">by ${l.bankName}</p><p class="rate">Interest Rate: ${l.interestRate}%</p><p>${l.description}</p></div>`;
        });
    });
};

const fetchAndDisplayArticles = () => {
    articlesList.innerHTML = '';
    db.collection('advisorArticles').orderBy('postedAt', 'desc').get().then(snapshot => {
        if(snapshot.empty) {
            articlesList.innerHTML = '<p>No articles posted yet.</p>';
            return;
        }
        snapshot.forEach(doc => {
            const a = doc.data();
            articlesList.innerHTML += `<div class="card article-card"><h3>${a.title}</h3><p class="content">${a.content}</p><p class="author">By: ${a.authorName}</p></div>`;
        });
    });
};

const injectRoleForm = (role, uid, fullName) => {
    let formHTML = '';
    if (role === 'business_person') {
        formHTML = `<div class="feature-container"><h2>Post a New Business Idea</h2><form id="idea-form"><label for="idea-title">Idea Title</label><input type="text" id="idea-title" required><label for="idea-description">Brief Description</label><textarea id="idea-description" rows="4" required></textarea><label for="idea-industry">Industry</label><select id="idea-industry" required><option value="technology">Technology</option><option value="healthcare">Healthcare</option><option value="finance">Finance</option><option value="education">Education</option><option value="retail">Retail</option></select><label for="idea-funding">Funding Required ($)</label><input type="number" id="idea-funding" required><button type="submit">Submit Idea</button></form></div>`;
    } else if (role === 'investor') {
        formHTML = `<div class="feature-container"><h2>Create Your Investor Profile</h2><form id="investor-form"><label for="investor-industries">Industries of Interest</label><input type="text" id="investor-industries" required><label for="investor-range">Investment Range ($)</label><input type="text" id="investor-range" required><label for="investor-bio">Short Bio / Thesis</label><textarea id="investor-bio" rows="3" required></textarea><button type="submit">Create Profile</button></form></div>`;
    } else if (role === 'banker') {
        formHTML = `<div class="feature-container"><h2>Post a New Loan Offer</h2><form id="loan-form"><label for="loan-title">Loan Title / Name</label><input type="text" id="loan-title" required><label for="bank-name">Bank Name</label><input type="text" id="bank-name" required><label for="loan-interest">Interest Rate (%)</label><input type="number" step="0.01" id="loan-interest" required><label for="loan-description">Description</label><textarea id="loan-description" rows="3" required></textarea><button type="submit">Post Loan Offer</button></form></div>`;
    } else if (role === 'business_advisor') {
        formHTML = `<div class="feature-container"><h2>Post New Information or an Article</h2><form id="article-form"><label for="article-title">Article Title</label><input type="text" id="article-title" required><label for="article-content">Content</label><textarea id="article-content" rows="5" required></textarea><button type="submit">Post Article</button></form></div>`;
    }
    roleSpecificFormsContainer.innerHTML = formHTML;
    attachFormListeners(role, uid, fullName);
};

const attachFormListeners = (role, uid, fullName) => {
    if (role === 'business_person') {
        document.getElementById('idea-form').addEventListener('submit', e => { e.preventDefault(); db.collection('businessProposals').add({ ownerId: uid, title: e.target['idea-title'].value, description: e.target['idea-description'].value, industry: e.target['idea-industry'].value, fundingRequired: Number(e.target['idea-funding'].value), submittedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { alert('Idea submitted!'); e.target.reset(); fetchAndDisplayProposals(); }); });
    } else if (role === 'investor') {
        document.getElementById('investor-form').addEventListener('submit', e => { e.preventDefault(); db.collection('investorProposals').add({ investorId: uid, fullName: fullName, industries: e.target['investor-industries'].value, range: e.target['investor-range'].value, bio: e.target['investor-bio'].value, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { alert('Profile created!'); e.target.reset(); fetchAndDisplayInvestors(); }); });
    } else if (role === 'banker') {
        document.getElementById('loan-form').addEventListener('submit', e => { e.preventDefault(); db.collection('loanOffers').add({ title: e.target['loan-title'].value, bankName: e.target['bank-name'].value, interestRate: Number(e.target['loan-interest'].value), description: e.target['loan-description'].value, postedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { alert('Loan offer posted!'); e.target.reset(); fetchAndDisplayLoans(); }); });
    } else if (role === 'business_advisor') {
        document.getElementById('article-form').addEventListener('submit', e => { e.preventDefault(); db.collection('advisorArticles').add({ authorId: uid, authorName: fullName, title: e.target['article-title'].value, content: e.target['article-content'].value, postedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { alert('Article posted!'); e.target.reset(); fetchAndDisplayArticles(); }); });
    }
};

// --- MAIN AUTH LOGIC ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                userDetails.textContent = `Hello, ${userData.fullName} (${userData.role})`;
                document.querySelectorAll('.tab-link[data-role="investor"]').forEach(tab => {
                    if (userData.role === 'investor') tab.style.display = 'inline-flex';
                });
                injectRoleForm(userData.role, user.uid, userData.fullName);
            }
        });
        fetchAndDisplayProposals();
        fetchAndDisplayInvestors();
        fetchAndDisplayLoans();
        fetchAndDisplayArticles();
        fetchAndDisplaySavedProposals();
    } else {
        window.location.href = 'index.html';
    }
});

proposalsList.addEventListener('click', (e) => {
    const saveButton = e.target.closest('.save-btn');
    if (saveButton) {
        const proposalId = saveButton.dataset.id;
        const userRef = db.collection('users').doc(auth.currentUser.uid);
        if (saveButton.classList.contains('saved')) {
            userRef.update({ savedProposals: firebase.firestore.FieldValue.arrayRemove(proposalId) }).then(() => { saveButton.classList.remove('saved'); });
        } else {
            userRef.update({ savedProposals: firebase.firestore.FieldValue.arrayUnion(proposalId) }).then(() => { saveButton.classList.add('saved'); });
        }
    }
});

filterButton.addEventListener('click', () => {
    const industry = document.getElementById('industry-filter').value;
    const searchTerm = document.getElementById('search-input').value;
    fetchAndDisplayProposals(industry, searchTerm);
});

logoutButton.addEventListener('click', () => auth.signOut());