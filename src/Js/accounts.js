import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs,query, where ,doc, updateDoc, deleteDoc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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
const auth = getAuth();

  // Toggle dropdown on profile picture click

  onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Query Firestore for the admin role in the 'Admin' collection
            const q = query(
                collection(db, 'Admin'), 
                where('role', '==', 'admin'),  // Check for admin role
                where('userId', '==', user.uid)   // Match UID of the logged-in user
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Fetch the first matching admin document
                const adminData = querySnapshot.docs[0].data();
                const username = adminData.username || user.displayName || 'Admin';

                // Update the profile-username element
                const profileUsernameElement = document.getElementById('profile-username');
                if (profileUsernameElement) {
                    profileUsernameElement.textContent = username;
                }
            } else {
                console.error("User is not an admin.");
                // Optional: Redirect or disable admin-only content
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    } else {
        console.error("No user is signed in");
    }
});
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



// // Initialize global accounts object to store user data by role
let accounts = {
    customers: [],
    trainers: [],
    owners: []
};

async function fetchAccountsFromFirestore() {
    try {
        // Clear existing accounts to avoid duplicates
        accounts = {
            customers: [],
            trainers: [],
            owners: []
        };

        // Fetch from Users (Customers)
        const userSnapshot = await getDocs(
            query(collection(db, 'Users'), where('role', '==', 'user'))
        );
        accounts.customers = userSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.userId || doc.id,
                ...data,
                role: 'user'  
            };
        });

        // Fetch from Trainer (Trainers)
        const trainerSnapshot = await getDocs(
            query(collection(db, 'Trainer'), where('role', '==', 'trainer'))
        );
        accounts.trainers = trainerSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.userId || doc.id,
                ...data,
                role: 'trainer'
            };
        });

        // Fetch from GymOwner (Owners)
        const ownerSnapshot = await getDocs(
            query(collection(db, 'GymOwner'), where('role', '==', 'gymowner'))
        );
        accounts.owners = ownerSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.userId || doc.id,
                ...data,
                role: 'gymowner'
            };
        });

        // Sort the accounts by status and ID
        sortAccountsByStatusAndId();

        // Populate the tables after fetching
        populateTables();
    } catch (error) {
        console.error("Error fetching accounts:", error);
    }
}

// Sort function to prioritize "Under Review" status and then by ID
// Sort function to prioritize "Under Review" status and then by ID
function sortAccountsByStatusAndId() {
    const sortFunction = (a, b) => {
        // "Under Review" appears first
        if (a.status === 'Under review' && b.status !== 'Under review') return -1;
        if (a.status !== 'Under review' && b.status === 'Under review') return 1;

        // Sort by numeric ID (assuming the ID can be parsed as an integer)
        return parseInt(a.id) - parseInt(b.id);
    };

    accounts.customers.sort(sortFunction);
    accounts.trainers.sort(sortFunction);
    accounts.owners.sort(sortFunction);
}



window.handleSearch = function() {
    const searchValue = document.getElementById('searchAccountId').value.toLowerCase();
    const tableRows = document.querySelectorAll('tbody tr');

    tableRows.forEach(row => {
        let match = false;

        // If search box is empty, show all rows
        if (searchValue === '') {
            row.style.display = '';
            return;
        }

        // Check each cell for a match
        row.querySelectorAll('td').forEach(cell => {
            if (cell.textContent.toLowerCase().includes(searchValue)) {
                match = true;
            }
        });

        row.style.display = match ? '' : 'none';
    });
}



