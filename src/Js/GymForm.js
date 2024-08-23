
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
        const gymCertifications = document.getElementById('gymCertifications').files[0];
        const gymEquipment = document.getElementById('gymEquipment').value;
        const gymContact = document.getElementById('gymContact').value;
        const gymPrograms = document.getElementById('gymPrograms').value;
        const gymOpeningTime = document.getElementById('gymOpeningTime').value;
        const gymClosingTime = document.getElementById('gymClosingTime').value;
        const gymLocation = document.getElementById('gymLocation').value;
    
        if (!gymName || !gymCertifications || !gymEquipment || !gymContact || !gymPrograms || !gymOpeningTime || !gymClosingTime || !gymLocation) {
            document.getElementById('gymOwnerFormErrorMessage').innerText = 'Please fill in all required fields.';
            return;
        }
    
        // Upload certifications image
        const certificationsRef = storageRef(storage, 'certifications/' + gymCertifications.name);
        await uploadBytes(certificationsRef, gymCertifications);
    
        // Save form data to Firebase
        const gymFormRef = ref(database, 'GymForms/' + Date.now()); // Using timestamp as GymID
        await set(gymFormRef, {
            gymName,
            certifications: gymCertifications.name,
            gymEquipment,
            gymContact,
            gymPrograms,
            gymOpeningTime,
            gymClosingTime,
            gymLocation
        });
    
        // Set a flag in local storage to indicate form submission
        localStorage.setItem('formSubmitted', 'true');
    
        // Show success message
        document.getElementById('gymOwnerFormSuccessMessage').innerText = 'Form submitted successfully! Please wait for admin approval.';
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

    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('gymOwnerDetailsForm');
        const errorMessage = document.getElementById('gymOwnerFormErrorMessage');
        const successMessage = document.getElementById('gymOwnerFormSuccessMessage');
    
        // Initialize Flatpickr (if needed)
        flatpickr("#gymOpeningTime, #gymClosingTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "h:i K"
        });
    
        // Google Maps setup
        let map;
        const locationInput = document.getElementById('gymLocation');
        const autocomplete = new google.maps.places.Autocomplete(locationInput);
    
        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            if (!place.geometry) {
                // User entered the name of a place that was not suggested
                return;
            }
    
            // Map setup
            if (!map) {
                map = new google.maps.Map(document.getElementById('map'), {
                    center: place.geometry.location,
                    zoom: 15
                });
            }
    
            map.setCenter(place.geometry.location);
            map.setZoom(15);
    
            new google.maps.Marker({
                position: place.geometry.location,
                map: map
            });
        });
    
        form.addEventListener('submit', function(event) {
            event.preventDefault();
    
            // Clear previous messages
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
    
            let hasError = false;
    
            // Validation
            const requiredFields = [
                'gymName', 'gymCertifications', 'gymEquipment', 'gymContact', 
                'gymPrograms', 'gymOpeningTime', 'gymClosingTime', 'gymLocation'
            ];
    
            requiredFields.forEach(function(fieldId) {
                const field = document.getElementById(fieldId);
                if (!field.value.trim()) {
                    field.style.border = '1px solid #dc3545'; // Red border for errors
                    hasError = true;
                } else {
                    field.style.border = ''; // Remove error border
                }
            });
    
            if (hasError) {
                errorMessage.textContent = 'Please fill out all required fields.';
                errorMessage.style.display = 'block';
                return;
            }
    
            // Simulate form submission
            setTimeout(function() {
                successMessage.textContent = 'Form submitted successfully!';
                successMessage.style.display = 'block';
            }, 500);
        });
    });

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('gymOwnerDetailsForm');
        const errorMessage = document.getElementById('gymOwnerFormErrorMessage');
        const successMessage = document.getElementById('gymOwnerFormSuccessMessage');
        const infoMessage = document.getElementById('infoMessage');
    
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission
    
            // Clear previous messages
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            infoMessage.style.display = 'none'; // Hide the static message initially
    
            // Get form data
            const formData = new FormData(form);
    
            // Basic validation example
            let hasErrors = false;
            for (let [key, value] of formData.entries()) {
                if (!value) {
                    hasErrors = true;
                    errorMessage.textContent = `Please fill out the ${key} field.`;
                    break;
                }
            }
    
            if (hasErrors) {
                errorMessage.style.display = 'block';
                return; // Stop processing if there are errors
            }
    
            // Process form data and interact with Firebase
            try {
                // Example of uploading data to Firebase
                // Note: Replace with your actual Firebase logic
                const database = firebase.database();
                const storage = firebase.storage();
    
                // Example: Save form data to Firebase Realtime Database
                await database.ref('gyms').push(Object.fromEntries(formData));
    
                // Show success message
                successMessage.textContent = 'Your gym details have been submitted successfully.';
                successMessage.style.display = 'block';
    
                // Show the static message
                infoMessage.style.display = 'block';
            } catch (error) {
                // Show error message
                errorMessage.textContent = 'An error occurred while submitting your details.';
                errorMessage.style.display = 'block';
            }
        });
    });

