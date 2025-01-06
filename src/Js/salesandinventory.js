import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getFirestore, collection, getDocs, query, where, doc, getDoc,onSnapshot } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import dayjs from 'https://cdn.jsdelivr.net/npm/dayjs@1.11.7/+esm';

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

const loadPendingData = async (collectionName, tableBodyId, criteria, typeFilter) => {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.error(`❌ Table body with ID '${tableBodyId}' not found.`);
        return 0;
    }

    tableBody.innerHTML = ''; // Clear the table body
    let totalPending = 0;

    try {
        const currentGymName = await validateUser();
        const snapshot = await getDocs(collection(db, collectionName));

        snapshot.forEach(doc => {
            const data = doc.data();
            if (
                data.status === 'Pending', 'Pending Owner Approval'&& 
                data.type === typeFilter && 
                data.gymName === currentGymName
            ) {
                const row = document.createElement('tr');
                row.innerHTML = criteria(data);
                tableBody.appendChild(row);

                // Clean the price or totalPrice to remove non-numeric characters (e.g., peso sign)
                const cleanPrice = parseFloat((data.price || data.totalPrice || '0').replace(/[^\d.-]/g, '')) || 0;

                // Only add valid numbers to totalPending
                if (!isNaN(cleanPrice)) {
                    totalPending += cleanPrice;
                } else {
                    console.warn(`❌ Invalid price or totalPrice value: ${data.price || data.totalPrice}`);
                }
            }
        });

        return totalPending;
    } catch (error) {
        console.error(`❌ Error fetching ${collectionName}:`, error);
        alert(error.message);
        return 0;
    }
};



const loadPendingSales = async () => {
    const totalPendingSales = await loadPendingData(
        'Transactions',
        'pendingSalesTableBody',
        (data) => {
            // Clean the totalPrice to remove the peso sign and convert to a number
            const cleanTotalPrice = parseFloat(data.totalPrice.replace(/[^\d.-]/g, '')) || 0;

            return `
               <td>${data.userId || 'N/A'}</td>
                <td>${data.productName || 'N/A'}</td>
                <td>${data.quantity || 'N/A'}</td>
                <td>${formatCurrency(cleanTotalPrice)}</td>
                <td>${data.status || 'N/A'}</td>
            `;
        },
        'Products'
    );

    // Make sure to update the 'sales-tab' correctly
    const salesTab = document.getElementById('sales-tab');
    if (salesTab) {
        salesTab.innerHTML = `Product Sales (${formatCurrency(totalPendingSales)})`;
    } else {
        console.error("❌ 'sales-tab' element not found.");
    }
};

const loadPendingBookings = async () => {
    try {
        const totalPendingBookings = await loadPendingData(
            'Notifications',  // Change the collection name to 'Notifications'
            'pendingBookingsTableBody',
            (data) => {
                // Only process transactions with 'Pending' status, ignore 'Accepted'
                if (data.status !== 'Pending') {
                    return ''; // Skip this row if status is not 'Pending'
                }

                // Display data for pending bookings
                return `
                    <td>${data.userId || 'N/A'}</td>
                    <td>${data.username || 'N/A'}</td>
                    <td>${formatTimestamp(data.bookingDate)}</td>
                    <td>${formatCurrency(parseFloat(data.price.replace(/[^\d.-]/g, '')) || 0)}</td>
                    <td>${data.status || 'N/A'}</td>
                `;
            },
            'Booking_trainer'  // Transaction type
        );

        // Ensure totalPendingBookings is an array before processing
        const bookingsArray = Array.isArray(totalPendingBookings) ? totalPendingBookings : [totalPendingBookings];

        // Sum the total price of pending bookings
        const totalAmount = bookingsArray.reduce((sum, price) => sum + (isNaN(price) ? 0 : price), 0);

        // Update the bookings tab with the total pending amount
        const bookingsTab = document.getElementById('bookings-tab');
        if (bookingsTab) {
            bookingsTab.innerHTML = `Trainer Bookings (${formatCurrency(totalAmount)})`;
        } else {
            console.error("❌ 'bookings-tab' element not found.");
        }
    } catch (error) {
        console.error('❌ Error updating pending bookings:', error);
    }
};

