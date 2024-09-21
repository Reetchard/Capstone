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

// Function to sign up with email and password
function signUpWithEmail(email, password, username, role, errorMessageElement, successMessageElement) {
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

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userId = user.uid;
            const userRef = ref(database, 'Accounts/' + userId);

            return new Promise((resolve, reject) => {
                getNextRoleId((nextRoleId) => {
                    let initialStatus = 'Under review'; // Default status for all roles

                    // Use switch-case for different roles
                    switch (role.toLowerCase()) {
                        case 'gym_owner':
                        case 'trainer':
                        case 'user':
                            initialStatus = 'Under review';
                            break;
                        default:
                            initialStatus = 'pending'; // Add a fallback if role is undefined
                    }

                    set(userRef, {
                        username: username,
                        email: email,
                        role: role,
                        roleId: nextRoleId,
                        status: initialStatus
                    }).then(() => {
                        // Add notification for the user
                        const notificationsRef = ref(database, 'UserNotifications/' + userId);
                        const notificationMessage = `You signed up for the ${role} plan.`;

                        // Set initial notification count and notification message
                        return set(notificationsRef, {
                            notificationCount: 1,
                            notifications: [{ message: notificationMessage, timestamp: new Date().toISOString() }]
                        });
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

            switch (role.toLowerCase()) {
                case 'gym_owner':
                    setTimeout(() => {
                        window.location.href = 'GymForm.html';
                    }, 2000);
                    break;
                case 'trainer':
                    setTimeout(() => {
                        window.location.href = 'TrainerForm.html';
                    }, 2000);
                    break;
                case 'user':
                    setTimeout(() => {
                        document.getElementById('signupForm').reset();
                    }, 2000);
                    break;
                default:
                    console.log('No valid role selected for redirection.');
            }
        })
        .catch((error) => {
            showErrorMessage(errorMessageElement, 'PeakPulse says: ' + error.message);
        });
}

// Function to fetch notifications
function fetchNotifications(userId) {
    const notificationsRef = ref(database, 'UserNotifications/' + userId);
    get(notificationsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userNotifications = snapshot.val();
            const notificationCount = userNotifications.notificationCount || 0;

            // Update the notification bell
            const notificationBell = document.getElementById('notification-bell');
            if (notificationBell) {
                notificationBell.textContent = notificationCount > 0 ? notificationCount : '';
            }
        }
    }).catch((error) => {
        console.error("Error fetching notifications:", error);
    });
}

// Function to sign in with email or username
function signInWithEmailOrUsername(username, password, errorMessageElement, successMessageElement) {
    if (!username || !password) {
        if (errorMessageElement) {
            showErrorMessage(errorMessageElement, 'Please enter both username and password.');
        }
        return;
    }

    const normalizedUsername = username.toLowerCase();
    const isAdminUsername = normalizedUsername === 'admin';
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
            const role = (user.role || 'user').toUpperCase();
            const status = user.status || 'active';

            setPersistence(auth, browserSessionPersistence)
                .then(() => signInWithEmailAndPassword(auth, email, password))
                .then(() => {
                    console.log('Sign-in successful!'); // Debugging line
                    updateNotificationBell(userId); // Update the notification bell

                    if (successMessageElement) {
                        showSuccessMessage(successMessageElement, 'Sign-in successful!');
                    }

                    if (isAdminUsername) {
                        window.location.href = "accounts.html";
                        return;
                    }

                    if (status === 'Under review') {
                        if (errorMessageElement) {
                            showErrorMessage(errorMessageElement, 'Your account is under review. Please wait until it is approved by an admin.');
                        }
                        return;
                    }

                    switch (role) {
                        case 'GYM_OWNER':
                            window.location.href = "member.html";
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
                    }
                });
        } else {
            if (errorMessageElement) {
                showErrorMessage(errorMessageElement, 'User not found.');
            }
        }
    }).catch((error) => {
        console.error("Query Error:", error.code, error.message);
        if (errorMessageElement) {
            showErrorMessage(errorMessageElement, 'PeakPulse says: ' + error.message);
        }
    });
}


// Show error and success messages
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

// Add event listener for signup form submission
document.addEventListener('DOMContentLoaded', () => {
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
                messages.push('All fields are required. Please fill them up before signing up.');
            }

            if (messages.length > 0) {
                showErrorMessage(errorMessage, messages.join(' '));
                return;
            }

            if (password !== confirmPassword) {
                showErrorMessage(errorMessage, 'Passwords do not match.');
                return;
            }

            if (!validatePassword(password)) {
                showErrorMessage(errorMessage, 'Password must be at least 8 characters long, include an uppercase letter, a digit, and a special character.');
                return;
            }

            signUpWithEmail(email, password, username, role, errorMessage, successMessage);
        });
    } else {
        console.error('Signup form with ID "signupForm" not found.');
    }

    function validatePassword(password) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    }
});

// Fetch notifications on dashboard load
document.addEventListener('DOMContentLoaded', function() {
    const userId = auth.currentUser?.uid; // Get the current user's ID

    if (userId) {
        fetchNotifications(userId); // Fetch notifications if the user is logged in
    }
});

// Update membership info
document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const planName = urlParams.get('plan');

    if (planName) {
        const membershipInfo = document.getElementById('membership-info');
        membershipInfo.innerHTML = `You are applying for: <strong>${planName}</strong>`;
        membershipInfo.classList.add('active'); // Show the message
    }
});
function updateNotificationBell(userId) {
    const notificationsRef = ref(database, 'notifications/' + userId);
    get(notificationsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const notifications = snapshot.val();
            const totalNotifications = notifications.transaction + notifications.emails + notifications.membershipPlans;

            const notificationBell = document.getElementById('notification-bell');
            if (notificationBell) {
                // Update the bell with the total notification count
                notificationBell.innerHTML = `<i class="fas fa-bell"></i> ${totalNotifications}`;
            }
        } else {
            console.log('No notifications found for user:', userId);
        }
    }).catch((error) => {
        console.error('Error fetching notifications:', error);
    });
}
