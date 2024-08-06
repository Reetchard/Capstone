import { initializeApp } from "https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/9.2.0/firebase-auth.js";
import { getDatabase, ref, set, get, runTransaction, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.2.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    databaseURL: "https://capstone40-project-default-rtdb.firebaseio.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Get the form and error message element
const signupForm = document.getElementById('signupForm');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

// Function to clear messages after a delay
function clearMessages() {
    setTimeout(() => {
        errorMessage.textContent = '';
        successMessage.textContent = '';
    }, 5000); // 5000ms = 5 seconds
}

// Function to get the next ID for a given role using transaction
async function getNextId(role) {
    const idRef = ref(database, `RoleIds/${role}`);
    
    try {
        // Run a transaction to ensure ID is incremented atomically
        const updatedId = await runTransaction(idRef, (currentId) => {
            if (currentId === null) {
                return 0; // Start with ID 1 if no ID exists
            } else {
                return currentId + 1; // Increment ID
            }
        });

        // Check if the transaction was successful
        if (updatedId.committed) {
            console.log(`Next ID for ${role}: ${updatedId.snapshot.val()}`);
            return updatedId.snapshot.val();
        } else {
            throw new Error("Transaction was not committed.");
        }
    } catch (error) {
        console.error("Error updating ID:", error);
        throw new Error("Failed to get next ID.");
    }
}

// Function to check if the username is already taken
async function isUsernameTaken(username) {
    const usernameRef = query(ref(database, 'Accounts'), orderByChild('username'), equalTo(username));
    const snapshot = await get(usernameRef);
    return snapshot.exists();
}

// Function to check if the email is already in use
async function isEmailInUse(email) {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    return signInMethods.length > 0;
}

// Function to handle Firebase errors and provide custom messages
function handleFirebaseError(error) {
    const errorCode = error.code;

    switch (errorCode) {
        case 'auth/invalid-email':
            return "The email address is not valid.";
        case 'auth/email-already-in-use':
            return "The email address is already in use.";
        case 'auth/weak-password':
            return "The password is too weak.";
        case 'auth/user-not-found':
            return "No user found with this email.";
        case 'auth/wrong-password':
            return "The password is incorrect.";
        case 'auth/operation-not-allowed':
            return "Operation not allowed.";
        default:
            return "An unknown error occurred. Please try again.";
    }
}

// Listen for form submit
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value || 'admin'; // Default to 'admin' if no role is selected

    // Validate form fields
    if (!username || !email || !password || !confirmPassword) {
        errorMessage.textContent = "Please fill in all the fields.";
        clearMessages();
        return;
    }
    if (password !== confirmPassword) {
        errorMessage.textContent = "Passwords do not match.";
        clearMessages();
        return;
    }

    try {
        // Check if username is taken
        if (await isUsernameTaken(username)) {
            errorMessage.textContent = "Username is already taken.";
            clearMessages();
            return;
        }

        // Check if email is in use
        if (await isEmailInUse(email)) {
            errorMessage.textContent = "Email is already in use.";
            clearMessages();
            return;
        }

        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const uid = user.uid;

        // Get the next ID for the role
        const nextId = await getNextId(role);

        // Save user data to the database
        const userData = {
            id: nextId,
            username: username,
            email: email,
            role: role, // Save role as provided or default to 'admin'
        };

        await set(ref(database, 'Accounts/' + uid), userData);

        if (role === 'gym_owner') {
            // Redirect to gym owner form
            window.location.href = 'gymOwnerForm.html';
        } else {
            // Display success message
            successMessage.textContent = "Sign up successful. You can now log in.";
            errorMessage.textContent = '';  // Clear any previous error message
            signupForm.reset();  // Reset the form

            // Clear the success message after 5 seconds
            clearMessages();
        }
    } catch (error) {
        // Use custom error handling function
        errorMessage.textContent = handleFirebaseError(error);
        clearMessages();
    }
});

// Handle gym owner details form submission in a new file (gymOwnerForm.js)
// Implementation to handle gym details form goes here.