const loadPendingMemberships = async () => {
    try {
        // Fetch the transactions and filter out the Approved and Accepted ones
        const totalPendingMemberships = await loadPendingData(
            'Transactions',
            'pendingMembershipsTableBody',
            (data) => {
                // Filter out transactions with "Approved" or "Accepted" status
                if (data.status === 'Approved' || data.status === 'Accepted') {
                    return ''; // Return empty string to skip this row
                }

                // If the status is "Pending" or "Pending Owner Approval", include it in the total
                const cleanTotalPrice = (data.status === 'Pending' || data.status === 'Pending Owner Approval') 
                    ? parseFloat(data.price.replace(/[^\d.-]/g, '')) || 0 
                    : 0;

                // Handle undefined or null values gracefully with fallback values
                return {
                    price: cleanTotalPrice, // Return price as a number for summing
                    row: ` 
                        <td>${data.userId || 'N/A'}</td>
                        <td>${data.planType || 'N/A'}</td>
                        <td>${data.price || 'N/A'}</td>
                        <td>${data.membershipDays || 'N/A'} days</td>
                        <td>${formatTimestamp(data.purchaseDate) || 'N/A'}</td>
                        <td>${data.status || 'N/A'}</td>
                    `
                };
            },
            'membership'
        );

        // Log the fetched data to understand its structure
        console.log('Fetched data for memberships:', totalPendingMemberships);

        // Ensure totalPendingMemberships is an array, if it's not, turn it into an array
        const validData = Array.isArray(totalPendingMemberships) ? totalPendingMemberships : [totalPendingMemberships];

        // Insert the rows into the table body
        const tableBody = document.getElementById('pendingMembershipsTableBody');
        tableBody.innerHTML = ''; // Clear the table body before appending new rows
        let totalAmount = 0;

        validData.forEach(item => {
            // Only add to the total if the price is defined
            if (item.price !== undefined) {
                totalAmount += isNaN(item.price) ? 0 : item.price;
            }
            // Add the row HTML to the table
            tableBody.innerHTML += item.row;
        });

        // Update the Memberships tab with the total price
        document.getElementById('memberships-tab').innerHTML = `Memberships (${formatCurrency(totalAmount)})`;

    } catch (error) {
        console.error('Error loading pending memberships:', error);
    }
};


const loadPendingDayPasses = async () => {
    const totalPendingDayPasses = await loadPendingData(
        'Transactions',
        'pendingDayPassesTableBody',
        (data) => `
            <td>${data.userId || 'N/A'}</td>
            <td>${data.email || 'N/A'}</td>
            <td>${formatCurrency(data.totalPrice || 0)}</td>
            <td>${formatTimestamp(data.date)}</td>
            <td>${data.status || 'N/A'}</td>
        `,
        'Day Pass'
    );
    document.getElementById('daypasses-tab').innerHTML = `Day Passes (${formatCurrency(totalPendingDayPasses)})`;
};

// 📊 Update Pending Sales Card Total
const updatePendingSalesCard = async () => {
    try {
        // Fetch the totals from each section concurrently
        const totalPendingSales = (
            await Promise.all([
                loadPendingSales(),
                loadPendingBookings(),
                loadPendingMemberships(),
                loadPendingDayPasses()
            ])
        ).reduce((sum, value) => sum + (isNaN(value) ? 0 : value), 0); // Sum up all the totals

        console.log("Total Pending Sales:", totalPendingSales);  // Debugging step

        // Get the sales amount element to display the result
        const salesAmountElement = document.getElementById('pendingSalesAmount');
        if (salesAmountElement) {
            // Format the total and update the element's text content
            salesAmountElement.textContent = formatCurrency(totalPendingSales); // Format and display the total amount
        } else {
            console.error('❌ Sales amount card element not found!');
        }
    } catch (error) {
        console.error('❌ Error updating pending sales card:', error);

        // Handle any errors by resetting the displayed value to zero
        const salesAmountElement = document.getElementById('pendingSalesAmount');
        if (salesAmountElement) {
            salesAmountElement.textContent = '₱0.00'; // Fallback to 0 on error
        }
    }
};
 

