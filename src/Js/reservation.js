// Import necessary Firebase modules
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, deleteDoc, onSnapshot, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);  // Initialize auth globally

// Function to update reservation status (Approved/Cancelled)
const updateReservationStatus = async (docId, newStatus) => {
    try {
        const reservationRef = doc(db, 'Transactions', docId);
        await updateDoc(reservationRef, {
            status: newStatus
        });
        console.log(`Reservation status updated to ${newStatus}`);
        await fetchDayPassReservations();  // Refresh table
    } catch (error) {
        console.error('Error updating status:', error);
    }
};

// Function to delete a reservation
const deleteReservation = async (docId) => {
    try {
        const reservationRef = doc(db, 'Transactions', docId);
        await deleteDoc(reservationRef);
        console.log('Reservation successfully deleted.');
        await fetchDayPassReservations();  // Refresh table
    } catch (error) {
        console.error('Error deleting reservation:', error);
    }
};

// Function to fetch and display Day Pass reservations
const fetchDayPassReservations = async () => {
    try {
        const transactionsRef = collection(db, 'Transactions');
        const dayPassQuery = query(transactionsRef, where('type', '==', 'Day Pass'));
        const querySnapshot = await getDocs(dayPassQuery);

        const tbody = document.getElementById('DayPassBody');  // Select tbody element

        // Clear previous rows
        tbody.innerHTML = '';

        if (!querySnapshot.empty) {
            querySnapshot.forEach((docItem) => {
                const docId = docItem.id;
                const data = docItem.data();
                const { userId, email, date, totalPrice, timestamp, status } = data;

                // Create a new table row
                const row = `<tr>
                    <td>${userId}</td>
                    <td>${email}</td>
                    <td>${date}</td>
                    <td>${totalPrice}</td>
                    <td>${timestamp}</td>
                    <td>${status}</td>
                    <td>
                        <button onclick="updateReservationStatus('${docId}', 'Approved')" class="btn btn-success btn-sm mt-1">Approved</button>
                        <button onclick="updateReservationStatus('${docId}', 'Cancelled')" class="btn btn-warning btn-sm mt-1">Cancelled</button>
                        <button onclick="deleteReservation('${docId}')" class="btn btn-danger btn-sm mt-1">Delete</button>
                    </td>
                </tr>`;

                tbody.innerHTML += row;
            });
        } else {
            // If no reservations found
            const row = `<tr><td colspan="7" class="text-center">No Day Pass Reservations Found</td></tr>`;
            tbody.innerHTML = row;
        }
    } catch (error) {
        console.error('Error fetching Day Pass reservations:', error);
    }
};

// Authenticate and load reservations
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await fetchDayPassReservations();
    } else {
        alert('You must be logged in to view this page.');
        window.location.href = 'login.html';
    }
});

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
            const gymOwnerDocRef = doc(db, 'GymOwner', user.uid);  
            const gymOwnerDocSnap = await getDoc(gymOwnerDocRef);

            if (gymOwnerDocSnap.exists()) {
                const username = gymOwnerDocSnap.data().username || 'Gym Owner';
                document.querySelector('#profile-username').textContent = username;
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

onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchGymOwnerUsername();
    }
});
