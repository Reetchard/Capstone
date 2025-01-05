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
        <tr id="account-${account.userId}">
            <td>${account.userId}</td>
            <td>
                <a href="#" onclick="showAccountModal('${account.userId}', '${account.username}', '${account.email || ''}', '${account.status || 'Active'}', '${account.role}')">
                    ${account.username || 'N/A'}
                </a>
            </td>
            <td class="status-cell" id="status-${account.userId}">${account.status || 'Active'}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="approveAccount('${account.username}', '${account.role}', this)" ${account.status === 'Approved' ? 'disabled' : ''}>Approve</button>
                <button class="btn btn-danger btn-sm" onclick="deleteAccount('${account.username}', '${account.role}', this)">Delete</button>
            </td>
        </tr>
    `;
}
window.approveAccount = async function (username, role, buttonElement) {
    let collectionName;
    if (role === 'user') {
        collectionName = 'Users';
    } else if (role === 'trainer') {
        collectionName = 'Trainer';
    } else if (role === 'gymowner') {
        collectionName = 'GymOwner';
    } else {
        console.error('Invalid role:', role);
        return;
    }

    try {
        // Get the Firestore collection reference
        const colRef = collection(db, collectionName);

        // Query to find the document with the matching username
        const q = query(colRef, where("username", "==", username));

        // Get the query snapshot
        const querySnapshot = await getDocs(q);

        // Check if a document exists with that username
        if (querySnapshot.empty) {
            console.error(`No document found for username: ${username}`);
            alert(`Cannot approve account: No user found with username ${username}.`);
            return;
        }

        // Get the first document (assuming unique usernames)
        const docSnap = querySnapshot.docs[0];
        const docRef = doc(db, collectionName, docSnap.id);

        // Update the document's status to "Approved"
        await updateDoc(docRef, { status: 'Approved' });
        console.log(`Account with username ${username} in collection ${collectionName} approved.`);

        // Directly update the table row's status in the DOM
        const statusCell = document.getElementById(`status-${docSnap.id}`);
        if (statusCell) {
            statusCell.textContent = 'Approved';  // Update the status in the table
        }

        // Disable the Approve button to prevent further clicks
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.textContent = 'Approved'; // Optionally change button text
        }

        // No need to refresh the entire table; only update this specific row
    } catch (error) {
        console.error("Error updating account status:", error);
        alert("Failed to approve the account. Please try again.");
    }
};





// Add event listener for dynamically handling button clicks
document.addEventListener('DOMContentLoaded', function () {
    // Find all approve buttons and add the event listener
    const approveButtons = document.querySelectorAll('.approve-btn');
    approveButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            const username = button.getAttribute('data-username');
            const role = button.getAttribute('data-role');
            approveAccount(username, role, button);
        });
    });
});



// Firestore validation (similar to the previous example)
window. validateUser = function(accountId, email, username) {
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

window. toggleDropdown =function() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
    } else {
        dropdownMenu.style.display = 'block';
    }
}

// Close the dropdown if clicked outside
window.addEventListener('click', function (e) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    const profileUsername = document.getElementById('profile-username');

    if (!profileUsername.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
    }
});
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');

    // Toggle Sidebar Visibility on Mobile
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    // Close Sidebar When Clicking Outside on Mobile
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target) && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });
});