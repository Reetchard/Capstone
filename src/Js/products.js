import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { where,getFirestore, collection, addDoc, doc, setDoc, getDocs, getDoc, orderBy, query, limit, deleteDoc,updateDoc } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
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

let currentUserId = null;

document.addEventListener("DOMContentLoaded", async function () {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid; // Set the global user ID
            console.log("User logged in with UID:", currentUserId);

            // Fetch GymOwner data
            const gymOwnerDocRef = doc(db, "GymOwner", currentUserId);
            const gymOwnerDoc = await getDoc(gymOwnerDocRef);

            if (!gymOwnerDoc.exists()) {
                console.error(`GymOwner document not found for UID: ${currentUserId}`);
                alert("GymOwner account not found. Please check your account.");
                return;
            }

            const gymOwnerData = gymOwnerDoc.data();
            console.log("GymOwner data:", gymOwnerData);

            // Proceed to fetch and display products
             fetchAndDisplayProducts(gymOwnerData.gymName);
        } else {
            console.error("No user is logged in.");
            window.location.href = "/login"; // Redirect to login page
        }
    });
});
async function fetchAndDisplayProducts(currentGymName) {
    try {
        const productsRef = collection(db, "Products");

        // Query products where gymName matches the current GymOwner
        const queryRef = query(productsRef, where("gymName", "==", currentGymName));
        const querySnapshot = await getDocs(queryRef);

        const productTableBody = document.getElementById("productTableBody");
        productTableBody.innerHTML = ""; // Clear the table

        querySnapshot.forEach((doc) => {
            const productData = doc.data();

            // Add product to table
            addProductToTable(
                productData.productId,
                doc.id,
                productData.photoURL,
                productData.name,
                productData.price,
                productData.description,
                productData.category,
                productData.quantity,
                productData.dateAdded,
                productData.status
            );
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        alert("An error occurred while fetching products. Please try again.");
    }
}


document.addEventListener("DOMContentLoaded", function () {
    const globalSpinner = document.getElementById("globalSpinner");
    const productTableBody = document.getElementById("productTableBody");

    document.getElementById("productForm").addEventListener("submit", async function (event) {
        event.preventDefault();
    
        if (!currentUserId) {
            showMessage("error", "You must be logged in to add products.");
            return;
        }
    
        const photo = document.getElementById("productPhoto").files[0];
        if (!photo) {
            alert("Please upload a photo for the product.");
            return;
        }
    
        const name = document.getElementById("productName").value;
        const price = parseFloat(document.getElementById("productPrice").value).toFixed(2);
        const description = document.getElementById("productDescription").value;
        const category = document.getElementById("productCategory").value;
        const quantity = parseInt(document.getElementById("productQuantity").value, 10);
        const dateAdded = new Date().toISOString();
    
        try {
            // Show spinner
            if (globalSpinner) globalSpinner.style.display = "flex";
    
            const userDocRef = doc(db, "GymOwner", currentUserId);
            const userDoc = await getDoc(userDocRef);
    
            if (userDoc.exists()) {
                const gymOwnerData = userDoc.data();
                const gymName = gymOwnerData.gymName || "Unknown Gym";
    
                const storageRef = ref(storage, "productPhotos/" + photo.name);
    
                // Upload the photo and get the URL
                await uploadBytes(storageRef, photo);
                const downloadURL = await getDownloadURL(storageRef);
    
                console.log("Photo URL:", downloadURL);
    
                if (!downloadURL) {
                    alert("Error: Unable to retrieve the photo URL. Please try again.");
                    return;
                }
    
                // Add product to Firestore
                await addProductToCollection(
                    currentUserId,
                    gymName,
                    name,
                    price,
                    description,
                    category,
                    quantity,
                    dateAdded,
                    downloadURL
                );
                
                // Refetch products to update the table
                fetchAndDisplayProducts(gymName);
                $("#productForm").modal("hide");

                showMessage("success", "✅ Product added successfully!");

            } else {
                showMessage("error", "User not found. Please check your account.");
            }
        } catch (error) {
            showMessage("error", `🚨 Oops! There was an error: ${error.message}`);
        } finally {
            // Hide spinner
            if (globalSpinner) globalSpinner.style.display = "none";
        }
    });
    
    
    async function addProductToCollection(userId, gymName, name, price, description, category, quantity, dateAdded, photoURL) {
        try {
            const productsRef = collection(db, "Products");
    
            // Get the latest productId
            const latestProductQuery = query(productsRef, orderBy("productId", "desc"), limit(1));
            const querySnapshot = await getDocs(latestProductQuery);
    
            let newProductId = 1;
            if (!querySnapshot.empty) {
                const lastProduct = querySnapshot.docs[0];
                newProductId = lastProduct.data().productId + 1;
            }
    
            // Add the new product
            await addDoc(productsRef, {
                productId: newProductId,
                userId: userId,
                gymName: gymName,
                name: name,
                price: price,
                description: description,
                category: category,
                quantity: quantity,
                dateAdded: dateAdded,
                status: "Under review",
                photoURL: photoURL
            });
    
            return newProductId;
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    } 
    async function fetchAndDisplayProducts(currentGymName) {
        try {
            const productsRef = collection(db, "Products");
    
            // Query products where gymName matches the current GymOwner
            const queryRef = query(productsRef, where("gymName", "==", currentGymName));
            const querySnapshot = await getDocs(queryRef);
    
            const productTableBody = document.getElementById("productTableBody");
            productTableBody.innerHTML = ""; // Clear the table
    
            querySnapshot.forEach((doc) => {
                const productData = doc.data();
    
                // Add product to table
                addProductToTable(
                    productData.productId,
                    doc.id,
                    productData.photoURL,
                    productData.name,
                    productData.price,
                    productData.description,
                    productData.category,
                    productData.quantity,
                    productData.dateAdded,
                    productData.status
                );
            });
        } catch (error) {
            console.error("Error fetching products:", error);
            alert("An error occurred while fetching products. Please try again.");
        }
    }
    window.addProductToTable = function(productId, docId, photoURL, name, price, description, category, quantity, dateAdded, status) {
        // Format price with commas (e.g., 1,000 or 1,000,000)
        const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
        }).format(price);
    
        // Format date
        const formattedDate = dateAdded
            ? new Date(dateAdded).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : "Invalid Date";
    
        // Use placeholder if photoURL is invalid
        const imageSrc = photoURL || "https://via.placeholder.com/150";
    
        // Truncate description to 30 characters and add "View More" link
        const maxDescriptionLength = 30;
        const shortDescription =
            description.length > maxDescriptionLength
                ? `${description.slice(0, maxDescriptionLength)}... <a href="#" class="view-more" data-description="${description}">View More</a>`
                : description;
    
        const row = document.createElement("tr");
    
        row.innerHTML = `
            <td>${productId}</td>
            <td><img src="${imageSrc}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
            <td>${name}</td>
            <td>${formattedPrice}</td>
            <td class="description-cell">${shortDescription}</td>
            <td>${category}</td>
            <td>${quantity}</td>
            <td>${formattedDate}</td>
            <td class="status-cell">${status}</td>
            <td class="actions">
                  <div class="button-container">
                <button class="btn btn-warning btn-sm edit-btn" data-id="${docId}"> <i class="fas fa-edit"> </i> Edit </button>
                <button class="btn btn-success btn-sm approve-btn" data-id="${docId}"> <i class="fas fa-check"> </i>Approve </button>
                <button class="btn btn-danger btn-sm remove-btn" data-id="${docId}">   <i class="fas fa-trash">  </i> Remove </button>
                 </button>
                  </div>
            </td>
        `;
        
    
        document.getElementById("productTableBody").appendChild(row);
    
        // Add event listener for "View More" links
        const viewMoreLinks = row.querySelectorAll(".view-more");
        viewMoreLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                Swal.fire({
                    title: "Product Description",
                    text: link.dataset.description,
                    icon: "info",
                    confirmButtonText: "Close",
                });
            });
        });
    };
    



    document.getElementById("productTableBody").addEventListener("click", async function (event) {
        const target = event.target;
        const productId = target.dataset.id; // Retrieve the correct Firestore document ID
        const row = target.closest("tr");

        if (target.classList.contains("approve-btn")) {
            // Approve functionality
            const statusCell = row.querySelector(".status-cell");

            showSpinner();

            try {
                const productRef = doc(db, "Products", productId);
                await updateDoc(productRef, { status: "Approved" });

                statusCell.textContent = "Approved";

                Swal.fire("Success!", "The product has been Approved.", "success");
            } catch (error) {
                console.error("Error approving product:", error);
                Swal.fire("Error!", "Failed to approve product. Please try again.", "error");
            } finally {
                hideSpinner();
            }
        } else if (target.classList.contains("idle-btn")) {
            // Idle functionality
            const statusCell = row.querySelector(".status-cell");

            showSpinner();

            try {
                const productRef = doc(db, "Products", productId);
                await updateDoc(productRef, { status: "Idle" });

                statusCell.textContent = "Idle";

                Swal.fire("Success!", "The product has been marked as Idle.", "success");
            } catch (error) {
                console.error("Error marking product as Idle:", error);
                Swal.fire("Error!", "Failed to mark product as Idle. Please try again.", "error");
            } finally {
                hideSpinner();
            }
        } else if (target.classList.contains("edit-btn")) {
            // Edit functionality
            const name = row.cells[2].textContent;
            const price = row.cells[3].textContent.replace("₱", "");
            const description = row.cells[4].textContent;
            const category = row.cells[5].textContent;
            const quantity = row.cells[6].textContent;

            // Pre-fill the form fields in the modal
            document.getElementById("editProductId").value = productId;
            document.getElementById("editProductName").value = name;
            document.getElementById("editProductPrice").value = price;
            document.getElementById("editProductDescription").value = description;
            document.getElementById("editProductCategory").value = category;
            document.getElementById("editProductQuantity").value = quantity;

            // Show the modal
            $("#editProductModal").modal("show");
        } else if (target.classList.contains("remove-btn")) {
            // Remove functionality
            Swal.fire({
                title: "Remove Product?",
                text: "Are you sure you want to remove this product?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, Remove",
            }).then(async (result) => {
                if (result.isConfirmed) {
                    showSpinner();

                    try {
                        const productRef = doc(db, "Products", productId);
                        await deleteDoc(productRef);

                        // Remove the row from the table
                        row.remove();

                        Swal.fire("Removed!", "The product has been removed.", "success");
                    } catch (error) {
                        console.error("Error removing product:", error);
                        Swal.fire("Error!", "Failed to remove product. Please try again.", "error");
                    } finally {
                        hideSpinner();
                    }
                }
            });
        }
    });




