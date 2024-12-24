import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc,writeBatch,addDoc,getDoc,query,where,updateDoc,orderBy,onSnapshot} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'; 
import { getStorage, ref, getDownloadURL,uploadBytes  } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage();

// Check user authentication and role
document.addEventListener('DOMContentLoaded', () => {
    // Now we are sure that the DOM is fully loaded before accessing the elements
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(db, 'Trainer', userId);

            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const role = userData.role || 'user';
                    const username = userData.username || 'User'; // Make sure there's a fallback for the username
                    fetchNotifications(userId);
                    displayProfilePicture(user, username); // Pass username to the function
                } else {
                    window.location.href = 'login.html'; // Redirect to login if no user document
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            window.location.href = 'login.html'; // Redirect if not authenticated
        }
    });
});


// Function to display user profile picture
function displayProfilePicture(user, username) {
    const userId = user.uid;
    const trainerDocRef = doc(db, "Trainer", userId); // Reference to the user's document in the Trainer collection

    getDoc(trainerDocRef)
        .then((docSnap) => {
            if (docSnap.exists()) {
                const trainerData = docSnap.data();
                const photoURL = trainerData.TrainerPhoto || 'framework/img/Profile.png'; // Use TrainerPhoto or fallback to default

                // Update profile picture in both header and sidebar
                document.getElementById('profile-picture').src = photoURL;

                // Update the username in the header
                document.getElementById('profile-username').textContent = username;
            } else {
                console.warn('No Trainer document found for this user. Using default profile picture.');

                // Fallback to default image if no document is found
                document.getElementById('profile-picture').src = 'framework/img/Profile.png';

                // Still set the username
                document.getElementById('profile-username').textContent = username;
            }
        })
        .catch((error) => {
            console.error('Error fetching Trainer document:', error.message);

            // Fallback to default image in case of an error
            document.getElementById('profile-picture').src = 'framework/img/Profile.png';

            // Still set the username
            document.getElementById('profile-username').textContent = username;
        });
}



async function fetchGymProfiles() {
    const gymsCollection = collection(db, 'GymOwner');
    
    // Query to get only gym owners
    const gymOwnerQuery = query(gymsCollection, where('role', '==', 'gymowner'));
    
    const gymSnapshot = await getDocs(gymOwnerQuery);
    const gymList = gymSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() // Include the document data and its ID
    }));

    const gymProfilesContainer = document.getElementById('gym-profiles'); // Ensure correct ID
    gymProfilesContainer.innerHTML = '';

    gymList.forEach(gym => {
        // Check if the gym status is not "Under Review"
        if (gym.status && gym.status !== 'Under review') {
            const gymDiv = document.createElement('div');
            gymDiv.classList.add('trainer-card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes

            gymDiv.innerHTML = `
                <img src="${gym.gymPhoto || 'default-photo.jpg'}" alt="${gym.gymName || 'Gym'}" class="card-img-top gym-photo" />
                <div class="card-body">
                    <h5 class="card-title gym-title">${gym.gymName || 'N/A'}</h5>
                    <button class="btn-custom btn-primary" onclick="viewMore('${gym.id}')">Gym Info</button>
                </div>
            `;

            gymProfilesContainer.appendChild(gymDiv);
        }
    });
}

    // Function to format time from 24-hour to 12-hour format with AM/PM
    function formatTime(time) {
        const [hours, minutes] = time.split(':');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12; // Convert to 12-hour format
        return `${formattedHours}:${minutes} ${ampm}`;
    }
window.viewMore = async function (gymId) {
    console.log("Gym ID:", gymId); // Add this line to check if the correct gym ID is being passed
    try {
        const gymDocRef = doc(db, 'GymOwner', gymId);
        const gymDoc = await getDoc(gymDocRef);

        if (gymDoc.exists()) {
            const gymData = gymDoc.data();
            console.log("Gym Data:", gymData); // Log the data to check if it's correctly retrieved

            const modalGymName = document.getElementById('modalGymName');
            const modalGymPhoto = document.getElementById('modalGymPhoto');
            const modalGymLocation = document.getElementById('modalGymLocation');
            const modalGymEquipment = document.getElementById('modalGymEquipment');
            const modalGymPrograms = document.getElementById('modalGymPrograms');
            const modalGymEmail = document.getElementById('modalGymEmail');
            const modalGymContact = document.getElementById('modalGymContact');
            const modalPriceRate = document.getElementById('modalpriceRate');
            const modalGymOpeningTime = document.getElementById('modalGymOpeningTime');
            const modalGymClosingTime = document.getElementById('modalGymClosingTime');

            if (modalGymName) modalGymName.innerText = gymData.gymName || 'N/A';
            if (modalGymPhoto) modalGymPhoto.src = gymData.gymPhoto || 'default-photo.jpg';
            if (modalGymLocation) modalGymLocation.innerText = gymData.gymLocation || 'N/A';
            if (modalGymEquipment) modalGymEquipment.innerText = gymData.gymEquipment || 'N/A';
            if (modalGymPrograms) modalGymPrograms.innerText = gymData.gymPrograms || 'N/A';
            if (modalGymEmail) modalGymEmail.innerText = gymData.email || 'N/A';
            if (modalGymContact) modalGymContact.innerText = gymData.gymContact || 'N/A';
            if (modalPriceRate) modalPriceRate.innerText = gymData.gymPriceRate || 'N/A';
            if (modalGymOpeningTime) modalGymOpeningTime.innerText = formatTime(gymData.gymOpeningTime || 'N/A');
            if (modalGymClosingTime) modalGymClosingTime.innerText = formatTime(gymData.gymClosingTime || 'N/A');

            // Show the modal using Bootstrap's modal method
            $('#gymProfileModal').modal('show');
        } else {
            console.error('No such document!');
        }
    } catch (error) {
        console.error('Error fetching document:', error);
    }
};
window.closeModal = function() {
    $('#gymProfileModal').modal('hide'); // Hide the modal
}
    document.addEventListener('DOMContentLoaded', function() {
        // Now all event listeners and modal functions are attached when DOM is ready
        fetchGymProfiles();
        fetchNotifications();
        fetchMessages();
});

