import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, query, updateDoc, deleteDoc, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to fetch trainer data from Firestore
async function fetchTrainerData() {
    try {
        const trainerRef = collection(db, 'TrainerForm');
        const snapshot = await getDocs(trainerRef);
        const trainerInfoBody = document.getElementById('trainerInfoBody');
        trainerInfoBody.innerHTML = '';  

        const rolesDocRef = doc(db, 'Roles', 'Trainer');
        const rolesDoc = await getDoc(rolesDocRef);

        let trainerIdFromRoles = 'N/A'; 
        if (rolesDoc.exists()) {
            trainerIdFromRoles = rolesDoc.data().TrainerID; 
        } else {
            console.warn('No roles document found');
        }

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const trainer = doc.data();
                const TrainerID = trainer.TrainerID || 'N/A'; // Access TrainerID from trainer data
                console.log('Trainer Data:', trainer); // Log trainer data for debugging
        
                let row = `
                    <tr>
                        <td><input type="checkbox" class="rowCheckbox" data-id="${doc.id}"></td>
                        <td>${TrainerID}</td>
                        <td>
                            <img src="${trainer.TrainerPhoto || 'default-image.jpg'}" 
                                alt="Trainer Photo" 
                                class="trainer-photo zoomable"
                                onclick="openModal('${trainer.TrainerPhoto || 'default-image.jpg'}')" />
                        </td>
                        <td>${trainer.TrainerName || 'N/A'}</td>
                        <td>${trainer.Experience || 'N/A'}</td>
                        <td>${trainer.Expertise || 'N/A'}</td>
                        <td>${trainer.Days || 'N/A'}</td>
                        <td>
                            <img src="${trainer.TrainerPermit || 'default-permit.jpg'}" 
                                alt="Trainer Permit" 
                                class="trainer-photo zoomable"
                                onclick="openModal('${trainer.TrainerPermit || 'default-permit.jpg'}')" />
                        </td>
                        <td>${trainer.status || 'Under Review'}</td>
                        <td class="button-container">
                            <button class="status-button approved" onclick="updateTrainerStatus('${doc.id}', 'Approved')">Approve</button>
                            <button class="status-button idle" onclick="updateTrainerStatus('${doc.id}', 'Idle')">Idle</button>
                            <button class="status-button blocked" onclick="updateTrainerStatus('${doc.id}', 'Blocked')">Block</button>
                        </td>
                    </tr>
                `;
                trainerInfoBody.innerHTML += row;
            });
            const selectAllCheckbox = document.getElementById('selectAllHeader');
            selectAllCheckbox.addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('input.rowCheckbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = selectAllCheckbox.checked;
                });
            });
        } else {
            trainerInfoBody.innerHTML = '<tr><td colspan="10" class="text-center">No trainers found</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching trainer data:', error);
    }
}

fetchTrainerData();

// Function to delete selected trainers
window.deleteSelected = function() {
    const checkboxes = document.querySelectorAll('input.rowCheckbox:checked');
    if (checkboxes.length === 0) {
        displayMessage('No trainers selected for deletion.', 'warning');
    } else {
        checkboxes.forEach(checkbox => {
            const TrainerID = checkbox.getAttribute('data-id');
            confirmDelete(TrainerID);
        });
    }
};

// Function to update trainer status
window.updateTrainerStatus = async function(key, status) {
    const trainerRef = doc(db, 'TrainerForm', key);
    try {
        await updateDoc(trainerRef, { status: status });
        displayMessage(`Trainer status updated to ${status}.`, 'success');
        fetchTrainerData();
    } catch (error) {
        displayMessage('Failed to update trainer status. Try again later.', 'error');
        console.error('Error updating trainer status:', error);
    }
};

// Function to display messages with transition
function displayMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;

    let backgroundColor, textColor;
    switch (type) {
        case 'success':
            backgroundColor = '#4CAF50';
            textColor = '#fff';
            break;
        case 'warning':
            backgroundColor = '#FF9800';
            textColor = '#fff';
            break;
        case 'error':
            backgroundColor = '#F44336';
            textColor = '#fff';
            break;
        default:
            backgroundColor = '#2196F3';
            textColor = '#fff';
            break;
    }

    messageContainer.innerHTML = `
        <div class="message-box" style="background-color: ${backgroundColor}; color: ${textColor}; opacity: 1; transition: opacity 0.5s;">
            ${message}
        </div>
    `;

    setTimeout(() => {
        messageContainer.querySelector('.message-box').style.opacity = '0';
        setTimeout(() => {
            messageContainer.innerHTML = ''; // Remove the message after fade-out
        }, 500);
    }, 3000);
}