// 🛡️ Validate User and Gym Ownership
const validateUser = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('❌ User not authenticated.');

    const gymOwnerDoc = await getDoc(doc(db, 'GymOwner', currentUser.uid));
    if (!gymOwnerDoc.exists()) throw new Error('❌ Gym owner details not found.');

    return gymOwnerDoc.data().gymName;
};

// 🛠️ Initialize the Application after Authentication
const initializeAppAfterAuth = async () => {
    try {
        await updatePendingSalesCard();

        // Add Event Listeners for Modal
        const modalElement = document.getElementById('pendingModal');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);

            // Sales Overview Card Event Listener
            const salesOverviewCard = document.getElementById('SalesOverviewCard');
            if (salesOverviewCard) {
                salesOverviewCard.addEventListener('click', async () => {
                    modalInstance.show();
                    await loadPendingSales();
                    await updatePendingSalesCard();
                });
            }

            // Modal Show Event
            modalElement.addEventListener('shown.bs.modal', async () => {
                await loadPendingSales();
                await loadPendingBookings();
                await loadPendingMemberships();
                await loadPendingDayPasses();
                await updatePendingSalesCard();
            });
        } else {
            console.error('❌ Modal element not found!');
        }
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
};

// 🛠️ Listen for Authentication Changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('🟢 User authenticated, initializing app...');
        initializeAppAfterAuth();
    } else {
        console.warn('🔴 User not authenticated, redirecting...');
        window.location.href = 'login.html';
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
            collection(db, 'Notifications'),
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
async function loadInventoryDetails() {
    console.log('Loading inventory details...');

    // Fetch the currently logged-in user data (e.g., user from Firebase Authentication)
    const user = auth.currentUser;
    if (!user) {
        console.log('No user is logged in.');
        return;
    }

    const userId = user.uid;  // Get user ID

    // Fetch gymName from the GymOwner collection where the userId matches
    try {
        const gymOwnerDocRef = doc(db, 'GymOwner', userId);
        const gymOwnerSnapshot = await getDoc(gymOwnerDocRef);

        if (!gymOwnerSnapshot.exists()) {
            console.log('No gym found for this user.');
            return;
        }

        const gymName = gymOwnerSnapshot.data().gymName;
        console.log('Gym Name:', gymName);  // Log gym name for debugging

        if (!gymName) {
            console.log('Gym name is not found.');
            return;
        }

        // Fetch inventory items from the Products collection where gymName matches the logged-in user's gym
        const productsQuery = query(collection(db, 'Products'), where('gymName', '==', gymName));
        const productsSnapshot = await getDocs(productsQuery);

        if (productsSnapshot.empty) {
            console.log('No products found for this gym.');
            return;
        }

        // Process the fetched data
        let totalItems = 0;
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(data); // Log individual product details (for debugging)

            // Assuming the 'quantity' field exists in the product document
            totalItems += data.quantity || 0; // Sum up the quantity of all products
        });

        // Update the total inventory count in the UI
        const totalInventory = document.getElementById('totalInventory');
        totalInventory.textContent = `${totalItems} Items`;  // Display the total inventory count

    } catch (error) {
        console.error('Error fetching gym name or inventory data:', error);
    }
}

// Add event listener to the inventory card
const inventoryCard = document.getElementById('inventoryOverviewCard');
inventoryCard.addEventListener('click', loadInventoryDetails);
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

