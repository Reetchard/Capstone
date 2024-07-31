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

// Initialize Firebase

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

const database = firebase.database();
const storage = firebase.storage(); // Initialize Firebase Storage
const trainerRef = database.ref('trainers');

// Function to generate a new Trainer ID
function generateTrainerId(callback) {
    trainerRef.once('value', function(snapshot) {
        const trainers = snapshot.val();
        const newId = trainers ? Object.keys(trainers).length + 1 : 1;
        callback(newId);
    });
}

// Function to retrieve and display trainer information

function displayTrainerInfo() {
    trainerRef.on('value', function(snapshot) {
        const trainers = snapshot.val();
        const trainerInfoBody = document.getElementById('trainerInfoBody');
        trainerInfoBody.innerHTML = '';

        for (const key in trainers) {
            if (trainers.hasOwnProperty(key)) {
                const trainer = trainers[key];
                const row = document.createElement('tr');

                // Log the trainer data for debugging
                console.log('Displaying trainer:', trainer);

                row.innerHTML = `
                    <td>${trainer.id || 'N/A'}</td>
                    <td><img src="${trainer.photoURL || 'default-image.png'}" alt="Photo" style="width: 50px; height: 50px; object-fit: cover;"></td>
                    <td>${trainer.name || 'N/A'}</td>
                    <td>${trainer.experience || 'N/A'}</td>
                    <td>${trainer.worksAt || 'N/A'}</td>
                    <td>${trainer.status || 'On Review'}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="editTrainer('${key}')">Edit</button>
                        <button class="btn btn-success btn-sm" onclick="approveTrainer('${key}')">Approve</button>
                        <button class="btn btn-warning btn-sm" onclick="removeTrainer('${key}')">Remove</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteTrainer('${key}')">Delete</button>
                        <button class="btn btn-secondary btn-sm" onclick="setIdle('${key}')">Set Idle</button>
                    </td>
                `;

                trainerInfoBody.appendChild(row);
            }
        }
    });
}

// Function to search trainer by ID
function searchTrainer() {
    const searchId = document.getElementById('searchId').value;
    trainerRef.orderByChild('id').equalTo(parseInt(searchId, 10)).once('value', function(snapshot) {
        const trainers = snapshot.val();
        const trainerInfoBody = document.getElementById('trainerInfoBody');
        trainerInfoBody.innerHTML = '';

        for (const key in trainers) {
            if (trainers.hasOwnProperty(key)) {
                const trainer = trainers[key];
                const row = document.createElement('tr');

                // Log the trainer data for debugging
                console.log('Searching for trainer:', trainer);

                row.innerHTML = `
                    <td>${trainer.id || 'N/A'}</td>
                    <td><img src="${trainer.photoURL || 'default-image.png'}" alt="Photo" style="width: 50px; height: 50px; object-fit: cover;"></td>
                    <td>${trainer.name}</td>
                    <td>${trainer.experience}</td>
                    <td>${trainer.worksAt}</td>
                    <td>${trainer.status || 'On Review'}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="editTrainer('${key}')">Edit</button>
                        <button class="btn btn-success btn-sm" onclick="approveTrainer('${key}')">Approve</button>
                        <button class="btn btn-warning btn-sm" onclick="removeTrainer('${key}')">Remove</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteTrainer('${key}')">Delete</button>
                        <button class="btn btn-secondary btn-sm" onclick="setIdle('${key}')">Set Idle</button>
                    </td>
                `;

                trainerInfoBody.appendChild(row);
            }
        }
    });
}

// Function to handle photo preview
// Function to add or update a trainer
document.getElementById('trainerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const experience = document.getElementById('experience').value;
    const worksAt = document.getElementById('worksAt').value;
    const photo = document.getElementById('photo').files[0]; // Get the photo file

    const trainerKey = document.getElementById('trainerKey').value;
    const trainerData = { name, experience, worksAt, status: 'On Review' };

    if (photo) {
        // Create a reference to store the photo
        const storageRef = storage.ref('trainer_photos/' + photo.name);
        storageRef.put(photo).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((downloadURL) => {
                trainerData.photoURL = downloadURL; // Add photo URL to trainerData

                if (trainerKey) {
                    // Update existing trainer
                    trainerRef.child(trainerKey).update(trainerData);
                    alert('Trainer updated successfully.');
                } else {
                    // Add new trainer with auto-generated ID
                    generateTrainerId(function(newId) {
                        trainerData.id = newId;
                        trainerRef.push(trainerData);
                        alert('Trainer added successfully.');
                    });
                }
                
                document.getElementById('trainerForm').reset();
                $('#trainerModal').modal('hide');
            });
        }).catch(error => {
            console.error('Error getting photo URL:', error);
        });
    } else {
        if (trainerKey) {
            // Update existing trainer without photo
            trainerRef.child(trainerKey).update(trainerData);
            alert('Trainer updated successfully.');
        } else {
            // Add new trainer with auto-generated ID
            generateTrainerId(function(newId) {
                trainerData.id = newId;
                trainerRef.push(trainerData);
                alert('Trainer added successfully.');
            });
        }

        document.getElementById('trainerForm').reset();
        $('#trainerModal').modal('hide');
    }
});


// Function to edit a trainer
function editTrainer(key) {
    trainerRef.child(key).once('value', function(snapshot) {
        const trainer = snapshot.val();
        document.getElementById('trainerKey').value = key;
        document.getElementById('id').value = trainer.id || ''; // Ensure ID is set
        document.getElementById('name').value = trainer.name;
        document.getElementById('experience').value = trainer.experience;
        document.getElementById('worksAt').value = trainer.worksAt;
        $('#trainerModal').modal('show');
    });
}

// Function to approve a trainer
function approveTrainer(key) {
    trainerRef.child(key).update({ status: 'Approved' });
    alert('Trainer approved.');
}

// Function to remove a trainer
function removeTrainer(key) {
    trainerRef.child(key).update({ status: 'Removed' });
    alert('Trainer removed.');
}

// Function to delete a trainer
function deleteTrainer(key) {
    trainerRef.child(key).remove();
    alert('Trainer deleted.');
}

// Function to set a trainer to idle
function setIdle(key) {
    trainerRef.child(key).update({ status: 'Idle' });
    alert('Trainer set to Idle.');
}

// Display trainer information on page load
window.onload = displayTrainerInfo;
