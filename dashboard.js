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
const chatModal = document.getElementById('chat-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const chatTitle = document.getElementById('chat-title');
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const conversationsList = document.getElementById('conversations-list');
const messageNotification = document.getElementById('message-notification');
const dashboardContainer = document.querySelector('.dashboard-container'); // Main container for event delegation

// --- GLOBAL VARIABLES ---
let currentConversationId = null;
let messageUnsubscribe = null;
let conversationsUnsubscribe = null;

// --- SKELETON TEMPLATE ---
const skeletonCardHTML = `<div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-tag"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text-short"></div><div class="skeleton skeleton-funding"></div></div>`;

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
    proposalsList.innerHTML = skeletonCardHTML.repeat(3);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();
    const savedProposals = userData.savedProposals || [];
    let query = db.collection('businessProposals').orderBy('submittedAt', 'desc');
    if (industry) {
        query = query.where('industry', '==', industry);
    }
    const snapshot = await query.get();
    let proposals = snapshot.docs;
    if (searchTerm) {
        proposals = proposals.filter(doc => doc.data().title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (proposals.length === 0) {
        proposalsList.innerHTML = '<p>No business proposals found matching your criteria.</p>';
        return;
    }
    proposalsList.innerHTML = '';
    for (const doc of proposals) {
        const p = doc.data();
        const isSaved = savedProposals.includes(doc.id);
        const savedClass = isSaved ? 'saved' : '';
        const ownerDoc = await db.collection('users').doc(p.ownerId).get();
        let saveButtonHTML = '';
        if (userData.role === 'investor') {
            saveButtonHTML = `<button class="save-btn ${savedClass}" data-id="${doc.id}"><svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>`;
        }
        const contactButtonHTML = (userData.role === 'investor' && p.ownerId !== currentUser.uid)
            ? `<button class="contact-btn" data-owner-id="${p.ownerId}" data-proposal-id="${doc.id}" data-proposal-title="${p.title}">Contact Owner</button>`
            : '';
        proposalsList.innerHTML += `
            <div class="card proposal-card">
                ${saveButtonHTML}
                <h3>${p.title}</h3>
                <p class="industry">${p.industry}</p>
                <p>${p.description}</p>
                <p class="funding">Funding Required: $${p.fundingRequired.toLocaleString()}</p>
                ${contactButtonHTML}
            </div>`;
    }
};

const fetchAndDisplayInvestors = () => {
    investorsList.innerHTML = skeletonCardHTML.repeat(3);
    db.collection('investorProposals').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (snapshot.empty) { investorsList.innerHTML = '<p>No investors have created a profile yet.</p>'; return; }
        investorsList.innerHTML = '';
        snapshot.forEach((doc) => {
            const i = doc.data();
            investorsList.innerHTML += `<div class="card investor-card"><h3>${i.fullName}</h3><p><b>Bio:</b> ${i.bio}</p><p class="range"><b>Range:</b> ${i.range}</p><p><b>Interested in:</b> ${i.industries}</p></div>`;
        });
    });
};

