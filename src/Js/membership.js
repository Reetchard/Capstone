// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, setDoc, doc, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js"; // Add onSnapshot here
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";

// Firebase configuration
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
const auth = getAuth(app);

// Function to show success, error, or confirmation messages
function showMessage(type, message) {
    if (type === 'success') {
        $('#successMessage').text(message);
        $('#successModal').modal('show');
    } else if (type === 'error') {
        $('#errorMessage').text(message);
        $('#errorModal').modal('show');
    }
}

// Fetch and display updated data on landing page
$(document).ready(function () {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userEmail = user.email;

            // Log user email for debugging
            console.log("User email:", userEmail);

            if (!userEmail) {
                showMessage('error', 'Failed to retrieve user email.');
                return;
            }

            try {
                // Get the userId for the logged-in owner
                const userId = user.uid;
                console.log("User ID:", userId);

                // Check if userId is undefined
                if (!userId) {
                    console.error("User ID is undefined.");
                    showMessage('error', 'User ID not found.');
                    return;
                }

                const membershipPlansRef = collection(db, 'MembershipPlans');

                const userPlansQuery = query(
                    membershipPlansRef,
                    where('ownerId', '==', userId)  // Filter by gym owner's userId
                );

                // Listen for real-time updates (filtered by userId)
                onSnapshot(userPlansQuery, (snapshot) => {
                    $('#plansTableBody').empty();  // Clear the table body before updating
                    snapshot.forEach((doc) => {
                        const plan = doc.data();
                        const id = `${plan.membershipType}-${plan.ownerEmail.replace(/[@.]/g, '_')}`;

                        // Add the plan to the table
                        const newRow = $(` 
                            <tr id="${id}">
                                <td>${plan.membershipType}</td>
                                <td>₱${plan.price}</td>
                                <td>${plan.description}</td>
                                <td>${plan.accessLevel}</td>
                                <td>${plan.allowedClasses}</td>
                                <td>${plan.guestPasses}</td>
                                <td>${plan.referralCode}</td>
                                <td>${plan.membershipDays}</td>
                                <td>
                                    <button class="btn btn-primary transition-button" data-id="${id}">Edit</button>
                                    <button class="btn btn-danger delete-button" data-id="${id}">Delete</button>
                                </td>
                            </tr>
                        `);

                        // Append the new row to the table
                        $('#plansTableBody').append(newRow);
                    });
                });
            } catch (error) {
                showMessage('error', 'Failed to retrieve membership plans.');
                console.error('Error fetching membership plans:', error.message);
            }
        } else {
            showMessage('error', 'You must be logged in to view membership plans.');
        }
    });
});

// Handle form submission for adding or updating a plan
$('#editPlanForm').on('submit', async function (e) {
    e.preventDefault();

    const id = $('#editPlanId').val();
    const membershipType = $('#membershipType').val();
    const price = $('#editPlanPrice').val();
    const description = tinymce.get('editPlanDescription').getContent();
    const accessLevel = $('#accessLevel').val();
    const allowedClasses = $('#allowedClasses').val();
    const guestPasses = $('#guestPasses').val();
    const referralCode = $('#referralCode').val();
    const membershipDays = $('#membershipDays').val();

    const user = auth.currentUser;
    const userEmail = user ? user.email : null;
    const userId = user ? user.uid : null;  // Use the userId (UID) from Firebase

    if (!userId) {
        showMessage('error', 'User ID is missing.');
        return;
    }

    try {
        // Create the document name
        const docName = `${membershipType}-${userEmail.replace(/[@.]/g, '_')}`;

        // Save or update the document in Firestore, including userId
        await setDoc(doc(db, 'MembershipPlans', docName), {
            membershipType,
            price,
            description,
            accessLevel,
            allowedClasses,
            guestPasses,
            referralCode,
            membershipDays,
            ownerEmail: userEmail,
            ownerId: userId  // Store the gym owner's userId instead of gymId
        });

        // Show success message
        showMessage('success', 'Plan saved successfully.');

        // Reset the form
        $('#editPlanForm')[0].reset();
        tinymce.get('editPlanDescription').setContent('');

        // Close the modal
        $('#membershipModal').modal('hide');
    } catch (error) {
        showMessage('error', 'An error occurred while saving the plan: ' + error.message);
    }
});

// Initialize TinyMCE for the description field
tinymce.init({
    selector: '#editPlanDescription',
    menubar: false,
    plugins: 'lists link image charmap preview anchor',
    toolbar: 'undo redo | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat',
    height: 300
});
