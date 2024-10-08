// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Firebase configuration
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
const db = getFirestore(app);
const storage = getStorage(app);

window.addEventListener('load', () => {
    const form = document.getElementById("TrainerForm");

    // Element declarations
    const TrainerName = document.getElementById("TrainerName");
    const TrainerEmail = document.getElementById("TrainerEmail");
    const TrainerPhotoInput = document.getElementById("TrainerPhoto");
    const TrainerPermitInput = document.getElementById("TrainerPermit");
    const Days = document.getElementById("Days");
    const Experience = document.getElementById("Experience");
    const Expertise = document.getElementById("Expertise");
    const rate = document.getElementById("rate");
    const errorMessage = document.getElementById("TrainerFormErrorMessage");
    const successMessage = document.getElementById("TrainerFormSuccessMessage");
    const profilePic = document.getElementById("profilePic");

    // Handle profile picture preview
    TrainerPhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                profilePic.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            profilePic.src = "framework/img/Profile.png";
        }
    });

    // Function to upload files to Firebase Storage
    async function uploadFile(file, path) {
        const storageReference = storageRef(storage, path);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    }

    // Function to check if the email exists in the Users collection
    async function getUserDocByEmail(email) {
        const userQuery = query(collection(db, 'Users'), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0]; // Return the first document that matches the email
        } else {
            return null; // No user found with the provided email
        }
    }

    // Function to check for duplicate trainers
    async function isDuplicateTrainer() {
        const q = query(collection(db, 'Users'), where('TrainerEmail', '==', TrainerEmail.value));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    }

    // Form submission handler
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const trainerEmail = TrainerEmail.value;

        // Check if the trainer's email matches a user in the Users collection
        const userDoc = await getUserDocByEmail(trainerEmail);
        if (!userDoc) {
            errorMessage.innerHTML = "Error: Trainer email does not match any user in the system.";
            successMessage.innerHTML = "";
            setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
            return;
        }

        // Check for duplicate trainer entries
        const duplicate = await isDuplicateTrainer();
        if (duplicate) {
            errorMessage.innerHTML = "Error: A trainer with the same email already exists.";
            successMessage.innerHTML = "";
            setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
        } else {
            try {
                // Upload files if they exist
                const TrainerPhotoURL = TrainerPhotoInput.files[0] ? await uploadFile(TrainerPhotoInput.files[0], `Trainer_photos/${TrainerName.value}`) : "";
                const TrainerPermitURL = TrainerPermitInput.files[0] ? await uploadFile(TrainerPermitInput.files[0], `Trainer_permits/${TrainerName.value}`) : "";

                // Update the Users collection with trainer data
                const userRef = doc(db, 'Users', userDoc.id); // Reference to the user document
                await updateDoc(userRef, {
                    TrainerName: TrainerName.value,
                    TrainerPhoto: TrainerPhotoURL,
                    TrainerPermit: TrainerPermitURL,
                    Days: Days.value,
                    Experience: Experience.value,
                    Expertise: Expertise.value,
                    rate: rate.value,
                    role: "trainer", // Set the role to trainer
                    status: "Under Review"
                });

                successMessage.innerHTML = "Trainer information submitted successfully! Your information is under review.";
                errorMessage.innerHTML = "";
                setTimeout(() => {
                    successMessage.innerHTML = "";
                    window.location.href = "login.html";
                }, 5000);

                form.reset();
                profilePic.src = "framework/img/Profile.png"; // Reset the image to default
            } catch (error) {
                errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
                successMessage.innerHTML = "";
                setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
            }
        }
    });
});
