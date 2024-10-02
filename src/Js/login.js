import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, setPersistence, browserSessionPersistence ,createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, getDoc, query, where, collection, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function showErrorMessage(element, message) {
    if (element) {
        element.textContent = message;
        element.style.color = 'red'; // Optional
    }
}

function showSuccessMessage(element, message) {
    if (element) {
        element.textContent = message;
        element.style.color = 'green';
        element.style.display = 'block'; // Ensure it is visible
    }
}

// Function to get the next role ID based on role
async function getNextRoleId(role) {
    const counterDoc = await getDoc(doc(db, 'Counters', role));

    if (!counterDoc.exists()) {
        await setDoc(doc(db, 'Counters', role), { count: 0 });
        return 1; // First ID is 1
    }

    const currentCount = counterDoc.data().count;
    const newCount = currentCount + 1;

    await updateDoc(doc(db, 'Counters', role), { count: newCount });
    return newCount; // Return the new ID
}

// Function to sign up with email and password
async function signUpWithEmailorUsername(email, password, username, role, errorMessageElementId, successMessageElementId) {
    const errorMessageElement = document.getElementById(errorMessageElementId);
    const successMessageElement = document.getElementById(successMessageElementId);

    try {
        // Check if username is already taken
        const usernameQuery = query(collection(db, 'Users'), where('username', '==', username));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
            showErrorMessage(errorMessageElement, '🚫 This username is already taken. Please choose another one.');
            return; // Exit if the username exists
        }

        // Check if email is already in use
        const emailQuery = query(collection(db, 'Users'), where('email', '==', email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
            showErrorMessage(errorMessageElement, '🚫 This email is already in use. Please use a different email address.');
            return; // Exit if the email exists
        }

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid; // Get the user ID

        // Save the new user data in Firestore
        await setDoc(doc(db, 'Users', userId), {
            username,
            email, // Save the email to Firestore
            role,
            status: 'Under review' // Default status
        });

        showSuccessMessage(successMessageElement, `🎉 Awesome! You've signed up successfully, ${username}. Your account is under review.`);
        clearSignUpFields();

        // Redirect based on role
        switch (role.toLowerCase()) {
            case 'admin':
                window.location.href = 'Accounts.html';
                break;
            case 'gym_owner':
                window.location.href = 'GymForm.html';
                break;
            case 'trainer':
                window.location.href = 'TrainerForm.html';
                break;
            default:
                window.location.href = 'login.html'; // For regular users
                break;
        }

    } catch (error) {
        showErrorMessage(errorMessageElement, `🚫 Oops! There was an issue with your sign-up: ${error.message}`);
    }
}




// Clear the sign-up form fields
function clearSignUpFields() {
    document.getElementById('signupUsername').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('role').value = '';
}

async function signInWithUsername(username, password, errorMessageElement, successMessageElement) {
    try {
        const normalizedUsername = username.trim().toLowerCase();

        // Fetch the associated user document from Firestore using username
        const userQuery = query(collection(db, 'Users'), where('username', '==', normalizedUsername));
        const querySnapshot = await getDocs(userQuery);

        if (querySnapshot.empty) {
            showErrorMessage(errorMessageElement, `🚫 Sorry, we couldn't find an account with the username "${username}".`);
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const email = userDoc.data().email;

        // Sign in with Firebase Authentication using the retrieved email
        await setPersistence(auth, browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Check user data
        const userRef = doc(db, 'Users', userDoc.id);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            showErrorMessage(errorMessageElement, `🚫 No user data found in Firestore for UID: ${userCredential.user.uid}.`);
            return;
        }

        const userData = userSnapshot.data();
        const role = userData.role;
        const status = userData.status;

        if (status === 'Under review') {
            showErrorMessage(errorMessageElement, `🚫 Your account is currently under review. Please wait for the Admin's approval.`);
            return;
        }

        showSuccessMessage(successMessageElement, `✅ Welcome back, ${userData.username}! You have logged in successfully.`);

        // Redirect based on role
        switch (role) {
            case 'user':
                window.location.href = 'Dashboard.html';
                break;
            case 'gym_owner':
                window.location.href = 'membership.html';
                break;
            case 'admin':
                window.location.href = 'Accounts.html';
                break;
            case 'trainer':
                window.location.href = 'TrainerDash.html';
                break;
            default:
                console.warn('Unrecognized role:', role);
                break;
        }

    } catch (error) {
        // Improved error handling
        if (error.code === 'auth/user-not-found') {
            showErrorMessage(errorMessageElement, '🚫 User not found. Please check your username.');
        } else if (error.code === 'auth/wrong-password') {
            showErrorMessage(errorMessageElement, '🚫 Incorrect password. Please try again.');
        } else if (error.code === 'auth/invalid-email') {
            showErrorMessage(errorMessageElement, '🚫 The email address is not valid.');
        } else {
            showErrorMessage(errorMessageElement, `🚫 Sign-in failed: ${error.message}`);
        }
        console.error("Sign-in error:", error);
    }
}


async function signInWithGoogle(errorMessageElement, successMessageElement) {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Attempt to set username and email input fields
        const usernameInput = document.getElementById('signupUsername');
        const emailInput = document.getElementById('signupEmail');

        if (usernameInput) {
            usernameInput.value = user.email.split('@')[0]; // Set username based on email
        } else {
            console.error('Username input not found.');
        }

        if (emailInput) {
            emailInput.value = user.email; // Set email field
        } else {
            console.error('Email input not found.');
        }

        // Show a success message
        showSuccessMessage(successMessageElement, `✅ Welcome back, ${user.displayName || user.email.split('@')[0]}! Please enter your password and role to continue.`);

    } catch (error) {
        showErrorMessage(errorMessageElement, `🚫 Google sign-in failed: ${error.message}`);
        console.error("Google sign-in error:", error);
    }
}

// Add event listeners for form submissions
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = document.getElementById('loginUsername')?.value.trim();
            const password = document.getElementById('loginPassword')?.value;
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');

            signInWithUsername(username, password, errorMessage, successMessage);
        });
    } else {
        console.error('Login form with ID "loginForm" not found.');
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const username = document.getElementById('signupUsername')?.value.trim();
            const email = document.getElementById('signupEmail')?.value.trim();
            const password = document.getElementById('signupPassword')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            const role = document.getElementById('role')?.value;

            const errorMessage = document.getElementById('signupErrorMessage');
            const successMessage = document.getElementById('signupSuccessMessage');

            if (errorMessage) errorMessage.textContent = '';
            if (successMessage) successMessage.textContent = '';

            let messages = [];

            if (!username || !email || !password || !confirmPassword || !role) {
                messages.push('🚫 All fields must be filled in! Please complete the form before signing up.');
            }

            if (messages.length > 0) {
                showErrorMessage(errorMessage, messages.join(' '));
                return;
            }

            if (password !== confirmPassword) {
                showErrorMessage(errorMessage, '🚫 Your passwords do not match. Please try again.');
                return;
            }

            if (!validatePassword(password)) {
                showErrorMessage(errorMessage, '🚫 Password must be at least 8 characters long, with an uppercase letter, a digit, and a special character.');
                return;
            }

            signUpWithEmailorUsername(email, password, username, role, errorMessage, successMessage);
        });
    } else {
        console.error('Signup form with ID "signupForm" not found.');
    }

    // Add event listener for Google sign-in button
    document.getElementById('googleSignInButton').addEventListener('click', function(event) {
        event.preventDefault();
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
        
        signInWithGoogle(errorMessage, successMessage);
    });
});

// Password validation function
function validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}
