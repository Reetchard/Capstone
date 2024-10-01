import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.x/firebase-firestore.js"; 
import { getStorage, ref as storageRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

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
const trainersRef = collection(db, "TrainerForm");
const membershipPlansRef = collection(db, "membershipPlans");
const gymProfileRef = collection(db, "GymForms");

    // Check user authentication and role
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(db, 'Accounts', userId); // Get reference to user document
            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const username = userData.username || 'User'; // Default to 'User' if no username is found
                    const role = userData.role || 'user'; // Default to 'user' if no role is found
                    createDropdownMenu(username, role);
                } else {
                    // Redirect to login if no user data is found
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            // Redirect to login if no user is authenticated
            window.location.href = 'login.html';
        }
    });

// Fetch and display profile picture
const profilePicture = document.getElementById('profile-picture');
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = user.uid;
        const profilePicRef = storageRef(storage, 'profilePictures/' + userId + '/profile.jpg');
        getDownloadURL(profilePicRef)
            .then((url) => {
                profilePicture.src = url; // Set profile picture
            })
            .catch((error) => {
                console.error("Error loading profile picture:", error);
                profilePicture.src = 'framework/img/Profile.png'; // Default picture if not available
            });
    } else {
        window.location.href = 'login.html'; // Redirect to login if user is not authenticated
    }
});

// Map Initialization
const map = L.map('map').setView([10.3095, 123.8914], 13); // Default coordinates

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to locate the gym on the map
async function locateGym(location) {
    try {
        const { lat, lon } = await geocodeAddress(location);
        if (lat && lon) {
            map.setView([lat, lon], 13);
            L.marker([lat, lon]).addTo(map).bindPopup(`Gym Location: ${location}`).openPopup();
            await MapData(lat, lon);
        } else {
            console.error('Unable to locate the gym.');
        }
    } catch (error) {
        console.error('Error locating the gym:', error);
    }
}

// Function to fetch weather data
async function MapData(lat, lon) {
    const apiKey = '3c52706688064b3038c2328bbbc4cba0'; // Replace with your OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error ${response.status}: ${errorData.message}`);
        }

        const data = await response.json();
        if (data.weather && data.weather.length > 0) {
            const weatherDescription = data.weather[0].description;
            const temperature = data.main.temp;

            const marker = L.marker([lat, lon]).addTo(map);
            marker.bindPopup(`
                <b>Weather:</b><br>
                ${weatherDescription}<br>
                Temperature: ${temperature}°C
            `).openPopup();
        } else {
            console.error('Weather data is missing or in an unexpected format:', data);
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

// Call the function with the coordinates for Lapu-Lapu City
MapData(10.3095, 123.8914); // Coordinates for Lapu-Lapu City

// Function to geocode address
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        } else {
            console.error('Address not found');
            return null;
        }
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
}

// Event listener for search button
document.getElementById('searchButton')?.addEventListener('click', async () => {
    const address = document.getElementById('searchBar').value;
    if (address) {
        try {
            const location = await geocodeAddress(address);
            if (location) {
                map.setView([location.lat, location.lon], 13); // Center map on the searched location
                L.marker([location.lat, location.lon]).addTo(map)
                    .bindPopup(`<b>${address}</b>`)
                    .openPopup();
                
                // Optionally fetch weather data for the searched location
                await MapData(location.lat, location.lon);
            }
        } catch (error) {
            console.error('Error during search:', error);
        }
    } else {
        console.warn('Search input is empty.');
    }
});

// Function to create dropdown menu based on user role
function createDropdownMenu(username, role) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.innerHTML = ''; // Clear previous content
        dropdownMenu.innerHTML += `<a class="dropdown-item" href="#">Hello, ${username}</a>`;

        // Role-based items in the dropdown
        if (role === 'gym_owner') {
            dropdownMenu.innerHTML += '<a class="dropdown-item" href="gym-profiling.html">Gym Owner Management</a>';
        } else if (role === 'user') {
            dropdownMenu.innerHTML += '<a class="dropdown-item" href="Pinfo.html">Personal Information</a>';
            dropdownMenu.innerHTML += '<a class="dropdown-item" href="report.html">Submit a Complaint</a>';
        }

        // Logout option
        dropdownMenu.innerHTML += '<a class="dropdown-item" href="login.html" id="logout">Log Out</a>';

        // Add event listener for logout
        document.getElementById('logout')?.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'login.html'; // Redirect to login page
            }).catch((error) => {
                console.error("Sign Out Error:", error.code, error.message);
            });
        });
    } else {
        console.error('Dropdown menu not found');
    }
}

