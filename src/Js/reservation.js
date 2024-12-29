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

window.updateReservationStatus = async (docId, newStatus) => {
    try {
        const reservationRef = doc(db, 'Transactions', docId);
        await updateDoc(reservationRef, {
            status: newStatus
        });

        // Show success toast at bottom-right (smaller size)
        Toastify({
            text: `Reservation ${newStatus.toLowerCase()} successfully!`,
            duration: 2500,
            gravity: "bottom",
            position: "right",
            stopOnFocus: true,
            style: {
                background: "#28a745",
                borderRadius: "6px",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                padding: "8px 16px",  // Smaller padding
                fontSize: "14px",     // Smaller font size
                minWidth: "200px"     // Set a minimum width to avoid overflow
            }
        }).showToast();

        // Refresh data after update
        await fetchDayPassReservations();
    } catch (error) {
        // Show error toast (smaller size)
        Toastify({
            text: "Failed to update reservation!",
            duration: 2500,
            gravity: "bottom",
            position: "right",
            stopOnFocus: true,
            style: {
                background: "#d33",
                borderRadius: "6px",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                padding: "8px 16px",
                fontSize: "14px",
                minWidth: "200px"
            }
        }).showToast();

        console.error('Error updating status:', error);
    }
};




// Function to delete a reservation
window.deleteReservation = async (docId) => {
    try {
        // Confirm with SweetAlert
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        // If confirmed, proceed to delete
        if (result.isConfirmed) {
            const reservationRef = doc(db, 'Transactions', docId);
            await deleteDoc(reservationRef);  // Delete from Firestore

            // Show success toast
            Toastify({
                text: 'Reservation deleted successfully!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: {
                    background: '#d33',
                }
            }).showToast();

            // Refresh table or data
            await fetchDayPassReservations();
        }
    } catch (error) {
        // Show error alert if delete fails
        Swal.fire({
            icon: 'error',
            title: 'Failed to delete!',
            text: 'Something went wrong while deleting the reservation.',
            footer: 'Please try again later.'
        });

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
