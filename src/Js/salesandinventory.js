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

// Generate PDF Report
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
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text('Transactions Report', 105, y, { align: "center" });
    y += 12;

    pdf.setFontSize(8);

    // Section for Memberships
    if (grouped.Membership.length > 0) {
        y = addSection(pdf, 'Memberships', grouped.Membership, y, ['planType', 'price', 'purchaseDate', 'status']);
    }

    // Section for Trainer Bookings (Transactions)
    if (grouped.Trainer_Booking.length > 0) {
        y = addSection(pdf, 'Trainer Bookings', grouped.Trainer_Booking, y, ['username', 'price', 'timestamp', 'status']);
    }

    // Section for Day Passes
    if (grouped.Day_Pass.length > 0) {
        y = addSection(pdf, 'Day Passes', grouped.Day_Pass, y, ['email', 'totalPrice', 'date', 'status']);
    }

    // Section for Booking_Trainer (Notifications)
    if (trainerBookings.length > 0) {
        y = addSection(pdf, 'Trainer Bookings', trainerBookings, y, ['username', 'price', 'timestamp', 'status']);
    }

    // Section for Products (Notifications)
    if (productsFromNotif.length > 0) {
        y = addSection(pdf, 'Products', productsFromNotif, y, ['productName', 'quantity', 'totalPrice', 'timestamp']);
    }

    pdf.save('transactions_and_notifications_report.pdf');
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
}

// Add Section Table to PDF with Borders and Shading
function addSection(pdf, title, data, yStart, fields) {
    let y = yStart + 12;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 76, 153);  // Blue Title
    pdf.text(title, 14, y);
    y += 6;

    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);

    // Table Headers (Bold)
    pdf.setFont("helvetica", "bold");
    pdf.text('No.', 14, y);
    let x = 30;
    fields.forEach(field => {
        pdf.text(field, x, y);
        x += 45;
    });

    y += 4;
    pdf.setDrawColor(0, 0, 0);  // Black Border
    pdf.line(14, y, 190, y);  // Horizontal line
    y += 6;

    // Table Rows (With Alternating Shading)
    pdf.setFont("helvetica", "normal");

    data.forEach((tx, index) => {
        const rowColor = index % 2 === 0 ? [240, 240, 240] : [255, 255, 255];  // Alternating colors
        pdf.setFillColor(...rowColor);
        pdf.rect(14, y - 4, 176, 8, 'F');  // Row background fill

        pdf.text(`${index + 1}`, 14, y);
        x = 30;

        fields.forEach(field => {
            let value = tx[field] || 'N/A';
        
            // Apply Peso sign and remove ± symbol
            if (field === 'totalPrice' || field === 'price') {
                value = `₱${value.replace('±', '').trim()}`;
            }
        
            // Format Timestamp or Date
            if (field === 'timestamp' || field === 'purchaseDate' || field === 'date') {
                value = formatDate(tx[field]);
            }
        
            pdf.text(`${value}`, x, y);
            x += 45;
        });
        

        y += 8;

        // Add new page if needed
        if (y > 270) {
            pdf.addPage();
            y = 20;
        }
    });

    y += 8;
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