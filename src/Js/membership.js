// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, setDoc, deleteDoc, doc, getDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js"; // Add onSnapshot here
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

// Show spinner and message customization function
function toggleSpinner(isLoading, message = 'Processing...') {
    if (isLoading) {
        $('#spinnerModal').show(); // Show the modal containing the spinner
        $('.processing-text').text(message); // Update the processing message
    } else {
        $('#spinnerModal').hide(); // Hide the modal
        $('.processing-text').text(''); // Clear the message
    }
}

// Function to show customized messages
function toggleMessage(isVisible, message = '') {
    if (isVisible) {
        $('#messageContainer').text(message).show();  // Show the message with content
    } else {
        $('#messageContainer').hide();  // Hide the message
    }
}

// Function to show custom confirmation modal and handle the response
function showCustomConfirmation(message, onConfirm) {
    // Set the custom confirmation message
    $('#confirmationMessage').text(message);

    // Show the confirmation modal
    $('#confirmationModal').modal('show');

    // Handle the Yes button click
    $('#confirmYes').off('click').on('click', function() {
        // Hide the modal
        $('#confirmationModal').modal('hide');
        
        // Execute the confirmation callback if provided
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });
}

// Event delegation for delete button functionality with custom confirmation modal
$('#plansTableBody').on('click', '.delete-button', function () {
    const planId = $(this).data('id');

    // Show custom confirmation modal
    showCustomConfirmation('Are you sure you want to delete this membership plan?', async function() {
        try {
            toggleSpinner(true, 'Deleting membership plan...');

            // Delete the membership plan from Firestore
            await deleteDoc(doc(db, 'MembershipPlans', planId));

            // Remove the plan row from the table
            $(`#${planId}`).remove();

            toggleSpinner(false);
            toggleMessage('success', 'Plan deleted successfully.');
        } catch (error) {
            toggleSpinner(false);
            toggleMessage('danger', 'Error deleting plan: ' + error.message);
        }
    });
});

// Fetch and display updated data on landing page
$(document).ready(function () {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userEmail = user.email;
            if (!userEmail) {
                toggleMessage(true, 'Failed to retrieve user email. Please log in again.');
                return;
            }

            try {
                const userId = user.uid;

                if (!userId) {
                    toggleMessage(true, 'User ID not found. Please log in again.');
                    return;
                }

                // Fetch gym owner's details to get the gymName from the Users collection
                const userDocRef = doc(db, 'GymOwner', userId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const gymOwnerData = userDoc.data();
                    const gymName = gymOwnerData.gymName;

                    const membershipPlansRef = collection(db, 'MembershipPlans');
                    const userPlansQuery = query(
                        membershipPlansRef,
                        where('ownerId', '==', userId),
                        where('gymName', '==', gymName)
                    );

                    // Listen for real-time updates
                    onSnapshot(userPlansQuery, (snapshot) => {
                        $('#plansTableBody').empty();
                        snapshot.forEach((doc) => {
                            const plan = doc.data();
                            const id = `${plan.membershipType}-${plan.ownerEmail.replace(/[@.]/g, '_')}`;

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
                                        <button class="btn btn-primary edit-button" data-id="${id}">Edit</button>
                                        <button class="btn btn-danger delete-button" data-id="${id}">Delete</button>
                                    </td>
                                </tr>
                            `);

                            $('#plansTableBody').append(newRow);
                        });

                        // Attach event handlers to Edit and Delete buttons after rows are added
                        attachButtonHandlers();
                    });
                } else {
                    toggleMessage(true, 'Failed to retrieve gym owner data.');
                }
            } catch (error) {
                toggleMessage(true, 'Failed to retrieve membership plans. Please try again.');
                console.error('Error fetching membership plans:', error.message);
            }
        } else {
            toggleMessage(true, 'You must be logged in to view membership plans.');
        }
    });

    function attachButtonHandlers() {
        // Event delegation for edit button functionality
        $('#plansTableBody').on('click', '.edit-button', async function () {
            const planId = $(this).data('id');

            try {
                toggleSpinner(true, 'Loading membership plan data for editing...');

                const planRef = doc(db, 'MembershipPlans', planId);
                const planDoc = await getDoc(planRef);

                if (planDoc.exists()) {
                    const planData = planDoc.data();

                    $('#editPlanId').val(planId);
                    $('#membershipType').val(planData.membershipType);
                    $('#editPlanPrice').val(planData.price);
                    tinymce.get('editPlanDescription').setContent(planData.description);
                    $('#accessLevel').val(planData.accessLevel);
                    $('#allowedClasses').val(planData.allowedClasses);
                    $('#guestPasses').val(planData.guestPasses);
                    $('#referralCode').val(planData.referralCode);
                    $('#membershipDays').val(planData.membershipDays);

                    toggleSpinner(false);
                    $('#membershipModal').modal('show');
                } else {
                    toggleSpinner(false);
                    toggleMessage('danger', 'Failed to retrieve membership plan data for editing.');
                }
            } catch (error) {
                toggleSpinner(false);
                toggleMessage('danger', 'Error retrieving plan for editing: ' + error.message);
            }
        });
    }
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
    const userId = user ? user.uid : null;

    if (!userId) {
        toggleMessage(true, 'User ID is missing.');
        return;
    }

    try {
        toggleSpinner(true, 'Saving membership plan...');

        const userDocRef = doc(db, 'GymOwner', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            toggleSpinner(false);
            toggleMessage(true, 'Gym owner details not found.');
            return;
        }

        const gymOwnerData = userDoc.data();
        const gymName = gymOwnerData.gymName;

        const docName = `${membershipType}-${userEmail.replace(/[@.]/g, '_')}`;

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
            ownerId: userId,
            gymName: gymName
        });

        toggleSpinner(false);
        toggleMessage(true, 'Plan saved successfully.');

        $('#editPlanForm')[0].reset();
        tinymce.get('editPlanDescription').setContent('');
        $('#membershipModal').modal('hide');
    } catch (error) {
        toggleSpinner(false);
        toggleMessage(true, 'An error occurred while saving the plan: ' + error.message);
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
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');

    // Toggle Sidebar Visibility on Mobile
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    // Close Sidebar When Clicking Outside on Mobile
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target) && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });
});