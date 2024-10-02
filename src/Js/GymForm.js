// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, setDoc, query, where, getDocs, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
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

    // Function to check for duplicate data
    async function isDuplicateData() {
        const gymsQuery = query(collection(firestore, 'GymForms'), where('gymName', '==', gymName.value));
        const querySnapshot = await getDocs(gymsQuery);
        return !querySnapshot.empty; // Return true if duplicate exists
    }

    // Function to get UserId of GymOwner from Users collection
    async function getGymOwnerUserId(gymEmail) {
        const user = auth.currentUser; // Get the current authenticated user
        if (user) {
            const userEmail = user.email;
            console.log("Authenticated User Email:", userEmail); // Log authenticated email

            // Query to find users with the matching email
            const userQuery = query(
                collection(firestore, 'Users'),
                where('email', '==', gymEmail) // Check against the GymForms email
            );

            const querySnapshot = await getDocs(userQuery);
            console.log("Query Snapshot:", querySnapshot); // Log the query snapshot for debugging

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                return userDoc.id; // Return the UserId as a string
            } else {
                console.error("No user found with email:", gymEmail); // Log if no user is found
            }
        } else {
            console.error("No user is authenticated."); // Log if no user is authenticated
        }
        return null; // Return null if no user found
    }

    // Listen for form submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Check for duplicate data
        const duplicate = await isDuplicateData();
    
        if (duplicate) {
            errorMessage.innerHTML = "Error: This gym information has already been submitted.";
            successMessage.innerHTML = "";  // Clear any success message
            setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
        } else {
            try {
                const gymEmail = gymEmailInput.value; // Get the gym email value
                console.log("Gym Email:", gymEmail); // Log the gym email for debugging
                
                // Get UserId of GymOwner
                const gymOwnerId = await getGymOwnerUserId(gymEmail); // Pass the gym email
                if (!gymOwnerId) {
                    errorMessage.innerHTML = "Error: Unable to find GymOwner UserId.";
                    return;
                }

                // Convert gymOwnerId to number (if that's required by your Firestore structure)
                const gymOwnerIdNumber = parseInt(gymOwnerId, 10);

                // Upload files and get URLs
                const gymPhotoURL = gymPhotoInput.files[0] ? await uploadFile(gymPhotoInput.files[0], `gym_photos/${gymName.value}`) : "";
                const gymCertificationsURL = gymCertificationsInput.files[0] ? await uploadFile(gymCertificationsInput.files[0], `gym_certifications/${gymName.value}`) : "";

                // Generate a new gymId
                const newGymDocRef = doc(collection(firestore, 'GymForms')); // Create a reference for a new document
                const gymId = newGymDocRef.id; // Get the generated ID

                // Submit new data if no duplicate is found
                await setDoc(newGymDocRef, {
                    gymId: gymId,  // Save the generated gymId
                    gymOwnerId: gymOwnerIdNumber,  // Save the GymOwner UserId as a number
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
                });

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