function showConfirmationModal(message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    const closeButton = document.getElementsByClassName('close')[0];

    confirmationMessage.textContent = message;

    modal.classList.add('show');
    modal.classList.remove('hide');

    confirmButton.onclick = function() {
        onConfirm();
        modal.classList.remove('show');
        modal.classList.add('hide');
    };

    cancelButton.onclick = function() {
        modal.classList.remove('show');
        modal.classList.add('hide');
    };

    closeButton.onclick = function() {
        modal.classList.remove('show');
        modal.classList.add('hide');
    };

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.classList.remove('show');
            modal.classList.add('hide');
        }
    };
}

// Function to confirm delete action
function confirmDelete(TrainerID) {
    showConfirmationModal('Are you sure you want to delete this trainer?', function() {
        deleteTrainer(TrainerID);
    });
}

// Function to delete a trainer
async function deleteTrainer(TrainerID) {
    const trainerRef = doc(db, 'TrainerForm', TrainerID);

    try {
        await deleteDoc(trainerRef);
        displayMessage(`Trainer with ID ${TrainerID} was successfully removed.`, 'success');
        fetchTrainerData(); // Refresh the trainer data
    } catch (error) {
        displayMessage('Failed to delete the trainer. Please try again later.', 'error');
        console.error('Error deleting trainer:', error);
    }
}

// Function to display modal with image
window.openModal = function(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');

    modal.style.display = "block";
    modalImg.src = imageSrc;

    const span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    }
}

// Function to search for a trainer by ID
window.searchTrainer = async function() {
    const searchId = document.getElementById('trainer').value.trim(); // Get the search input value

    // Check if the searchId is not empty
    if (!searchId) {
        document.getElementById('trainerInfoBody').innerHTML = 'Please enter a Trainer ID.';
        return;
    }

    const trainerRef = collection(db, 'TrainerForm');
    const q = query(trainerRef, where("TrainerID", "==", searchId)); // Query Firestore

    console.log(`Searching for TrainerId: ${searchId}`); // Log the search ID

    try {
        const snapshot = await getDocs(q);
        console.log(`Found ${snapshot.size} trainer(s)`); // Log how many trainers were found

        const trainerInfoBody = document.getElementById('trainerInfoBody');
        trainerInfoBody.innerHTML = ''; // Clear previous results

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const trainerData = doc.data();
                console.log(`Found trainer data:`, trainerData); // Log the found trainer data
                displayTrainerData(trainerData, doc.id); // Display the trainer data
            });
        } else {
            console.log('Trainer not found, updating message.');
            trainerInfoBody.innerHTML = 'Trainer not found.'; // Update message if not found
        }
    } catch (error) {
        console.error('Error fetching trainer data:', error);
        document.getElementById('trainerInfoBody').innerHTML = 'Error fetching trainer data.';
    }
};


// Function to display trainer data
async function displayTrainerData(trainerData, TrainerID) {
    const trainerInfoBody = document.getElementById('trainerInfoBody');
    trainerInfoBody.innerHTML = '';  // Clear previous search results

    // Fetch the Trainer ID from the Roles collection
    const rolesDocRef = doc(db, 'Roles', 'Trainer');
    const rolesDoc = await getDoc(rolesDocRef);

    let trainerIdFromRoles = 'N/A'; // Default value if no Trainer ID is found
    if (rolesDoc.exists()) {
        trainerIdFromRoles = rolesDoc.data().TrainerID; // Adjust the field name if necessary
    }

    let row = `
        <tr>
            <td><input type="checkbox" class="rowCheckbox" data-id="${TrainerID}"></td>
            <td>${trainerData.TrainerID || 'N/A'}</td> <!-- Display Trainer ID from the document -->
            <td>${trainerIdFromRoles}</td>
            <td>
                <img src="${trainerData.TrainerPhoto || 'default-image.jpg'}" 
                    alt="Trainer Photo" 
                    class="trainer-photo zoomable"
                    onclick="openModal('${trainerData.TrainerPhoto || 'default-image.jpg'}')" />
            </td>
            <td>${trainerData.TrainerName || 'N/A'}</td>
            <td>${trainerData.Experience || 'N/A'}</td>
            <td>${trainerData.Expertise || 'N/A'}</td>
            <td>${trainerData.Days || 'N/A'}</td>
            <td>
                <img src="${trainerData.TrainerPermit || 'default-permit.jpg'}" 
                    alt="Trainer Permit" 
                    class="trainer-photo zoomable"
                    onclick="openModal('${trainerData.TrainerPermit || 'default-permit.jpg'}')" />
            </td>
            <td>${trainerData.status || 'Under Review'}</td>
            <td class="button-container">
                <button class="status-button approved" onclick="updateTrainerStatus('${TrainerID}', 'Approved')">Approve</button>
                <button class="status-button idle" onclick="updateTrainerStatus('${TrainerID}', 'Idle')">Idle</button>
                <button class="status-button blocked" onclick="updateTrainerStatus('${TrainerID}', 'Blocked')">Block</button>
            </td>
        </tr>
    `;

    trainerInfoBody.innerHTML = row;
}
