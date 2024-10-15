import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, addDoc,getDoc,query,where,updateDoc,orderBy,onSnapshot} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'; 
import { getStorage, ref, getDownloadURL,uploadBytes  } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage();

document.querySelectorAll('.nav_link').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Ensure the clicked link exists and has a target section
        const targetSection = document.querySelector(`#${link.getAttribute('data-target')}`);
        
        if (targetSection) {
            // Hide all other sections
            document.querySelectorAll('.section').forEach((section) => {
                section.classList.remove('active');
            });

            // Show the target section
            targetSection.classList.add('active');
        } else {
            console.error("Target section not found for link:", link);
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Wait until the DOM is fully loaded before accessing elements
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(db, 'Users', userId); // Fetch user doc from Firestore

            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data(); // Get user data
                    const username = userData.username || 'User'; // Username with fallback

                    // Display profile picture and username
                    displayProfilePicture(user, username); // Pass the user object and username

                    // Fetch notifications for the user
                    fetchNotifications(userId); // Fetch and display notifications
                } else {
                    console.error("User document does not exist.");
                    window.location.href = 'login.html'; // Redirect to login if no user document found
                }
            } catch (error) {
                console.error("Error fetching user data:", error); // Error handling
            }
        } else {
            window.location.href = 'login.html'; // Redirect if user is not authenticated
        }
    });
});



// Function to display user profile picture
function displayProfilePicture(user, username) {
    const userId = user.uid;
    const profilePicRef = ref(storage, `profilePictures/${userId}/profile.jpg`);
  
    getDownloadURL(profilePicRef).then((url) => {
        // Update profile picture in both header and sidebar
        document.getElementById('profile-picture').src = url;        
        // Also update the username in the header
        document.getElementById('profile-username').textContent = username;
    }).catch((error) => {
        if (error.code === 'storage/object-not-found') {
            // Fallback to default image if no profile picture is found
            document.getElementById('profile-picture').src = 'framework/img/Profile.png';

            // Still set the username
            document.getElementById('profile-username').textContent = username;
        } else {
            console.error('Unexpected error loading profile picture:', error.message);
        }
    });
}


window.uploadProfilePicture =async function (file) {
        const user = getAuth().currentUser;
        if (!user) {
            console.error('No authenticated user found.');
            return;
        }
        
        const profilePicRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);
        try {
            await uploadBytes(profilePicRef, file);
            console.log('Profile picture uploaded successfully.');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
        }
}

       // Fetch Membership Plans
// async function fetchMembershipPlans(gymId) {
//         const auth = getAuth();
        
//         onAuthStateChanged(auth, async (user) => {
//             if (user) {
//                 const userEmail = user.email;  // Get logged-in user's email
        
//                 if (!gymId || gymId === undefined) {
//                     console.error('Invalid gymId passed to function');
//                     showMessage('error', 'Invalid gym selected. Please try again.');
//                     return;  // Exit the function if gymId is invalid
//                 }
        
//                 const plansCollection = collection(db, 'MembershipPlans');
        
//                 try {
//                     // Query membership plans for the specific gym and logged-in owner's email
//                     const q = query(
//                         plansCollection,
//                         where('gymId', '==', gymId),  // Match gym ID
//                         where('ownerEmail', '==', userEmail)  // Match owner email
//                     );
        
//                     const plansSnapshot = await getDocs(q);
//                     const membershipPlansContainer = document.getElementById('membershipPlansContent');
//                     membershipPlansContainer.innerHTML = ''; // Clear previous content
        
//                     if (!plansSnapshot.empty) {
//                         plansSnapshot.forEach(doc => {
//                             const plan = doc.data();
        
