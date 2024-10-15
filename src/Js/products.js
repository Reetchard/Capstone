import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js"; // Added getDoc, updateDoc, increment
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

        if (photo) {
            const storageRef = ref(storage, 'productPhotos/' + photo.name);
            try {
                // Upload the photo and get the download URL
                await uploadBytes(storageRef, photo);
                const downloadURL = await getDownloadURL(storageRef);

                // Add product to the Firestore with gym owner userId
                await addProductToCollection(currentUserId, name, price, description, category, quantity, dateAdded, downloadURL);

                // Hide the loading spinner
                loadingSpinner.style.display = 'none';

                showMessage('success', '✅ Hooray! Your product has been successfully added! 🎉');
            } catch (error) {
                loadingSpinner.style.display = 'none'; // Hide spinner
                showMessage('error', `🚨 Oops! There was an error uploading your photo: ${error.message}`);
            }
        } else {
            loadingSpinner.style.display = 'none'; // Hide spinner
            showMessage('error', '📸 Please select a photo to upload.');
        }
    });
});

// Function to get the next productId
async function getNextProductId() {
    try {
        const counterRef = doc(db, 'Counters', 'Products'); // Reference to the product counter document
        const counterDoc = await getDoc(counterRef);

        if (counterDoc.exists()) {
            const currentId = counterDoc.data().currentId;
            const nextId = currentId + 1;

            // Update the counter to increment the value for the next product
            await updateDoc(counterRef, { currentId: increment(1) });

            console.log(`Next productId: ${nextId}`);
            return nextId;
        } else {
            // If the counter document doesn't exist, initialize it with 1
            await setDoc(counterRef, { currentId: 1 });
            console.log(`Initialized productId to 1`);
            return 1;
        }
    } catch (error) {
        console.error("Error getting next productId:", error);
        throw error;
    }
}

// Function to add a product to Firestore
async function addProductToCollection(userId, name, price, description, category, quantity, dateAdded, photoURL) {
    try {
        console.log("Adding product to Firestore...");
        
        // Get the next productId
        const productId = await getNextProductId();

        // Create a reference to the Products collection with the new productId
        const newProductRef = doc(db, 'Products', productId.toString()); // Use the incremented productId as the document ID

        // Set the new product data in Firestore
        await setDoc(newProductRef, {
            productId: productId, // Manually set the incremented productId
            userId: userId,
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
