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

window.addEventListener('click', function(event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (!dropdownMenu) {
        console.error("Dropdown menu not found in DOM.");
        return;
    }

    if (!event.target.closest('.dropdown')) {
        dropdownMenu.classList.add('hide'); // Add hide class for smooth closing
        setTimeout(() => {
            dropdownMenu.classList.remove('show', 'hide'); // Remove show and hide after transition
        }, 300);
    }

    const profilePicture = document.getElementById('profile-picture');
    if (profilePicture) {
        profilePicture.classList.remove('active');
    } else {
        console.error("Profile picture element not found.");
    }
});
function displayProfilePicture(user, username) {
    const userId = user.uid;
    const profilePicRef = ref(storage, `profilePictures/${userId}/profile.jpg`);

    getDownloadURL(profilePicRef)
        .then((url) => {
            const profilePicture = document.getElementById('profile-picture');
            const profileUsername = document.getElementById('profile-username');

            if (profilePicture) {
                profilePicture.src = url;
            } else {
                console.error("'profile-picture' element not found.");
            }

            if (profileUsername) {
                profileUsername.textContent = username;
            } else {
                console.error("'profile-username' element not found.");
            }
        })
        .catch((error) => {
            const profilePicture = document.getElementById('profile-picture');
            const profileUsername = document.getElementById('profile-username');

            if (error.code === 'storage/object-not-found') {
                if (profilePicture) {
                    profilePicture.src = 'framework/img/Profile.png';
                } else {
                    console.error("'profile-picture' element not found for fallback.");
                }

                if (profileUsername) {
                    profileUsername.textContent = username;
                } else {
                    console.error("'profile-username' element not found for fallback.");
                }
            } else {
                console.error('Unexpected error loading profile picture:', error.message);
            }
        });
}


// Show modal with a message
function showModal(title, message) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerText = message;
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    messageModal.show();
}

