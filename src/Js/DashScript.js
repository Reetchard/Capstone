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
                
                // Function to display product information and show modal
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
                        const gymName = document.getElementById('modalGymName').innerText; // You can adjust the ID if needed
                
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
                                    notificationId: Date.now().toString(), // Unique ID based on timestamp
                                    timestamp: new Date().toISOString() // Add timestamp for ordering or filtering if needed
                                };
                
                                // Save the notification to Firestore under a 'Notifications' collection
                                await addDoc(collection(db, 'Notifications'), newNotification);
                
                                // Save transaction to 'Transactions' collection
                                const newTransaction = {
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
                async function fetchNotifications(userId) {
                    try {
                        // Fetch notifications from Firestore for the specific user
                        const notificationsSnapshot = await getDocs(
                            query(collection(db, 'Notifications'), where('userId', '==', userId))
                        );
                
                        const notifications = notificationsSnapshot.docs.map(doc => ({
                            ...doc.data(),
                            id: doc.id
                        }));
                
                        // Display or process notifications here
                        const notificationList = document.getElementById('notificationList');
                        notificationList.innerHTML = ''; // Clear the list before adding new notifications
                
                        let unreadCount = 0; // Track unread notifications count
                
                        if (notifications.length > 0) {
                            notifications.forEach(notification => {
                                const notificationItem = document.createElement('p');
                                notificationItem.classList.add('dropdown-item');
                                notificationItem.textContent = notification.message;
                
                                if (!notification.read) {
                                    notificationItem.style.fontWeight = 'bold'; // Bold style for unread notifications
                                    unreadCount++; // Increment unread count
                                }
                
                                // Add event listener for showing notification details and marking it as read
                                notificationItem.addEventListener('click', () => {
                                    markAsRead(notification.id, userId); // Mark notification as read
                                    showNotificationDetails(notification); // Show notification details in a modal
                                });
                
                                notificationList.appendChild(notificationItem);
                            });
                        } else {
                            notificationList.innerHTML = '<p class="dropdown-item text-center text-muted py-3">No new notifications</p>';
                        }
                
                        // Update notification count after fetching all notifications
                        updateNotificationCount(unreadCount);
                
                    } catch (error) {
                        console.error('Error fetching notifications:', error);
                    }
                }
                window.updateNotificationCount = function (unreadCount) {
                    const notificationCountElement = document.getElementById('notification-count');
                
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
                
                        fetchNotifications(userId); // Refresh the notifications after marking one as read
                    } catch (error) {
                        console.error('Error marking notification as read:', error);
                    }
                }
                
                // Show detailed notification information in a modal
                function showNotificationDetails(notification) {
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
                
                    document.body.insertAdjacentHTML('beforeend', notificationModal);
                    $('#notificationDetailsModal').modal('show');
                
                    $('#notificationDetailsModal').on('hidden.bs.modal', function () {
                        this.remove();
                    });
                }
                
                // Ensure notifications are fetched after user logs in and on page load
                window.onload = function () {
                    // Get the current user ID and fetch notifications
                    getCurrentUserId().then(userId => {
                        fetchNotifications(userId);
                    }).catch(error => {
                        console.error('Error during user authentication:', error);
                    });
                };
                let cart = []; // This array will hold the cart items
                let totalCartAmount = 0;
                
                window.addToCart = function(productId, productName, productPrice, productPhoto, quantity) {
                    // Check if the product is already in the cart
                    const existingProduct = cart.find(item => item.productId === productId);
                
                    if (existingProduct) {
                        // If product is already in the cart, update its quantity
                        existingProduct.quantity += quantity;
                    } else {
                        // Otherwise, add the new product to the cart
                        cart.push({
                            productId: productId,
                            productName: productName,
                            productPrice: productPrice,
                            productPhoto: productPhoto || 'default-product.jpg',
                            quantity: quantity
                        });
                    }
                
                    // Update cart total price
                    totalCartAmount += productPrice * quantity;
                
                    // Update cart icon badge or modal (for cart count)
                    updateCartCount(cart.length);
                }
                
                // Function to update cart count badge on cart icon
                function updateCartCount(count) {
                    const cartCountElement = document.getElementById('cart-count');
                    cartCountElement.textContent = count;
                    cartCountElement.style.display = count > 0 ? 'inline-block' : 'none';
                }
                
                // Function to display cart items in the modal
                function displayCartItems() {
                    const cartProductsList = document.getElementById('cartProductsList');
                    const cartTotalPrice = document.getElementById('cartTotalPrice');
                
                    // Clear the current list
                    cartProductsList.innerHTML = '';
                
                    if (cart.length === 0) {
                        cartProductsList.innerHTML = '<p class="text-muted">No products in the cart.</p>';
                        cartTotalPrice.innerText = '₱0';
                    } else {
                        cart.forEach(item => {
                            const productElement = document.createElement('div');
                            productElement.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-3');
                            productElement.innerHTML = `
                                <div class="d-flex align-items-center">
                                    <img src="${item.productPhoto}" alt="${item.productName}" class="img-fluid" style="width: 50px; height: 50px; margin-right: 10px;">
                                    <div>
                                        <h6>${item.productName}</h6>
                                        <small class="text-muted">Quantity: ${item.quantity}</small><br>
                                        <small class="text-muted">Price: ₱${item.productPrice.toLocaleString()}</small>
                                    </div>
                                </div>
                                <span>₱${(item.productPrice * item.quantity).toLocaleString()}</span>
                            `;
                            cartProductsList.appendChild(productElement);
                        });
                
                        // Update total cart price
                        cartTotalPrice.innerText = `₱${totalCartAmount.toLocaleString()}`;
                    }
                }
                
                // Event listener for showing the cart modal
                document.getElementById('cartBtn').addEventListener('click', function () {
                    displayCartItems(); // Display cart items when the cart modal is opened
                });
                
                
                                    
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
