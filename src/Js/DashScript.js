import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    databaseURL: "https://capstone40-project-default-rtdb.firebaseio.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Dropdown menu function
function createDropdownMenu(username, role) {
    const dropdownButton = document.querySelector('.dropbtn');
    if (dropdownButton) {
        dropdownButton.textContent = `Hello, ${username}`;
    } else {
        console.error('Dropdown button not found');
    }
    
    const dropdownContent = document.querySelector('.dropdown-content');
    if (dropdownContent) {
        dropdownContent.innerHTML = ''; // Clear previous content
         if (role === 'gym_owner') {
            dropdownContent.innerHTML += '<a href="gym-profiling.html">Gym Owner Management</a>';
        } else if (role === 'trainer') {
            dropdownContent.innerHTML += '<a href="Trainer.html">Personal Information</a>';
        }
        
        dropdownContent.innerHTML += '<a href="index.html" id="logout">Log Out</a>';

        // Add event listener for logout
        document.getElementById('logout')?.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'login.html'; // Redirect to login page
            }).catch((error) => {
                console.error("Sign Out Error:", error.code, error.message);
            });
        });
    } else {
        console.error('Dropdown content not found');
    }
}

// Check user authentication and role
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = user.uid;
        const userRef = ref(database, 'Accounts/' + userId);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const username = userData.username || 'User'; // Default to 'User' if no username is found
                const role = userData.role || 'user'; // Default to 'user' if no role is found
                createDropdownMenu(username, role);
            } else {
                // Redirect to login if no user data is found
                window.location.href = 'login.html';
            }
        }).catch((error) => {
            console.error("Error fetching user data:", error);
        });
    } else {
        // Redirect to login if no user is authenticated
        window.location.href = 'login.html';
    }
});

// Function to display products in the table
function displayProducts() {
    const tableBody = document.getElementById('productTableBody');
    if (!tableBody) {
        console.error('Element with ID "productTableBody" not found.');
        return;
    }

    const productsRef = ref(database, 'dashboard/products');
    get(productsRef).then((snapshot) => {
        if (snapshot.exists()) {
            tableBody.innerHTML = ''; // Clear the table body before reloading
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                const newRow = document.createElement('tr');

                // Ensure 'photoURL' is provided by the gym owner; otherwise, fallback to a default image
                const photoURL = data.photoURL || 'default-image.png';

                newRow.innerHTML = `
                    <td><img src="${photoURL}" alt="${data.name}" style="width: 50px; height: auto;"></td>
                    <td>${data.name}</td>
                    <td>$${data.price}</td>
                    <td>${data.description}</td>
                    <td>${data.category}</td>
                    <td>${data.quantity}</td>
                    <td>${data.dateAdded}</td>
                    <td><button class="btn btn-primary">Buy</button></td>
                `;

                tableBody.appendChild(newRow);
            });
        } else {
            console.log('No products found.');
        }
    }).catch((error) => {
        console.error('Error loading products:', error);
    });
}


// Initialize FullCalendar
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            height: 'auto',
            aspectRatio: 1.5,
            editable: true,
            selectable: true,
            events: [
                { title: 'Gym Session', start: '2024-08-01T10:00:00', end: '2024-08-01T12:00:00' },
                { title: 'Personal Training', start: '2024-08-05T09:00:00', end: '2024-08-05T10:00:00' }
            ],
            dateClick: function(info) {
                alert('Date clicked: ' + info.dateStr);
            }
        });
        calendar.render();
    } else {
        console.error('Calendar element not found');
    }

    // Call function to display products
    displayProducts();
});

// Show/Hide notification dropdown
document.querySelector('.fa-bell')?.addEventListener('click', () => {
    const notificationDropdown = document.getElementById('notificationDropdown');
    if (notificationDropdown) {
        const isVisible = notificationDropdown.style.display === 'block';
        notificationDropdown.style.display = isVisible ? 'none' : 'block';
    } else {
        console.error('Notification dropdown not found');
    }
});

// Render notifications and add show more functionality
const notifications = [
    { message: 'New member registration', timestamp: '2024-07-31 10:00' },
    { message: 'Payment received from John Doe', timestamp: '2024-07-30 14:30' },
    { message: 'Class schedule updated', timestamp: '2024-07-29 09:00' },
    { message: 'New promotion added', timestamp: '2024-07-28 16:45' },
    { message: 'Gym equipment maintenance due', timestamp: '2024-07-27 11:00' }
];

const notificationList = document.getElementById('notificationList');
const showMoreButton = document.getElementById('showMore');
let displayedCount = 3;

function renderNotifications() {
    if (notificationList) {
        notificationList.innerHTML = '';
        notifications.slice(0, displayedCount).forEach((notification) => {
            const notificationDiv = document.createElement('div');
            notificationDiv.className = 'notification';
            notificationDiv.innerHTML = `
                <p>${notification.message}</p>
                <small>${notification.timestamp}</small>
                <button onclick="this.parentElement.remove()">x</button>
            `;
            notificationList.appendChild(notificationDiv);
        });

        // Update Show More button visibility
        if (displayedCount >= notifications.length) {
            showMoreButton.style.display = 'none';
        } else {
            showMoreButton.style.display = 'block';
        }
    } else {
        console.error('Notification list not found');
    }
}

showMoreButton?.addEventListener('click', () => {
    displayedCount = Math.min(displayedCount + 3, notifications.length);
    renderNotifications();
});

renderNotifications();

// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const openSidebarBtn = document.querySelector('#openSidebar');
    const mainContent = document.querySelector('.main-content');

    if (openSidebarBtn && sidebar && mainContent) {
        openSidebarBtn.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                mainContent.classList.remove('shifted');
            } else {
                sidebar.classList.add('open');
                mainContent.classList.add('shifted');
            }
        });
    } else {
        console.error('Sidebar or openSidebar button not found');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var dropdownToggle = document.querySelector('.btn-group .dropdown-toggle');
    var dropdownMenu = document.querySelector('.btn-group .dropdown-menu');
    
    // Initialize Bootstrap dropdown
    var dropdown = new bootstrap.Dropdown(dropdownToggle);
    
    // Function to show dropdown
    function showDropdown() {
        dropdownMenu.classList.add('show');
    }
    
    // Function to hide dropdown
    function hideDropdown() {
        dropdownMenu.classList.remove('show');
    }
    
    // Show dropdown on hover or click
    dropdownToggle.addEventListener('mouseover', showDropdown);
    dropdownToggle.addEventListener('click', showDropdown);

    // Hide dropdown when not hovering over the toggle or menu
    document.addEventListener('mouseover', function(event) {
        if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            hideDropdown();
        }
    });

    // Prevent hiding on hover over the dropdown menu
    dropdownMenu.addEventListener('mouseover', function() {
        showDropdown();
    });
    
    dropdownMenu.addEventListener('mouseleave', function() {
        hideDropdown();
    });
    
    function setCurrentUserId(userId) {
        localStorage.setItem('currentUserId', userId);
    }
    
    function getBillingRecordsForUser(userId) {
        return JSON.parse(localStorage.getItem(`billingRecords_${userId}`)) || [];
    }
    
    function saveBillingRecordsForUser(userId, records) {
        localStorage.setItem(`billingRecords_${userId}`, JSON.stringify(records));
    }
});

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    let count = parseInt(cartCount.textContent) + 1;
    cartCount.textContent = count;

    // Save cart count to localStorage or sessionStorage
    localStorage.setItem('cartCount', count);
}

document.querySelector('.fa-shopping-cart').addEventListener('click', function() {
    window.location.href = 'checkout.html';
});

