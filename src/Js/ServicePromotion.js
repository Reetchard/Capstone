import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, where, addDoc,doc, updateDoc, deleteDoc, getDoc ,query} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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

let currentGymName = null;  // Store the current gym name globally

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(db, 'GymOwner', userId);
            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    currentGymName = userData.gymName;  // Set gym name globally
                    
                    // Populate gym details
                    const gymDetailsTable = document.getElementById('gymDetailsTable');
                    gymDetailsTable.innerHTML = '';
                    const gymRow = document.createElement('tr');
                    gymRow.innerHTML = `
                        <td>${userData.gymName || 'N/A'}</td>
                        <td>${userData.gymDescription || 'No description available'}</td>
                        <td>${userData.gymLocation || 'Not Available'}</td>
                        <td>${userData.gymContact || 'Not Available'}</td>
                        <td>${userData.gymPrograms || 'N/A'}</td>
                        <td>${userData.gymOpeningTime || 'N/A'}</td>
                        <td>${userData.gymClosingTime || 'N/A'}</td>
                        <td>
                            <button class="btn btn-warning" onclick="editGymDetails('${userId}')">Edit</button>
                            <button class="btn btn-danger" onclick="deleteGymDetails('${userId}')">Delete</button>
                        </td>
                    `;
                    gymDetailsTable.appendChild(gymRow);

                    // Fetch profiles after user info is loaded
                    fetchGymProfiles();
                } else {
                    console.error("User document does not exist.");
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            window.location.href = 'login.html';
        }
    });
});
async function fetchGymProfiles(filterName = null) {
    const gymsCollection = collection(db, 'GymOwner');

    // Use the global gym name if available
    const gymOwnerQuery = query(gymsCollection, where('gymName', '==', currentGymName));
    const gymSnapshot = await getDocs(gymOwnerQuery);
    const gymList = gymSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    const gymDetailsTable = document.getElementById('gymDetailsTable');
    gymDetailsTable.innerHTML = '';

    gymList.forEach(gym => {
        if (gym.status && gym.status !== 'Decline' && (!filterName || gym.gymName === filterName)) {
            const gymRow = document.createElement('tr');
            gymRow.innerHTML = `
                    <td><img src="${gym.gymPhoto || 'default.jpg'}" alt="Gym Photo" style="width: 50px; height: 50px;" onclick="showImage('${gym.gymPhoto}')"></td>
                    <td><img src="${gym.gymCertifications || 'default-cert.jpg'}" alt="Certification" style="width: 50px; height: 50px;" onclick="showImage('${gym.gymCertifications}')"></td>
                <td>${gym.gymName || 'N/A'}</td>
                <td>${gym.gymLocation || 'Not Available'}</td>
                <td>${gym.gymContact || 'Not Available'}</td>
                <td>${gym.gymPrograms || 'N/A'}</td>
                <td>${gym.gymEquipment || 'N/A'}</td>
                <td>${gym.gymPriceRate || 'N/A'}</td>                
                <td>${gym.gymOpeningTime || 'N/A'}</td>
                <td>${gym.gymClosingTime || 'N/A'}</td>
                <td>
                    <button class="btn btn-warning" onclick="editGymDetails('${gym.id}')">Edit</button>
                </td>
            `;
            gymDetailsTable.appendChild(gymRow);
        }
    });
    
}
window.showImage = (src) => {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = src || 'default.jpg';
    $('#imageModal').modal('show');
}
let currentGymId = null;

        window.editGymDetails = async (id) => {
            const docRef = doc(db, 'GymOwner', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const gym = docSnap.data();
                document.getElementById('gymPhoto').value = gym.gymPhoto || '';
                document.getElementById('gymCertifications').value = gym.gymCertifications || '';
                document.getElementById('gymName').value = gym.gymName || '';
                document.getElementById('gymLocation').value = gym.gymLocation || '';
                document.getElementById('gymContact').value = gym.gymContact || '';
                document.getElementById('gymPrograms').value = gym.gymPrograms || '';
                document.getElementById('gymEquipment').value = gym.gymEquipment || '';
                document.getElementById('gymPriceRate').value = gym.gymPriceRate || '';
                document.getElementById('gymOpeningTime').value = gym.gymOpeningTime || '';
                document.getElementById('gymClosingTime').value = gym.gymClosingTime || '';
                currentGymId = id;
                $('#editGymModal').modal('show');
            }
        };

        document.getElementById('editGymForm').onsubmit = async (e) => {
            e.preventDefault();
            const updatedGym = {
                gymPhoto: document.getElementById('gymPhoto').value,
                gymCertifications:document.getElementById('gymCertifications').value,
                gymName: document.getElementById('gymName').value,
                gymLocation: document.getElementById('gymLocation').value,
                gymContact: document.getElementById('gymContact').value,
                gymPrograms: document.getElementById('gymPrograms').value,
                gymEquipment:document.getElementById('gymEquipment').value,
                gymPriceRate:document.getElementById('gymPriceRate').value,
                gymOpeningTime: document.getElementById('gymOpeningTime').value,
                gymClosingTime: document.getElementById('gymClosingTime').value,
            };
            if (currentGymId) {
                await updateDoc(doc(db, 'GymOwner', currentGymId), updatedGym);
                $('#editGymModal').modal('hide');
                fetchGymProfiles();
            }
        };

        let editMode = false;
