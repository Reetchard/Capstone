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

    // Element declarations (synced with form IDs)
    const TrainerName = document.getElementById("TrainerName");
    const GymName = document.getElementById("GymName");
    const TrainerEmail = document.getElementById("TrainerEmail");
    const TrainerPhotoInput = document.getElementById("TrainerPhoto");
    const TrainerApplicationInput = document.getElementById("TrainerApplication"); 
    const ResumeInput = document.getElementById("Resume");
    const Days = document.getElementById("Days");
    const Experience = document.getElementById("Experience");
    const Expertise = document.getElementById("Expertise");
    const Contact = document.getElementById("Contact");
    const rate = document.getElementById("rate");
    const errorMessage = document.getElementById("TrainerFormErrorMessage");
    const successMessage = document.getElementById("TrainerFormSuccessMessage");
    const profilePic = document.getElementById("profilePic");
    const spinnerModal = document.getElementById("spinnerModal");

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

    // Show spinner modal
    function showSpinner() {
        spinnerModal.style.display = 'block';
    }

    // Hide spinner modal
    function hideSpinner() {
        spinnerModal.style.display = 'none';
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
                // Show the spinner while processing
                showSpinner();

                // Upload files if they exist
                const TrainerPhotoURL = TrainerPhotoInput.files[0] ? await uploadFile(TrainerPhotoInput.files[0], `Trainer_photos/${TrainerName.value}`) : "";
                const TrainerApplicationURL = TrainerApplicationInput.files[0] ? await uploadFile(TrainerApplicationInput.files[0], `Trainer_applications/${TrainerName.value}`) : "";
                const ResumeURL = ResumeInput.files[0] ? await uploadFile(ResumeInput.files[0], `Trainer_resumes/${TrainerName.value}`) : "";

                // Update the Users collection with trainer data
                const userRef = doc(db, 'Users', userDoc.id); // Reference to the user document
                await updateDoc(userRef, {
                    TrainerName: TrainerName.value,
                    GymName: GymName.value,
                    TrainerPhoto: TrainerPhotoURL,
                    TrainerApplication: TrainerApplicationURL,
                    Resume: ResumeURL,
                    Days: Days.value,
                    Experience: Experience.value,
                    Expertise: Expertise.value,
                    Contact: Contact.value,
                    rate: rate.value,
                    role: "trainer", // Set the role to trainer
                    status: "Under Review"
                });

                successMessage.innerHTML = "Trainer information submitted successfully! Your information is under review.";
                errorMessage.innerHTML = "";

                // Simulate a delay for the spinner (you can remove this if unnecessary)
                setTimeout(() => {
                    hideSpinner();
                    window.location.href = "trainer.html"; // Redirect after successful submission
                }, 2000);

            } catch (error) {
                hideSpinner();
                errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
                successMessage.innerHTML = "";
                setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
            }
        }
    });

});
