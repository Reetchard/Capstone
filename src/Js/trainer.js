import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, query, updateDoc, deleteDoc, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged  } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js"; // Import Auth

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

const auth = getAuth(app); // Initialize Firebase Auth

// Function to fetch Gym Owner's username (or GymName) from Firestore
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, fetch the Gym Owner's GymName
        const gymOwnerGymName = await fetchGymOwnerGymName();
        
        if (gymOwnerGymName) {
            // If gym owner GymName is fetched, load the trainer data
            await fetchTrainerData(gymOwnerGymName);
        } else {
            console.error("Error fetching Gym Owner's GymName.");
        }
    } else {
        // No user is signed in
        console.error("No authenticated user found. Please sign in.");
    }
});
async function fetchGymOwnerGymName() {
    const user = auth.currentUser;

    if (user) {
        const userId = user.uid;
        const userDocRef = doc(db, 'Users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            return userData.gymName || userData.GymName; // Ensure this is the correct field for the GymName
        } else {
            console.error('Gym Owner document not found');
            return null;
        }
    } else {
        console.error('No authenticated user found');
        return null;
    }
}
async function fetchTrainerData(gymOwnerGymName) {
    try {
        console.log("Gym Owner's GymName:", gymOwnerGymName); // Debug: Log the gym owner's GymName

        // Reference to the 'Users' collection in Firestore
        const usersRef = collection(db, 'Users');
        const q = query(usersRef, where('role', '==', 'trainer')); // Query only users with role 'trainer'

        // Fetch trainers from Firestore
        const snapshot = await getDocs(q);
        const trainerInfoBody = document.getElementById('trainerInfoBody');
        trainerInfoBody.innerHTML = ''; // Clear existing content

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const user = doc.data();
                const trainerGymName = user.GymName || user.gymName || 'N/A'; // Ensure correct field for gym name

                // Debugging: Log the trainer data being evaluated
                console.log(`Evaluating Trainer: ${user.TrainerName || 'N/A'} (GymName: ${trainerGymName})`);

                // Check if the GymName of the trainer matches the gym owner's GymName
                if (trainerGymName === gymOwnerGymName) {
                    console.log(`Trainer ${user.TrainerName} matches Gym Owner's GymName: ${gymOwnerGymName}`); // Debugging

                    const TrainerID = user.userId || 'N/A'; // Access TrainerID from user data
                    const TrainerPhoto = user.TrainerPhoto || 'default-image.jpg'; // Get trainer photo or fallback

                    // Create table row for the trainer
                    let row = `
                        <tr>
                            <td><input type="checkbox" class="rowCheckbox" data-id="${doc.id}"></td>
                            <td>${TrainerID}</td>
                            <td>
                                <img src="${TrainerPhoto}" 
                                    alt="Trainer Photo" 
                                    class="trainer-photo zoomable"
                                    onclick="openModal('${TrainerPhoto}', 'photo')" />
                            </td>
                            <td>${user.TrainerName || 'N/A'}</td>
                            <td>${user.Experience || 'N/A'}</td>
                            <td>${user.Expertise || 'N/A'}</td>
                            <td>${user.Days || 'N/A'}</td>
                            <td>
                                <a href="#" onclick="openModal('${user.TrainerApplication || '#'}', '${getFileType(user.TrainerApplication)}')">
                                    ${user.TrainerApplication ? 'View Application' : 'No Application'}
                                </a>
                            </td>
                            <td>
                                <a href="#" onclick="openModal('${user.Resume || '#'}', '${getFileType(user.Resume)}')">
                                    ${user.Resume ? 'View Resume' : 'No Resume'}
                                </a>
                            </td>
                            <td>${user.status || 'Under Review'}</td>
                            <td class="button-container">
                                <button class="status-button approved" onclick="updateTrainerStatus('${doc.id}', 'Approved')">Approve</button>
                                <button class="status-button idle" onclick="updateTrainerStatus('${doc.id}', 'Idle')">Idle</button>
                                <button class="status-button blocked" onclick="updateTrainerStatus('${doc.id}', 'Blocked')">Block</button>
                            </td>
                        </tr>
                    `;
                    trainerInfoBody.innerHTML += row; // Append row to the table body
                }
            });

            // Add select all functionality for checkboxes
            const selectAllCheckbox = document.getElementById('selectAllHeader');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', function() {
                    const checkboxes = document.querySelectorAll('input.rowCheckbox');
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = selectAllCheckbox.checked;
                    });
                });
            }
        } else {
            trainerInfoBody.innerHTML = '<tr><td colspan="10" class="text-center">No trainers found</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching trainer data:', error);
    }
}



// Function to get the file type (image or pdf)
function getFileType(fileUrl) {
    if (!fileUrl) return 'none';
    const extension = fileUrl.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
        return 'image';
    } else if (extension === 'pdf') {
        return 'pdf';
    }
    return 'unknown';
}

// Modal logic to display the photo or PDF
window.openModal = function(fileUrl, fileType) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalPDFLink = document.getElementById('modalPDFLink');
    const modalPDFIcon = document.getElementById('modalPDFIcon');

    if (fileType === 'image') {
        // Show image in modal
        modalImg.style.display = 'block';
        modalPDFLink.style.display = 'none';
        modalPDFIcon.style.display = 'none';
        modalImg.src = fileUrl; // Set the image source

    } else if (fileType === 'pdf') {
        // Show PDF link in modal
        modalImg.style.display = 'none';
        modalPDFLink.style.display = 'block';
        modalPDFIcon.style.display = 'block';
        modalPDFLink.href = fileUrl; // Set the PDF download link

    } else {
        modalImg.style.display = 'none';
        modalPDFLink.style.display = 'none';
        modalPDFIcon.style.display = 'none';
    }

    modal.style.display = "block";

    // Close the modal when the close button is clicked
    const span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    };

    // Close the modal when clicked outside of the content
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
};

// Initial call to fetch and display trainer data
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
    const trainerRef = doc(db, 'Users', key); // Updated to Users collection
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
function confirmDelete(userId) {
    showConfirmationModal('Are you sure you want to delete this trainer?', function() {
        deleteTrainer(userId);
    });
}

// Function to delete a trainer
async function deleteTrainer(userId) {
    const trainerRef = doc(db, 'Users', userId); // Updated to Users collection

    try {
        await deleteDoc(trainerRef);
        displayMessage(`Trainer with ID ${userId} was successfully removed.`, 'success');
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

    const usersRef = collection(db, 'Users'); // Update to Users collection
    const q = query(usersRef, where("TrainerID", "==", searchId)); // Query Firestore

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

    let row = `
        <tr>
            <td><input type="checkbox" class="rowCheckbox" data-id="${TrainerID}"></td>
            <td>${trainerData.TrainerID || 'N/A'}</td> <!-- Display Trainer ID from the document -->
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
