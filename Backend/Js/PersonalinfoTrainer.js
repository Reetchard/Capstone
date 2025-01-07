import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getStorage, ref as storageRef, getDownloadURL, uploadBytesResumable } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Get DOM elements with optional chaining to prevent errors
const personalInfoForm = document.getElementById('personal-info-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const addressInput = document.getElementById('address');
const profilePicture = document.getElementById('profile-picture');
const profilePictureInput = document.getElementById('profile-picture-input');

// Placeholder function for `getNotificationsFromFirestore`
// Replace this with actual implementation if available
async function getNotificationsFromFirestore(userId) {
    // Placeholder implementation; replace with actual Firestore query if needed
    return []; // Returning an empty array for now
}

// Function to fetch notifications safely
async function fetchNotifications(userId) {
    if (!userId) {
        console.error("User ID is undefined. Cannot fetch notifications.");
        return;
    }
    try {
        const notifications = await getNotificationsFromFirestore(userId) || [];
        const filteredNotifications = notifications.filter(notification => {
            // Your filter condition here
            return true; // Placeholder
        });
        console.log("Filtered notifications:", filteredNotifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
    }
}

// Fetch user data when authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = user.uid;
        console.log("User ID:", userId);

        // Fetch user data from Firestore
        fetchUserData(userId);

        // Fetch messages and notifications
        fetchNotifications(userId);
    } else {
        window.location.href = 'login.html'; // Redirect to login if user is not authenticated
    }
});

async function fetchUserData(userId) {
    const userDocRef = doc(firestore, 'Trainer', userId);
    const profilePicRef = storageRef(storage, 'profilePictures/' + userId + '/profile.jpg');

    try {
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists()) {
            const userData = snapshot.data();
            console.log("Fetched user data:", userData);

            // Safely assign data to input fields only if elements are available
            if (usernameInput) usernameInput.value = userData.username || '';
            if (emailInput) emailInput.value = auth.currentUser.email || '';
            if (phoneInput) phoneInput.value = userData.phone || '';
            if (addressInput) addressInput.value = userData.address || '';
        

            // Fetch and display the profile picture
            try {
                const url = await getDownloadURL(profilePicRef);
                if (profilePicture) profilePicture.src = url;
            } catch (error) {
                console.warn("Error loading profile picture:", error);
                if (profilePicture) profilePicture.src = 'default-profile.png';
            }
        } else {
            if (statusMessage) statusMessage.textContent = "No user data found!";
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        if (statusMessage) statusMessage.textContent = "Error loading data.";
    }
}

// Handle profile picture upload
if (profilePicture) {
    profilePicture.addEventListener('click', () => {
        if (profilePictureInput) profilePictureInput.click();
    });
}

if (profilePictureInput) {
    profilePictureInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadProfilePicture(file);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('status-message');

    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = usernameInput?.value || '';
            const phone = phoneInput?.value || '';
            const address = addressInput?.value || '';
            const user = auth.currentUser;

            if (user) {
                const userId = user.uid;
                const userDocRef = doc(firestore, 'Trainer', userId);

                try {
                    await setDoc(userDocRef, {
                        username,
                        phone,
                        address
                    }, { merge: true });

                    if (statusMessage) {
                        statusMessage.textContent = "Profile updated successfully!";
                        statusMessage.style.color = 'green';
                    }

                    setTimeout(() => {
                        window.location.href = 'trainer.html'; // Redirect to dashboard after 3 seconds
                    }, 3000);
                } catch (error) {
                    console.error("Error updating profile:", error);
                    if (statusMessage) {
                        statusMessage.textContent = "Error updating profile.";
                        statusMessage.style.color = 'red';
                    }
                }
            }
        });
    }
});


// Upload profile picture and save the URL in Firestore
// Function to upload profile picture and save it directly to Firestore
async function uploadProfilePicture(file) {
    const userId = auth.currentUser.uid;
    const reader = new FileReader();

    reader.onload = async function (event) {
        const base64Image = event.target.result; // Base64 encoded image

        // Update the Trainer document with the Base64 profile picture
        const trainerDocRef = doc(firestore, 'Trainer', userId);
        try {
            await setDoc(trainerDocRef, { TrainerPhoto: base64Image }, { merge: true }); // Merge the image data
            if (profilePicture) profilePicture.src = base64Image; // Update the displayed image
            console.log("Profile picture saved to Firestore directly.");
        } catch (error) {
            console.error("Error saving profile picture to Firestore:", error);
        }
    };

    reader.onerror = function (error) {
        console.error("Error reading file as Base64:", error);
    };

    reader.readAsDataURL(file); // Read the file as Base64 data URL
}

