import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getDatabase, ref, onValue, set ,get } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';


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
function openModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const captionText = document.getElementById('caption');

    modal.style.display = "block";
    modalImg.src = imageSrc;
    captionText.innerHTML = imageSrc;

    // Close the modal when the user clicks on <span> (x)
    const span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    }
}

// Load gym profiles when the page loads
window.onload = loadGymProfiles;



async function updateStatus(action, gymKey) {
    try {
        const gymRef = ref(database, 'GymForms/' + gymKey);
        const gymSnapshot = await get(gymRef);

        if (gymSnapshot.exists()) {
            let status;

            switch (action) {
                case 'approve':
                    status = 'Approved';
                    break;
                case 'idle':
                    status = 'Idle';
                    break;
                default:
                    throw new Error('Invalid action');
            }

            await set(gymRef, {
                ...gymSnapshot.val(), // Preserve existing data
                status: status
            });

            // Notify user of the action
            alert(`Gym profile ${status} successfully.`);
            location.reload(); // Reload to update the table
        } else {
            throw new Error('Gym profile not found');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Ensure that this function is called when the page is loaded and actions are added to the table
window.addEventListener('load', () => {
    // Initialize any event listeners or additional setup here if needed
});