import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc,query,where } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'; 
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

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();

        // Get target section from data attribute
        const targetSection = this.getAttribute('data-target');

        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show the targeted section
        document.getElementById(targetSection).classList.add('active');
    });
});
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

// Ensure dropdown is initialized after the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const username = user.displayName || 'User'; // Adjust this as necessary
            const role = user.role || 'regular_user'; // Make sure to set this from your user data
            createDropdownMenu(username, role);
        } else {
            console.warn('User is not authenticated.');
            // Optionally, redirect to login or show appropriate message
            // window.location.href = 'login.html'; // Uncomment if you want to redirect unauthenticated users
        }
    });
});


    // Function to display user profile picture
    function displayProfilePicture(user) {
        const userId = user.uid;  // Assuming user.uid is available
        console.log("User ID:", userId); // Log User ID for verification
        const profilePicRef = ref(storage, `profilePictures/${userId}/profile.jpg`); // Ensure `ref` is defined

        getDownloadURL(profilePicRef)
            .then((url) => {
                const profilePicture = document.getElementById('profile-picture');
                profilePicture.src = url;
            })
            .catch((error) => {
                console.error("Error loading profile picture:", error.message);

                // Check if the error is because the file does not exist
                if (error.code === 'storage/object-not-found') {
                    const profilePicture = document.getElementById('profile-picture');
                    profilePicture.src = 'framework/img/Profile.png'; // Fallback default picture
                    console.warn("Profile picture does not exist, loading default image.");
                } else {
                    console.error('Unexpected error loading profile picture:', error.message);
                }
            });
    }


    window.uploadProfilePicture =async function (file) {
        const user = getAuth().currentUser;
        if (!user) {
            console.error('No authenticated user found.');
            return;
        }
        
        const profilePicRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);
        try {
            await uploadBytes(profilePicRef, file);
            console.log('Profile picture uploaded successfully.');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
        }
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
    // Function to show the Membership Plans modal
    window.viewMembershipPlans = async function (gymId) {
        const modal = document.getElementById('membershipPlansModal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.error('Membership Plans modal element not found.');
            return;
        }
    
        try {
            const gymRef = doc(db, 'Users', gymId);
            const gymSnapshot = await getDoc(gymRef);
    
            if (gymSnapshot.exists()) {
                const gymData = gymSnapshot.data();
                const gymOwnerEmail = gymData ? gymData.ownerEmail : null; // Ensure gymData exists
    
                // Fetch membership plans
                const membershipPlans = await fetchMembershipPlans(gymId);
                if (!membershipPlans || membershipPlans.length === 0) {
                    alert("No membership plans found for this gym.");
                    return;
                }
    
                // Check if the gym owner's email matches any in the plans
                if (gymOwnerEmail) {
                    // Only compare if gymOwnerEmail exists
                    const hasMatchingEmail = membershipPlans.some(plan => {
                        return plan.email && plan.email === gymOwnerEmail; // Check if plan.email exists
                    });
    
                    if (hasMatchingEmail) {
                        displayMembershipPlans(membershipPlans);
                    } else {
                        alert("Email does not match the gym owner's email.");
                    }
                } else {
                    alert("Gym owner's email is missing.");
                }
            } else {
                console.error("Gym not found.");
            }
        } catch (error) {
            console.error("Error fetching membership plans:", error);
        }
    };
                // Function to close the modal
        window.closeMembershipPlansModal = function() {
            const modal = document.getElementById('membershipPlansModal');
            if (modal) {
                modal.style.display = 'none';
            } else {
                console.error('Membership Plans modal element not found.');
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
        
                // Check if the trainer's status is not "Under Review"
                if (trainer.status && trainer.status !== 'Under Review') {
                    const trainerDiv = document.createElement('div');
                    trainerDiv.classList.add('trainer-profile');
        
                    trainerDiv.innerHTML = `
                        <img src="${trainer.TrainerPhoto || 'images/default-image-url.png'}" alt="${trainer.TrainerName || 'Trainer'}" class="trainer-photo" />
                        <h4>${trainer.TrainerName || 'N/A'}</h4>
                        <button class="btn btn-primary" onclick="viewTrainerDetails('${trainer.id}')">View</button>
                    `;
        
                    trainerProfilesContainer.appendChild(trainerDiv);
                }
            });
        }
        

         // Fetch Gym Profiles
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
                if (gym.status && gym.status !== 'Under Review') {
                    const gymDiv = document.createElement('div');
                    gymDiv.classList.add('card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes
        
                    gymDiv.innerHTML = `
                        <img src="${gym.gymPhoto || 'default-photo.jpg'}" alt="${gym.gymName || 'Gym'}" class="card-img-top gym-photo" />
                        <div class="card-body">
                            <h5 class="card-title">${gym.gymName || 'N/A'}</h5>
                            <button class="custom-button btn-primary" onclick="viewMore('${gym.id}')">View More</button>
                        </div>
                    `;
        
                    gymProfilesContainer.appendChild(gymDiv);
                }
            });
        }
        window.addEventListener('load', function() {
            fetchTrainers();
            fetchGymProfiles();
            fetchMembershipPlans();
        });



      window. viewMore = async function (gymId) {
        try {
            // Reference to the specific gym document using the gymId
            const gymDocRef = doc(db, 'Users', gymId); // Ensure you're using 'Users' collection
    
            // Fetch the gym document
            const gymDoc = await getDoc(gymDocRef);
    
            if (gymDoc.exists()) {
                const gymData = gymDoc.data(); // Access the document data
    
                // Populate your modal or section with the gym data
                // For example, if you're using a modal to show more details:
                document.getElementById('modalGymName').innerText = gymData.gymName || 'N/A';
                document.getElementById('modalGymPhoto').src = gymData.gymPhoto || 'default-photo.jpg';
                document.getElementById('modalGymLocation').innerText = gymData.gymLocation || 'N/A';
                document.getElementById('modalGymEquipment').innerText = gymData.gymEquipment || 'N/A';
                document.getElementById('modalGymPrograms').innerText = gymData.gymPrograms || 'N/A';
                document.getElementById('modalGymContact').innerText = gymData.gymContact || 'N/A';
                document.getElementById('modalGymOpeningTime').innerText = gymData.gymOpeningTime || 'N/A';
                document.getElementById('modalGymClosingTime').innerText = gymData.gymClosingTime || 'N/A';
    
                // Open the modal
                const modal = document.getElementById('gymProfileModal');
                modal.style.display = 'block'; // Show the modal
            } else {
                console.error('No such document!');
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        }
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
    // Ensure the membership modal is hidden on page load
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('membershipPlansModal');
        if (modal) {
            modal.style.display = 'none'; // Hide the modal initially
        }
    });

    window. closeMembershipPlansModal = function() {
        const modal = document.getElementById('membershipPlansModal');
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.error('Membership Plans modal element not found');
        }
    }
    
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

    window.loadGymMap = function(gym) {
        const location = gym.gymLocation;
    
        if (location.toLowerCase().includes("lapu-lapu")) {
            const lat = 10.3103;
            const lon = 123.9494;
    
            // Center the map on Lapu-Lapu
            const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`;
            document.getElementById('modalGymMap').src = mapSrc;
        } else {
            // Handle other locations by fetching coordinates from the API
            const apiKey = '3c52706688064b3038c2328bbbc4cba0'; // Replace with your OpenWeatherMap API key
            const geocodingUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}`;
    
            fetch(geocodingUrl)
                .then(response => response.json())
                .then(data => {
                    if (data && data.coord) {
                        const lat = data.coord.lat;
                        const lon = data.coord.lon;
    
                        // Set the map URL using OpenStreetMap
                        const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`;
                        document.getElementById('modalGymMap').src = mapSrc;
                    } else {
                        document.getElementById('modalGymMap').src = "";
                        alert("Unable to retrieve location data.");
                    }
                })
                .catch(error => {
                    console.error('Error fetching geocoding data:', error);
                    document.getElementById('modalGymMap').src = "";
                    alert("Failed to load location information.");
                });
        }
    }
    // Function to initialize and display the Leaflet map
    function initMap() {
        // Set the coordinates for Lapu-Lapu, Cebu as default
        const latLng = [10.3103, 123.9494];

        // Initialize the map
        const map = L.map('map').setView(latLng, 13); // 'map' is the id of your map div

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add a marker to the map at the Lapu-Lapu coordinates
        L.marker(latLng).addTo(map)
            .bindPopup('You are here - Lapu-Lapu, Cebu')
            .openPopup();
    }

    // Ensure the map initializes after the page loads
    window.onload = function() {
        // Initialize the map on page load
        initMap();
    };


    // Function to show the correct section
    document.querySelectorAll('.nav-link').forEach(navLink => {
        navLink.addEventListener('click', function(e) {
            e.preventDefault();
    
            const target = this.getAttribute('data-target');
            const section = document.getElementById(target);
    
            // Check if the section exists before modifying its classList
            if (section) {
                showSection(target);
            } else {
                console.error(`Section with ID '${target}' not found.`);
            }
        });
    });
    
    // Function to show the correct section
    function showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
    
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        } else {
            console.error(`Section with ID '${sectionId}' not found.`);
        }
    }
    document.addEventListener('DOMContentLoaded', function() {
        var calendarEl = document.getElementById('calendar');

        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            editable: true,
            events: []
        });

        calendar.render();
    }); 
    
    document.addEventListener('DOMContentLoaded', async function() {
        const notificationList = document.getElementById('notification-list');
    
        if (!notificationList) {
            console.error('Notification list element not found.');
            return; // Exit if the element is not found
        }
    
        // Clear the existing default message
        notificationList.innerHTML = '';
    
        // Fetch notifications from Firestore
        try {
            // Get the current user
            const user = auth.currentUser;
            if (!user) {
                console.error('User is not authenticated.');
                return; // Exit if the user is not authenticated
            }
    
            const userId = user.uid; // Get the current user's ID from Firebase Auth
    
            // Fetch notifications from Firestore
            const notifications = await fetchUserNotifications(userId);
    
            // Display sign-up notification if it exists
            const notificationMessage = localStorage.getItem('signupNotification');
            if (notificationMessage) {
                const newNotification = document.createElement('li');
                newNotification.textContent = notificationMessage;
                notificationList.appendChild(newNotification);
                localStorage.removeItem('signupNotification');
            }
    
            // Display user notifications
            if (notifications.length > 0) {
                notifications.forEach(notification => {
                    const notificationItem = document.createElement('li');
                    notificationItem.textContent = notification.message; // Adjust according to your notification structure
                    notificationList.appendChild(notificationItem);
                });
            } else {
                // If no user notifications, show the default message
                const noNotifications = document.createElement('li');
                noNotifications.textContent = 'No new notifications';
                notificationList.appendChild(noNotifications);
            }
    
        } catch (error) {
            console.error('Error fetching notifications:', error);
            const errorMessage = document.createElement('li');
            errorMessage.textContent = 'Error fetching notifications. Please try again later.';
            notificationList.appendChild(errorMessage);
        }
    });
    
    // Function to fetch user notifications from Firestore
    async function fetchUserNotifications(userId) {
        try {
            const notificationsRef = collection(db, 'userNotification');
            const q = query(notificationsRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            const notifications = [];
    
            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data() // Assuming you want all fields from the notification
                });
            });
    
            return notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    }
