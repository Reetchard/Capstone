const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    databaseURL: "https://capstone40-project-default-rtdb.firebaseio.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('productForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const photo = document.getElementById('productPhoto').files[0];
        const name = document.getElementById('productName').value;
        const price = document.getElementById('productPrice').value;
        const description = document.getElementById('productDescription').value;
        const category = document.getElementById('productCategory').value;
        const quantity = document.getElementById('productQuantity').value;
        const dateAdded = document.getElementById('productDate').value;

        if (photo) {
            const storageRef = firebase.storage().ref('productPhotos/' + photo.name);
            const uploadTask = storageRef.put(photo);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    // Handle progress
                }, 
                (error) => {
                    alert('Error uploading photo: ' + error.message);
                }, 
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        const action = confirm("Do you want to display this product on the Dashboard?") 
                            ? addProductToDashboard 
                            : addProductToListed;

                        action(name, price, description, category, quantity, dateAdded, downloadURL);
                    });
                }
            );
        } else {
            alert('Please select a photo.');
        }
    });

    loadProducts();
});

function addProductToDashboard(name, price, description, category, quantity, dateAdded, photoURL) {
    const newProductRef = database.ref('dashboard/products').push();
    newProductRef.set({
        name,
        price,
        description,
        category,
        quantity,
        dateAdded,
        photoURL
    })
    .then(() => alert('Product added to Dashboard successfully'))
    .catch((error) => alert('Error adding product to Dashboard: ' + error.message));
}

function addProductToListed(name, price, description, category, quantity, dateAdded, photoURL) {
    const newProductRef = database.ref('listed/products').push();
    newProductRef.set({
        name,
        price,
        description,
        category,
        quantity,
        dateAdded,
        photoURL
    })
    .then(() => {
        alert('Product added to Listed Products successfully');
        displayProduct(name, price, description, category, quantity, dateAdded, photoURL);
    })
    .catch((error) => alert('Error adding product to Listed Products: ' + error.message));
}

function displayProduct(name, price, description, category, quantity, dateAdded, photoURL) {
    const tableBody = document.getElementById('productTableBody');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }

    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td><img src="${photoURL || 'default-image.png'}" alt="${name}" style="width: 50px; height: auto;"></td>
        <td>${name}</td>
        <td>$${price}</td>
        <td>${description}</td>
        <td>${category}</td>
        <td>${quantity}</td>
        <td>${dateAdded}</td>
        <td>
            <button class="btn btn-primary buy-btn" data-key="${childSnapshot.key}">Buy</button>
            <button class="btn btn-primary">Edit</button>
            <button class="btn btn-danger">Delete</button>
        </td>
    `;

    tableBody.appendChild(newRow);
}

function loadProducts() {
    const tableBody = document.getElementById('productTableBody');
    if (!tableBody) {
        console.error('Element with ID "productTableBody" not found.');
        return;
    }

    database.ref('dashboard/products').once('value', function(snapshot) {
        tableBody.innerHTML = ''; // Clear the table body before reloading

        snapshot.forEach(function(childSnapshot) {
            const data = childSnapshot.val();
            displayProduct(data.name, data.price, data.description, data.category, data.quantity, data.dateAdded, data.photoURL);

            // Attach click event listener to Buy buttons
            document.querySelectorAll('.buy-btn').forEach(button => {
                button.addEventListener('click', function() {
                    handleBuyProduct(childSnapshot.key, data.quantity);
                });
            });
        });
    })
    .catch(error => console.error('Error loading products:', error));
}

function handleBuyProduct(productKey, currentQuantity) {
    if (currentQuantity > 0) {
        const newQuantity = currentQuantity - 1;
        database.ref('dashboard/products/' + productKey).update({ quantity: newQuantity })
        .then(() => {
            updateCartCount();
            alert('Product purchased successfully.');
        })
        .catch(error => alert('Error updating product quantity: ' + error.message));
    } else {
        alert('Product is out of stock.');
    }
}

function updateCartCount() {
    // This is a placeholder; you should adjust according to your cart system
    const cartCount = document.getElementById('cartCount');
    cartCount.textContent = parseInt(cartCount.textContent) + 1; // Increment cart count
}
