import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
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

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('productForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const photo = document.getElementById('productPhoto').files[0];
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value).toFixed(2);
        const description = document.getElementById('productDescription').value;
        const category = document.getElementById('productCategory').value;
        const quantity = parseInt(document.getElementById('productQuantity').value, 10);
        const dateAdded = new Date().toISOString(); // Get current date

        if (photo) {
            const storageRef = ref(storage, 'productPhotos/' + photo.name);
            try {
                // Upload the photo and get the download URL
                await uploadBytes(storageRef, photo);
                const downloadURL = await getDownloadURL(storageRef);

                const action = confirm("Do you want to display this product on the Dashboard?")
                    ? addProductToDashboard 
                    : addProductToListed;

                action(name, price, description, category, quantity, dateAdded, downloadURL);
            } catch (error) {
                showMessage('error', `🚨 Oops! There was an error uploading your photo: ${error.message}`);
            }
        } else {
            showMessage('error', '📸 Please select a photo to upload.');
        }
    });
});

// Function to add product to Dashboard
async function addProductToDashboard(name, price, description, category, quantity, dateAdded, photoURL) {
    await addProductToCollection(name, price, description, category, quantity, dateAdded, photoURL);
}

// Function to add product to Listed Products
async function addProductToListed(name, price, description, category, quantity, dateAdded, photoURL) {
    await addProductToCollection(name, price, description, category, quantity, dateAdded, photoURL);
}

// Helper function to add product to Firestore
async function addProductToCollection(name, price, description, category, quantity, dateAdded, photoURL) {
    try {
        const newProductRef = doc(collection(db, 'Products'));
        await setDoc(newProductRef, {
            productId: newProductRef.id,
            name,
            price,
            description,
            category,
            quantity,
            dateAdded,
            photoURL
        });
        showMessage('success', '✅ Hooray! Your product has been successfully added! 🎉');
    } catch (error) {
        showMessage('error', `🚨 Something went wrong while adding your product: ${error.message}`);
    }
}

// Function to display products in the table
function displayProduct(data) {
    const tableBody = document.getElementById('productTableBody');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><img src="${data.photoURL || 'default-image.png'}" alt="${data.name}" style="width: 50px; height: auto;"></td>
        <td>${data.name}</td>
        <td>$${data.price}</td>
        <td>${data.description}</td>
        <td>${data.category}</td>
        <td>${data.quantity}</td>
        <td>${data.dateAdded}</td>
        <td>
            <button class="btn btn-primary buy-btn" data-key="${data.productId}">Buy</button>
            <button class="btn btn-primary">Edit</button>
            <button class="btn btn-danger">Delete</button>
        </td>
    `;
    tableBody.appendChild(newRow);
}
// Function to handle product purchases
window.handleBuyProduct= async function (productKey, currentQuantity) {
    if (currentQuantity > 0) {
        const newQuantity = currentQuantity - 1;
        try {
            await updateDoc(doc(db, 'Products', productKey), { quantity: newQuantity });
            updateCartCount();
            showMessage('success', '✅ Congratulations! You successfully purchased the product! 🎉');
        } catch (error) {
            showMessage('error', `🚨 Error updating product quantity: ${error.message}`);
        }
    } else {
        showMessage('error', '🚫 This product is currently out of stock. Please check back later!');
    }
}

// Function to update the cart count (this is a placeholder)
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    cartCount.textContent = parseInt(cartCount.textContent) + 1; // Increment cart count
}

// Function to display success/error messages

function showMessage(type, message) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.createElement('div');
    
    messageElement.className = `message alert-${type}`;
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);
    messageContainer.style.display = 'block';

    // Hide the message after a few seconds
    setTimeout(() => {
        messageContainer.removeChild(messageElement);
        if (messageContainer.childElementCount === 0) {
            messageContainer.style.display = 'none'; // Hide the container if empty
        }
    }, 5000); // Hide message after 5 seconds
}

window.showConfirmation = function(message, callback) {
    document.getElementById('confirmationMessage').textContent = message;
    
    const confirmButton = document.getElementById('confirmButton');
    confirmButton.onclick = function() {
        callback();
        $('#customConfirmationModal').modal('hide'); // Hide the modal
    };
    
    $('#customConfirmationModal').modal('show'); // Show the modal
}

