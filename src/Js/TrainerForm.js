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

document.addEventListener("DOMContentLoaded", function() {
    const gymSelect = document.getElementById('GymName');

    // Fetch gym owners from Firestore and populate dropdown
    const usersRef = collection(db, 'Users'); // Use Firestore modular syntax
    const q = query(usersRef, where('role', '==', 'gymowner'));

    getDocs(q).then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const gymName = doc.data().gymName;
            if (gymName) {
                const option = document.createElement('option');
                option.value = gymName;
                option.textContent = gymName;
                gymSelect.appendChild(option);
            }
        });
    }).catch((error) => {
        console.error('Error fetching gym owners:', error);
    });
});

window.addEventListener('load', () => {
    const form = document.getElementById("TrainerForm");

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

    // Preview profile picture
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

    // Upload files to Firebase Storage
    async function uploadFile(file, path) {
        const storageReference = storageRef(storage, path);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    }

    // Check if email exists in Users collection
    async function getUserDocByEmail(email) {
        const userQuery = query(collection(db, 'Users'), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0];
        } else {
            return null;
        }
    }

    // Check for duplicate trainers
    async function isDuplicateTrainer() {
        const q = query(collection(db, 'Users'), where('TrainerEmail', '==', TrainerEmail.value));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    }

    // Show/hide spinner modal
    function showSpinner() { spinnerModal.style.display = 'block'; }
    function hideSpinner() { spinnerModal.style.display = 'none'; }

    // Handle form submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const trainerEmail = TrainerEmail.value;

        const userDoc = await getUserDocByEmail(trainerEmail);
        if (!userDoc) {
            errorMessage.innerHTML = "Error: Trainer email does not match any user in the system.";
            setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
            return;
        }

        const duplicate = await isDuplicateTrainer();
        if (duplicate) {
            errorMessage.innerHTML = "Error: A trainer with the same email already exists.";
            setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
            return;
        }

        try {
            showSpinner(),1000;

            const TrainerPhotoURL = TrainerPhotoInput.files[0] ? await uploadFile(TrainerPhotoInput.files[0], `Trainer_photos/${TrainerName.value}`) : "";
            const TrainerApplicationURL = TrainerApplicationInput.files[0] ? await uploadFile(TrainerApplicationInput.files[0], `Trainer_applications/${TrainerName.value}`) : "";
            const ResumeURL = ResumeInput.files[0] ? await uploadFile(ResumeInput.files[0], `Trainer_resumes/${TrainerName.value}`) : "";

            const userRef = doc(db, 'Users', userDoc.id);
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
                role: "trainer",
                status: "Under Review"
            });

            successMessage.innerHTML = "Trainer information submitted successfully! Your information is under review.";
            setTimeout(() => {
                hideSpinner();
                window.location.href = "trainer.html";
            }, 2000);

        } catch (error) {
            hideSpinner();
            errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
            setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
        }
    });
});
