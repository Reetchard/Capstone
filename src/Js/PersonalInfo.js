import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js';
import { getStorage, ref as storageRef, getDownloadURL, uploadBytesResumable } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

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
const storage = getStorage(app);

// Get DOM elements
const personalInfoForm = document.getElementById('personal-info-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const addressInput = document.getElementById('address');
const weightInput = document.getElementById('weight');
const heightInput = document.getElementById('height');
const medicationInput = document.getElementById('medication');
const allergiesInput = document.getElementById('allergies');
const statusMessage = document.getElementById('status-message');
const profilePicture = document.getElementById('profile-picture'); // Define profilePicture
const profilePictureInput = document.getElementById('profile-picture-input'); // Assuming there's an input for file upload

// Fetch user data when authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = user.uid;
        const userRef = ref(database, 'Accounts/' + userId);
        const profilePicRef = storageRef(storage, 'profilePictures/' + userId + '/profile.jpg');

        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                
                // Debugging: Log the data to check if it's fetched correctly
                console.log("Fetched user data:", userData);

                // Assign data to input fields
                usernameInput.value = userData.username || ''; // Check if username exists in Firebase data
                emailInput.value = user.email || ''; // Use Firebase Auth email
                
                // Populate other fields
                phoneInput.value = userData.phone || '';
                addressInput.value = userData.address || '';
                weightInput.value = userData.weight || '';
                heightInput.value = userData.height || '';
                medicationInput.value = userData.medication || '';
                allergiesInput.value = userData.allergies || '';

                // Fetch and display the profile picture
                getDownloadURL(profilePicRef)
                    .then((url) => {
                        profilePicture.src = url; // Set the profile picture
                    })
                    .catch((error) => {
                        console.error("Error loading profile picture:", error);
                        profilePicture.src = 'default-profile.png'; // Default picture if not available
                    });
            } else {
                statusMessage.textContent = "No user data found!";
            }
        }).catch((error) => {
            console.error("Error fetching user data:", error);
            statusMessage.textContent = "Error loading data.";
        });
    } else {
        window.location.href = 'login.html'; // Redirect to login if user is not authenticated
    }
});

// Handle profile picture upload and cropping
profilePicture.addEventListener('click', () => {
    profilePictureInput.click(); // Open file selector when clicking on the image
});

profilePictureInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Optionally add cropping functionality here using a library like CropperJS
        uploadProfilePicture(file);
    }
});

// Update profile information
personalInfoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = usernameInput.value;
    const phone = phoneInput.value;
    const address = addressInput.value;
    const weight = weightInput.value;
    const height = heightInput.value;
    const medication = medicationInput.value;
    const allergies = allergiesInput.value;
    const user = auth.currentUser;

    if (user) {
        const userId = user.uid;
        const userRef = ref(database, 'Accounts/' + userId);

        // Update user profile in the database
        update(userRef, {
            username: username,
            phone: phone,
            address: address,
            weight: weight,
            height: height,
            medication: medication,
            allergies: allergies
        }).then(() => {
            statusMessage.textContent = "Profile updated successfully!";
            statusMessage.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'dashboard.html'; // Redirect to dashboard after 3 seconds
            }, 3000);
        }).catch((error) => {
            console.error("Error updating profile:", error);
            statusMessage.textContent = "Error updating profile.";
            statusMessage.style.color = 'red';
        });
    }
});

function uploadProfilePicture(file) {
    const userId = auth.currentUser.uid;
    const profilePicRef = storageRef(storage, 'profilePictures/' + userId + '/profile.jpg');

    const uploadTask = uploadBytesResumable(profilePicRef, file);
    uploadTask.on('state_changed', 
        (snapshot) => {
            // Optional: Track upload progress
        }, 
        (error) => {
            console.error('Error uploading profile picture:', error);
        }, 
        () => {
            // Upload completed successfully
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                profilePicture.src = downloadURL; // Update the displayed profile picture
            });
        }
    );
}