document.addEventListener('DOMContentLoaded', function () {
    // Function to show the Notifications Modal
    document.querySelector('.nav-link[href="#notifications"]').addEventListener('click', function (e) {
        e.preventDefault(); // Prevent default anchor behavior
        $('#notificationsModal').modal('show'); // Show the Notifications Modal
    });

    // Function to show the Messages Modal
    document.querySelector('.nav-link[href="#messages"]').addEventListener('click', function (e) {
        e.preventDefault(); // Prevent default anchor behavior
        $('#messagesModal').modal('show'); // Show the Messages Modal
    });
});

async function fetchTrainerData(userId) {
    try {
        const trainerRef = doc(db, 'Trainer', userId); // Assuming 'Trainers' is your collection
        const trainerDoc = await getDoc(trainerRef);

        if (trainerDoc.exists()) {
            console.log("Trainer data fetched:", trainerDoc.data());
            return trainerDoc.data();
        } else {
            console.error("Trainer document does not exist for user:", userId);
            return null;
        }
    } catch (error) {
        console.error("Error fetching trainer data:", error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userId = user.uid;
                console.log("User authenticated, UID:", userId);

                // Fetch trainer data
                const trainerData = await fetchTrainerData(userId);

                if (!trainerData) {
                    console.error("Unable to fetch trainer data. Ensure database entries are correct.");
                    return;
                }

                // Fetch notifications and messages
                await fetchNotifications(userId, trainerData.username); // Pass `trainerData.username`
                await fetchMessages(userId);
            } else {
                console.error("User is not authenticated.");
                window.location.href = 'login.html'; // Redirect to login if not authenticated
            }
        });
    } catch (error) {
        console.error("Error during authentication:", error);
    }
});


function categorizeNotifications(notifications) {
    const categorized = {
        'New Notifications': [],
        'Older Notifications': []
    };

    const now = new Date();

    notifications.forEach(notification => {
        const diffInMs = now - notification.timestamp;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays < 1) { // Less than 1 day
            categorized['New Notifications'].push(notification);
        } else { // 1 day or older
            categorized['Older Notifications'].push(notification);
        }
    });

    return categorized;
}

// Function to toggle visibility of older notifications
function toggleOlderNotifications() {
    const olderNotificationsDiv = document.getElementById('olderNotifications');
    const toggleButton = document.getElementById('toggleButton');

    if (olderNotificationsDiv.style.display === 'none') {
        olderNotificationsDiv.style.display = 'block';
        toggleButton.innerText = 'Hide Older Notifications';
    } else {
        olderNotificationsDiv.style.display = 'none';
        toggleButton.innerText = 'Show Older Notifications';
    }
}

