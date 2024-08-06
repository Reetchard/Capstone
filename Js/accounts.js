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
function showToast(title, message) {
    const toastElement = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastBody = document.getElementById('toast-body');

    if (toastElement && toastTitle && toastBody) {
        toastTitle.textContent = title;
        toastBody.textContent = message;

        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    } else {
        console.error('Toast element or its children are not found in the DOM.');
    }
}

// Function to display all accounts
function displayAccountInfo() {
    accountRef.once('value', function(snapshot) {
        const accounts = snapshot.val();
        const accountInfoBody = document.getElementById('accountInfoBody');
        accountInfoBody.innerHTML = '';

        if (accounts) {
            for (const key in accounts) {
                if (accounts.hasOwnProperty(key)) {
                    const account = accounts[key];
                    const row = document.createElement('tr');
                    const status = account.status || 'N/A';

                    row.innerHTML = `
                        <td><input type="checkbox" class="selectAccount" value="${key}"></td>
                        <td class="account-id">${account.id || 'N/A'}</td>
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
        showToast('Error', 'Error fetching account data. Please try again later.');
    });
}

// Function to get the next ID
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
        showToast('Error', 'Unable to determine next ID. Defaulting to 1.');
        callback(1);
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
                status: 'Active',
                online: true,
                lastOnline: new Date().toISOString()
            };

            if (key) {
                accountRef.child(key).update(accountData).then(() => {
                    $('#accountModal').modal('hide');
                    displayAccountInfo();
                    showToast('Success', 'Account updated successfully.');
                }).catch(error => {
                    console.error('Error updating account:', error);
                    showToast('Error', 'Error updating account. Please try again later.');
                });
            } else {
                accountRef.push(accountData).then(() => {
                    $('#accountModal').modal('hide');
                    displayAccountInfo();
                    showToast('Success', 'Account added successfully.');
                }).catch(error => {
                    console.error('Error adding account:', error);
                    showToast('Error', 'Error adding account. Please try again later.');
                });
            }
        });
    } else {
        showToast('Error', 'Please fill in all required fields.');
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
        showToast('Error', 'Error fetching account data. Please try again later.');
    });
};

// Function to remove an account
window.removeAccount = function(key) {
    if (confirm('Are you sure you want to remove this account?')) {
        accountRef.child(key).remove().then(() => {
            displayAccountInfo();
            showToast('Success', 'Account removed successfully.');
        }).catch(error => {
            console.error('Error deleting account:', error);
            showToast('Error', 'Error deleting account. Please try again later.');
        });
    }
};

// Function to set the status of an account
window.setStatus = function(key, status) {
    accountRef.child(key).update({ status }).then(() => {
        console.log(`Account ${key} set to ${status} successfully.`);
        displayAccountInfo();
        showToast('Success', `Account status updated to ${status}.`);
    }).catch(error => {
        console.error("Error updating account status:", error);
        showToast('Error', 'Error updating account status. Please try again later.');
    });
};

// Function to delete selected accounts
window.deleteSelected = function() {
    const selectedCheckboxes = document.querySelectorAll('.selectAccount:checked');
    if (selectedCheckboxes.length === 0) {
        showToast('Warning', 'Please select at least one account to delete.');
        return;
    }

    if (confirm('Are you sure you want to delete the selected accounts?')) {
        selectedCheckboxes.forEach(checkbox => {
            const key = checkbox.value;
            accountRef.child(key).remove().catch(error => {
                console.error('Error deleting account:', error);
                showToast('Error', 'Error deleting selected accounts. Please try again later.');
            });
        });

        displayAccountInfo();
        showToast('Success', 'Selected accounts deleted successfully.');
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
        const accountInfoBody = document.getElementById('accountInfoBody');
        accountInfoBody.innerHTML = '';

        if (accounts) {
            let found = false;
            for (const key in accounts) {
                if (accounts.hasOwnProperty(key)) {
                    const account = accounts[key];
                    if (account.id.toString().includes(searchId)) {
                        const row = document.createElement('tr');
                        const status = account.status || 'N/A';
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
        showToast('Error', 'Error fetching account data. Please try again later.');
    });
}
    function showToast(title, message) {
        const toastElement = document.getElementById('toast');
        const toastTitle = document.getElementById('toast-title');
        const toastBody = document.getElementById('toast-body');

        if (toastElement && toastTitle && toastBody) {
            toastTitle.textContent = title;
            toastBody.textContent = message;

            // Create a new Bootstrap toast instance and show it
            const toast = new bootstrap.Toast(toastElement, {
                autohide: true,
                delay: 3000 // Adjust delay as needed
            });
            toast.show();
        } else {
            console.error('Toast element or its children are not found in the DOM.');
        }
    }