//                             // Only display the plan if the ownerEmail matches the logged-in user's email
//                             if (plan.ownerEmail === userEmail) {
//                                 const planDiv = document.createElement('div');
//                                 planDiv.classList.add('card', 'mb-3');
//                                 planDiv.innerHTML = `
//                                     <div class="card-body">
//                                         <h4 class="card-title">${plan.planName}</h4>
//                                         <p class="card-text">${plan.description}</p>
//                                         <p class="card-text">Price: ₱${plan.price}</p>
//                                     </div>
//                                 `;
//                                 membershipPlansContainer.appendChild(planDiv);
//                             }
//                         });
//                     } else {
//                         membershipPlansContainer.innerHTML = `<p>No membership plans found for this gym.</p>`;
//                     }
//                 } catch (error) {
//                     console.error("Error fetching membership plans: ", error.message);
//                     showMessage('error', 'Error fetching membership plans. Please try again later.');
//                 }
//             } else {
//                 console.error('Gym owner not authenticated');
//                 showMessage('error', 'You must be logged in to view membership plans.');
//             }
//         });
//     }
    
// Function to show the Membership Plans modal
window.viewMembershipPlans = async function (gymId) {
    const modal = document.getElementById('membershipPlansModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('Membership Plans modal element not found.');
        return;
    }

    try {
        // Fetch membership plans based on gymId
        const membershipPlans = await fetchMembershipPlans(gymId);  // Assuming fetchMembershipPlans is a function that fetches membership plans for the gym
        if (!membershipPlans || membershipPlans.length === 0) {
            alert("No membership plans found for this gym.");
            return;
        }

        // Now check if any of the fetched membership plans match the passed gymId
        const hasMatchingGymId = membershipPlans.some(plan => {
            return plan.gymId && plan.gymId === gymId;  // Check if the plan has a gymId and if it matches the provided gymId
        });

        if (hasMatchingGymId) {
            displayMembershipPlans(membershipPlans);  // Display matching membership plans
        } else {
            alert("No matching membership plans found for the selected gym.");
        }

    } catch (error) {
        console.error("Error fetching membership plans:", error);
    }
};

                // Function to close the modal
window.closeMembershipPlansModal = function() {
            const modal = document.getElementById('membershipPlansModal');
            if (modal) {
                modal.style.display = 'none';
            } else {
                console.error('Membership Plans modal element not found.');
            }
};
        
function displayMembershipPlans(plans) {
            const plansContainer = document.getElementById('membershipPlansContent'); // Adjust to your modal's content area
            plansContainer.innerHTML = ''; // Clear existing content
        
            plans.forEach(plan => {
                plansContainer.innerHTML += `
                    <div class="membership-plan">
                        <h4>${plan.name}</h4>
                        <p>${plan.details}</p>
                    </div>
                `;
            });
}

