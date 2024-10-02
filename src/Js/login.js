import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// Helper functions
function showMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.style.color = isError ? 'red' : 'green';
        element.style.display = 'block';
    } else {
        console.error("Element not found:", element);
    }
}

function clearMessages(errorElement, successElement) {
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    if (successElement) {
        successElement.textContent = '';
        successElement.style.display = 'none';
    }
}

async function getNextRoleId(role) {
    const counterDoc = await getDoc(doc(db, 'RoleId', role));

    if (!counterDoc.exists()) {
        await setDoc(doc(db, 'Counters', role), { count: 0 });
        return 1;
    }

    const currentCount = counterDoc.data().count;
    const newCount = currentCount + 1;

    await updateDoc(doc(db, 'RoleId', role), { count: newCount });
    return newCount;
}

function redirectUser(role) {
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
            window.location.href = 'Dashboard.html'; // Default for regular users
            break;
    }
}

// Sign up function
async function signUpWithEmail(username, email, password, role, errorMessageElement, successMessageElement) {
    clearMessages(errorMessageElement, successMessageElement);

    if (!isValidEmail(email)) {
        showMessage(errorMessageElement, '🚫 Please enter a valid email address.', true);
        return;
    }

    if (password.length < 6) {
        showMessage(errorMessageElement, '🚫 Password must be at least 6 characters long.', true);
        return;
    }

    try {
        const roleId = await getNextRoleId(role);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'Users', userCredential.user.uid), {
            userId: roleId,
            username,
            email,
            role,
            status: 'Under review'
        });

        showMessage(successMessageElement, `🎉 Awesome! You've signed up successfully, ${username}. Your account is under review.`);
        clearSignUpFields();
        redirectUser(role);
    } catch (error) {
        console.error('Error during signup:', error);
        const errorMsg = error.code === 'auth/email-already-in-use'
            ? '🚫 This email is already in use. Please use a different email address.'
            : `🚫 Oops! There was an issue with your sign-up: ${error.message}`;
        showMessage(errorMessageElement, errorMsg, true);
    }
}

// Clear form fields
function clearSignUpFields() {
    document.getElementById('signupUsername').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('role').value = '';
}

// Sign in function
async function signInWithEmail(email, password, errorMessageElement, successMessageElement) {
    try {
        await setPersistence(auth, browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const userRef = doc(db, 'Users', userCredential.user.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            showMessage(errorMessageElement, `🚫 No user data found in Firestore for UID: ${userCredential.user.uid}.`, true);
            return;
        }

        const userData = userSnapshot.data();
        const role = userData.role;
        const status = userData.status;

        if (status === 'Under review') {
            showMessage(errorMessageElement, `🚫 Your account is currently under review. Please wait for the Admin's approval.`, true);
            return;
        }

        showMessage(successMessageElement, `✅ Welcome back, ${userData.username}! You have logged in successfully.`);

        // Redirect based on user role
        switch (role) {
            case 'gym_owner':
                window.location.href = 'trainer-info.html';
                break;
            case 'trainer':
                window.location.href = 'trainer.html';
                break;
            case 'admin':
                window.location.href = 'Accounts.html';
                break;
            case 'user':
                window.location.href = 'Dashboard.html';
                break;
            default:
                console.warn('Unrecognized role:', role);
                break;
        }

    } catch (error) {
        const errorMsg = error.code === 'auth/user-not-found'
            ? '🚫 User not found. Please check your email.'
            : error.code === 'auth/wrong-password'
                ? '🚫 Incorrect password. Please try again.'
                : `🚫 Sign-in failed: ${error.message}`;
        showMessage(errorMessageElement, errorMsg, true);
        console.error("Sign-in error:", error);
    }
}


        // Email format validation
        function isValidEmail(email) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailPattern.test(email);
        }

        // Password validation
        function validatePassword(password) {
            const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            return regex.test(password);
        }

// Event listeners for forms
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim();
            const password = document.getElementById('loginPassword')?.value;
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');

            if (!email) {
                showMessage(errorMessage, '🚫 Please enter your email address.', true);
                return;
            }

            if (!validatePassword(password)) {
                showMessage(errorMessage, '🚫 Password must be at least 6 characters long.', true);
                return;
            }

            signInWithEmail(email, password, errorMessage, successMessage);
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

            clearMessages(errorMessage, successMessage);

            if (!username || !email || !password || !confirmPassword || !role) {
                showMessage(errorMessage, '🚫 All fields must be filled in! Please complete the form before signing up.', true);
                return;
            }

            if (password !== confirmPassword) {
                showMessage(errorMessage, '🚫 Your passwords do not match. Please try again.', true);
                return;
            }

            if (!validatePassword(password)) {
                showMessage(errorMessage, '🚫 Password must be at least 8 characters long, with an uppercase letter, a digit, and a special character.', true);
                return;
            }

            signUpWithEmail(username, email, password, role, errorMessage, successMessage);
        });
    } else {
        console.error('Signup form with ID "signupForm" not found.');
    }
});