// Function to display categorized notifications
function displayCategorizedNotifications(categorizedNotifications) {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = ''; // Clear the list before adding new notifications

    for (const [category, notifications] of Object.entries(categorizedNotifications)) {
        if (notifications.length > 0) {
            const categoryHeader = document.createElement('h6');
            categoryHeader.classList.add('category-header'); // Add a class for styling
            categoryHeader.innerText = category;
            notificationList.appendChild(categoryHeader);

            // Create a div for older notifications to toggle visibility
            const isOlder = (category === 'Older Notifications');
            const notificationContainer = document.createElement('div');
            notificationContainer.id = isOlder ? 'olderNotifications' : '';
            notificationContainer.style.display = isOlder ? 'none' : 'block'; // Hide older notifications initially

            notifications.forEach(notification => {
                const notificationItem = document.createElement('p');
                notificationItem.classList.add('list-group-item');

                // Calculate how long ago the notification was received
                const timeAgo = getTimeAgo(notification.timestamp);

                // Use <strong> for unread notifications
                const message = notification.read ? 
                    notification.message : `<strong>${notification.message}</strong>`;

                notificationItem.innerHTML = `
                    ${message}<br>
                    <small>${timeAgo}</small>
                `;

                // Add event listener for showing notification details and marking it as read
                notificationItem.addEventListener('click', () => {
                    markAsRead(notification.id, notification.userId); // Mark notification as read
                    showNotificationDetails(notification); // Show notification details in a modal
                });

                notificationContainer.appendChild(notificationItem);
            });

            notificationList.appendChild(notificationContainer);
        }
    }

    // Add toggle button for older notifications
    if (categorizedNotifications['Older Notifications'].length > 0) {
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggleButton';
        toggleButton.classList.add('btn', 'btn-secondary', 'mt-2');
        toggleButton.innerText = 'Show Older Notifications';
        toggleButton.addEventListener('click', toggleOlderNotifications);
        notificationList.appendChild(toggleButton);
    }

    // If no notifications, show a default message
    if (notificationList.innerHTML === '') {
        notificationList.innerHTML = 
            '<p class="list-group-item text-center text-muted py-3">No new notifications</p>';
    }
}

    // Load notifications from localStorage when the page reloads
    function loadNotificationsFromLocalStorage() {
        const storedNotifications = localStorage.getItem('notifications');
        if (storedNotifications) {
            const notifications = JSON.parse(storedNotifications);
            console.log('Loading notifications from localStorage:', notifications);

            displayNotifications(notifications);

            // Update notification count after fetching all notifications
            const unreadCount = notifications.filter(notification => !notification.read).length;
            updateNotificationCount(unreadCount);
        } else {
            console.warn('No notifications found in localStorage');
            // Optional: Provide a default message if no notifications are found.
            document.getElementById('notificationList').innerHTML = 
                '<p class="list-group-item text-center text-muted py-3">No notifications available</p>';
        }
    }

    // Display notifications from Firestore or localStorage
    function displayNotifications(notifications) {
        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = ''; // Clear the list before adding new notifications
    
        // Categorize notifications into new and older
        const categorized = categorizeNotifications(notifications);
    
        // Display new notifications
        if (categorized['New Notifications'].length > 0) {
            categorized['New Notifications'].forEach(notification => {
                const notificationItem = createNotificationItem(notification);
                notificationList.appendChild(notificationItem);
            });
        } else {
            notificationList.innerHTML = '<p class="list-group-item text-center text-muted py-3">No new notifications</p>';
        }
    
        // Add toggle button for older notifications
        const toggleOlderBtn = document.createElement('button');
        toggleOlderBtn.innerText = 'Show Older Notifications';
        toggleOlderBtn.classList.add('btn', 'btn-link'); // Bootstrap styling
        toggleOlderBtn.onclick = () => {
            const olderNotificationsContainer = document.getElementById('olderNotifications');
            if (olderNotificationsContainer.style.display === 'none') {
                olderNotificationsContainer.style.display = 'block';
                toggleOlderBtn.innerText = 'Hide Older Notifications';
            } else {
                olderNotificationsContainer.style.display = 'none';
                toggleOlderBtn.innerText = 'Show Older Notifications';
            }
        };
    
        notificationList.appendChild(toggleOlderBtn);
    
        // Create container for older notifications
        const olderNotificationsContainer = document.createElement('div');
        olderNotificationsContainer.id = 'olderNotifications';
        olderNotificationsContainer.style.display = 'none'; // Hidden by default
    
        // Display older notifications
        categorized['Older Notifications'].forEach(notification => {
            const notificationItem = createNotificationItem(notification);
            olderNotificationsContainer.appendChild(notificationItem);
        });
    
        notificationList.appendChild(olderNotificationsContainer);
    }
    
    // Helper function to create a notification item
    function createNotificationItem(notification) {
        const notificationItem = document.createElement('p');
        notificationItem.classList.add('list-group-item');
    
        // Calculate how long ago the notification was received
        const timeAgo = getTimeAgo(notification.timestamp);
        const message = notification.read ? 
                        notification.message : 
                        `<strong>${notification.message}</strong>`;
    
        notificationItem.innerHTML = `
            ${message}<br>
            <small>${timeAgo}</small>
        `;
    
        // Add event listener for showing notification details and marking it as read
        notificationItem.addEventListener('click', () => {
            markAsRead(notification.id, notification.userId); // Mark notification as read
            showNotificationDetails(notification); // Show notification details in a modal
        });
    
        return notificationItem;
    }
