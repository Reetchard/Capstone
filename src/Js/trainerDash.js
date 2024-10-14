import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, addDoc,getDoc,query,where,updateDoc,orderBy,onSnapshot} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'; 
import { getStorage, ref, getDownloadURL,uploadBytes  } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage();

document.addEventListener('DOMContentLoaded', () => {
    // Wait until the DOM is fully loaded before accessing elements
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(firestore, 'Users', userId); // Fetch user doc from Firestore

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

// Function to display user profile picture
function displayProfilePicture(user, username) {
    const userId = user.uid;
    const profilePicRef = storageRef(storage, `profilePictures/${userId}/profile.jpg`); // Path to user's profile picture

    getDownloadURL(profilePicRef).then((url) => {
        console.log("Profile picture URL fetched:", url); // Log for debugging

        // Select the DOM elements
        const headerPicture = document.getElementById('profile-picture-header');
        const headerUsername = document.getElementById('header-username');

        // Check if elements exist in the DOM
        if (headerPicture && headerUsername) {
            headerPicture.src = url; // Set the profile picture in the header
            headerUsername.textContent = username; // Set the username in the header
            console.log("Profile picture and username updated successfully");
        } else {
            console.error("One or more profile elements not found in the DOM.");
        }
    }).catch((error) => {
        console.error("Error fetching profile picture:", error);

        if (error.code === 'storage/object-not-found') {
            // If no profile picture is found, fallback to the default image
            document.getElementById('profile-picture-header').src = 'framework/img/Profile.png';
            document.getElementById('header-username').textContent = username; // Set the username anyway
            console.log("Default profile picture set, and username displayed.");
        } else {
            console.error("Unexpected error loading profile picture:", error.message);
        }
    });
}



async function fetchGymProfiles() {
    const gymsCollection = collection(db, 'Users');
    
    // Query to get only gym owners
    const gymOwnerQuery = query(gymsCollection, where('role', '==', 'gymowner'));
    
    const gymSnapshot = await getDocs(gymOwnerQuery);
    const gymList = gymSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() // Include the document data and its ID
    }));

    const gymProfilesContainer = document.getElementById('gym-profiles'); // Ensure correct ID
    gymProfilesContainer.innerHTML = '';

    gymList.forEach(gym => {
        // Check if the gym status is not "Under Review"
        if (gym.status && gym.status !== 'Under review') {
            const gymDiv = document.createElement('div');
            gymDiv.classList.add('card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes

            gymDiv.innerHTML = `
                <img src="${gym.gymPhoto || 'default-photo.jpg'}" alt="${gym.gymName || 'Gym'}" class="card-img-top gym-photo" />
                <div class="card-body">
                    <h5 class="card-title">${gym.gymName || 'N/A'}</h5>
                    <button class="custom-button btn-primary" onclick="viewMore('${gym.id}')">Gym Info</button>
                </div>
            `;

            gymProfilesContainer.appendChild(gymDiv);
        }
    });
}
    window.viewMore = async function (gymId) {
        try {
            const gymDocRef = doc(db, 'Users', gymId);
            const gymDoc = await getDoc(gymDocRef);

            if (gymDoc.exists()) {
                const gymData = gymDoc.data();

                // Ensure each element exists before setting innerText
                const modalGymName = document.getElementById('modalGymName');
                const modalGymPhoto = document.getElementById('modalGymPhoto');
                const modalGymLocation = document.getElementById('modalGymLocation');
                const modalGymEquipment = document.getElementById('modalGymEquipment');
                const modalGymPrograms = document.getElementById('modalGymPrograms');
                const modalGymContact = document.getElementById('modalGymContact');
                const modalPriceRate = document.getElementById('modalpriceRate');
                const modalGymOpeningTime = document.getElementById('modalGymOpeningTime');
                const modalGymClosingTime = document.getElementById('modalGymClosingTime');

                if (modalGymName) modalGymName.innerText = gymData.gymName || 'N/A';
                if (modalGymPhoto) modalGymPhoto.src = gymData.gymPhoto || 'default-photo.jpg';
                if (modalGymLocation) modalGymLocation.innerText = gymData.gymLocation || 'N/A';
                if (modalGymEquipment) modalGymEquipment.innerText = gymData.gymEquipment || 'N/A';
                if (modalGymPrograms) modalGymPrograms.innerText = gymData.gymPrograms || 'N/A';
                if (modalGymContact) modalGymContact.innerText = gymData.gymContact || 'N/A';
                if (modalPriceRate) modalPriceRate.innerText = gymData.gymPriceRate || 'N/A';
                if (modalGymOpeningTime) modalGymOpeningTime.innerText = gymData.gymOpeningTime || 'N/A';
                if (modalGymClosingTime) modalGymClosingTime.innerText = gymData.gymClosingTime || 'N/A';

                const modal = document.getElementById('gymProfileModal');
                modal.style.display = 'block'; // Show the modal
            } else {
                console.error('No such document!');
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        }
    }