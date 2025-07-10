// script.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Global Firebase variables (will be initialized if __firebase_config is available)
let app;
let auth;
let userId = 'anonymous'; // Default to anonymous

// Access global variables provided by the Canvas environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase if config is present
if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Authenticate with custom token or anonymously
    async function authenticateFirebase() {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
                console.log("Signed in with custom token.");
            } else {
                await signInAnonymously(auth);
                console.log("Signed in anonymously.");
            }
        } catch (error) {
            console.error("Firebase authentication error:", error);
            showToast("Authentication failed. Please try again.");
        }
    }

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            userId = user.uid;
            console.log("User is signed in:", userId);
            document.getElementById('userIdDisplay').textContent = userId;
            document.getElementById('userNameDisplay').textContent = user.email ? user.email.split('@')[0] : 'User'; // Display part of email or default
            showAppContent();
            activatePage('homePage'); // Go to home page after login
        } else {
            // User is signed out
            userId = 'anonymous';
            console.log("User is signed out.");
            showAuthPages();
        }
    });

    // Call authentication on app start
    authenticateFirebase();

} else {
    console.warn("Firebase config not found. Running without Firebase authentication.");
    // If no Firebase config, show app content directly (for development without auth)
    document.addEventListener('DOMContentLoaded', () => {
        showAppContent();
        activatePage('homePage');
        document.getElementById('userIdDisplay').textContent = 'Firebase not configured';
        document.getElementById('userNameDisplay').textContent = 'Guest';
    });
}


// --- UI and Page Management ---
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const appContent = document.getElementById('appContent');
const bottomNav = document.getElementById('bottomNav');

const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const signInBtn = document.getElementById('signInBtn');
const loginErrorDiv = document.getElementById('loginError');

const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const signUpBtn = document.getElementById('signUpBtn');
const registerErrorDiv = document.getElementById('registerError');

const logoutBtn = document.getElementById('logoutBtn');


function showAuthPages() {
    loginPage.classList.remove('hidden');
    registerPage.classList.add('hidden');
    appContent.classList.add('hidden');
    bottomNav.classList.add('hidden');
}

function showAppContent() {
    loginPage.classList.add('hidden');
    registerPage.classList.add('hidden');
    appContent.classList.remove('hidden');
    bottomNav.classList.remove('hidden');
}

function showLoginSection() {
    loginPage.classList.remove('hidden');
    registerPage.classList.add('hidden');
    loginErrorDiv.classList.add('hidden'); // Clear previous errors
    registerErrorDiv.classList.add('hidden'); // Clear previous errors
}

function showRegisterSection() {
    registerPage.classList.remove('hidden');
    loginPage.classList.add('hidden');
    loginErrorDiv.classList.add('hidden'); // Clear previous errors
    registerErrorDiv.classList.add('hidden'); // Clear previous errors
}

function showAuthError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000); // Hide error after 5 seconds
}

// Event Listeners for Auth UI
if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterSection();
    });
}

if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginSection();
    });
}

if (signInBtn && auth) {
    signInBtn.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast('Logged in successfully!');
        } catch (error) {
            console.error("Login error:", error);
            let errorMessage = "Failed to log in. Please check your credentials.";
            if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many failed login attempts. Please try again later.";
            }
            showAuthError(loginErrorDiv, errorMessage);
        }
    });
}

if (signUpBtn && auth) {
    signUpBtn.addEventListener('click', async () => {
        const email = registerEmailInput.value;
        const password = registerPasswordInput.value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showToast('Account created and logged in successfully!');
        } catch (error) {
            console.error("Registration error:", error);
            let errorMessage = "Failed to create account.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Email already in use. Please use a different email or log in.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password is too weak. Please choose a stronger password.";
            }
            showAuthError(registerErrorDiv, errorMessage);
        }
    });
}

if (logoutBtn && auth) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showToast('Logged out successfully!');
        } catch (error) {
            console.error("Logout error:", error);
            showToast('Failed to log out. Please try again.');
        }
    });
}


// JavaScript for toast notifications
let toastTimeout;

function showToast(message) {
    const toast = document.getElementById("toast-notification");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(function(){
        toast.classList.remove("show");
    }, 3000);
}

