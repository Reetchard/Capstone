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
  // Toggle dropdown on profile picture click
  
  document.getElementById('profile-picture').addEventListener('click', function(event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    event.stopPropagation();
    
    // If the dropdown is currently hidden, show it
    if (!dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('hide'); // Remove hide class if present
        dropdownMenu.classList.add('show'); // Show the dropdown
        
        // Also add a class for animating the profile picture
        this.classList.add('active'); // Optional for additional effect
    } else {
        dropdownMenu.classList.add('hide'); // Add hide class for smooth closing
        setTimeout(() => {
            dropdownMenu.classList.remove('show', 'hide'); // Remove show and hide after transition
        }, 300); // Match the duration with the CSS transition time
        
        // Optionally remove active class from profile picture
        this.classList.remove('active'); // Optional for additional effect
    }
});

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (!event.target.closest('.dropdown')) {
        dropdownMenu.classList.add('hide'); // Add hide class for smooth closing
        setTimeout(() => {
            dropdownMenu.classList.remove('show', 'hide'); // Remove show and hide after transition
        }, 300); // Match the duration with the CSS transition time
        
        // Optionally remove active class from profile picture
        document.getElementById('profile-picture').classList.remove('active'); // Optional for additional effect
    }
});
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(db, 'Users', userId); // Fetch user doc from Firestore

            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data(); // Get user data
                    const username = userData.username || 'User'; // Username with fallback

                    // Display profile picture and username
                    displayProfilePicture(user, username); // Pass the user object and username

                } else {
                    console.error("User document does not exist.");
                    window.location.href = 'login.html'; // Redirect to login if no user document found
                }
            } catch (error) {
                console.error("Error fetching user data:", error); // Error handling
            }
        } else {
            window.location.href = 'login.html'; // Redirect if user is not authenticated
        }
    });
});



// Function to display user profile picture
function displayProfilePicture(user, username) {
    const userId = user.uid;
    const profilePicRef = ref(storage, `profilePictures/${userId}/profile.jpg`);
  
    getDownloadURL(profilePicRef).then((url) => {
        // Update profile picture in both header and sidebar
        document.getElementById('profile-picture').src = url;        
        // Also update the username in the header
        document.getElementById('profile-username').textContent = username;
    }).catch((error) => {
        if (error.code === 'storage/object-not-found') {
            // Fallback to default image if no profile picture is found
            document.getElementById('profile-picture').src = 'framework/img/Profile.png';

            // Still set the username
            document.getElementById('profile-username').textContent = username;
        } else {
            console.error('Unexpected error loading profile picture:', error.message);
        }
    });
}


// Show spinner
function showSpinner() {
    document.getElementById('spinnerOverlay').classList.remove('d-none');
}

// Hide spinner
function hideSpinner() {
    document.getElementById('spinnerOverlay').classList.add('d-none');
}

// Show modal with a message
function showModal(title, message) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerText = message;
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    messageModal.show();
}

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

// Handle button click with spinner and delay
function handleButtonClick(action) {
    showSpinner(); // Show spinner
    setTimeout(async () => {
        try {
            await action(); // Execute the action
            // After action completes successfully, show success alert
            Swal.fire({
                title: 'Action Complete',
                text: 'The action was executed successfully!',
                icon: 'success',
                confirmButtonText: 'Okay'
            });
        } catch (error) {
            console.error('Error executing action:', error);
            Swal.fire({
                title: 'Error!',
                text: 'There was an issue executing the action. Please try again.',
                icon: 'error',
                confirmButtonText: 'Okay'
            });
        } finally {
            hideSpinner(); // Hide spinner
        }
    }, 1500); // Minimum 1.5 seconds delay
}

// Function to handle search
window.handleSearch = function() {
    const searchQuery = document.getElementById('searchAccountId').value.trim();
    console.log('Search Query:', searchQuery); // Log to check if the search query is retrieved
    displayAccountInfo(searchQuery);
};

// Function to set the status of an account with spinner and delay
window.setStatus = async function(key, status) {
    const approveButton = document.querySelector(`button[onclick="setStatus('${key}', '${status}')"]`);
    const originalContent = approveButton.innerHTML; // Store the original button content

    try {
        // Show spinner and disable the button
        approveButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`;
        approveButton.disabled = true;

        // Simulate the delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Perform the status update
        await updateDoc(doc(db, 'Users', key), { status: status });

        // Refresh the displayed accounts
        displayAccountInfo();

        // Show SweetAlert based on the status
        Swal.fire({
            title: 'Success!',
            text: `${status} successfully.`,
            icon: 'success',
            confirmButtonText: 'Okay'
        });
    } catch (error) {
        console.error('Error updating account status:', error);
        Swal.fire({
            title: 'Error!',
            text: 'There was an issue updating the account status. Please try again.',
            icon: 'error',
            confirmButtonText: 'Okay'
        });
    } finally {
        // Restore the button content and enable it
        approveButton.innerHTML = originalContent;
        approveButton.disabled = false;
    }
};

// Function to delete selected accounts with a delay
window.deleteSelected = async function() {
    const selectedCheckboxes = document.querySelectorAll('.selectAccount:checked');
    
    if (selectedCheckboxes.length === 0) {
        Swal.fire({
            title: 'Warning!',
            text: '⚠️ Please select at least one account to delete.',
            icon: 'warning',
            confirmButtonText: 'Okay'
        });
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
                Swal.fire({
                    title: 'Success!',
                    text: '✅ The selected accounts have been deleted successfully.',
                    icon: 'success',
                    confirmButtonText: 'Okay'
                });
                confirmationModal.hide(); // Hide the modal after deletion
            }, 3000); // 3-second delay
        } catch (error) {
            console.error('Error deleting accounts:', error);
            Swal.fire({
                title: 'Error!',
                text: '❌ We were unable to delete the selected accounts. Please try again later.',
                icon: 'error',
                confirmButtonText: 'Okay'
            });
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
            Swal.fire({
                title: 'Error!',
                text: 'Account not found.',
                icon: 'error',
                confirmButtonText: 'Okay'
            });
        }
    } catch (error) {
        console.error('Error fetching account data:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Error fetching account data. Please try again later.',
            icon: 'error',
            confirmButtonText: 'Okay'
        });
    }
};

// Function to handle select all functionality
document.getElementById('selectAll').addEventListener('change', function(e) {
    const checkboxes = document.querySelectorAll('.selectAccount');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
});

// Call to display accounts on page load
displayAccountInfo();

// Function to toggle select all checkboxes
window.toggleSelectAll = function(selectAllCheckbox) {
    const checkboxes = document.querySelectorAll('.selectAccount');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
};