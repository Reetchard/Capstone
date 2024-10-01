// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";


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

window.addEventListener('load', () => {
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
        const gymsQuery = query(collection(firestore, 'GymForms'), where('gymName', '==', gymName.value));
        const querySnapshot = await getDocs(gymsQuery);
        return !querySnapshot.empty; // Return true if duplicate exists
    }

    // Function to get the GymOwner ID from the Roles collection
    async function getGymOwnerId() {
        const gymOwnerDocRef = doc(firestore, 'Roles', 'Gym_Owner'); // Direct reference to the Gym_Owner document
        const gymOwnerDoc = await getDoc(gymOwnerDocRef); // Fetch the document
    
        if (!gymOwnerDoc.exists()) {
            console.error('No Gym_Owner found in Roles collection');
            return null; // Handle this case as needed
        }
    
        // Assuming GymId is a field in the Gym_Owner document
        return gymOwnerDoc.data().GymId; // Return the GymId from the document
    }  
    async function logRolesCollection() {
    const rolesSnapshot = await getDocs(collection(firestore, 'Roles'));
    rolesSnapshot.forEach(doc => {
        console.log(doc.id, " => ", doc.data());
    });
}

// Call this function to check the collection
logRolesCollection();


    // Listen for form submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Check for duplicate data
        const duplicate = await isDuplicateData();
    
        if (duplicate) {
            errorMessage.innerHTML = "Error: This gym information has already been submitted.";
            successMessage.innerHTML = "";  // Clear any success message
    
            // Hide error message after 3 seconds
            setTimeout(() => {
                errorMessage.innerHTML = "";
            }, 3000);
        } else {
            try {
                const gymOwnerId = await getGymOwnerId(); // Get the GymOwner ID (GymId)
    
                if (!gymOwnerId) {
                    errorMessage.innerHTML = "Error: Unable to find Gym_Owner ID.";
                    return;
                }
    
                // Upload files and get URLs
                const gymPhotoURL = gymPhotoInput.files[0] ? await uploadFile(gymPhotoInput.files[0], `gym_photos/${gymName.value}`) : "";
                const gymCertificationsURL = gymCertificationsInput.files[0] ? await uploadFile(gymCertificationsInput.files[0], `gym_certifications/${gymName.value}`) : "";
    
                // Submit new data if no duplicate is found
                await addDoc(collection(firestore, 'GymForms'), {
                    gymOwnerId: gymOwnerId,  // Store the GymId
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
    
                // Update the success message to indicate pending approval
                successMessage.innerHTML = "Gym information submitted successfully! Please wait for admin's approval.";
                errorMessage.innerHTML = "";  // Clear any error message
    
                // Hide success message after 3 seconds and redirect
                setTimeout(() => {
                    successMessage.innerHTML = "";
                    window.location.href = "login.html"; // Redirect to login.html
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
