import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, query, where, collection } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// Function to get the next unique role ID
async function getNextRoleId() {
    const usersSnapshot = await getDocs(collection(db, 'Users'));
    return usersSnapshot.size; // Magkuha sa total count sa users ug magamit kini as unique ID
}

// Function to sign up with email and password
async function signUpWithEmailorUsername(email, password, username, role, errorMessageElement, successMessageElement) {
    try {
        // Check if the username already exists
        const usernameQuery = query(collection(db, 'Users'), where('username', '==', username));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
            showErrorMessage(errorMessageElement, '🚫 This username is already taken. Please choose another one.');
            return; // Exit if the username exists
        }

        // If the username is 'Admin', set role to 'admin' and ignore role input
        if (username.toLowerCase() === 'admin') {
            role = 'admin'; // Set role to 'admin' for Admin username
        }

        // Proceed with user creation
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Get the next unique user ID
        const nextuserId = await getNextRoleId();

        let initialStatus = 'Under review'; // Default status for all roles

        // Save user data to Firestore in the 'Users' collection
        await setDoc(doc(db, 'Users', userId), {
            username,
            email,
            role, // Role will be 'admin' if the username is 'Admin'
            userId: nextuserId, // Unique ID
            status: initialStatus
        });

        // Create custom document names based on the user's role
        let rolesDocName;
        let rolesData = {
        };

        if (role === 'gym_owner') {
            rolesDocName = `Gym_Owner`; // Custom document name for gym owners
            rolesData.GymId = nextuserId; // Store GymId
        } else if (role === 'trainer') {
            rolesDocName = `Trainer`; // Custom document name for trainers
            rolesData.TrainerId = nextuserId; // Store TrainerId
        } else {
            rolesDocName = `User`; // Custom document name for regular users
            rolesData.userId = nextuserId;
        }

        // Create or update the Roles document with custom name
        const rolesDocRef = doc(db, 'Roles', rolesDocName);
        await setDoc(rolesDocRef, rolesData);

        // Add notification for the user
        await setDoc(doc(db, 'UserNotifications', userId), {
            notificationCount: 1,
            notifications: [{ message: `Welcome aboard, ${username}! You've successfully registered as a ${role}.`, timestamp: new Date().toISOString() }]
        });

        // Show success message
        let successMessage = `🎉 Awesome! You've signed up successfully, ${username}. Your account is under review.`;
        showSuccessMessage(successMessageElement, successMessage);

        // Redirect after a delay
        setTimeout(() => {
            if (role === 'gym_owner') {
                window.location.href = 'GymForm.html';
            } else if (role === 'trainer') {
                window.location.href = 'TrainerForm.html';
            } else {
                window.location.href = 'Dashboard.html'; 
            }
        }, 5000);

    } catch (error) {
        showErrorMessage(errorMessageElement, `🚫 Oops! There was an issue with your sign-up: ${error.message}`);
    }
}


// Function to sign in with email or username
async function signInWithEmailOrUsername(username, password, errorMessageElement, successMessageElement) {
    try {
        const normalizedUsername = username.toLowerCase();
        const isEmail = normalizedUsername.includes('@');
        let userDoc;

        // Check if the input is an email
        const userQuery = isEmail
            ? query(collection(db, 'Users'), where('email', '==', normalizedUsername))
            : query(collection(db, 'Users'), where('username', '==', normalizedUsername));

        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
            userDoc = querySnapshot.docs[0];
        }

        // If the user document was found
        if (userDoc) {
            const email = userDoc.data().email;
            const role = userDoc.data().role;
            const status = userDoc.data().status;

            // Check if the status is 'Under review' for Gym Owner or Trainer
            if ((role === 'trainer' || role === 'gym_owner') && status === 'Under review') {
                showErrorMessage(errorMessageElement, `🚫 Your account is currently under review. Please wait for the Admin's approval.`);
                return; // Exit the function
            }

            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            showSuccessMessage(successMessageElement, `✅ Welcome back, ${userDoc.data().username}! You have logged in successfully.`);

            // Redirect based on role
            switch (role) {
                case 'user':
                    window.location.href = 'Dashboard.html';
                    break;
                case 'gym_owner':
                    window.location.href = 'membership.html'; // Use specific GymId page
                    break;
                case 'admin':
                    window.location.href = 'Accounts.html';
                    break;
                case 'trainer':
                    window.location.href = 'TrainerDash.html'; // Use specific TrainerId page
                    break;
                default:
                    console.warn('Unrecognized role:', role);
                    break;
            }
        } else {
            showErrorMessage(errorMessageElement, `🚫 Sorry, we couldn't find an account with that username or email.`);
        }
    } catch (error) {
        showErrorMessage(errorMessageElement, `🚫 Sign-in failed: ${error.message}`);
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

            signInWithEmailOrUsername(username, password, errorMessage);
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
});

// Password validation function
function validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}
