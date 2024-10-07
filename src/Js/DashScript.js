import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'; 
import { getStorage, ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

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
const storage = getStorage(app);

// Check user authentication and role
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userId = user.uid;
        const userDocRef = doc(db, 'Users', userId);
        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role || 'user';
                const email = user.email;

                createDropdownMenu(email, role);
                displayProfilePicture(user);
            } else {
                console.warn("User document does not exist. Redirecting to login.");
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        console.warn("No user is authenticated. Redirecting to login.");
        window.location.href = 'login.html';
    }
});

// Function to create dropdown menu based on user role and email
function createDropdownMenu(username, role) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.innerHTML = `<a class="dropdown-item" href="#">Hello, ${username}</a>`; 
        if (role === 'gym_owner') {
            dropdownMenu.innerHTML += '<a class="dropdown-item" href="gym-profiling.html">Gym Owner Management</a>';
        } else {
            dropdownMenu.innerHTML += '<a class="dropdown-item" href="Pinfo.html">Personal Information</a>';
            dropdownMenu.innerHTML += '<a class="dropdown-item" href="report.html">Submit a Complaint</a>';
        }
        dropdownMenu.innerHTML += '<a class="dropdown-item" href="#" id="logout">Log Out</a>';

        const logoutButton = document.getElementById('logout');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                signOut(auth).then(() => {
                    window.location.href = 'login.html';
                }).catch((error) => {
                    console.error("Sign Out Error:", error.code, error.message);
                });
            });
        }
    } else {
        console.error('Dropdown menu not found');
    }
}

