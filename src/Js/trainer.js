import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getDatabase, ref, get, set, runTransaction, update, remove } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';

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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to fetch trainer data from Firebase Realtime Database
function fetchTrainerData() {
    const trainerRef = ref(database, 'TrainerForm');

    get(trainerRef).then((snapshot) => {
        const TrainerForm = snapshot.val();
        const trainerInfoBody = document.getElementById('trainerInfoBody');
        trainerInfoBody.innerHTML = '';  

        if (TrainerForm) {
            for (let TrainerFormId in TrainerForm) {
                const trainer = TrainerForm[TrainerFormId];

                let row = `
                    <tr>
                        <td><input type="checkbox" class="rowCheckbox" data-id="${TrainerFormId}"></td>
                        <td>${trainer.TrainerID || 'N/A'}</td>
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
                            <button class="status-button approved" onclick="updateTrainerStatus('${TrainerFormId}', 'Approved')">Approve</button>
                            <button class="status-button idle" onclick="updateTrainerStatus('${TrainerFormId}', 'Idle')">Idle</button>
                            <button class="status-button blocked" onclick="updateTrainerStatus('${TrainerFormId}', 'Blocked')">Block</button>
                        </td>
                    </tr>
                `;
                trainerInfoBody.innerHTML += row;
            }

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
    }).catch((error) => {
        displayMessage('Error fetching trainer data. Please try again later.', 'error');
        console.error('Error fetching trainer data:', error);
    });
}

fetchTrainerData();

// Function to delete selected trainers
window.deleteSelected = function() {
    const checkboxes = document.querySelectorAll('input.rowCheckbox:checked');
    if (checkboxes.length === 0) {
        displayMessage('No trainers selected for deletion.', 'warning');
    } else {
        checkboxes.forEach(checkbox => {
            const trainerId = checkbox.getAttribute('data-id');
            deleteTrainer(trainerId);
        });
    }
};

// Function to update trainer status
window.updateTrainerStatus = function(key, status) {
    const trainerRef = ref(database, 'TrainerForm/' + key);
    update(trainerRef, { status: status })
        .then(() => {
            displayMessage(`Trainer status updated to ${status}.`, 'success');
            fetchTrainerData();
        })
        .catch((error) => {
            displayMessage('Failed to update trainer status. Try again later.', 'error');
            console.error('Error updating trainer status:', error);
        });
};

// Function to display messages with transition
function displayMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;

    // Define message types and styles
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

    // Apply fade-out effect
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

    // Show the modal with a smooth fade-in and scale-up effect
    modal.classList.add('show');
    modal.classList.remove('hide');

    // When the user clicks on "Yes", call the onConfirm callback
    confirmButton.onclick = function() {
        onConfirm();
        modal.classList.remove('show');
        modal.classList.add('hide');
    };

    // When the user clicks on "No" or outside of the modal, hide it
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
function confirmDelete(trainerId) {
    showConfirmationModal('Are you sure you want to delete this trainer?', function() {
        deleteTrainer(trainerId);
    });
}

// Function to delete a trainer
function deleteTrainer(trainerId) {
    const trainerRef = ref(database, 'TrainerForm/' + trainerId);

    remove(trainerRef)
        .then(() => {
            displayMessage(`Trainer with ID ${trainerId} was successfully removed.`, 'success');
            fetchTrainerData(); // Refresh the trainer data
        })
        .catch((error) => {
            displayMessage('Failed to delete the trainer. Please try again later.', 'error');
            console.error('Error deleting trainer:', error);
        });
}

// Function to delete selected trainers with confirmation
window.deleteSelected = function() {
    const checkboxes = document.querySelectorAll('input.rowCheckbox:checked');
    if (checkboxes.length === 0) {
        displayMessage('No trainers selected for deletion.', 'warning');
    } else {
        checkboxes.forEach(checkbox => {
            const trainerId = checkbox.getAttribute('data-id');
            confirmDelete(trainerId);
        });
    }
};
// Function to display modal with image
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



// Function to search for a trainer by ID
window.searchTrainer = function() {
    const searchId = document.getElementById('searchId').value;
    const trainerRef = ref(database, 'TrainerForm/');

    get(trainerRef).then((snapshot) => {
        if (snapshot.exists()) {
            const trainers = snapshot.val();
            let found = false;

            // Iterate through trainers to find a match
            for (const key in trainers) {
                if (key === searchId) {
                    // Update the UI with the trainer data
                    displayTrainerData(trainers[key], key);
                    found = true;
                    break;
                }
            }

            if (!found) {
                displayMessage('Trainer not found.', 'warning');
                document.getElementById('trainerInfoBody').innerHTML = ''; // Clear previous results
            }
        } else {
            displayMessage('No trainers found.', 'warning');
            document.getElementById('trainerInfoBody').innerHTML = ''; // Clear previous results
        }
    }).catch((error) => {
        console.error('Error fetching trainer data:', error);
        displayMessage('Failed to fetch trainer data.', 'error');
    });
};

// Function to display trainer data
function displayTrainerData(trainerData, trainerId) {
    const trainerInfoBody = document.getElementById('trainerInfoBody');
    trainerInfoBody.innerHTML = '';  // Clear previous search results

    // Create a row with the trainer data including action buttons
    let row = `
        <tr>
            <td>${trainerId || 'N/A'}</td>
            <td>${trainerData.TrainerID || 'N/A'}</td>
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
                <button class="status-button approved" onclick="updateTrainerStatus('${trainerId}', 'Approved')">Approve</button>
                <button class="status-button idle" onclick="updateTrainerStatus('${trainerId}', 'Idle')">Idle</button>
                <button class="status-button blocked" onclick="updateTrainerStatus('${trainerId}', 'Blocked')">Block</button>
            </td>
        </tr>
    `;

    // Display the row in the table
    trainerInfoBody.innerHTML = row;
}


