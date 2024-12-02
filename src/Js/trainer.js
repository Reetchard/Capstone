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
document.getElementById('profile-picture').addEventListener('click', function(event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    event.stopPropagation();
    
    // If the dropdown is currently hidden, show it
    if (!dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('hide'); // Remove hide class if present
        dropdownMenu.classList.add('show'); // Show the dropdown
        
        // Also add a class for animating the profile picture
        this.classList.add('active'); // Optional for additional effect
    } else {
        dropdownMenu.classList.add('hide'); // Add hide class for smooth closing
        setTimeout(() => {
            dropdownMenu.classList.remove('show', 'hide'); // Remove show and hide after transition
        }, 300); // Match the duration with the CSS transition time
        
        // Optionally remove active class from profile picture
        this.classList.remove('active'); // Optional for additional effect
    }
});

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (!event.target.closest('.dropdown')) {
        dropdownMenu.classList.add('hide'); // Add hide class for smooth closing
        setTimeout(() => {
            dropdownMenu.classList.remove('show', 'hide'); // Remove show and hide after transition
        }, 300); // Match the duration with the CSS transition time
        
        // Optionally remove active class from profile picture
        document.getElementById('profile-picture').classList.remove('active'); // Optional for additional effect
    }
});
// Function to fetch Gym Owner's username (or GymName) from Firestore
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const gymOwnerGymName = await fetchGymOwnerGymName(); // Fetch gymName from GymOwner
            if (gymOwnerGymName) {
                await fetchTrainerData(gymOwnerGymName); // Fetch trainers with this gymName
            } else {
                console.error("Gym Owner's GymName not found. Please ensure your account is set up correctly.");
                document.getElementById('trainerInfoBody').innerHTML = 
                    '<tr><td colspan="10">Gym Owner information not found. Please contact support.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    } else {
        console.error('No authenticated user. Please sign in.');
    }
});


async function fetchGymOwnerGymName() {
    const user = auth.currentUser;

    if (user) {
        const userId = user.uid; // Get the authenticated user's UID
        console.log(`Fetching Gym Owner document for UID: ${userId}`); // Debug log

        const gymOwnerDocRef = doc(db, 'GymOwner', userId); // Reference to GymOwner collection
        const gymOwnerDocSnap = await getDoc(gymOwnerDocRef);

        if (gymOwnerDocSnap.exists()) {
            const gymOwnerData = gymOwnerDocSnap.data();
            console.log('Gym Owner document found:', gymOwnerData); // Debug log
            return gymOwnerData.gymName || gymOwnerData.GymName; // Return the gymName field
        } else {
            console.error(`Gym Owner document not found for UID: ${userId}`);
            return null;
        }
    } else {
        console.error('No authenticated user found');
        return null;
    }
}


async function fetchTrainerData(gymOwnerGymName) {
    try {
        console.log("Gym Owner's GymName:", gymOwnerGymName); // Log the gym owner's GymName

        // Reference the 'Trainer' collection in Firestore
        const usersRef = collection(db, 'Trainer');
        const q = query(usersRef, where('role', '==', 'trainer')); // Query for 'trainer' role

        // Fetch trainers from Firestore
        const snapshot = await getDocs(q);
        const trainerInfoBody = document.getElementById('trainerInfoBody');

        // Ensure trainerInfoBody exists
        if (!trainerInfoBody) {
            console.error("trainerInfoBody element not found in the DOM.");
            return;
        }

        trainerInfoBody.innerHTML = ''; // Clear existing content

        if (!snapshot.empty) {
            let trainerFound = false;

            snapshot.forEach((doc) => {
                const user = doc.data();
                console.log("Trainer data:", user); // Log each trainer's data

                const trainerGymName = user.GymName || user.gymName || 'N/A'; // Ensure correct field for GymName

                // Debugging: Check if the trainer's GymName matches the Gym Owner's
                console.log(
                    `Evaluating Trainer: ${user.TrainerName || 'N/A'} (Trainer GymName: ${trainerGymName})`
                );

                // Check if the GymName of the trainer matches the gym owner's GymName
                if (trainerGymName === gymOwnerGymName) {
                    trainerFound = true; // At least one trainer found
                    console.log(
                        `Trainer ${user.TrainerName} matches Gym Owner's GymName: ${gymOwnerGymName}`
                    );

                    const TrainerID = user.userId || 'N/A'; // Access TrainerID
                    const TrainerPhoto = user.TrainerPhoto || 'default-image.jpg'; // Fallback photo

                    // Create table row for the trainer
                    const row = `
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

            if (!trainerFound) {
                trainerInfoBody.innerHTML = '<tr><td colspan="10" class="text-center">No trainers match the Gym Owner\'s GymName</td></tr>';
            }
        } else {
            trainerInfoBody.innerHTML = '<tr><td colspan="10" class="text-center">No trainers found</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching trainer data:', error);
        const trainerInfoBody = document.getElementById('trainerInfoBody');
        if (trainerInfoBody) {
            trainerInfoBody.innerHTML = '<tr><td colspan="10" class="text-center">Error fetching trainer data</td></tr>';
        }
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
    const trainerRef = doc(db, 'Trainer', key); // Updated to Users collection
    const spinner = document.getElementById('spinner'); // Get spinner element

    try {
        // Show the spinner
        spinner.style.display = 'block';

        // Perform the update
        await updateDoc(trainerRef, { status: status });

        displayMessage(`Trainer status updated to ${status}.`, 'success');

        // Refresh the trainer data
        fetchTrainerData();
    } catch (error) {
        displayMessage('Failed to update trainer status. Try again later.', 'error');
        console.error('Error updating trainer status:', error);
    } finally {
        // Hide the spinner after operation is complete
        spinner.style.display = 'none';
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
    const trainerRef = doc(db, 'Trainer', userId); // Updated to Users collection

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

    const usersRef = collection(db, 'Trainer'); // Update to Users collection
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
async function displayTrainerData(trainerData, userId) {
    const trainerInfoBody = document.getElementById('trainerInfoBody');
    trainerInfoBody.innerHTML = '';  // Clear previous search results

    let row = `
        <tr>
            <td><input type="checkbox" class="rowCheckbox" data-id="${userId}"></td>
            <td>${trainerData.userId || 'N/A'}</td> <!-- Display Trainer ID from the document -->
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
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');

    // Toggle Sidebar Visibility on Mobile
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    // Close Sidebar When Clicking Outside on Mobile
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target) && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });
});