async function displayAccountInfo(searchQuery = '') {
    const collections = ['Users', 'GymOwner', 'Trainer']; // Collections to fetch from
    const accountInfoBody = document.getElementById('accountInfoBody');
    accountInfoBody.innerHTML = ''; // Clear previous results

    try {
        const allAccounts = []; // Array to store all accounts

        for (const collectionName of collections) {
            const querySnapshot = await getDocs(collection(db, collectionName));

            querySnapshot.forEach((doc) => {
                const account = doc.data();
                account.id = doc.id; // Include the document ID
                account.collectionName = collectionName; // Include collection name

                // Ensure userId exists and filter based on the search query
                if (searchQuery && account.userId && !account.userId.toString().includes(searchQuery)) {
                    return; // Skip if the userId doesn't match
                }

                allAccounts.push(account); // Add account to the list
            });
        }

        // Sort accounts: "Under review" first, then by other statuses
        allAccounts.sort((a, b) => {
            if (a.status === 'Under review' && b.status !== 'Under review') {
                return -1; // a comes before b
            } else if (a.status !== 'Under review' && b.status === 'Under review') {
                return 1; // b comes before a
            }
            return 0; // Preserve order for accounts with the same status
        });

        // Append sorted accounts to the table
        allAccounts.forEach((account) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="selectAccount" value="${account.id}" data-collection="${account.collectionName}"></td>
                <td>${account.userId || 'N/A'}</td>
                <td><a href="#" onclick="viewAccountDetails('${account.id}', '${account.collectionName}'); return false;">${account.username || 'N/A'}</a></td>
                <td>${account.status || account.collectionName}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="setStatus('${account.id}', '${account.collectionName}', 'Under review')">Review</button>
                    <button class="btn btn-success btn-sm" onclick="setStatus('${account.id}', '${account.collectionName}', 'Approved')">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="blockAccount('${account.id}', '${account.collectionName}')">Block</button>
                </td>
            `;
            accountInfoBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error fetching accounts:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Error fetching accounts. Please try again later.',
            icon: 'error',
            confirmButtonText: 'Okay'
        });
    }
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

// Show spinner and blur
function showGlobalSpinner() {
    const spinner = document.getElementById("globalSpinner");
    const blurOverlay = document.getElementById("blurOverlay");

    if (spinner) spinner.style.display = "flex";
    if (blurOverlay) blurOverlay.style.display = "block";
}

// Hide spinner and blur
function hideGlobalSpinner() {
    const spinner = document.getElementById("globalSpinner");
    const blurOverlay = document.getElementById("blurOverlay");

    if (spinner) spinner.style.display = "none";
    if (blurOverlay) blurOverlay.style.display = "none";
}

// Example action function with spinner
window.setStatus = async function (key, collectionName, status) {
    try {
        showGlobalSpinner(); // Show spinner and blur

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Perform the update
        await updateDoc(doc(db, collectionName, key), { status: status });

        // Show success message
        Swal.fire({
            title: "Success!",
            text: `Status updated to ${status}.`,
            icon: "success",
            confirmButtonText: "OK",
        });

        // Reload the accounts display
        displayAccountInfo();
    } catch (error) {
        console.error("Error updating status:", error);

        // Show error message
        Swal.fire({
            title: "Error",
            text: "Failed to update status. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
        });
    } finally {
        hideGlobalSpinner(); // Hide spinner and blur
    }
};


window.deleteSelected = async function () {
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

    Swal.fire({
        title: 'Are you sure?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            showGlobalSpinner(); // Show spinner and blur
            try {
                for (const checkbox of selectedCheckboxes) {
                    const key = checkbox.value;
                    const collectionName = checkbox.getAttribute('data-collection');
                    await deleteDoc(doc(db, collectionName, key));
                }

                displayAccountInfo();

                Swal.fire({
                    title: 'Deleted!',
                    text: 'The selected accounts have been deleted successfully.',
                    icon: 'success',
                    confirmButtonText: 'Okay'
                });
            } catch (error) {
                console.error('Error deleting accounts:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'We were unable to delete the selected accounts. Please try again later.',
                    icon: 'error',
                    confirmButtonText: 'Okay'
                });
            } finally {
                setTimeout(hideGlobalSpinner, 3000); // Ensure spinner is hidden after 3 seconds
            }
        }
    });
};

window.viewAccountDetails = async function(key, collectionName) {
    try {
        // Fetch the account document from Firestore
        const docSnap = await getDoc(doc(db, collectionName, key));
        const account = docSnap.data();

        if (account) {
            // Ensure modal elements exist before setting their values
            const usernameField = document.getElementById('username');
            const emailField = document.getElementById('email');
            const statusField = document.getElementById('status');
            const roleField = document.getElementById('role');

            if (!usernameField || !emailField || !statusField || !roleField) {
                throw new Error('Modal input fields are missing from the DOM.');
            }

            // Populate modal fields with account data
            usernameField.value = account.username || 'N/A';
            emailField.value = account.email || 'N/A';
            statusField.value = account.status || 'N/A';
            roleField.value = account.role || collectionName;

            // Initialize and show the modal
            const modalElement = document.getElementById('accountModal');
            const bootstrapModal = new bootstrap.Modal(modalElement); // Bootstrap 5 modal initialization
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



window. selectAllProfiles = function(checkbox) {
    // Get all checkboxes with the class 'selectAccount'
    const checkboxes = document.querySelectorAll('.selectAccount');
    // Toggle their checked state based on the main checkbox
    checkboxes.forEach((cb) => {
        cb.checked = checkbox.checked;
    });
}



document.addEventListener('DOMContentLoaded', () => {
    displayAccountInfo();
});


// Function to toggle select all checkboxes
window.toggleSelectAll = function(selectAllCheckbox) {
    const checkboxes = document.querySelectorAll('.selectAccount');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
};
const selectAllCheckbox = document.getElementById('selectAll');
if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('.selectAccount');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });
} else {
    console.error("Element with ID 'selectAll' not found.");
}window.blockAccount = async function (key, collectionName) {
    try {
        // Show the spinner and blur overlay
        showGlobalSpinner();

        // Simulate a slight delay for the spinner to be visible
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update the status of the account to 'Blocked'
        await updateDoc(doc(db, collectionName, key), { status: 'Blocked' });

        // Refresh the displayed accounts
        await displayAccountInfo();

        // Show success message
        await Swal.fire({
            title: 'Success!',
            text: 'The account has been blocked successfully.',
            icon: 'success',
            confirmButtonText: 'Okay',
        });
    } catch (error) {
        console.error('Error blocking account:', error);

        // Show error message
        await Swal.fire({
            title: 'Error!',
            text: 'An error occurred while blocking the account. Please try again.',
            icon: 'error',
            confirmButtonText: 'Okay',
        });
    } finally {
        // Hide the spinner and blur overlay
        hideGlobalSpinner();
    }
};
// Toggle Sidebar Visibility
const sidebar = document.getElementById('sidebar');
const hamburger = document.querySelector('.hamburger-container');

// Toggle sidebar visibility on hamburger click
hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('visible');
});

// Close sidebar when clicking outside of it on mobile
document.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove('visible');
    }
});

