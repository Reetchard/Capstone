// Firebase configuration
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';

// Firebase configuration
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();
const accountRef = database.ref('Accounts');
const ReportFormDB = database.ref('ReportForm');
const gymRef = database.ref('gyms');

// Function to handle authentication state changes
async function updateAuthSection(user) {
    const authSection = document.getElementById('authSection');
    if (!authSection) {
        console.error('authSection element not found');
        return;
    }

    if (user) {
        try {
            const userRef = database.ref('Accounts/' + user.uid);
            const snapshot = await userRef.once('value');
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const role = userData.role || 'User';
                const username = userData.username || 'User';

                let roleSpecificHtml = '';
                if (role === 'admin') {
                    roleSpecificHtml = `
                        <a class="btn btn-warning" href="accounts.html" id="adminManagement">Admin Management</a>
                        <a class="btn btn-danger" href="#" id="logoutBtn">Log Out</a>
                    `;
                } else if (role === 'gym_owner') {
                    roleSpecificHtml = `
                        <a class="btn btn-warning" href="gym-details.html" id="GymOwnerManagement">Gym Owner Management</a>
                        <a class="btn btn-danger" href="#" id="logoutBtn">Log Out</a>
                    `;
                } else if (role === 'trainer') {
                    roleSpecificHtml = `
                        <a class="btn btn-warning" href="accounts.html" id="TrainerManagement">Trainer Management</a>
                        <a class="btn btn-danger" href="#" id="logoutBtn">Log Out</a>
                    `;
                } else {
                    roleSpecificHtml = '<a class="btn btn-danger" href="#" id="logoutBtn">Log Out</a>';
                }

                authSection.innerHTML = `<span>Greetings, ${username}</span>${roleSpecificHtml}`;
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        auth.signOut().then(() => {
                            window.location.href = 'login.html'; // Redirect to login page after logout
                        }).catch(error => {
                            console.error('Error signing out:', error);
                        });
                    });
                }
            } else {
                console.error('User data does not exist');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    } else {
        authSection.innerHTML = '<a class="btn btn-primary" href="login.html">Login</a>';
    }
}

// Listen to authentication state changes
auth.onAuthStateChanged(user => {
    updateAuthSection(user);
});

// Function to display all accounts
function displayAccountInfo() {
    const accountInfoBody = document.getElementById('accountInfoBody');
    if (!accountInfoBody) {
        console.error('accountInfoBody element not found');
        return;
    }

    accountRef.once('value', function(snapshot) {
        const accounts = snapshot.val();
        accountInfoBody.innerHTML = '';

        if (accounts) {
            for (const key in accounts) {
                if (accounts.hasOwnProperty(key)) {
                    const account = accounts[key];
                    const row = document.createElement('tr');

                    const status = account.online
                        ? 'Online'
                        : `Offline (Last: ${new Date(account.lastOnline).toLocaleString()})`;

                    row.innerHTML = `
                        <td><input type="checkbox" class="selectAccount" value="${key}"></td>
                        <td>${account.id || 'N/A'}</td>
                        <td>${account.username || 'N/A'}</td>
                        <td>${status || 'N/A'}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editAccount('${key}')">Edit</button>
                        </td>
                    `;

                    accountInfoBody.appendChild(row);
                }
            }
        } else {
            accountInfoBody.innerHTML = '<tr><td colspan="5">No accounts found.</td></tr>';
        }
    }).catch(error => {
        console.error('Error fetching data:', error);
    });
}
