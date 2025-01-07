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

document.addEventListener("DOMContentLoaded", () => {
    const GymNameField = document.getElementById("GymName");
    const TrainerEmailField = document.getElementById("TrainerEmail");
    const TrainerUsernameField = document.getElementById("TrainerUsername");

    // Function to get query parameters
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Populate GymName field if gymName is passed in the URL
    const gymName = getQueryParam("gymName");
    if (gymName) {
        GymNameField.value = decodeURIComponent(gymName);
    } else {
        GymNameField.value = "Unknown Gym"; // Fallback if no gymName is passed
    }

    // Populate TrainerEmail field if email is passed in the URL
    const trainerEmail = getQueryParam("email");
    if (trainerEmail) {
        TrainerEmailField.value = decodeURIComponent(trainerEmail);
    }

    // Populate TrainerUsername field if username is passed in the URL
    const trainerUsername = getQueryParam("username");
    if (trainerUsername) {
        TrainerUsernameField.value = decodeURIComponent(trainerUsername);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const GymNameField = document.getElementById("GymName");
    const TrainerEmailField = document.getElementById("TrainerEmail");
    const TrainerUsernameField = document.getElementById("TrainerUsername");

    // Function to get query parameters
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Populate GymName field if gymName is passed in the URL
    const gymName = getQueryParam("gymName");
    if (gymName) {
        GymNameField.value = decodeURIComponent(gymName);
    } else {
        GymNameField.value = "Unknown Gym"; // Fallback if no gymName is passed
    }

    // Populate TrainerEmail field if email is passed in the URL
    const trainerEmail = getQueryParam("email");
    if (trainerEmail) {
        TrainerEmailField.value = decodeURIComponent(trainerEmail);
    }

    // Populate TrainerUsername field if username is passed in the URL
    const trainerUsername = getQueryParam("username");
    if (trainerUsername) {
        TrainerUsernameField.value = decodeURIComponent(trainerUsername);
    }

    // Event listener for TrainerPhotoInput to preview profile picture
    const TrainerPhotoInput = document.getElementById("TrainerPhoto");
    const profilePic = document.getElementById("profilePic");

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

    // Handle form submission
    const form = document.getElementById("TrainerForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const trainerName = document.getElementById("TrainerName").value.trim();
        const trainerEmail = TrainerEmailField.value.trim();

        try {
            const spinnerModal = document.getElementById("spinnerModal");
            const showSpinner = () => (spinnerModal.style.display = "block");
            const hideSpinner = () => (spinnerModal.style.display = "none");
            showSpinner();

            // Fetch GymName dynamically
            const gymName = GymNameField.value.trim();
            if (!gymName || gymName === "Unknown Gym") {
                hideSpinner();
                Swal.fire({
                    icon: "error",
                    title: "Gym Name Missing",
                    text: "Error: Gym Name could not be determined for the applied trainer.",
                });
                return;
            }

            const TrainerPhotoInput = document.getElementById("TrainerPhoto");
            const TrainerApplicationInput = document.getElementById("TrainerApplication");
            const ResumeInput = document.getElementById("Resume");

            // Upload files to Firebase Storage
            async function uploadFile(file, path) {
                const storageReference = storageRef(storage, path);
                const snapshot = await uploadBytes(storageReference, file);
                return await getDownloadURL(snapshot.ref);
            }

            const TrainerPhotoURL = TrainerPhotoInput.files[0]
                ? await uploadFile(
                      TrainerPhotoInput.files[0],
                      `Trainer_photos/${trainerName}`
                  )
                : "";
            const TrainerApplicationURL = TrainerApplicationInput.files[0]
                ? await uploadFile(
                      TrainerApplicationInput.files[0],
                      `Trainer_applications/${trainerName}`
                  )
                : "";
            const ResumeURL = ResumeInput.files[0]
                ? await uploadFile(
                      ResumeInput.files[0],
                      `Trainer_resumes/${trainerName}`
                  )
                : "";

            const trainersRef = collection(db, "Trainer");
            const q = query(trainersRef, where("email", "==", trainerEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const trainerDoc = querySnapshot.docs[0];
                const trainerDocRef = trainerDoc.ref;

                await updateDoc(trainerDocRef, {
                    TrainerEmail: trainerEmail,
                    ...(TrainerPhotoURL && { TrainerPhoto: TrainerPhotoURL }),
                    ...(TrainerApplicationURL && { TrainerApplication: TrainerApplicationURL }),
                    ...(ResumeURL && { Resume: ResumeURL }),
                    Days: document.getElementById("Days").value,
                    Experience: document.getElementById("Experience").value,
                    Expertise: document.getElementById("Expertise").value,
                    Contact: document.getElementById("Contact").value,
                    rate: document.getElementById("rate").value,
                    gymName: gymName,
                    role: "trainer",
                    status: "Under Review",
                });

                const message = `A new trainer has applied; kindly check and approve it.`;
                const notification = {
                    userId: trainerDoc.id,
                    gymName: gymName,
                    message: message,
                    timestamp: new Date().toISOString(),
                    status: "Unread",
                };
                await addDoc(collection(db, "MemberNotif"), notification);
                hideSpinner();
                Swal.fire({
                    icon: "success",
                    title: "Applied Success",
                    text: "Apply Gym successfully Sent wait for the Gym Owners Approval!",
                }).then(() => {
                    window.location.href = "trainer.html";
                });
            } else {
                const newTrainerRef = await addDoc(trainersRef, {
                    TrainerName: trainerName,
                    TrainerEmail: trainerEmail,
                    TrainerPhoto: TrainerPhotoURL,
                    TrainerApplication: TrainerApplicationURL,
                    Resume: ResumeURL,
                    Days: document.getElementById("Days").value,
                    Experience: document.getElementById("Experience").value,
                    Expertise: document.getElementById("Expertise").value,
                    Contact: document.getElementById("Contact").value,
                    rate: document.getElementById("rate").value,
                    gymName: gymName,
                    role: "trainer",
                    status: "Under Review",
                });

                const message = `A new trainer has applied; kindly check and approve it.`;
                const notification = {
                    userId: newTrainerRef.id,
                    gymName: gymName,
                    message: message,
                    timestamp: new Date().toISOString(),
                    status: "Unread",
                };
                await addDoc(collection(db, "MemberNotif"), notification);
                hideSpinner();
                Swal.fire({
                    icon: "success",
                    title: "Application Submitted",
                    text: "Trainer information submitted successfully! Your information is under review.",
                }).then(() => {
                    window.location.href = "trainer.html";
                });
            }
        } catch (error) {
            hideSpinner();
            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: `Error: Could not submit the form. ${error.message}`,
            });
        }
    });
});


