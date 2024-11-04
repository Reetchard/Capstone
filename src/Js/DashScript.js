import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, addDoc,getDoc,query,where,updateDoc,onSnapshot,orderBy, limit} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'; 
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

   // Toggle dropdown on profile picture click
   document.getElementById('profile-picture').addEventListener('click', function(event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    event.stopPropagation();
    
    // If the dropdown is currently hidden, show it
    if (!dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('hide'); // Remove hide class if present
        dropdownMenu.classList.add('show'); // Show the dropdown
        
        // Also add a class for animating the profile picture
        this.classList.add('active'); // Optional for additional effect
    } else {
        dropdownMenu.classList.add('hide'); // Add hide class for smooth closing
        setTimeout(() => {
            dropdownMenu.classList.remove('show', 'hide'); // Remove show and hide after transition
        }, 300); // Match the duration with the CSS transition time
        
        // Optionally remove active class from profile picture
        this.classList.remove('active'); // Optional for additional effect
    }
});

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (!event.target.closest('.dropdown')) {
        dropdownMenu.classList.add('hide'); // Add hide class for smooth closing
        setTimeout(() => {
            dropdownMenu.classList.remove('show', 'hide'); // Remove show and hide after transition
        }, 300); // Match the duration with the CSS transition time
        
        // Optionally remove active class from profile picture
        document.getElementById('profile-picture').classList.remove('active'); // Optional for additional effect
    }
});
document.addEventListener('DOMContentLoaded', () => {
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
                // Function to close the modal
window.closeMembershipPlansModal = function() {
            const modal = document.getElementById('membershipPlansModal');
            if (modal) {
                modal.style.display = 'none';
            } else {
                console.error('Membership Plans modal element not found.');
            }
};
     


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
                gymDiv.classList.add('trainer-card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes

                gymDiv.innerHTML = `
                    <img src="${gym.gymPhoto || 'default-photo.jpg'}" alt="${gym.gymName || 'Gym'}" class="card-img-top gym-photo" />
                    <div class="card-body">
                        <h5 class="card-title gym-title">${gym.gymName || 'N/A'}</h5>
                        <button class="btn-custom btn-primary view-more-btn" onclick="viewMore('${gym.id}')">Gym Info</button>
                    </div>
                `;

                gymProfilesContainer.appendChild(gymDiv); // Append each gym profile to the container
            }
        });
    }

    // Function to format time from 24-hour to 12-hour format with AM/PM
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    return `${formattedHours}:${minutes} ${ampm}`;
}

    // Function to open the Gym Info Modal
    window.viewMore = async function (gymId) {
        try {
            // Fetch the gym document from Firestore using gymId
            const gymDocRef = doc(db, 'Users', gymId);
            const gymDoc = await getDoc(gymDocRef);
    
            if (gymDoc.exists()) {
                const gymData = gymDoc.data();
                const gymProfileName = gymData.gymName;
    
                // Debugging log
                console.log('Gym Profile Name:', gymProfileName);
    
                // Get and update modal elements
                const modalGymName = document.getElementById('modalGymName');
                const modalGymPhoto = document.getElementById('modalGymPhoto');
                const modalGymLocation = document.getElementById('modalGymLocation');
                const modalGymEquipment = document.getElementById('modalGymEquipment');
                const modalGymPrograms = document.getElementById('modalGymPrograms');
                const modalGymEmail = document.getElementById('modalGymEmail');
                const modalGymContact = document.getElementById('modalGymContact');
                const modalPriceRate = document.getElementById('modalPriceRate');
                const modalGymOpeningTime = document.getElementById('modalGymOpeningTime');
                const modalGymClosingTime = document.getElementById('modalGymClosingTime');
                const trainersSection = document.getElementById('trainers-section');
                const productsSection = document.getElementById('products-section');
    
                // Populate modal content with gym details
                if (modalGymName) modalGymName.innerText = gymProfileName || 'N/A';
                if (modalGymPhoto) modalGymPhoto.src = gymData.gymPhoto || 'default-photo.jpg';
                if (modalGymLocation) modalGymLocation.innerText = gymData.gymLocation || 'N/A';
                if (modalGymEquipment) modalGymEquipment.innerText = gymData.gymEquipment || 'N/A';
                if (modalGymPrograms) modalGymPrograms.innerText = gymData.gymPrograms || 'N/A';
                if (modalGymEmail) modalGymEmail.innerText = gymData.email || 'N/A';
                if (modalGymContact) modalGymContact.innerText = gymData.gymContact || 'N/A';
                if (modalPriceRate) modalPriceRate.innerText = gymData.gymPriceRate || 'N/A';
                if (modalGymOpeningTime) modalGymOpeningTime.innerText = formatTime(gymData.gymOpeningTime || 'N/A');
                if (modalGymClosingTime) modalGymClosingTime.innerText = formatTime(gymData.gymClosingTime || 'N/A');
    
                // Clear the trainers and products sections
                trainersSection.innerHTML = '';
                productsSection.innerHTML = '';
    
                // Fetch trainers for this gym
                const trainersQuery = query(
                    collection(db, 'Users'),
                    where('role', '==', 'trainer'),
                    where('GymName', '==', gymProfileName)
                );
                const trainersSnapshot = await getDocs(trainersQuery);
    
                if (!trainersSnapshot.empty) {
                    trainersSnapshot.forEach(doc => {
                        const trainerData = doc.data();
                        if (trainerData.status !== "Under Review") {
                            const trainerCard = `
                                <div class="trainer-card">
                                    <img src="${trainerData.TrainerPhoto || 'default-trainer-photo.jpg'}" alt="Trainer Photo" class="trainer-photo">
                                    <h5>${trainerData.TrainerName || 'No Name'}</h5>
                                    <button class="btn-custom btn-success" onclick="ViewTrainerInfo('${doc.id}')">Trainer Info</button>
                                </div>
                            `;
                            trainersSection.innerHTML += trainerCard;
                        }
                    });
                } else {
                    trainersSection.innerHTML = '<p>No trainers found for this gym.</p>';
                }
    
                // Fetch and display products for this gym
                const productsQuery = query(
                    collection(db, 'Products'),
                    where('gymName', '==', gymProfileName)
                );
                const productsSnapshot = await getDocs(productsQuery);
    
                if (!productsSnapshot.empty) {
                    productsSnapshot.forEach(doc => {
                        const productData = doc.data();
                        const productCard = `
                            <div class="trainer-card">
                                <img src="${productData.photoURL || 'default-product.jpg'}" alt="Product Photo" class="product-photo">
                                <h5>${productData.name || 'Unnamed Product'}</h5>
                                <button class="btn-custom btn-primary" onclick="ViewProductInfo('${doc.id}')">View Details</button>
                            </div>
                        `;
                        productsSection.innerHTML += productCard;
                    });
                } else {
                    productsSection.innerHTML = '<p>No products found for this gym.</p>';
                }
    
                // Show the modal
                $('#gymProfileModal').modal('show');
            } else {
                console.error('No such document!');
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        }
    };
    async function getCurrentUserId() {
        return new Promise((resolve, reject) => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userDocRef = doc(db, 'Users', user.uid); // Fetch user doc using UID
                    try {
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const userId = userData.userId; // Retrieve the userId field from the document
                            if (userId) {
                                resolve(userId); // Resolve with userId from the document
                            } else {
                                reject('userId field not found in user document.');
                            }
                        } else {
                            reject('User document does not exist.');
                        }
                    } catch (error) {
                        reject('Error fetching user document:', error);
                    }
                } else {
                    reject('No authenticated user found.');
                }
            });
        });
    }
    // Function to check if the user's membership is approved
    async function checkMembershipStatus(userId, gymName) {
        // Check for undefined values
        if (!userId || !gymName) {
            console.error("Error: userId or gymName is undefined.");
            return false; // Exit early if values are invalid
        }

        try {
            // Query the Transactions collection to find membership status
            const membershipQuery = query(
                collection(db, 'Transactions'),
                where('userId', '==', userId),
                where('gymName', '==', gymName)
            );
            const membershipSnapshot = await getDocs(membershipQuery);

            // Check each document for 'Approved' status
            if (!membershipSnapshot.empty) {
                for (const doc of membershipSnapshot.docs) {
                    const transaction = doc.data();
                    if (transaction.status === 'Approved') {
                        return true; // Return true if any document has 'Approved' status
                    }
                }
            }

            // Return false if no document has 'Approved' status
            return false;
        } catch (error) {
            console.error("Error checking membership status:", error);

            // Display SweetAlert message if an error occurs
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Approval Needed',
                    text: "⚠️ Ooops! Your membership needs Gym Owner's approval. Please contact support or complete any pending steps to proceed.",
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                });
            } else {
                console.error("SweetAlert (Swal) is not defined.");
            }

            return false;
        }
    }
    
        window.ViewProductInfo = async function (productId) {
        try {
            // Fetch the current user ID for membership validation
            const userId = await getCurrentUserId(); // Get userId from the Users collection
            const gymName = document.getElementById('modalGymName').innerText; // Get gym name from GymProfile card
    
            // Check the membership status before proceeding to view product info
            const membershipApproved = await checkMembershipStatus(userId, gymName);
    
            if (!membershipApproved) {
                // Show a custom error message if membership is not approved
                Swal.fire({
                    icon: 'error',
                    title: 'Buy Product Restricted!',
                    text: "⚠️ You cannot Buy a Product until you apply for our plan and get it approved.",
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                    customClass: {
                        popup: 'swal-wide'
                    }
                });
                
                return; // Stop the function if membership is not approved
            }
    
            // Hide any open modals before showing the product info
            $('.modal').modal('hide');
    
            // Fetch product data by ID
            const productDocRef = doc(db, 'Products', productId);
            const productDoc = await getDoc(productDocRef);
    
            if (productDoc.exists()) {
                const productData = productDoc.data();
    
                // Ensure modal elements exist
                const modalProductName = document.getElementById('modalProductName');
                const modalProductPrice = document.getElementById('modalProductPrice');
                const modalProductDescription = document.getElementById('modalProductDescription');
                const modalProductPhoto = document.getElementById('modalProductPhoto');
                const modalProductCategory = document.getElementById('modalProductCategory');
                const modalProductQuantityAvailable = document.getElementById('modalProductQuantity');
                const modalProductQuantityInput = document.getElementById('modalProductQuantityInput');
                const increaseQuantityBtn = document.getElementById('increaseQuantity');
                const decreaseQuantityBtn = document.getElementById('decreaseQuantity');
    
                let availableStock = productData.quantity || 0;
                let selectedQuantity = 1;
                let productPrice = productData.price || 0;
    
                // Display product data
                modalProductName.innerText = productData.name || 'Unnamed Product';
                modalProductPrice.innerText = `₱${productData.price || 'N/A'}`;
                modalProductDescription.innerText = productData.description || 'No description available.';
                modalProductPhoto.src = productData.photoURL || 'default-product.jpg';
                modalProductCategory.innerText = productData.category || 'N/A';
                modalProductQuantityAvailable.innerText = `Available: ${availableStock}`;
    
                // Function to update total price based on selected quantity
                function updatePrice() {
                    const totalPrice = productPrice * selectedQuantity;
                    modalProductPrice.innerText = `₱${totalPrice.toLocaleString()}`; // Format price with commas
                }
    
                // Update the displayed stock and quantity
                function updateQuantity() {
                    modalProductQuantityInput.value = selectedQuantity;
                    modalProductQuantityAvailable.innerText = `Available: ${availableStock - selectedQuantity}`;
                    updatePrice(); // Update the total price when quantity changes
                }
    
                // Increase quantity
                increaseQuantityBtn.addEventListener('click', function () {
                    if (selectedQuantity < availableStock) {
                        selectedQuantity++;
                        updateQuantity();
                    }
                });
    
                // Decrease quantity
                decreaseQuantityBtn.addEventListener('click', function () {
                    if (selectedQuantity > 1) {
                        selectedQuantity--;
                        updateQuantity();
                    }
                });
    
                // Set initial quantity and price
                modalProductQuantityInput.value = selectedQuantity;
                updatePrice(); // Set initial price based on quantity 1
    
                // Show the Product Info modal
                $('#productModal').modal('show');
    
            } else {
                console.error('Product not found!');
            }
        } catch (error) {
            console.error('Error fetching product data:', error);
        }
    };
    
     // Buy Now function with confirmation and success messages
     window.buyNow = async function () {
        try {
            // Ensure user ID is available before proceeding
            const userId = await getCurrentUserId(); // Get userId from the Users collection
    
            // Get product details
            const productName = document.getElementById('modalProductName').innerText;
            const quantityPurchased = document.getElementById('modalProductQuantityInput').value;
            const totalPrice = document.getElementById('modalProductPrice').innerText;
    
            // Assuming gymName is available in the GymProfile card
            const gymName = document.getElementById('modalGymName').innerText; // Get gym name from GymProfile card
    
            // Set product details in confirmation modal
            document.getElementById('confirmProductName').innerText = productName;
            document.getElementById('confirmQuantity').innerText = quantityPurchased;
            document.getElementById('confirmTotalPrice').innerText = totalPrice;
    
            // Show the confirmation modal
            $('#confirmationModal').modal('show');
    
            // Handle confirmation action
            document.getElementById('confirmPurchaseBtn').onclick = async function () {
                try {
                    // Simulate purchase logic (e.g., update stock, etc.)
                    notificationCount++;
                    document.getElementById('notification-count').innerText = notificationCount;
    
                    // Create a new notification with detailed information
                    const newNotification = {
                        message: `You purchased ${quantityPurchased} of ${productName} for ${totalPrice}.`,
                        productName: productName,
                        quantity: quantityPurchased,
                        totalPrice: totalPrice,
                        status: 'Pending Owner Approval',
                        read: false, // Unread notification
                        userId: userId, // Use the current user's userId from the document
                        gymName: gymName, // Storing gymName from GymProfile card
                        notificationId: Date.now().toString(), // Unique ID based on timestamp
                        timestamp: new Date().toISOString() // Add timestamp for ordering or filtering if needed
                    };
    
                    // Save the notification to Firestore under a 'Notifications' collection
                    await addDoc(collection(db, 'Notifications'), newNotification);
    
                    // Save transaction to 'Transactions' collection
                    const newTransaction = {
                        type : 'product',
                        userId: userId, // Storing userId of the customer/user
                        productName: productName,
                        quantity: quantityPurchased,
                        totalPrice: totalPrice,
                        status: 'Pending',
                        gymName: gymName, // Storing gymName from GymProfile card
                        timestamp: new Date().toISOString() // Timestamp of the transaction
                    };
    
                    // Save the transaction to Firestore under a 'Transactions' collection
                    await addDoc(collection(db, 'Transactions'), newTransaction);
    
                    // Close the confirmation modal
                    $('#confirmationModal').modal('hide');
    
                    // Ensure that success modal elements exist before setting innerText
                    const successProductName = document.getElementById('successProductName');
                    const successQuantity = document.getElementById('successQuantity');
                    const successTotalPrice = document.getElementById('successTotalPrice');
    
                    if (successProductName && successQuantity && successTotalPrice) {
                        // Show success modal with details if elements exist
                        successProductName.innerText = productName;
                        successQuantity.innerText = quantityPurchased;
                        successTotalPrice.innerText = totalPrice;
                        $('#successModal').modal('show');
                    } else {
                        console.error('Success modal elements not found.');
                    }
    
                    // Update the notification list
                    await fetchNotifications(userId);
    
                    // Close the product modal after the purchase
                    $('#productModal').modal('hide');
                } catch (error) {
                    console.error('Error saving notification or transaction:', error);
                }
            };
        } catch (error) {
            console.error('Error fetching current user ID:', error);
        }
    };
    

    let notificationCount = 0; // Initialize notificationCount to 0
    document.getElementById('confirmPurchaseBtn').onclick = async function () {
        try {
            // Simulate purchase logic (e.g., update stock, etc.)
            notificationCount++; // Increment the notification count
    
            // Update the notification count display in the UI
            document.getElementById('notification-count').innerText = notificationCount;
    
            // Create a new notification with detailed information
            const newNotification = {
                message: `You purchased ${quantityPurchased} of ${productName} for ${totalPrice}.`,
                productName: productName,
                quantity: quantityPurchased,
                totalPrice: totalPrice,
                status: 'Pending Owner Approval',
                read: false, // Unread notification
                userId: userId, // Use the current user's userId from the document
                gymName: gymName, // Storing gymName from GymProfile card
                notificationId: Date.now().toString(), // Unique ID based on timestamp
                timestamp: new Date().toISOString() // Add timestamp for ordering or filtering if needed
            };
    
            // Save the notification to Firestore under a 'Notifications' collection
            await addDoc(collection(db, 'Notifications'), newNotification);
    
            // Save transaction to 'Transactions' collection
            const newTransaction = {
                type: 'product',
                userId: userId, // Storing userId of the customer/user
                productName: productName,
                quantity: quantityPurchased,
                totalPrice: totalPrice,
                gymName: gymName, // Storing gymName from GymProfile card
                timestamp: new Date().toISOString() // Timestamp of the transaction
            };
    
            // Save the transaction to Firestore under a 'Transactions' collection
            await addDoc(collection(db, 'Transactions'), newTransaction);
    
            // Close the confirmation modal
            $('#confirmationModal').modal('hide');
    
            // Show success modal
            document.getElementById('successProductName').innerText = productName;
            document.getElementById('successQuantity').innerText = quantityPurchased;
            document.getElementById('successTotalPrice').innerText = totalPrice;
            $('#successModal').modal('show');
    
            // Update the notification list (assuming this function exists)
            await fetchNotifications(userId);
    
            // Close the product modal after the purchase
            $('#productModal').modal('hide');
        } catch (error) {
            console.error('Error saving notification or transaction:', error);
        }
    };

    document.getElementById('membershipPlansBtn').addEventListener('click', function() {
        const gymProfileName = document.getElementById('modalGymName').innerText;
        showMembershipPlans(gymProfileName);
    });
    // Function to fetch and display the membership plans
    window.showMembershipPlans = async function(gymProfileName) {
        try {
            // Hide any currently open modals before showing the new one
            $('.modal').modal('hide');
    
            const membershipPlansSection = document.getElementById('membershipPlansSection');
            membershipPlansSection.innerHTML = ''; 
            
            // Define an array of colors for the membership cards
            const cardColors = [
                'linear-gradient(to right, #5B247A, #1BCEDF)',  
                'linear-gradient(to right, #184E68, #57CA85)', 
                'linear-gradient(to right, #F02FC2, #6094EA)'
            ];
        
            // Fetch membership plans where gymName matches gymProfileName
            const membershipPlansQuery = query(
                collection(db, 'MembershipPlans'),
                where('gymName', '==', gymProfileName)
            );
        
            const membershipPlansSnapshot = await getDocs(membershipPlansQuery);
        
            if (!membershipPlansSnapshot.empty) {
                let colorIndex = 0;
                membershipPlansSnapshot.forEach(doc => {
                    const planData = doc.data();
                    const backgroundColor = cardColors[colorIndex % cardColors.length];
                    colorIndex++;
        
                    const planCard = `
                        <div class="plan-card card mb-3" style="background: ${backgroundColor};">
                            <div class="card-body">
                                <h4 class="card-title">${planData.membershipType || 'Unnamed Plan'}</h4>
                                <h5 class="card-title">₱${planData.price || 'N/A'}</h5>
                                <p class="card-text">${planData.description || 'No description available.'}</p>
                                <button class="btn-custom btn-primary" onclick="confirmPlanPurchase('${planData.membershipType}', '${planData.price}', '${planData.membershipDays}', '${doc.id}')">Apply</button>
                            </div>
                        </div>
                    `;
        
                    // Append the plan card to the membership plans section
                    membershipPlansSection.innerHTML += planCard;
                });
            } else {
                membershipPlansSection.innerHTML = '<p>No membership plans found for this gym.</p>';
            }
        
            // Show the membership plans modal using Bootstrap 5's JavaScript API
            const membershipPlansModal = new bootstrap.Modal(document.getElementById('membershipPlansModal'), { backdrop: 'static', keyboard: false });
            membershipPlansModal.show();
        } catch (error) {
            console.error('Error fetching membership plans:', error);
        }
    };  
    
    window.confirmPlanPurchase = function(planType, planPrice, membershipDays, planId) {
        console.log('confirmPlanPurchase triggered for:', planType, planPrice, planId, membershipDays);
        // Set the selected plan details in the confirmation modal
        document.getElementById('selectedPlanType').innerText = planType;
        document.getElementById('selectedPlanPrice').innerText = planPrice;
    
        // Show the confirmation modal using Bootstrap 5's JavaScript API with focus disabled
        const confirmPurchaseModal = new bootstrap.Modal(document.getElementById('confirmPurchaseModal'), {
            backdrop: 'static',
            keyboard: false,
            focus: false // Disable focus trap to avoid conflicts
        });
    
        confirmPurchaseModal.show();
    
        // Set the action for the Confirm Purchase button
        document.getElementById('confirmMemberPurchaseBtn').onclick = async function() {
            try {
                const userId = await getCurrentUserId();
                if (!userId) throw new Error('No user ID found. Please log in.');
    
                const gymName = document.getElementById('modalGymName').innerText;
                if (!gymName) throw new Error('Gym name not available.');
    
                console.log('Proceeding with purchase for:', planType, planPrice, membershipDays, planId, userId, gymName);
    
                // Call the purchasePlan function to save the transaction
                await purchasePlan(planId, planType, planPrice, membershipDays, userId, gymName);
                await displayMembershipNotificationDot();
                confirmPurchaseModal.hide();
    
                // Success modal content
                const successModalContent = `
                    <div id="membershipSuccessModal" class="modal fade" tabindex="-1" role="dialog">
                        <div class="modal-dialog modal-dialog-centered" role="document">
                            <div class="modal-content">
                                <div class="modal-header" style="background-color: #5B247A; color: white; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                                    <h5 class="modal-title">🎉 Membership Purchase Successful!</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="color: white;"></button>
                                </div>
                                <div class="modal-body text-center" style="background-color: #f9f9f9;">
                                    <div style="margin-bottom: 20px;">
                                        <i class="fas fa-check-circle fa-3x" style="color: #28a745;"></i>
                                    </div>
                                    <p style="font-size: 1.1em; color: #333;">
                                        Your membership purchase was successful! Thank you for choosing <strong id="gymNameSuccess" style="color: #5B247A;">${gymName}</strong>.
                                    </p>
                                    <p><strong>Plan:</strong> ${planType}</p>
                                    <p><strong>Price:</strong> ₱${planPrice}</p>
                                    <p style="color: #555;">Please wait for the Gym owner's approval.</p>
                                    <div style="padding: 15px 0; text-align: center;">
                                        <i class="fas fa-clock"></i> <span style="color: #888;">Processing Time: Up to 24 hours</span>
                                    </div>
                                </div>
                                <div class="modal-footer" style="background-color: #f1f1f1; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                                    <button type="button" id="okButton" class="btn btn-success" style="background-color: #5B247A; border: none;">OK</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    
                // Inject success modal into the body (if not already present)
                document.body.insertAdjacentHTML('beforeend', successModalContent);
    
                // Show the success modal with focus disabled
                const membershipSuccessModal = new bootstrap.Modal(document.getElementById('membershipSuccessModal'), {
                    backdrop: 'static',
                    keyboard: false,
                    focus: false // Disable focus trap to prevent recursion
                });
    
                membershipSuccessModal.show();
    
                // Add event listener to the dynamically created OK button to close the modal
                document.getElementById('okButton').addEventListener('click', function() {
                    membershipSuccessModal.hide();  // Hide the success modal when OK is clicked
                    document.getElementById('membershipSuccessModal').remove(); // Clean up the modal from DOM after it's hidden
                });
    
            } catch (error) {
                console.error('Error during membership purchase:', error.message);
                alert('There was an error: ' + error.message);
    
                confirmPurchaseModal.hide();
    
                const errorModal = new bootstrap.Modal(document.getElementById('errorModal'), { backdrop: 'static', keyboard: false });
                errorModal.show();
            }
        };
    };
    

    async function purchasePlan(planId, planType, planPrice, membershipDays, userId, gymName) {
        try {
            console.log('Attempting to save transaction:', { planId, planType, planPrice, membershipDays, userId, gymName });
            const newTransaction = {
                type : 'membership',
                userId: userId,
                planId: planId,
                planType: planType,
                planPrice: planPrice,
                membershipDays: membershipDays, // Save the membership duration
                gymName: gymName,
                purchaseDate: new Date().toISOString(), // Save the current date and time
                status: 'Pending Owner Approval' // Default status for membership
            };
    
            // Save the transaction to Firestore
            await addDoc(collection(db, 'Transactions'), newTransaction);
            console.log('Transaction saved successfully.');
    
        } catch (error) {
            console.error('Error saving transaction:', error);
            throw new Error('Failed to save the transaction');
        }
    }
    


    // Function to display the red dot on the Membership link
    function displayMembershipNotificationDot() {
        const membershipDot = document.getElementById('membershipNotificationDot');
        if (membershipDot) {
            membershipDot.style.display = 'inline'; // Show the red dot
        }
    }
    // Function to hide the red dot when the user navigates to the Membership section
    function clearMembershipNotificationDot() {
        const membershipDot = document.getElementById('membershipNotificationDot');
        if (membershipDot) {
            membershipDot.style.display = 'none'; // Hide the red dot
        }
    }

    // Attach an event listener to the Membership link to clear the notification dot when clicked
    document.querySelector('.nav-link[href="#Membership"]').addEventListener('click', clearMembershipNotificationDot);


    // Function to show the Membership Status modal
    document.querySelector('.nav-link[href="#Membership"]').addEventListener('click', async function () {
        try {
            // Fetch the current user's ID
            const userId = await getCurrentUserId();

            if (!userId) {
                console.error('No user ID found. Please log in.');
                return;
            }

            console.log(`User ID: ${userId}`);

            // Fetch the user's current membership status and history
            await fetchMembershipStatusAndHistory(userId);

            // Show the membership status modal
            $('#membershipStatusModal').modal('show');
        } catch (error) {
            console.error('Error showing membership status:', error);
        }
    });

    // Function to fetch the user's membership status and history
    async function fetchMembershipStatusAndHistory(userId) {
        try {
            const currentMembershipStatusDiv = document.getElementById('currentMembershipStatus');
            const membershipHistoryDiv = document.getElementById('membershipHistory');
    
            currentMembershipStatusDiv.innerHTML = ''; // Clear previous data
            membershipHistoryDiv.innerHTML = ''; // Clear previous history
    
            console.log(`Fetching membership status for userId: ${userId}`);
    
            // Fetch all memberships (current and history)
            const membershipQuery = query(
                collection(db, 'Transactions'),
                where('userId', '==', userId),
                orderBy('purchaseDate', 'desc') // Order by the latest purchase first
            );
    
            const membershipSnapshot = await getDocs(membershipQuery);
    
            if (membershipSnapshot.empty) {
                console.log('No memberships found for this user.');
                currentMembershipStatusDiv.innerHTML = `
                    <div style="text-align: center; padding: 20px; background-color: transparent; border-radius: 10px;">
                        <p style="font-size: 1.2em; color: #888;">No active membership found.</p>
                    </div>`;
                return;
            }
    
            let currentMembershipHtml = '';
            let historyHtml = '<ul style="list-style: none; padding: 0;">';
            const today = new Date(); // Get the current date
    
            membershipSnapshot.forEach(doc => {
                const membership = doc.data();
                console.log('Membership Data:', membership); // Debug the membership data
    
                const purchaseDate = new Date(membership.purchaseDate);
                const durationInDays = membership.duration || 30; // Use duration from Firestore or default to 30 days
                const expirationDate = new Date(purchaseDate.getTime() + durationInDays * 24 * 60 * 60 * 1000);
    
                const membershipHtml = `
                    <li style="margin-bottom: 15px;">
                        <div style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: linear-gradient(135deg, #f7f7f7 0%, #eaeaea 100%);
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.3s;">
                            <h4 style="font-size: 1.5em; font-weight: bold; color: #5B247A; margin-bottom: 8px;">
                                <i class="fas fa-dumbbell" style="color: #1BCEDF;"></i> 
                                ${membership.gymName || 'Unnamed Gym'}
                            </h4>
                            <p style="margin: 8px 0;"><strong>Plan:</strong> ${membership.planType || 'N/A'}</p>
                            <p style="margin: 8px 0;"><strong>Price:</strong> <span style="color: #28a745;">₱${membership.planPrice || 'N/A'}</span></p>
                            <p style="margin: 8px 0;"><strong>Purchased on:</strong> ${purchaseDate.toLocaleDateString()}</p>
                            <p style="margin: 8px 0;"><strong>Expires on:</strong> ${expirationDate.toLocaleDateString()}</p>
                            <p style="margin: 8px 0;"><strong>Status:</strong> 
                                <span style="color: ${membership.status === 'Approved' ? '#28a745' : '#FF5722'};">${membership.status || 'N/A'}</span>
                            </p>
                        </div>
                    </li>
                `;
    
                // Check if the membership has expired
                if (expirationDate < today) {
                    // If expired, add to membership history
                    historyHtml += membershipHtml;
                } else {
                    // If not expired, show as the current membership with countdown
                    currentMembershipHtml = `
                        <div style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.3s;">
                            <h4 style="font-size: 1.7em; font-weight: bold; color: #5B247A; margin-bottom: 10px;">
                                <i class="fas fa-dumbbell" style="color: #1BCEDF;"></i> 
                                ${membership.gymName || 'Unnamed Gym'}
                            </h4>
                            <p style="margin: 10px 0;"><strong>Plan:</strong> ${membership.planType || 'N/A'}</p>
                            <p style="margin: 10px 0;"><strong>Price:</strong> <span style="color: #28a745;">₱${membership.planPrice || 'N/A'}</span></p>
                            <p style="margin: 10px 0;"><strong>Purchased on:</strong> ${purchaseDate.toLocaleDateString()}</p>
                            <p style="margin: 10px 0;"><strong>Expires on:</strong> ${expirationDate.toLocaleDateString()}</p>
                            <p style="margin: 10px 0; font-weight: bold;"><strong>Time Remaining:</strong> <span id="countdown" style="color: #1BCEDF;"></span></p>
                            <p style="margin: 10px 0;"><strong>Status:</strong> 
                                <span style="color: ${membership.status === 'Approved' ? '#28a745' : '#FF5722'};">${membership.status || 'N/A'}</span>
                            </p>
                        </div>
                    `;
    
                    // Render the current membership HTML before starting the countdown
                    currentMembershipStatusDiv.innerHTML = currentMembershipHtml;
    
                    // Now that the HTML is rendered, start the countdown only if the status is approved
                    startCountdown(expirationDate, membership.status);
                }
            });
    
            historyHtml += '</ul>';
    
            // If no current membership, show message
            if (currentMembershipHtml === '') {
                currentMembershipStatusDiv.innerHTML = `
                    <div style="text-align: center; padding: 20px; background-color: transparent; border-radius: 10px;">
                        <p style="font-size: 1.2em; color: #888;">No active membership found.</p>
                    </div>`;
            }
    
            // Render HTML for the membership history
            membershipHistoryDiv.innerHTML = `
                <div style="padding: 20px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h4 style="color: #5B247A; font-weight: bold;">Membership History</h4>
                    ${historyHtml}
                </div>`;
        } catch (error) {
            console.error('Error fetching membership status and history:', error);
        }
    }
        // Global variable to store the interval ID
        let countdownInterval;

        function startCountdown(expirationDate, status) {
            const countdownElement = document.getElementById('countdown');

            // Debugging log to check values passed to the function
            console.log(`Starting countdown with expirationDate: ${expirationDate}, status: ${status}`);

            // Check if the countdown element is present in the DOM
            if (!countdownElement) {
                console.error('Countdown element not found');
                return;
            }

            // Only start the countdown if the status is "Approved"
            if (status !== 'Approved') {
                countdownElement.innerText = status === 'Pending Owner Approval' ? 'Pending Owner Approval' : 'Status not approved';
                console.log('Countdown will not start, status is not approved.');
                return;
            }

            // Clear any existing interval to prevent multiple intervals from running
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }

            // Validate expirationDate to avoid NaN issues
            expirationDate = new Date(expirationDate);
            if (isNaN(expirationDate.getTime())) {
                countdownElement.innerText = 'Invalid expiration date';
                console.error('Invalid expirationDate value:', expirationDate);
                return;
            }

            console.log(`Expiration date calculated as: ${expirationDate.toLocaleString()}`);

            const updateCountdown = () => {
                const currentTime = new Date();
                const timeRemaining = expirationDate - currentTime;

                // Stop countdown and display "Expired" when timeRemaining is zero or less
                if (timeRemaining <= 0) {
                    countdownElement.innerText = 'Expired';
                    clearInterval(countdownInterval); // Clear the interval when expired
                    return;
                }

                // Calculate days, hours, minutes, and seconds remaining
                const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

                // Log the remaining time for debugging
                console.log(`Time remaining: ${days}d ${hours}h ${minutes}m ${seconds}s`);

                // Update countdown text
                countdownElement.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            };

            // Start the countdown interval and assign it to countdownInterval
            countdownInterval = setInterval(updateCountdown, 1000);

            // Immediately call updateCountdown to display the initial time remaining without waiting 1 second
            updateCountdown();
        }

        // DEBUGGING CHECK
        // Call the startCountdown function directly with sample data to test if it's working
        // Replace this with the actual expiration date from your data if testing in your setup
        startCountdown(new Date('2024-11-29T13:48:46+08:00'), 'Approved'); // Test with a specific expiration date and Approved status

    
    async function fetchGymOwnerLocation(gymName) {
        try {
            const gymQuery = query(
                collection(db, 'Users'), 
                where('gymName', '==', gymName), 
                where('role', '==', 'gymowner') 
            );

            const gymSnapshot = await getDocs(gymQuery);

            if (!gymSnapshot.empty) {
                const gymData = gymSnapshot.docs[0].data();
                const gymLocation = gymData.gymLocation || ''; 
                console.log('Gym Location found:', gymLocation);
                return gymLocation;
            } else {
                console.error('No gym found with the given name.');
                return null;
            }
        } catch (error) {
            console.error('Error fetching gym location:', error);
            return null;
        }
    }

    // Function to fetch location coordinates from Nominatim (OpenStreetMap Geocoding service)
    window.fetchGymCoordinates = async function (cityName) {
        const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;

        try {
            console.log(`Fetching coordinates for city: ${cityName}`);
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                console.log('Fetched coordinates:', lat, lon);
                return { lat, lon };
            } else {
                throw new Error('Location not found');
            }
        } catch (error) {
            console.error('Error fetching gym coordinates:', error);
            alert('Could not fetch the location. Please ensure the city name is correct.');
            return null;
        }
    };

    // Initialize the map using Leaflet with OpenStreetMap tiles
    let map; // Global map instance

    window.initMap = function(lat, lon) {
        console.log(`Initializing map with coordinates: lat=${lat}, lon=${lon}`);

        const mapContainer = document.getElementById('map');
        
        if (!mapContainer) {
            console.error('Map container not found in the DOM.');
            return;
        }

        // Ensure the map container is visible (in the modal)
        console.log('Map container found, attempting to initialize map.');

        // Clear any existing map content or reset the map instance
        mapContainer.innerHTML = ""; // Clear any existing map content

        if (map) {
            // If map instance already exists, reset it by removing the map
            map.remove();
            map = null; // Reset the map to null to allow re-initialization
        }

        // Initialize a new map instance
        map = L.map('map').setView([lat, lon], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors'
        }).addTo(map);

        L.marker([lat, lon]).addTo(map)
            .bindPopup('Gym Location')
            .openPopup();

        console.log('Map initialized successfully.');
    };

    // Ensure map initialization happens after the modal is fully displayed
    document.addEventListener("DOMContentLoaded", function () {
        const locationIcon = document.getElementById('locationIcon');

        if (!locationIcon) {
            console.error('Location icon not found in the DOM.');
            return;
        }

        locationIcon.addEventListener('click', async function () {
            try {
                console.log('Location icon clicked');

                // Get the gym name from the modal
                const gymName = document.getElementById('modalGymName').innerText;
                console.log('Gym Name:', gymName);

                if (!gymName) {
                    console.error('Gym name is not provided.');
                    alert('Gym name is not available.');
                    return;
                }

                // Fetch gym owner location using gymName
                const gymLocation = await fetchGymOwnerLocation(gymName);
                console.log('Gym Location (City):', gymLocation);

                if (gymLocation) {
                    const { lat, lon } = await fetchGymCoordinates(gymLocation);
                    console.log('Fetched lat and lon:', lat, lon);

                    if (lat && lon) {
                        // Check if the map modal exists
                        const mapModal = document.getElementById('mapModal');
                        if (!mapModal) {
                            console.error('Map modal not found in the DOM.');
                            return;
                        }

                        // Show the map modal
                        console.log('Showing map modal.');
                        $('#mapModal').modal('show');

                        // Initialize the map after the modal is fully shown
                        $('#mapModal').on('shown.bs.modal', function () {
                            console.log('Map modal fully shown, initializing map.');
                            initMap(lat, lon); // Initialize the map inside the modal
                        });

                        console.log('Map modal shown');
                    } else {
                        console.error('Coordinates not found');
                        alert('Could not fetch gym location.');
                    }
                } else {
                    console.error('Gym location not found');
                    alert('Could not fetch gym location.');
                }
            } catch (error) {
                console.error('Error displaying the map:', error);
            }
        });
    });


    function initializeMessageListener() {
        const messagesRef = collection(db, 'Messages');
        
        // Listen for messages sent to the current user that are unread
        onSnapshot(
            query(messagesRef, where('to', '==', auth.currentUser.uid), where('status', '==', 'unread')),
            (snapshot) => {
                const hasUnreadMessages = !snapshot.empty;
                updateMessageDot(hasUnreadMessages);
            }
        );
    }
    
    function updateMessageDot(hasUnread) {
        const messageIcon = document.getElementById('messageIcon');
        if (messageIcon) {
            if (hasUnread) {
                messageIcon.classList.add('red-dot'); // Show red dot if there are unread messages
            } else {
                messageIcon.classList.remove('red-dot'); // Remove red dot if no unread messages
            }
        }
    }
    
    // Initialize the listener after the user is authenticated
    document.addEventListener("DOMContentLoaded", () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                initializeMessageListener();
            }
        });
    });
    
    // Function to view trainer information, with membership validation
    window.ViewTrainerInfo = async function(trainerId) {
        try {
            const userId = await getCurrentUserId(); // Get userId from the Users collection
            const gymName = document.getElementById('modalGymName').innerText; // Get gym name from GymProfile card
            const membershipApproved = await checkMembershipStatus(userId, gymName);
            console.log("Membership status approved:", membershipApproved); // Debug log
    
            if (!membershipApproved) {
                Swal.fire({
                    icon: 'error',
                    title: 'Booking Not Allowed',
                    text: "⚠️ You cannot book a trainer until you apply for our plan and get it approved.",
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                });
                return;
            }
    
            $('#gymProfileModal').modal('hide');
    
            const trainerDocRef = doc(db, 'Users', trainerId);
            const trainerDoc = await getDoc(trainerDocRef);
    
            if (trainerDoc.exists()) {
                const trainerData = trainerDoc.data();
    
                if (trainerData.status === "Under Review") {
                    showToast("error", "This trainer is currently under review and cannot be booked.");
                    return;
                }
    
                document.getElementById('modalTrainerName').innerText = trainerData.TrainerName || 'N/A';
                document.getElementById('modalTrainerPhoto').src = trainerData.TrainerPhoto || 'default-trainer-photo.jpg';
                document.getElementById('modalTrainerExpertise').innerText = trainerData.Expertise || 'N/A';
                document.getElementById('modalTrainerExperience').innerText = trainerData.Experience || 'N/A';
                document.getElementById('modalTrainerDays').innerText = trainerData.Days || 'N/A';
                document.getElementById('modalTrainerRate').innerText = `₱${trainerData.rate || 'N/A'}`;
    
                const trainerRatingContainer = document.getElementById('trainerRatingContainer');
                if (!trainerRatingContainer) {
                    console.error("Trainer rating container not found in the DOM.");
                    return;
                }
    
                await displayTrainerRating(trainerId, trainerRatingContainer);
    
                const submitRatingButton = document.getElementById("submitRatingButton");
                if (submitRatingButton) {
                    submitRatingButton.setAttribute("data-trainer-id", trainerId);
                }
    
                document.getElementById('bookNowButton').onclick = function() {
                    $('#trainerProfileModal').modal('hide');
                    showBookingConfirmation(trainerData, trainerId, userId, gymName);
                };
    
                $('#trainerProfileModal').modal('show');
            } else {
                showToast("error", "Trainer not found.");
            }
        } catch (error) {
            console.error("Error fetching trainer data:", error);
            showToast("error", "An error occurred while fetching trainer data.");
        }
    };
    
    
    
    // Function to display trainer ratings with dynamic star count updates
    async function displayTrainerRating() {
        try {
            const ratingQuery = query(
                collection(db, "RatingAndFeedback"),
                where("trainerName", "==", document.getElementById("modalTrainerName").innerText)
            );

            const ratingSnapshot = await getDocs(ratingQuery);

            let ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            let totalRating = 0;
            let totalRatingsCount = 0;

            // Count ratings and calculate the total for average calculation
            ratingSnapshot.forEach(doc => {
                const data = doc.data();
                const rating = data.rating;

                if (ratingCounts.hasOwnProperty(rating)) {
                    ratingCounts[rating] += 1;
                    totalRating += rating;
                    totalRatingsCount += 1;
                }
            });

            const averageRating = totalRatingsCount > 0 ? (totalRating / totalRatingsCount).toFixed(1) : 0;

            for (let star = 5; star >= 1; star--) {
                const starCountElement = document.getElementById(`star-${star}-count`);
                if (starCountElement) {
                    starCountElement.innerText = `(${ratingCounts[star]})`;
                }
            }

            const overallRatingElement = document.querySelector("#trainerRating .star-rating .star[data-value='average']");
            const overallRatingCountElement = document.getElementById("average-rating-count");

            if (overallRatingElement) {
                overallRatingElement.innerText = `Overall Rating: ${'★'.repeat(Math.floor(averageRating))}${'☆'.repeat(5 - Math.floor(averageRating))}`;
            }

            if (overallRatingCountElement) {
                overallRatingCountElement.innerText = `(${totalRatingsCount})`;
            }

        } catch (error) {
            console.error("Error fetching ratings:", error);
        }
    }
            // Function to update star icons and rating count in a given container
    window. setTrainerRating = function(container, rating, ratingCount) {
        const stars = container.querySelectorAll('.star'); // Assuming stars are in the #trainerRating container
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });
        // Display the rating count next to the stars
        const ratingCountContainer = container.querySelector('.rating-count');
        if (ratingCountContainer) {
            ratingCountContainer.innerText = `(${ratingCount})`;
        }
    }

    // Toggle function to show/hide the collapsible star rating section
    window.toggleRatings = function(event) {
        event.preventDefault();
        const collapsibleRatings = document.getElementById('collapsibleRatings');
        const toggleLink = document.getElementById('toggleRatings');
        
        if (collapsibleRatings.style.display === 'none') {
            collapsibleRatings.style.display = 'block';
            toggleLink.innerText = 'Show Less';
        } else {
            collapsibleRatings.style.display = 'none';
            toggleLink.innerText = 'Show More';
        }
    };
    document.addEventListener("DOMContentLoaded", function() {
        const auth = getAuth(); // Initialize Firebase Auth
        const rateTrainerButton = document.getElementById("rateTrainerButton");
        const rateStars = document.querySelectorAll("#rateStars .rate-star");
        let selectedRating = 0;
    
        // Check if the "Rate Trainer" button exists
        if (rateTrainerButton) {
            rateTrainerButton.addEventListener("click", function() {
                $('#rateTrainerModal').modal('show');
            });
        }
    
        // Set up star rating selection in the modal if stars exist
        if (rateStars.length > 0) {
            rateStars.forEach(star => {
                star.addEventListener("click", function() {
                    selectedRating = parseInt(this.getAttribute("data-value"));
                    updateStarSelection(selectedRating);
                });
            });
        } else {
            console.warn("No stars found for rating selection.");
        }
    
        // Function to highlight stars based on selection
        function updateStarSelection(rating) {
            if (rateStars.length === 0) {
                console.warn("rateStars array is empty or undefined.");
                return;
            }
            rateStars.forEach((star, index) => {
                star.classList.toggle("selected", index < rating);
            });
        }
    
        // Submit rating and update Firestore if the button exists
        const submitRatingButton = document.getElementById("submitRatingButton");
        if (submitRatingButton) {
            submitRatingButton.addEventListener("click", async function() {
                const feedbackText = document.getElementById("feedbackText").value;
                const authUser = auth.currentUser;
    
                if (!authUser) {
                    showToast("error", "Please log in to submit a rating.");
                    return;
                }
    
                // Get trainerId from the button's data attribute
                const trainerId = this.getAttribute("data-trainer-id");
                if (!trainerId) {
                    console.error("trainerId is not set. Cannot proceed with rating submission.");
                    showToast("error", "Trainer information is missing. Please try again.");
                    return;
                }
    
                try {
                    const gymNameElement = document.getElementById("modalGymName");
                    const gymName = gymNameElement ? gymNameElement.innerText : null;
    
                    if (!gymName) {
                        showToast("error", "Gym name not found in the profile. Please check the gym profile card.");
                        return;
                    }
    
                    // Retrieve the user document from Firestore
                    const userDocRef = doc(db, "Users", authUser.uid);
                    const userDoc = await getDoc(userDocRef);
    
                    if (!userDoc.exists()) {
                        showToast("error", "User data not found.");
                        return;
                    }
    
                    const userData = userDoc.data();
                    const userId = userData.userId;
    
                    // Ensure a rating is selected
                    if (selectedRating > 0) {
                        $('#rateTrainerModal').modal('hide');
    
                        // Save the rating and feedback to Firestore
                        const trainerName = document.getElementById("modalTrainerName").innerText;
                        await addDoc(collection(db, "RatingAndFeedback"), {
                            userId: userId,
                            trainerName: trainerName,
                            gymName: gymName,
                            rating: selectedRating,
                            feedback: feedbackText,
                            timestamp: new Date().toISOString()
                        });
    
                        showToast("success", `You rated ${trainerName} ${selectedRating} stars!`);
    
                        // Update the displayed rating in the main view
                        const trainerRatingContainer = document.getElementById("trainerRatingContainer");
                        await displayTrainerRating(trainerId, trainerRatingContainer);
    
                        // Reset selected rating and feedback field for next use
                        selectedRating = 0;
                        updateStarSelection(selectedRating);
                        document.getElementById("feedbackText").value = "";
    
                    } else {
                        alert("Please select a rating before submitting.");
                    }
                } catch (error) {
                    console.error("Error saving rating and feedback:", error);
                    showToast("error", "Failed to submit rating. Please try again.");
                }
            });
        }
    });
    window.showBookingConfirmation = async function(trainerData, trainerId) {
        const confirmTrainerName = document.getElementById('confirmTrainerName');
        const confirmTrainerRate = document.getElementById('confirmTrainerRate');
        const confirmBookingButton = document.getElementById('confirmBookingButton');
    
        // Get gym name and user ID
        const gymName = document.getElementById('modalGymName').innerText;
        const userId = await getCurrentUserId();
        const price = trainerData.rate || 'N/A';
    
        // Update confirmation modal content
        if (confirmTrainerName) confirmTrainerName.innerText = trainerData.TrainerName || "the trainer";
        if (confirmTrainerRate) confirmTrainerRate.innerText = `₱${trainerData.rate || 'N/A'}`;
    
        // Function to show the notification dot
        function showNotificationDot() {
            document.getElementById('messagesNotification').style.display = 'inline-block';
        }
    
        // Hide the notification dot when messages are viewed
        document.getElementById('messages').addEventListener('click', function() {
            document.getElementById('messagesNotification').style.display = 'none';
        });
    
        // Booking confirmation action
        if (confirmBookingButton) {
            confirmBookingButton.onclick = async function() {
                try {
                    $('#bookingConfirmationModal').modal('hide');
                    showToast("success", `Successfully booked a session with ${trainerData.TrainerName}!`);
    
                    Swal.fire({
                        icon: 'success',
                        title: 'Booking Confirmed',
                        text: `You have successfully booked a session with ${trainerData.TrainerName}.`,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#3085d6',
                    });
    
                    // Save booking and notification
                    await saveBookingToDatabase(trainerData.TrainerName, gymName, userId, price);
                    await saveNotificationToDatabase(`Booked a session with ${trainerData.TrainerName}`, userId);
    
                    // Show the red dot notification
                    showNotificationDot();
    
                    // Fetch notifications to immediately update UI
                    fetchNotifications(userId);
    
                } catch (error) {
                    console.error("Error booking trainer:", error);
                    showToast("error", "Failed to book the trainer. Please try again.");
                }
            };
        }
        $('#bookingConfirmationModal').modal('show');
    };
        // Global function to show the notification dot
        window.showNotificationDot = function() {
            const notificationDot = document.getElementById('messagesNotification');
            if (notificationDot) {
                notificationDot.style.display = 'inline-block';
                console.log("Notification dot is now visible.");
            } else {
                console.error("Notification dot element not found in the DOM.");
            }
        };

        // Event listener to hide the notification dot when the messages are viewed
        document.getElementById('messages').addEventListener('click', function() {
            const notificationDot = document.getElementById('messagesNotification');
            if (notificationDot) {
                notificationDot.style.display = 'none';
                console.log("Notification dot has been hidden.");
            }
        });
        // Save booking to Firestore Transactions collection
        async function saveBookingToDatabase(trainerName, gymName, userId, price, type) {
            try {
                await addDoc(collection(db, "Transactions"), {
                    type : 'Booking_trainer',
                    trainerName,
                    gymName,
                    userId,
                    price,
                    status: "Pending Approval",
                    timestamp: new Date()
                });
            } catch (error) {
                console.error("Error saving booking to Transactions collection:", error);
            }
        }

        // Save notification to Firestore Notifications collection
        async function saveNotificationToDatabase(message, userId) {
            try {
                await addDoc(collection(db, "Notifications"), {
                    message,
                    userId,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error("Error saving notification to Notifications collection:", error);
            }
        }

        
    function showToast(type, message) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            console.error("Toast container element 'toastContainer' not found in the DOM.");
            return; // Exit the function if toastContainer is not found
        }
    
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type === "success" ? "success" : "danger"} border-0`;
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");
    
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
    
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();
    
        toast.addEventListener('hidden.bs.toast', () => {
            toastContainer.removeChild(toast);
        });
    }

        
            

        // Optionally, you can have other modal functions like closeModal()
        window.closeModal=function() {
            $('#gymProfileModal').modal('hide');
        }

        // Function to close the modal
        window.closeModal = function() {
            $('#gymProfileModal').modal('hide'); // Use Bootstrap's modal hide method
        }


              // Fetch notifications from Firestore and sync with localStorage
              async function fetchNotifications(userId) {
                try {
                    console.log('Fetching notifications from Firestore for userId:', userId);
            
                    // Fetch notifications from Firestore for the specific user
                    const notificationsSnapshot = await getDocs(
                        query(collection(db, 'Notifications'), where('userId', '==', userId))
                    );
            
                    const notifications = notificationsSnapshot.docs.map(doc => {
                        const data = doc.data();
                        let timestamp = data.timestamp;
            
                        // Convert Firestore Timestamp or string to Date object
                        if (timestamp && typeof timestamp.toDate === 'function') {
                            timestamp = timestamp.toDate(); // Firestore Timestamp
                        } else if (typeof timestamp === 'string') {
                            timestamp = new Date(timestamp); // String
                        } else if (!timestamp) {
                            timestamp = new Date(); // No timestamp, set to now
                        }
            
                        return {
                            ...data,
                            id: doc.id,
                            timestamp: timestamp
                        };
                    });
            
                    // Sort notifications by timestamp in descending order (newest first)
                    notifications.sort((a, b) => b.timestamp - a.timestamp);
            
                    console.log('Fetched notifications:', notifications);
            
                    // Store notifications in localStorage for persistence across refreshes
                    localStorage.setItem('notifications', JSON.stringify(notifications));
            
                    // Categorize notifications by time
                    const categorizedNotifications = categorizeNotifications(notifications);
            
                    // Display the notifications
                    displayCategorizedNotifications(categorizedNotifications);
            
                    // Update notification count after fetching all notifications
                    const unreadCount = notifications.filter(notification => !notification.read).length;
                    updateNotificationCount(unreadCount);
            
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                }
            }
            
            // Function to categorize notifications based on time differences
            function categorizeNotifications(notifications) {
                const categorized = {
                    'New Notifications': [],
                    'Older Notifications': []
                };
            
                const now = new Date();
            
                notifications.forEach(notification => {
                    const diffInMs = now - notification.timestamp;
                    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            
                    if (diffInDays < 1) { // Less than 1 day
                        categorized['New Notifications'].push(notification);
                    } else { // 1 day or older
                        categorized['Older Notifications'].push(notification);
                    }
                });
            
                return categorized;
            }
            
            // Function to toggle visibility of older notifications
            function toggleOlderNotifications() {
                const olderNotificationsDiv = document.getElementById('olderNotifications');
                const toggleButton = document.getElementById('toggleButton');
            
                if (olderNotificationsDiv.style.display === 'none') {
                    olderNotificationsDiv.style.display = 'block';
                    toggleButton.innerText = 'Hide Older Notifications';
                } else {
                    olderNotificationsDiv.style.display = 'none';
                    toggleButton.innerText = 'Show Older Notifications';
                }
            }
            
            // Function to display categorized notifications
            function displayCategorizedNotifications(categorizedNotifications) {
                const notificationList = document.getElementById('notificationList');
                notificationList.innerHTML = ''; // Clear the list before adding new notifications
            
                for (const [category, notifications] of Object.entries(categorizedNotifications)) {
                    if (notifications.length > 0) {
                        const categoryHeader = document.createElement('h6');
                        categoryHeader.classList.add('category-header'); // Add a class for styling
                        categoryHeader.innerText = category;
                        notificationList.appendChild(categoryHeader);
            
                        // Create a div for older notifications to toggle visibility
                        const isOlder = (category === 'Older Notifications');
                        const notificationContainer = document.createElement('div');
                        notificationContainer.id = isOlder ? 'olderNotifications' : '';
                        notificationContainer.style.display = isOlder ? 'none' : 'block'; // Hide older notifications initially
            
                        notifications.forEach(notification => {
                            const notificationItem = document.createElement('p');
                            notificationItem.classList.add('list-group-item');
            
                            // Calculate how long ago the notification was received
                            const timeAgo = getTimeAgo(notification.timestamp);
            
                            // Use <strong> for unread notifications
                            const message = notification.read ? 
                                notification.message : `<strong>${notification.message}</strong>`;
            
                            notificationItem.innerHTML = `
                                ${message}<br>
                                <small>${timeAgo}</small>
                            `;
            
                            // Add event listener for showing notification details and marking it as read
                            notificationItem.addEventListener('click', () => {
                                markAsRead(notification.id, notification.userId); // Mark notification as read
                                showNotificationDetails(notification); // Show notification details in a modal
                            });
            
                            notificationContainer.appendChild(notificationItem);
                        });
            
                        notificationList.appendChild(notificationContainer);
                    }
                }
            
                // Add toggle button for older notifications
                if (categorizedNotifications['Older Notifications'].length > 0) {
                    const toggleButton = document.createElement('button');
                    toggleButton.id = 'toggleButton';
                    toggleButton.classList.add('btn', 'btn-secondary', 'mt-2');
                    toggleButton.innerText = 'Show Older Notifications';
                    toggleButton.addEventListener('click', toggleOlderNotifications);
                    notificationList.appendChild(toggleButton);
                }
            
                // If no notifications, show a default message
                if (notificationList.innerHTML === '') {
                    notificationList.innerHTML = 
                        '<p class="list-group-item text-center text-muted py-3">No new notifications</p>';
                }
            }

                // Load notifications from localStorage when the page reloads
                function loadNotificationsFromLocalStorage() {
                    const storedNotifications = localStorage.getItem('notifications');
                    if (storedNotifications) {
                        const notifications = JSON.parse(storedNotifications);
                        console.log('Loading notifications from localStorage:', notifications);

                        displayNotifications(notifications);

                        // Update notification count after fetching all notifications
                        const unreadCount = notifications.filter(notification => !notification.read).length;
                        updateNotificationCount(unreadCount);
                    } else {
                        console.warn('No notifications found in localStorage');
                        // Optional: Provide a default message if no notifications are found.
                        document.getElementById('notificationList').innerHTML = 
                            '<p class="list-group-item text-center text-muted py-3">No notifications available</p>';
                    }
                }

                // Display notifications from Firestore or localStorage
                function displayNotifications(notifications) {
                    const notificationList = document.getElementById('notificationList');
                    notificationList.innerHTML = ''; // Clear the list before adding new notifications
                
                    // Categorize notifications into new and older
                    const categorized = categorizeNotifications(notifications);
                
                    // Display new notifications
                    if (categorized['New Notifications'].length > 0) {
                        categorized['New Notifications'].forEach(notification => {
                            const notificationItem = createNotificationItem(notification);
                            notificationList.appendChild(notificationItem);
                        });
                    } else {
                        notificationList.innerHTML = '<p class="list-group-item text-center text-muted py-3">No new notifications</p>';
                    }
                
                    // Add toggle button for older notifications
                    const toggleOlderBtn = document.createElement('button');
                    toggleOlderBtn.innerText = 'Show Older Notifications';
                    toggleOlderBtn.classList.add('btn', 'btn-link'); // Bootstrap styling
                    toggleOlderBtn.onclick = () => {
                        const olderNotificationsContainer = document.getElementById('olderNotifications');
                        if (olderNotificationsContainer.style.display === 'none') {
                            olderNotificationsContainer.style.display = 'block';
                            toggleOlderBtn.innerText = 'Hide Older Notifications';
                        } else {
                            olderNotificationsContainer.style.display = 'none';
                            toggleOlderBtn.innerText = 'Show Older Notifications';
                        }
                    };
                
                    notificationList.appendChild(toggleOlderBtn);
                
                    // Create container for older notifications
                    const olderNotificationsContainer = document.createElement('div');
                    olderNotificationsContainer.id = 'olderNotifications';
                    olderNotificationsContainer.style.display = 'none'; // Hidden by default
                
                    // Display older notifications
                    categorized['Older Notifications'].forEach(notification => {
                        const notificationItem = createNotificationItem(notification);
                        olderNotificationsContainer.appendChild(notificationItem);
                    });
                
                    notificationList.appendChild(olderNotificationsContainer);
                }
                
                // Helper function to create a notification item
                function createNotificationItem(notification) {
                    const notificationItem = document.createElement('p');
                    notificationItem.classList.add('list-group-item');
                
                    // Calculate how long ago the notification was received
                    const timeAgo = getTimeAgo(notification.timestamp);
                    const message = notification.read ? 
                                    notification.message : 
                                    `<strong>${notification.message}</strong>`;
                
                    notificationItem.innerHTML = `
                        ${message}<br>
                        <small>${timeAgo}</small>
                    `;
                
                    // Add event listener for showing notification details and marking it as read
                    notificationItem.addEventListener('click', () => {
                        markAsRead(notification.id, notification.userId); // Mark notification as read
                        showNotificationDetails(notification); // Show notification details in a modal
                    });
                
                    return notificationItem;
                }
                
                // Helper function to calculate relative time (e.g., "12 hours ago")
                function getTimeAgo(timestamp) {
                    const now = new Date();
                    const secondsAgo = Math.floor((now - timestamp) / 1000);

                    const intervals = {
                        year: 31536000,
                        month: 2592000,
                        day: 86400,
                        hour: 3600,
                        minute: 60
                    };

                    for (const interval in intervals) {
                        const timeInterval = Math.floor(secondsAgo / intervals[interval]);
                        if (timeInterval >= 1) {
                            return `${timeInterval} ${interval}${timeInterval > 1 ? 's' : ''} ago`;
                        }
                    }

                    return 'Just now';
                }

                // Update the notification count (unread notifications)
                window.updateNotificationCount = function (unreadCount) {
                    const notificationCountElement = document.getElementById('notification-count');
                    console.log('Updating unread count:', unreadCount); // Debugging

                    notificationCountElement.textContent = unreadCount;

                    if (unreadCount > 0) {
                        notificationCountElement.style.display = 'inline-block';
                    } else {
                        notificationCountElement.style.display = 'none';
                    }
                }

                // Mark a notification as read
                async function markAsRead(notificationId, userId) {
                    try {
                        const notificationRef = doc(db, 'Notifications', notificationId);
                        await updateDoc(notificationRef, { read: true });

                        // Refresh the notifications after marking one as read
                        fetchNotifications(userId);
                    } catch (error) {
                        console.error('Error marking notification as read:', error);
                    }
                }

                // Show detailed notification information in a modal
                function showNotificationDetails(notification) {
                    const timeAgo = getTimeAgo(notification.timestamp);
                    
                    const notificationModal = `
                  <div class="modal fade" id="notificationDetailsModal" tabindex="-1" role="dialog" aria-labelledby="notificationDetailsLabel" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="notificationDetailsLabel">Purchase Receipt</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body" id="notificationDetailsContent">
                                    <p class="gym-name">${notification.gymName}</p>
                                    <p class="ref-number"><strong>Ref. No:</strong> ${notification.notificationId}</p>
                                    <div class="product-info">
                                        <p><strong>Product:</strong> ${notification.productName}</p>
                                        <p><strong>Quantity:</strong> ${notification.quantity}</p>
                                        <p><strong>Total Price:</strong> ${notification.totalPrice}</p>
                                    </div>
                                    <hr>
                                    <p class="footer-info">
                                        Show this receipt to the Gym owner upon collection.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    `;
                    
                    document.body.insertAdjacentHTML('beforeend', notificationModal);
                    $('#notificationDetailsModal').modal('show');
                
                    $('#notificationDetailsModal').on('hidden.bs.modal', function () {
                        this.remove();
                    });
                }
                
                

                // Ensure notifications are fetched after user logs in and on page load
                window.onload = function () {
                    // Load notifications from localStorage immediately on page load
                    loadNotificationsFromLocalStorage();

                    // Get the current user ID and fetch notifications from Firestore
                    getCurrentUserId().then(userId => {
                        fetchNotifications(userId);
                    }).catch(error => {
                        console.error('Error during user authentication:', error);
                    });
                };
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
                fetchGymCoordinates();
            // Fetch trainers when the page loads
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
        // Function to show the global spinner
        function showSpinner() {
            const spinner = document.getElementById('globalSpinner');
            if (spinner) {
                spinner.style.display = 'flex'; // Show spinner
            }
        }

        // Function to hide the global spinner
        function hideSpinner() {
            const spinner = document.getElementById('globalSpinner');
            if (spinner) {
                spinner.style.display = 'none'; // Hide spinner
            }
        }

        // Add event listeners to all navigation links with a 1.5-second delay
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent immediate navigation
                showSpinner();

                // Simulate loading with a 1.5-second delay
                setTimeout(() => {
                    hideSpinner();
                    window.location.href = navLink.href; // Proceed to the link
                }, 500); // 1.5 seconds delay
            });
        });

        // Add event listeners to all buttons with a 2-second delay
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function(event) {
                showSpinner();

                // Simulate loading with a 2-second delay
                setTimeout(() => {
                    hideSpinner();
                }, 1500); // 2 seconds delay
            });
        });

        // Event delegation to handle dynamically generated elements like product cards, membership plans, and view-more buttons
        document.addEventListener('click', function(event) {
            const target = event.target;

            // Check if the target is a "View More" or any dynamically generated button
            if (target.matches('.view-more-btn') || target.matches('.membership-plan-btn') || target.matches('.product-card-btn')) {
                showSpinner();

                // Simulate loading with a 2-second delay for these buttons
                setTimeout(() => {
                    hideSpinner();
                }, 1500); // 2 seconds delay
            }
        });


        let currentChatUserId = null;
        const userCache = {}; // Cache for user details to reduce database calls
        const unreadMessages = new Set(); // Track unread messages
        
        // Initialize the chat modal and clear previous chats
        document.querySelector('a[href="#chatModal"]').addEventListener('click', async function (event) {
            event.preventDefault();
            const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));
            chatModal.show();
            document.querySelector('#usersContainer').innerHTML = '';
            document.querySelector('#inboxContainer').innerHTML = '';
            
            // Load inbox messages
            await loadInboxMessages();
        
            // Check for booked trainers in the Transactions collection and display them
            await displayBookedTrainersInInbox();
        });
        
        // Fetch all users for searching
        async function fetchUsers() {
            const userQuery = query(collection(db, 'Users'));
            try {
                const querySnapshot = await getDocs(userQuery);
                return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error("Error fetching users: ", error);
                return [];
            }
        }
        
        // Display users in the search result
        function displayUsers(users) {
            const inboxContainer = document.querySelector('#inboxContainer');
            const searchResultsContainer = document.querySelector('#searchResultsContainer');
        
            searchResultsContainer.innerHTML = ''; // Clear previous search results
        
            // Limit to a certain number of users displayed
            const maxDisplayCount = 5; // Set the maximum number of results to display
        
            // Display only the first maxDisplayCount users
            users.slice(0, maxDisplayCount).forEach(user => {
                const userElement = document.createElement('div');
                userElement.className = 'user-email';
                userElement.textContent = `${user.username} (${user.email})`;
        
                userElement.addEventListener('click', async () => {
                    startChat(user.id, user.username);
                    searchResultsContainer.innerHTML = ''; // Clear the search results
                    searchResultsContainer.style.display = 'none'; // Hide the search results
                    inboxContainer.style.display = 'block'; // Show the inbox
                    await loadInboxMessages(); // Reload inbox messages
                });
        
                searchResultsContainer.appendChild(userElement); // Append to search results
            });
        
            // Show search results only if there are users found
            searchResultsContainer.style.display = users.length > 0 ? 'block' : 'none';
        }
        async function searchUsers(searchTerm) {
            const inboxContainer = document.getElementById('inboxContainer');
            const searchResultsContainer = document.getElementById('searchResultsContainer');
        
            // If the search term is empty, clear search results, show inbox, and reload inbox messages
            if (!searchTerm.trim()) {
                searchResultsContainer.innerHTML = '';  // Clear search results
                searchResultsContainer.style.display = 'none';  // Hide search results container
                inboxContainer.style.display = 'block';  // Show inbox container
        
                await loadInboxMessages();  // Reload inbox messages to restore the original inbox content
                return;
            }
        
            // If there's a search term, perform the search and display results
            const users = await fetchUsers();
            const filteredUsers = users.filter(user =>
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        
            displayUsers(filteredUsers, true);  // Display results in searchResultsContainer
        }  
        // Start a chat with a selected user
        function startChat(userId, username) {
            currentChatUserId = userId;
            document.getElementById('chatWith').textContent = `${username}`;
            document.querySelector('#searchInput').value = username;
        
            // Ensure the target container exists before modifying it
            const usersContainer = document.querySelector('#inboxContainer'); // Use #inboxContainer if #usersContainer doesn't exist
            if (usersContainer) {
                usersContainer.innerHTML = ''; // Clear the container if it exists
            } else {
                console.error("Element with ID 'inboxContainer' not found in the DOM.");
            }
        
            // Display chat elements
            document.getElementById('chatHeader').style.display = 'block';
            document.getElementById('messagesContainer').style.display = 'block';
            document.getElementById('messageInputContainer').style.display = 'block';
        
            loadMessages(); // Load messages for the chat
        }

        async function getUserDetails(userId) {
            // Return cached data if available
            if (userCache[userId]) {
                return userCache[userId];
            }
        
            try {
                const userRef = doc(db, 'Users', userId);
                const userSnap = await getDoc(userRef);
        
                if (userSnap.exists()) {
                    const userData = userSnap.data();
        
                    // Check if photoURL exists directly in Firestore
                    if (userData.photoURL) {
                        console.log(`Found photoURL in Firestore for user: ${userId}`);
                        userCache[userId] = userData; // Cache user data with Firestore photoURL
                        return userData; // Return data directly if photoURL exists
                    } else {
                        // Fallback to fetching the photo from Firebase Storage
                        const photoPaths = [
                            `profilePictures/${userId}.jpg`,
                            `profilePictures/${userId}.png`
                        ];
                        
                        let photoURL = null;
        
                        for (let path of photoPaths) {
                            try {
                                // Try retrieving the photo URL from Firebase Storage
                                photoURL = await getDownloadURL(storageRef(storage, path));
                                userData.photoURL = photoURL;
                                break; // Stop if photo is found
                            } catch (error) {
                                console.warn(`No photo found at path: ${path}`);
                            }
                        }
        
                        // Log if no photo was found in Storage
                        if (!photoURL) {
                            console.warn(`No photo (jpg or png) found in storage for user: ${userId}`);
                            userData.photoURL = null; // Explicitly set to null if no photo was found
                        }
        
                        // Cache and return user data
                        userCache[userId] = userData;
                        return userData;
                    }
                } else {
                    console.warn("No user found for ID:", userId);
                    return null;
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
                return null;
            }
        }
        
        
        
        let unsubscribeSentMessages = null;
        let unsubscribeReceivedMessages = null;
        
        async function loadMessages() {
            const userId = auth.currentUser.uid;
            const messagesContainer = document.querySelector('#messagesContainer');
            messagesContainer.innerHTML = '';
        
            // Clear any previous listeners if they exist
            if (unsubscribeSentMessages) unsubscribeSentMessages();
            if (unsubscribeReceivedMessages) unsubscribeReceivedMessages();
        
            // Real-time listener for messages sent by the user
            const sentMessagesQuery = query(
                collection(db, 'Messages'),
                where('from', '==', userId),
                where('to', '==', currentChatUserId),
                orderBy('timestamp')
            );
        
            // Real-time listener for messages received by the user
            const receivedMessagesQuery = query(
                collection(db, 'Messages'),
                where('from', '==', currentChatUserId),
                where('to', '==', userId),
                orderBy('timestamp')
            );
        
            // Function to render messages
            const renderMessages = async (messages) => {
                messagesContainer.innerHTML = ''; // Clear previous messages
                for (const messageData of messages) {
                    const fromUser = await getUserDetails(messageData.from);
                    const isSelf = messageData.from === auth.currentUser.uid;
        
                    // Message wrapper
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message ' + (isSelf ? 'self' : 'other');
        
                    // Avatar
                    const avatarElement = document.createElement('div');
                    avatarElement.className = 'avatar';
        
                    if (fromUser && fromUser.photoURL) {
                        // If a photo URL is available, display the image
                        const avatarImage = document.createElement('img');
                        avatarImage.src = fromUser.photoURL;
                        avatarImage.alt = `${fromUser.username}'s avatar`;
                        avatarImage.style.width = '30px';
                        avatarImage.style.height = '30px';
                        avatarImage.style.borderRadius = '50%';
                        avatarElement.appendChild(avatarImage);
                    } else {
                        // Display initials as fallback if photoURL is missing
                        avatarElement.textContent = isSelf ? 'You' : (fromUser ? fromUser.username[0].toUpperCase() : '?');
                    }
        
                    // Message content
                    const messageContent = document.createElement('div');
                    messageContent.className = 'message-content ' + (isSelf ? 'self' : 'other');
                    messageContent.textContent = messageData.message;
        
                    // Timestamp
                    const timestamp = document.createElement('span');
                    timestamp.className = 'timestamp';
        
                    // Ensure timestamp is valid and properly formatted
                    if (messageData.timestamp && messageData.timestamp.toDate) {
                        timestamp.textContent = messageData.timestamp.toDate().toLocaleTimeString();
                    } else {
                        timestamp.textContent = "Invalid Date"; // Placeholder for testing
                    }
        
                    messageContent.appendChild(timestamp);
        
                    // Append elements based on message sender
                    if (isSelf) {
                        messageElement.appendChild(messageContent);
                        messageElement.appendChild(avatarElement);
                    } else {
                        messageElement.appendChild(avatarElement);
                        messageElement.appendChild(messageContent);
                    }
        
                    messagesContainer.appendChild(messageElement);
                }
                messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll to the latest message
            };
        
            // Combine and render messages in real-time
            const messages = [];
            unsubscribeSentMessages = onSnapshot(sentMessagesQuery, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        messages.push({ id: change.doc.id, ...change.doc.data() });
                    }
                });
                messages.sort((a, b) => a.timestamp - b.timestamp);
                renderMessages(messages);
            });
        
            unsubscribeReceivedMessages = onSnapshot(receivedMessagesQuery, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        messages.push({ id: change.doc.id, ...change.doc.data() });
                    }
                });
                messages.sort((a, b) => a.timestamp - b.timestamp);
                renderMessages(messages);
            });
        }

        async function loadInboxMessages() {
            const userId = auth.currentUser.uid; // Ang ID sa user nga naka-log in karon
            const inboxContainer = document.getElementById('inboxContainer');
            inboxContainer.innerHTML = ''; // Limpyohi ang sulod sa inbox

            // Query para kuhaon ang messages diin ang current user either sender o receiver
            const messagesQuery = query(
                collection(db, 'Messages'),
                where('from', '==', userId), // Messages nga gipadala sa user
                orderBy('timestamp', 'desc')
            );
            
            const receivedMessagesQuery = query(
                collection(db, 'Messages'),
                where('to', '==', userId), // Messages nga gidawat sa user
                orderBy('timestamp', 'desc')
            );

            try {
                // Kuhaa ang mga gipadala ug nadawat nga mensahe
                const sentMessagesSnapshot = await getDocs(messagesQuery);
                const receivedMessagesSnapshot = await getDocs(receivedMessagesQuery);

                // Map para i-store ang latest nga message gikan sa matag unique nga user
                const recentMessages = new Map();

                // I-process ang gipadala nga mga mensahe
                sentMessagesSnapshot.forEach((doc) => {
                    const messageData = doc.data();
                    const otherUserId = messageData.to;

                    // Update ang recentMessages map kung bag-o nga message o mas bag-o ang timestamp
                    if (!recentMessages.has(otherUserId) || recentMessages.get(otherUserId).timestamp < messageData.timestamp) {
                        recentMessages.set(otherUserId, { ...messageData, docId: doc.id });
                    }
                });

                // I-process ang nadawat nga mga mensahe
                receivedMessagesSnapshot.forEach((doc) => {
                    const messageData = doc.data();
                    const otherUserId = messageData.from;

                    // Update ang recentMessages map kung bag-o nga message o mas bag-o ang timestamp
                    if (!recentMessages.has(otherUserId) || recentMessages.get(otherUserId).timestamp < messageData.timestamp) {
                        recentMessages.set(otherUserId, { ...messageData, docId: doc.id });
                    }
                });

                // Kung walay nakuha nga message, ipakita nga walay conversation available
                if (recentMessages.size === 0) {
                    const noConversationMessage = document.createElement('div');
                    noConversationMessage.className = 'no-conversation-message';
                    noConversationMessage.textContent = 'Walay Conversation Available';
                    inboxContainer.appendChild(noConversationMessage);
                    return; // Mogawas dayon kung walay messages
                }

                // Ipakita ang matag recent message sa inbox
                for (const [otherUserId, messageData] of recentMessages.entries()) {
                    const otherUser = await getUserDetails(otherUserId); // Kuhaa ang detalye sa user
                    const inboxItem = document.createElement('div');
                    inboxItem.className = 'inbox-item';
                    inboxItem.textContent = `${otherUser.username || otherUser.email}: ${messageData.message}`;

                    // I-display ang unread messages in bold
                    inboxItem.style.fontWeight = 'bold';

                    // Event listener para mo-load ang messages para niining conversation
                    inboxItem.addEventListener('click', () => {
                        startChat(otherUserId, otherUser.username || otherUser.email);
                        inboxItem.style.fontWeight = 'normal'; // Mark as read kung gi-click
                      displayChatHeader(otherUser);
                       
                    });

                    inboxContainer.appendChild(inboxItem);
                }
            } catch (error) {
                console.error("Error fetching inbox messages:", error);
            }
        }

        // Call loadInboxMessages when the chat modal is opened
        document.querySelector('a[href="#chatModal"]').addEventListener('click', loadInboxMessages);

        function displayChatHeader(user) {
            document.getElementById('chatHeader').style.display = 'flex';
            document.getElementById('chatWith').textContent = user.username || user.email;
            document.getElementById('chatUserPhoto').src = user.photoURL || 'default-profile.png'; // Display user photo or a default if unavailable
            document.getElementById('messagesContainer').style.display = 'block';
            document.getElementById('messageInputContainer').style.display = 'block';
        }
        
        // Send a message
        async function sendMessage() {
            const messageInput = document.querySelector('#messageInput');
            const messageText = messageInput.value.trim();
            if (messageText && currentChatUserId) {
                const userId = auth.currentUser.uid;
                try {
                    await addDoc(collection(db, 'Messages'), {
                        from: userId,
                        to: currentChatUserId,
                        message: messageText,
                        timestamp: new Date() // Firebase.Timestamp can also be used for consistency
                    });
                    messageInput.value = ''; // Clear input after sending
                    loadMessages();
                } catch (error) {
                    console.error("Error sending message: ", error); // Log any errors
                }
            }
        }
        
        
        // Event listener for the search input
        document.querySelector('#searchInput').addEventListener('input', (event) => {
            const searchTerm = event.target.value;
            searchUsers(searchTerm);
        });
        
        // Event listener for the send message button
        document.getElementById('sendMessageButton').addEventListener('click', sendMessage);
        
        // Load inbox messages when the chat modal is opened
        document.querySelector('a[href="#chatModal"]').addEventListener('click', loadInboxMessages);
        