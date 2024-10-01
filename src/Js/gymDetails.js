import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc , } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

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
const auth = getAuth(app);
const db = getFirestore(app);

async function loadGymProfiles() {
    const gymListBody = document.getElementById('gymList');
    const gymsRef = collection(db, 'GymForms');

    // Fetch and display gym profiles
    const snapshot = await getDocs(gymsRef);
    gymListBody.innerHTML = ''; // Clear previous data

    // Fetch the Gym ID from the Roles collection directly
    const rolesDocRef = doc(db, 'Roles', 'Gym_Owner'); // Reference to the Gym_Owner document
    const rolesDoc = await getDoc(rolesDocRef);

    let gymId = 'N/A'; // Default value if no Gym ID is found
    if (rolesDoc.exists()) {
        gymId = rolesDoc.data().GymId; // Adjust the field name if necessary
    }

    // Loop through the GymForms documents
    for (const doc of snapshot.docs) {
        const gym = doc.data();
        const gymKey = doc.id;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="select-gym" data-key="${gymKey}"></td>
            <td>${gymId}</td> <!-- Displaying the Gym ID from Roles -->
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
                <button class="btn btn-warning btn-sm mx-1" onclick="updateStatus('Block', '${gymKey}')">Block</button>
            </td>
        `;
        gymListBody.appendChild(row);
    }
}


// Load gym profiles when the page loads
window.onload = loadGymProfiles;

// Function to display messages
window.displayMessages = function(message, type) {
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

    // Automatically hide the message after 5 seconds
    setTimeout(() => {
        messageArea.classList.remove('show');
    }, 5000);
};

// Delete selected gym profiles
window.deleteSelected = async function() {
    const selectedCheckboxes = document.querySelectorAll('.select-gym:checked');
    if (selectedCheckboxes.length === 0) {
        displayMessages('You need to select at least one gym profile to delete.', 'error');
        return;
    }

    // Display confirmation dialog
    displayConfirmation('Are you sure you want to delete the selected profiles?', async () => {
        for (const checkbox of selectedCheckboxes) {
            const key = checkbox.getAttribute('data-key');
            const gymRef = doc(db, 'GymForms', key);
            await deleteDoc(gymRef)
                .then(() => {
                    displayMessages(`Profile with key ${key} has been deleted.`, 'success');
                })
                .catch(() => {
                    displayMessages(`Error deleting profile with key ${key}.`, 'error');
                });
        }
        loadGymProfiles(); // Reload profiles after deletion
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

// Function to open the modal and display the image
window.openModal = function(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');

    modal.style.display = "block";
    modalImg.src = imageSrc;

    // Close the modal when the user clicks on <span> (x)
    const span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    }
}

// Function to update status of a gym
window.updateStatus = async function(status, key) {
    const gymRef = doc(db, 'GymForms', key);
    await updateDoc(gymRef, { status: status })
        .then(() => {
            displayMessages(`Profile with key ${key} is now marked as ${status}.`, 'success');
            loadGymProfiles(); // Reload profiles after update
        })
        .catch(() => {
            displayMessages('Error updating status. Please try again.', 'error');
        });
};

// Load gym profiles when the page loads
window.onload = loadGymProfiles;