// Fetch Membership Transactions
async function fetchMembershipTransactions() {
    const membershipBody = document.getElementById('membershipBody');
    membershipBody.innerHTML = '';  // Clear existing data

    try {
        const membershipQuery = query(collection(db, 'Transactions'), where('type', '==', 'membership'));
        const querySnapshot = await getDocs(membershipQuery);

        if (querySnapshot.empty) {
            membershipBody.innerHTML = '<tr><td colspan="7" class="text-center">No membership transactions found</td></tr>';
            return;
        }

        // Fetch user data for each transaction
        const fetchUserPromises = querySnapshot.docs.map(async (docItem) => {
            const data = docItem.data();
            const userId = data.userId;

            try {
                let username = 'N/A';

                // Try fetching user by document ID
                const userDocRef = doc(db, 'Users', String(userId));
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists()) {
                    // If no doc by ID, query Users collection by userId field
                    const q = query(collection(db, 'Users'), where('userId', '==', userId));
                    const userQuerySnapshot = await getDocs(q);

                    if (!userQuerySnapshot.empty) {
                        const userDoc = userQuerySnapshot.docs[0];
                        const userData = userDoc.data();
                        username = userData.username || 'N/A';
                    } else {
                        console.warn(`User with ID ${userId} not found.`);
                    }
                } else {
                    const userData = userDocSnap.data();
                    username = userData.username || 'N/A';
                }

                // Format date from purchaseDate
                const formattedDate = new Date(data.purchaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                // Create a row with membership data and fetched username
                const row = `
                    <tr>
                        <td>${data.userId}</td>
                        <td>${username}</td>
                        <td>${data.planType || 'N/A'}</td>
                        <td>₱${parseFloat(data.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${data.membershipDays || '-'}</td>
                        <td>${formattedDate}</td>
                        <td>${data.status || 'Pending'}</td>
                    </tr>
                `;
                membershipBody.innerHTML += row;

            } catch (error) {
                console.error(`Error fetching user for userId ${userId}:`, error);
            }
        });

        // Wait for all promises to resolve
        await Promise.all(fetchUserPromises);

    } catch (error) {
        console.error('Error fetching membership transactions:', error);
        alert('Failed to load membership transactions.');
    }
}



async function fetchTrainerBookings() {
    const bookingBody = document.getElementById('trainerBookingBody');
    bookingBody.innerHTML = '';  // Clear existing data

    try {
        const bookingQuery = query(collection(db, 'Notifications'), where('type', '==', 'Booking_trainer'));
        const bookingSnapshot = await getDocs(bookingQuery);

        if (bookingSnapshot.empty) {
            bookingBody.innerHTML = '<tr><td colspan="6" class="text-center">No trainer bookings found</td></tr>';
            return;
        }

        const fetchUserPromises = bookingSnapshot.docs.map(async (docItem) => {
            const data = docItem.data();
            const userId = data.userId;

            try {
                // First, try to fetch by document ID
                const userDocRef = doc(db, 'Users', String(userId));
                const userDocSnap = await getDoc(userDocRef);

                let username = 'N/A';

                if (!userDocSnap.exists()) {
                    // If document ID doesn't exist, query by userId field
                    const q = query(collection(db, 'Users'), where('userId', '==', userId));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const userDocFromQuery = querySnapshot.docs[0];
                        const userData = userDocFromQuery.data();
                        username = userData.username || 'N/A';
                    } else {
                        console.warn(`User with ID ${userId} not found.`);
                    }
                } else {
                    const userData = userDocSnap.data();
                    username = userData.username || 'N/A';
                }

                // Create table row with booking info
                const row = `
                    <tr>
                        <td>${userId}</td>
                        <td>${username}</td>
                        <td>${data.username || 'N/A'}</td>
                        <td>₱${data.price || 'N/A'}</td>                        
                        <td>${data.bookingDate || 'N/A'}</td>
                        <td>${data.status || 'Pending'}</td>
                    </tr>
                `;
                bookingBody.innerHTML += row;

            } catch (error) {
                console.error(`Error fetching user for userId ${userId}:`, error);
            }
        });

        await Promise.all(fetchUserPromises);
    } catch (error) {
        console.error('Error fetching trainer bookings:', error);
        alert('Failed to load trainer bookings.');
    }
}


