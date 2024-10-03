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

async function getNextUserId(role) {
    console.log('Received role in getNextUserId:', role); // Log received role

    const counterRef = doc(db, 'RoleId', 'Users');
    const counterSnapshot = await getDoc(counterRef);

    let newId;
    if (counterSnapshot.exists()) {
        const currentData = counterSnapshot.data();
        if (role === 'gymowner') { // Adjusted for lowercase comparison
            newId = currentData.gymOwnerId + 1;
            await setDoc(counterRef, { gymOwnerId: newId, trainerId: currentData.trainerId, userId: currentData.userId }, { merge: true });
        } else if (role === 'trainer') {
            newId = currentData.trainerId + 1;
            await setDoc(counterRef, { trainerId: newId, gymOwnerId: currentData.gymOwnerId, userId: currentData.userId }, { merge: true });
        } else if (role === 'user') { // New case for user role
            newId = currentData.userId + 1;
            await setDoc(counterRef, { userId: newId, gymOwnerId: currentData.gymOwnerId, trainerId: currentData.trainerId }, { merge: true });
        } else {
            console.error('Invalid role specified:', role); // Log invalid role for debugging
            throw new Error('Invalid role specified.');
        }
    } else {
        // Initialize the counter if it doesn't exist
        if (role === 'gymowner') {
            newId = 1;
            await setDoc(counterRef, { gymOwnerId: newId, trainerId: 0, userId: 0 });
        } else if (role === 'trainer') {
            newId = 1;
            await setDoc(counterRef, { gymOwnerId: 0, trainerId: newId, userId: 0 });
        } else if (role === 'user') {
            newId = 1;
            await setDoc(counterRef, { gymOwnerId: 0, trainerId: 0, userId: newId });
        } else {
            console.error('Invalid role specified during initialization:', role); // Log invalid role for debugging
            throw new Error('Invalid role specified.');
        }
    }

    return newId;
}



function redirectUser(role) {
    switch (role.toLowerCase()) {
        case 'admin':
            window.location.href = 'Accounts.html';
            break;
        case 'gymowner':
            window.location.href = 'GymForm.html';
            break;
        case 'trainer':
            window.location.href = 'TrainerForm.html';
            break;
        default:
            window.location.href = 'Login.html'; // Default for regular users
            break;
    }
}

// Sign up function
async function signUpWithEmail(username, email, password, role, errorMessageElement, successMessageElement) {
    clearMessages(errorMessageElement, successMessageElement);
    const validRoles = ['gymowner', 'trainer' , 'user']; // Define valid roles
    if (!validRoles.includes(role.toLowerCase())) {
        showMessage(errorMessageElement, '🚫 Invalid role specified. Please choose either Gym Owner or Trainer.', true);
        return;
    }
    if (!isValidEmail(email)) {
        showMessage(errorMessageElement, '🚫 Please enter a valid email address.', true);
        return;
    }

    if (password.length < 6) {
        showMessage(errorMessageElement, '🚫 Password must be at least 6 characters long.', true);
        return;
    }

    try {
        const userId = await getNextUserId(role); // Use the new function
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'Users', userCredential.user.uid), {
            userId,
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
    // Validate email and password
    if (!email || !password) {
        showMessage(errorMessageElement, '🚫 Email and password cannot be empty.', true);
        return;
    }

    if (!isValidEmail(email)) {
        showMessage(errorMessageElement, '🚫 Please enter a valid email address.', true);
        return;
    }

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
            case 'gymowner':
                window.location.href = 'membership.html';
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
        console.error("Sign-in error:", error); // Log full error for debugging
        let errorMsg;
        switch (error.code) {
            case 'auth/user-not-found':
                errorMsg = '🚫 User not found. Please check your email.';
                break;
            case 'auth/wrong-password':
                errorMsg = '🚫 Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMsg = '🚫 Invalid email format. Please enter a valid email.';
                break;
            case 'auth/too-many-requests':
                errorMsg = '🚫 Too many attempts. Please try again later.';
                break;
            default:
                errorMsg = `🚫 Sign-in failed: ${error.message}`;
        }
        showMessage(errorMessageElement, errorMsg, true);
    }
}

// Email validation function
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}        // Password validation
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
