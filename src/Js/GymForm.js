// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
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

// Ensure all elements are loaded
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("gymOwnerDetailsForm");
    const spinnerModal = document.getElementById("spinnerModal");

    // Element declarations
    const gymPhotoInput = document.getElementById("gymPhoto");
    const gymPhotoPreview = document.getElementById("gymPhotoPreview"); 
    const errorMessage = document.getElementById("gymOwnerFormErrorMessage");
    const successMessage = document.getElementById("gymOwnerFormSuccessMessage");

    // Display preview for selected gym photo
    gymPhotoInput.addEventListener("change", () => {
        const file = gymPhotoInput.files[0];
        if (file && gymPhotoPreview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                gymPhotoPreview.src = e.target.result;
                gymPhotoPreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        } else if (gymPhotoPreview) {
            gymPhotoPreview.src = "";
            gymPhotoPreview.style.display = "none";
        }
    });

    // Function to upload file to Firebase Storage
    async function uploadFile(file, path) {
        const storageReference = storageRef(storage, path);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    }

    // Show and hide spinner modal
    function showSpinner() {
        spinnerModal.style.display = 'block';
    }
    function hideSpinner() {
        spinnerModal.style.display = 'none';
    }

    // Form submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            showSpinner();
            const user = auth.currentUser;

            // Ensure photo is uploaded and get download URL
            if (!gymPhotoInput.files.length) {
                errorMessage.innerHTML = "Please upload a gym photo.";
                hideSpinner();
                return;
            }

            const gymPhotoURL = await uploadFile(gymPhotoInput.files[0], `gym_photos/${gymName.value}`);
            const gymCertificationsURL = gymCertificationsInput.files[0] 
                ? await uploadFile(gymCertificationsInput.files[0], `gym_certifications/${gymName.value}`) 
                : "";

            // Submit data to Firestore
            const userDocRef = doc(firestore, 'Users', user.uid);
            await setDoc(userDocRef, {
                gymName: gymName.value,
                gymPhoto: gymPhotoURL,
                gymCertifications: gymCertificationsURL,
                gymEquipment: gymEquipment.value,
                gymContact: gymContact.value,
                gymPrograms: gymPrograms.value,
                gymOpeningTime: gymOpeningTime.value,
                gymClosingTime: gymClosingTime.value,
                gymLocation: gymLocation.value,
                gymPriceRate: gymPriceRate.value,
                status: "Under Review"
            }, { merge: true });

            successMessage.innerHTML = "Gym information submitted successfully!";
            errorMessage.innerHTML = "";

            setTimeout(() => {
                hideSpinner();
                window.location.href = "login.html";
            }, 2000);

            form.reset();
            gymPhotoPreview.style.display = "none"; 
        } catch (error) {
            errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
            hideSpinner();
        }
    });
});