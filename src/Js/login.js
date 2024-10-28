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
            window.location.href = 'Login.html';
            break;
        default:
            window.location.href = 'Login.html'; // Default for regular users/customers
            break;
    }
}

// Sign up function
async function signUpWithEmail(username, email, password, role, errorMessageElement, successMessageElement) {
    clearMessages(errorMessageElement, successMessageElement);

    // Define valid roles
    const validRoles = ['gymowner', 'trainer', 'user']; 
    
    if (!validRoles.includes(role.toLowerCase())) {
        showMessage(errorMessageElement, '🚫 Uh-oh! That role doesn’t exist in our system. Please select "Gym Owner," "Trainer," or "User" and try again.', true);
        return;
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
        const userId = await getNextUserId(role); // Use the new function
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, 'Users', userCredential.user.uid), {
            userId,
            username,
            email,
            password,
            role,
            status: 'Under review' // Initial status is 'Under review'
        });

        // Store the notification in localStorage
        localStorage.setItem('signupNotification', `🎉 Welcome aboard, ${username}! Your account has been created successfully. Hold tight, it's under review and we'll notify you soon!`);

        showMessage(successMessageElement, `🎉 Welcome aboard, ${username}! Your account has been created successfully. Hold tight, it's under review and we'll notify you soon!`);
        
        // Notify the user, gym owner, or trainer
        notifyUser(username, role);

        clearSignUpFields(); // Clear form fields
        redirectUser(role); // Redirect based on the role

    } catch (error) {
        console.error('Error during signup:', error);

        let errorMsg;
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = '🚫 Uh-oh! This email is already taken. How about using another one to continue your journey?';
        } else {
            errorMsg = `⚠️ Yikes! Something went wrong: ${error.message}. Don’t worry, we’ll help you fix it!`;
        }

        showMessage(errorMessageElement, errorMsg, true);
    }
}

// Function to notify the user, gym owner, or trainer
function notifyUser(username, role) {
    let notificationMessage;

    // Customize messages based on role
    switch (role.toLowerCase()) {
        case 'gymowner':
            notificationMessage = `🏋️‍♂️ Welcome, ${username}! As a Gym Owner, your gym setup is in progress. You’ll receive approval updates soon.`;
            break;
        case 'trainer':
            notificationMessage = `🤸‍♀️ Hello, ${username}! As a Trainer, your profile is currently being reviewed. Once approved, you'll be able to connect with gym members!`;
            break;
        case 'user':
            notificationMessage = `🎉 Hi, ${username}! Your account is under review. You will soon be able to access all the facilities and book sessions with trainers!`;
            break;
        default:
            notificationMessage = `🎉 Hi, ${username}! We’re reviewing your account. Stay tuned for updates and get ready for your fitness journey!`;
    }

    // Check if the notification container exists
    const notificationContainer = document.getElementById('notification-list');

    if (notificationContainer) {
        // Create a new list item for the notification
        const notificationElement = document.createElement('li');
        notificationElement.className = 'list-group-item'; // Bootstrap class for list styling
        notificationElement.textContent = notificationMessage;

        // Append the notification message to the container
        notificationContainer.appendChild(notificationElement);
    } else {
        // Handle the case when the container doesn't exist
        console.warn('Notification container not found!');
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


async function signInWithEmail(email, password, errorMessageElement, successMessageElement) {
    // Validate email and password
    if (!email || !password) {
        showMessage(errorMessageElement, '⚠️ Oops! Both email and password are required to proceed. Double-check and try again!', true);
        return;
    }

    if (!isValidEmail(email)) {
        showMessage(errorMessageElement, '📧 Hmm, that doesn’t look like a valid email. Let’s make sure we’ve got it right!', true);
        return;
    }

    try {
        await setPersistence(auth, browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const userRef = doc(db, 'Users', userCredential.user.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            showMessage(errorMessageElement, `🚨 User profile not found! Looks like we couldn’t retrieve your data. Please contact support with UID: ${userCredential.user.uid}.`, true);
            return;
        }

        const userData = userSnapshot.data();
        const role = userData.role;
        const status = userData.status;

        if (status === 'Under review') {
            showMessage(errorMessageElement, `🚧 Hold on! Your account is currently under review. We’ll notify you as soon as it’s ready.`, true);
            return;
        }

        showMessage(successMessageElement, `🎉 Welcome back, ${userData.username}! We're thrilled to see you again!`);

        // Redirect based on user role
        switch (role) {
            case 'gymowner':
                showMessage(successMessageElement, '🏋️‍♂️ Redirecting you to manage your gym profile. Get ready to flex those managerial muscles!');
                setTimeout(() => {
                    window.location.href = 'trainer-info.html';
                }, 3000);
                break;
            case 'trainer':
                showMessage(successMessageElement, '💪 Trainer dashboard loading. Time to help others crush their fitness goals!');
                setTimeout(() => {
                    window.location.href = 'trainer.html';
                }, 3000);
                break;
            case 'admin':
                showMessage(successMessageElement, '🛠 Admin panel is just a moment away. Let’s get managing!');
                setTimeout(() => {
                    window.location.href = 'Accounts.html';
                }, 3000);
                break;
            case 'user':
                showMessage(successMessageElement, '🏠 Taking you to your dashboard. Let’s dive into your fitness journey!');
                setTimeout(() => {
                    window.location.href = 'Dashboard.html';
                }, 3000);
                break;
            default:
                console.warn('Unrecognized role:', role);
                showMessage(errorMessageElement, `🤔 Role not recognized. Please contact support if you believe this is an error.`, true);
                break;
        }

    } catch (error) {
        console.error("Sign-in error:", error); // Log full error for debugging
        let errorMsg;
        switch (error.code) {
            case 'auth/user-not-found':
                errorMsg = '❌ We couldn’t find an account with that email. Try again or sign up for a new account!';
                break;
            case 'auth/wrong-password':
                errorMsg = '🔐 Incorrect password. Let’s give it another shot!';
                break;
            case 'auth/invalid-email':
                errorMsg = '📧 That email doesn’t seem right. Can you check it again?';
                break;
            case 'auth/too-many-requests':
                errorMsg = '⏳ Whoa, slow down! Too many attempts. Take a break and try later.';
                break;
            default:
                errorMsg = `⚠️ Oops! Something went wrong: ${error.message}. Please try again or contact support.`;
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
                    showMessage(errorMessage, '🔒 Hmm, your password needs a little boost! It must be at least 6 characters long. Give it another shot!', true);
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


    
