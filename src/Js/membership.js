// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";

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

// Handle the form submission for adding or updating a plan
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

    const user = auth.currentUser;
    const userEmail = user ? user.email : null;

    // Create the document name using the same format for the DOM ID
    const docName = `${membershipType}-${userEmail.replace(/[@.]/g, '_')}`;

    // Update the card details in Firestore
    try {
        await setDoc(doc(db, 'MembershipPlans', docName), {
            membershipType: membershipType,
            price: price,
            description: description,
            accessLevel: accessLevel,
            allowedClasses: allowedClasses,
            guestPasses: guestPasses,
            referralCode: referralCode,
            membershipDays: membershipDays,
            ownerEmail: userEmail
        });

        // Update the card in the DOM
        var card = $('#' + docName);
        if (card.length) {
            card.find('.card-header').text(membershipType + ' Plan');
            card.find('.card-body').eq(0).find('.card-text').eq(0).text(membershipType);
            card.find('.card-price').text('₱' + price);
            card.find('.card-body').eq(0).find('.card-text').eq(1).html(description); 

            $('#successMessage').text('Plan updated successfully.');
            $('#successModal').modal('show');
        } else {
            console.warn('Card not found in the DOM:', docName);
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
        const gymOwnerCollectionName = `MembershipPlans`;
        const docName = `${id}-${userEmail.replace(/[@.]/g, '_')}`;

        try {
            await deleteDoc(doc(db, gymOwnerCollectionName, docName));
            $('#successMessage').text('Plan data cleared successfully.');
            $('#successModal').modal('show');
            $('#' + docName).remove(); 
            $('#membershipModal').modal('hide');
        } catch (error) {
            $('#errorMessage').text('An error occurred while clearing the plan: ' + error.message);
            $('#errorModal').modal('show');
        }
    }
});


// Fetch and display updated data on landing page
$(document).ready(function() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userEmail = user.email;
            const membershipPlansRef = collection(db, 'MembershipPlans');

            onSnapshot(membershipPlansRef, (snapshot) => {
                snapshot.docChanges().forEach(change => {
                    const plan = change.doc.data();
                    // Ensure consistent ID format
                    const id = `${plan.membershipType}-${plan.ownerEmail.replace(/[@.]/g, '_')}`;

                    if (plan.ownerEmail === userEmail) {
                        if (change.type === "added" || change.type === "modified") {
                            var card = $('#' + id);
                            if (card.length) {
                                // Update existing card
                                card.find('.card-header').text(plan.membershipType + ' Plan');
                                card.find('.card-body').eq(0).find('.card-text').eq(0).text(plan.membershipType);
                                card.find('.card-price').text('₱' + plan.price);
                                card.find('.card-body').eq(0).find('.card-text').eq(1).html(plan.description);
                            } else {
                                // Create a new card if it doesn't exist
                                const newCard = $(`
                                    <div class="category-plans" id="${id}">
                                        <div class="card">
                                            <div class="card-header">${plan.membershipType} Plan</div>
                                            <div class="card-body">
                                                <div class="card-text">${plan.membershipType}</div>
                                                <div class="card-price">₱${plan.price}</div>
                                                <div class="card-text">${plan.description}</div>
                                                <button class="transition-button">Edit</button>
                                            </div>
                                        </div>
                                    </div>
                                `);
                                $('#plansContainer').append(newCard); // Append the new card to the container
                            }
                        } else if (change.type === "removed") {
                            $('#' + id).remove(); // Remove the card if it was deleted
                        }
                    }
                });
            });
        } else {
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