// Fetch and display notifications with timestamp
async function fetchNotifications(userId) {
    try {
        const notifications = await fetchUserNotifications(userId) || [];

        // Update unread notification count
        const unreadCount = notifications.filter(notification => notification.status === 'Unread').length;
        updateNotificationCount(unreadCount);

        // Get the notification list container
        const notificationList = document.getElementById('notificationList'); 
        if (!notificationList) {
            console.error("Element with ID 'notificationList' not found.");
            return;
        }

        // Clear the list before adding new notifications
        notificationList.innerHTML = '';

        // Render notifications with message and timestamp
        if (notifications.length > 0) {
            notifications.forEach(notification => {
                const notificationItem = document.createElement('li');
                notificationItem.classList.add('list-group-item');

                // Add 'Unread' or 'read' styling
                if (notification.status === 'Unread') {
                    notificationItem.classList.add('Unread');
                } else {
                    notificationItem.classList.add('read');
                }

                // Calculate relative time using getTimeAgo
                const timeAgo = getTimeAgo(notification.timestamp);

                // Populate the notification content
                notificationItem.innerHTML = `
                    <div>
                        <strong>${notification.message}</strong>
                        <br>
                        <small>${timeAgo}</small>
                    </div>
                `;

                // Add event to mark notification as read
                notificationItem.onclick = () => markAsRead(notification.id, userId);

                notificationList.appendChild(notificationItem);
                // Sort notifications by timestamp in descending order (newest first)
                notifications.sort((a, b) => b.timestamp - a.timestamp);
            
                console.log('Fetched notifications:', notifications);
        
                // Store notifications in localStorage for persistence across refreshes
                localStorage.setItem('notifications', JSON.stringify(notifications));
        
                // Categorize notifications by time
                const categorizedNotifications = categorizeNotifications(notifications);
        
                // Display the notifications
                displayCategorizedNotifications(categorizedNotifications);
        
                // Update notification count after fetching all notifications
                const unreadCount = notifications.filter(notification => !notification.read).length;
                updateNotificationCount(unreadCount);
            });
        } else {
            notificationList.innerHTML = '<li class="list-group-item">No new notifications</li>';
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// Fetch notifications for the trainer based on username
async function fetchUserNotifications(userId) {
    try {
        console.log("Fetching trainer data for userId:", userId);

        // Step 1: Fetch the logged-in trainer's username
        const trainerRef = doc(db, 'Trainer', userId);
        const trainerDoc = await getDoc(trainerRef);

        if (!trainerDoc.exists()) {
            throw new Error("Trainer data not found.");
        }

        const { username } = trainerDoc.data();
        if (!username) {
            throw new Error("Username not found for the logged-in trainer.");
        }

        console.log("Trainer's username:", username);

        // Step 2: Fetch notifications where the username matches
        const notificationsRef = collection(db, 'TrainerNotif');
        const querySnapshot = await getDocs(query(notificationsRef, where('username', '==', username)));

        const notifications = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let timestamp = data.timestamp;

            // Convert Firestore timestamp to Date object
            if (timestamp && typeof timestamp.toDate === 'function') {
                timestamp = timestamp.toDate();
            } else if (typeof timestamp === 'string') {
                timestamp = new Date(timestamp);
            } else {
                timestamp = new Date(); // Default to now
            }

            notifications.push({
                id: doc.id,
                ...data,
                timestamp: timestamp
            });
        });

        console.log("Fetched notifications:", notifications);
        return notifications;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

// Helper function to calculate relative time
function getTimeAgo(timestamp) {
    const now = new Date();
    const secondsAgo = Math.floor((now - timestamp) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
        const count = Math.floor(secondsAgo / seconds);
        if (count >= 1) {
            return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
        }
    }
    return 'Just now';
}

// Mark notification as read and refresh the list
async function markAsRead(notificationId, userId) {
    try {
        const notificationRef = doc(db, 'TrainerNotif', notificationId);
        await updateDoc(notificationRef, { status: 'read' });
        fetchNotifications(userId);
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Update unread notification count in UI
function updateNotificationCount(unreadCount) {
    const notificationCountElement = document.getElementById('notification-count');
    notificationCountElement.textContent = unreadCount;

    if (unreadCount > 0) {
        notificationCountElement.style.display = 'inline-block';
    } else {
        notificationCountElement.style.display = 'none';
    }
}
    
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            // Wait for Firebase Auth to detect if the user is logged in
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userId = user.uid;
                    console.log("User authenticated, UID:", userId);
    
                    // Fetch notifications and messages only after authentication
                    await fetchUserNotifications(userId);
                    await fetchMessages(userId);
                } else {
                    console.error("User is not authenticated.");
                    window.location.href = 'login.html'; // Redirect to login if not authenticated
                }
            });
        } catch (error) {
            console.error("Error during authentication:", error);
        }
    });
    