// Load data on page load
window.addEventListener('DOMContentLoaded', async () => {
    await fetchMembershipTransactions();
    await fetchTrainerBookings();
});



async function fetchTransactions() {
    const querySnapshot = await getDocs(collection(db, "Transactions"));
    let transactions = [];
    querySnapshot.forEach((doc) => {
        let data = doc.data();
        transactions.push(data);
    });
    return transactions;
}

// Group Transactions by Type (Improved)
function groupTransactions(transactions) {
    const grouped = {
        Products: [],
        Membership: [],
        Trainer_Booking: [],
        Day_Pass: []
    };

    transactions.forEach(tx => {
        const txType = tx.type ? tx.type.toLowerCase().replace(/\s+/g, '_') : '';

        switch (txType) {
            case 'products':
                grouped.Products.push(tx);
                break;
            case 'membership':
                grouped.Membership.push(tx);
                break;
            case 'booking_trainer':
                grouped.Trainer_Booking.push(tx);
                break;
            case 'day_pass':
                grouped.Day_Pass.push(tx);
                break;
            default:
                console.warn(`Unknown transaction type: ${tx.type}`);
        }
    });

    return grouped;
}
async function generatePDF() {
    const transactions = await fetchTransactions();
    const trainerBookings = await fetchNotifications('Booking_trainer');
    const productsFromNotif = await fetchNotifications('Products');

    if (!transactions.length && !trainerBookings.length && !productsFromNotif.length) {
        alert("No transactions or notifications found.");
        return;
    }

    const grouped = groupTransactions(transactions);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    let y = 20;

    // Get today's date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Add the date to the top-right corner
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Date: ${formattedDate}`, 200, y, { align: 'right' });

    // Title
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text('Transactions Report', 105, y, { align: "center" });
    y += 12;

    // Calculate Summary
    const summary = calculateSummary(grouped, trainerBookings, productsFromNotif);

    function calculateSummary(grouped, trainerBookings, productsFromNotif) {
        const trainerBookingsTotal = trainerBookings.reduce((sum, tx) => sum + (parseFloat(tx.price) || 0), 0);
        const dayPassTotal = grouped.Day_Pass.reduce((sum, tx) => sum + (parseFloat(tx.totalPrice) || 0), 0);
        const membershipsTotal = grouped.Membership.reduce((sum, tx) => sum + (parseFloat(tx.price) || 0), 0);
        const productsTotal = productsFromNotif.reduce((sum, tx) => sum + (parseFloat(tx.totalPrice) || 0), 0);

        return {
            trainerBookingsTotal,
            dayPassTotal,
            membershipsTotal,
            productsTotal,
            totalTransactions: grouped.Membership.length + grouped.Day_Pass.length + trainerBookings.length + productsFromNotif.length
        };
    }

    // Add Summary Section
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text('Summary', 14, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Total Transactions: ${summary.totalTransactions}`, 14, y);
    y += 6;
    pdf.text(`Trainer Bookings Total: ₱${summary.trainerBookingsTotal.toFixed(2)}`, 14, y);
    y += 6;
    pdf.text(`Day Passes Total: ₱${summary.dayPassTotal.toFixed(2)}`, 14, y);
    y += 6;
    pdf.text(`Memberships Total: ₱${summary.membershipsTotal.toFixed(2)}`, 14, y);
    y += 6;
    pdf.text(`Products Total: ₱${summary.productsTotal.toFixed(2)}`, 14, y);
    y += 12;

    // Section for Memberships
    if (grouped.Membership.length > 0) {
        y = addSection(pdf, 'Memberships', grouped.Membership, y, ['planType', 'price', 'purchaseDate', 'status'], 'price');
    }

    // Section for Trainer Bookings (Transactions)
    if (grouped.Trainer_Booking.length > 0) {
        y = addSection(pdf, 'Trainer Bookings', grouped.Trainer_Booking, y, ['username', 'price', 'timestamp', 'status'], 'price');
    }

    // Section for Day Passes
    if (grouped.Day_Pass.length > 0) {
        y = addSection(pdf, 'Day Passes', grouped.Day_Pass, y, ['email', 'totalPrice', 'date', 'status'], 'totalPrice');
    }

    // Section for Booking_Trainer (Notifications)
    if (trainerBookings.length > 0) {
        y = addSection(pdf, 'Trainer Bookings', trainerBookings, y, ['username', 'price', 'timestamp', 'status'], 'price');
    }

    // Section for Products (Notifications)
    if (productsFromNotif.length > 0) {
        y = addSection(pdf, 'Products', productsFromNotif, y, ['productName', 'quantity', 'totalPrice', 'timestamp'], 'totalPrice');
    }

    // Save the PDF
    pdf.save(`Transactions_Report_${today.toISOString().slice(0, 10)}.pdf`);
}




