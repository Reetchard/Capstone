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
const usersCollection = db.collection('Users');

// Display Members based on the gym name of the logged-in gym owner
async function displayMemberInfo() {
    const MemberInfoBody = document.getElementById('MemberInfoBody');
    MemberInfoBody.innerHTML = '';

    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("User not authenticated");
            return;
        }

        const userId = user.uid;
        const userDoc = await usersCollection.doc(userId).get();
        const userData = userDoc.data();
        const gymName = userData?.gymName;

        const querySnapshot = await transactionsCollection
            .where('type', '==', 'membership')
            .where('gymName', '==', gymName)
            .get();

        querySnapshot.forEach(doc => {
            const transaction = doc.data();
            const key = doc.id;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="selectMember" value="${key}"></td>
                <td>${transaction.id || 'N/A'}</td>
                <td>${transaction.username || 'N/A'}</td>
                <td>${transaction.membershipType || 'N/A'}</td>
                <td>${transaction.startDate || 'N/A'}</td>
                <td>${transaction.endDate || 'N/A'}</td>
                <td>${transaction.paymentMethod || 'N/A'}</td>
                <td>${transaction.status || 'N/A'}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="viewMemberDetails('${key}')">View</button>
                    <button class="btn btn-success btn-sm" onclick="setStatus('${key}', 'Approved')">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="blockMember('${key}')">Block</button>
                </td>
            `;
            MemberInfoBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error displaying member information:", error);
    }
}

// Listen for changes in the authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        displayMemberInfo();
    } else {
        console.error("User not authenticated");
        window.location.href = 'login.html';
    }
});

// View Member Details
function viewMemberDetails(key) {
    transactionsCollection.doc(key).get().then(doc => {
        const transaction = doc.data();
        if (transaction) {
            document.getElementById('username').value = transaction.username || 'N/A';
            document.getElementById('email').value = transaction.email || 'N/A';
            document.getElementById('status').value = transaction.status || 'N/A';
            document.getElementById('role').value = transaction.role || 'N/A';
            $('#MemberModal').modal('show');
        } else {
            console.error("Member not found");
        }
    }).catch(error => {
        console.error("Error fetching member details:", error);
    });
}

// Set Status
function setStatus(key, status) {
    transactionsCollection.doc(key).update({ status: status }).then(() => {
        displayMemberInfo();
        console.log(`Member ${status} successfully`);
    }).catch(error => {
        console.error(`Error setting status: ${error}`);
    });
}

// Block Member
function blockMember(key) {
    if (confirm("Are you sure you want to block this member?")) {
        setStatus(key, 'Blocked');
    }
}

// Delete Selected Members
function deleteSelected() {
    const selectedCheckboxes = document.querySelectorAll('.selectMember:checked');
    if (selectedCheckboxes.length === 0) {
        alert("Please select at least one member to delete");
        return;
    }

    selectedCheckboxes.forEach(checkbox => {
        const key = checkbox.value;
        transactionsCollection.doc(key).delete().then(() => {
            console.log(`Member ${key} deleted successfully`);
        }).catch(error => {
            console.error("Error deleting member:", error);
        });
    });

    displayMemberInfo();
}

// Search Member by ID
function searchMember() {
    const searchId = document.getElementById('searchMemberId').value.trim();
    transactionsCollection.where('id', '==', searchId).get().then(querySnapshot => {
        const memberInfoBody = document.getElementById('MemberInfoBody');
        memberInfoBody.innerHTML = '';

        if (querySnapshot.empty) {
            memberInfoBody.innerHTML = '<tr><td colspan="8">No Members found with this ID.</td></tr>';
            return;
        }

        querySnapshot.forEach(doc => {
            const transaction = doc.data();
            const key = doc.id;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="selectMember" value="${key}"></td>
                <td>${transaction.id}</td>
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
            memberInfoBody.appendChild(row);
        });
    }).catch(error => {
        console.error("Error searching member:", error);
    });
}

// Toggle All Checkboxes
function toggleSelectAll(source) {
    const checkboxes = document.querySelectorAll('.selectMember');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });
}
