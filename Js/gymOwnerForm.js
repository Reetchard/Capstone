
 // Firebase configuration
 import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getDatabase, ref, set } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
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

    // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);
        const storage = getStorage(app);

        // Example usage: writing data to the database
        function writeUserData(userId, name, email, imageUrl) {
            set(ref(database, 'users/' + userId), {
                username: name,
                email: email,
                profile_picture : imageUrl
            });
        }

        // Example usage: uploading a file
        function uploadFile(file) {
            const storageReference = storageRef(storage, 'some-child/' + file.name);
            uploadBytes(storageReference, file).then((snapshot) => {
                console.log('Uploaded a blob or file!');
            });
        }

        // Example: Log initialization success
        console.log('Firebase initialized:', app);

    // Function to show and then hide the error message
    function showError(message) {
        const errorMessage = document.getElementById('gymOwnerFormErrorMessage');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 1500);
    }

    // Handle form submission
    document.getElementById('gymOwnerDetailsForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const gymName = document.getElementById('gymName').value;
        const gymLocation = document.getElementById('gymLocation').value;
        const gymCertifications = document.getElementById('gymCertifications').files[0];
        const gymEquipment = document.getElementById('gymEquipment').value;
        const gymContact = document.getElementById('gymContact').value;
        const gymPrograms = document.getElementById('gymPrograms').value;
        const gymOpeningTime = document.getElementById('gymOpeningTime').value;
        const gymClosingTime = document.getElementById('gymClosingTime').value;

        const errorMessage = document.getElementById('gymOwnerFormErrorMessage');
        const successMessage = document.getElementById('gymOwnerFormSuccessMessage');

        // Validate fields
        if (!gymName || !gymLocation || !gymCertifications || !gymEquipment || !gymContact || !gymPrograms || !gymOpeningTime || !gymClosingTime) {
            showError("Please fill in all required fields.");
            return;
        }

        try {
            // Get the next Gym ID
            const gymId = await getNextGymId();

            // Upload certification image to Firebase Storage
            const storageRef = storage.ref(`gym_certifications/${gymId}`);
            const uploadTask = storageRef.put(gymCertifications);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    // Observe state change events such as progress, pause, and resume
                }, 
                (error) => {
                    console.error('Error uploading file:', error);
                    showError("Failed to upload certifications.");
                }, 
                async () => {
                    // Handle successful uploads on complete
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Save form data to Firebase Database
                    const gymData = {
                        id: gymId,
                        name: gymName,
                        location: gymLocation,
                        permits: downloadURL,
                        equipment: gymEquipment,
                        contact: gymContact,
                        programs: gymPrograms,
                        schedule: {
                            openingTime: gymOpeningTime,
                            closingTime: gymClosingTime
                        },
                        status: 'pending' // Status set to 'pending' for admin review
                    };

                    await gymRef.child(gymId).set(gymData);

                    successMessage.textContent = "Gym details submitted successfully!";
                    errorMessage.textContent = '';
                    successMessage.style.display = 'block';
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                    }, 1500);

                    // Clear the form
                    document.getElementById('gymOwnerDetailsForm').reset();
                }
            );
        } catch (error) {
            showError("An error occurred. Please try again.");
            console.error('Error submitting gym details:', error);
        }
    });

