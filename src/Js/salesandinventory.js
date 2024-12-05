import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to fetch the current gym owner's gymName
async function getGymOwnerName(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'GymOwner', userId)); // Assuming 'GymOwner' is the collection
        if (userDoc.exists()) {
            return userDoc.data().gymName;
        } else {
            console.error("Gym owner document not found.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching gym owner name:", error);
        return null;
    }
}

// Helper function to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PHP'
    }).format(parseFloat(amount));
};

// Helper function to format timestamps
const formatTimestamp = (timestamp) => {
    if (timestamp) {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    }
    return 'N/A';
};

// Function to load and display products based on gymName
const loadInventory = async (gymName) => {
    const productsBody = document.getElementById('productsBody');
    productsBody.innerHTML = ''; // Clear any existing rows

    if (!gymName) {
        alert('No gym name found for the logged-in user.');
        return;
    }

    try {
        const productsQuery = query(
            collection(db, 'Products'),
            where('gymName', '==', gymName)
        );
        const productsSnapshot = await getDocs(productsQuery);

        if (productsSnapshot.empty) {
            productsBody.innerHTML = '<tr><td colspan="7">No products available for this gym</td></tr>';
            return;
        }

        productsSnapshot.forEach((doc) => {
            const data = doc.data();

            // Create a row for each product
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.productId || 'N/A'}</td>
                <td>${data.name || 'N/A'}</td>
                <td>${data.category || 'N/A'}</td>
                <td>${data.quantity || 0}</td>
                <td>${formatCurrency(data.price || '0.00')}</td>
                <td>${formatTimestamp(data.dateAdded)}</td>
            `;
            productsBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Failed to load products.');
    }
};

// Authenticate the user and load the inventory
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const gymName = await getGymOwnerName(user.uid);
        if (gymName) {
            // Check if total inventory is already stored in localStorage
            const storedTotalInventory = localStorage.getItem('totalInventory');
            if (storedTotalInventory) {
                document.getElementById("totalInventory").textContent = `${storedTotalInventory} Items`;
            } else {
                // If no stored inventory count, fetch from Firestore
                loadInventoryDetails(gymName);  // Fetch from Firestore if no stored value
            }
            
            // Call loadInventory to load products on the page
            loadInventory(gymName);
        }
    } else {
        alert('You must be logged in to view this page.');
        window.location.href = 'login.html';
    }
});


// Add Event Listener to the Inventory Card
document.getElementById("inventoryOverviewCard").addEventListener("click", async () => {
    const user = auth.currentUser;
    if (user) {
        const gymName = await getGymOwnerName(user.uid);
        if (gymName) {
            await loadInventoryDetails(gymName);
            new bootstrap.Modal(document.getElementById("inventoryModal")).show();
        }
    } else {
        alert("You must be logged in to view this page.");
        window.location.href = "login.html";
    }
});

// Function to Load Inventory Details
async function loadInventoryDetails(gymName) {
    const inventoryTableBody = document.getElementById("inventoryTableBody");
    const totalInventoryElement = document.getElementById("totalInventory");

    inventoryTableBody.innerHTML = ""; // Clear existing rows

    try {
        const productsQuery = query(collection(db, "Products"), where("gymName", "==", gymName));
        const productsSnapshot = await getDocs(productsQuery);

        if (productsSnapshot.empty) {
            inventoryTableBody.innerHTML = '<tr><td colspan="4">No products available</td></tr>';
            totalInventoryElement.textContent = "0 Items";
            localStorage.setItem('totalInventory', 0);  // Store total inventory as 0 in localStorage
            return;
        }

        let totalProducts = 0;

        productsSnapshot.forEach((doc) => {
            const data = doc.data();
            totalProducts++;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><img src="${data.photoURL || 'https://via.placeholder.com/100'}" alt="${data.name}" style="width: 100px; height: auto;"></td>
                <td>${data.name || "N/A"}</td>
                <td>${data.category || "N/A"}</td>
                <td>${data.description || "N/A"}</td>
            `;
            inventoryTableBody.appendChild(row);
        });

        // Store the updated total inventory count in localStorage
        localStorage.setItem('totalInventory', totalProducts);

        // Update total inventory count in the UI
        totalInventoryElement.textContent = `${totalProducts} Items`;
    } catch (error) {
        console.error("Error fetching inventory details:", error);
        alert("Failed to load inventory details.");
    }
}



