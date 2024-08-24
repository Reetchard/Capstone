import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserSessionPersistence} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-auth.js';
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

    function showErrorMessage(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block'; // Ensure it's visible
            setTimeout(() => {
                element.textContent = '';
                element.style.display = 'none'; // Hide after timeout
            }, 2000); // Display for 2 seconds
        } else {
            console.error('Error message element not found.');
        }
    }
    
    function showSuccessMessage(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block'; // Ensure it's visible
            setTimeout(() => {
                element.textContent = '';
                element.style.display = 'none'; // Hide after timeout
            }, 2000); // Display for 2 seconds
        } else {
            console.error('Success message element not found.');
        }
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
            showSuccessMessage(successMessageElement, 'Sign up successful!');
            
            // Redirect Gym Owners to the GymForm if their role is 'gym_owner'
            if (role.toLowerCase() === 'gym_owner') {
                setTimeout(() => {
                    window.location.href = 'GymForm.html'; // Redirect to GymForm.html
                }, 2000);
                 // Delay to allow the success message to be seen
            } else {
                // No additional redirection needed for other roles
                setTimeout(() => {
                    document.getElementById('signupForm').reset();
                }, 2000); // Delay to allow the success message to be seen
            }
        })
        .catch((error) => {
            showErrorMessage(errorMessageElement, 'PeakPulse says: ' + error.message);
        });
}


// Function to sign in with email or username
function signInWithEmailOrUsername(username, password, errorMessageElement, successMessageElement) {
    if (!username || !password) {
        if (errorMessageElement) {
            showErrorMessage(errorMessageElement, 'Please enter both username and password.');
        } else {
            console.error('Error element not found.');
        }
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
                    if (successMessageElement) {
                        showSuccessMessage(successMessageElement, 'Sign-in successful!');
                    } else {
                        console.error('Success element not found.');
                    }

                    // Check if the username is 'admin'
                    if (isAdminUsername) {
                        // Redirect admin to accounts.html
                        window.location.href = "accounts.html";
                        return;
                    }

                    // Check user status and role
                    if (status === 'Under review') {
                        if (errorMessageElement) {
                            showErrorMessage(errorMessageElement, 'Your account is under review. Please wait until it is approved by an admin.');
                        } else {
                            console.error('Error element not found.');
                        }
                        return;
                    }

                    if (role.toLowerCase() === 'admin') {
                        // Redirect admin to accounts.html
                        window.location.href = "accounts.html";
                        return;
                    }

                    // Redirect based on user role
                    switch (role) {
                        case 'GYM_OWNER':
                            window.location.href = "GymDashboard.html";
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
                    if (errorMessageElement) {
                        showErrorMessage(errorMessageElement, 'PeakPulse says: ' + error.message);
                    } else {
                        console.error('Error element not found.');
                    }
                });
        } else {
            if (errorMessageElement) {
                showErrorMessage(errorMessageElement, 'User not found.');
            } else {
                console.error('Error element not found.');
            }
        }
    }).catch((error) => {
        console.error("Query Error:", error.code, error.message);
        if (errorMessageElement) {
            showErrorMessage(errorMessageElement, 'PeakPulse says: ' + error.message);
        } else {
            console.error('Error element not found.');
        }
    });
}

// Function to show error messages
function showErrorMessage(element, message) {
    if (element) {
        element.textContent = message;
        setTimeout(() => {
            element.textContent = '';
        }, 2000); // Hide after 2 seconds
    } else {
        console.error('Element not found for showing error message.');
    }
}

// Function to show success messages
function showSuccessMessage(element, message) {
    if (element) {
        element.textContent = message;
        setTimeout(() => {
            element.textContent = '';
        }, 2000); // Hide after 2 seconds
    } else {
        console.error('Element not found for showing success message.');
    }
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
    } else {
        console.error('Login form with ID "loginForm" not found.');
    }
});

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
            if (errorMessage) errorMessage.textContent = '';
            if (successMessage) successMessage.textContent = '';

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
    } else {
        console.error('Signup form with ID "signupForm" not found.');
    }

    function validatePassword(password) {
        // Basic password validation (can be expanded)
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    }
});