import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";

// Your web app's Firebase configuration
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
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function() {
    const trainersRef = collection(db, 'Trainer');
    const GymProfileref = collection(db, 'GymOwner'); // Update with the correct collection name

    // Function to redirect to login
    window.redirectToLogin = function() {
        window.location.href = 'login.html';
    }

    // Function to create HTML for each trainer
    function createTrainerCard(trainer) {
        return `
            <div class="trainer-card">
                <img src="${trainer.TrainerPhoto}" alt="${trainer.Name}" class="trainer-photo">
                <h3>${trainer.TrainerName}</h3>
                <a href="login.html" class="btn-book-now" onclick="checkLoginBeforeBooking()">Trainer Info</a>
            </div>
        `;
    }

    window.checkLoginBeforeBooking = function(event) {
        event.preventDefault(); // Prevent the default action

        const isLoggedIn = false; // Replace with your actual login status check

        if (!isLoggedIn) {
            showError("You need to have an account to book a trainer.");
        } else {
            // Redirect or proceed with booking logic
            window.location.href = 'booking-page.html'; // Example redirection
        }
    }

    // Function to create Gym Profile Card
    function createGymProfileCard(gym) {
        if (gym.status !== 'Approved') return '';
        
        return `
            <div class="gym-profile-card">
                <div class="gym-profile-header">
                    <img src="${gym.gymPhoto}" alt="${gym.gymName}" class="gym-photo">
                    <h3>${gym.gymName}</h3>
                </div>
                <div class="gym-profile-details">
                    <button class="btn-primary" onclick="showLoginToastAndRedirect()">Gym Info</button>
                </div>
            </div>
        `;
    }
    
    // Function to show toast message for login and redirect to login page
    window. showLoginToastAndRedirect = function() {
        const toast = document.createElement('div');
        toast.className = 'toast-error';
        toast.textContent = 'You need to log in first';
        document.body.appendChild(toast);
    
        // Show the toast for 3 seconds
        setTimeout(() => {
            toast.remove();
            window.location.href = 'login.html';
        }, 3000);
    }
    
    // Basic CSS for toast message (can be moved to a separate CSS file)
    const style = document.createElement('style');
    style.textContent = `
    .toast-error {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #e74c3c;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 16px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }`;
    
    document.head.appendChild(style);

    // Fetch trainers data from Firestore
    getDocs(trainersRef).then((snapshot) => {
        const trainerProfilesContainer = document.getElementById('trainer-profiles');
        if (trainerProfilesContainer) {
            trainerProfilesContainer.innerHTML = ''; // Clear existing content

            snapshot.forEach((doc) => {
                const trainer = doc.data();
                // Check if the role is 'trainer'
                if (trainer.role === 'trainer') {
                    trainerProfilesContainer.innerHTML += createTrainerCard(trainer);
                }
            });
        } else {
            console.error("Trainer profiles container not found in the DOM");
        }
    });

    // Fetch gym profiles data from Firestore
    getDocs(GymProfileref).then((snapshot) => {
        const gymprofilesection = document.getElementById('gym-profile');

        if (gymprofilesection) {
            gymprofilesection.innerHTML = ''; // Clear existing content

            snapshot.forEach((doc) => {
                const gym = doc.data();
                // Check if the role is 'gym owner'
                if (gym.role === 'gymowner') {
                    gymprofilesection.innerHTML += createGymProfileCard(gym);
                }
            });
        } else {
            console.error("Gym Profile section not found in the DOM");
        }
    });
});
window. toggleMenu = function() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('show');
}

const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("nav ul");

menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");

    // Add bounce-in animation on click
    menuToggle.classList.add("animate");
    setTimeout(() => {
        menuToggle.classList.remove("animate");
    }, 400); // Remove animation class after animation duration
});

async function loadPromotions() {
    const servicesContainer = document.querySelector('.services');

    const snapshot = await getDocs(collection(db, 'Promotions'));
    snapshot.forEach((doc) => {
        const promotion = doc.data();

        const serviceElement = `
            <div class="service">
                <div class="overlay">
                    <h3 class="promotion-title">${promotion.gymName}</h3>
                    <h1 class="promotion-title">${promotion.title}</h1>
                    <p>${promotion.description}</p>
                </div>
            </div>`;

        servicesContainer.innerHTML += serviceElement;
    });

    if (snapshot.empty) {
        servicesContainer.innerHTML = '<p>No promotions available.</p>';
    }
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', loadPromotions);
