import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, getDocs, query,collection,where   } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
function showMessage(element, message, isError = false, duration = 3000) {
    if (!element) return;

    element.textContent = message;
    element.style.display = 'block';
    element.style.color = isError ? 'red' : 'green';

    // Hide the message after the specified duration
    setTimeout(() => {
        element.style.display = 'none';
    }, duration);
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

    // Reference to the RoleId document
    const counterRef = doc(db, 'RoleId', 'Users');
    let newId;

    try {
        // Fetch the current document
        const counterSnapshot = await getDoc(counterRef);

        if (counterSnapshot.exists()) {
            // Extract current data
            const currentData = counterSnapshot.data();
            console.log('Current RoleId Data:', currentData); // Debugging log

            // Generate new ID based on role
            if (role.toLowerCase() === 'gymowner') {
                newId = (currentData.gymOwnerId || 0) + 1;
                await setDoc(counterRef, { gymOwnerId: newId }, { merge: true });
            } else if (role.toLowerCase() === 'trainer') {
                newId = (currentData.trainerId || 0) + 1;
                await setDoc(counterRef, { trainerId: newId }, { merge: true });
            } else if (role.toLowerCase() === 'user') {
                newId = (currentData.userId || 0) + 1;
                await setDoc(counterRef, { userId: newId }, { merge: true });
            } else {
                console.error('Invalid role specified:', role); // Log invalid role for debugging
                throw new Error('Invalid role specified.');
            }
        } else {
            // Document doesn't exist, initialize it
            console.log('RoleId document does not exist. Initializing...');
            if (role.toLowerCase() === 'gymowner') {
                newId = 1;
                await setDoc(counterRef, { gymOwnerId: newId, trainerId: 0, userId: 0 });
            } else if (role.toLowerCase() === 'trainer') {
                newId = 1;
                await setDoc(counterRef, { gymOwnerId: 0, trainerId: newId, userId: 0 });
            } else if (role.toLowerCase() === 'user') {
                newId = 1;
                await setDoc(counterRef, { gymOwnerId: 0, trainerId: 0, userId: newId });
            } else {
                console.error('Invalid role specified during initialization:', role); // Log invalid role for debugging
                throw new Error('Invalid role specified.');
            }
        }

        console.log('Generated new ID for role:', role, newId); // Log new ID for debugging
        return newId;
    } catch (error) {
        console.error('Error in getNextUserId:', error);
        throw new Error('Failed to generate new ID.');
    }
    }
    async function signUpWithEmail(username, email, password, role, errorMessageElement, successMessageElement) {
        clearMessages(errorMessageElement, successMessageElement);
    
        // Normalize username to lowercase for validation
        const normalizedUsername = username.toLowerCase();
    
        let collectionName;
    
        if (normalizedUsername === 'admin') {
            collectionName = 'Admin';
            role = 'admin'; // Force role to 'admin' for consistency
        } else {
            const validRoles = ['gymowner', 'trainer', 'user'];
    
            if (!validRoles.includes(role.toLowerCase())) {
                showMessage(errorMessageElement, '🚫 Uh-oh! That role doesn’t exist in our system. Please select "Gym Owner," "Trainer," or "User" and try again.', true);
                return;
            }
    
            collectionName = role.toLowerCase() === 'gymowner'
                ? 'GymOwner'
                : role.toLowerCase() === 'trainer'
                ? 'Trainer'
                : 'Users';
        }
    
        if (!isValidEmail(email)) {
            showMessage(errorMessageElement, '📧 Hold on! That email doesn’t seem right. Double-check it and give it another go!', true);
            return;
        }
    
        if (password.length < 6) {
            showMessage(errorMessageElement, '🔑 Password’s too short! You need at least 6 characters for a strong start. Let’s fix that and try again!', true);
            return;
        }
    
        try {
            // Check if the email already exists
            const emailQuerySnapshot = await getDocs(query(collection(db, collectionName), where('email', '==', email)));
            if (!emailQuerySnapshot.empty) {
                showMessage(errorMessageElement, '🚫 The email is already registered. Please use a different email or log in.', true);
                return;
            }
    
            // Check if the username already exists
            const usernameQuerySnapshot = await getDocs(query(collection(db, collectionName), where('username', '==', username)));
            if (!usernameQuerySnapshot.empty) {
                showMessage(errorMessageElement, '🚫 The username is already taken. Please choose a different username.', true);
                return;
            }
    
            let userId;
            if (normalizedUsername !== 'admin') {
                userId = await getNextUserId(role); // Generate user ID for non-admin accounts
            }
    
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
            await setDoc(doc(db, collectionName, userCredential.user.uid), {
                userId: normalizedUsername === 'admin' ? 'N/A' : userId, // No ID generation for admin
                username,
                email,
                password,
                role,
                status: role === 'admin' ? 'Active' : 'Under review' // Admin accounts are immediately active
            });
    
            showMessage(successMessageElement, `🎉 Account created successfully for ${username}! You will be redirected shortly.`, false);
    
            clearSignUpFields();
    
            setTimeout(() => {
                redirectUser(role);
            }, 3000);
    
        } catch (error) {
            console.error('Error during signup:', error);
    
            let errorMsg;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMsg = `🚫 Uh-oh! The email you entered is already in use.Log in instead?`;
                    break;
                default:
                    errorMsg = `⚠️ Yikes! Something went wrong: ${error.message}. Don’t worry, we’ll help you fix it!`;
                    break;
            }
    
            showMessage(errorMessageElement, errorMsg, true);
        }
    }
    


    async function signInWithEmail(email, password, errorMessageElement, successMessageElement) {
        if (!email || !password) {
            showMessage(errorMessageElement, '⚠️ Both email and password are required to proceed.', true);
            return;
        }
    
        try {
            console.log("Attempting to sign in with email:", email);
    
            // Sign in the user using Firebase Authentication
            await setPersistence(auth, browserSessionPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;
    
            console.log("Sign-in successful for UID:", userId);
    
            // Collections to check
            const collections = ['Admin', 'GymOwner', 'Trainer', 'Users'];
            let userData = null;
            let role = null;
    
            // Check the user's ID in each collection
            for (const collectionName of collections) {
                const userRef = doc(db, collectionName, userId);
                const userSnapshot = await getDoc(userRef);
    
                if (userSnapshot.exists()) {
                    userData = userSnapshot.data();
                    role = collectionName.toLowerCase(); // Set role based on collection name
                    console.log(`User found in collection: ${collectionName}`);
                    break; // Exit loop once user is found
                }
            }
    
            if (!userData) {
                // User not found in any collection
                showMessage(errorMessageElement, `🚨 User profile not found! Contact support. UID: ${userId}`, true);
                return;
            }
    
            if (userData.status === 'Under review') {
                // Account is under review
                showMessage(errorMessageElement, '🚧 Your account is under review. Please wait for approval.', true);
                return;
            }
    
            // Successfully signed in
            showMessage(successMessageElement, `🎉 Welcome back, ${userData.username || 'User'}! Redirecting to your dashboard.`, false);
    
            // Redirect based on role
            setTimeout(() => {
                switch (role) {
                    case 'admin':
                        window.location.href = 'Accounts.html';
                        break;
                    case 'gymowner':
                        window.location.href = 'salesandinventory.html';
                        break;
                    case 'trainer':
                        window.location.href = 'trainer.html';
                        break;
                    case 'users': // For general users
                        window.location.href = 'Dashboard.html';
                        break;
                    default:
                        showMessage(errorMessageElement, `🤔 Unknown role. Contact support.`, true);
                        break;
                }
            }, 3000);
        } catch (error) {
            console.error("Sign-in error:", error);
    
            // Handle Firebase Authentication errors
            let errorMsg;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMsg = '❌ No account found with that email.';
                    break;
                case 'auth/wrong-password':
                    errorMsg = '🔐 Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    errorMsg = '📧 Invalid email format.';
                    break;
                case 'auth/too-many-requests':
                    errorMsg = '⏳ Too many login attempts. Please try later.';
                    break;
                default:
                    errorMsg = `🔐 Incorrect password. Please try again.`;
            }
            showMessage(errorMessageElement, errorMsg, true);
        }
    }

    function redirectUser(role) {
        switch (role.toLowerCase()) {
            case 'admin':
                setTimeout(() => {
                    window.location.href = 'accounts.html';
                }, 3000); // Delay to show the spinner (3 second)
                break;
            case 'gymowner':
                setTimeout(() => {
                    window.location.href = 'GymForm.html';
                }, 3000); // Delay to show the spinner (3 second)
                break;
            case 'trainer':
            case 'user':
                setTimeout(() => {
                    window.location.href = 'Login.html';
                }, 3000); // Delay to show the spinner (3 second)
                break;
            default:
                setTimeout(() => {
                    window.location.href = 'Login.html';
                }, 1000);
                break;
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

                // Fetch email and password fields
                const email = document.getElementById('loginEmail')?.value.trim();
                const password = document.getElementById('loginPassword')?.value;
                const errorMessage = document.getElementById('error-message');
                const successMessage = document.getElementById('success-message');

                // Ensure both errorMessage and successMessage elements exist
                if (!errorMessage || !successMessage) {
                    console.error('Error: Missing error or success message element.');
                    return;
                }

                // Check for email input
                if (!email) {
                    showMessage(errorMessage, '📧 Oops! Looks like you forgot your email. Let’s fix that and try again!', true);
                    return;
                }

                // Check for password validity
                if (!validatePassword(password)) {
                    showMessage(errorMessage, '🔐 Incorrect password. Let’s give it another shot!', true);
                    return;
                }

                // Perform sign-in process
                signInWithEmail(email, password, errorMessage, successMessage);
            });
        } else {
            console.error('🚨 Error: Login form with ID "loginForm" not found! Make sure your form is correctly named.');
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        const signupForm = document.getElementById('signupForm');
        
        if (signupForm) {
            signupForm.addEventListener('submit', function(event) {
                event.preventDefault(); // Prevent the form from submitting the default way
    
                // Check if fields exist before accessing their values
                const usernameField = document.getElementById('signupUsername');
                const emailField = document.getElementById('signupEmail');
                const passwordField = document.getElementById('signupPassword');
                const confirmPasswordField = document.getElementById('confirmPassword');
                const roleField = document.getElementById('role');
                
                if (usernameField && emailField && passwordField && confirmPasswordField && roleField) {
                    // Get values from form inputs
                    const username = usernameField.value.trim();
                    const email = emailField.value.trim();
                    const password = passwordField.value.trim();
                    const confirmPassword = confirmPasswordField.value.trim();
                    const role = roleField.value.trim();
    
                    // Error and success message elements
                    const errorMessageElement = document.getElementById('signupErrorMessage');
                    const successMessageElement = document.getElementById('signupSuccessMessage');
    
                    // Clear previous messages
                    errorMessageElement.textContent = '';
                    successMessageElement.textContent = '';
    
                    // Validation checks
                    if (password !== confirmPassword) {
                        showMessage(errorMessageElement, 'Passwords do not match. Please try again.', true);
                        return;
                    }
    
                    if (password.length < 6) {
                        showMessage(errorMessageElement, 'Password must be at least 6 characters long.', true);
                        return;
                    }
    
                    // Call the signUpWithEmail function (assuming it's already defined)
                    signUpWithEmail(username, email, password, role, errorMessageElement, successMessageElement);
                } else {
                    console.error('One or more input fields are missing.');
                }
            });
        } else {
            console.error('Signup form not found.');
        }
    });


    
