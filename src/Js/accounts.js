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
    accountInfoBody.innerHTML = ''; // Clear previous results

    snapshot.forEach(doc => {
        const account = doc.data();
        console.log('Account Data:', account); // Log each account's data

        // Ensure userId exists and filter based on the search query
        if (searchQuery && account.userId && !account.userId.toString().includes(searchQuery)) {
            return; // Skip if the userId doesn't match
        }

        // Create the row for matched accounts
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="selectAccount" value="${doc.id}"></td>
            <td>${account.userId || 'N/A'}</td>
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
    console.log('Search Query:', searchQuery); // Log to check if the search query is retrieved
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

// Function to delete selected accounts with a delay
window.deleteSelected = async function() {
    const selectedCheckboxes = document.querySelectorAll('.selectAccount:checked');
    
    if (selectedCheckboxes.length === 0) {
        showToast('Warning', '⚠️ Please select at least one account to delete.');
        return;
    }

    // Show the custom confirmation modal
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    confirmationModal.show();

    // Wait for the user to confirm deletion
    document.getElementById('confirmDeleteBtn').onclick = async function() {
        try {
            for (const checkbox of selectedCheckboxes) {
                const key = checkbox.value;
                await deleteDoc(doc(db, 'Users', key));
            }

            // Add 3-second delay before showing results
            setTimeout(() => {
                displayAccountInfo();
                showToast('Success', '✅ The selected accounts have been deleted successfully.');
                confirmationModal.hide(); // Hide the modal after deletion
            }, 3000); // 3-second delay
        } catch (error) {
            console.error('Error deleting accounts:', error);
            showToast('Error', '❌ We were unable to delete the selected accounts. Please try again later.');
        }
    };
};


// Function to view detailed account information
window.viewAccountDetails = async function(key) {
    try {
        const docSnap = await getDoc(doc(db, 'Users', key));
        const account = docSnap.data();

        if (account) {
            const usernameField = document.getElementById('username');
            const emailField = document.getElementById('email');
            const statusField = document.getElementById('status');
            const roleField = document.getElementById('role');
            const userIdField = document.getElementById('userId');

            if (usernameField) usernameField.value = account.username || 'N/A';
            if (emailField) emailField.value = account.email || 'N/A';
            if (statusField) statusField.value = account.status || 'N/A';
            if (roleField) roleField.value = account.role || 'N/A';
            if (userIdField) userIdField.value = key;

            // Show the modal using Bootstrap's JS
            const modal = document.getElementById('accountModal');
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
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
// Call to display accounts on page load
displayAccountInfo();
window. toggleSelectAll = function(selectAllCheckbox) {
    const checkboxes = document.querySelectorAll('.selectAccount');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}