let editId = null;

// Ensure elements exist before setting event listeners
document.addEventListener('DOMContentLoaded', () => {
    const manageForm = document.getElementById('manageForm');
    const searchButton = document.getElementById('searchTitleBtn');

    if (manageForm) {
        manageForm.onsubmit = async function (e) {
            e.preventDefault();

            const title = document.getElementById('itemTitle').value.trim();
            const description = document.getElementById('itemDescription').value.trim();

            if (!title || !description) {
                alert("Please fill in all fields.");
                return;
            }

            if (editMode) {
                const docRef = doc(db, 'Promotions', editId);
                await updateDoc(docRef, {
                    title,
                    description
                });
                alert('Promotion updated successfully!');
                editMode = false;
                editId = null;
            } else {
                const promotion = {
                    PromotionId: 'P' + (Date.now()),
                    title,
                    description
                };
                await addDoc(collection(db, 'Promotions'), promotion);
                alert('Promotion added successfully!');
            }

            $('#manageModal').modal('hide');
            renderTable();
        };
    }

    if (searchButton) {
        searchButton.onclick = async function() {
            const title = document.getElementById('searchTitle').value.trim();
            if (title) {
                await filterPromotionsByTitle(title);
            } else {
                renderTable();
            }
        };
    }

    renderTable();
});

window.addPromotion = function() {
    const modalTitle = document.getElementById('modalTitle');
    const manageForm = document.getElementById('manageForm');
    if (modalTitle && manageForm) {
        modalTitle.textContent = "Add New Promotion";
        manageForm.reset();
        editMode = false;
        editId = null;
        $('#manageModal').modal('show');
    }
};

async function renderTable() {
    const tableBody = document.getElementById('promotionsTable');
    if (tableBody) {
        tableBody.innerHTML = '';

        const snapshot = await getDocs(collection(db, 'Promotions'));
        snapshot.forEach((doc) => {
            const promotion = doc.data();
            const row = `<tr>
                <td>${promotion.PromotionId}</td>
                <td>${promotion.title}</td>
                <td>${promotion.description}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editPromotion('${doc.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePromotion('${doc.id}')">Delete</button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    }
}

async function editPromotion(docId) {
    const docRef = doc(db, 'Promotions', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const promotion = docSnap.data();
        const modalTitle = document.getElementById('modalTitle');
        const itemTitle = document.getElementById('itemTitle');
        const itemDescription = document.getElementById('itemDescription');
        if (modalTitle && itemTitle && itemDescription) {
            modalTitle.textContent = "Edit Promotion";
            itemTitle.value = promotion.title;
            itemDescription.value = promotion.description;
            editMode = true;
            editId = docId;
            $('#manageModal').modal('show');
        }
    }
}

async function deletePromotion(docId) {
    if (confirm("Are you sure you want to delete this promotion?")) {
        const docRef = doc(db, 'Promotions', docId);
        await deleteDoc(docRef);
        alert("Promotion deleted successfully!");
        renderTable();
    }
}

async function filterPromotionsByTitle(title) {
    const tableBody = document.getElementById('promotionsTable');
    if (tableBody) {
        tableBody.innerHTML = '';

        const q = query(collection(db, 'Promotions'), where('title', '==', title));
        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
            const promotion = doc.data();
            const row = `<tr>
                <td>${promotion.PromotionId}</td>
                <td>${promotion.title}</td>
                <td>${promotion.description}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editPromotion('${doc.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePromotion('${doc.id}')">Delete</button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4">No promotions found</td></tr>';
        }
    }
}
