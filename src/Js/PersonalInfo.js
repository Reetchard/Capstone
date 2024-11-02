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
const profilePicture = document.getElementById('profile-picture');
const profilePictureInput = document.getElementById('profile-picture-input');

// Fetch user data when authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = user.uid;
        const userDocRef = doc(firestore, 'Users', userId);

        getDoc(userDocRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.data();
                console.log("Fetched user data:", userData);

                // Assign data to input fields
                usernameInput.value = userData.username || '';
                emailInput.value = user.email || '';
                phoneInput.value = userData.phone || '';
                addressInput.value = userData.address || '';
                weightInput.value = userData.weight || '';
                heightInput.value = userData.height || '';
                medicationInput.value = userData.medication || '';
                allergiesInput.value = userData.allergies || '';

                // Display profile picture if URL is stored in Firestore, else show default
                profilePicture.src = userData.photoURL || 'default-profile.png';
            } else {
                statusMessage.textContent = "No user data found!";
            }
        }).catch((error) => {
            console.error("Error fetching user data:", error);
            statusMessage.textContent = "Error loading data.";
        });
    } else {
        window.location.href = 'login.html';
    }
});

// Handle profile picture upload and cropping
profilePicture.addEventListener('click', () => {
    profilePictureInput.click();
});

profilePictureInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadProfilePicture(file);
    }
});

// Update profile information
personalInfoForm.addEventListener('submit', async (e) => {
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
        const userDocRef = doc(firestore, 'Users', userId);

        try {
            await setDoc(userDocRef, {
                username,
                phone,
                address,
                weight,
                height,
                medication,
                allergies
            }, { merge: true });
            
            statusMessage.textContent = "Profile updated successfully!";
            statusMessage.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            statusMessage.textContent = "Error updating profile.";
            statusMessage.style.color = 'red';
        }
    }
});

async function uploadProfilePicture(file) {
    const userId = auth.currentUser.uid;
    const profilePicRef = storageRef(storage, `profilePictures/${userId}/profile.jpg`);
    const uploadTask = uploadBytesResumable(profilePicRef, file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            // Optional: Track upload progress
        }, 
        (error) => {
            console.error('Error uploading profile picture:', error);
        }, 
        async () => {
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            profilePicture.src = downloadURL;

            // Save the profile picture URL in Firestore
            const userDocRef = doc(firestore, 'Users', userId);
            try {
                await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });
                console.log("Profile picture URL saved to Firestore.");
            } catch (error) {
                console.error("Error saving profile picture URL to Firestore:", error);
            }
        }
    );
}
