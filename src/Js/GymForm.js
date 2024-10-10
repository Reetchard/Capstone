// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
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

// Function to show custom confirmation
function showConfirmation(message, callback) {
    $('#confirmationMessage').text(message);
    $('#confirmationModal').modal('show');
    
    $('#confirmDeleteBtn').off('click').on('click', function () {
        $('#confirmationModal').modal('hide');
        callback(true);
    });
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

    // Create the document name
    const docName = ${membershipType}-${userEmail.replace(/[@.]/g, '_')};

    try {
        // Save or update the document in Firestore
        await setDoc(doc(db, 'MembershipPlans', docName), {
            membershipType,
            price,
            description,
            accessLevel,
            allowedClasses,
            guestPasses,
            referralCode,
            membershipDays,
            ownerEmail: userEmail
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
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userEmail = user.email;
            const membershipPlansRef = collection(db, 'MembershipPlans');
            const userPlansQuery = query(membershipPlansRef, where('ownerEmail', '==', userEmail)); // Filter by gym owner's email

            // Listen for real-time updates (filtered by owner's email)
            onSnapshot(userPlansQuery, (snapshot) => {
                $('#plansTableBody').empty();  // Clear the table body before updating
                snapshot.forEach((doc) => {
                    const plan = doc.data();
                    const id = ${plan.membershipType}-${plan.ownerEmail.replace(/[@.]/g, '_')};

                    // Add the plan to the table
                    const newRow = $( 
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
                    );

                    // Append the new row to the table
                    $('#plansTableBody').append(newRow);
                });
            });

            // Handle Edit button click
            $(document).on('click', '.transition-button', function () {
                const id = $(this).data('id');
                const row = $(#${id});
                const plan = {
                    membershipType: row.find('td').eq(0).text(),
                    price: row.find('td').eq(1).text().replace('₱', ''),
                    description: row.find('td').eq(2).text(),
                    accessLevel: row.find('td').eq(3).text(),
                    allowedClasses: row.find('td').eq(4).text(),
                    guestPasses: row.find('td').eq(5).text(),
                    referralCode: row.find('td').eq(6).text(),
                    membershipDays: row.find('td').eq(7).text(),
                };

                // Populate the form with the data from the selected row
                $('#editPlanId').val(id);
                $('#membershipType').val(plan.membershipType);
                $('#editPlanPrice').val(plan.price);
                tinymce.get('editPlanDescription').setContent(plan.description);
                $('#accessLevel').val(plan.accessLevel);
                $('#allowedClasses').val(plan.allowedClasses);
                $('#guestPasses').val(plan.guestPasses);
                $('#referralCode').val(plan.referralCode);
                $('#membershipDays').val(plan.membershipDays);

                // Open the modal
                $('#membershipModal').modal('show');
            });

            // Handle Delete button click
            $(document).on('click', '.delete-button', function () {
                const id = $(this).data('id');
                const row = $(#${id});

                // Show custom confirmation dialog
                showConfirmation(Are you sure you want to delete the ${row.find('td').eq(0).text()} plan?, function (confirmed) {
                    if (confirmed) {
                        deletePlan(id);
                    }
                });
            });

            // Function to delete a plan
            async function deletePlan(id) {
                try {
                    const docRef = doc(db, 'MembershipPlans', id);

                    await deleteDoc(docRef);

                    // Remove the row from the table
                    $(#${id}).remove();
                    showMessage('success', 'Plan deleted successfully.');
                } catch (error) {
                    showMessage('error', 'An error occurred while deleting the plan: ' + error.message);
                }
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