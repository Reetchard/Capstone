import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

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
    const usersRef = collection(db, 'Users');

    // Fetch gym owners from Users collection
    const usersSnapshot = await getDocs(usersRef);
    gymListBody.innerHTML = ''; // Clear previous data

    // Loop through the Users documents
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();

        // Only process users with the 'gymowner' role
        if (userData.role === 'gymowner') {
            const gymId = userData.userId || 'N/A'; // Assuming you have a gymId in user data

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="select-gym" data-key="${userDoc.id}" data-gym-name="${userData.gymName}"></td>
                <td>${gymId}</td>
                <td>${userData.gymName}</td>
                <td><a href="#" onclick="openModal('${userData.gymPhoto}')"><img src="${userData.gymPhoto}" alt="Gym Photo" style="max-width: 100px;"></a></td>
                <td><a href="#" onclick="openModal('${userData.gymCertifications}')"><img src="${userData.gymCertifications}" alt="Certification Image" style="max-width: 100px;"></a></td>
                <td>${userData.gymEquipment}</td>
                <td>${userData.gymContact}</td>
                <td>${userData.gymPrograms}</td>
                <td>${userData.gymOpeningTime}</td>
                <td>${userData.gymClosingTime}</td>
                <td>${userData.gymLocation}</td>
                <td>${userData.status}</td>
                <td>
                    <button class="btn btn-success btn-sm mx-1" onclick="updateStatus('approved', '${userDoc.id}')">Approve</button>
                    <button class="btn btn-secondary btn-sm mx-1" onclick="updateStatus('idle', '${userDoc.id}')">Idle</button>
                    <button class="btn btn-warning btn-sm mx-1" onclick="updateStatus('blocked', '${userDoc.id}')">Block</button>
                </td>
            `;
            gymListBody.appendChild(row);
        }
    }
}
// Load gym profiles when the page loads
window.onload = loadGymProfiles;

// Display messages with SweetAlert
window.displayMessages = function(message, type) {
    if (type === 'success') {
        Swal.fire({
            title: 'Success!',
            text: message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    } else if (type === 'error') {
        Swal.fire({
            title: 'Error!',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
};

// Delete selected gym profiles
window.deleteSelected = async function() {
    const selectedCheckboxes = document.querySelectorAll('.select-gym:checked');
    if (selectedCheckboxes.length === 0) {
        displayMessages('You need to select at least one gym profile to delete.', 'error');
        return;
    }

    // Display confirmation dialog with SweetAlert
    displayConfirmation('Are you sure you want to delete the selected profiles?', async () => {
        for (const checkbox of selectedCheckboxes) {
            const key = checkbox.getAttribute('data-key');
            const gymName = checkbox.getAttribute('data-gym-name'); // Fetch gym name
            const gymRef = doc(db, 'Users', key);
            await deleteDoc(gymRef)
                .then(() => {
                    displayMessages(`Profile for ${gymName} has been deleted.`, 'success'); // Display gym name
                })
                .catch(() => {
                    displayMessages(`Error deleting profile for ${gymName}.`, 'error');
                });
        }
        loadGymProfiles(); // Reload profiles after deletion
    });
};

// Confirmation dialog with SweetAlert
function displayConfirmation(message, callback) {
    Swal.fire({
        title: 'Are you sure?',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel!',
    }).then((result) => {
        if (result.isConfirmed) {
            callback(); // Call the provided callback function if confirmed
        }
    });
}

// Function to open the modal and display the image
window.openModal = function(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');

    if (modal && modalImg) { // Check if modal and modalImg exist
        modal.style.display = "block";
        modalImg.src = imageSrc;

        // Close the modal when the user clicks on <span> (x)
        const span = document.getElementsByClassName("close")[0];
        if (span) { // Check if span exists
            span.onclick = function() {
                modal.style.display = "none";
            }
        }
    } else {
        console.error("Modal or modal image element not found!");
    }
}

// Function to update status of a gym
window.updateStatus = async function(status, key) {
    const userRef = doc(db, 'Users', key);
    const checkbox = document.querySelector(`.select-gym[data-key="${key}"]`);
    const gymName = checkbox ? checkbox.getAttribute('data-gym-name') : 'Unknown Gym'; // Fetch gym name

    // Show spinner while updating status
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'block'; // Show the spinner

    await updateDoc(userRef, { status: status })
        .then(() => {
            // Use a timer to show the spinner for 1.5 seconds before showing SweetAlert
            setTimeout(() => {
                spinner.style.display = 'none'; // Hide the spinner

                // Display message based on the status
                let message = '';
                switch (status) {
                    case 'approved':
                        message = `Successfully approved ${gymName}.`;
                        break;
                    case 'blocked':
                        message = `Successfully blocked ${gymName}.`;
                        break;
                    case 'idle':
                        message = `Successfully set ${gymName} to idle.`;
                        break;
                    default:
                        message = 'Status updated.';
                }

                // Show SweetAlert
                Swal.fire({
                    title: 'Success!',
                    text: message,
                    icon: 'success',
                    confirmButtonText: 'OK'
                });

                loadGymProfiles(); // Reload profiles after update
            }, 1500); // Delay for 1.5 seconds
        })
        .catch(() => {
            spinner.style.display = 'none'; // Hide the spinner in case of error
            Swal.fire({
                title: 'Error!',
                text: 'Error updating status. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
};