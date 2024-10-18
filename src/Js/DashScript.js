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
                gymDiv.classList.add('card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes

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
            // Fetch the gym document from Firestore using gymId (which is the document's ID)
            const gymDocRef = doc(db, 'Users', gymId);
            const gymDoc = await getDoc(gymDocRef);
    
            if (gymDoc.exists()) {
                const gymData = gymDoc.data();
                // Get gym name from the gym profile (gym owner's gym)
                const gymProfileName = gymData.gymName;
    
                console.log('Gym Profile Name:', gymProfileName); // Debugging log
    
                // Ensure each element exists before setting innerText
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
                const trainersSection = document.getElementById('trainers-section'); // Trainers section
                const productsSection = document.getElementById('products-section'); // Products section
                const membershipPlansSection = document.getElementById('membership-plans-section'); // Membership Plans section
    
                // Populate modal content with gym details
                if (modalGymName) modalGymName.innerText = gymProfileName || 'N/A';
                if (modalGymPhoto) modalGymPhoto.src = gymData.gymPhoto || 'default-photo.jpg';
                if (modalGymLocation) modalGymLocation.innerText = gymData.gymLocation || 'N/A';
                if (modalGymEquipment) modalGymEquipment.innerText = gymData.gymEquipment || 'N/A';
                if (modalGymPrograms) modalGymPrograms.innerText = gymData.gymPrograms || 'N/A';
                if (modalGymEmail) modalGymEmail.innerText = gymData.email || 'N/A';
                if (modalGymContact) modalGymContact.innerText = gymData.gymContact || 'N/A';
                if (modalPriceRate) modalPriceRate.innerText = gymData.gymPriceRate || 'N/A';
                if (modalGymOpeningTime) {
                    const openingTime = gymData.gymOpeningTime || 'N/A';
                    modalGymOpeningTime.innerText = formatTime(openingTime); // Use formatTime function
                }
    
                if (modalGymClosingTime) {
                    const closingTime = gymData.gymClosingTime || 'N/A';
                    modalGymClosingTime.innerText = formatTime(closingTime); // Use formatTime function
                }
    
                trainersSection.innerHTML = ''; // Clear the trainers section
                productsSection.innerHTML = ''; // Clear the products section
                membershipPlansSection.innerHTML = ''; // Clear the membership plans section
    
                // Fetch trainers whose GymName matches the gym owner's GymName
                const trainersQuery = query(
                    collection(db, 'Users'),
                    where('role', '==', 'trainer'),
                    where('GymName', '==', gymProfileName) // Match trainer's GymName with gymProfileName
                );
                const trainersSnapshot = await getDocs(trainersQuery);
    
                if (!trainersSnapshot.empty) {
                    trainersSnapshot.forEach(doc => {
                        const trainerData = doc.data();
    
                        // Check if the trainer's status is not "Under Review"
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
                

                let notificationCount = 0;
                let notifications = [];
                let currentUserId = 'yourUserId'; // Replace with the actual current user ID
                
                // Function to view product info in a new modal
                window.ViewProductInfo = async function (productId) {
                    try {
                        $('.modal').modal('hide'); // Hide any open modals
                
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
                            modalProductPrice.innerText = ` ₱${productData.price || 'N/A'}`;
                            modalProductDescription.innerText = productData.description || 'No description available.';
                            modalProductPhoto.src = productData.photoURL || 'default-product.jpg'; // Display the product's photo
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
                                modalProductQuantityAvailable.innerText = `Available: ${availableStock - selectedQuantity}`; // Update available stock display
                                updatePrice(); // Update the total price when quantity changes
                            }
                
                            // Increase quantity
                            increaseQuantityBtn.addEventListener('click', function() {
                                if (selectedQuantity < availableStock) {
                                    selectedQuantity++;
                                    updateQuantity();
                                }
                            });
                
                            // Decrease quantity
                            decreaseQuantityBtn.addEventListener('click', function() {
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
                
                // Buy Now function with notification update
                window.buyNow = async function () {
                    try {
                        // Perform purchase logic here
                        const productName = document.getElementById('modalProductName').innerText;
                        const quantityPurchased = document.getElementById('modalProductQuantityInput').value;
                        const totalPrice = document.getElementById('modalProductPrice').innerText;
                
                        // Increment notification count
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
                            userId: currentUserId, // Associate with the current user
                            notificationId: Date.now().toString(), // Unique ID based on timestamp
                            timestamp: new Date().toISOString() // Add timestamp for ordering or filtering if needed
                        };
                
                        // Save the notification to Firestore under a 'Notifications' collection
                        await addDoc(collection(db, 'Notifications'), newNotification);
                
                        // Optionally show a success message to the user (e.g., in the modal)
                        alert("Purchase successful!");
                
                        // Update the notification list
                        await fetchNotifications(currentUserId);
                
                        // Close the modal after the purchase
                        $('#productModal').modal('hide');
                    } catch (error) {
                        console.error('Error saving notification:', error);
                    }
                };
                // Function to update the notification count displayed in the UI
                function updateNotificationCount(unreadCount) {
                    const notificationCountElement = document.getElementById('notification-count');

                    // Set the text of the notification count
                    notificationCountElement.textContent = unreadCount;

                    // Show or hide the notification badge based on the unread count
                    if (unreadCount > 0) {
                        notificationCountElement.style.display = 'inline-block';  // Show badge if there are unread notifications
                    } else {
                        notificationCountElement.style.display = 'none';  // Hide badge if no unread notifications
                    }
                }

                // Fetch notifications for the current user
                async function fetchNotifications(currentUserId) {
                    try {
                        // Your logic to fetch notifications from Firestore or any backend
                        const notifications = await fetchUserNotifications(currentUserId); // Fetch notifications from Firestore or backend
                        
                        // Assuming you update the UI with notifications
                        const unreadCount = notifications.filter(notification => notification.status === 'unread').length;
                        
                        updateNotificationCount(unreadCount); // Update notification badge count
                    
                        const notificationList = document.getElementById('notificationList');
                        notificationList.innerHTML = ''; // Clear the list before adding new notifications
                        
                        if (notifications.length > 0) {
                            notifications.forEach(notification => {
                                const notificationItem = document.createElement('p');
                                notificationItem.classList.add('dropdown-item');
                                
                                notificationItem.textContent = notification.message;
                
                                // Add click event to mark as read
                                notificationItem.onclick = () => {
                                    markAsRead(notification.id, currentUserId); // Mark notification as read
                                };
                
                                notificationList.appendChild(notificationItem);
                            });
                        } else {
                            notificationList.innerHTML = '<p class="dropdown-item text-center text-muted py-3">No new notifications</p>';
                        }
                    } catch (error) {
                        console.error('Error fetching notifications:', error);
                    }
                }
                
                // Update the notification dropdown with new notifications
                function updateNotificationList() {
                    const notificationList = document.getElementById('notificationList');
                    notificationList.innerHTML = ''; // Clear the existing list
                
                    if (notifications.length === 0) {
                        notificationList.innerHTML = '<p class="dropdown-item">No new notifications</p>';
                    } else {
                        notifications.forEach((notification, index) => {
                            const notificationItem = document.createElement('p');
                            notificationItem.classList.add('dropdown-item');
                            notificationItem.innerText = notification.message;
                
                            // If notification is unread, apply a bold style
                            if (!notification.read) {
                                notificationItem.style.fontWeight = 'bold';
                            }
                
                            // Add click event to mark as read and display notification details
                            notificationItem.addEventListener('click', () => {
                                markAsRead(notification.notificationId);
                                showNotificationDetails(notification.notificationId);
                            });
                            notificationList.appendChild(notificationItem);
                        });
                    }
                
                    // Update notification count based on unread notifications
                    const unreadCount = notifications.filter(notification => !notification.read).length;
                    document.getElementById('notification-count').innerText = unreadCount;
                
                    // Hide notification badge if no unread notifications
                    if (unreadCount === 0) {
                        document.getElementById('notification-count').style.display = 'none';
                    } else {
                        document.getElementById('notification-count').style.display = 'block';
                    }
                }
                                
                // Show detailed notification information in a modal
                function showNotificationDetails(notificationId) {
                    const notification = notifications.find(n => n.notificationId === notificationId);
                
                    const notificationModal = `
                        <div class="modal fade" id="notificationDetailsModal" tabindex="-1" role="dialog" aria-labelledby="notificationDetailsLabel" aria-hidden="true">
                            <div class="modal-dialog" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="notificationDetailsLabel">Purchase Details</h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <p>Product: ${notification.productName}</p>
                                        <p>Quantity: ${notification.quantity}</p>
                                        <p>Total Price: ${notification.totalPrice}</p>
                                        <p>Status: ${notification.status}</p>
                                        <p>Please wait for the owner's approval. You will receive a receipt ticket for the payment.</p>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                
                    // Append and show the modal in the DOM
                    document.body.insertAdjacentHTML('beforeend', notificationModal);
                    $('#notificationDetailsModal').modal('show');
                
                    // Clean up the modal after closing
                    $('#notificationDetailsModal').on('hidden.bs.modal', function () {
                        this.remove();
                    });
                }
                
                // Load notifications and update list when the page loads
                window.onload = function() {
                    fetchNotifications(currentUserId);
                };
            
              // Mark notification as read and update list
                async function markAsRead(notificationId) {
                    try {
                        const notificationRef = doc(db, 'Notifications', notificationId);
                        await updateDoc(notificationRef, { read: true });

                        // Update the local notifications array
                        notifications = notifications.map(notification =>
                            notification.notificationId === notificationId
                                ? { ...notification, read: true }
                                : notification
                        );

                        // Save updated notifications to localStorage (optional)
                        localStorage.setItem('notifications', JSON.stringify(notifications));

                        // Refresh the notification list
                        updateNotificationList();
                    } catch (error) {
                        console.error('Error marking notification as read:', error);
                    }
                }


                
                                    
                    // Fetch products and render them
                    const productsQuery = query(
                        collection(db, 'Products'),
                        where('gymName', '==', gymProfileName) // Adjust 'gymName' accordingly if needed
                    );
                    const productsSnapshot = await getDocs(productsQuery);

                    if (!productsSnapshot.empty) {
                        productsSnapshot.forEach(doc => {
                            const productData = doc.data();

                            // Create the product card with additional fields (category, quantity, date added)
                            const productCard = `
                                <div class="trainer-card">
                                    <img src="${productData.photoURL || 'default-product.jpg'}" alt="Product Photo" class="product-photo">
                                    <h5>${productData.name || 'Unnamed Product'}</h5>
                                    <!-- <p>Category: ${productData.category || 'N/A'}</p> -->
                                    <!-- <p>Price: ${productData.price || 'N/A'}</p> -->
                                    <button class="btn-custom btn-primary" onclick="ViewProductInfo('${doc.id}')">Check info</button>
                                </div>
                            `;

                            // Append the card to the container
                            productsSection.innerHTML += productCard;
                        });
                    } else {
                        productsSection.innerHTML = '<p>No products found for this gym.</p>';
                    }


                // Fetch membership plans where gymName matches gymProfileName
                const membershipPlansQuery = query(
                    collection(db, 'MembershipPlans'),
                    where('gymName', '==', gymProfileName) // Match membership plans by gymName
                );
    
                const membershipPlansSnapshot = await getDocs(membershipPlansQuery);
    
                // Debugging log
                console.log('Membership Plans Snapshot:', membershipPlansSnapshot);
    
                if (!membershipPlansSnapshot.empty) {
                    membershipPlansSnapshot.forEach(doc => {
                        const planData = doc.data();
                        console.log('Plan Data:', planData); // Debugging log for each plan
    
                        // Create the plan card HTML
                        const planCard = `
                            <div class="plan-card card mb-3">
                                <div class="card-body">
                                    <h4 class="card-title">${planData.membershipType || 'Unnamed Plan'}</h4>
                                    <p class="card-text">${planData.description || 'No description available.'}</p>
                                    <p class="card-text">Price: ₱${planData.price || 'N/A'}</p>
                                    <button class="btn-custom btn-primary" onclick="selectPlan('${doc.id}')">Apply</button>
                                </div>
                            </div>
                        `;
    
                        // Append the plan card to the membership plans section
                        membershipPlansSection.innerHTML += planCard;
                    });
                } else {
                    console.log('No membership plans found.');
                    membershipPlansSection.innerHTML = '<p>No membership plans found for this gym.</p>';
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
                showCheckoutModal();
                viewProducts();
            // Fetch trainers when the page loads
    });

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
