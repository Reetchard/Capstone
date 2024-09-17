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
  const trainersRef = ref(database, 'trainers');
  // Reference to the membership plans in Firebase
  const membershipPlansRef = ref(database, 'membershipPlans');

  // Function to create HTML for each trainer
  function createTrainerCard(trainer) {
    return `
      <div class="service">
        <h3>${trainer.name}</h3>
        <p>${trainer.description}</p>
      </div>
    `;
  }

  // Function to create HTML for each membership plan
  function createMembershipCard(plan) {
    return `
      <div class="membership-plan">
        <h3>${plan.name}</h3>
        <p>Price: ${plan.price}</p>
        <p>Description: ${plan.description}</p>
        <a href="#contact" class="btn btn-secondary">Apply Now</a>
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
            const trainer = data[key];
            trainerProfilesContainer.innerHTML += createTrainerCard(trainer);
        }
    } else {
        console.error("Trainer profiles container not found in the DOM");
    }
});

// Fetch membership plans data from Firebase
onValue(membershipPlansRef, function(snapshot) {
    const data = snapshot.val();
    const membershipSection = document.getElementById('membership-section');
    
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

})

