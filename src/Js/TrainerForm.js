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
    const form = document.getElementById("TrainerForm");
    if (!form) {
        console.error('Form element not found');
        return;
    }

    const TrainerName = document.getElementById("TrainerName");
    const TrainerPhotoInput = document.getElementById("TrainerPhoto");
    const TrainerPermitInput = document.getElementById("TrainerPermit");
    const Email = document.getElementById("Email");
    const Days = document.getElementById("Days");
    const Experience = document.getElementById("Experience");
    const Expertise = document.getElementById("Expertise");
    const errorMessage = document.getElementById("TrainerFormErrorMessage");
    const successMessage = document.getElementById("TrainerFormSuccessMessage");

    // Function to handle image upload
    async function uploadFile(file, path) {
        const storageReference = storageRef(storage, path);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    }

    // Function to check for duplicate data
    async function isDuplicateData() {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, `Trainer`));

        if (snapshot.exists()) {
            const trainersData = snapshot.val();
            
            // Loop through existing Trainer data to check for duplicates
            for (const key in trainersData) {
                const trainer = trainersData[key];

                if (trainer.TrainerName === TrainerName.value &&
                    trainer.TrainerPhoto === TrainerPhotoInput.value &&
                    trainer.TrainerPermit === TrainerPermitInput.value &&
                    trainer.Email === Email.value &&
                    trainer.Days === Days.value &&
                    trainer.Experience === Experience.value &&
                    trainer.Expertise === Expertise.value) {
                
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
    
            // Hide error message after 3 seconds
            setTimeout(() => {
                errorMessage.innerHTML = "";
            }, 3000);
        } else {
            try {
                // Upload files and get URLs
                const TrainerPhotoURL = TrainerPhotoInput.files[0] ? await uploadFile(TrainerPhotoInput.files[0], `Trainer_photos/${TrainerName.value}`) : "";
                const TrainerPermitURL = TrainerPhotoInput.files[0] ? await uploadFile(TrainerPhotoInput.files[0], `Trainer_permits/${TrainerName.value}`) : "";
    
                // Submit new data if no duplicate is found
                const NewTrainerRef = ref(database, 'TrainerForm/' + TrainerName.value);
                await set(NewTrainerRef, {
                    TrainerName: TrainerName.value,
                    TrainerPhoto: TrainerPhotoURL,  // Store photo URL
                    TrainerPermit: TrainerPermitURL,  // Store Permit URL
                    Email: Email.value,
                    Days: Days.value,
                    Experience: Experience.value,
                    Expertise: Expertise.value,
                    status: "Under Review"  // Set status as "Under Review"
                });
    
                successMessage.innerHTML = "Trainer information submitted successfully!";
                errorMessage.innerHTML = "";  // Clear any error message
    
                // Hide success message after 3 seconds
                setTimeout(() => {
                    successMessage.innerHTML = "";
                }, 3000);
    
                form.reset();  // Clear the form after successful submission
            } catch (error) {
                errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
                successMessage.innerHTML = "";  // Clear any success message
    
                // Hide error message after 3 seconds
                setTimeout(() => {
                    errorMessage.innerHTML = "";
                }, 3000);
            }
        }
    });
});


