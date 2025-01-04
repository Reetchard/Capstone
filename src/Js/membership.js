// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, setDoc, deleteDoc, doc, getDoc, query, where, onSnapshot, getDocs, updateDoc,runTransaction } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
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

// Declare gymName globally to use in the application
let gymName = "";

// ✅ Toast Notification Setup (Single Toast Container)
if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '1050';
    document.body.appendChild(toastContainer);
}

// ✅ Toast Function (Single Toast at a Time)
function showToast(message, type) {
    const toastContainer = document.getElementById('toast-container');
    toastContainer.innerHTML = `
        <div class="toast align-items-center text-white bg-${type} border-0 show" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="ml-2 mb-1 close text-white" data-dismiss="toast">&times;</button>
            </div>
        </div>
    `;
    const toast = toastContainer.querySelector('.toast');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); // Auto-hide after 3 seconds
}

// ✅ Fetch Gym Owner Username
async function fetchGymOwnerUsername() {
    const user = auth.currentUser;

    if (user) {
        try {
            const gymOwnerDocRef = doc(db, 'GymOwner', user.uid);  
            const gymOwnerDocSnap = await getDoc(gymOwnerDocRef);

            if (gymOwnerDocSnap.exists()) {
                gymName = gymOwnerDocSnap.data().gymName;
                document.querySelector('#profile-username').textContent = gymName || 'Gym Owner';
                document.querySelector('#profile-username-mobile').textContent = gymName || 'Gym Owner';
            } else {
                document.querySelector('#profile-username').textContent = 'Gym Owner';
                console.error("Gym owner document not found.");
            }
        } catch (error) {
            console.error("Error fetching gym owner data:", error);
        }
    } else {
        document.querySelector('#profile-username').textContent = 'Not Logged In';
        console.error("No authenticated user.");
    }
}

// ✅ Auth State Change Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchGymOwnerUsername();
        fetchPlansForGymOwner(user.uid);
    }
});

async function fetchPlansForGymOwner(userId) {
    try {
        const plansQuery = query(collection(db, 'MembershipPlans'), where('ownerId', '==', userId));
        const querySnapshot = await getDocs(plansQuery);

        const plans = [];
        querySnapshot.forEach((doc) => {
            plans.push({ id: doc.id, ...doc.data() });
        });

        displayPlans(plans);
    } catch (error) {
        console.error("Error fetching plans:", error);
        showToast('Error: Failed to fetch membership plans.', 'danger');
    }
}

// ✅ Add Membership Plan with Price Formatting
document.getElementById('AddPlanForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const membershipType = document.getElementById('membershipType').value;
    const price = parseFloat(document.getElementById('editPlanPrice').value.replace(/,/g, '')).toFixed(2);
    const description = document.getElementById('editPlanDescription').value;
    const accessLevel = document.getElementById('accessLevel').value;
    const allowedClasses = document.getElementById('allowedClasses').value;
    const guestPasses = document.getElementById('guestPasses').value;
    const membershipDays = document.getElementById('membershipDays').value;

    try {
        showSpinner(); // Show spinner during the save process

        if (!membershipType || !price || !description) {
            showToast('Error: Membership Type, Price, and Description are required fields.', 'danger');
            hideSpinner();
            return;
        }

        // ✅ Add New Membership Plan
        const counterRef = doc(db, 'Counters', 'MembershipPlans');
        let planId = 1;

        await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);

            if (counterDoc.exists()) {
                planId = counterDoc.data().lastId + 1;
            }

            transaction.set(counterRef, { lastId: planId }, { merge: true });
        });

        await setDoc(doc(db, 'MembershipPlans', planId.toString()), {
            planId: planId,
            ownerId: auth.currentUser.uid,
            membershipType,
            price,
            description,
            accessLevel,
            allowedClasses,
            guestPasses,
            membershipDays,
            gymName: gymName
        });

        showToast('Success: Membership plan added!', 'success');
        document.getElementById('AddPlanForm').reset();
        $('#membershipModal').modal('hide');
        fetchPlansForGymOwner(auth.currentUser.uid);
    } catch (error) {
        console.error('Error adding membership plan:', error);
        showToast('Error: Failed to add membership plan.', 'danger');
    } finally {
        hideSpinner();
    }
});


// ✅ Display Membership Plans with Peso Sign and Commas
function displayPlans(plans) {
    const tableBody = document.getElementById("plansTableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    plans.forEach(plan => {
        if (plan.gymName === gymName) { // Only show plans for the current gym
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${plan.membershipType}</td>
                <td>${formatNumber(plan.price)}</td>
                <td>${plan.description}</td>
                <td>${plan.accessLevel}</td>
                <td>${plan.allowedClasses}</td>
                <td>${plan.guestPasses}</td>
                <td>${plan.membershipDays}</td>
                <td>
                    <button class="btn custom-btn-warning btn-sm" onclick="editPlan('${plan.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn custom-btn-danger btn-sm" onclick="deletePlan('${plan.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
}

// ✅ Utility Function to Format Numbers with Peso Sign and Commas
function formatNumber(value) {
    return parseFloat(value).toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    });
}


