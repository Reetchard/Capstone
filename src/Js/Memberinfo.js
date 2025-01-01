// Import Firebase modules (MODULAR SYNTAX)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getFirestore, collection, getDocs, doc, addDoc, getDoc, query, where, updateDoc, onSnapshot, orderBy, limit,deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

// 🔹 Define collections at the top
const transactionsCollection = collection(db,'Transactions');
const usersCollection = collection(db, 'GymOwner');  // This refers to the collection

async function displayMemberInfo() {
    const MemberInfoBody = document.getElementById('MemberInfoBody');
    MemberInfoBody.innerHTML = '';  // Clear table to prevent duplicate rows

    try {
        const user = auth.currentUser;
        if (!user) {
            alert("Please log in to access this page.");
            return;
        }

        const userId = user.uid;
        const userDocRef = doc(db, 'GymOwner', userId);  // Correct reference to document
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            alert("User information is missing. Please contact support.");
            return;
        }

        const gymOwnerGymName = userDocSnap.data().gymName;

        const q = query(collection(db, 'Transactions'), where('type', '==', 'membership'));
        const querySnapshot = await getDocs(q);

        let hasResults = false;
        querySnapshot.forEach(doc => {
            const transaction = doc.data();
            if (transaction.gymName === gymOwnerGymName) {
                hasResults = true;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="selectMember" value="${doc.id}"></td>
                    <td>${transaction.userId || 'N/A'}</td>
                    <td>${transaction.planType || 'N/A'}</td>
                    <td>${transaction.membershipDays || 'N/A'} days</td>
                    <td>₱${parseFloat(transaction.price || 0).toFixed(2)}</td>
                    <td>${new Date(transaction.purchaseDate).toLocaleString()}</td>
                    <td>${transaction.status || 'N/A'}</td>
                    <td><button class="btn btn-info btn-sm" onclick="viewMemberDetails('${doc.id}')">View</button></td>
                `;
                MemberInfoBody.appendChild(row);
            }
        });

        if (!hasResults) {
            MemberInfoBody.innerHTML = '<tr><td colspan="8">No members found for your gym.</td></tr>';
        }
    } catch (error) {
        console.error("Error displaying member info:", error);
        alert("Failed to load member information.");
    }
}



// Toggle Select All Checkboxes
window. toggleSelectAll = function(source) {
    const checkboxes = document.querySelectorAll('.selectMember');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });
}





window.deleteSelected = function () {
    const selectedCheckboxes = document.querySelectorAll('.selectMember:checked');
    if (selectedCheckboxes.length === 0) {
        Swal.fire('No Selection', 'Please select at least one member to delete.', 'info');
        return;
    }

    Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete ${selectedCheckboxes.length} member(s).`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete them!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            let promises = [];
            selectedCheckboxes.forEach(checkbox => {
                const key = checkbox.value;
                const docRef = doc(db, 'Transactions', key);  // Reference the document
                promises.push(deleteDoc(docRef));  // Use deleteDoc to delete
            });

            try {
                await Promise.all(promises);
                Swal.fire(
                    'Deleted!',
                    'Selected members have been deleted.',
                    'success'
                );
                displayMemberInfo();
            } catch (error) {
                console.error("Error deleting members:", error);
                Swal.fire(
                    'Error!',
                    'An error occurred while deleting the members.',
                    'error'
                );
            }
        }
    });
};


// Function to view member details
window.viewMemberDetails = async function (key) {
    try {
        // Step 1: Fetch transaction data
        const transactionDocRef = doc(db, 'Transactions', key);  // Get the doc reference
        const transactionDoc = await getDoc(transactionDocRef);

        if (!transactionDoc.exists()) {
            alert('Transaction not found!');
            return;
        }

        const transactionData = transactionDoc.data();
        const userId = transactionData.userId;

        // Step 2: Fetch user data
        const usersCollectionRef = collection(db, 'Users');
        const userQuery = query(usersCollectionRef, where('userId', '==', userId));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            alert('User not found!');
            return;
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        // Step 3: Populate modal fields
        const photoElement = document.getElementById('photoURL');
        const usernameElement = document.getElementById('username');
        const emailElement = document.getElementById('email');

        // Ensure elements exist before setting their properties
        if (!photoElement || !usernameElement || !emailElement) {
            console.error('One or more modal elements not found in the DOM.');
            return;
        }

        photoElement.src = userData.photoURL || 'path/to/default-image.png';
        usernameElement.value = userData.username || 'N/A';
        emailElement.value = userData.email || 'N/A';

        // Add additional fields as necessary
        document.getElementById('status').value = transactionData.status || 'N/A';
        document.getElementById('planType').value = transactionData.planType || 'N/A';
        document.getElementById('membershipDays').value = transactionData.membershipDays || 'N/A';
        document.getElementById('price').value = transactionData.price 
            ? `₱${parseFloat(transactionData.price).toFixed(2)}`
            : 'N/A';    
        document.getElementById('purchaseDate').value = transactionData.purchaseDate || 'N/A';

        // Step 4: Show the modal
        const memberModal = new bootstrap.Modal(document.getElementById('MemberModal'));
        memberModal.show();
    } catch (error) {
        console.error('Error fetching member details:', error);
        alert('Failed to fetch member details. Please check the console for more information.');
    }
};



