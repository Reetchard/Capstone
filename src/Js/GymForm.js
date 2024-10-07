// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js"; // Import Auth

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
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app); // Initialize Auth

window.addEventListener('load', () => {
    const form = document.getElementById("gymOwnerDetailsForm");
    if (!form) {
        console.error('Form element not found');
        return;
    }

    // Element declarations
    const gymName = document.getElementById("gymName");
    const gymPhotoInput = document.getElementById("gymPhoto");
    const gymCertificationsInput = document.getElementById("gymCertifications");
    const gymEmailInput = document.getElementById("gymemail");
    const gymEquipment = document.getElementById("gymEquipment");
    const gymContact = document.getElementById("gymContact");
    const gymPrograms = document.getElementById("gymPrograms");
    const gymOpeningTime = document.getElementById("gymOpeningTime");
    const gymClosingTime = document.getElementById("gymClosingTime");
    const gymLocation = document.getElementById("gymLocation");
    const errorMessage = document.getElementById("gymOwnerFormErrorMessage");
    const successMessage = document.getElementById("gymOwnerFormSuccessMessage");

    // Function to handle image upload
    async function uploadFile(file, path) {
        const storageReference = storageRef(storage, path);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    }

    // Function to check if the authenticated user's email matches the gymEmail
    async function isUserEmailValid(gymEmail) {
        const user = auth.currentUser; // Get the current authenticated user
        if (user) {
            const userEmail = user.email;
            console.log("Authenticated User Email:", userEmail); // Log authenticated email

            // Check if the authenticated user's email matches the provided gymEmail
            return userEmail === gymEmail; // Email matches
        } else {
            console.error("No user is authenticated."); // Log if no user is authenticated
            return false; // Not authenticated
        }
    }

    // Listen for form submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const gymEmail = gymEmailInput.value; // Get the gym email value
            console.log("Gym Email:", gymEmail); // Log the gym email for debugging
            
            // Validate the user's email
            const isValidEmail = await isUserEmailValid(gymEmail);
            if (!isValidEmail) {
                errorMessage.innerHTML = "Error: User email does not match the GymForm email.";
                return;
            }

            // Upload files and get URLs
            const gymPhotoURL = gymPhotoInput.files[0] ? await uploadFile(gymPhotoInput.files[0], `gym_photos/${gymName.value}`) : "";
            const gymCertificationsURL = gymCertificationsInput.files[0] ? await uploadFile(gymCertificationsInput.files[0], `gym_certifications/${gymName.value}`) : "";

            // Get authenticated user details
            const user = auth.currentUser;
            const userId = user.uid; // User's unique ID

            // Create or update the user's document with gym information
            const userDocRef = doc(firestore, 'Users', userId);
            await setDoc(userDocRef, {
                gymName: gymName.value,
                gymPhoto: gymPhotoURL,  // Store photo URL
                gymCertifications: gymCertificationsURL,  // Store certification URL
                gymEquipment: gymEquipment.value,
                gymContact: gymContact.value,
                gymPrograms: gymPrograms.value,
                gymOpeningTime: gymOpeningTime.value,
                gymClosingTime: gymClosingTime.value,
                gymLocation: gymLocation.value,
                status: "Under Review"  // Set status as "Under Review"
            }, { merge: true }); // Use merge to keep existing user data

            // Success message logic
            successMessage.innerHTML = "Gym information submitted successfully! Please wait for admin's approval.";
            errorMessage.innerHTML = "";  // Clear any error message
            setTimeout(() => { successMessage.innerHTML = ""; window.location.href = "login.html"; }, 3000);
            form.reset();  // Clear the form after successful submission
        } catch (error) {
            errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
            successMessage.innerHTML = "";  // Clear any success message
            setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
        }
    });

    // Add functionality to trigger file input click
    document.getElementById('uploadPhotoButton').addEventListener('click', function() {
        document.getElementById('gymPhoto').click();
    });

    // Preview selected image
    document.getElementById('gymPhoto').addEventListener('change', function(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('photoPreview');

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.style.backgroundImage = `url(${e.target.result})`;
            };
            reader.readAsDataURL(file);
        }
    });
});
