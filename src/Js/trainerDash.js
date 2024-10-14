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
            const userDocRef = doc(db, 'Users', userId);

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
    const gymsCollection = collection(db, 'Users');
    
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
            gymDiv.classList.add('card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes

            gymDiv.innerHTML = `
                <img src="${gym.gymPhoto || 'default-photo.jpg'}" alt="${gym.gymName || 'Gym'}" class="card-img-top gym-photo" />
                <div class="card-body">
                    <h5 class="card-title">${gym.gymName || 'N/A'}</h5>
                    <button class="custom-button btn-primary" onclick="viewMore('${gym.id}')">Gym Info</button>
                </div>
            `;

            gymProfilesContainer.appendChild(gymDiv);
        }
    });
}
    window.viewMore = async function (gymId) {
        try {
            const gymDocRef = doc(db, 'Users', gymId);
            const gymDoc = await getDoc(gymDocRef);

            if (gymDoc.exists()) {
                const gymData = gymDoc.data();

                // Ensure each element exists before setting innerText
                const modalGymName = document.getElementById('modalGymName');
                const modalGymPhoto = document.getElementById('modalGymPhoto');
                const modalGymLocation = document.getElementById('modalGymLocation');
                const modalGymEquipment = document.getElementById('modalGymEquipment');
                const modalGymPrograms = document.getElementById('modalGymPrograms');
                const modalGymContact = document.getElementById('modalGymContact');
                const modalPriceRate = document.getElementById('modalpriceRate');
                const modalGymOpeningTime = document.getElementById('modalGymOpeningTime');
                const modalGymClosingTime = document.getElementById('modalGymClosingTime');

                if (modalGymName) modalGymName.innerText = gymData.gymName || 'N/A';
                if (modalGymPhoto) modalGymPhoto.src = gymData.gymPhoto || 'default-photo.jpg';
                if (modalGymLocation) modalGymLocation.innerText = gymData.gymLocation || 'N/A';
                if (modalGymEquipment) modalGymEquipment.innerText = gymData.gymEquipment || 'N/A';
                if (modalGymPrograms) modalGymPrograms.innerText = gymData.gymPrograms || 'N/A';
                if (modalGymContact) modalGymContact.innerText = gymData.gymContact || 'N/A';
                if (modalPriceRate) modalPriceRate.innerText = gymData.gymPriceRate || 'N/A';
                if (modalGymOpeningTime) modalGymOpeningTime.innerText = gymData.gymOpeningTime || 'N/A';
                if (modalGymClosingTime) modalGymClosingTime.innerText = gymData.gymClosingTime || 'N/A';

                const modal = document.getElementById('gymProfileModal');
                modal.style.display = 'block'; // Show the modal
            } else {
                console.error('No such document!');
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        }
    }
    document.addEventListener('DOMContentLoaded', function() {
        // Now all event listeners and modal functions are attached when DOM is ready
        fetchGymProfiles();
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
