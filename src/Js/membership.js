// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js"; // Import onAuthStateChanged

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
const auth = getAuth(app);
// Handle click to open modal and populate fields
$(document).on('click', '.transition-button', function() {
    var card = $(this).closest('.category-plans');
    var id = card.attr('id'); 
    var name = card.find('.card-text').eq(0).text();
    var price = card.find('.card-price').text();
    var description = card.find('.card-text').eq(1).text(); 

    $('#editPlanId').val(id);
    $('#editPlanName').val(name);
    $('#editPlanPrice').val(price.replace('₱', '')); 
    $('#editPlanDescription').val(description);

    $('#membershipModal').modal('show');
});

// Handle the form submission for editing a plan
$('#editPlanForm').on('submit', async function(e) {
    e.preventDefault();

    var id = $('#editPlanId').val();
    var membershipType = $('#membershipType').val();
    var price = $('#editPlanPrice').val();
    var description = tinymce.get('editPlanDescription').getContent(); 
    var accessLevel = $('#accessLevel').val();
    var allowedClasses = $('#allowedClasses').val();
    var guestPasses = $('#guestPasses').val();
    var referralCode = $('#referralCode').val();
    var membershipDays = $('#membershipDays').val();

    // Get the current user's email
    const user = auth.currentUser;
    const userEmail = user ? user.email : null;

    // Create a unique collection name based on the gym owner's email
    const gymOwnerCollectionName = `Memberships_${userEmail.replace('.', '_')}`;

    // Update the card details in Firestore
    try {
        await setDoc(doc(db, gymOwnerCollectionName, id), {
            membershipType: membershipType,
            price: price,
            description: description,
            accessLevel: accessLevel,
            allowedClasses: allowedClasses,
            guestPasses: guestPasses,
            referralCode: referralCode,
            membershipDays: membershipDays,
            ownerEmail: userEmail // Add the owner's email to the document
        });

        // Successfully updated in Firestore
        var card = $('#' + id);
        if (card.length) {
            card.find('.card-header').text(membershipType + ' Plan');
            card.find('.card-body').eq(0).find('.card-text').eq(0).text(membershipType);
            card.find('.card-price').text('₱' + price);
            card.find('.card-body').eq(0).find('.card-text').eq(1).html(description); 

            $('#successMessage').text('Plan updated successfully.');
            $('#successModal').modal('show');
        } else {
            $('#errorMessage').text('Plan card not found.');
            $('#errorModal').modal('show');
        }

        $('#membershipModal').modal('hide');
    } catch (error) {
        $('#errorMessage').text('An error occurred while updating the plan: ' + error.message);
        $('#errorModal').modal('show');
    }
});

// Handle clearing the data from Firestore
$('#clearPlanButton').on('click', async function() {
    var id = $('#editPlanId').val();
    if (id) {
        const user = auth.currentUser;
        const userEmail = user ? user.email : null;
        const gymOwnerCollectionName = `Memberships_${userEmail.replace('.', '_')}`;

        try {
            await deleteDoc(doc(db, gymOwnerCollectionName, id));
            $('#successMessage').text('Plan data cleared successfully.');
            $('#successModal').modal('show');
            $('#' + id).remove(); 
            $('#membershipModal').modal('hide');
        } catch (error) {
            $('#errorMessage').text('An error occurred while clearing the plan: ' + error.message);
            $('#errorModal').modal('show');
        }
    }
});

// Fetch and display updated data on landing page
$(document).ready(function() {
    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            const userEmail = user.email;

            // Replace dots in email to create a unique collection name
            const gymOwnerCollectionName = `Memberships_${userEmail.replace('.', '_')}`;
            const membershipPlansRef = collection(db, gymOwnerCollectionName);

            // Listen for changes to the membership plans
            onSnapshot(membershipPlansRef, (snapshot) => {
                snapshot.docChanges().forEach(change => {
                    const plan = change.doc.data();
                    const id = change.doc.id;

                    if (change.type === "added" || change.type === "modified") {
                        var card = $('#' + id);
                        if (card.length) {
                            card.find('.card-header').text(plan.membershipType + ' Plan');
                            card.find('.card-body').eq(0).find('.card-text').eq(0).text(plan.membershipType);
                            card.find('.card-price').text('₱' + plan.price);
                            card.find('.card-body').eq(0).find('.card-text').eq(1).html(plan.description);
                        }
                    } else if (change.type === "removed") {
                        $('#' + id).remove(); // Remove the card if it was deleted
                    }
                });
            });
        } else {
            // User is signed out
            console.error('User is not authenticated.');
            $('#errorMessage').text('You must be logged in to view membership plans.');
            $('#errorModal').modal('show');
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
