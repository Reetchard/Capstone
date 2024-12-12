import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, query, where,updateDoc  } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const trainerGallery = document.getElementById('trainerGallery');
const detailsModal = document.getElementById('detailsModal');
const modalTrainerName = document.getElementById('modalTrainerName');
const modalTrainerPhoto = document.getElementById('modalTrainerPhoto');
const modalExperience = document.getElementById('modalExperience');
const modalExpertise = document.getElementById('modalExpertise');
const modalDaysAvailable = document.getElementById('modalDaysAvailable');
const modalApplicationLink = document.getElementById('modalApplicationLink');
const modalResumeLink = document.getElementById('modalResumeLink');
const modalStatus = document.getElementById('modalStatus');

// Fetch Gym Owner's GymName
async function fetchGymOwnerGymName() {
    const user = auth.currentUser;

    if (user) {
        const gymOwnerDocRef = doc(db, 'GymOwner', user.uid);
        const gymOwnerDocSnap = await getDoc(gymOwnerDocRef);

        if (gymOwnerDocSnap.exists()) {
            return gymOwnerDocSnap.data().gymName || gymOwnerDocSnap.data().GymName;
        }
    }
    return null;
}

// Fetch Trainers and Render the Gallery
async function fetchTrainerData(gymOwnerGymName) {
    try {
        const trainersRef = collection(db, 'Trainer');
        const q = query(trainersRef, where('role', '==', 'trainer'));
        const snapshot = await getDocs(q);

        trainerGallery.innerHTML = ''; // Clear existing trainers
        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const trainer = doc.data();

                // Only display trainers that match the Gym Owner's GymName
                if ((trainer.GymName || trainer.gymName) === gymOwnerGymName) {
                    renderTrainerCard(trainer, doc.id);
                }
            });
        } else {
            trainerGallery.innerHTML = '<p class="text-center text-white">No trainers found.</p>';
        }
    } catch (error) {
        console.error('Error fetching trainers:', error);
        trainerGallery.innerHTML = '<p class="text-center text-white">Error fetching trainers. Please try again later.</p>';
    }
}

function renderTrainerCard(trainer, trainerId) {
    const trainerCard = document.createElement('div');
    trainerCard.className = 'card m-2 position-relative';
    trainerCard.style.width = '200px';

    trainerCard.innerHTML = `
        <div class="status-badge position-absolute top-0 end-0 m-2 badge ${
            trainer.status === 'Approved' ? 'badge-success' : trainer.status === 'Not Qualified' ? 'badge-danger' : 'badge-secondary'
        }">
            ${trainer.status || 'Pending'}
        </div>
        <img src="${trainer.TrainerPhoto || 'default-image.jpg'}" class="card-img-top rounded-circle border border-success" alt="Trainer Photo">
        <div class="card-body text-center">
            <a href="#" class="text-white font-weight-bold trainer-name">${trainer.username || 'N/A'}</a>
            <div class="mt-3">
                <!-- Toggle Switch -->
                <label class="toggle-switch">
                    <input type="checkbox" ${trainer.status === 'Approved' ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
    `;

    // Add event listener for the trainer name to show trainer details in a modal
    const trainerNameLink = trainerCard.querySelector('.trainer-name');
    trainerNameLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        showTrainerDetails(trainerId); // Call the function to show details
    });

    // Add event listener to the toggle switch
    const toggleSwitch = trainerCard.querySelector('.toggle-switch input');
    toggleSwitch.addEventListener('change', () => {
        const newStatus = toggleSwitch.checked ? 'Approved' : 'Not Qualified';
        updateTrainerStatus(trainerId, newStatus, trainerCard);
    });

    trainerGallery.appendChild(trainerCard);
}