function showNotificationDetails(notification) {
        const formatPrice = (price) => {
            if (price == null || price === '') {
                return 'N/A';
            }
            const numericPrice = parseFloat(
                typeof price === 'string' ? price.replace(/[^\d.-]/g, '') : price
            );
            return !isNaN(numericPrice)
                ? `₱${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'N/A';
        };
    
        function formatDate(date) {
            if (!date) return null;
            const parsedDate = new Date(date);
            if (isNaN(parsedDate)) return null;
    
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
    
            const month = monthNames[parsedDate.getMonth()];
            const day = String(parsedDate.getDate()).padStart(2, '0');
            const year = parsedDate.getFullYear();
    
            return `${month} ${day}, ${year}`;
        }
    
        let notificationContent = '';
        let cancelButton = '';
    
        // Booking Trainer Notification for Trainer
        if (notification.type === "Booking") {
            notificationContent = `
                <p class="gym-name">${notification.gymName || 'N/A'}</p>
                <div class="product-info">
                    <p><strong>Customer:</strong> ${notification.customerUsername || 'N/A'}</p>
                    <p><strong>Email:</strong> ${notification.customerEmail || 'N/A'}</p>
                    <p><strong>Reserve Date:</strong> ${formatDate(notification.timestamp) || 'N/A'}</p>
                </div>
                <hr>
                <p class="footer-info">A customer has booked you a session. You can contact the customer by searching for their email or username in your messages.</p>
            `;
        } else {
            notificationContent = `<p>No details available for this notification type.</p>`;
        }
    
        const notificationModal = `
            <div class="modal fade" id="notificationDetailsModal" tabindex="-1" role="dialog" aria-labelledby="notificationDetailsLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="notificationDetailsLabel">
                                ${notification.type === "TrainerBooking" ? "New Booking Alert" : "Notification"}
                            </h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" id="notificationDetailsContent">
                            ${notificationContent}
                        </div>
                        ${cancelButton}
                    </div>
                </div>
            </div>
        `;
    
        document.body.insertAdjacentHTML('beforeend', notificationModal);
        $('#notificationDetailsModal').modal('show');
    
        $('#notificationDetailsModal').on('hidden.bs.modal', function () {
            this.remove();
        });
    }
        



    async function fetchMessages(userId) {
        try {
            console.log("Fetching messages for user:", userId);
    
            if (!userId) {
                throw new Error("User ID is undefined. Cannot fetch messages.");
            }
    
            const messagesRef = collection(db, 'Messages');
            const querySnapshot = await getDocs(query(messagesRef, where('userId', '==', userId)));
    
            if (querySnapshot.empty) {
                console.log("No messages found.");
                return [];
            }
    
            const messages = [];
            querySnapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
    
            console.log("Fetched messages:", messages);
            return messages;
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }

    let currentChatUserId = null;
    const userCache = {}; // Cache for user details to reduce database calls
    const unreadMessages = new Set(); // Track unread messages
    
    // Initialize the chat modal and clear previous chats
    document.querySelector('a[href="#chatModal"]').addEventListener('click', async function (event) {
        event.preventDefault();
        const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));
        chatModal.show();
        document.querySelector('#usersContainer').innerHTML = '';
        document.querySelector('#inboxContainer').innerHTML = '';
        
        // Load inbox messages
        await loadInboxMessages();
    
        // Check for booked trainers in the Transactions collection and display them
        await displayBookedTrainersInInbox();
    });
    
    // Fetch all users for searching
    window.fetchUsers = async function() {
        const userQuery = query(collection(db, 'Users'));
        try {
            const querySnapshot = await getDocs(userQuery);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching users: ", error);
            return [];
        }
    }
    
    // Display users in the search result
    window. displayUsers = function(users) {
        const inboxContainer = document.querySelector('#inboxContainer');
        const searchResultsContainer = document.querySelector('#searchResultsContainer');
    
        searchResultsContainer.innerHTML = ''; // Clear previous search results
    
        // Limit to a certain number of users displayed
        const maxDisplayCount = 5; // Set the maximum number of results to display
    
        // Display only the first maxDisplayCount users
        users.slice(0, maxDisplayCount).forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-email';
            userElement.textContent = `${user.username} (${user.email})`;
    
            userElement.addEventListener('click', async () => {
                startChat(user.id, user.username);
                searchResultsContainer.innerHTML = ''; // Clear the search results
                searchResultsContainer.style.display = 'none'; // Hide the search results
                inboxContainer.style.display = 'block'; // Show the inbox
                await loadInboxMessages(); // Reload inbox messages
            });
    
            searchResultsContainer.appendChild(userElement); // Append to search results
        });
    
        // Show search results only if there are users found
        searchResultsContainer.style.display = users.length > 0 ? 'block' : 'none';
    }
    window.searchUsers = async function(searchTerm) {
        const inboxContainer = document.getElementById('inboxContainer');
        const searchResultsContainer = document.getElementById('searchResultsContainer');
    
        // If the search term is empty, clear search results, show inbox, and reload inbox messages
        if (!searchTerm.trim()) {
            searchResultsContainer.innerHTML = '';  // Clear search results
            searchResultsContainer.style.display = 'none';  // Hide search results container
            inboxContainer.style.display = 'block';  // Show inbox container
    
            await loadInboxMessages();  // Reload inbox messages to restore the original inbox content
            return;
        }
    
        // If there's a search term, perform the search and display results
        const users = await fetchUsers();
        const filteredUsers = users.filter(user => {
            // Ensure email exists and is a valid string before calling toLowerCase
            const email = user.email ? user.email : ''; // Default to empty string if email is undefined or null
            return email.toLowerCase().includes(searchTerm.toLowerCase());
        });
    
        displayUsers(filteredUsers, true);  // Display results in searchResultsContainer
    }
    
    // Start a chat with a selected user
    async function startChat(userId, username) {
        try {
            currentChatUserId = userId;
            document.getElementById('chatWith').textContent = `${username}`;

            // Clear the messages container before loading new messages
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
    
            // Ensure chat elements are visible
            document.getElementById('chatHeader').style.display = 'block';
            document.getElementById('messagesContainer').style.display = 'block';
            document.getElementById('messageInputContainer').style.display = 'block';
    
            // Load user details to get their photo
            const userDetails = await getUserDetails(userId);
            if (userDetails && userDetails.photoURL) {
                document.getElementById('chatUserPhoto').src = userDetails.photoURL;
            } else {
                document.getElementById('chatUserPhoto').src = 'default-profile.png';
            }
    
            loadMessages(); // Load messages for the chat interface
    
            // Prevent search input from being automatically filled
            const searchInput = document.querySelector('#searchInput');
            if (searchInput) {
                searchInput.blur(); 
                searchInput.value = '';
            }
        } catch (error) {
            console.error("Error in startChat:", error);
        }
    }
    

    async function getUserDetails(userId) {
        // Return cached data if available
        if (userCache[userId]) {
            return userCache[userId];
        }
    
        try {
            const userRef = doc(db, 'Users', userId);
            const userSnap = await getDoc(userRef);
    
            if (userSnap.exists()) {
                const userData = userSnap.data();
    
                // Check if photoURL exists directly in Firestore
                if (userData.photoURL) {
                    console.log(`Found photoURL in Firestore for user: ${userId}`);
                    userCache[userId] = userData; // Cache user data with Firestore photoURL
                    return userData; // Return data directly if photoURL exists
                } else {
                    // Fallback to fetching the photo from Firebase Storage
                    const photoPaths = [
                        `profilePictures/${userId}.jpg`,
                        `profilePictures/${userId}.png`
                    ];
                    
                    let photoURL = null;
    
                    for (let path of photoPaths) {
                        try {
                            // Try retrieving the photo URL from Firebase Storage
                            photoURL = await getDownloadURL(storageRef(storage, path));
                            userData.photoURL = photoURL;
                            break; // Stop if photo is found
                        } catch (error) {
                            console.warn(`No photo found at path: ${path}`);
                        }
                    }
    
                    // Log if no photo was found in Storage
                    if (!photoURL) {
                        console.warn(`No photo (jpg or png) found in storage for user: ${userId}`);
                        userData.photoURL = null; // Explicitly set to null if no photo was found
                    }
    
                    // Cache and return user data
                    userCache[userId] = userData;
                    return userData;
                }
            } else {
                console.warn("No user found for ID:", userId);
                return null;
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            return null;
        }
    }    
    let unsubscribeSentMessages = null;
    let unsubscribeReceivedMessages = null;

  window.loadMessages = async function() {
    const userId = auth.currentUser.uid;
    const messagesContainer = document.querySelector('#messagesContainer');

    // Clear the container to prevent duplicates
    messagesContainer.innerHTML = '';

    // Clear any previous listeners if they exist
    if (unsubscribeSentMessages) unsubscribeSentMessages();
    if (unsubscribeReceivedMessages) unsubscribeReceivedMessages();

    const sentMessagesQuery = query(
        collection(db, 'Messages'),
        where('from', '==', userId),
        where('to', '==', currentChatUserId),
        orderBy('timestamp', 'asc')
    );

    const receivedMessagesQuery = query(
        collection(db, 'Messages'),
        where('from', '==', currentChatUserId),
        where('to', '==', userId),
        orderBy('timestamp', 'asc')
    );

    const messages = new Map(); // Use a Map to prevent duplication

    const renderMessage = async (messageData) => {
        if (messages.has(messageData.id)) return; // Skip already rendered messages

        messages.set(messageData.id, messageData);

        const fromUser = await getUserDetails(messageData.from);
        const isSelf = messageData.from === auth.currentUser.uid;

        const messageElement = document.createElement('div');
        messageElement.className = 'message ' + (isSelf ? 'self' : 'other');

        // Avatar
        const avatarElement = document.createElement('div');
        avatarElement.className = 'avatar';

        if (fromUser && fromUser.photoURL) {
            const avatarImage = document.createElement('img');
            avatarImage.src = fromUser.photoURL;
            avatarImage.alt = `${fromUser.username}'s avatar`;
            avatarImage.style.width = '30px';
            avatarImage.style.height = '30px';
            avatarImage.style.borderRadius = '50%';
            avatarElement.appendChild(avatarImage);
        } else {
            avatarElement.textContent = isSelf ? 'You' : (fromUser ? fromUser.username[0].toUpperCase() : '?');
        }

        // Message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content ' + (isSelf ? 'self' : 'other');
        messageContent.textContent = messageData.message;

        // Timestamp
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        if (messageData.timestamp && messageData.timestamp.toDate) {
            timestamp.textContent = messageData.timestamp.toDate().toLocaleTimeString();
        } else {
            timestamp.textContent = 'Invalid Date';
        }
        messageContent.appendChild(timestamp);

        if (isSelf) {
            messageElement.appendChild(messageContent);
            messageElement.appendChild(avatarElement);
        } else {
            messageElement.appendChild(avatarElement);
            messageElement.appendChild(messageContent);
        }

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll to the latest message
    };

    unsubscribeSentMessages = onSnapshot(sentMessagesQuery, snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const messageData = { id: change.doc.id, ...change.doc.data() };
                renderMessage(messageData);
            }
        });
    });

    unsubscribeReceivedMessages = onSnapshot(receivedMessagesQuery, snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const messageData = { id: change.doc.id, ...change.doc.data() };
                renderMessage(messageData);
                unreadMessages.add(change.doc.id); // Track unread messages
            }
        });
    });
  };


    async function loadInboxMessages() {
        const userId = auth.currentUser.uid; // Get the ID of the currently logged-in user
        const inboxContainer = document.getElementById('inboxContainer');
        inboxContainer.innerHTML = ''; // Clear the inbox
    
        // Query to get messages where the current user is either the sender or receiver
        const messagesQuery = query(
            collection(db, 'Messages'),
            where('from', '==', userId), // Messages sent by the user
            orderBy('timestamp', 'desc')
        );
    
        const receivedMessagesQuery = query(
            collection(db, 'Messages'),
            where('to', '==', userId), // Messages received by the user
            orderBy('timestamp', 'desc')
        );
    
        try {
            // Fetch the sent and received messages
            const sentMessagesSnapshot = await getDocs(messagesQuery);
            const receivedMessagesSnapshot = await getDocs(receivedMessagesQuery);
    
            // Map to store the latest message for each unique user
            const recentMessages = new Map();
    
            // Process the sent messages
            sentMessagesSnapshot.forEach((doc) => {
                const messageData = doc.data();
                const otherUserId = messageData.to;
    
                // Update the recentMessages map if it's a new message or has a more recent timestamp
                if (!recentMessages.has(otherUserId) || recentMessages.get(otherUserId).timestamp < messageData.timestamp) {
                    recentMessages.set(otherUserId, { ...messageData, docId: doc.id });
                }
            });
    
            // Process the received messages
            receivedMessagesSnapshot.forEach((doc) => {
                const messageData = doc.data();
                const otherUserId = messageData.from;
    
                // Update the recentMessages map if it's a new message or has a more recent timestamp
                if (!recentMessages.has(otherUserId) || recentMessages.get(otherUserId).timestamp < messageData.timestamp) {
                    recentMessages.set(otherUserId, { ...messageData, docId: doc.id });
                }
            });
    
            // If no messages were found, display a 'no conversation' message
            if (recentMessages.size === 0) {
                const noConversationMessage = document.createElement('div');
                noConversationMessage.className = 'no-conversation-message';
                noConversationMessage.textContent = 'No Conversations Available';
                inboxContainer.appendChild(noConversationMessage);
                return; // Exit if no messages are available
            }
    
            // Display each recent message in the inbox
            for (const [otherUserId, messageData] of recentMessages.entries()) {
                const otherUser = await getUserDetails(otherUserId); // Get user details
    
                // Check if otherUser is null or undefined
                if (!otherUser) {
                    console.warn(`User details not found for userId: ${otherUserId}`);
                    continue; // Skip this entry if user details are missing
                }
    
                // Fallback for missing photo and username/email
                const photoURL = otherUser.photoURL || 'default-photo-url';
                const userName = otherUser.username || otherUser.email || 'Unknown User';
    
                // Debugging: Log user details to identify missing fields
                console.log("User Details:", otherUser);
    
                // Create a new inbox item
                const inboxItem = document.createElement('div');
                inboxItem.className = 'inbox-item';
    
                inboxItem.innerHTML = `
                    <img src="${photoURL}" alt="User Photo" class="inbox-user-photo">
                    <div class="inbox-user-details">
                        <div class="user-name" style="font-weight: bold;">${userName}</div>
                        <div class="user-message">${messageData.message}</div>
                    </div>
                `;
    
                // If the message is unread, make it bold or add an indicator
                if (unreadMessages.has(messageData.docId)) {
                    inboxItem.classList.add('bold'); // Add bold class for unread messages
                }
    
                // Event listener to start a chat with the user when clicking the inbox item
                inboxItem.addEventListener('click', () => {
                    startChat(otherUserId, userName);
                    inboxItem.classList.remove('bold'); // Mark as read when clicked
                    displayChatHeader(otherUser);
                });
    
                // Append the inbox item to the container
                inboxContainer.appendChild(inboxItem);
            }
        } catch (error) {
            console.error("Error fetching inbox messages:", error);
        }
    }
    

    // Call loadInboxMessages when the chat modal is opened
    document.querySelector('a[href="#chatModal"]').addEventListener('click', loadInboxMessages);

    function displayChatHeader(user) {
        document.getElementById('chatHeader').style.display = 'flex';
        document.getElementById('chatWith').textContent = user.username || user.email;
        document.getElementById('chatUserPhoto').src = user.photoURL || 'default-profile.png'; // Display user photo or a default if unavailable
        document.getElementById('messagesContainer').style.display = 'block';
        document.getElementById('messageInputContainer').style.display = 'block';
    }
    
    // Send a message
    async function sendMessage() {
    const messageInput = document.querySelector('#messageInput');
    const messageText = messageInput.value.trim();

    if (messageText && currentChatUserId) {
        const userId = auth.currentUser.uid;

        try {
            // Send a message to Firestore
            await addDoc(collection(db, 'Messages'), {
                from: userId,
                to: currentChatUserId,
                message: messageText,
                timestamp: new Date(),
                status: "Unread"
            });

            messageInput.value = ''; // Clear input after sending
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    }
}

    
    
    // Event listener for the search input
    document.querySelector('#searchInput').addEventListener('input', (event) => {
        const searchTerm = event.target.value;
        searchUsers(searchTerm);
    });
    
    // Event listener for the send message button
    document.getElementById('sendMessageButton').addEventListener('click', sendMessage);

      // Bind Enter key press to send a message as well
    document.getElementById('messageInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage(event);
    }
    });
    
    // Load inbox messages when the chat modal is opened
    document.querySelector('a[href="#chatModal"]').addEventListener('click', loadInboxMessages);

    document.addEventListener("DOMContentLoaded", function () {
        const profilePic = document.getElementById("profilePic");
        const TrainerPhotoInput = document.getElementById("TrainerPhoto");
        const TrainerForm = document.getElementById("TrainerForm");
        const errorMessage = document.getElementById("TrainerFormErrorMessage");
        const successToast = document.getElementById("successToast");
    
        // Handle profile photo click and input change
        profilePic.addEventListener("click", () => {
            TrainerPhotoInput.click(); // Trigger the file input
        });
    
        TrainerPhotoInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    profilePic.src = e.target.result; // Update the displayed photo
                };
                reader.readAsDataURL(file);
            } else {
                profilePic.src = "framework/img/Profile.png"; // Reset to default if no file selected
            }
        });

        let selectedGymName = ""; // Global variable to store the selected GymName

        window.openConfirmationModal = async function (gymName) {
            try {
                // Validate the gymName parameter
                if (!gymName || typeof gymName !== "string") {
                    console.error("Invalid gymName passed:", gymName);
                    alert("Error: Invalid gym name provided. Please select a valid gym.");
                    return;
                }
        
                console.log("Fetching gym profile for gymName:", gymName);
        
                // Query Firestore to find the gym by gymName
                const gymOwnerRef = collection(db, "GymOwner");
                const q = query(gymOwnerRef, where("gymName", "==", gymName));
                const querySnapshot = await getDocs(q);
        
                if (!querySnapshot.empty) {
                    const gymDoc = querySnapshot.docs[0]; // Get the first matching document
                    selectedGymName = gymDoc.data().gymName;
                    console.log("Fetched Gym Name:", selectedGymName);
                } else {
                    throw new Error("Gym profile not found for the provided gymName.");
                }
        
                // Update the confirmation modal with Gym Name
                document.getElementById("modalGymName").textContent = selectedGymName;
                $("#confirmationModal").modal("show"); // Show confirmation modal
            } catch (error) {
                console.error("Error fetching gym profile:", error);
                alert("An error occurred while fetching the gym profile. Please try again.");
            }
        };
        // Function to close the confirmation modal
        window.closeConfirmationModal = function () {
            $("#confirmationModal").modal("hide");
        };
        
        // Function to handle "Yes, Apply" click and navigate to TrainerForm.html
        window.confirmApplication = async function () {
            try {
                // Close the confirmation modal
                closeConfirmationModal();
        
                // Show spinner to indicate processing
                showSpinner();
        
                // Simulate a delay for processing
                setTimeout(async () => {
                    try {
                        // Hide the spinner
                        hideSpinner();
        
                        // Ensure the Gym Name is available
                        if (!selectedGymName) {
                            console.error("No Gym Name available for application.");
                            alert("Error: No Gym Name selected. Please try again.");
                            return;
                        }
        
                        console.log("Selected Gym Name:", selectedGymName);
        
                        // Redirect to TrainerForm.html and pass the gymName as a query parameter
                        window.location.href = `TrainerForm.html?gymName=${encodeURIComponent(selectedGymName)}`;
                    } catch (queryError) {
                        console.error("Error during application processing:", queryError);
                        alert("An error occurred while validating the gym name. Please try again.");
                    }
                }, 1000); // Adjust delay as needed
            } catch (error) {
                console.error("Error confirming application:", error);
                alert("An error occurred while processing your application. Please try again.");
            }
        };
        
        // Function to show the spinner
        window.showSpinner = function () {
            $('#spinnerModal').modal({ backdrop: 'static', keyboard: false });
            $('#spinnerModal').modal('show');
        };
        
        // Function to hide the spinner
        window.hideSpinner = function () {
            $('#spinnerModal').modal('hide');
        };
                

    });
    
    let unsubscribeUnreadListener;  // Store the listener reference globally
    
    // Listen for clicks on inbox items and mark messages as read
    document.addEventListener('click', async (event) => {
        const inboxItem = event.target.closest('.inbox-item');
    
        if (inboxItem) {
            const userId = auth.currentUser?.uid;
            if (userId) {
                await markAllMessagesAsRead(userId);
            }
        }
    });
    
    // Mark all unread messages as read (Batch Update)
    async function markAllMessagesAsRead(userId) {
        try {
            const messagesRef = collection(db, 'Messages');
            const querySnapshot = await getDocs(
                query(messagesRef, where('to', '==', userId), where('status', '==', 'Unread'))
            );
    
            if (querySnapshot.empty) {
                console.log('No unread messages.');
                return;
            }
    
            // Detach the current snapshot listener
            if (unsubscribeUnreadListener) {
                unsubscribeUnreadListener();
            }
    
            const batch = writeBatch(db);
            querySnapshot.forEach((docSnapshot) => {
                const messageRef = docSnapshot.ref;
                batch.update(messageRef, { status: 'Read' });
            });
    
            await batch.commit();
            console.log('All messages marked as read.');
    
            // Update the UI immediately
            updateMessageNotification(0);
    
            // Re-attach the listener to reflect the latest state
            listenForUnreadMessages(userId);
    
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
    
    // Real-time listener for unread messages
    function listenForUnreadMessages(userId) {
        const messagesRef = collection(db, 'Messages');
    
        unsubscribeUnreadListener = onSnapshot(
            query(messagesRef, where('to', '==', userId), where('status', '==', 'Unread')),
            (snapshot) => {
                const unreadCount = snapshot.size;
                updateMessageNotification(unreadCount);  // Update unread count in real-time
            },
            (error) => {
                console.error('Error listening for unread messages:', error);
            }
        );
    }
    
    // Update unread message count in UI
    function updateMessageNotification(unreadCount) {
        const messageNotificationElement = document.getElementById('messagesNotification');
    
        if (unreadCount > 0) {
            messageNotificationElement.textContent = unreadCount;
            messageNotificationElement.style.display = 'flex';
        } else {
            messageNotificationElement.style.display = 'none';
        }
    }
    
    // Start listener when user logs in
    document.addEventListener('DOMContentLoaded', () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                listenForUnreadMessages(user.uid);
            }
        });
    });
    