// Check user authentication and role
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userId = user.uid;
        const userDocRef = doc(db, 'Accounts', userId);
        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const username = userData.username || 'User';
                const role = userData.role || 'user';
                createDropdownMenu(username, role);
            } else {
                window.location.href = 'login.html'; // Redirect to login if no user data is found
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        window.location.href = 'login.html'; // Redirect to login if no user is authenticated
    }
});

// Function to fetch membership plans from Firestore
async function fetchMembershipPlans() {
    const membershipPlansCollection = collection(db, 'membershipPlans');
    try {
        const snapshot = await getDocs(membershipPlansCollection);
        snapshot.forEach((doc) => {
            const plan = doc.data();
            document.getElementById('membershipSection').innerHTML += createMembershipCard(plan);
        });
    } catch (error) {
        console.error('Error fetching membership plans:', error);
    }
}

// Fetch gym profiles data from Firestore
async function fetchGymProfiles() {
    const gymProfilesCollection = collection(db, 'GymForms');
    try {
        const snapshot = await getDocs(gymProfilesCollection);
        snapshot.forEach((doc) => {
            const gym = doc.data();
            document.getElementById('gymsSection').innerHTML += createGymProfileCard(gym);
        });
    } catch (error) {
        console.error('Error fetching gym profiles:', error);
    }
}