// Populate tables dynamically
function populateTables() {
    const customerBody = document.getElementById('customerInfoBody');
    const trainerBody = document.getElementById('trainerInfoBody');
    const ownerBody = document.getElementById('ownerInfoBody');

    // Clear existing content
    customerBody.innerHTML = '';
    trainerBody.innerHTML = '';
    ownerBody.innerHTML = '';

    // Populate Customers Table
    accounts.customers.forEach(account => {
        customerBody.innerHTML += generateTableRow(account);
    });

    // Populate Trainers Table
    accounts.trainers.forEach(account => {
        trainerBody.innerHTML += generateTableRow(account);
    });

    // Populate Gym Owners Table
    accounts.owners.forEach(account => {
        ownerBody.innerHTML += generateTableRow(account);
    });

    // Display "No records" if tables are empty
    if (!customerBody.innerHTML) {
        customerBody.innerHTML = '<tr><td colspan="5" class="text-center">No Customers Found</td></tr>';
    }
    if (!trainerBody.innerHTML) {
        trainerBody.innerHTML = '<tr><td colspan="5" class="text-center">No Trainers Found</td></tr>';
    }
    if (!ownerBody.innerHTML) {
        ownerBody.innerHTML = '<tr><td colspan="5" class="text-center">No Gym Owners Found</td></tr>';
    }
}

// Generate HTML row for each account
function generateTableRow(account) {
    return `
        <tr id="account-${account.id}">
            <td>${account.id}</td>
            <td>
                <a href="#" onclick="showAccountModal('${account.id}', '${account.username}', '${account.email || ''}', '${account.status || 'Active'}', '${account.role}')">
                    ${account.username || 'N/A'}
                </a>
            </td>
            <td class="status-cell" id="status-${account.id}">${account.status || 'Active'}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="approveAccount('${account.id}', '${account.role}', this)" ${account.status === 'Approved' ? 'disabled' : ''}>Approve</button>
                <button class="btn btn-danger btn-sm" onclick="deleteAccount('${account.username}', '${account.role}', this)">Delete</button>
            </td>
        </tr>
    `;
}
// Function to approve the account
document.addEventListener('DOMContentLoaded', function() {
    // Ensure the function is available after the DOM is loaded
    const approveButton = document.getElementById('approve-button-1');
    if (approveButton) {
        approveButton.addEventListener('click', function() {
            approveAccount(accountId); // Example usage with accountId and role
        });
    }
});

// Example approveAccount function
function approveAccount(accountId, role, button) {
    // Assuming you're validating the user using Firestore
    const email = document.getElementById(`email-${accountId}`).textContent; // Get the email from the DOM
    const username = document.getElementById(`username-${accountId}`).textContent; // Get the username

    validateUser(accountId, email, username).then(isValid => {
        if (isValid) {
            // Update the status and disable the button
            const statusCell = document.getElementById(`status-${accountId}`);
            statusCell.textContent = 'Approved';
            button.disabled = true;
        } else {
            alert("User validation failed. Unable to approve.");
        }
    }).catch(err => {
        console.error("Error during user validation:", err);
        alert("An error occurred while validating the user.");
    });
}

// Firestore validation (similar to the previous example)
function validateUser(accountId, email, username) {
    return new Promise((resolve, reject) => {
        const db = firebase.firestore();
        const userRef = db.collection('Users');
        const trainerRef = db.collection('Trainer');
        const gymOwnerRef = db.collection('GymOwner');

        Promise.all([
            userRef.where('email', '==', email).get(),
            userRef.where('username', '==', username).get(),
            trainerRef.where('email', '==', email).get(),
            trainerRef.where('username', '==', username).get(),
            gymOwnerRef.where('email', '==', email).get(),
            gymOwnerRef.where('username', '==', username).get()
        ])
        .then(([emailSnapshot, usernameSnapshot, trainerEmailSnapshot, trainerUsernameSnapshot, gymOwnerEmailSnapshot, gymOwnerUsernameSnapshot]) => {
            if (
                !emailSnapshot.empty || !usernameSnapshot.empty ||
                !trainerEmailSnapshot.empty || !trainerUsernameSnapshot.empty ||
                !gymOwnerEmailSnapshot.empty || !gymOwnerUsernameSnapshot.empty
            ) {
                resolve(true);
            } else {
                resolve(false);
            }
        })
        .catch(err => {
            reject(err);
        });
    });
}