const loadPendingSales = async () => {
    const pendingSalesTableBody = document.getElementById('pendingSalesTableBody');
    const pendingSalesElement = document.getElementById('pendingSales');
    let totalPendingSales = 0;

    pendingSalesTableBody.innerHTML = ''; // Clear any existing rows

    try {
        // Fetch transactions from the 'Transactions' collection
        const transactionsSnapshot = await getDocs(collection(db, 'Transactions'));

        transactionsSnapshot.forEach((doc) => {
            const data = doc.data();

            // Filter for transactions with status "pending"
            if (data.status === 'Pending') {
                // Safely parse and calculate total sales for pending transactions
                const totalPriceString = typeof data.totalPrice === 'string' ? data.totalPrice : '₱0';
                const sanitizedPrice = totalPriceString.replace(/[^\d.]/g, ''); // Remove non-numeric characters
                const parsedPrice = parseFloat(sanitizedPrice);

                // Ensure parsedPrice is valid
                const validPrice = isNaN(parsedPrice) ? 0 : parsedPrice;
                totalPendingSales += validPrice;

                // Create a row for each pending transaction
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${data.productName || 'N/A'}</td>
                    <td>${data.quantity || 'N/A'}</td>
                    <td>${formatCurrency(validPrice)}</td>
                    <td>${formatTimestamp(data.timestamp)}</td>
                    <td>${data.status || 'N/A'}</td>
                `;
                pendingSalesTableBody.appendChild(row);
            }
        });

        // Update the pending sales total value
        pendingSalesElement.textContent = formatCurrency(totalPendingSales);
    } catch (error) {
        console.error('Error fetching pending sales:', error);
        alert('Failed to load pending sales.');
    }
};


// Authenticate the user and load the pending sales
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Optionally, load pending sales on initial load if needed
        loadPendingSales();
    } else {
        alert('You must be logged in to view this page.');
        window.location.href = 'login.html'; // Redirect if not logged in
    }
});

// Add Event Listener to the Pending Sales Card (open the modal)
document.getElementById("SalesOverviewCard").addEventListener("click", () => {
    // Show the modal when clicking on the "Pending Sales" card
    const modal = new bootstrap.Modal(document.getElementById("pendingSalesModal"));
    modal.show();

    // Load pending sales data when the modal is shown
    loadPendingSales();
});

// Add Event Listener to the Total Sales Card
document.getElementById("totalSalesCard").addEventListener("click", async () => {
    const user = auth.currentUser;
    if (user) {
        const gymName = await getGymOwnerName(user.uid);
        if (gymName) {
            await loadSalesDetails(gymName);  // Load sales details when the modal is triggered
            new bootstrap.Modal(document.getElementById("salesModal")).show();
        }
    } else {
        alert("You must be logged in to view this page.");
        window.location.href = "login.html";
    }
});

// Function to Load Approved Sales Details
async function loadSalesDetails(gymName) {
    const salesTableBody = document.getElementById("salesTableBody");
    const totalSalesElement = document.getElementById("totalSales");

    salesTableBody.innerHTML = ""; // Clear existing rows
    let totalSalesAmount = 0;

    try {
        // Query the transactions for the gym with status "Approved"
        const transactionsQuery = query(
            collection(db, 'Transactions'),
            where('gymName', '==', gymName),   // Match the gymName
            where('status', '==', 'Approved'), // Match only approved transactions
            where('type', '==' , 'Products')
        );

        const transactionsSnapshot = await getDocs(transactionsQuery);

        if (transactionsSnapshot.empty) {
            salesTableBody.innerHTML = '<tr><td colspan="5">No approved sales found for this gym.</td></tr>';
            totalSalesElement.textContent = '₱0.00';
            return;
        }

        transactionsSnapshot.forEach((doc) => {
            const data = doc.data();

            // Safely handle undefined or invalid totalPrice
            const totalPriceString = data.totalPrice ? String(data.totalPrice) : '₱0.00';
            const cleanTotalPrice = parseFloat(totalPriceString.replace('₱', '').replace(',', '')) || 0;

            // Calculate total sales amount
            totalSalesAmount += cleanTotalPrice;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${data.productName || 'N/A'}</td>
                <td>${data.quantity || 'N/A'}</td>
                <td>${formatCurrency(cleanTotalPrice)}</td>
                <td>${formatTimestamp(data.timestamp)}</td>
                <td>${data.status || 'N/A'}</td>
            `;
            salesTableBody.appendChild(row);
        });

        // Update total sales amount in the UI
        totalSalesElement.textContent = formatCurrency(totalSalesAmount);
    } catch (error) {
        console.error("Error fetching sales details:", error);
        alert("Failed to load sales details.");
    }
}

async function getCurrentGymOwnerDetails() {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error('No user is currently logged in.');
            alert('Please log in to view sales details.');
            return;
        }

        const currentUserId = currentUser.uid;

        // Fetch the current gym owner's details from Firestore
        const gymOwnerSnapshot = await getDoc(doc(db, 'GymOwner', currentUserId));
        if (gymOwnerSnapshot.exists()) {
            const gymOwnerData = gymOwnerSnapshot.data();
            const gymName = gymOwnerData.gymName; // Ensure the gymName field exists in your Firestore
            loadSalesDetails(gymName);
        } else {
            console.error('Gym Owner not found.');
            alert('Unable to fetch Gym Owner details.');
        }
    } catch (error) {
        console.error('Error fetching Gym Owner details:', error);
    }
}

// Ensure user is authenticated before fetching gym owner details
onAuthStateChanged(auth, (user) => {
    if (user) {
        getCurrentGymOwnerDetails();
    } else {
        console.error('User is not logged in.');
        alert('Please log in to view sales details.');
    }
});