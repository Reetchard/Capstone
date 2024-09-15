import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, update, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";  // Correct import for database

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
const db = getDatabase(app);

// Function to load plans from Firebase Realtime Database
function loadPlans() {
    const plansRef = ref(db, "MembershipPlans");
    onValue(plansRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const plan = childSnapshot.val();
            const planId = childSnapshot.key;

            // Populate the membership cards with the fetched data based on category
            if (plan.category === "Basic") {
                document.getElementById("basic-plans").querySelector('.card-title').textContent = plan.name;
                document.getElementById("basic-plans").querySelector('.card-price').textContent = `Price: ${plan.price}`;
                document.getElementById("basic-plans").querySelector('.card-text').textContent = plan.description;
            } else if (plan.category === "Premium") {
                document.getElementById("premium-plans").querySelector('.card-title').textContent = plan.name;
                document.getElementById("premium-plans").querySelector('.card-price').textContent = `Price: ${plan.price}`;
                document.getElementById("premium-plans").querySelector('.card-text').textContent = plan.description;
            } else if (plan.category === "VIP") {
                document.getElementById("vip-plans").querySelector('.card-title').textContent = plan.name;
                document.getElementById("vip-plans").querySelector('.card-price').textContent = `Price: ${plan.price}`;
                document.getElementById("vip-plans").querySelector('.card-text').textContent = plan.description;
            }
        });
    });
}

// Function to load plan details into the form for editing
function loadPlanDetails(planCategory) {
    const categoryRef = query(ref(db, "MembershipPlans"), orderByChild("category"), equalTo(planCategory.charAt(0).toUpperCase() + planCategory.slice(1)));
    onValue(categoryRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const plan = childSnapshot.val();
            const planId = childSnapshot.key;

            // Populate the modal with plan data for editing
            document.getElementById("planName").value = plan.name;
            document.getElementById("planPrice").value = plan.price;
            document.getElementById("planDescription").value = plan.description;

            // Save changes when the form is submitted
            document.getElementById('editPlanForm').onsubmit = (e) => {
                e.preventDefault();
                updatePlan(planId);
            };
        });
    });
}

// Function to update the membership plan details
function updatePlan(planId) {
    const updatedPlan = {
        name: document.getElementById("planName").value,
        price: document.getElementById("planPrice").value,
        description: document.getElementById("planDescription").value
    };

    update(ref(db, "MembershipPlans/" + planId), updatedPlan)
        .then(() => {
            // Hide the modal on success
            $('#editPlanModal').modal('hide');

            // Show success message
            document.getElementById("successMessage").textContent = "Plan updated successfully!";
            $('#successModal').modal('show');

            // Update the corresponding card with the new data
            loadPlans();  // Reload the membership plans after updating
        })
        .catch((error) => {
            // Show error message
            document.getElementById("errorMessage").textContent = "Error updating plan: " + error.message;
            $('#errorModal').modal('show');
        });
}

// Load plans on page load
document.addEventListener("DOMContentLoaded", function() {
    loadPlans();

    // Add event listener for all edit buttons
    document.querySelectorAll('.transition-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const category = event.target.closest('.category-plans').id.split('-')[0]; // 'basic', 'premium', 'vip'
            loadPlanDetails(category); // Load details of the plan into the modal form
        });
    });
});