// Fetch Gym Profiles and Display
    async function fetchGymProfiles() {
        const gymsCollection = collection(db, 'Users');
        
        // Query to get only gym owners
        const gymOwnerQuery = query(gymsCollection, where('role', '==', 'gymowner'));
        
        const gymSnapshot = await getDocs(gymOwnerQuery);
        const gymList = gymSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() // Include the document data and its ID
        }));

        const gymProfilesContainer = document.getElementById('gym-profiles'); // Ensure correct ID
        gymProfilesContainer.innerHTML = ''; // Clear existing profiles

        gymList.forEach(gym => {
            // Check if the gym status is not "Under Review"
            if (gym.status && gym.status !== 'Under Review') {
                const gymDiv = document.createElement('div');
                gymDiv.classList.add('card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes

                gymDiv.innerHTML = `
                    <img src="${gym.gymPhoto || 'default-photo.jpg'}" alt="${gym.gymName || 'Gym'}" class="card-img-top gym-photo" />
                    <div class="card-body">
                        <h5 class="card-title gym-title">${gym.gymName || 'N/A'}</h5>
                        <button class="gym-info-btn" onclick="viewMore('${gym.id}')">Gym Info</button>
                    </div>
                `;

                gymProfilesContainer.appendChild(gymDiv); // Append each gym profile to the container
            }
        });
    }

    // Function to open the Gym Info Modal
    window.viewMore = async function (gymId) {
        try {
            // Fetch the gym document from Firestore using gymId (which is the document's ID)
            const gymDocRef = doc(db, 'Users', gymId);
            const gymDoc = await getDoc(gymDocRef);
    
            if (gymDoc.exists()) {
                const gymData = gymDoc.data();
    
                // Use the gymId (document ID) as the unique identifier (gym owner's uid)
                const gymUid = gymId;
    
                // Ensure each element exists before setting innerText
                const modalGymName = document.getElementById('modalGymName');
                const modalGymPhoto = document.getElementById('modalGymPhoto');
                const modalGymLocation = document.getElementById('modalGymLocation');
                const modalGymEquipment = document.getElementById('modalGymEquipment');
                const modalGymPrograms = document.getElementById('modalGymPrograms');
                const modalGymContact = document.getElementById('modalGymContact');
                const modalPriceRate = document.getElementById('modalPriceRate');
                const modalGymOpeningTime = document.getElementById('modalGymOpeningTime');
                const modalGymClosingTime = document.getElementById('modalGymClosingTime');
                const trainersSection = document.getElementById('trainers-section'); // Trainers section
                const productsSection = document.getElementById('products-section'); // Products section
    
                // Populate modal content with gym details
                if (modalGymName) modalGymName.innerText = gymData.gymName || 'N/A';
                if (modalGymPhoto) modalGymPhoto.src = gymData.gymPhoto || 'default-photo.jpg';
                if (modalGymLocation) modalGymLocation.innerText = gymData.gymLocation || 'N/A';
                if (modalGymEquipment) modalGymEquipment.innerText = gymData.gymEquipment || 'N/A';
                if (modalGymPrograms) modalGymPrograms.innerText = gymData.gymPrograms || 'N/A';
                if (modalGymContact) modalGymContact.innerText = gymData.gymContact || 'N/A';
                if (modalPriceRate) modalPriceRate.innerText = gymData.gymPriceRate || 'N/A';
                if (modalGymOpeningTime) modalGymOpeningTime.innerText = gymData.gymOpeningTime || 'N/A';
                if (modalGymClosingTime) modalGymClosingTime.innerText = gymData.gymClosingTime || 'N/A';
    
                // Step 1: Clear previous trainers and products
                trainersSection.innerHTML = ''; // Clear the section before populating new trainers
                productsSection.innerHTML = ''; // Clear the products section
    
                // Step 2: Fetch trainers whose GymName matches the gym owner's GymName
                const trainersQuery = query(
                    collection(db, 'Users'),
                    where('role', '==', 'trainer'),
                    where('GymName', '==', gymData.gymName) // Ensure the trainer's GymName matches the gym owner's GymName
                );
                const trainersSnapshot = await getDocs(trainersQuery);
    
                if (!trainersSnapshot.empty) {
                    trainersSnapshot.forEach(doc => {
                        const trainerData = doc.data();
    
                        // Check if the trainer's status is not "Under Review"
                        if (trainerData.status !== "Under Review") {
                            // Create a trainer card dynamically with "View Info" button
                            const trainerCard = `
                                <div class="trainer-card">
                                    <img src="${trainerData.TrainerPhoto || 'default-trainer-photo.jpg'}" alt="Trainer Photo" class="trainer-photo">
                                    <h5>${trainerData.TrainerName || 'No Name'}</h5>
                                    <button class="btn btn-success" onclick="ViewTrainerInfo('${doc.id}')">View Info</button> <!-- View Info button -->
                                </div>
                            `;
                            // Append the trainer card to the trainers section
                            trainersSection.innerHTML += trainerCard;
                        }
                    });
                } else {
                    trainersSection.innerHTML = '<p>No trainers found for this gym.</p>';
                }
    
                // Step 3: Fetch products from the gym owner's Products subcollection and authenticate
                const productsQuery = query(
                    collection(db, `Users/${gymUid}/Products`) // Query the subcollection under the specific gym owner
                );
                const productsSnapshot = await getDocs(productsQuery);
    
                if (!productsSnapshot.empty) {
                    productsSnapshot.forEach(doc => {
                        const productData = doc.data();
    
                        // Step 4: Validate if the product's userId matches the gym owner's uid
                        if (productData.userId === gymUid) {
                            // Create a product card dynamically if the userId matches
                            const productCard = `
                                <div class="product-card">
                                    <img src="${productData.photoURL || 'default-product.jpg'}" alt="Product Photo" class="product-photo">
                                    <h5>${productData.name}</h5>
                                    <p>Price: ₱${productData.price}</p>
                                    <p>${productData.description}</p>
                                </div>
                            `;
                            // Append the product card to the products section
                            productsSection.innerHTML += productCard;
                        }
                    });
                } else {
                    productsSection.innerHTML = '<p>No products found for this gym.</p>';
                }
    
                // Step 5: Show the modal
                $('#gymProfileModal').modal('show');
            } else {
                console.error('No such document!');
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        }
    };
    
    

    // Function to view trainer info in a new modal
    window.ViewTrainerInfo = async function (trainerId) {
        try {
            // Close Gym modal
            $('#gymProfileModal').modal('hide');

            // Fetch trainer data by ID
            const trainerDocRef = doc(db, 'Users', trainerId);
            const trainerDoc = await getDoc(trainerDocRef);

            if (trainerDoc.exists()) {
                const trainerData = trainerDoc.data();

                // Check if the trainer's status is "Under Review"
                if (trainerData.status === "Under Review") {
                    console.warn('Trainer is under review. Cannot display.');
                    return; // Do not display the trainer if they are under review
                }

                // Ensure each trainer modal element exists
                const modalTrainerName = document.getElementById('modalTrainerName');
                const modalTrainerPhoto = document.getElementById('modalTrainerPhoto');
                const modalTrainerExpertise = document.getElementById('modalTrainerExpertise');
                const modalTrainerExperience = document.getElementById('modalTrainerExperience');
                const modalTrainerDays = document.getElementById('modalTrainerDays');
                const modalTrainerRate = document.getElementById('modalTrainerRate'); // Trainer rate element
                const bookNowButton = document.getElementById('bookNowButton'); // Book Now button

                // Populate trainer modal with the trainer's data
                if (modalTrainerName) modalTrainerName.innerText = trainerData.TrainerName || 'N/A';
                if (modalTrainerPhoto) modalTrainerPhoto.src = trainerData.TrainerPhoto || 'default-trainer-photo.jpg';
                if (modalTrainerExpertise) modalTrainerExpertise.innerText = trainerData.Expertise || 'N/A';
                if (modalTrainerExperience) modalTrainerExperience.innerText = trainerData.Experience || 'N/A';
                if (modalTrainerDays) modalTrainerDays.innerText = trainerData.Days || 'N/A';
                if (modalTrainerRate) modalTrainerRate.innerText = `₱${trainerData.rate || 'N/A'}`; // Display rate with currency

                // Handle Book Now button (add trainer ID for booking logic)
                if (bookNowButton) {
                    bookNowButton.onclick = function() {
                        alert(`Booking Trainer: ${trainerId}`);
                        // Add your booking logic here
                    };
                }

                // Step 4: Show the Trainer Info modal
                $('#trainerProfileModal').modal('show');
            } else {
                console.error('Trainer not found!');
            }
        } catch (error) {
            console.error('Error fetching trainer data:', error);
        }
    }
    

    // Optionally, you can have other modal functions like closeModal()
    window.closeModal=function() {
        $('#gymProfileModal').modal('hide');
    }

    // Function to close the modal
    window.closeModal = function() {
        $('#gymProfileModal').modal('hide'); // Use Bootstrap's modal hide method
    }


    async function showGymCheckoutModal(gymId, gymData = {}, userData = {}) {
        const checkoutModal = document.getElementById('checkoutModal');
        const checkoutContent = document.getElementById('checkoutContent');
    
        // Fallback values
        const userName = userData.name || '';
        const userEmail = userData.email || '';
    
        // Display the modal only if the elements exist
        if (checkoutModal && checkoutContent) {
            checkoutContent.innerHTML = `
              <div class="row">
                <div class="col-md-6">
                  <h2>Gym Details</h2>
                  <div class="card mb-3" style="max-width: 300px; margin-left: 0;">
                    <img src="${gymData.gymPhoto || 'default-gym-photo.jpg'}" class="img-fluid rounded-start" alt="Gym Photo">
                    <div class="card-body">
                      <h5 class="card-title text-center">${gymData.gymName}</h5>
                      <p class="card-text text-center">Rate: ${gymData.gymPriceRate || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <h2>Reservation Details</h2>
                  <div class="form-group">
                    <label for="userName">Name</label>
                    <input type="text" id="userName" class="form-control" value="${userName}" required>
                  </div>
                  <div class="form-group mt-3">
                    <label for="userEmail">Email</label>
                    <input type="email" id="userEmail" class="form-control" value="${userEmail}" required>
                  </div>
                  <div class="form-group mt-3">
                    <label for="paymentMethod">Payment Method</label>
                    <select id="paymentMethod" class="form-control">
                      <option value="Over the Counter">Cash</option>
                    </select>
                  </div>
                  <div class="form-group mt-3">
                    <label for="reservationDate">Choose Reservation Date</label>
                    <input type="date" id="reservationDate" class="form-control" required>
                  </div>
                  <div class="button-container mt-4 d-flex justify-content-between">
                    <button class="btn btn-success btn-lg" id="confirmBookingButtonCheckout" style="width: 180px;">Confirm Booking</button>
                    <button class="btn btn-secondary btn-lg" id="cancelBookingButtonCheckout" style="width: 180px;">Cancel</button>
                  </div>
                </div>
              </div>
            `;
    
            checkoutModal.style.display = 'block';
    
            document.getElementById('confirmBookingButtonCheckout').onclick = async function () {
                const inputUserName = document.getElementById('userName').value.trim();
                const inputUserEmail = document.getElementById('userEmail').value.trim();
                const reservationDate = document.getElementById('reservationDate').value;
    
                if (!reservationDate) {
                    alert('Please select a valid reservation date.');
                    return;
                }
    
                try {
                    await addDoc(collection(db, 'Transactions'), {
                        gymId,
                        gymName: gymData.gymName,
                        username: inputUserName,
                        email: inputUserEmail,
                        reservationDate,
                        paymentMethod: document.getElementById('paymentMethod').value,
                        rate: gymData.gymPriceRate
                    });
    
                    alert(`Booking Confirmed for ${gymData.gymName} on ${reservationDate}.`);
                    closeGymCheckoutModal();
                } catch (error) {
                    console.error('Error saving transaction:', error);
                }
            };
    
            document.getElementById('cancelBookingButtonCheckout').onclick = function () {
                closeGymCheckoutModal();
            };
        }
    }
    
    function closeGymCheckoutModal() {
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.style.display = 'none'; // Hide the modal
        }
    }

    
    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        const modal = document.getElementById('confirmationModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
                // Now all event listeners and modal functions are attached when DOM is ready
                fetchGymProfiles();
                fetchMembershipPlans();
                showCheckoutModal();
                viewProducts();
            // Fetch trainers when the page loads
    });

    // async function showCheckoutModal(trainerId, trainerData, userData = {}) {