// Fetch Notifications with Specific Type
async function fetchNotifications(type) {
    const notifQuery = query(
        collection(db, "Notifications"),
        where("type", "==", type)
    );

    const querySnapshot = await getDocs(notifQuery);
    const notifications = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
            productName: data.productName || 'N/A',
            quantity: data.quantity || 'N/A',
            totalPrice: data.totalPrice || 'N/A',
            timestamp: data.timestamp || new Date(),
            username: data.username || 'N/A',
            price: data.price || 'N/A',
            status: data.status || 'Pending'
        });
    });

    return notifications;
}


// Format Date to MM-DD-YY with Time
function formatDate(dateInput) {
    let date;

    // Detect Firestore timestamp object and convert to date
    if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
        date = new Date(dateInput.seconds * 1000); // Convert seconds to milliseconds
    } else {
        date = new Date(dateInput);
    }

    if (isNaN(date)) {
        return 'Invalid Date';
    }

    const formattedDate = date.toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
    });

    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return `${formattedDate} ${formattedTime}`;
}function addSection(pdf, title, data, yStart, fields, totalField) {
    let y = yStart + 12;
    let total = 0;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 76, 153); // Blue Title
    pdf.text(title, 14, y);
    y += 6;

    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);

    // Table Headers (Capitalize first letter and make others lowercase)
    pdf.setFont("helvetica", "bold");
    pdf.text("No.", 14, y);
    let x = 30;
    fields.forEach((field) => {
        const header = field.charAt(0).toUpperCase() + field.slice(1).toLowerCase(); // Capitalize first letter
        pdf.text(header, x, y);
        x += 45;
    });

    y += 4;
    pdf.setDrawColor(0, 0, 0); // Black Border
    pdf.line(14, y, 190, y); // Horizontal line
    y += 6;

    // Table Rows (With Alternating Shading)
    pdf.setFont("helvetica", "normal");

    data.forEach((tx, index) => {
        const rowColor = index % 2 === 0 ? [240, 240, 240] : [255, 255, 255]; // Alternating colors
        pdf.setFillColor(...rowColor);
        pdf.rect(14, y - 4, 176, 8, "F"); // Row background fill

        pdf.text(`${index + 1}`, 14, y);
        x = 30;

        fields.forEach((field) => {
            let value = tx[field] || "N/A";

            // Ensure proper formatting for currency fields
            if (field === "totalPrice" || field === "price") {
                const cleanValue = parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
                value = `₱${cleanValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }

            // Format Timestamp or Date
            if (field === "timestamp" || field === "purchaseDate" || field === "date") {
                value = formatDate(tx[field]);
            }

            pdf.text(`${value}`, x, y);
            x += 45;
        });

        // Add to total if applicable
        if (totalField && tx[totalField]) {
            const cleanValue = parseFloat(tx[totalField].replace(/[^\d.-]/g, "")) || 0;
            total += cleanValue;
        }

        y += 8;

        // Add new page if needed
        if (y > 270) {
            pdf.addPage();
            y = 20;
        }
    });

    // Add total row under "Total Price" column
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    const totalXPosition = 30 + (fields.indexOf(totalField) * 45); // Position in the "Total Price" column
    pdf.text(
        `Total: ₱${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalXPosition,
        y
    );
    y += 12;

    return y;
}




// Attach to Button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('downloadReportBtn').addEventListener('click', generatePDF);
});


document.addEventListener("DOMContentLoaded", function () {
    const notificationList = document.getElementById("notificationList");
    const loadingSpinner = document.createElement("div");
    loadingSpinner.id = "loadingSpinner";
    loadingSpinner.innerHTML = "Loading...";
    loadingSpinner.style.display = "none";
    notificationList.parentElement.insertBefore(loadingSpinner, notificationList);

    const notifBadge = document.createElement("span");
    notifBadge.id = "notifBadge";
    notifBadge.className = "badge bg-danger ms-2";
    document.getElementById("notificationModalLabel").appendChild(notifBadge);


    onAuthStateChanged(auth, (user) => {
      if (user) {
        const userId = user.uid;
        const gymOwnerRef = doc(db, "GymOwner", userId);

        getDoc(gymOwnerRef)
          .then((doc) => {
            if (doc.exists()) {
              const data = doc.data();
              if (data.gymName) {
                const userGymName = data.gymName;
                loadingSpinner.style.display = "block";

                const notifQuery = query(
                  collection(db, "MemberNotif"),
                  where("gymName", "==", userGymName)
                );

                onSnapshot(notifQuery, (snapshot) => {
                  notificationList.innerHTML = "";
                  let hasNewNotif = false;
                  let unreadCount = 0;

                  snapshot.forEach((doc) => {
                    const data = doc.data();
                    const notificationItem = document.createElement("p");
                    notificationItem.classList.add("list-group-item");
                    notificationItem.textContent = data.message;

                    if (data.isNew) {
                      notificationItem.innerHTML += ' <span class="red-dot"></span>';
                      hasNewNotif = true;
                      unreadCount++;
                    }

                    notificationList.appendChild(notificationItem);
                  });

                  notifBadge.textContent = unreadCount > 0 ? unreadCount : "";
                  loadingSpinner.style.display = "none";
                  hasNewNotif ? showNotificationDot() : hideNotificationDot();
                }, (error) => {
                  loadingSpinner.style.display = "none";
                  console.error("Error fetching notifications: ", error);
                });

                $('#notificationModal').on('shown.bs.modal', function () {
                  const unreadNotifQuery = query(
                    collection(db, "MemberNotif"),
                    where("gymName", "==", userGymName),
                    where("isNew", "==", true)
                  );

                  getDoc(unreadNotifQuery).then((querySnapshot) => {
                    const batch = writeBatch(db);
                    querySnapshot.forEach((doc) => {
                      const docRef = doc.ref;
                      batch.update(docRef, { isNew: false });
                    });
                    return batch.commit();
                  })
                  .then(() => {
                    notifBadge.textContent = "";
                    console.log("Notifications marked as read.");
                  })
                  .catch((error) => {
                    console.error("Error marking notifications as read: ", error);
                  });
                });
              } else {
                console.warn("Gym name is missing in GymOwners document.");
              }
            } else {
              console.warn("No gym owner data found for this user.");
            }
          })
          .catch((error) => {
            console.error("Error fetching gym owner data: ", error);
          });
      } else {
        console.warn("No user is logged in.");
      }
    });

    function showNotificationDot() {
      const modalLabel = document.getElementById("notificationModalLabel");
      modalLabel.innerHTML = 'Notifications <span class="red-dot"></span>';
    }

    function hideNotificationDot() {
      const modalLabel = document.getElementById("notificationModalLabel");
      modalLabel.textContent = 'Notifications';
    }
  });

  async function fetchGymOwnerUsername() {
      const user = auth.currentUser;  // Get the currently authenticated user
  
      if (user) {
          const gymOwnerDocRef = doc(db, 'GymOwner', user.uid);  // Reference to GymOwner document
          const gymOwnerDocSnap = await getDoc(gymOwnerDocRef);
  
          if (gymOwnerDocSnap.exists()) {
              const username = gymOwnerDocSnap.data().username || 'Gym Owner';
              document.querySelector('#profile-username').textContent = username;
              document.querySelector('#profile-username-mobile').textContent = username;
          } else {
              document.querySelector('#profile-username').textContent = 'Gym Owner';
              console.error("Gym owner document not found.");
          }
      } else {
          document.querySelector('#profile-username').textContent = 'Not Logged In';
          console.error("No authenticated user.");
      }
  }
  
  // Wait for Firebase Authentication state change
  auth.onAuthStateChanged((user) => {
      if (user) {
          fetchGymOwnerUsername();
      }
  });

  const sidebar = document.getElementById('sidebar');
const hamburger = document.querySelector('.hamburger-container');

// Toggle sidebar visibility on hamburger click
hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('visible');
});

