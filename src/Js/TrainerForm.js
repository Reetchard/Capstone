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
import { getDatabase, ref, set, push, child, get, runTransaction } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

window.addEventListener('load', () => {
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
        const snapshot = await get(child(dbRef, `TrainerForm`));
        if (snapshot.exists()) {
            const trainersData = snapshot.val();
            for (const key in trainersData) {
                const trainer = trainersData[key];
                // Check if all fields match exactly
                if (
                    trainer.TrainerName === TrainerName.value &&
                    trainer.Email === Email.value &&
                    trainer.Days === Days.value &&
                    trainer.Experience === Experience.value &&
                    trainer.Expertise === Expertise.value
                ) {
                    return true; // A duplicate entry is found
                }
            }
        }
        return false; // No duplicate found
    }

    // Function to generate the next incrementing ID
    async function getNextTrainerID() {
        const idRef = ref(database, 'latestTrainerID');
        const snapshot = await get(idRef);

        let newID = 1; // Default ID if none exists
        if (snapshot.exists()) {
            newID = snapshot.val() + 1; // Increment ID
        }

        // Update the latest ID in the database
        await set(idRef, newID);
        return newID;
    }

    // Listen for form submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const duplicate = await isDuplicateData();
    
        if (duplicate) {
            errorMessage.innerHTML = "Error: A trainer with the same information already exists.";
            successMessage.innerHTML = "";
            setTimeout(() => {
                errorMessage.innerHTML = "";
            }, 3000);
        } else {
            try {
                // Upload files and get URLs
                const TrainerPhotoURL = TrainerPhotoInput.files[0] ? await uploadFile(TrainerPhotoInput.files[0], `Trainer_photos/${TrainerName.value}`) : "";
                const TrainerPermitURL = TrainerPermitInput.files[0] ? await uploadFile(TrainerPermitInput.files[0], `Trainer_permits/${TrainerName.value}`) : "";

                // Generate a unique ID
                const newTrainerID = await getNextTrainerID();
                const NewTrainerRef = ref(database, 'TrainerForm/' + newTrainerID);

                // Submit new data if no duplicate is found
                await set(NewTrainerRef, {
                    TrainerID: newTrainerID,  // Use incrementing ID
                    TrainerName: TrainerName.value,
                    TrainerPhoto: TrainerPhotoURL,
                    TrainerPermit: TrainerPermitURL,
                    Email: Email.value,
                    Days: Days.value,
                    Experience: Experience.value,
                    Expertise: Expertise.value,
                    status: "Under Review"
                });

                successMessage.innerHTML = "Trainer information submitted successfully!";
                errorMessage.innerHTML = "";
                setTimeout(() => {
                    successMessage.innerHTML = "";
                }, 3000);
    
                form.reset();
            } catch (error) {
                errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
                successMessage.innerHTML = "";
                setTimeout(() => {
                    errorMessage.innerHTML = "";
                }, 3000);
            }
        }
    });
});
