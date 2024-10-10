// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, getDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
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

// Function to get the gymId of the logged-in gym owner
async function getGymIdForOwner(userEmail) {
    const gymOwnerRef = doc(db, 'gymOwners', userEmail); // Assuming 'gymOwners' contains gymId
    const gymOwnerSnapshot = await getDoc(gymOwnerRef);

    if (gymOwnerSnapshot.exists()) {
        const gymOwnerData = gymOwnerSnapshot.data();
        return gymOwnerData.gymId; // Assuming gymId is stored in the gymOwners collection
    } else {
        throw new Error('Gym owner information not found.');
    }
}

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

    try {
        // Fetch gymId for the gym owner
        const gymId = await getGymIdForOwner(userEmail);

        if (!gymId) {
            throw new Error('gymId is undefined or missing.');
        }

        // Create the document name
        const docName = `${membershipType}-${userEmail.replace(/[@.]/g, '_')}`;

        // Save or update the document in Firestore, including gymId
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
            gymId: gymId  // Add gymId field to the document
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

// Fetch and display updated data on landing page
$(document).ready(function () {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userEmail = user.email;

            try {
                // Fetch gymId for the logged-in owner
                const gymId = await getGymIdForOwner(userEmail);

                const membershipPlansRef = collection(db, 'MembershipPlans');
                const userPlansQuery = query(
                    membershipPlansRef,
                    where('gymId', '==', gymId),  // Filter by gymId
                    where('ownerEmail', '==', userEmail)  // Filter by gym owner's email
                );

                // Listen for real-time updates (filtered by gymId and owner's email)
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
                showMessage('error', 'Failed to retrieve gym ID or membership plans.');
                console.error('Error fetching gym owner or plans:', error.message);
            }
        } else {
            showMessage('error', 'You must be logged in to view membership plans.');
        }
    });
});

// Initialize TinyMCE for the description field
tinymce.init({
    selector: '#editPlanDescription',
    menubar: false,
    plugins: 'lists link image charmap preview anchor',
    toolbar: 'undo redo | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat',
    height: 300
});
