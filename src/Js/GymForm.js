// Initialize Firebase
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

// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, child, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

window.addEventListener('load', () => {
    // Ensure the form is defined correctly
    const form = document.getElementById("gymOwnerDetailsForm");
    if (!form) {
        console.error('Form element not found');
        return;
    }

    const gymName = document.getElementById("gymName");
    const gymPhotoInput = document.getElementById("gymPhoto");
    const gymCertificationsInput = document.getElementById("gymCertifications");
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
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, `GymForms`));

        if (snapshot.exists()) {
            const gymsData = snapshot.val();
            
            // Loop through existing gym data to check for duplicates
            for (const key in gymsData) {
                const gym = gymsData[key];

                if (gym.gymName === gymName.value &&
                    gym.gymPhoto === gymPhotoInput.value &&
                    gym.gymCertifications === gymCertificationsInput.value &&
                    gym.gymEquipment === gymEquipment.value &&
                    gym.gymContact === gymContact.value &&
                    gym.gymPrograms === gymPrograms.value &&
                    gym.gymOpeningTime === gymOpeningTime.value &&
                    gym.gymClosingTime === gymClosingTime.value &&
                    gym.gymLocation === gymLocation.value) {
                
                    // Data match found (duplicate)
                    return true;
                }
            }
        }

        // No duplicate found
        return false;
    }

    // Listen for form submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Check for duplicate data
        const duplicate = await isDuplicateData();

        if (duplicate) {
            // Display error message if duplicate data is found
            errorMessage.innerHTML = "Error: This gym information has already been submitted.";
            successMessage.innerHTML = "";  // Clear any success message
        } else {
            try {
                // Upload files and get URLs
                const gymPhotoURL = gymPhotoInput.files[0] ? await uploadFile(gymPhotoInput.files[0], `gym_photos/${gymName.value}`) : "";
                const gymCertificationsURL = gymCertificationsInput.files[0] ? await uploadFile(gymCertificationsInput.files[0], `gym_certifications/${gymName.value}`) : "";

                // Submit new data if no duplicate is found
                const newGymRef = ref(database, 'GymForms/' + gymName.value);
                await set(newGymRef, {
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

                successMessage.innerHTML = "Gym information submitted successfully!";
                errorMessage.innerHTML = "";  // Clear any error message
                form.reset();  // Clear the form after successful submission
            } catch (error) {
                errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
                successMessage.innerHTML = "";  // Clear any success message
            }
        }
    });
});