// Initialize and fetch data
document.addEventListener('DOMContentLoaded', () => {
    fetchTrainers();
    fetchMembershipPlans();
    fetchGymProfiles();
});
document.addEventListener("DOMContentLoaded", function () {
    // Fetch trainers data from Firestore
    fetchTrainers();
    // Fetch membership plans data from Firestore
    fetchMembershipPlans();
    // Fetch gym profiles data from Firestore
    fetchGymProfiles();
  
    // Function to view membership plans in modal
    window.viewMembershipPlans = function () {
      const content = membershipPlans
        .map(
          (plan) => `
              <div class="membership-plan">
                  <h3>${plan.membershipType}</h3>
                  <p class="price">₱${plan.price}</p>
                  <p class="description">${plan.description}</p>
                  <a href="#" class="btn btn-secondary" onclick="applyForMembership(event, '${plan.membershipType}', ${plan.price})">Apply Now</a>
              </div>
          `
        )
        .join(""); // Join array to a single string
  
      document.getElementById("membershipPlansContent").innerHTML = content;
  
      const modal = document.getElementById("membershipPlansModal");
      modal.style.display = "block"; // Show the modal
    };
  
    // Function to handle membership application
    window.applyForMembership = function (event, membershipType, price) {
      event.preventDefault(); // Prevent default anchor behavior
  
      // Show checkout modal with the selected membership details
      const checkoutDetails = `
          <p>Membership Type: ${membershipType}</p>
          <p>Price: ₱${price}</p>
      `;
      document.getElementById("checkoutDetails").innerHTML = checkoutDetails;
  
      const modal = document.getElementById("checkoutModal");
      modal.style.display = "block"; // Show the checkout modal
    };
  
    // Close checkout modal
    window.closeCheckoutModal = function () {
      const modal = document.getElementById("checkoutModal");
      modal.style.display = "none"; // Hide the modal
    };
  
    // Confirm payment button event
    document.getElementById("confirmPayment").addEventListener("click", function () {
      const successMessage =
        "Great news! Your membership is officially active. We’re excited to have you join our community!"; // Customized message
      displaySuccessMessage(successMessage); // Display the success message
      closeCheckoutModal(); // Close the modal
    });
  
    // Function to display success message in the center
    function displaySuccessMessage(message) {
      const messageContainer = document.createElement("div");
      messageContainer.innerText = message;
      messageContainer.style.position = "fixed";
      messageContainer.style.top = "50%";
      messageContainer.style.left = "50%";
      messageContainer.style.transform = "translate(-50%, -50%)";
      messageContainer.style.padding = "20px";
      messageContainer.style.backgroundColor = "#4CAF50"; // Green background
      messageContainer.style.color = "white";
      messageContainer.style.borderRadius = "5px";
      messageContainer.style.zIndex = "1000";
  
      document.body.appendChild(messageContainer);
  
      // Remove message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(messageContainer);
      }, 3000);
    }
  
    // Fetch trainers data from Firestore
    async function fetchTrainers() {
        try {
            const querySnapshot = await getDocs(trainersRef);
            const trainerProfilesContainer = document.getElementById("trainer-profiles");
  
            if (trainerProfilesContainer) {
                trainerProfilesContainer.innerHTML = ""; // Clear existing content
  
                querySnapshot.forEach((doc) => {
                    const trainer = doc.data();
                    trainerProfilesContainer.innerHTML += createTrainerCard(trainer);
                });
            } else {
                console.error("Trainer profiles container not found in the DOM");
            }
        } catch (error) {
            console.error("Error fetching trainers:", error);
        }
    }
  
    // Fetch membership plans data from Firestore
    async function fetchMembershipPlans() {
        try {
            const querySnapshot = await getDocs(membershipPlansRef);
            const membershipPlans = [];
  
            querySnapshot.forEach((doc) => {
                membershipPlans.push(doc.data());
            });
  
            updateMembershipPlans(membershipPlans);
        } catch (error) {
            console.error("Error fetching membership plans:", error);
        }
    }
  
    // Fetch gym profiles data from Firestore
    async function fetchGymProfiles() {
        try {
            const querySnapshot = await getDocs(gymProfileRef);
            const gymProfilesContainer = document.getElementById("gym-profile");
  
            if (gymProfilesContainer) {
                gymProfilesContainer.innerHTML = ""; // Clear existing content
  
                querySnapshot.forEach((doc) => {
                    const gym = doc.data();
                    gymProfilesContainer.innerHTML += createGymProfileCard(gym);
                });
            } else {
                console.error("Gym Profile section not found in the DOM");
            }
        } catch (error) {
            console.error("Error fetching gym profiles:", error);
        }
    }
  
    // Fetch notifications data for the user from Firestore
    async function updateNotificationBell(userId) {
        try {
            const notificationsDoc = doc(db, "notifications", userId);
            const snapshot = await getDoc(notificationsDoc);
  
            const notificationContent = document.getElementById("notification-content");
            notificationContent.innerHTML = ""; // Clear existing content
  
            if (snapshot.exists()) {
                const notifications = snapshot.data();
                const totalNotifications =
                    notifications.transaction +
                    notifications.emails +
                    notifications.membershipPlans;
  
                const notificationBell = document.getElementById("notification-bell");
                notificationBell.querySelector(".badge").textContent =
                    totalNotifications > 0 ? totalNotifications : "";
  
                // Populate the dropdown
                if (totalNotifications > 0) {
                    if (notifications.transaction > 0) {
                        notificationContent.innerHTML += `<div>New Transactions: ${notifications.transaction}</div>`;
                    }
                    if (notifications.emails > 0) {
                        notificationContent.innerHTML += `<div>New Emails: ${notifications.emails}</div>`;
                    }
                    if (notifications.membershipPlans > 0) {
                        notificationContent.innerHTML += `<div>New Membership Plans: ${notifications.membershipPlans}</div>`;
                    }
                }
            } else {
                console.log("No notifications found for user:", userId);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }
  
    window.toggleDropdown = function () {
        const dropdown = document.getElementById("notification-dropdown");
        dropdown.style.display =
            dropdown.style.display === "none" ? "block" : "none";
    };
  
    window.onclick = function (event) {
        const dropdown = document.getElementById("notification-dropdown");
        const bell = document.getElementById("notification-bell");
  
        if (!bell.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = "none"; // Close the dropdown
        }
    };
  
    // Attach click event to the bell
    document.getElementById("notification-bell").addEventListener("click", toggleDropdown);
  
    // Chat functionality
    window.toggleChat = function () {
        const chatBox = document.getElementById("chatBox");
        chatBox.style.display =
            chatBox.style.display === "none" || chatBox.style.display === ""
                ? "block"
                : "none";
    };
  
    window.receiveMessage = function (message) {
        const messagesContainer = document.getElementById("messages");
  
        // Create a new message element
        const messageElement = document.createElement("div");
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
  
        // Open the chat box when a message is received
        toggleChat();
    };
});

// Helper functions to create cards (trainer, gym, membership)
function createTrainerCard(trainer) {
    return `
        <div class="trainer-card">
            <h3>${trainer.name}</h3>
            <p>${trainer.bio}</p>
        </div>
    `;
}

function createMembershipCard(plan) {
    return `
        <div class="membership-card">
            <h3>${plan.membershipType}</h3>
            <p>₱${plan.price}</p>
            <p>${plan.description}</p>
        </div>
    `;
}

function createGymProfileCard(gym) {
    return `
        <div class="gym-card">
            <h3>${gym.name}</h3>
            <p>${gym.address}</p>
        </div>
    `;
}
