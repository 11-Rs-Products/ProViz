import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

// Initialize Firebase only if config is present
let app;
let auth;
let googleProvider;

try {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
    }
} catch (e) {
    console.error("Firebase initialization error", e);
}

const ALLOWED_DOMAINS = [
    "@ds.study.iitm.ac.in",
    "@es.study.iitm.ac.in",
    "@mg.study.iitm.ac.in",
    "@ae.study.iitm.ac.in",
    "@study.iitm.ac.in",
    "@code.iitm.ac.in",
    "@nptel.iitm.ac.in"
];

function isAllowedEmail(email) {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => lowerEmail.endsWith(domain));
}

export async function loginWithGoogle() {
    if (!auth) throw new Error("Firebase is not configured. Check .env variables.");
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        if (!isAllowedEmail(user.email)) {
            await signOut(auth);
            throw new Error(`Access denied. ${user.email} is not a valid IITM BS email.`);
        }
        
        return user;
    } catch (error) {
        throw error;
    }
}

export async function logoutUser() {
    if (auth) {
        await signOut(auth);
    }
}

export { auth };
