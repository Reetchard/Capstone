// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getDatabase, ref, update, remove, onValue } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js";

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

// Handle click to open modal and populate fields
$(document).on('click', '.transition-button', function() {
    var card = $(this).closest('.category-plans');
    var id = card.attr('id'); // Assuming the ID matches the card
    var name = card.find('.card-text').eq(0).text();
    var price = card.find('.card-price').text();
    var description = card.find('.card-text').eq(1).text(); // Fixed variable name

    $('#editPlanId').val(id);
    $('#editPlanName').val(name);
    $('#editPlanPrice').val(price.replace('₱', '')); // Remove the currency symbol if present
    $('#editPlanDescription').val(description);

    $('#membershipModal').modal('show');
});

// Handle the form submission for editing a plan
$('#editPlanForm').on('submit', function(e) {
    e.preventDefault();

    var id = $('#editPlanId').val();
    var membershipType = $('#membershipType').val();
    var price = $('#editPlanPrice').val();
    var description = tinymce.get('editPlanDescription').getContent(); // Get content from TinyMCE
    var accessLevel = $('#accessLevel').val();
    var allowedClasses = $('#allowedClasses').val();
    var guestPasses = $('#guestPasses').val();
    var membershipType = $('#membershipType').val();
    var referralCode = $('#referralCode').val();
    var membershipDays = $('#membershipDays').val();

    // Update the card details in Firebase Realtime Database
    update(ref(database, 'membershipPlans/' + id), {
        membershipType: membershipType,
        price: price,
        description: description,
        accessLevel: accessLevel,
        allowedClasses: allowedClasses,
        guestPasses: guestPasses,
        membershipType: membershipType,
        referralCode: referralCode,
        membershipDays:membershipDays
    }).then(() => {
        // Successfully updated in Firebase
        var card = $('#' + id);

        if (card.length) {
            card.find('.card-header').text(membershipType + ' Plan');
            card.find('.card-body').eq(0).find('.card-text').eq(0).text(membershipType);
            card.find('.card-price').text('₱' + price);
            card.find('.card-body').eq(0).find('.card-text').eq(1).html(description); // Use .html() to render HTML

            // Notify the user of the successful update
            $('#successMessage').text('Plan updated successfully.');
            $('#successModal').modal('show');
        } else {
            // Display an error message if the card is not found
            $('#errorMessage').text('Plan card not found.');
            $('#errorModal').modal('show');
        }

        $('#membershipModal').modal('hide');
    }).catch((error) => {
        // Handle any errors that occur during the Firebase update
        $('#errorMessage').text('An error occurred while updating the plan: ' + error.message);
        $('#errorModal').modal('show');
    });
});
// Handle clearing the data from Firebase
$('#clearPlanButton').on('click', function() {
    var id = $('#editPlanId').val();
    if (id) {
        remove(ref(database, 'membershipPlans/' + id)).then(() => {
            $('#successMessage').text('Plan data cleared successfully.');
            $('#successModal').modal('show');
            $('#' + id).remove(); // Remove the card from the DOM
            $('#membershipModal').modal('hide');
        }).catch((error) => {
            $('#errorMessage').text('An error occurred while clearing the plan: ' + error.message);
            $('#errorModal').modal('show');
        });
    }
});

// Fetch and display updated data on landing page
$(document).ready(function() {
    const membershipPlansRef = ref(database, 'membershipPlans');

    onValue(membershipPlansRef, (snapshot) => {
        const plans = snapshot.val();
        if (plans) {
            $.each(plans, function(id, plan) {
                var card = $('#' + id);
                if (card.length) {
                    card.find('.card-header').text(plan.membershipType + ' Plan');
                    card.find('.card-body').eq(0).find('.card-text').eq(0).text(plan.membershipType);
                    card.find('.card-price').text('₱' + plan.price);
                    card.find('.card-body').eq(0).find('.card-text').eq(1).text(plan.description); // Fixed selector
                }
            });
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