//     const checkoutModal = document.getElementById('checkoutModal');
//     const checkoutContent = document.getElementById('checkoutContent');

//     // Provide default values for userData if undefined
//     const userName = userData.name || '';
//     const userEmail = userData.email || '';

//     if (checkoutModal && checkoutContent) {
//         checkoutContent.innerHTML = `
//             <div class="row">
//                 <!-- Left Column: Trainer Information -->
//                 <div class="col-md-6">
//                     <h2>Trainer Details</h2>
//                     <div class="card mb-3" style="max-width: 300px; margin-left: 0;">
//                         <img src="${trainerData.TrainerPhoto || 'default-trainer-photo.jpg'}" class="img-fluid rounded-start" alt="Trainer Photo">
//                         <div class="card-body">
//                             <h5 class="card-title text-center">${trainerData.TrainerName}</h5>
//                             <p class="card-text text-center">Rate: ${trainerData.rate || 'N/A'}</p>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- Right Column: User/Customer Details -->
//                 <div class="col-md-6">
//                     <h2>Reservation Details</h2>

//                     <div class="form-group">
//                         <label for="userName">Name</label>
//                         <input type="text" id="userName" class="form-control" value="${userName}" required>
//                     </div>

//                     <div class="form-group mt-3">
//                         <label for="userEmail">Email</label>
//                         <input type="email" id="userEmail" class="form-control" value="${userEmail}" required>
//                     </div>

