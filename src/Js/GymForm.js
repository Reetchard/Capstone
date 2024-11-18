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

window.addEventListener('load', () => {
    const form = document.getElementById("gymOwnerDetailsForm");
    const spinnerModal = document.getElementById("spinnerModal");

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
    const gymPriceRate = document.getElementById("gymPriceRate");
    const errorMessage = document.getElementById("gymOwnerFormErrorMessage");
    const successMessage = document.getElementById("gymOwnerFormSuccessMessage");
    const photoPreview = document.getElementById("photoPreview");

    // Display selected photo in the preview container
    gymPhotoInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Gym Photo Preview" style="width: 100%; height: auto; border-radius: 8px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            photoPreview.innerHTML = ""; // Clear preview if no file is selected
        }
    });

    // Function to handle image upload
    async function uploadFile(file, path) {
        const storageReference = storageRef(storage, path);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    }

    async function isUserEmailValid(gymEmail) {
        const gymowner = auth.currentUser; // Get the current authenticated user
        if (gymowner) {
            const userEmail = gymowner.email.trim().toLowerCase(); // Normalize authenticated user's email
            const enteredEmail = gymEmail.trim().toLowerCase(); // Normalize entered email
            console.log("Authenticated user's email:", userEmail); // Debugging output
            console.log("Entered gym email:", enteredEmail); // Debugging output
            return userEmail === enteredEmail; // Compare normalized emails
        } else {
            console.log("No authenticated user.");
            return false; // Not authenticated
        }
    }    

    // Show the spinner modal
    function showSpinner() {
        spinnerModal.style.display = 'block';
    }

    // Hide the spinner modal
    function hideSpinner() {
        spinnerModal.style.display = 'none';
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
    
        try {
            showSpinner();
    
            const gymEmail = gymEmailInput.value;
    
            // Validate the user's email
            const isValidEmail = await isUserEmailValid(gymEmail);
            if (!isValidEmail) {
                errorMessage.innerHTML = "Error: The email you entered does not match your registered account. Please check and try again.";
                hideSpinner(); // Hide spinner if error occurs
                return;
            }

            // Custom validation for the file input
            if (gymPhotoInput.files.length === 0) {
                errorMessage.innerHTML = "Please upload a gym photo.";
                hideSpinner(); // Hide spinner if error occurs
                return;
            }

            // Validate price rate as a decimal
            const priceRateValue = parseFloat(gymPriceRate.value);
            if (isNaN(priceRateValue) || priceRateValue < 0) {
                errorMessage.innerHTML = "Please enter a valid price rate as a positive decimal number.";
                hideSpinner(); // Hide spinner if error occurs
                return;
            }

            // Upload files and get URLs
            const gymPhotoURL = await uploadFile(gymPhotoInput.files[0], `gym_photos/${gymName.value}`);
            const gymCertificationsURL = gymCertificationsInput.files[0] ? await uploadFile(gymCertificationsInput.files[0], `gym_certifications/${gymName.value}`) : "";

            // Get authenticated user details
            const user = auth.currentUser;
            const userId = user.uid; // User's unique ID

            // Create or update the user's document with gym information
            const userDocRef = doc(firestore, 'GymOwner', userId);
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
                gymPriceRate: priceRateValue, // Save price rate as a decimal
                status: "Under review"
            }, { merge: true });

            // Success message logic
            successMessage.innerHTML = "Gym information submitted successfully! Please wait for admin's approval.";
            errorMessage.innerHTML = "";

            // After a brief delay, redirect to login.html
            setTimeout(() => {
                hideSpinner();
                window.location.href = "login.html";
            }, 2000);

            form.reset();  // Clear the form after successful submission
            photoPreview.innerHTML = ""; // Clear photo preview after submission
        } catch (error) {
            errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
            successMessage.innerHTML = "";
            hideSpinner(); // Hide spinner if error occurs
            setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
        }
    });

});