// Remove Member
window.removeMember = function (key) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
        if (result.isConfirmed) {
            transactionsCollection.doc(key).delete()
                .then(() => {
                    Swal.fire(
                        'Removed!',
                        'The member has been removed.',
                        'success'
                    );
                    displayMemberInfo();
                })
                .catch(error => {
                    console.error("Error removing member:", error);
                    Swal.fire(
                        'Error!',
                        'An error occurred while removing the member.',
                        'error'
                    );
                });
        }
    });
};


// Listen for Authentication Changes
auth.onAuthStateChanged((user) => {
    if (user) {
        displayMemberInfo();
    } else {
        console.error("User not authenticated.");
        window.location.href = 'login.html';
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

window. setStatus = async function(memberId, newStatus) {
    try {
        // Reference the specific member's document in Firestore
        const memberDocRef = doc(db, 'Transactions', memberId);

        // Update the status field in Firestore
        await updateDoc(memberDocRef, {
            status: newStatus
        });

        // Provide feedback to the user
        alert(`Member status updated to ${newStatus}.`);

        // Optionally, refresh the table or UI
        window.searchMember(); // Re-run the search to reflect the updated status
    } catch (error) {
        console.error('Error updating member status:', error);
        alert('Failed to update member status. Please try again.');
    }
}
let newTransactions = false;
let newDayPass = false;

function listenForUpdates() {
    const transactionsRef = collection(db, "Transactions");

    // Listen for all transactions
    onSnapshot(transactionsRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const transactionType = change.doc.data().type;

                switch (transactionType) {
                    case "Day Pass":
                        showNotificationDot('daypass-dot');
                        newDayPass = true;
                        break;
                    default:
                        showNotificationDot('transactions-dot');
                        newTransactions = true;
                        break;
                }
            }
        });
    });
}

// Show notification dot
function showNotificationDot(dotId) {
    const dot = document.getElementById(dotId);
    if (dot) {
        dot.style.display = 'inline-block';
    }
}

// Hide notification dot and reset when viewed
function resetDot() {
    document.getElementById('transactions-dot').style.display = 'none';
    document.getElementById('daypass-dot').style.display = 'none';

    newTransactions = false;
    newDayPass = false;

    console.log("Notification dots reset.");
}

// Attach click listener to reset dots on link click
document.querySelectorAll('.notification-link[data-reset="true"]').forEach(link => {
    link.addEventListener('click', resetDot);
});

// Call listenForUpdates when DOM is loaded
document.addEventListener('DOMContentLoaded', listenForUpdates);


async function fetchGymOwnerUsername() {
    const user = auth.currentUser;

    if (user) {
        try {
            // Reference to GymOwner document
            const gymOwnerDocRef = doc(db, 'GymOwner', user.uid);  
            const gymOwnerDocSnap = await getDoc(gymOwnerDocRef);

            if (gymOwnerDocSnap.exists()) {
                const username = gymOwnerDocSnap.data().username || 'Gym Owner';
                document.querySelector('#profile-username').textContent = username;
                document.querySelector('#profile-username-mobile').textContent = username;
            } else {
                document.querySelector('#profile-username').textContent = 'Gym Owner';
                console.error("Gym owner document not found.");
            }
        } catch (error) {
            console.error("Error fetching gym owner data:", error);
        }
    } else {
        document.querySelector('#profile-username').textContent = 'Not Logged In';
        console.error("No authenticated user.");
    }
}

// Wait for Firebase Authentication state change
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchGymOwnerUsername();
    }
});

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