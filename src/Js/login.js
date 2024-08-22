import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-auth.js';
import { getDatabase, ref, set, get, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-database.js';

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

// Function to show error messages with delay
function showErrorMessage(element, message) {
    element.textContent = message;
    setTimeout(() => {
        element.textContent = '';
    }, 2000); // 2 seconds delay
}

// Function to sign up with email and password
function signUpWithEmail(email, password, username, role, errorMessageElement, successMessageElement) {
    // Function to get the next roleId
    function getNextRoleId(callback) {
        const roleIdsRef = ref(database, 'RoleIds');
        get(roleIdsRef).then((snapshot) => {
            const roleIds = snapshot.val();
            let maxRoleId = 0;

            if (roleIds) {
                for (const key in roleIds) {
                    if (roleIds.hasOwnProperty(key)) {
                        const roleId = parseInt(roleIds[key], 10);
                        if (!isNaN(roleId) && roleId > maxRoleId) {
                            maxRoleId = roleId;
                        }
                    }
                }
            }

            callback(maxRoleId + 1);
        }).catch((error) => {
            console.error('Error fetching data for roleId:', error);
            showErrorMessage(errorMessageElement, 'Unable to determine next roleId. Defaulting to 1.');
            callback(1);
        });
    }

    // Sign up the user and set the user details in the database
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userId = user.uid;
            const userRef = ref(database, 'Accounts/' + userId);

            // Get the next roleId and set user details
            return new Promise((resolve, reject) => {
                getNextRoleId((nextRoleId) => {
                    // Set 'under review' status if the role is 'gym_owner'
                    const initialStatus = role.toLowerCase() === 'gym_owner' ? 'under review' : 'active';
                    
                    set(userRef, {
                        username: username,
                        email: email,
                        role: role,
                        roleId: nextRoleId,
                        status: initialStatus
                    }).then(() => {
                        // Set the roleId in the RoleIds node
                        const roleIdRef = ref(database, 'RoleIds/role_' + userId);
                        set(roleIdRef, nextRoleId).then(() => resolve(nextRoleId)).catch(reject);
                    }).catch(reject);
                });
            });
        })
        .then((roleId) => {
            successMessageElement.textContent = 'Sign up successful!';
            setTimeout(() => {
                successMessageElement.textContent = '';
            }, 2000); // 2 seconds delay for hiding success message
            document.getElementById('signupForm').reset();
        })
        .catch((error) => {
            console.error("Sign Up Error:", error.code, error.message);
            showErrorMessage(errorMessageElement, 'PeakPulse says: ' + error.message);
        });
}

// Function to sign in with email or username
function signInWithEmailOrUsername(username, password, errorMessage) {
    if (!username || !password) {
        showErrorMessage(errorMessage, 'Please enter both username and password.');
        return;
    }

    // Normalize username to lowercase for comparison
    const normalizedUsername = username.toLowerCase();
    const isAdminUsername = normalizedUsername === 'admin';

    // Determine if the username is an email or not
    const isEmail = username.includes('@');
    const userRef = ref(database, 'Accounts');
    const userQuery = isEmail 
        ? query(userRef, orderByChild('email'), equalTo(username))
        : query(userRef, orderByChild('username'), equalTo(username));

    get(userQuery).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const userId = Object.keys(userData)[0]; // Get the first matching user ID
            const user = userData[userId];
            const email = user.email;
            const role = (user.role || 'user').toUpperCase(); // Normalize role to uppercase
            const status = user.status || 'active';

            setPersistence(auth, browserSessionPersistence)
                .then(() => signInWithEmailAndPassword(auth, email, password))
                .then(() => {
                    // Check if the username is 'admin'
                    if (isAdminUsername) {
                        // Redirect admin to accounts.html
                        window.location.href = "accounts.html";
                        return;
                    }

                    // Check user status and role
                    if (status === 'under review') {
                        showErrorMessage(errorMessage, 'Your account is under review. Please wait until it is approved by an admin.');
                        return;
                    }

                    if (role.toLowerCase() === 'admin') {
                        // Redirect admin to accounts.html
                        window.location.href = "accounts.html";
                        return;
                    }

                    // Handle non-admin roles and account statuses
                    if (status === 'pending') {
                        showErrorMessage(errorMessage, 'Your account is under review. We will notify you via email once it is approved.');
                        return;
                    }

                    // Redirect based on user role
                    switch (role) {
                        case 'GYM_OWNER':
                            window.location.href = "GymForm.html";
                            break;
                        case 'TRAINER':
                            window.location.href = "trainer.html";
                            break;
                        default:
                            window.location.href = "Dashboard.html";
                            break;
                    }
                })
                .catch((error) => {
                    console.error("SignIn Error:", error.code, error.message);
                    showErrorMessage(errorMessage, 'PeakPulse says: ' + error.message);
                });
        } else {
            showErrorMessage(errorMessage, 'User not found.');
        }
    }).catch((error) => {
        console.error("Query Error:", error.code, error.message);
        showErrorMessage(errorMessage, 'PeakPulse says: ' + error.message);
    });
}

// Add event listener for login form submission
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
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();

            console.log('Form submission intercepted');

            // Get form values
            const username = document.getElementById('signupUsername')?.value.trim();
            const email = document.getElementById('signupEmail')?.value.trim();
            const password = document.getElementById('signupPassword')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            const role = document.getElementById('role')?.value;

            // Get message elements
            const errorMessage = document.getElementById('signupErrorMessage');
            const successMessage = document.getElementById('signupSuccessMessage');

            // Clear previous messages
            errorMessage.textContent = '';
            successMessage.textContent = '';

            let messages = [];

            // Validate form fields
            if (!username || !email || !password || !confirmPassword || !role) {
                messages.push('All fields are required. Please fill them up before signing up.');
            }

            // Check if any messages were added
            if (messages.length > 0) {
                // Display error message and hide after 2 seconds
                showErrorMessage(errorMessage, messages.join(' '));
                return;
            }

            // Check if passwords match
            if (password !== confirmPassword) {
                showErrorMessage(errorMessage, 'Passwords do not match.');
                return;
            }

            // Validate password strength
            if (!validatePassword(password)) {
                showErrorMessage(errorMessage, 'Password must be at least 8 characters long, include an uppercase letter, a digit, and a special character.');
                return;
            }

            // If all validations pass, proceed with signup
            signUpWithEmail(email, password, username, role, errorMessage, successMessage);
        });
    }

    function validatePassword(password) {
        // Basic password validation (can be expanded)
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    }
});