const fetchAndDisplaySavedProposals = async () => {
    savedProposalsList.innerHTML = skeletonCardHTML.repeat(2);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const savedIds = userDoc.data().savedProposals || [];
    if (savedIds.length === 0) {
        savedProposalsList.innerHTML = '<p>You have not saved any proposals yet.</p>';
        return;
    }
    const proposalsSnapshot = await db.collection('businessProposals').where(firebase.firestore.FieldPath.documentId(), 'in', savedIds).get();
    savedProposalsList.innerHTML = '';
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

const fetchAndDisplayLoans = async () => {
    loansList.innerHTML = skeletonCardHTML.repeat(2);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();
    const snapshot = await db.collection('loanOffers').orderBy('postedAt', 'desc').get();
    if(snapshot.empty) { loansList.innerHTML = '<p>No loan offers posted yet.</p>'; return; }
    loansList.innerHTML = '';
    for (const doc of snapshot.docs) {
        const l = doc.data();
        const applyButtonHTML = (userData.role === 'business_person' && l.posterId !== currentUser.uid)
            ? `<button class="contact-btn" data-banker-id="${l.posterId}" data-loan-id="${doc.id}" data-loan-title="${l.title}">Apply for Loan</button>`
            : '';
        loansList.innerHTML += `
            <div class="card loan-card">
                <h3>${l.title}</h3>
                <p class="bank">by ${l.bankName}</p>
                <p class="rate">Interest Rate: ${l.interestRate}%</p>
                <p>${l.description}</p>
                ${applyButtonHTML}
            </div>`;
    }
};

const fetchAndDisplayArticles = () => {
    articlesList.innerHTML = skeletonCardHTML.repeat(2);
    db.collection('advisorArticles').orderBy('postedAt', 'desc').get().then(snapshot => {
        if(snapshot.empty) { articlesList.innerHTML = '<p>No articles posted yet.</p>'; return; }
        articlesList.innerHTML = '';
        snapshot.forEach(doc => {
            const a = doc.data();
            articlesList.innerHTML += `<div class="card article-card"><h3>${a.title}</h3><p class="content">${a.content}</p><p class="author">By: ${a.authorName}</p></div>`;
        });
    });
};

const fetchAndDisplayConversations = () => {
    if (conversationsUnsubscribe) conversationsUnsubscribe();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    conversationsList.innerHTML = skeletonCardHTML.repeat(2);
    const conversationsRef = db.collection('conversations').where('participants', 'array-contains', currentUser.uid).orderBy('lastUpdate', 'desc');
    conversationsUnsubscribe = conversationsRef.onSnapshot(async (snapshot) => {
        if (snapshot.empty) { conversationsList.innerHTML = '<p>You have no active conversations.</p>'; return; }
        let unreadConversationsExist = false;
        let conversationsHTML = '';
        for (const doc of snapshot.docs) {
            const convo = doc.data();
            const otherParticipantId = convo.participants.find(p => p !== currentUser.uid);
            if (otherParticipantId) {
                const userDoc = await db.collection('users').doc(otherParticipantId).get();
                const otherUserName = userDoc.exists ? userDoc.data().fullName : "Unknown User";
                const isUnread = convo.lastSenderId !== currentUser.uid && (!convo.readBy || !convo.readBy.includes(currentUser.uid));
                if (isUnread) unreadConversationsExist = true;
                conversationsHTML += `<div class="conversation-item ${isUnread ? 'unread' : ''}" data-id="${doc.id}" data-title="${convo.proposalTitle}"><h4 class="${isUnread ? 'unread' : ''}">${convo.proposalTitle}</h4><p>Conversation with ${otherUserName}</p></div>`;
            }
        }
        conversationsList.innerHTML = conversationsHTML;
        messageNotification.style.display = unreadConversationsExist ? 'block' : 'none';
    });
};

const openChatModal = (conversationId, title) => {
    currentConversationId = conversationId;
    chatTitle.textContent = `Chat: ${title}`;
    chatModal.style.display = 'flex';
    const messagesRef = db.collection('conversations').doc(conversationId).collection('messages').orderBy('timestamp');
    messageUnsubscribe = messagesRef.onSnapshot(snapshot => {
        chatMessages.innerHTML = '';
        snapshot.forEach(doc => {
            const msg = doc.data();
            const messageClass = msg.senderId === auth.currentUser.uid ? 'sent' : 'received';
            chatMessages.innerHTML += `<div class="message ${messageClass}">${msg.text}</div>`;
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    db.collection('conversations').doc(conversationId).update({ readBy: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid) });
};

const closeChatModal = () => {
    if (messageUnsubscribe) messageUnsubscribe();
    chatModal.style.display = 'none';
    currentConversationId = null;
    messageInput.value = '';
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
        document.getElementById('idea-form').addEventListener('submit', e => { e.preventDefault(); db.collection('businessProposals').add({ ownerId: uid, ownerName: fullName, title: e.target['idea-title'].value, description: e.target['idea-description'].value, industry: e.target['idea-industry'].value, fundingRequired: Number(e.target['idea-funding'].value), submittedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { alert('Idea submitted!'); e.target.reset(); fetchAndDisplayProposals(); }); });
    } else if (role === 'investor') {
        document.getElementById('investor-form').addEventListener('submit', e => { e.preventDefault(); db.collection('investorProposals').add({ investorId: uid, fullName: fullName, industries: e.target['investor-industries'].value, range: e.target['investor-range'].value, bio: e.target['investor-bio'].value, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { alert('Profile created!'); e.target.reset(); fetchAndDisplayInvestors(); }); });
    } else if (role === 'banker') {
        document.getElementById('loan-form').addEventListener('submit', e => { e.preventDefault(); db.collection('loanOffers').add({ posterId: uid, posterName: fullName, bankName: e.target['bank-name'].value, title: e.target['loan-title'].value, interestRate: Number(e.target['loan-interest'].value), description: e.target['loan-description'].value, postedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { alert('Loan offer posted!'); e.target.reset(); fetchAndDisplayLoans(); }); });
    } else if (role === 'business_advisor') {
        document.getElementById('article-form').addEventListener('submit', e => { e.preventDefault(); db.collection('advisorArticles').add({ authorId: uid, authorName: fullName, title: e.target['article-title'].value, content: e.target['article-content'].value, postedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { alert('Article posted!'); e.target.reset(); fetchAndDisplayArticles(); }); });
    }
};

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                userDetails.textContent = `Hello, ${userData.fullName} (${userData.role})`;
                document.querySelectorAll('.tab-link[data-role="investor"]').forEach(tab => {
                    if (userData.role === 'investor') tab.style.display = 'inline-flex';
                });
                document.querySelectorAll('.tab-link[data-role="messaging-user"]').forEach(tab => {
                    if (['investor', 'business_person', 'banker'].includes(userData.role)) {
                        tab.style.display = 'inline-flex';
                    }
                });
                injectRoleForm(userData.role, user.uid, userData.fullName);
            }
        });
        fetchAndDisplayProposals();
        fetchAndDisplayConversations();
        fetchAndDisplayInvestors();
        fetchAndDisplayLoans();
        fetchAndDisplayArticles();
        fetchAndDisplaySavedProposals();
    } else {
        if (conversationsUnsubscribe) conversationsUnsubscribe();
        window.location.href = 'index.html';
    }
});

dashboardContainer.addEventListener('click', async (e) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const saveButton = e.target.closest('.save-btn');
    if (saveButton) {
        const proposalId = saveButton.dataset.id;
        const userRef = db.collection('users').doc(currentUser.uid);
        if (saveButton.classList.contains('saved')) {
            userRef.update({ savedProposals: firebase.firestore.FieldValue.arrayRemove(proposalId) });
            saveButton.classList.remove('saved');
        } else {
            userRef.update({ savedProposals: firebase.firestore.FieldValue.arrayUnion(proposalId) });
            saveButton.classList.add('saved');
        }
        return;
    }

    const contactProposalButton = e.target.closest('#proposals-list .contact-btn');
    if (contactProposalButton) {
        const ownerId = contactProposalButton.dataset.ownerId;
        const proposalId = contactProposalButton.dataset.proposalId;
        const proposalTitle = contactProposalButton.dataset.proposalTitle;
        const conversationQuery = db.collection('conversations').where('proposalId', '==', proposalId).where('participants', 'array-contains', currentUser.uid);
        const querySnapshot = await conversationQuery.get();
        let existingConversation = null;
        querySnapshot.forEach(doc => {
            if (doc.data().participants.includes(ownerId)) existingConversation = doc;
        });
        if (existingConversation) {
            openChatModal(existingConversation.id, proposalTitle);
        } else {
            const newConversation = await db.collection('conversations').add({ proposalId, proposalTitle, participants: [currentUser.uid, ownerId], lastUpdate: firebase.firestore.FieldValue.serverTimestamp(), readBy: [currentUser.uid] });
            openChatModal(newConversation.id, proposalTitle);
        }
        return;
    }

    const applyLoanButton = e.target.closest('#loans-list .contact-btn');
    if (applyLoanButton) {
        const bankerId = applyLoanButton.dataset.bankerId;
        const loanId = applyLoanButton.dataset.loanId;
        const loanTitle = applyLoanButton.dataset.loanTitle;
        const conversationQuery = db.collection('conversations').where('loanId', '==', loanId).where('participants', 'array-contains', currentUser.uid);
        const querySnapshot = await conversationQuery.get();
        let existingConversation = null;
        querySnapshot.forEach(doc => {
            if (doc.data().participants.includes(bankerId)) existingConversation = doc;
        });
        if (existingConversation) {
            openChatModal(existingConversation.id, `Loan: ${loanTitle}`);
        } else {
            const newConversation = await db.collection('conversations').add({ loanId, proposalTitle: `Loan Application: ${loanTitle}`, participants: [currentUser.uid, bankerId], lastUpdate: firebase.firestore.FieldValue.serverTimestamp(), readBy: [currentUser.uid] });
            openChatModal(newConversation.id, `Loan: ${loanTitle}`);
        }
        return;
    }

    const conversationItem = e.target.closest('.conversation-item');
    if (conversationItem) {
        openChatModal(conversationItem.dataset.id, conversationItem.dataset.title);
    }
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!messageInput.value.trim() || !currentConversationId) return;
    const text = messageInput.value;
    messageInput.value = '';
    const currentUser = auth.currentUser;
    db.collection('conversations').doc(currentConversationId).collection('messages').add({
        text: text,
        senderId: currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    db.collection('conversations').doc(currentConversationId).update({
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
        lastSenderId: currentUser.uid,
        readBy: [currentUser.uid]
    });
});

closeModalBtn.addEventListener('click', closeChatModal);
filterButton.addEventListener('click', () => {
    const industry = document.getElementById('industry-filter').value;
    const searchTerm = document.getElementById('search-input').value;
    fetchAndDisplayProposals(industry, searchTerm);
});
logoutButton.addEventListener('click', () => {
    if (conversationsUnsubscribe) conversationsUnsubscribe();
    auth.signOut();
});