// Close sidebar when clicking outside of it on mobile
document.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove('visible');
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
const getGymNameForUser = async (userId) => {
    try {
        const gymOwnerDocRef = doc(db, 'GymOwner', userId);  // Reference to GymOwner document
        const gymOwnerDoc = await getDoc(gymOwnerDocRef);  // Fetch the document

        if (gymOwnerDoc.exists()) {
            // Extract the gymName from the document data
            const gymName = gymOwnerDoc.data().gymName;
            return gymName;
        } else {
            console.log('No gym found for this user');
            return null;
        }
    } catch (error) {
        console.error('Error fetching gym name:', error);
        return null;
    }
};

// Fetch Products for a given gymName
const loadProductsForGym = async (gymName) => {
    try {
        const productsCollectionRef = collection(db, 'Products');  // Reference to Products collection
        const q = query(productsCollectionRef, where("gymName", "==", gymName));  // Query to match gymName
        const querySnapshot = await getDocs(q);  // Fetch the documents

        const products = querySnapshot.docs.map(doc => doc.data());  // Map documents to product data
        console.log('Fetched products for gym:', gymName, products);
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
    }
};

/// Add event listener to inventory card for opening the modal
document.getElementById('inventoryOverviewCard').addEventListener('click', async () => {
    try {
        // Get the logged-in user's gymName
        const userId = auth.currentUser.uid;
        const gymName = await getGymNameForUser(userId);

        if (!gymName) {
            console.error('No gym name found for this user');
            return;
        }

        // Fetch products for the logged-in gym
        const products = await loadProductsForGym(gymName);

        if (products.length > 0) {
            const product = products[0];  // Example: Show the first product

            // Ensure the modal is showing the correct data
            const productImage = document.getElementById('productImage');
            const productName = document.getElementById('productName');
            const productDescription = document.getElementById('productDescription');

            // Set modal content dynamically
            productImage.src = product.imageUrl || '';  // Set product image
            productName.innerText = product.name || 'No name available';  // Set product name
            productDescription.innerText = product.description || 'No description available';  // Set product description

            // Ensure the modal is visible after updating content
            const inventoryModal = new bootstrap.Modal(document.getElementById('inventoryModal'));
            inventoryModal.show();  // Open the modal
        } else {
            console.log('No products available for this gym');
        }
    } catch (error) {
        console.error('Error displaying product details in modal:', error);
    }
});
