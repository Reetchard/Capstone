// Your Firebase configuration
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

// Firebase references
const auth = firebase.auth();
const database = firebase.database();
const accountRef = database.ref('Accounts');

// Function to display all accounts
function displayAccountInfo() {
    accountRef.once('value', function(snapshot) {
        const accounts = snapshot.val();
        console.log('Accounts Data:', accounts); // Debugging line
        const accountInfoBody = document.getElementById('accountInfoBody');
        accountInfoBody.innerHTML = '';

        if (accounts) {
            for (const key in accounts) {
                if (accounts.hasOwnProperty(key)) {
                    const account = accounts[key];
                    const row = document.createElement('tr');

                    const status = account.status || 'N/A'; // Use account status

                    row.innerHTML = `
                        <td><input type="checkbox" class="selectAccount" value="${key}"></td>
                        <td>${account.id || 'N/A'}</td>
                        <td>${account.username || 'N/A'}</td>
                        <td>${status}</td>
                        <td>
                            <button class="btn btn-info btn-sm" onclick="setStatus('${key}', 'Idle')">Idle</button>
                            <button class="btn btn-success btn-sm" onclick="setStatus('${key}', 'Approved')">Approve</button>
                            <button class="btn btn-danger btn-sm" onclick="removeAccount('${key}')">Remove</button>
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

// Function to get the next ID (based on the highest existing ID)
function getNextId(callback) {
    accountRef.once('value', function(snapshot) {
        const accounts = snapshot.val();
        let maxId = 0;

        if (accounts) {
            for (const key in accounts) {
                if (accounts.hasOwnProperty(key)) {
                    const account = accounts[key];
                    const accountId = parseInt(account.id, 10);
                    if (!isNaN(accountId) && accountId > maxId) {
                        maxId = accountId;
                    }
                }
            }
        }

        callback(maxId + 1);
    }).catch(error => {
        console.error('Error fetching data for ID:', error);
        callback(1); // Default to 1 if there's an error
    });
}

// Function to add or edit account
document.getElementById('accountForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const key = document.getElementById('accountKey').value;

    if (username && email) {
        getNextId(function(nextId) {
            const accountData = {
                id: nextId,
                username,
                email,
                status: 'Active', // Default status
                online: true, // default online status
                lastOnline: new Date().toISOString() // current timestamp
            };

            if (key) {
                accountRef.child(key).update(accountData).then(() => {
                    $('#accountModal').modal('hide');
                    displayAccountInfo();
                }).catch(error => {
                    console.error('Error updating account:', error);
                });
            } else {
                accountRef.push(accountData).then(() => {
                    $('#accountModal').modal('hide');
                    displayAccountInfo();
                }).catch(error => {
                    console.error('Error adding account:', error);
                });
            }
        });
    }
});

// Function to edit account
window.editAccount = function(key) {
    accountRef.child(key).once('value', function(snapshot) {
        const account = snapshot.val();
        document.getElementById('username').value = account.username;
        document.getElementById('email').value = account.email;
        document.getElementById('accountKey').value = key;
        $('#accountModal').modal('show');
    }).catch(error => {
        console.error('Error fetching account data:', error);
    });
};

// Function to remove an account
window.removeAccount = function(key) {
    if (confirm('Are you sure you want to remove this account?')) {
        accountRef.child(key).remove().then(() => {
            displayAccountInfo();
        }).catch(error => {
            console.error('Error deleting account:', error);
        });
    }
};

// Function to set the status of an account
window.setStatus = function(key, status) {
    accountRef.child(key).update({ status }).then(() => {
        console.log(`Account ${key} set to ${status} successfully.`);
        displayAccountInfo(); // Refresh the account list
    }).catch(error => {
        console.error("Error updating account status:", error);
    });
};

// Function to delete selected accounts
window.deleteSelected = function() {
    const selectedCheckboxes = document.querySelectorAll('.selectAccount:checked');
    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one account to delete.');
        return;
    }

    if (confirm('Are you sure you want to delete the selected accounts?')) {
        selectedCheckboxes.forEach(checkbox => {
            const key = checkbox.value;
            accountRef.child(key).remove().catch(error => {
                console.error('Error deleting account:', error);
            });
        });

        // Refresh the account list after deletion
        displayAccountInfo();
    }
};

// Function to toggle all checkboxes
window.toggleSelectAll = function(source) {
    const checkboxes = document.querySelectorAll('.selectAccount');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });
};

// Display account information on page load
displayAccountInfo();
// Function to search accounts by ID
function searchAccount() {
    const searchId = document.getElementById('searchAccountId').value.trim();
    accountRef.once('value', function(snapshot) {
        const accounts = snapshot.val();
        console.log('Accounts Data:', accounts); // Debugging line
        const accountInfoBody = document.getElementById('accountInfoBody');
        accountInfoBody.innerHTML = '';

        if (accounts) {
            let found = false;
            for (const key in accounts) {
                if (accounts.hasOwnProperty(key)) {
                    const account = accounts[key];
                    if (account.id.toString().includes(searchId)) { // Check if ID matches
                        const row = document.createElement('tr');
                        const status = account.status || 'N/A'; // Use account status
                        row.innerHTML = `
                            <td><input type="checkbox" class="selectAccount" value="${key}"></td>
                            <td>${account.id || 'N/A'}</td>
                            <td>${account.username || 'N/A'}</td>
                            <td>${status}</td>
                            <td>
                                <button class="btn btn-info btn-sm" onclick="setStatus('${key}', 'Idle')">Idle</button>
                                <button class="btn btn-success btn-sm" onclick="setStatus('${key}', 'Approved')">Approve</button>
                                <button class="btn btn-danger btn-sm" onclick="removeAccount('${key}')">Remove</button>
                            </td>
                        `;
                        accountInfoBody.appendChild(row);
                        found = true;
                    }
                }
            }

            if (!found) {
                accountInfoBody.innerHTML = '<tr><td colspan="5">No accounts found with this ID.</td></tr>';
            }
        } else {
            accountInfoBody.innerHTML = '<tr><td colspan="5">No accounts found.</td></tr>';
        }
    }).catch(error => {
        console.error('Error fetching data:', error);
    });
}

