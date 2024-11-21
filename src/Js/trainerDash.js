import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, addDoc,getDoc,query,where,updateDoc,orderBy,onSnapshot} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'; 
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
    const profilePicRef = ref(storage, `profilePictures/${userId}/profile.jpg`);
  
    getDownloadURL(profilePicRef).then((url) => {
        // Update profile picture in both header and sidebar
        document.getElementById('profile-picture').src = url;        
        // Also update the username in the header
        document.getElementById('profile-username').textContent = username;
    }).catch((error) => {
        if (error.code === 'storage/object-not-found') {
            // Fallback to default image if no profile picture is found
            document.getElementById('profile-picture').src = 'framework/img/Profile.png';

            // Still set the username
            document.getElementById('profile-username').textContent = username;
        } else {
            console.error('Unexpected error loading profile picture:', error.message);
        }
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


async function fetchNotifications(currentUserId) {
    try {
        const notifications = await fetchUserNotifications(currentUserId); // Fetch notifications from Firestore
        const unreadCount = notifications.filter(notification => notification.status === 'unread').length;
        
        updateNotificationCount(unreadCount); // Update the count in the badge

        const notificationList = document.getElementById('notification-list');
        notificationList.innerHTML = ''; // Clear the list before adding new notifications
        
        if (notifications.length > 0) {
            notifications.forEach(notification => {
                const notificationItem = document.createElement('li');
                notificationItem.classList.add('list-group-item');
                
                // Mark as read when the user clicks on it
                if (notification.status === 'unread') {
                    notificationItem.classList.add('unread');
                } else {
                    notificationItem.classList.add('read');  // Add a class to style read notifications
                }
                
                notificationItem.textContent = notification.message;
                notificationItem.onclick = () => markAsRead(notification.id, currentUserId);  // Mark as read when clicked
                
                notificationList.appendChild(notificationItem);
            });
        } else {
            notificationList.innerHTML = '<li class="list-group-item">No new notifications</li>';
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}


    // Function to update the notification badge with the count
    function updateNotificationCount(count) {
        const notificationCountElement = document.getElementById('notification-count');
        if (notificationCountElement) {
            notificationCountElement.textContent = count;
            notificationCountElement.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }
    async function markAsRead(notificationId, currentUserId) {
        try {
            const notificationRef = doc(db, 'UserNotifications', notificationId);
            await updateDoc(notificationRef, { status: 'read' });  // Update status to 'read'
    
            // Refresh the notifications after marking one as read
            fetchNotifications(currentUserId); // Refresh the notifications
        } catch (error) {
            console.error('Error marking notification as read:', error);
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
    async function fetchUserNotifications(userId) {
        try {
            console.log("Fetching notifications for user:", userId);
    
            if (!userId) {
                throw new Error("User ID is undefined. Cannot fetch notifications.");
            }
    
            const notificationsRef = collection(db, 'Notifications');
            const querySnapshot = await getDocs(query(notificationsRef, where('userId', '==', userId)));
    
            if (querySnapshot.empty) {
                console.log("No notifications found.");
                return [];
            }
    
            const notifications = [];
            querySnapshot.forEach((doc) => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
    
            console.log("Fetched notifications:", notifications);
    
            return notifications;
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
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
    async function fetchUsers() {
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
    function displayUsers(users) {
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
    async function searchUsers(searchTerm) {
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
        const filteredUsers = users.filter(user =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    
        displayUsers(filteredUsers, true);  // Display results in searchResultsContainer
    }  
    // Start a chat with a selected user
    function startChat(userId, username) {
        currentChatUserId = userId;
        document.getElementById('chatWith').textContent = `${username}`;
        document.querySelector('#searchInput').value = username;
    
        // Ensure the target container exists before modifying it
        const usersContainer = document.querySelector('#inboxContainer'); // Use #inboxContainer if #usersContainer doesn't exist
        if (usersContainer) {
            usersContainer.innerHTML = ''; // Clear the container if it exists
        } else {
            console.error("Element with ID 'inboxContainer' not found in the DOM.");
        }
    
        // Display chat elements
        document.getElementById('chatHeader').style.display = 'block';
        document.getElementById('messagesContainer').style.display = 'block';
        document.getElementById('messageInputContainer').style.display = 'block';

        // Mark all messages in this conversation as read
        unreadMessages.forEach(messageId => {
            if (messageId.startsWith(currentChatUserId)) { // Message from this user
                unreadMessages.delete(messageId); // Remove from unread set
            }
        });
    
        loadMessages(); // Load messages for the chat
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
    
    async function loadMessages() {
        const userId = auth.currentUser.uid;
        const messagesContainer = document.querySelector('#messagesContainer');
        messagesContainer.innerHTML = '';
    
        // Clear any previous listeners if they exist
        if (unsubscribeSentMessages) unsubscribeSentMessages();
        if (unsubscribeReceivedMessages) unsubscribeReceivedMessages();
    
        // Real-time listener for messages sent by the user
        const sentMessagesQuery = query(
            collection(db, 'Messages'),
            where('from', '==', userId),
            where('to', '==', currentChatUserId),
            orderBy('timestamp')
        );
    
        // Real-time listener for messages received by the user
        const receivedMessagesQuery = query(
            collection(db, 'Messages'),
            where('from', '==', currentChatUserId),
            where('to', '==', userId),
            orderBy('timestamp')
        );
    
        // Function to render messages
        const renderMessages = async (messages) => {
            messagesContainer.innerHTML = ''; // Clear previous messages
            for (const messageData of messages) {
                const fromUser = await getUserDetails(messageData.from);
                const isSelf = messageData.from === auth.currentUser.uid;
    
                // Message wrapper
                const messageElement = document.createElement('div');
                messageElement.className = 'message ' + (isSelf ? 'self' : 'other');
    
                // Avatar
                const avatarElement = document.createElement('div');
                avatarElement.className = 'avatar';
    
                if (fromUser && fromUser.photoURL) {
                    // If a photo URL is available, display the image
                    const avatarImage = document.createElement('img');
                    avatarImage.src = fromUser.photoURL;
                    avatarImage.alt = `${fromUser.username}'s avatar`;
                    avatarImage.style.width = '30px';
                    avatarImage.style.height = '30px';
                    avatarImage.style.borderRadius = '50%';
                    avatarElement.appendChild(avatarImage);
                } else {
                    // Display initials as fallback if photoURL is missing
                    avatarElement.textContent = isSelf ? 'You' : (fromUser ? fromUser.username[0].toUpperCase() : '?');
                }
    
                // Message content
                const messageContent = document.createElement('div');
                messageContent.className = 'message-content ' + (isSelf ? 'self' : 'other');
                messageContent.textContent = messageData.message;
    
                // Timestamp
                const timestamp = document.createElement('span');
                timestamp.className = 'timestamp';
    
                // Ensure timestamp is valid and properly formatted
                if (messageData.timestamp && messageData.timestamp.toDate) {
                    timestamp.textContent = messageData.timestamp.toDate().toLocaleTimeString();
                } else {
                    timestamp.textContent = "Invalid Date"; // Placeholder for testing
                }
    
                messageContent.appendChild(timestamp);
    
                // Append elements based on message sender
                if (isSelf) {
                    messageElement.appendChild(messageContent);
                    messageElement.appendChild(avatarElement);
                } else {
                    messageElement.appendChild(avatarElement);
                    messageElement.appendChild(messageContent);
                }
    
                messagesContainer.appendChild(messageElement);
            }
            messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll to the latest message
        };
    
        // Combine and render messages in real-time
        const messages = [];
        unsubscribeSentMessages = onSnapshot(sentMessagesQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    messages.push({ id: change.doc.id, ...change.doc.data() });
                }
            });
            messages.sort((a, b) => a.timestamp - b.timestamp);
            renderMessages(messages);
        });
    
        unsubscribeReceivedMessages = onSnapshot(receivedMessagesQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    messages.push({ id: change.doc.id, ...change.doc.data() });
                    // Add the received message to the unreadMessages set
                    unreadMessages.add(change.doc.id);
                }
            });
            messages.sort((a, b) => a.timestamp - b.timestamp);
            renderMessages(messages);
        });
        
    }

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
    
                // Create a new inbox item
                const inboxItem = document.createElement('div');
                inboxItem.className = 'inbox-item';
    
                inboxItem.innerHTML = `
                    <img src="${otherUser.photoURL || 'default-photo-url'}" alt="User Photo" class="inbox-user-photo">
                        <span>${otherUser.username || otherUser.email}: ${messageData.message}</span>
                    `;
                
                // If the message is unread, make it bold or add an indicator
                if (unreadMessages.has(messageData.docId)) {
                    inboxItem.style.fontWeight = 'bold'; // Unread message will be bold
                }
    
                // Event listener to start a chat with the user when clicking the inbox item
                inboxItem.addEventListener('click', () => {
                    startChat(otherUserId, otherUser.username || otherUser.email);
                    inboxItem.style.fontWeight = 'normal'; // Mark as read when clicked
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
                await addDoc(collection(db, 'Messages'), {
                    from: userId,
                    to: currentChatUserId,
                    message: messageText,
                    timestamp: new Date() // Firebase.Timestamp can also be used for consistency
                });
                messageInput.value = ''; // Clear input after sending
                loadMessages();
            } catch (error) {
                console.error("Error sending message: ", error); // Log any errors
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
                
   


        

            // document.addEventListener("DOMContentLoaded", () => {
            //     const TrainerForm = document.getElementById("TrainerForm");
            //     const globalSpinner = document.getElementById("globalSpinner");
            //     const successToast = new bootstrap.Toast(document.getElementById("successToast"));
            //     const errorToast = new bootstrap.Toast(document.getElementById("errorToast"));
            //     const successToastMessage = document.getElementById("successToastMessage");
            //     const errorToastMessage = document.getElementById("errorToastMessage");
            
            //     // Prevent form refresh and handle submission
            //     TrainerForm.addEventListener("submit", async (e) => {
            //         e.preventDefault(); // Prevent default form submission behavior
            
            //         console.log("Form submission triggered");
            
            //         // Show spinner
            //         if (globalSpinner) {
            //             globalSpinner.style.display = "flex";
            //         }
            
            //         try {
            //             // Get form values
            //             const trainerName = document.getElementById("TrainerName").value;
            //             const gymName = document.getElementById("GymName").value;
            
            //             console.log("Trainer Name:", trainerName);
            //             console.log("Gym Name:", gymName);
            
            //             // Query Firestore for existing trainer
            //             const trainersRef = collection(db, "Trainer");
            //             const q = query(trainersRef, where("TrainerName", "==", trainerName));
            //             const querySnapshot = await getDocs(q);
            
            //             console.log("QuerySnapshot size:", querySnapshot.size);
            
            //             if (querySnapshot.empty) {
            //                 throw new Error("No matching trainer found in the database.");
            //             }
            
            //             const trainerDoc = querySnapshot.docs[0];
            //             const trainerDocRef = trainerDoc.ref;
            
            //             console.log("Trainer document ID:", trainerDoc.id);
            
            //             // File uploads
            //             const photoInput = document.getElementById("TrainerPhoto");
            //             const photoFile = photoInput.files[0];
            //             const applicationFile = document.getElementById("TrainerApplication").files[0];
            //             const resumeFile = document.getElementById("Resume").files[0];
            
            //             console.log("Uploading files...");
            //             const photoURL = photoFile ? await uploadFile(photoFile, `Trainer_photos/${photoFile.name}`) : "";
            //             const applicationURL = applicationFile ? await uploadFile(applicationFile, `Trainer_applications/${applicationFile.name}`) : "";
            //             const resumeURL = resumeFile ? await uploadFile(resumeFile, `Trainer_resumes/${resumeFile.name}`) : "";
            
            //             console.log("Uploaded file URLs:", { photoURL, applicationURL, resumeURL });
            
            //             // Update Firestore document
            //             const updatedData = {
            //                 TrainerName: trainerName,
            //                 TrainerEmail: document.getElementById("TrainerEmail").value,
            //                 GymName: gymName,
            //                 Days: document.getElementById("Days").value,
            //                 Contact: document.getElementById("Contact").value,
            //                 Experience: document.getElementById("Experience").value,
            //                 Expertise: document.getElementById("Expertise").value,
            //                 rate: parseFloat(document.getElementById("rate").value),
            //                 ...(photoURL && { TrainerPhoto: photoURL }),
            //                 ...(applicationURL && { TrainerApplication: applicationURL }),
            //                 ...(resumeURL && { Resume: resumeURL }),
            //                 status: "Under Review"
            //             };
            
            //             console.log("Updating Firestore with data:", updatedData);
            //             await updateDoc(trainerDocRef, updatedData);
            
            //             console.log("Trainer document updated successfully.");
            
            //             // Hide spinner and show success
            //             if (globalSpinner) {
            //                 globalSpinner.style.display = "none";
            //             }
            //             successToastMessage.textContent = "Application successfully submitted!";
            //             successToast.show();
            
            //             // Reset form
            //             TrainerForm.reset();
            //             document.getElementById("profilePic").src = "framework/img/Profile.png";
            //         } catch (error) {
            //             console.error("Error during form submission:", error);
            
            //             // Hide spinner and show error
            //             if (globalSpinner) {
            //                 globalSpinner.style.display = "none";
            //             }
            //             errorToastMessage.textContent = `Error: ${error.message}`;
            //             errorToast.show();
            //         }
            //     });
            
            //     // File upload helper
            //     async function uploadFile(file, path) {
            //         console.log("Uploading file:", file.name, "to path:", path);
            //         const storageReference = ref(storage, path);
            //         const snapshot = await uploadBytes(storageReference, file);
            //         const downloadURL = await getDownloadURL(snapshot.ref);
            //         console.log("File uploaded. URL:", downloadURL);
            //         return downloadURL;
            //     }
            // });
            
        
        



    });
    
    