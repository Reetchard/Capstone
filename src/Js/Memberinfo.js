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

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore and Authentication
const db = firebase.firestore();
const auth = firebase.auth();

// Define Firestore collections
const transactionsCollection = db.collection('Transactions');
const usersCollection = db.collection('GymOwner');
async function displayMemberInfo() {
    const MemberInfoBody = document.getElementById('MemberInfoBody');
    MemberInfoBody.innerHTML = '';

    try {
        // Ensure the user is authenticated
        const user = auth.currentUser;
        if (!user) {
            console.error("User not authenticated");
            alert("Please log in to access this page.");
            return;
        }

        const userId = user.uid;
        const userDoc = await usersCollection.doc(userId).get();

        if (!userDoc.exists) {
            console.error(`No user document found for user ID: ${userId}`);
            alert("User information is missing. Please contact support.");
            return;
        }

        const userData = userDoc.data();
        const gymOwnerGymName = userData?.gymName;

        if (!gymOwnerGymName) {
            console.error("Gym name is undefined or missing for the logged-in user.");
            alert("Your gym name is not set. Please update your profile.");
            return;
        }

        console.log("Gym name for the logged-in user:", gymOwnerGymName);

        // Fetch all membership transactions
        const querySnapshot = await transactionsCollection
            .where('type', '==', 'membership')
            .get();

        let hasResults = false;
        querySnapshot.forEach(doc => {
            const transaction = doc.data();
            const key = doc.id;

            console.log("Transaction data:", transaction);

            // Validate if the gymName matches
            if (transaction.gymName === gymOwnerGymName) {
                hasResults = true;

                // Match Firestore field names
                const membershipDays = transaction.membershipDays || 'N/A';
                const planType = transaction.planType || 'N/A';
                const price = transaction.price || 'N/A';
                const purchaseDate = transaction.purchaseDate || 'N/A';
                const status = transaction.status || 'N/A';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="selectMember" value="${key}"></td>
                    <td>${transaction.userId || 'N/A'}</td>
                    <td>${planType}</td>
                    <td>${membershipDays} days</td>
                    <td>₱${price ? parseFloat(price).toFixed(2) : 'N/A'}</td>
                    <td>${new Date(purchaseDate).toLocaleString() || 'N/A'}</td>
                    <td>${status}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="viewMemberDetails('${key}')">View</button>
                        <button class="btn btn-danger btn-sm" onclick="removeMember('${key}')">Remove</button>
                    </td>
                `;
                MemberInfoBody.appendChild(row);
            }
        });

        // Display message if no matching members found
        if (!hasResults) {
            MemberInfoBody.innerHTML = '<tr><td colspan="9">No members found for your gym.</td></tr>';
        }
    } catch (error) {
        console.error("Error displaying member information:", error);
        alert("An error occurred while loading member information. Please try again.");
    }
}



// Toggle Select All Checkboxes
window. toggleSelectAll = function(source) {
    const checkboxes = document.querySelectorAll('.selectMember');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });
}

// Search Member
window.searchMember = function() {
    const searchId = document.getElementById('searchMemberId').value.trim();
    const MemberInfoBody = document.getElementById('MemberInfoBody');
    MemberInfoBody.innerHTML = '';

    transactionsCollection.where('id', '==', searchId).get().then(querySnapshot => {
        if (querySnapshot.empty) {
            MemberInfoBody.innerHTML = '<tr><td colspan="8">No members found with this ID.</td></tr>';
            return;
        }

        querySnapshot.forEach(doc => {
            const transaction = doc.data();
            const key = doc.id;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="selectMember" value="${key}"></td>
                <td>${transaction.userId}</td>
                <td>${transaction.username}</td>
                <td>${transaction.membershipType}</td>
                <td>${transaction.startDate}</td>
                <td>${transaction.endDate}</td>
                <td>${transaction.paymentMethod}</td>
                <td>${transaction.status}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="viewMemberDetails('${key}')">View</button>
                    <button class="btn btn-success btn-sm" onclick="setStatus('${key}', 'Approved')">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="blockMember('${key}')">Block</button>
                </td>
            `;
            MemberInfoBody.appendChild(row);
        });
    }).catch(error => {
        console.error("Error searching member:", error);
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
    }).then((result) => {
        if (result.isConfirmed) {
            let promises = [];
            selectedCheckboxes.forEach(checkbox => {
                const key = checkbox.value;
                promises.push(transactionsCollection.doc(key).delete());
            });

            Promise.all(promises)
                .then(() => {
                    Swal.fire(
                        'Deleted!',
                        'Selected members have been deleted.',
                        'success'
                    );
                    displayMemberInfo();
                })
                .catch(error => {
                    console.error("Error deleting members:", error);
                    Swal.fire(
                        'Error!',
                        'An error occurred while deleting the members.',
                        'error'
                    );
                });
        }
    });
};

// Function to view member details
window.viewMemberDetails = async function (key) {
    const db = firebase.firestore();

    try {
        // Step 1: Fetch transaction data
        const transactionDoc = await db.collection('Transactions').doc(key).get();

        if (!transactionDoc.exists) {
            alert('Transaction not found!');
            return;
        }

        const transactionData = transactionDoc.data();
        const userId = transactionData.userId;

        // Step 2: Fetch user data
        const userQuery = await db.collection('Users').where('userId', '==', userId).get();

        if (userQuery.empty) {
            alert('User not found!');
            return;
        }

        const userDoc = userQuery.docs[0];
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