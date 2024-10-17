import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDocs ,getDoc , orderBy, query , limit } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js"; // Added getDoc, updateDoc, increment
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-storage.js";

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

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

let currentUserId = null; // Will hold the current gym owner's userId

// Check if a user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, get the userId
        currentUserId = user.uid;
        console.log("Authenticated user ID:", currentUserId);
    } else {
        // User is not signed in, redirect to login or show an error
        window.location.href = 'login.html'; // Redirect to login if user is not authenticated
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const loadingSpinner = document.getElementById('loadingSpinner');

    document.getElementById('productForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        // Ensure the current user is authenticated before proceeding
        if (!currentUserId) {
            showMessage('error', 'You must be logged in to add products.');
            return;
        }

        // Show the loading spinner
        loadingSpinner.style.display = 'flex';

        const photo = document.getElementById('productPhoto').files[0];
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value).toFixed(2);
        const description = document.getElementById('productDescription').value;
        const category = document.getElementById('productCategory').value;
        const quantity = parseInt(document.getElementById('productQuantity').value, 10);
        const dateAdded = new Date().toISOString(); // Current date

        try {
            // Step 1: Fetch the GymName of the current gym owner from Firestore
            const userDocRef = doc(db, 'Users', currentUserId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const gymOwnerData = userDoc.data();
                const gymName = gymOwnerData.gymName || 'Unknown Gym'; // Fallback in case gymName is not found

                if (photo) {
                    const storageRef = ref(storage, 'productPhotos/' + photo.name);

                    // Upload the photo and get the download URL
                    await uploadBytes(storageRef, photo);
                    const downloadURL = await getDownloadURL(storageRef);

                    // Step 2: Add product to Firestore with userId and gymName
                    await addProductToCollection(currentUserId, gymName, name, price, description, category, quantity, dateAdded, downloadURL);

                    // Hide the loading spinner
                    loadingSpinner.style.display = 'none';
                    showMessage('success', '✅ Hooray! Your product has been successfully added! 🎉');
                } else {
                    loadingSpinner.style.display = 'none'; // Hide spinner
                    showMessage('error', '📸 Please select a photo to upload.');
                }
            } else {
                loadingSpinner.style.display = 'none'; // Hide spinner
                showMessage('error', 'User not found. Please check your account.');
            }
        } catch (error) {
            loadingSpinner.style.display = 'none'; // Hide spinner
            showMessage('error', `🚨 Oops! There was an error: ${error.message}`);
        }
    });
});

// Function to get the next productId
async function addProduct(productData) {
    try {
        const productsRef = collection(db, 'Products');

        // Query to get the product with the highest productId
        const latestProductQuery = query(productsRef, orderBy('productId', 'desc'), limit(1));
        const querySnapshot = await getDocs(latestProductQuery);

        let newProductId = 1; // Default to 1 if no products exist

        if (!querySnapshot.empty) {
            const lastProduct = querySnapshot.docs[0];
            const lastProductId = lastProduct.data().productId;

            newProductId = lastProductId + 1; // Increment the last productId
        }

        // Add the new product with the incremented productId
        const newProductRef = await addDoc(productsRef, {
            ...productData,
            productId: newProductId
        });

        console.log(`Added new product with ID: ${newProductId} (document ID: ${newProductRef.id})`);
        return newProductId;
    } catch (error) {
        console.error("Error adding new product:", error);
        throw error;
    }
}

// Function to add a product to Firestore
async function addProductToCollection(userId, gymName, name, price, description, category, quantity, dateAdded, photoURL) {
    try {
        console.log("Adding product to Firestore...");

        // Get the next productId
        const productId = await addProduct();

        // Create a reference to the Products collection with the new productId
        const newProductRef = doc(db, 'Products', productId.toString()); // Use the incremented productId as the document ID

        // Set the new product data in Firestore
        await setDoc(newProductRef, {
            productId: productId,      // Manually set the incremented productId
            userId: userId,            // Set the userId as the gym owner's UID (currentUserId)
            gymName: gymName,          // Set the gymName of the gym owner
            name: name,
            price: price,
            description: description,
            category: category,
            quantity: quantity,
            dateAdded: dateAdded,
            photoURL: photoURL
        });

        console.log(`Product successfully added with productId: ${productId}`);
    } catch (error) {
        console.error("Error adding product to Firestore:", error);
        throw new Error(`Error adding product to database: ${error.message}`);
    }
}

// Function to display success/error messages
function showMessage(type, message) {
    const messageContainer = document.getElementById('messageContainer');

    if (!messageContainer) {
        console.error('messageContainer not found in the DOM.');
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message alert-${type}`;
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);
    messageContainer.style.display = 'block';

    // Hide the message after a few seconds
    setTimeout(() => {
        if (messageElement) {
            messageContainer.removeChild(messageElement);
        }
        if (messageContainer.childElementCount === 0) {
            messageContainer.style.display = 'none'; // Hide the container if empty
        }
    }, 5000); // Hide message after 5 seconds
}