// Function to display user profile picture
function displayProfilePicture(user) {
    const userId = user.uid;
    const profilePicRef = ref(storage, `profilePictures/${userId}/profile.jpg`);

    getDownloadURL(profilePicRef)
        .then((url) => {
            const profilePicture = document.getElementById('profile-picture');
            profilePicture.src = url;
        })
        .catch((error) => {
            console.error("Error loading profile picture:", error.message);
            const profilePicture = document.getElementById('profile-picture');
            profilePicture.src = 'framework/img/Profile.png'; // Default picture
        });
}

            // Fetch Membership Plans
        async function fetchMembershipPlans(gymId) {
            const plansCollection = collection(db, 'MembershipPlans');
            const plansSnapshot = await getDocs(plansCollection);
            const plansList = plansSnapshot.docs.map(doc => doc.data());
        
            const membershipPlansContainer = document.getElementById('membershipPlansContent');
            membershipPlansContainer.innerHTML = '';
        
            plansList.forEach(plan => {
                if (plan.gymId === gymId) { // Match gym ID
                    const planDiv = document.createElement('div');
                    planDiv.innerHTML = `
                        <h4>${plan.planName}</h4>
                        <p>${plan.description}</p>
                        <p>Price: ${plan.price}</p>
                    `;
                    membershipPlansContainer.appendChild(planDiv);
                }
            });
        }
        window.viewMembershipPlans = async function (gymId) {
            const modal = document.getElementById('membershipPlansModal');
            modal.style.display = 'block';
        
            const gymRef = doc(db, 'GymForms', gymId);
            const gymSnapshot = await getDoc(gymRef);
        
            if (gymSnapshot.exists()) {
                const gymData = gymSnapshot.data();
                const gymOwnerEmail = gymData.ownerEmail;
        
                const membershipPlans = await fetchMembershipPlans(gymId);
                console.log("Membership Plans:", membershipPlans); // Debugging line
        
                if (!membershipPlans || membershipPlans.length === 0) {
                    alert("No membership plans found for this gym.");
                    return;
                }
        
                if (membershipPlans.some(plan => plan.email === gymOwnerEmail)) {
                    alert("Email verified!");
                    displayMembershipPlans(membershipPlans);
                } else {
                    alert("Email does not match the gym owner's email.");
                }
            } else {
                console.error("Gym not found");
            }
        };
        
        
        function displayMembershipPlans(plans) {
            const plansContainer = document.getElementById('membershipPlansContent'); // Adjust to your modal's content area
            plansContainer.innerHTML = ''; // Clear existing content
        
            plans.forEach(plan => {
                plansContainer.innerHTML += `
                    <div class="membership-plan">
                        <h4>${plan.name}</h4>
                        <p>${plan.details}</p>
                    </div>
                `;
            });
        }
        // Fetch Trainers
        async function fetchTrainers() {
            const trainersCollection = collection(db, 'TrainerForm');
            const trainerSnapshot = await getDocs(trainersCollection);
            const trainerList = trainerSnapshot.docs.map(doc => doc.data());
        
            console.log("Fetched Trainers:", trainerList); // Debugging line
        
            const trainerProfilesContainer = document.getElementById('trainer-profiles');
            trainerProfilesContainer.innerHTML = '';
        
            trainerList.forEach(trainer => {
                console.log("Trainer Data:", trainer); // Debugging line
        
                const trainerDiv = document.createElement('div');
                trainerDiv.classList.add('trainer-profile');
        
                trainerDiv.innerHTML = `
                    <img src="${trainer.TrainerPhoto || 'images/default-image-url.png'}" alt="${trainer.name || 'Trainer'}" class="trainer-photo" />
                    <h4>${trainer.TrainerName || 'N/A'}</h4>
                    <button class="btn btn-primary" onclick="viewTrainerDetails('${trainer.id}')">View</button>
                `;
        
                trainerProfilesContainer.appendChild(trainerDiv);
            });
        }

    // Fetch Gym Profiles
    async function fetchGymProfiles() {
        const gymsCollection = collection(db, 'GymForms');
        const gymSnapshot = await getDocs(gymsCollection);
        const gymList = gymSnapshot.docs.map(doc => doc.data());
    
        const gymProfilesContainer = document.getElementById('gym-profiles'); // Corrected the ID
        gymProfilesContainer.innerHTML = '';
    
        gymList.forEach(gym => {
            const gymDiv = document.createElement('div');
            gymDiv.classList.add('card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes
    
            gymDiv.innerHTML = `
                <img src="${gym.gymPhoto}" alt="${gym.name || 'Gym'}" class="card-img-top gym-photo" />
                <div class="card-body">
                    <h5 class="card-title">${gym.gymName || 'N/A'}</h5>
                    <button class="btn btn-primary" onclick="viewMore('${gym.id}')">View More</button>
                </div>
            `;
    
            gymProfilesContainer.appendChild(gymDiv);
        });
    }
    
    window.closeMembershipPlansModal = function() {
        document.getElementById('membershipPlansModal').style.display = 'none';
    };
     
    window.viewMore = async function(gymId) {
        // Fetch gym data from Firestore
        const gymDoc = await getDoc(doc(db, 'GymForms', gymId));
    
        // Check if the document exists
        if (!gymDoc.exists()) {
            console.error('No such document!');
            return; // Exit if the document doesn't exist
        }
    
        const gymData = gymDoc.data();
    
        // Populate the modal with gym data
        document.getElementById('modalGymName').textContent = gymData.gymName || 'N/A';
        document.getElementById('modalGymPhoto').src = gymData.gymPhoto || '';
        document.getElementById('modalGymLocation').textContent = gymData.gymLocation || 'N/A';
        document.getElementById('modalGymEquipment').textContent = gymData.gymEquipment || 'N/A';
        document.getElementById('modalGymPrograms').textContent = gymData.gymPrograms || 'N/A';
        document.getElementById('modalGymContact').textContent = gymData.gymContact || 'N/A';
        document.getElementById('modalGymOpeningTime').textContent = gymData.gymOpeningTime || 'N/A';
        document.getElementById('modalGymClosingTime').textContent = gymData.gymClosingTime || 'N/A'; // Corrected typo
    
        // Set up the map using Google Maps
        const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(gymData.gymLocation)}`;
        document.getElementById('modalGymMap').src = mapUrl;
    
        // Show the modal
        document.getElementById('gymProfileModal').style.display = 'block';
    }
    
    // Function to close the modal
    window.closeModal = function() {
        const modal = document.getElementById('gymProfileModal');
        modal.style.display = 'none'; // Hide the modal
    }
    
    // Close the modal when clicking outside of the modal content
    window.onclick = function(event) {
        const modal = document.getElementById('gymProfileModal');
        if (event.target === modal) {
            closeModal();
        }
    }
    

    // Initialize and Fetch Data
    document.addEventListener('DOMContentLoaded', () => {
        fetchTrainers();
        fetchMembershipPlans();
        fetchGymProfiles();
        viewMembershipPlans();
        closeMembershipPlansModal();
    });

    // Function to toggle chat visibility
    window.toggleChat = function() {
        const chatBox = document.getElementById("chatBox");
        chatBox.style.display = chatBox.style.display === "none" || chatBox.style.display === "" ? "block" : "none";
    };

    // Initialize chat box visibility
    document.addEventListener("DOMContentLoaded", () => {
        const chatBox = document.getElementById("chatBox");
        chatBox.style.display = "none"; // Hide chat box by default
    });

    // Example function to send a message
    window.sendMessage = function() {
        const messageInput = document.getElementById("messageInput");
        const messagesContainer = document.getElementById("messages");

        if (messageInput.value.trim()) {
            const messageElement = document.createElement("div");
            messageElement.textContent = messageInput.value;
            messagesContainer.appendChild(messageElement);
            messageInput.value = ""; // Clear input after sending
        }
    };