// Show the spinner
function showSpinner() {
    const spinner = document.getElementById('globalSpinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

// Hide the spinner
function hideSpinner() {
    const spinner = document.getElementById('globalSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

window.showTrainerDetails = async function (trainerId) {
    const trainerDocRef = doc(db, 'Trainer', trainerId);
    const trainerDocSnap = await getDoc(trainerDocRef);

    if (trainerDocSnap.exists()) {
        const trainer = trainerDocSnap.data();

        // Capitalize the first letter of each part of the name
        const capitalizeName = (name) =>
            name
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

        // Populate modal with trainer information
        modalTrainerName.textContent = capitalizeName(trainer.username || 'N/A');
        modalTrainerPhoto.src = trainer.TrainerPhoto || 'default-image.jpg';
        modalExperience.textContent = trainer.Experience || 'N/A';
        modalExpertise.textContent = trainer.Expertise || 'N/A';
        modalDaysAvailable.textContent = trainer.Days || 'N/A';

        modalApplicationLink.href = '#'; // Prevent default link behavior
        modalApplicationLink.textContent = trainer.TrainerApplication
            ? 'View Application'
            : 'No Application';

        modalResumeLink.href = '#'; // Prevent default link behavior
        modalResumeLink.textContent = trainer.Resume ? 'View Resume' : 'No Resume';

        modalStatus.textContent = trainer.status || 'Under Review';
        modalStatus.className = `badge fs-6 px-3 py-2 mt-2 ${
            trainer.status === 'Approved'
                ? 'bg-success'
                : trainer.status === 'Not Qualified'
                ? 'bg-danger'
                : 'bg-secondary'
        }`;

        // Add click events to open the second modal
        modalApplicationLink.addEventListener('click', (e) => {
            e.preventDefault();
            openDocumentModal(trainer.TrainerApplication, 'Application');
        });

        modalResumeLink.addEventListener('click', (e) => {
            e.preventDefault();
            openDocumentModal(trainer.Resume, 'Resume');
        });

        // Show the main modal
        const modalInstance = new bootstrap.Modal(detailsModal);
        modalInstance.show();
    } else {
        console.error('Trainer document does not exist.');
        Swal.fire({
            title: 'Error',
            text: 'Trainer information not found.',
            icon: 'error',
            confirmButtonText: 'OK',
        });
    }
};





// Close Trainer Details Modal
window.closeDetailsModal = function () {
    detailsModal.style.display = 'none';
};

// Fetch Data on Auth State Change
onAuthStateChanged(auth, async user => {
    if (user) {
        const gymOwnerGymName = await fetchGymOwnerGymName();
        if (gymOwnerGymName) {
            fetchTrainerData(gymOwnerGymName);
        } else {
            trainerGallery.innerHTML = '<p class="text-center text-white">Gym Owner information not found.</p>';
        }
    } else {
        trainerGallery.innerHTML = '<p class="text-center text-white">Please log in to view trainers.</p>';
    }
});
window.updateTrainerStatus = async function (trainerId, newStatus, trainerCard) {
    const trainerDocRef = doc(db, 'Trainer', trainerId);

    try {
        // Show the spinner
        showSpinner();

        // Update the trainer's status in Firestore
        await updateDoc(trainerDocRef, { status: newStatus });

        // Update the badge text and style in the UI
        const statusBadge = trainerCard.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = newStatus;
            statusBadge.className = `status-badge position-absolute top-0 end-0 m-2 badge ${
                newStatus === 'Approved' ? 'badge-success' : newStatus === 'Not Qualified' ? 'badge-danger' : 'badge-secondary'
            }`;
        }

        // Show success feedback
        await Swal.fire({
            title: 'Success',
            text: `Trainer's status has been updated to "${newStatus}".`,
            icon: 'success',
            confirmButtonText: 'OK',
        });
    } catch (error) {
        console.error('Error updating trainer status:', error);

        // Show error feedback
        await Swal.fire({
            title: 'Error',
            text: 'Failed to update trainer status. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
        });
    } finally {
        // Hide the spinner
        hideSpinner();
    }
};