//                     <div class="form-group mt-3">
//                         <label for="paymentMethod">Payment Method</label>
//                         <select id="paymentMethod" class="form-control">
//                             <option value="Over the Counter">Cash</option>
//                         </select>
//                     </div>

//                     <div class="form-group mt-3">
//                         <label for="reservationDate">Choose Reservation Date</label>
//                         <input type="date" id="reservationDate" class="form-control">
//                     </div>

//                     <!-- Buttons -->
//                     <div class="button-container mt-4 d-flex justify-content-between">
//                         <button class="btn btn-success btn-lg" id="confirmBookingButtonCheckout" style="width: 180px;">Confirm Booking</button>
//                         <button class="btn btn-secondary btn-lg" id="cancelBookingButtonCheckout" style="width: 180px;">Cancel</button>
//                     </div>
//                 </div>
//             </div>
//         `;

//         // Show the checkout modal
//         checkoutModal.style.display = 'block';

//         // Handle confirm booking button with validation
//         document.getElementById('confirmBookingButtonCheckout').onclick = async function() {
//             const inputUserName = document.getElementById('userName').value.trim().toLowerCase();
//             const inputUserEmail = document.getElementById('userEmail').value.trim().toLowerCase();
//             const reservationDate = document.getElementById('reservationDate').value;