// JavaScript for main page switching
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    // Function to activate a page and update navigation styling
    function activatePage(pageId) {
        // Deactivate all pages within appContent
        document.querySelectorAll('#appContent .page').forEach(page => page.classList.remove('active'));
        // Activate the selected page
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.add('active');
        }

        // Update navigation active state
        navItems.forEach(item => {
            if (item.dataset.page === pageId) {
                item.classList.add('text-green-600', 'font-bold');
                item.classList.remove('text-gray-500');
            } else {
                item.classList.remove('text-green-600', 'font-bold');
                item.classList.add('text-gray-500');
            }
        });
    }

    // Add click listeners to navigation items
    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            const pageId = item.dataset.page;
            activatePage(pageId);
            showToast(`${item.querySelector('span').textContent} clicked!`);
        });
    });

    // Card tab switching logic
    const virtualCardTab = document.getElementById('virtualCardTab');
    const physicalCardTab = document.getElementById('physicalCardTab');
    const virtualCardContent = document.getElementById('virtualCardContent');
    const physicalCardContent = document.getElementById('physicalCardContent');

    function switchCardTab(contentId) {
        console.log(`Attempting to switch to ${contentId}`); // Debugging log

        // Hide all card content sections
        virtualCardContent.classList.add('hidden');
        physicalCardContent.classList.add('hidden');

        // Show the selected card content section
        const targetContent = document.getElementById(contentId);
        if (targetContent) {
            targetContent.classList.remove('hidden');
            console.log(`Successfully displayed ${contentId}`); // Debugging log
        } else {
            console.error(`Error: Could not find content div with ID: ${contentId}`); // Error log
        }


        // Update tab active state
        virtualCardTab.classList.remove('bg-green-50', 'text-green-600');
        virtualCardTab.classList.add('text-gray-600', 'hover:bg-gray-100');
        physicalCardTab.classList.remove('bg-green-50', 'text-green-600');
        physicalCardTab.classList.add('text-gray-600', 'hover:bg-gray-100');

        if (contentId === 'virtualCardContent') {
            virtualCardTab.classList.add('bg-green-50', 'text-green-600');
            virtualCardTab.classList.remove('text-gray-600', 'hover:bg-gray-100');
        } else {
            physicalCardTab.classList.add('bg-green-50', 'text-green-600');
            physicalCardTab.classList.remove('text-gray-600', 'hover:bg-gray-100');
        }
    }

    // Set initial active card tab
    // This will be called only if the user is already logged in, otherwise auth pages are shown
    if (!auth || !auth.currentUser) {
        // If not authenticated, ensure the initial card tab is set after login/register
        // This is a deferred call, as auth state will handle showing app content first.
    } else {
        switchCardTab('virtualCardContent'); // Virtual Card is active by default
    }


    // LLM Integration for Spending Analysis
    const spendingInput = document.getElementById('spendingInput');
    const analyzeSpendingBtn = document.getElementById('analyzeSpendingBtn');
    const analysisResult = document.getElementById('analysisResult');
    const analysisText = document.getElementById('analysisText');
    const analysisLoading = document.getElementById('analysisLoading');

    if (analyzeSpendingBtn) { // Ensure button exists before adding listener
        analyzeSpendingBtn.addEventListener('click', async () => {
            const prompt = spendingInput.value.trim();
            if (!prompt) {
                showToast('Please enter some spending details to analyze.');
                return;
            }

            analysisResult.classList.add('hidden');
            analysisLoading.classList.remove('hidden');
            analysisText.textContent = ''; // Clear previous results

            try {
                let chatHistory = [];
                chatHistory.push({ role: "user", parts: [{ text: `Analyze the following spending details and provide insights or suggestions. Keep the response concise and helpful, focusing on financial advice. Spending: "${prompt}"` }] });
                const payload = { contents: chatHistory };
                const apiKey = ""; // Leave as empty string for Canvas to provide
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    analysisText.textContent = text;
                    analysisResult.classList.remove('hidden');
                } else {
                    analysisText.textContent = 'Could not get analysis. Please try again.';
                    analysisResult.classList.remove('hidden');
                    console.error('Gemini API response structure unexpected:', result);
                }
            } catch (error) {
                analysisText.textContent = 'Error analyzing spending. Please try again later.';
                analysisResult.classList.remove('hidden');
                console.error('Error calling Gemini API:', error);
            } finally {
                analysisLoading.classList.add('hidden');
            }
        });
    }
});
