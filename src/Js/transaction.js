import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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
const auth = getAuth(app);

// Global Spinner functions
function showSpinner() {
    const spinner = document.getElementById("globalSpinner");
    if (spinner) spinner.style.display = "flex"; // Show spinner
    else console.error("Spinner element not found in the DOM.");
}

function hideSpinner() {
    const spinner = document.getElementById("globalSpinner");
    if (spinner) spinner.style.display = "none"; // Hide spinner
    else console.error("Spinner element not found in the DOM.");
}

// Show loading on button
function showButtonSpinner(button) {
    button.disabled = true;
    button.innerHTML = `<span class="loader-button"></span> ${button.textContent}`; // Append spinner to button text
}

// Hide loading on button
function hideButtonSpinner(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText; // Restore original button text
}



// Function to fetch the current gym owner's gymName
async function getGymOwnerName(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'GymOwner', userId));
        if (userDoc.exists()) {
            console.log("Gym Owner Found:", userDoc.data().gymName);
            return userDoc.data().gymName;
        } else {
            console.error("Gym owner document not found.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching gym owner name:", error);
    }
}

// Function to update the status of a transaction in Firestore and update the table status
async function updateTransactionStatus(transactionId, newStatus, statusCell, button) {
    const originalButtonText = button.innerHTML; // Store original button text
    try {
        showSpinner(); // Show global spinner
        showButtonSpinner(button); // Show spinner on button

        const transactionRef = doc(db, "Transactions", transactionId);
        const transactionDoc = await getDoc(transactionRef);
        
        if (transactionDoc.exists()) {
            await updateDoc(transactionRef, { status: newStatus });
            console.log(`Transaction ${transactionId} status updated to ${newStatus}`);
            
            // Update the status cell in the table after a successful Firestore update
            if (statusCell) {
                statusCell.textContent = newStatus;
            }
        } else {
            console.warn(`Transaction ID ${transactionId} not found in Notifications collection.`);
            alert("Transaction not found."); // Inform the user if the document does not exist
        }

    } catch (error) {
        console.error("Error updating transaction status:", error);
    } finally {
        hideSpinner(); // Ensure global spinner is hidden
        hideButtonSpinner(button, originalButtonText); // Restore button text and state
    }
}


// Fetch transactions based on type and filter by gym name and user
async function fetchTransactionsByTypeAndGymName(userId, type, gymName) {
    try {
        if (!userId || !type || !gymName) {
            console.error("Invalid parameters passed to fetchTransactionsByTypeAndGymName:", { userId, type, gymName });
            return [];
        }

        let fieldName;
        let expectedValue;

        if (type === 'membership') {
            fieldName = 'type';
            expectedValue = 'membership';
        } else if (type === 'Booking_trainer') {
            fieldName = 'type';
            expectedValue = 'Booking_trainer';
        } else if (type === 'product') {
            fieldName = 'type';
            expectedValue = 'product';
        } else {
            console.warn(`Invalid type provided: "${type}"`);
            return [];
        }

        const transactionsQuery = query(
            collection(db, "Transactions"),
            where(fieldName, "==", expectedValue),
            where("gymName", "==", gymName)
        );

        const transactionsSnapshot = await getDocs(transactionsQuery);

        if (transactionsSnapshot.empty) {
            console.warn(`No transactions found for type "${type}" and gym "${gymName}".`);
        } else {
            console.log(`Transactions found for type "${type}" and gym "${gymName}":`, transactionsSnapshot.docs.map(doc => doc.data()));
        }

        return transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Include document ID
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
}

// Populate the table with action buttons and add event listeners for status updates
async function populateTable(transactionType, transactions) {
    const tableBody = document.querySelector(`#${transactionType}Table tbody`);

    if (!tableBody) {
        console.error(`Table for transaction type "${transactionType}" not found.`);
        return;
    }

    tableBody.innerHTML = ''; // Clear existing rows

    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9">No transactions found.</td></tr>';
        return;
    }

    for (let transaction of transactions) {
        const row = document.createElement('tr');

        // Fetch username based on userId
        const username = await getUsernameFromUserId(transaction.userId);

        let formattedPurchaseDate = 'N/A';
        if (transaction.purchaseDate) {
            formattedPurchaseDate = formatTimestamp(transaction.purchaseDate); // Format purchaseDate
        }

        if (transactionType === 'membership') {
            row.innerHTML = `
                <td>${username || 'N/A'}</td> <!-- Display username next to userId -->
                <td>${transaction.gymName || 'N/A'}</td>
                <td>${transaction.membershipDays || 'N/A'}</td>
                <td>${transaction.price || 'N/A'}</td>
                <td>${transaction.planType || 'N/A'}</td>
                <td>${formattedPurchaseDate}</td> <!-- Use formatted purchase date -->
                <td class="status-cell">${transaction.status || 'N/A'}</td>
                <td>
                    <button class="action-button approve" data-id="${transaction.id}">Approve</button>
                    <button class="action-button idle" data-id="${transaction.id}">Idle</button>
                    <button class="action-button blocked" data-id="${transaction.id}">Blocked</button>
                </td>
            `;
        }

        // Attach click events to action buttons
        const statusCell = row.querySelector('.status-cell');
        row.querySelector('.approve').addEventListener('click', (event) => {
            updateTransactionStatus(transaction.id, 'Approved', statusCell, event.target);
        });
        row.querySelector('.idle').addEventListener('click', (event) => {
            updateTransactionStatus(transaction.id, 'Idle', statusCell, event.target);
        });
        row.querySelector('.blocked').addEventListener('click', (event) => {
            updateTransactionStatus(transaction.id, 'Blocked', statusCell, event.target);
        });

        tableBody.appendChild(row);
    }
}