//             // Validate if a reservation date is selected
//             if (!reservationDate) {
//                 alert('Please select a valid reservation date.');
//                 return;
//             }

//             // Custom message and validation for booking confirmation
//             try {
//                 // Save the booking to the Transactions collection
//                 await addDoc(collection(db, 'Transactions'), {
//                     trainerId: trainerId,
//                     trainerName: trainerData.TrainerName,
//                     username: inputUserName,
//                     email: inputUserEmail,
//                     reservationDate: reservationDate,
//                     paymentMethod: document.getElementById('paymentMethod').value,
//                     rate: trainerData.rate
//                 });

//                 // Add a new notification for the user
//                 await addDoc(collection(db, 'UserNotifications'), {
//                     userId: auth.currentUser.uid,  // Current logged-in user ID
//                     message: `Your booking with ${trainerData.TrainerName} is confirmed for ${reservationDate}.`,
//                     status: 'unread',
//                     timestamp: new Date()
//                 });

//                 // Show custom success message
//                 alert(`🎉 Booking Confirmed! \n\nTrainer: ${trainerData.TrainerName}\nDate: ${reservationDate}\nRate: ${trainerData.rate}\n\nThank you for your reservation! We look forward to seeing you.`);
                
//                 // Close the modal
//                 closeCheckoutModal();

//                 // Fetch updated notifications and update the notification badge count
//                 fetchNotifications(auth.currentUser.uid);
//             } catch (error) {
//                 console.error('Error saving transaction or notification:', error);
//                 // Custom error message
//                 alert(`⚠️ Oops! Something went wrong while processing your booking. Please try again later.\n\nError: ${error.message}`);
//             }
//         };

//         // Handle cancel booking button with custom message
//         document.getElementById('cancelBookingButtonCheckout').onclick = function() {
//             if (confirm('Are you sure you want to cancel the booking?')) {
//                 closeCheckoutModal();
//             }
//         };

//         // Close checkout modal when clicking outside
//         window.onclick = function(event) {
//             if (event.target === checkoutModal) {
//                 closeCheckoutModal();
//             }
//         };
//     } else {
//         console.error("Checkout modal or content element not found!");
//     }
// } 



// // Function to close checkout modal
// function closeCheckoutModal() {
//     const checkoutModal = document.getElementById('checkoutModal');
//     if (checkoutModal) {
//         checkoutModal.style.display = 'none'; // Hide the modal
//     }
// }

//     // Function to close any modal by passing its ID
// window.closeModal = function(modalId) {
//     const modal = document.getElementById(modalId);
//     if (modal) {
//         modal.style.display = 'none'; // Hide the modal
//     }
// }

// // Close the modal when clicking outside of the modal content
// window.onclick = function(event) {
//     const gymModal = document.getElementById('gymProfileModal');
//     const trainerModal = document.getElementById('trainerProfileModal');

