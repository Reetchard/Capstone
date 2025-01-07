import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
    // Your config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", function() {
    const currentStatusElement = document.getElementById('current-status');
    const plansContainer = document.getElementById('plans-container');
    const profilePictureElement = document.getElementById('profile-picture');
    const userNameElement = document.getElementById('user-name');

    // Fetch membership plans offered by gym owners
    const membershipPlansRef = ref(database, 'membershipPlans');
    onValue(membershipPlansRef, (snapshot) => {
        const plans = snapshot.val();
        plansContainer.innerHTML = ''; // Clear existing content

        for (const key in plans) {
            const plan = plans[key];
            plansContainer.innerHTML += createMembershipCard(plan);
        }
    });

    // Create HTML for each membership plan
    function createMembershipCard(plan) {
        return `
          <div class="membership-plan">
            <h3>${plan.membershipType}</h3>
            <p class="price">₱${plan.price}</p>
            <p class="description">${plan.description}</p>
            <button onclick="applyForMembership('${plan.membershipType}')">Apply Now</button>
          </div>
        `;
    }

    // Fetch user data when authenticated
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = user.uid;

            // Fetch user profile information from the database
            const userProfileRef = ref(database, `Accounts/${userId}`);
            onValue(userProfileRef, (snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    userNameElement.textContent = userData.username || 'User not found';

                    // Fetch and display the profile picture
                    const profilePicRef = storageRef(storage, 'profilePictures/' + userId + '/profile.jpg');
                    getDownloadURL(profilePicRef)
                        .then((url) => {
                            profilePictureElement.src = url; // Set the profile picture
                        })
                        .catch((error) => {
                            console.error("Error loading profile picture:", error);
                            profilePictureElement.src = 'framework/img/Profile.png'; // Default picture if not available
                        });
                } else {
                    console.error("User data not found.");
                }
            });

            // Fetch current membership status
            const userMembershipRef = ref(database, `Memberships/${userId}`);
            onValue(userMembershipRef, (snapshot) => {
                const status = snapshot.val();
                currentStatusElement.textContent = status ? `Current Membership: ${status.membershipType}` : 'No current membership plan.';
            });
        } else {
            window.location.href = 'login.html';
        }
    });
});

// Function to handle membership application
window.applyForMembership = function(membershipType) {
    alert(`You have applied for the ${membershipType} membership plan.`);
    // Add your logic to update the membership status in Firebase
}
