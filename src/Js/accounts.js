import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
const db = getFirestore(app);
const accountRef = collection(db, 'Users');

// Function to display accounts
async function displayAccountInfo(searchQuery = '') {
    const snapshot = await getDocs(accountRef);
    const accountInfoBody = document.getElementById('accountInfoBody');
    accountInfoBody.innerHTML = '';

    snapshot.forEach(doc => {
        const account = doc.data();
        if (searchQuery && !account.username.toLowerCase().includes(searchQuery.toLowerCase())) {
            return; // Skip if search query does not match
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="selectAccount" value="${doc.id}"></td>
            <td>${account.userId || 'N/A'}</td> <!-- Display userId instead of doc.id -->
            <td><a href="#" onclick="viewAccountDetails('${doc.id}'); return false;">${account.username || 'N/A'}</a></td>
            <td>${account.status || 'N/A'}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="setStatus('${doc.id}', 'Under review')">Review</button>
                <button class="btn btn-success btn-sm" onclick="setStatus('${doc.id}', 'Approved')">Approve</button>
                <button class="btn btn-danger btn-sm" onclick="blockAccount('${doc.id}')">Block</button>
            </td>
        `;
        accountInfoBody.appendChild(row);
    });
}
// Function to handle search
window.handleSearch = function() {
    const searchQuery = document.getElementById('searchAccountId').value.trim();
    displayAccountInfo(searchQuery);
};

// Function to set the status of an account
window.setStatus = async function(key, status) {
    try {
        await updateDoc(doc(db, 'Users', key), { status: status });
        displayAccountInfo();
        showToast(`${status} successfully.`);
    } catch (error) {
        console.error('Error updating account status:', error);
        showToast('There was an issue updating the account status. Please try again or contact support if the problem persists.');
    }
};

// Function to delete selected accounts
window.deleteSelected = async function() {
    const selectedCheckboxes = document.querySelectorAll('.selectAccount:checked');
    
    if (selectedCheckboxes.length === 0) {
        showToast('Warning', '⚠️ Please select at least one account to delete.');
        return;
    }

    const confirmation = confirm('Are you sure you want to delete the selected accounts?');
    if (!confirmation) return;

    for (const checkbox of selectedCheckboxes) {
        const key = checkbox.value;
        try {
            await deleteDoc(doc(db, 'Users', key));
        } catch (error) {
            console.error('Error deleting account:', error);
            showToast('Error', '❌ An error occurred while deleting accounts. Please try again later.');
        }
    }

    displayAccountInfo();
    showToast('Success', '✅ The selected accounts have been deleted successfully.');
};

// Function to view detailed account information
window.viewAccountDetails = async function(key) {
    try {
        const docSnap = await getDoc(doc(db, 'Users', key));
        const account = docSnap.data();

        if (account) {
            document.getElementById('username').value = account.username || 'N/A';
            document.getElementById('email').value = account.email || 'N/A';
            document.getElementById('status').value = account.status || 'N/A';
            document.getElementById('role').value = account.role || 'N/A';
            document.getElementById('userId').value = key;
            $('#accountModal').modal('show');
        } else {
            showToast('Error', 'Account not found.');
        }
    } catch (error) {
        console.error('Error fetching account data:', error);
        showToast('Error', 'Error fetching account data. Please try again later.');
    }
};

// Function to handle select all functionality
document.getElementById('selectAll').addEventListener('change', function(e) {
    const checkboxes = document.querySelectorAll('.selectAccount');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
});

// Function to show toast notifications
function showToast(title, message) {
    const notificationContainer = document.getElementById('notification-container');
    const notificationText = document.getElementById('notification-text');

    notificationText.innerText = `${title}: ${message}`;
    const notificationMessage = document.getElementById('notification-message');

    notificationMessage.classList.remove('fade');
    notificationMessage.style.display = 'block';

    setTimeout(() => {
        notificationMessage.classList.add('fade');
        setTimeout(() => {
            notificationMessage.style.display = 'none';
        }, 150);
    }, 3000);
}

function hideNotification() {
    const notificationMessage = document.getElementById('notification-message');
    notificationMessage.style.display = 'none';
}

// Call to display accounts on page load
displayAccountInfo();