//     // Close gym modal if clicking outside of it
//     if (event.target === gymModal) {
//         closeModal('gymProfileModal');
//     }

//     // Close trainer modal if clicking outside of it
//     if (event.target === trainerModal) {
//         closeModal('trainerProfileModal');
//     }
// }

    
    // Function to toggle chat visibility
    window.toggleChat = function() {
        const chatBox = document.getElementById("chatBox");
        chatBox.style.display = chatBox.style.display === "none" || chatBox.style.display === "" ? "block" : "none";
    };

    // Initialize chat box visibility
    document.addEventListener("DOMContentLoaded", () => {
        const chatBox = document.getElementById("chatBox");
        chatBox.style.display = "none"; // Hide chat box by default
    });
    // Ensure the membership modal is hidden on page load
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('membershipPlansModal');
        if (modal) {
            modal.style.display = 'none'; // Hide the modal initially
        }
    });

    window. closeMembershipPlansModal = function() {
        const modal = document.getElementById('membershipPlansModal');
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.error('Membership Plans modal element not found');
        }
    }
    
    // Example function to send a message
    window.sendMessage = function() {
        const messageInput = document.getElementById("messageInput");
        const messagesContainer = document.getElementById("messages");

        if (messageInput.value.trim()) {
            const messageElement = document.createElement("div");
            messageElement.textContent = messageInput.value;
            messagesContainer.appendChild(messageElement);
            messageInput.value = ""; // Clear input after sending
        }
    };

    // Function to show the correct section
    document.querySelectorAll('.nav-link').forEach(navLink => {
        navLink.addEventListener('click', function(e) {
            e.preventDefault();
    
            const target = this.getAttribute('data-target');
            const section = document.getElementById(target);
    
            // Check if the section exists before modifying its classList
            if (section) {
                showSection(target);
            } else {
                console.error(`Section with ID '${target}' not found.`);
            }
        });
    });
    
    // Function to show the correct section
    function showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        } else {
            console.error(`Section with ID '${sectionId}' not found.`);
        }
    }

    // Show Gym Profile section by default when the page loads
    window.onload = function() {
        showSection('gym-profile');
    };
    
    async function fetchUserNotifications(userId) {
        try {
            const notificationsRef = collection(db, 'UserNotifications');  // Firestore collection
            const q = query(notificationsRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
    
            const notifications = [];
            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data() // Collect the document data
                });
            });
    
            return notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    }
    async function fetchNotifications(currentUserId) {
        try {
            const notifications = await fetchUserNotifications(currentUserId); // Fetch notifications from Firestore
            const unreadCount = notifications.filter(notification => notification.status === 'unread').length;
            
            updateNotificationCount(unreadCount); // Update the count in the badge
    
            const notificationList = document.getElementById('notification-list');
            notificationList.innerHTML = ''; // Clear the list before adding new notifications
            
            if (notifications.length > 0) {
                notifications.forEach(notification => {
                    const notificationItem = document.createElement('li');
                    notificationItem.classList.add('list-group-item');
                    
                    // Mark as read when the user clicks on it
                    if (notification.status === 'unread') {
                        notificationItem.classList.add('unread');
                    } else {
                        notificationItem.classList.add('read');  // Add a class to style read notifications
                    }
                    
                    notificationItem.textContent = notification.message;
                    notificationItem.onclick = () => markAsRead(notification.id, currentUserId);  // Mark as read when clicked
                    
                    notificationList.appendChild(notificationItem);
                });
            } else {
                notificationList.innerHTML = '<li class="list-group-item">No new notifications</li>';
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }
    

        // Function to update the notification badge with the count
        function updateNotificationCount(count) {
            const notificationCountElement = document.getElementById('notification-count');
            if (notificationCountElement) {
                notificationCountElement.textContent = count;
                notificationCountElement.style.display = count > 0 ? 'inline-block' : 'none';
            }
        }
        async function markAsRead(notificationId, currentUserId) {
            try {
                const notificationRef = doc(db, 'UserNotifications', notificationId);
                await updateDoc(notificationRef, { status: 'read' });  // Update status to 'read'
        
                // Refresh the notifications after marking one as read
                fetchNotifications(currentUserId); // Refresh the notifications
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

