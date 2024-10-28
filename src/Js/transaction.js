import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
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

// Fetch transactions based on type (e.g., 'planId' for memberships) and filter by gym name and user
async function fetchTransactionsByTypeAndGymName(userId, type, gymName) {
    try {
        if (!userId || !type || !gymName) {
            console.error("Invalid parameters passed to fetchTransactionsByTypeAndGymName:", { userId, type, gymName });
            return [];
        }

        let fieldName;
        let expectedValue; // New variable to store the expected value for each type

        // Dynamically set the field name and expected value based on the transaction type
        if (type === 'planId') {
            fieldName = 'planType';        // Field for memberships
            expectedValue = 'membership';   // Change this to match the exact `planType` value in Firestore
        } else if (type === 'trainerId') {
            fieldName = 'trainerId';
            expectedValue = 'trainerId';    // Adjust this to the actual trainer ID or value used
        } else if (type === 'productId') {
            fieldName = 'productId';
            expectedValue = 'productId';    // Adjust as needed
        } else {
            console.warn(`Invalid type provided: "${type}"`);
            return [];
        }

        console.log(`Starting query tests with userId: ${userId}, fieldName: ${fieldName}, expectedValue: ${expectedValue}, gymName: ${gymName}`);

        // Step 1: Query by userId
        const userQuery = query(collection(db, "Transactions"), where("userId", "==", userId));
        const userSnapshot = await getDocs(userQuery);
        console.log("Results for query by userId:", userSnapshot.docs.map(doc => doc.data()));

        // Step 2: Query by gymName
        const gymQuery = query(collection(db, "Transactions"), where("gymName", "==", gymName));
        const gymSnapshot = await getDocs(gymQuery);
        console.log("Results for query by gymName:", gymSnapshot.docs.map(doc => doc.data()));

        // Step 3: Query by fieldName (planType/trainerId/productId)
        const typeQuery = query(collection(db, "Transactions"), where(fieldName, "==", expectedValue));
        const typeSnapshot = await getDocs(typeQuery);
        console.log(`Results for query by ${fieldName}:`, typeSnapshot.docs.map(doc => doc.data()));

        // Step 4: Combined Query
        const transactionsQuery = query(
            collection(db, "Transactions"),
            where(fieldName, "==", expectedValue),
            where("gymName", "==", gymName),
            where("userId", "==", userId)
        );

        const transactionsSnapshot = await getDocs(transactionsQuery);

        if (transactionsSnapshot.empty) {
            console.warn(`No transactions found for type "${type}", gym "${gymName}", and user "${userId}".`);
        } else {
            console.log(`Transactions found for type "${type}", gym "${gymName}", and user "${userId}":`, transactionsSnapshot.docs.map(doc => doc.data()));
        }

        return transactionsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
}



// Populate the table with filtered transaction data
function populateTable(transactionType, transactions) {
    const tableBody = document.querySelector(`#${transactionType}Table tbody`);
    tableBody.innerHTML = ''; // Clear existing rows

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

// Load and display transactions in modal
async function loadTransactions(userId, type, gymName) {
    const validTypes = ['planId', 'trainerId', 'productId'];

    if (!validTypes.includes(type)) {
        console.error(`Invalid transaction type specified: "${type}"`);
        return;
    }

    const transactions = await fetchTransactionsByTypeAndGymName(userId, type, gymName);

    // Show relevant modal based on type
    if (type === 'planId') {
        populateTable('memberships', transactions);
        $('#membershipsModal').modal('show');
    } else if (type === 'trainerId') {
        populateTable('trainers', transactions);
        $('#trainersModal').modal('show');
    } else if (type === 'productId') {
        populateTable('products', transactions);
        $('#productsModal').modal('show');
    } else {
        console.error("Unexpected error: Invalid transaction type in modal selection.");
    }
}

// Event listener to fetch gym owner's gymName on page load
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const gymName = await getGymOwnerName(user.uid);
        if (gymName) {
            console.log("Loading default memberships for gym:", gymName);
            loadTransactions(user.uid, 'planId', gymName); // Default load for memberships
        } else {
            console.error("Gym name not found for the logged-in user.");
        }
    } else {
        console.error("User is not authenticated.");
    }
});

// Event listener to load transactions based on `data-type` from button click
document.querySelectorAll('button[data-type]').forEach(button => {
    button.addEventListener('click', (event) => {
        const transactionType = event.target.getAttribute('data-type'); // Get the correct type from `data-type`
        
        console.log(`Transaction type selected: "${transactionType}"`);

        // Fetch the gym owner's gymName and then load transactions
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const gymName = await getGymOwnerName(user.uid);
                if (gymName) {
                    console.log(`Calling loadTransactions with type "${transactionType}" and gym "${gymName}"`);
                    loadTransactions(user.uid, transactionType, gymName); // Pass userId, transactionType, gymName
                } else {
                    console.error("Gym name not found for the logged-in user.");
                }
            } else {
                console.error("User is not authenticated.");
            }
        });
    });
});
