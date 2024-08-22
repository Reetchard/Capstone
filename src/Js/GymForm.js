
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

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
    
        if (!gymName || !gymLocation || !gymCertifications || !gymEquipment || !gymContact || !gymPrograms || !gymOpeningTime || !gymClosingTime) {
            showError("Please fill in all required fields.");
            return;
        }
    
        try {
            const gymId = await getNextGymId();
    
            // Create a reference to the file in Firebase Storage
            const certStorageRef = storageRef(storage, `gym_certifications/${gymId}`);
            const uploadTask = uploadBytes(certStorageRef, gymCertifications);
    
            uploadTask.then(async (snapshot) => {
                // Get the download URL from Firebase Storage
                const downloadURL = await getDownloadURL(certStorageRef);
    
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
                    status: 'pending'
                };
    
                await set(ref(database, 'gyms/' + gymId), gymData);
    
                successMessage.textContent = "Gym details submitted successfully!";
                errorMessage.textContent = '';
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 1500);
    
                // Clear the form
                document.getElementById('gymOwnerDetailsForm').reset();
            }).catch((error) => {
                console.error('Error uploading file:', error);
                showError("Failed to upload certifications.");
            });
        } catch (error) {
            showError("An error occurred. Please try again.");
            console.error('Error submitting gym details:', error);
        }
    });


    function initMap() {
        // Coordinates for Lapu-Lapu City, Cebu, Philippines
        const lapuLapuCoords = { lat: 10.3157, lng: 123.9050 };
        
        // Create the map centered on Lapu-Lapu City
        const map = new google.maps.Map(document.getElementById('map'), {
            center: lapuLapuCoords,
            zoom: 12 // Adjust zoom level as needed
        });
    
        // Create the autocomplete object for the input field
        const input = document.getElementById('gymLocation');
        const autocomplete = new google.maps.places.Autocomplete(input);
    
        // Bind the autocomplete object to the map's bounds
        autocomplete.bindTo('bounds', map);
    
        // Add a listener for when the place is changed
        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
    
            // If no geometry, exit
            if (!place.geometry) {
                return;
            }
    
            // Set the map's center to the location of the selected place
            map.setCenter(place.geometry.location);
            map.setZoom(15);
    
            // Place a marker at the selected location
            new google.maps.Marker({
                position: place.geometry.location,
                map: map
            });
        });
    }
    
    // Load the map after the page has fully loaded
    window.addEventListener('load', initMap);
    
    async function getNextGymId() {
        // Create a reference to the 'gyms' collection
        const gymsRef = ref(database, 'gyms');
    
        // Use Firebase's push() method to generate a unique ID
        const newGymRef = push(gymsRef);
    
        // Get the unique ID
        const gymId = newGymRef.key;
    
        // Return the unique ID
        return gymId;
    }
    
   document.addEventListener('DOMContentLoaded', () => {
        // Initialize flatpickr
        flatpickr("#gymOpeningTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i"
        });
        flatpickr("#gymClosingTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i"
        });
    
        // Handle form submission
        document.getElementById('gymOwnerDetailsForm').addEventListener('submit', function(event) {
            event.preventDefault();
    
            // Hide existing messages
            hideMessages();
    
            // Show success message
            showMessage('success', 'Form submitted successfully.');
    
            // Show static info message after success message disappears
            setTimeout(() => {
                showMessage('info', 'We will message you through the email you provide. Please wait for the Admin\'s approval.');
            }, 3000); // Adjust the delay to match the success message duration
        });
    
        function showMessage(type, message) {
            const errorMessage = document.getElementById('gymOwnerFormErrorMessage');
            const successMessage = document.getElementById('gymOwnerFormSuccessMessage');
            const infoMessage = document.querySelector('.info-message');
    
            if (type === 'error') {
                errorMessage.textContent = message;
                errorMessage.style.display = 'block';
                setTimeout(() => {
                    errorMessage.style.opacity = '0';
                    setTimeout(() => {
                        errorMessage.style.display = 'none';
                        errorMessage.style.opacity = '1';
                    }, 500);
                }, 3000);
            } else if (type === 'success') {
                successMessage.textContent = message;
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.opacity = '0';
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                        successMessage.style.opacity = '1';
                    }, 500);
                }, 3000);
            } else if (type === 'info') {
                infoMessage.textContent = message;
                infoMessage.style.display = 'block';
                setTimeout(() => {
                    infoMessage.style.opacity = '0';
                    setTimeout(() => {
                        infoMessage.style.display = 'none';
                        infoMessage.style.opacity = '1';
                    }, 500);
                }, 3000);
            }
        }
    
        function hideMessages() {
            const messages = document.querySelectorAll('.error-message, .success-message, .info-message');
            messages.forEach(msg => {
                msg.style.display = 'none';
                msg.style.opacity = '1';
            });
        }
    });