// ✅ Clear Form Button
document.getElementById('clearPlanButton').addEventListener('click', function () {
    document.getElementById('AddPlanForm').reset();
});


function showSpinner() {
    document.getElementById('spinner').style.display = 'block';
}

function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
}



// Function to Delete a Plan with Toast Confirmation
window.deletePlan = async function (planId) {
    if (!planId) {
        showToast('Error: Invalid plan ID provided.', 'danger');
        console.error("Invalid planId:", planId);
        return;
    }

    console.log("Deleting plan with ID:", planId); // Debugging log

    try {
        // Show Confirmation Toast
        showConfirmationToast(
            'Are you sure you want to delete this membership plan?', 
            async () => {
                // Reference the specific plan in Firestore
                const planDocRef = doc(db, 'MembershipPlans', planId);
                await deleteDoc(planDocRef);

                // Show Success Toast
                showToast('Success: Membership plan deleted successfully!', 'success');
                console.log("Plan deleted successfully:", planId);

                // Refresh the membership plans list
                fetchPlansForGymOwner(auth.currentUser.uid);
            }
        );
    } catch (error) {
        console.error("Error deleting plan:", error);
        showToast('Error: Failed to delete membership plan.', 'danger');
    }
};
// Toast Confirmation Function
function showConfirmationToast(message, onConfirm) {
    const toastContainer = document.getElementById('toast-container');
    toastContainer.innerHTML = `
        <div class="toast align-items-center text-white bg-warning border-0 show" role="alert">
            <div class="d-flex flex-column p-2">
                <div class="toast-body">${message}</div>
                <div class="d-flex justify-content-end gap-2 mt-2">
                    <button class="btn btn-sm btn-danger" id="confirmDeleteBtn">Yes</button>
                    <button class="btn btn-sm btn-secondary" id="cancelDeleteBtn">No</button>
                </div>
            </div>
        </div>
    `;

    const toast = toastContainer.querySelector('.toast');
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        toast.classList.remove('show');
        await onConfirm(); // Execute the delete logic
    });

    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        toast.classList.remove('show'); // Close the toast
        showToast('Action canceled.', 'info');
    });

    setTimeout(() => {
        if (toast.classList.contains('show')) {
            toast.classList.remove('show'); // Auto-hide toast after 10 seconds
        }
    }, 10000);
}

// ✅ Fetch Plan Details and Populate Edit Modal with Formatted Price
window.editPlan = async function (planId) {
    try {
        const planDocRef = doc(db, 'MembershipPlans', planId);
        const planDocSnap = await getDoc(planDocRef);

        if (planDocSnap.exists()) {
            const planData = planDocSnap.data();

            // Populate modal fields with existing data
            document.getElementById('editPlanId').value = planId;
            document.getElementById('editMembershipType').value = planData.membershipType || '';
            document.getElementById('editPlanPrice').value = parseFloat(planData.price).toFixed(2) || '';
            document.getElementById('editPlanDescription').value = planData.description || '';
            document.getElementById('editAccessLevel').value = planData.accessLevel || '';
            document.getElementById('editAllowedClasses').value = planData.allowedClasses || '';
            document.getElementById('editGuestPasses').value = planData.guestPasses || '';
            document.getElementById('editMembershipDays').value = planData.membershipDays || '';

            $('#editPlanModal').modal('show'); // Open the modal
        } else {
            console.error('Plan not found');
            showToast('Error: Plan not found.', 'danger');
        }
    } catch (error) {
        console.error('Error fetching plan details:', error);
        showToast('Error: Failed to fetch plan details.', 'danger');
    }
};


// ✅ Update Membership Plan
document.getElementById('editPlanForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const planId = document.getElementById('editPlanId').value;
    const membershipType = document.getElementById('editMembershipType').value;
    const price = document.getElementById('editPlanPrice').value;
    const description = document.getElementById('editPlanDescription').value;
    const accessLevel = document.getElementById('editAccessLevel').value;
    const allowedClasses = document.getElementById('editAllowedClasses').value;
    const guestPasses = document.getElementById('editGuestPasses').value;
    const membershipDays = document.getElementById('editMembershipDays').value;

    try {
        showSpinner();

        if (!membershipType || !price || !description) {
            showToast('Error: Membership Type, Price, and Description are required.', 'danger');
            hideSpinner();
            return;
        }

        const planDocRef = doc(db, 'MembershipPlans', planId);

        await updateDoc(planDocRef, {
            membershipType,
            price,
            description,
            accessLevel,
            allowedClasses,
            guestPasses,
            membershipDays,
            gymName: gymName
        });

        showToast('Success: Membership plan updated!', 'success');
        $('#editPlanModal').modal('hide');
        fetchPlansForGymOwner(auth.currentUser.uid);
    } catch (error) {
        console.error('Error updating plan:', error);
        showToast('Error: Failed to update membership plan.', 'danger');
    } finally {
        hideSpinner();
    }
});
// ✅ Live Price Formatting on Input
document.getElementById('editPlanPrice').addEventListener('input', (e) => {
    let value = e.target.value.replace(/,/g, '');
    if (!isNaN(value) && value !== '') {
        e.target.value = parseFloat(value).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
});
