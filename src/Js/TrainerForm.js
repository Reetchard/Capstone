// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

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
    if (!form) {
        console.error('Form element not found');
        return;
    }

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

    TrainerPhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                profilePic.src = e.target.result; // Update the image preview
            };
            reader.readAsDataURL(file);
        } else {
            profilePic.src = "framework/img/Profile.png"; // Reset to default image
        }
    });

    async function uploadFile(file, path) {
        const storageReference = storageRef(storage, path);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    }

    async function isDuplicateData() {
        const q = query(collection(db, 'TrainerForm'), 
            where('TrainerName', '==', TrainerName.value), 
            where('TrainerEmail', '==', TrainerEmail.value));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty; // Returns true if a duplicate is found
    }

    // Function to get UserId of Trainer from Users collection
    async function getUserIdByEmail(email) {
        const userQuery = query(
            collection(db, 'Users'),
            where('email', '==', email) // Check against the Trainer email
        );

        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return userDoc.id; // Return the UserId
        } else {
            console.error("No user found with email:", email); // Log if no user is found
            return null; // Return null if no user found
        }
    }

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
                // Get UserId based on TrainerEmail
                const trainerEmail = TrainerEmail.value;
                const userId = await getUserIdByEmail(trainerEmail);
                if (!userId) {
                    errorMessage.innerHTML = "Error: Unable to find User ID for the Trainer.";
                    return;
                }

                // Fetch the Trainer ID from Roles collection
                const rolesDocRef = doc(db, 'Roles', 'Trainer');
                const rolesDoc = await getDoc(rolesDocRef);

                let trainerId = 'N/A'; // Default value if no Trainer ID is found
                if (rolesDoc.exists()) {
                    trainerId = rolesDoc.data().TrainerId; // Adjust if the field name is different
                }

                const TrainerPhotoURL = TrainerPhotoInput.files[0] ? await uploadFile(TrainerPhotoInput.files[0], `Trainer_photos/${TrainerName.value}`) : "";
                const TrainerPermitURL = TrainerPermitInput.files[0] ? await uploadFile(TrainerPermitInput.files[0], `Trainer_permits/${TrainerName.value}`) : "";

                const docRef = await addDoc(collection(db, 'TrainerForm'), {
                    UserId: userId, // Save UserId from Users collection
                    TrainerId: trainerId, // Save Trainer ID
                    TrainerName: TrainerName.value,
                    TrainerEmail: TrainerEmail.value,
                    TrainerPhoto: TrainerPhotoURL,
                    TrainerPermit: TrainerPermitURL,
                    Days: Days.value,
                    Experience: Experience.value,
                    Expertise: Expertise.value,
                    rate: rate.value,
                    status: "Under Review"
                });

                const trainerFormId = docRef.id;
                console.log('Trainer Form ID:', trainerFormId);

                // Custom success message
                successMessage.innerHTML = `Trainer information submitted successfully! Your information is currently under review and awaiting approval from the Gym Owner.`;
                errorMessage.innerHTML = "";
                setTimeout(() => {
                    successMessage.innerHTML = "";
                    // Redirect to login.html
                    window.location.href = "login.html";
                }, 5000); // Display for 5 seconds

                form.reset();
                profilePic.src = "framework/img/Profile.png"; // Reset to default image
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
