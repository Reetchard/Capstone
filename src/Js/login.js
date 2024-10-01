import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, getDoc,query, where, collection ,updateDoc} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

    // If the counter document does not exist, create it with an initial value of 0
    if (!counterDoc.exists()) {
        await setDoc(doc(db, 'Counters', role), { count: 0 });
        return 1; // First ID is 1
    }

    // Get the current count, increment it, and update the document
    const currentCount = counterDoc.data().count;
    const newCount = currentCount + 1;

    // Update the counter in Firestore
    await updateDoc(doc(db, 'Counters', role), { count: newCount });

    return newCount; // Return the new ID
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

        // Use the username as the document name
        const documentName = username; // Set documentName to username
        
        // Get the next unique ID for the user based on their role
        const userId = await getNextRoleId(role.toLowerCase());
        
        // Store user data in Firestore using the username as the document ID
        await setDoc(doc(db, 'Users', documentName), {
            username,
            email,
            password, // Optional: Consider storing only hashed passwords
            role, // Role will be 'admin' if the username is 'Admin'
            userId,
            status: 'Under review' // Default status
        });

        // Show success message
        showSuccessMessage(successMessageElement, `🎉 Awesome! You've signed up successfully, ${username}. Your account is under review.`);

        // Clear the input fields
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
                // Default redirect can be added if needed
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
        const Username = username.trim().toLowerCase();

        // Fetch the associated user document from Firestore using username
        const userQuery = query(collection(db, 'Users'), where('username', '==', Username));
        const querySnapshot = await getDocs(userQuery);

        console.log("Query snapshot size:", querySnapshot.size); // Log the size of the snapshot
        querySnapshot.forEach(doc => {
            console.log("Found user document:", doc.data()); // Log each found user document
        });

        // If username was not found, show error message
        if (querySnapshot.empty) {
            showErrorMessage(errorMessageElement, `🚫 Sorry, we couldn't find an account with the username "${username}".`);
            return;
        }

        const userDoc = querySnapshot.docs[0]; // Get the first matching user document
        const email = userDoc.data().email; // Get email associated with the username

        console.log("Retrieved email from Firestore:", email); // Log the email fetched from Firestore

        // Proceed to sign in with Firebase Authentication
        await setPersistence(auth, browserSessionPersistence);
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User authenticated:", userCredential.user); // Log successful authentication

        // Fetch user details from Firestore using the document ID from Firestore
        const userRef = doc(db, 'Users', userDoc.id);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            showErrorMessage(errorMessageElement, `🚫 No user data found in Firestore for UID: ${userCredential.user.uid}.`);
            return;
        }

        const userData = userSnapshot.data();
        const role = userData.role;
        const status = userData.status;

        // Check if the account is under review
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
        // Handle specific errors for more informative messages
        if (error.code === 'auth/user-not-found') {
            showErrorMessage(errorMessageElement, '🚫 User not found. Please check your username.');
        } else if (error.code === 'auth/wrong-password') {
            showErrorMessage(errorMessageElement, '🚫 Incorrect password. Please try again.');
        } else {
            showErrorMessage(errorMessageElement, `🚫 Sign-in failed: ${error.message}`);
        }
        console.error("Sign-in error:", error);
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

            signInWithUsername(username, password, errorMessage);
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