import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs,getDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase configuration
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

// Function to fetch the current gym owner's gymName
async function getGymOwnerName(userId) {
    const userDoc = await getDoc(doc(db, 'Users', userId));
    if (userDoc.exists()) {
        return userDoc.data().gymName;
    } else {
        console.error("Gym owner not found.");
        return null;
    }
}


// Fetch transactions for the current gym owner
async function fetchTransactionsByTypeAndGymName(transactionType, gymName) {
    try {
        const transactionsQuery = query(
            collection(db, "Transactions"),
            where("transactionType", "==", transactionType),
            where("gymName", "==", gymName)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        return transactionsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching transactions:", error);
    }
}

// Populate the table with filtered transaction data
function populateTable(transactionType, transactions) {
    const tableBody = document.querySelector(`#${transactionType}Table tbody`);
    tableBody.innerHTML = ''; // Clear any existing rows

    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No transactions found.</td></tr>';
        return;
    }

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.name || 'N/A'}</td>
            <td>${transaction.date || 'N/A'}</td>
            <td>${transaction.price || 'N/A'}</td>
            <td>${transaction.status || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Load the data and show the relevant modal
async function loadTransactions(type, gymName) {
    const transactions = await fetchTransactionsByTypeAndGymName(type, gymName);

    if (type === 'memberships') {
        populateTable('memberships', transactions);
        $('#membershipsModal').modal('show');
    } else if (type === 'trainers') {
        populateTable('trainers', transactions);
        $('#trainersModal').modal('show');
    } else if (type === 'products') {
        populateTable('products', transactions);
        $('#productsModal').modal('show');
    }
}

// Event listeners for buttons to load transactions
document.querySelectorAll('button[data-target]').forEach(button => {
    button.addEventListener('click', (event) => {
        const targetType = event.target.getAttribute('data-target');

        if (targetType) {
            const transactionType = targetType.replace('Modal', ''); // Remove 'Modal' from the string

            // Fetch the gym owner's gymName and then load transactions
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const gymName = await getGymOwnerName(user.uid);
                    if (gymName) {
                        loadTransactions(transactionType, gymName);
                    } else {
                        console.error("Gym name not found for the logged-in user.");
                    }
                } else {
                    console.error("User is not authenticated.");
                }
            });
        } else {
            console.error("Button does not have a valid data-target attribute.");
        }
    });
});


// Fetch the gym owner data on page load
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const gymName = await getGymOwnerName(user.uid);
        if (gymName) {
            loadTransactions('memberships', gymName); // Load memberships by default
        } else {
            console.error("Gym name not found for the logged-in user.");
        }
    } else {
        console.error("User is not authenticated.");
    }
});