// Spinner utility functions
function showSpinner() {
    const spinner = document.getElementById("globalSpinner");
    if (spinner) {
        spinner.style.display = "flex";
        setTimeout(() => {
            hideSpinner();
        }, 3000); // Spinner duration: 3 seconds
    }
}

function hideSpinner() {
    const spinner = document.getElementById("globalSpinner");
    if (spinner) {
        spinner.style.display = "none";
    }
}


// Spinner utility functions
function showSpinner() {
    const spinner = document.getElementById("globalSpinner");
    if (spinner) {
        spinner.style.display = "flex";
        setTimeout(() => {
            hideSpinner();
        }, 3000); // Spinner duration: 3 seconds
    }
}

function hideSpinner() {
    const spinner = document.getElementById("globalSpinner");
    if (spinner) {
        spinner.style.display = "none";
    }
}


document.getElementById("editProductForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get product details from the form
    const productId = document.getElementById("editProductId").value;
    const name = document.getElementById("editProductName").value;
    const price = parseFloat(document.getElementById("editProductPrice").value).toFixed(2);
    const description = document.getElementById("editProductDescription").value;
    const category = document.getElementById("editProductCategory").value;
    const quantity = parseInt(document.getElementById("editProductQuantity").value, 10);

    showSpinner();

    try {
        const productRef = doc(db, "Products", productId);
        await updateDoc(productRef, {
            name: name,
            price: price,
            description: description,
            category: category,
            quantity: quantity,
        });

        // Update the table dynamically
        const rows = document.querySelectorAll("#productTableBody tr");
        rows.forEach((row) => {
            if (row.querySelector("[data-id]").dataset.id === productId) {
                row.cells[2].textContent = name;
                row.cells[3].textContent = `₱${price}`;
                row.cells[4].textContent = description;
                row.cells[5].textContent = category;
                row.cells[6].textContent = quantity;
            }
        });

        Swal.fire("Success!", "The product has been updated successfully.", "success");

        // Hide the modal
        $("#editProductModal").modal("hide");
    } catch (error) {
        console.error("Error updating product:", error);
        Swal.fire("Error!", "Failed to update the product. Please try again.", "error");
    } finally {
        hideSpinner();
    }
});


   
// Function to display success/error messages
function showMessage(type, message) {
    const messageContainer = document.getElementById("messageContainer") || createMessageContainer();
    const messageElement = document.createElement("div");

    messageElement.className = `alert alert-${type === "error" ? "danger" : "success"} mt-2`;
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);

    setTimeout(() => {
        messageContainer.removeChild(messageElement);
    }, 5000);
}

// Create a message container if it doesn't exist
function createMessageContainer() {
    const container = document.createElement("div");
    container.id = "messageContainer";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "1050";
    document.body.appendChild(container);
    return container;
}
});
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');

    // Toggle Sidebar Visibility on Mobile
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    // Close Sidebar When Clicking Outside on Mobile
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target) && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });
});