// Function to fetch the username based on the userId
async function getUsernameFromUserId(userId) {
    try {
        // Log userId for debugging
        console.log("Fetching user for userId:", userId);

        // Check if userId is the document ID
        const userDoc = await getDoc(doc(db, 'Users', String(userId)));

        if (userDoc.exists()) {
            return userDoc.data().username || null;
        }

        // If userId is a field, query the collection
        console.warn(`Document with ID ${userId} not found. Querying collection.`);
        const q = query(
            collection(db, 'Users'),
            where('userId', '==', Number(userId)) // Match userId as a number
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDocFromQuery = querySnapshot.docs[0]; // Use the first matching document
            return userDocFromQuery.data().username || null;
        } else {
            console.warn("No user document found for userId:", userId);
            return null;
        }
    } catch (error) {
        console.error("Error fetching username:", error);
        return null;
    }
}


// Load and display transactions in modal
async function loadTransactions(userId, type, gymName) {
    const validTypes = ['membership', 'Booking_trainer', 'product'];

    if (!validTypes.includes(type)) {
        console.error(`Invalid transaction type specified: "${type}"`);
        return;
    }

    const transactions = await fetchTransactionsByTypeAndGymName(userId, type, gymName);

    if (type === 'membership') {
        populateTable('membership', transactions);
        $('#membershipsModal').modal('show');
    }
}

// Event listener to fetch gym owner's gymName on page load
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const gymName = await getGymOwnerName(user.uid);
        if (gymName) {
            loadTransactions(user.uid, 'membership', gymName); // Default load for memberships
        } else {
            console.error("Gym name not found for the logged-in user.");
        }
    } else {
        console.error("User is not authenticated.");
    }
});

// Event listener for button clicks to load transactions
document.querySelectorAll('button[data-type]').forEach(button => {
    button.addEventListener('click', (event) => {
        const transactionType = event.target.getAttribute('data-type');
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const gymName = await getGymOwnerName(user.uid);
                if (gymName) {
                    loadTransactions(user.uid, transactionType, gymName);
                } else {
                    console.error("Gym name not found for the logged-in user.");
                }
            } else {
                console.error("User is not authenticated.");
            }
        });
    });
});

