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
    const usersRef = collection(db, 'GymOwner'); // Use Firestore modular syntax
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

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("TrainerForm");

    const TrainerName = document.getElementById("TrainerName");
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
    TrainerPhotoInput.addEventListener("change", (event) => {
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

    // Fetch GymName dynamically from GymOwner collection
    async function fetchGymNameByTrainerEmail(email) {
        const trainersRef = collection(db, "Trainer");
        const q = query(trainersRef, where("TrainerEmail", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const trainerDoc = querySnapshot.docs[0];
            const gymOwnerID = trainerDoc.data().GymOwnerID; // Ensure GymOwnerID is stored in Trainer
            if (gymOwnerID) {
                const gymOwnerRef = doc(db, "GymOwner", gymOwnerID);
                const gymOwnerSnap = await getDoc(gymOwnerRef);
                if (gymOwnerSnap.exists()) {
                    return gymOwnerSnap.data().gymName || null;
                }
            }
        }
        return null;
    }

    // Show/hide spinner modal
    function showSpinner() {
        spinnerModal.style.display = "block";
    }
    function hideSpinner() {
        spinnerModal.style.display = "none";
    }

    // Handle form submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const trainerEmail = TrainerEmail.value;

        try {
            showSpinner();

            // Fetch GymName dynamically
            const gymName = await fetchGymNameByTrainerEmail(trainerEmail);

            if (!gymName) {
                errorMessage.innerHTML =
                    "Error: Gym Name could not be determined for the applied trainer.";
                setTimeout(() => {
                    hideSpinner();
                    errorMessage.innerHTML = "";
                }, 3000);
                return;
            }

            const TrainerPhotoURL = TrainerPhotoInput.files[0]
                ? await uploadFile(
                      TrainerPhotoInput.files[0],
                      `Trainer_photos/${TrainerName.value}`
                  )
                : "";
            const TrainerApplicationURL = TrainerApplicationInput.files[0]
                ? await uploadFile(
                      TrainerApplicationInput.files[0],
                      `Trainer_applications/${TrainerName.value}`
                  )
                : "";
            const ResumeURL = ResumeInput.files[0]
                ? await uploadFile(
                      ResumeInput.files[0],
                      `Trainer_resumes/${TrainerName.value}`
                  )
                : "";

            // Add trainer data to Firestore
            await addDoc(collection(db, "Trainer"), {
                TrainerName: TrainerName.value,
                TrainerEmail: trainerEmail,
                TrainerPhoto: TrainerPhotoURL,
                TrainerApplication: TrainerApplicationURL,
                Resume: ResumeURL,
                Days: Days.value,
                Experience: Experience.value,
                Expertise: Expertise.value,
                Contact: Contact.value,
                rate: rate.value,
                gymName: gymName, // Automatically associate GymName
                role: "trainer",
                status: "Under Review",
            });

            successMessage.innerHTML =
                "Trainer information submitted successfully! Your information is under review.";
            setTimeout(() => {
                hideSpinner();
                window.location.href = "trainer.html";
            }, 2000);
        } catch (error) {
            hideSpinner();
            errorMessage.innerHTML =
                "Error: Could not submit the form. " + error.message;
            setTimeout(() => {
                errorMessage.innerHTML = "";
            }, 3000);
        }
    });
});
document.addEventListener("DOMContentLoaded", async function () {
    const TrainerEmailField = document.getElementById("TrainerEmail"); // Ensure this field exists
    const GymNameField = document.getElementById("GymName");

    // Fetch GymName dynamically based on TrainerEmail
    async function fetchGymNameByTrainerEmail(email) {
        try {
            // Check if email is provided
            if (!email) {
                throw new Error("TrainerEmail is empty or undefined.");
            }

            // Fetch the trainer document by email
            const trainersRef = collection(db, "Trainer");
            const q = query(trainersRef, where("TrainerEmail", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const trainerDoc = querySnapshot.docs[0];
                const gymOwnerID = trainerDoc.data().GymOwnerID; // Ensure GymOwnerID is stored in Trainer

                if (gymOwnerID) {
                    // Fetch the GymOwner document to retrieve the GymName
                    const gymOwnerRef = doc(db, "GymOwner", gymOwnerID);
                    const gymOwnerSnap = await getDoc(gymOwnerRef);

                    if (gymOwnerSnap.exists()) {
                        return gymOwnerSnap.data().gymName || "Unknown Gym";
                    }
                }
            }
            return "Unknown Gym"; // Fallback if no data is found
        } catch (error) {
            console.error("Error fetching Gym Name:", error);
            return "Error fetching Gym Name";
        }
    }

    // Populate the GymName field when TrainerEmail loses focus
    TrainerEmailField.addEventListener("blur", async () => {
        const trainerEmail = TrainerEmailField.value.trim();
        if (trainerEmail) {
            GymNameField.value = "Loading..."; // Provide feedback while fetching
            const gymName = await fetchGymNameByTrainerEmail(trainerEmail);
            GymNameField.value = gymName; // Dynamically populate Gym Name
        } else {
            GymNameField.value = ""; // Clear field if email is empty
        }
    });
});
