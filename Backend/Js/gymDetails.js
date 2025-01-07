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
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(db, 'GymOwner', userId); // Fetch user doc from Firestore

            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data(); // Get user data
                    const username = userData.username || 'User'; // Username with fallback

                    // Display profile picture and username
                    displayProfilePicture(user, username); // Pass the user object and username

                } else {
                    console.error("User document does not exist.");
                    window.location.href = 'login.html'; // Redirect to login if no user document found
                }
            } catch (error) {
                console.error("Error fetching user data:", error); // Error handling
            }
        } else {
            window.location.href = 'login.html'; // Redirect if user is not authenticated
        }
    });
});

async function loadGymProfiles() {
    const gymListBody = document.getElementById('gymList'); // Table body for displaying gym profiles
    const gymOwnerRef = collection(db, 'GymOwner'); // Reference to GymOwner collection

    try {
        // Fetch all documents from the GymOwner collection
        const gymOwnersSnapshot = await getDocs(gymOwnerRef);
        gymListBody.innerHTML = ''; // Clear previous data

        // Loop through the documents in GymOwner collection
        for (const gymDoc of gymOwnersSnapshot.docs) {
            const gymData = gymDoc.data();

            const gymId = gymData.userId || 'N/A'; // Fallback if gymId is missing
            const gymName = gymData.gymName || 'Unknown Gym'; // Fallback for missing gymName

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="select-gym" data-key="${gymDoc.id}" data-gym-name="${gymName}"></td>
                <td>${gymId}</td>
                <td>${gymName}</td>
                <td><a href="#" onclick="openModal('${gymData.gymPhoto || ''}')"><img src="${gymData.gymPhoto || 'placeholder.jpg'}" alt="Gym Photo" style="max-width: 100px;"></a></td>
                <td><a href="#" onclick="openModal('${gymData.gymCertifications || ''}')"><img src="${gymData.gymCertifications || 'placeholder.jpg'}" alt="Certification Image" style="max-width: 100px;"></a></td>
                <td>${gymData.gymEquipment || 'N/A'}</td>
                <td>${gymData.gymContact || 'N/A'}</td>
                <td>${gymData.gymPrograms || 'N/A'}</td>
                <td>${gymData.gymOpeningTime || 'N/A'}</td>
                <td>${gymData.gymClosingTime || 'N/A'}</td>
                <td>${gymData.gymLocation || 'N/A'}</td>
                <td>${gymData.status || 'N/A'}</td>
                <td>
                    <button class="btn btn-success btn-sm mx-1" onclick="updateStatus('Approved', '${gymDoc.id}')">Accept</button>
                    <button class="btn btn-warning btn-sm mx-1" onclick="updateStatus('Decline', '${gymDoc.id}')">Decline</button>
                </td>
            `;
            gymListBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading gym profiles:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Failed to load gym profiles. Please try again later.',
            icon: 'error',
            confirmButtonText: 'Okay'
        });
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
            const gymRef = doc(db, 'GymOwner', key);
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
    const userRef = doc(db, 'GymOwner', key);
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
                    case 'Approved':
                        message = `Successfully approved ${gymName}.`;
                        break;
                    case 'Decline':
                        message = `Successfully blocked ${gymName}.`;
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
window. toggleDropdown =function() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
    } else {
        dropdownMenu.style.display = 'block';
    }
}

// Close the dropdown if clicked outside
window.addEventListener('click', function (e) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    const profileUsername = document.getElementById('profile-username');

    if (!profileUsername.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
    }
});
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