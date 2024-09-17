import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getDatabase, ref, onValue, set ,get } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';
import { update } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';


// Your Firebase configuration
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
const auth = getAuth(app);
const database = getDatabase(app);

function loadGymProfiles() {
    const gymListBody = document.getElementById('gymList');

    // Reference to the gyms data in the database
    const gymsRef = ref(database, 'GymForms');

    // Fetch and display gym profiles
    onValue(gymsRef, (snapshot) => {
        gymListBody.innerHTML = ''; // Clear previous data
        snapshot.forEach((childSnapshot) => {
            const gym = childSnapshot.val();
            const gymKey = childSnapshot.key;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="select-gym" data-key="${gymKey}"></td>
                <td>${gym.gymName}</td>
                <td><a href="#" onclick="openModal('${gym.gymPhoto}')"><img src="${gym.gymPhoto}" alt="Gym Photo" style="max-width: 100px;"></a></td>
                <td><a href="#" onclick="openModal('${gym.gymCertifications}')"><img src="${gym.gymCertifications}" alt="Certification Image" style="max-width: 100px;"></a></td>
                <td>${gym.gymEquipment}</td>
                <td>${gym.gymContact}</td>
                <td>${gym.gymPrograms}</td>
                <td>${gym.gymOpeningTime}</td>
                <td>${gym.gymClosingTime}</td>
                <td>${gym.gymLocation}</td>
                <td>${gym.status}</td>
                <td>
                    <button class="btn btn-success btn-sm mx-1" onclick="updateStatus('approve', '${gymKey}')">Approve</button>
                    <button class="btn btn-secondary btn-sm mx-1" onclick="updateStatus('idle', '${gymKey}')">Idle</button>
                </td>
            `;
            gymListBody.appendChild(row);
        });
    });
}

// Function to open the modal and display the image

// Load gym profiles when the page loads
window.onload = loadGymProfiles;




// Ensure that this function is called when the page is loaded and actions are added to the table
window.addEventListener('load', () => {
    // Initialize any event listeners or additional setup here if needed
});


//function displayMessages(message, type) {
    const messageArea = document.getElementById('messageArea');

    // Clear any previous content and remove previous classes
    messageArea.textContent = '';
    messageArea.className = ''; // Reset the class

    // Set the message content
    messageArea.textContent = message;

    // Add the correct class based on the message type (success or error)
    if (type === 'success') {
        messageArea.classList.add('success');
    } else if (type === 'error') {
        messageArea.classList.add('error');
    }

    // Display the message with the show class
    messageArea.classList.add('show');

    // Automatically hide the message after 1 second (1000ms)
    setTimeout(() => {
        messageArea.classList.remove('show');
    }, 1000); // Disappears after 1 second
//}

window.deleteSelected = function() {
    const selectedCheckboxes = document.querySelectorAll('.select-gym:checked');

    if (selectedCheckboxes.length === 0) {
        displayMessage('You need to select at least one gym profile to delete. Please select profiles and try again.', 'error');
        return;
    }

    // Display custom confirmation dialog
    displayConfirmation('Are you sure you want to delete the selected profiles? This action cannot be undone.', () => {
        selectedCheckboxes.forEach(checkbox => {
            const key = checkbox.getAttribute('data-key'); // Gym profile key (ID)
            const gymRef = ref(database, 'GymForms/' + key); // Reference to gym profile

            // Remove the gym profile from Firebase
            set(gymRef, null)
                .then(() => {
                    displayMessage(`The profile with key ${key} has been successfully removed.`, 'success');
                })
                .catch(() => {
                    displayMessage(`Error deleting profile with key ${key}. Please try again later.`, 'error');
                });
        });

        // Reload the gym profiles after deletion
        loadGymProfiles();
    });
};

// Function to display the floating confirmation message
function displayConfirmation(message, callback) {
    const confirmationContainer = document.createElement('div');
    confirmationContainer.classList.add('confirmation-container');
    
    confirmationContainer.innerHTML = `
        <div class="confirmation-content">
            <p>${message}</p>
            <div class="confirmation-buttons">
                <button id="confirm-btn" class="confirm-btn">Yes</button>
                <button id="cancel-btn" class="cancel-btn">No</button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmationContainer);

    // Style the confirmation container
    confirmationContainer.style.position = 'fixed';
    confirmationContainer.style.top = '50%';
    confirmationContainer.style.left = '50%';
    confirmationContainer.style.transform = 'translate(-50%, -50%)';
    confirmationContainer.style.backgroundColor = '#fff';
    confirmationContainer.style.borderRadius = '8px';
    confirmationContainer.style.padding = '20px';
    confirmationContainer.style.zIndex = '9999';
    confirmationContainer.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    confirmationContainer.style.width = '300px';
    confirmationContainer.style.textAlign = 'center';
    confirmationContainer.style.fontFamily = 'Arial, sans-serif';
    confirmationContainer.style.transition = 'all 0.3s ease-in-out';

    // Style the confirmation message
    const confirmationContent = confirmationContainer.querySelector('.confirmation-content');
    confirmationContent.style.marginBottom = '20px';
    confirmationContent.style.fontSize = '16px';
    confirmationContent.style.color = '#333';
    
    // Style the buttons
    const confirmButton = document.getElementById('confirm-btn');
    const cancelButton = document.getElementById('cancel-btn');
    
    confirmButton.style.backgroundColor = '#28a745';
    confirmButton.style.color = '#fff';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '5px';
    confirmButton.style.padding = '10px 20px';
    confirmButton.style.cursor = 'pointer';
    confirmButton.style.marginRight = '10px';
    confirmButton.style.transition = 'background-color 0.3s';

    cancelButton.style.backgroundColor = '#dc3545';
    cancelButton.style.color = '#fff';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.padding = '10px 20px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.transition = 'background-color 0.3s';

    // Add hover effects
    confirmButton.addEventListener('mouseenter', () => {
        confirmButton.style.backgroundColor = '#218838';
    });
    confirmButton.addEventListener('mouseleave', () => {
        confirmButton.style.backgroundColor = '#28a745';
    });

    cancelButton.addEventListener('mouseenter', () => {
        cancelButton.style.backgroundColor = '#c82333';
    });
    cancelButton.addEventListener('mouseleave', () => {
        cancelButton.style.backgroundColor = '#dc3545';
    });

    // Handle confirm button click
    document.getElementById('confirm-btn').addEventListener('click', () => {
        document.body.removeChild(confirmationContainer);
        callback();
    });

    // Handle cancel button click
    document.getElementById('cancel-btn').addEventListener('click', () => {
        document.body.removeChild(confirmationContainer);
    });
}

// Function to display floating success/error messages
function displayMessage(message, type) {
    const messageContainer = document.getElementById('message-container');
    const messageText = document.getElementById('message-text');

    messageText.textContent = message;

    if (type === 'success') {
        messageContainer.style.backgroundColor = '#d4edda'; // Light green background for success
        messageContainer.style.color = '#155724'; // Dark green text color
        messageContainer.style.border = '1px solid #c3e6cb'; // Border matching the green theme
    } else {
        messageContainer.style.backgroundColor = '#f8d7da'; // Light red background for error
        messageContainer.style.color = '#721c24'; // Dark red text color
        messageContainer.style.border = '1px solid #f5c6cb'; // Border matching the red theme
    }

    // Center the message container
    messageContainer.style.position = 'fixed';
    messageContainer.style.top = '20px'; // Adjust as needed
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translateX(-50%)';

    messageContainer.style.display = 'block'; // Make the message container visible

    // Hide the message after 5 seconds
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
}

window.openModal = function(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    // const captionText = document.getElementById('caption'); // Remove or comment out this line

    modal.style.display = "block";
    modalImg.src = imageSrc;
    // captionText.innerHTML = imageSrc; // Remove or comment out this line

    // Close the modal when the user clicks on <span> (x)
    const span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    }
}

window.updateStatus = function(status, key) {
    const gymRef = ref(database, 'GymForms/' + key); // Reference to the gym profile in Firebase

    // Update only the status field of the gym profile
    update(gymRef, { status: status })
        .then(() => {
            displayMessage(`Success! Profile with key ${key} is now marked as ${status}.`, 'success');
            loadGymProfiles(); // Reload the gym profiles after update
        })
        .catch(() => {
            displayMessage('Oops! We ran into a hiccup while updating the profile status. Please try again later.', 'error');
        });
};

