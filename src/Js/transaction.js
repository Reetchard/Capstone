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
        const userDoc = await getDoc(doc(db, 'Users', userId));
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
        await updateDoc(transactionRef, { status: newStatus });
        console.log(`Transaction ${transactionId} status updated to ${newStatus}`);
        
        // Update the status cell in the table after a successful Firestore update
        if (statusCell) {
            statusCell.textContent = newStatus;
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
function populateTable(transactionType, transactions) {
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

    transactions.forEach(transaction => {
        const row = document.createElement('tr');

        if (transactionType === 'membership') {
            row.innerHTML = `
                <td>${transaction.userId || 'N/A'}</td>            
                <td>${transaction.gymName || 'N/A'}</td>
                <td>${transaction.membershipDays || 'N/A'}</td>
                <td>${transaction.planPrice || 'N/A'}</td>
                <td>${transaction.planType || 'N/A'}</td>
                <td>${transaction.purchaseDate || 'N/A'}</td>
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
    });
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
