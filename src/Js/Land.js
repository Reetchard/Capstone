import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js";

// Your web app's Firebase configuration
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
const database = getDatabase(app);

document.addEventListener("DOMContentLoaded", function() {
  // Reference to the trainers table in Firebase
  const trainersRef = ref(database, 'TrainerForm');
  // Reference to the membership plans in Firebase
  const membershipPlansRef = ref(database, 'membershipPlans');
  // Reference to the gym profiles in Firebase
  const GymProfileref = ref(database, 'GymForms');

  // Function to show the confirmation message
  function showConfirmationMessage() {
    const messageElement = document.getElementById('confirmation-message');
    if (messageElement) {
      messageElement.classList.add('active');
      setTimeout(() => {
        messageElement.classList.remove('active');
      }, 5000); // Hide message after 5 seconds
    }
  }

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
        <!-- <p><strong>Available Only:</strong> ${trainer.Days}</p> -->
        <!-- <p><strong>Experience:</strong> ${trainer.Experience}</p> -->
        <!-- <p><strong>Expertise:</strong> ${trainer.Expertise}</p> -->
        <a href="login.html" class="btn-book-now" onclick="checkLoginBeforeBooking()">Trainer Info</a>
      </div>
    `;
  }

  window.checkLoginBeforeBooking= function(event) {
    event.preventDefault(); // Prevent the default action

    const isLoggedIn = false; // Replace with your actual login status check

    if (!isLoggedIn) {
        showError("You need to have an account to book a trainer.");
    } else {
        // Redirect or proceed with booking logic
        window.location.href = 'booking-page.html'; // Example redirection
    }
}

  // Function to create a Membership Plan Card
  function createMembershipCard(plan) {
    return `
      <div class="membership-plan">
        <h3>${plan.membershipType}</h3>
        <p class="price">₱${plan.price}</p>
        <p class="description">${plan.description}</p>
        <a href="login.html" class="btn btn-secondary" onclick="applyForMembership(event, '${plan.membershipType}')">Apply Now</a>
      </div>
    `;
}


  // Function to create Gym Profile Card
  function createGymProfileCard(gym) {
    return `
      <div class="gym-profile-card">
        <div class="gym-profile-header">
          <img src="${gym.gymPhoto}" alt="${gym.gymName}" class="gym-photo">
          <h3>${gym.gymName}</h3>
        </div>
        <div class="gym-profile-details">
          <!-- <p><strong>Location:</strong> ${gym.gymLocation}</p> -->
          <!-- <p><strong>Equipment:</strong> ${gym.gymEquipment}</p> -->
          <!-- <p><strong>Programs:</strong> ${gym.gymPrograms}</p> -->
          <!-- <p><strong>Contact:</strong> ${gym.gymContact}</p> -->
          <!-- <p><strong>Opening Time:</strong> ${gym.gymOpeningTime}</p> -->
          <!-- <p><strong>Closing Time:</strong> ${gym.gymClosingTime}</p> -->
          <a href="login.html" class="btn-primary" onclick="showConfirmationMessage()">GYM INFO</a>
        </div>
      </div>
    `;
  }

  // Fetch trainers data from Firebase
  onValue(trainersRef, function(snapshot) {
    const data = snapshot.val();
    const trainerProfilesContainer = document.getElementById('trainer-profiles');

    if (trainerProfilesContainer) {
      trainerProfilesContainer.innerHTML = ''; // Clear existing content

      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const trainer = data[key];
          trainerProfilesContainer.innerHTML += createTrainerCard(trainer);
        }
      }
    } else {
      console.error("Trainer profiles container not found in the DOM");
    }
  });

  // Fetch membership plans data from Firebase
  onValue(membershipPlansRef, function(snapshot) {
    const data = snapshot.val();
    const membershipSection = document.getElementById('membership-table');
    
    if (membershipSection) {
      membershipSection.innerHTML = ''; // Clear existing content

      for (const key in data) {
        const plan = data[key];
        membershipSection.innerHTML += createMembershipCard(plan);
      }
    } else {
      console.error("Membership section not found in the DOM");
    }
  });
    function applyForMembership(event) {
      event.preventDefault(); // Prevent the default anchor behavior

      const isLoggedIn = false; // Replace with your actual login status check

      if (!isLoggedIn) {
          showError("You need to have an account to apply for membership plans.");
      } else {
          console.log("Proceeding to apply for membership plans...");
          // Your logic to proceed with membership application
      }
  }


  // Fetch gym profiles data from Firebase
  onValue(GymProfileref, function(snapshot) {
    const data = snapshot.val();
    const gymprofilesection = document.getElementById('gym-profile');
    
    if (gymprofilesection) {
      gymprofilesection.innerHTML = ''; // Clear existing content

      for (const key in data) {
        const gym = data[key];
        gymprofilesection.innerHTML += createGymProfileCard(gym);
      }
    } else {
      console.error("Gym Profile section not found in the DOM");
    }
  });
});