// Function to update the account status in Firestore
function updateAccountStatus(accountId, status) {
    const db = firebase.firestore();
    const accountRef = db.collection('Users').doc(accountId); // Assuming the account is in the 'Users' collection

    // Update the status field
    accountRef.update({
        status: status
    }).then(() => {
        console.log(`Account ${accountId} status updated to ${status}`);
    }).catch(err => {
        console.error("Error updating account status:", err);
    });
}






window.deleteAccount = async function(username, role, buttonElement) {
    if (!username || username === 'N/A') {
        showToast('Error!', 'Invalid or missing username.', 'danger');
        console.error("Invalid or undefined username passed:", username);
        return;
    }

    let normalizedRole = role.toLowerCase();
    let collectionName;

    switch (normalizedRole) {
        case 'user':
            collectionName = 'Users';
            break;
        case 'trainer':
            collectionName = 'Trainer';
            break;
        case 'gymowner':
            collectionName = 'GymOwner';
            break;
        default:
            showToast('Error!', `Invalid role specified: ${role}`, 'danger');
            return;
    }

    const confirmDelete = await Swal.fire({
        title: 'Are you sure?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (confirmDelete.isConfirmed) {
        try {
            const originalContent = buttonElement.innerHTML;
            buttonElement.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Deleting...`;
            buttonElement.disabled = true;

            // Query Firestore for the document by username
            const querySnapshot = await getDocs(
                query(collection(db, collectionName), where('username', '==', username))
            );

            if (querySnapshot.empty) {
                showToast('Error!', 'No account found with that username.', 'danger');
                console.error("No document found with username:", username);
                return;
            }

            // Delete each matching document
            querySnapshot.forEach(async (docSnapshot) => {
                await deleteDoc(doc(db, collectionName, docSnapshot.id));
                console.log(`Deleted document: ${docSnapshot.id}`);
            });

            const row = buttonElement.closest('tr');
            if (row) {
                row.remove();
            }

            showToast('Deleted!', 'The account has been successfully deleted.', 'success');

        } catch (error) {
            showToast('Error!', 'Failed to delete the account.', 'danger');
            console.error("Error deleting account:", error);
        } finally {
            buttonElement.innerHTML = 'Delete';
            buttonElement.disabled = false;
        }
    }
}

// Select all profiles within a specific table
window.selectAllProfiles = function(role, checkbox) {
    let checkboxes;
    if (role === 'Customers') {
        checkboxes = document.querySelectorAll('#customerInfoBody .select-checkbox');
    } else if (role === 'Trainers') {
        checkboxes = document.querySelectorAll('#trainerInfoBody .select-checkbox');
    } else if (role === 'Owners') {
        checkboxes = document.querySelectorAll('#ownerInfoBody .select-checkbox');
    }
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

// Fetch accounts on page load
document.addEventListener('DOMContentLoaded', fetchAccountsFromFirestore);

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

function showToast(title, message, type = 'primary') {
    const toast = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');

    // Set the message and background color based on the type
    toastMessage.innerHTML = `<strong>${title}</strong> - ${message}`;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;

    // Show the toast
    const toastInstance = new bootstrap.Toast(toast);
    toastInstance.show();
}
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners to usernames
    document.querySelectorAll('.username').forEach(label => {
        label.addEventListener('click', async () => {
            const username = label.dataset.username.trim(); // Get the username from the data attribute
            await showAccountModal(username);
        });
    });
});



// Define the showAccountModal function// Define the showAccountModal function
window. showAccountModal =function(accountId, username, email, status, role) {
    // Example modal content (you can customize this based on your needs)
    const modalContent = `
        <div class="modal-header">
            <h5 class="modal-title">Account Information</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Role:</strong> ${role}</p>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
    `;

    // Insert the modal content into the modal body element
    const modalBody = document.getElementById('accountModalBody');
    modalBody.innerHTML = modalContent;

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    modal.show();
}