async function fetchTrainerTransactions(userId, gymName) {
    try {
        if (!userId || !gymName) {
            console.error("Invalid parameters for fetchTrainerTransactions:", { userId, gymName });
            return [];
        }

        const transactionsQuery = query(
            collection(db, "Notifications"),
            where("type", "==", "Booking_trainer"),
            where("gymName", "==", gymName)
        );

        const transactionsSnapshot = await getDocs(transactionsQuery);

        if (transactionsSnapshot.empty) {
            console.warn(`No trainer notifications found for gym "${gymName}".`);
        } else {
            console.log(`Trainer notifications found for gym "${gymName}":`, transactionsSnapshot.docs.map(doc => doc.data()));
        }

        return transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching trainer notifications:", error);
        return [];
    }
}
async function updateNotificationStatus(notificationId, status, statusCell, button) {
    try {
        const notificationRef = doc(db, "Notifications", notificationId);
        await updateDoc(notificationRef, { status });

        // Update the status cell in the table
        statusCell.textContent = status;

        // Optionally disable buttons or provide feedback
        button.classList.add("updated");
        showToast("success", `Status updated to "${status}".`);
    } catch (error) {
        console.error(`Error updating status for notification ID ${notificationId}:`, error);
        showToast("error", "Failed to update status. Please try again.");
    }
}
function showToast(type, message) {
    const toastContainer = document.getElementById('toast-container');

    if (!toastContainer) {
        console.error("Toast container not found.");
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`; // Use different styles for success, error, etc.
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Automatically remove the toast after a delay
    setTimeout(() => {
        toast.remove();
    }, 3000); // 3 seconds
}


async function populateTrainerTable(transactions) {
    const tableBody = document.querySelector("#Booking_trainerTable tbody");

    if (!tableBody) {
        console.error(`Table for trainer transactions not found.`);
        return;
    }

    tableBody.innerHTML = ''; // Clear existing rows

    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No transactions found.</td></tr>';
        return;
    }

    for (let transaction of transactions) {
        const row = document.createElement('tr');

        // Fetch username based on userId
        const username = await getUsernameFromUserId(transaction.userId);

        // Use the formatTimestamp function to convert the raw timestamp
        const formattedTimestamp = transaction.timestamp
            ? formatTimestamp(transaction.timestamp)
            : 'N/A';

        row.innerHTML = `
            <td>${username || 'N/A'}</td> <!-- Display username next to userId -->
            <td>${transaction.gymName || 'N/A'}</td>
            <td>${transaction.username || 'N/A'}</td>
            <td>${formattedTimestamp}</td> <!-- Display formatted timestamp here -->
            <td>${transaction.price || 'N/A'}</td>
            <td>${transaction.notificationId || 'N/A'}</td>
            <td class="status-cell">${transaction.status || 'N/A'}</td>
            <td>
                <button class="action-button approve" data-id="${transaction.id}">Approve</button>
                <button class="action-button idle" data-id="${transaction.id}">Idle</button>
                <button class="action-button blocked" data-id="${transaction.id}">Blocked</button>
            </td>
        `;

        const statusCell = row.querySelector('.status-cell');
        row.querySelector('.approve').addEventListener('click', (event) => {
            updateNotificationStatus(transaction.id, 'Approved', statusCell, event.target);
        });
        row.querySelector('.idle').addEventListener('click', (event) => {
            updateNotificationStatus(transaction.id, 'Idle', statusCell, event.target);
        });
        row.querySelector('.blocked').addEventListener('click', (event) => {
            updateNotificationStatus(transaction.id, 'Blocked', statusCell, event.target);
        });

        tableBody.appendChild(row);
    }
}

async function fetchAndPopulateTrainerNotifications(userId, gymName) {
    try {
        const transactions = await fetchTrainerTransactions(userId, gymName);
        await populateTrainerTable(transactions);
    } catch (error) {
        console.error("Error fetching and populating trainer notifications:", error);
    }
}


async function loadTrainerTransactions(userId, gymName) {
    const transactions = await fetchTrainerTransactions(userId, gymName);

    populateTrainerTable(transactions);

    $('#trainersModal').modal('show'); // Show the modal
}

document.querySelector('button[data-type="Booking_trainer"]').addEventListener('click', async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const gymName = await getGymOwnerName(user.uid);
            if (gymName) {
                loadTrainerTransactions(user.uid, gymName);
            }
        } else {
            console.error("User is not authenticated.");
        }
    });
});
function formatTimestamp(timestamp) {
    if (timestamp) {
        // If timestamp is a Firestore Timestamp object
        if (timestamp.seconds) {
            const date = new Date(timestamp.seconds * 1000); // Convert seconds to milliseconds
            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString(); // Check for invalid date
        }
        // If timestamp is an ISO 8601 string (like '2024-11-05T13:17:02.381Z')
        else if (typeof timestamp === 'string') {
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString(); // Check for invalid date
        }
    }
    return 'N/A'; // If no valid timestamp, return 'N/A'
}



async function fetchProductTransactions(userId, gymName) {
    try {
        if (!userId || !gymName) {
            console.error("Invalid parameters for fetchProductTransactions:", { userId, gymName });
            return [];
        }

        const transactionsQuery = query(
            collection(db, "Notifications"),
            where("type", "==", "Products"), // Ensure it matches product notifications
            where("gymName", "==", gymName)
        );

        const transactionsSnapshot = await getDocs(transactionsQuery);

        if (transactionsSnapshot.empty) {
            console.warn(`No product transactions found for gym "${gymName}" and user "${userId}".`);
            return [];
        }

        console.log(`Product notifications found for gym "${gymName}":`, transactionsSnapshot.docs.map(doc => doc.data()));
        return transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching product transactions:", error);
        return [];
    }
}

async function populateProductTable(transactions) {
    const tableBody = document.querySelector("#productTable tbody");

    if (!tableBody) {
        console.error(`Table for product transactions not found.`);
        return;
    }

    tableBody.innerHTML = ''; // Clear existing rows

    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No transactions found.</td></tr>';
        return;
    }

    for (let transaction of transactions) {
        const row = document.createElement('tr');

        // Fetch username based on userId
        const username = await getUsernameFromUserId(transaction.userId);

        // Format timestamp if available
        const formattedTimestamp = transaction.timestamp
            ? formatTimestamp(transaction.timestamp)
            : 'N/A';

        row.innerHTML = `
            <td>${username || 'N/A'}</td>
            <td>${transaction.gymName || 'N/A'}</td>
            <td>${transaction.productName || 'N/A'}</td>
            <td>${transaction.quantity || 'N/A'}</td>
            <td>${formattedTimestamp}</td>
            <td>${transaction.totalPrice || 'N/A'}</td>
            <td>${transaction.notificationId || 'N/A'}</td>
            <td class="status-cell">${transaction.status || 'N/A'}</td>
            <td>
                <button class="action-button approve" data-id="${transaction.id}">Approve</button>
                <button class="action-button idle" data-id="${transaction.id}">Idle</button>
                <button class="action-button blocked" data-id="${transaction.id}">Blocked</button>
            </td>
        `;

        const statusCell = row.querySelector('.status-cell');
        row.querySelector('.approve').addEventListener('click', (event) => {
            updateNotificationStatus(transaction.id, 'Approved', statusCell, event.target);
        });
        row.querySelector('.idle').addEventListener('click', (event) => {
            updateNotificationStatus(transaction.id, 'Idle', statusCell, event.target);
        });
        row.querySelector('.blocked').addEventListener('click', (event) => {
            updateNotificationStatus(transaction.id, 'Blocked', statusCell, event.target);
        });

        tableBody.appendChild(row);
    }
}

async function loadProductTransactions(userId, gymName) {
    try {
        const transactions = await fetchProductTransactions(userId, gymName);
        await populateProductTable(transactions);
        $('#productsModal').modal('show'); // Show the modal
    } catch (error) {
        console.error("Error loading product transactions:", error);
    }
}



document.querySelector('button[data-type="product"]').addEventListener('click', async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const gymName = await getGymOwnerName(user.uid);
            if (gymName) {
                loadProductTransactions(user.uid, gymName);
            }
        } else {
            console.error("User is not authenticated.");
        }
    });
});
// Function to search for a transaction by ID
async function searchTransactionById(transactionId, userId, gymName) {
    if (!transactionId) {
        console.error("Transaction ID is required for search.");
        return;
    }

    console.log("Searching for Transaction ID:", transactionId, "Gym Name:", gymName); // Log search parameters

    try {
        showSpinner(); // Show spinner during search
        const transactionRef = doc(db, "Transactions", transactionId);
        const transactionDoc = await getDoc(transactionRef);

        if (transactionDoc.exists()) {
            const data = transactionDoc.data();
            if (data.gymName === gymName) {
                console.log("Transaction found:", data);
                
                const transactionData = { id: transactionDoc.id, ...data };
                const type = transactionData.type;

                // Populate the appropriate table based on transaction type
                if (type === 'membership') {
                    populateTable('membership', [transactionData]);
                    $('#membershipsModal').modal('show');
                } else if (type === 'Booking_trainer') {
                    populateTrainerTable([transactionData]);
                    $('#trainersModal').modal('show');
                } else if (type === 'product') {
                    populateProductTable([transactionData]);
                    $('#productsModal').modal('show');
                } else {
                    console.error("Invalid transaction type.");
                }
            } else {
                console.warn(`Transaction found but does not belong to gym: ${gymName}`);
                alert("Transaction does not match the current gym.");
            }
        } else {
            console.warn(`No transaction found with ID: ${transactionId} for gym: ${gymName}`);
            alert("No transaction found with the entered ID.");
        }
    } catch (error) {
        console.error("Error fetching transaction by ID:", error);
    } finally {
        hideSpinner(); // Hide spinner after search
    }
}


// Event listener for search button
document.getElementById("searchTransactionButton").addEventListener("click", async () => {
    const transactionId = document.getElementById("searchTransactionId").value.trim();
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const gymName = await getGymOwnerName(user.uid);
            if (gymName) {
                searchTransactionById(transactionId, user.uid, gymName);
            } else {
                console.error("Gym name not found for the logged-in user.");
            }
        } else {
            console.error("User is not authenticated.");
        }
    });
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