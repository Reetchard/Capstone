// billing.js

// Your web app's Firebase configuration
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
firebase.initializeApp(firebaseConfig);

// Reference your database
const database = firebase.database();
const billingRef = database.ref('billingForm');

// Function to retrieve and display billing records
function displayBillingRecords() {
    billingRef.on('value', function(snapshot) {
        const records = snapshot.val();
        const recordsBody = document.getElementById('billingRecordsBody');
        recordsBody.innerHTML = '';

        for (const key in records) {
            if (records.hasOwnProperty(key)) {
                const record = records[key];
                renderBillingRecord(key, record);
            }
        }
    });
}

// Call the function to initially display billing records
displayBillingRecords();

// Function to render a billing record row
function renderBillingRecord(key, record) {
    const recordsBody = document.getElementById('billingRecordsBody');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${record.id}</td>
        <td>${record.fullName}</td>
        <td>${record.email}</td>
        <td>${record.phone}</td>
        <td>${record.address}</td>
        <td>${record.city}</td>
        <td>${record.state}</td>
        <td>${record.zipcode}</td>
        <td>${record.date}</td>
        <td>${record.amount}</td>
        <td>${record.paymentMethod}</td>
        <td>
            <button class="btn btn-warning btn-sm btn-space" onclick="editRecord('${key}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRecord('${key}')">Delete</button>
        </td>
    `;
    recordsBody.appendChild(row);
}

// Function to save billing record
function saveBillingRecord(id, fullName, email, phone, address, city, state, zipcode, date, amount, paymentMethod, qrCode, paymentNumber) {
    const newBillingRef = billingRef.push();
    newBillingRef.set({
        id: id,
        fullName: fullName,
        email: email,
        phone: phone,
        address: address,
        city: city,
        state: state,
        zipcode: zipcode,
        date: date,
        amount: amount,
        paymentMethod: paymentMethod,
        qrCode: qrCode,
        paymentNumber: paymentNumber
    }, function(error) {
        if (error) {
            document.getElementById('alert').innerHTML = '<div class="alert alert-danger" role="alert">Error: ' + error.message + '</div>';
        } else {
            document.getElementById('alert').innerHTML = '<div class="alert alert-success" role="alert">Billing record saved successfully!</div>';
            document.getElementById('billingForm').reset();
            // After saving, render the new record in the table
            renderBillingRecord(newBillingRef.key, {
                id, fullName, email, phone, address, city, state, zipcode, date, amount, paymentMethod, qrCode, paymentNumber
            });
        }
    });
}

// Event listener for billing form submission
document.getElementById('billingForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const id = document.getElementById('id').value || 'ID-' + Date.now(); // Generate ID if not present
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zipcode = document.getElementById('zipcode').value;
    const date = document.getElementById('date').value;
    const amount = document.getElementById('amount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const qrCode = document.getElementById('qrCode').files[0] ? document.getElementById('qrCode').files[0].name : '';
    const paymentNumber = document.getElementById('paymentNumber').value;

    saveBillingRecord(id, fullName, email, phone, address, city, state, zipcode, date, amount, paymentMethod, qrCode, paymentNumber);
});

// Function to edit billing record
function editRecord(key) {
    billingRef.child(key).once('value').then(function(snapshot) {
        const record = snapshot.val();
        document.getElementById('edit-record-id').value = key;
        document.getElementById('edit-id').value = record.id;
        document.getElementById('edit-fullName').value = record.fullName;
        document.getElementById('edit-email').value = record.email;
        document.getElementById('edit-phone').value = record.phone;
        document.getElementById('edit-address').value = record.address;
        document.getElementById('edit-city').value = record.city;
        document.getElementById('edit-state').value = record.state;
        document.getElementById('edit-zipcode').value = record.zipcode;
        document.getElementById('edit-date').value = record.date;
        document.getElementById('edit-amount').value = record.amount;
        document.getElementById('edit-paymentMethod').value = record.paymentMethod;
        document.getElementById('edit-qrCodeUpload').style.display = record.paymentMethod === 'QR Code' ? 'block' : 'none';
        document.getElementById('edit-paymentNumberField').style.display = record.paymentMethod === 'Payment Number' ? 'block' : 'none';

        $('#editModal').modal('show');
    });
}

// Event listener for edit billing form submission
document.getElementById('editBillingForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const key = document.getElementById('edit-record-id').value;
    const id = document.getElementById('edit-id').value;
    const fullName = document.getElementById('edit-fullName').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    const address = document.getElementById('edit-address').value;
    const city = document.getElementById('edit-city').value;
    const state = document.getElementById('edit-state').value;
    const zipcode = document.getElementById('edit-zipcode').value;
    const date = document.getElementById('edit-date').value;
    const amount = document.getElementById('edit-amount').value;
    const paymentMethod = document.getElementById('edit-paymentMethod').value;
    const qrCode = document.getElementById('edit-qrCode').files[0] ? document.getElementById('edit-qrCode').files[0].name : '';
    const paymentNumber = document.getElementById('edit-paymentNumber').value;

    const recordRef = billingRef.child(key);
    recordRef.update({
        id, fullName, email, phone, address, city, state, zipcode, date, amount, paymentMethod, qrCode, paymentNumber
    }, function(error) {
        if (error) {
            alert('Error: ' + error.message);
        } else {
            $('#editModal').modal('hide');
            displayBillingRecords(); // Refresh the billing records
        }
    });
}

// Function to delete billing record
function deleteRecord(key) {
    const recordRef = billingRef.child(key);
    recordRef.remove()
        .then(function() {
            alert('Record deleted successfully!');
            displayBillingRecords(); // Refresh the billing records
        })
        .catch(function(error) {
            alert('Error: ' + error.message);
        });
}

// Event listener for payment method selection
document.getElementById('paymentMethod').addEventListener('change', function() {
    const paymentMethod = this.value;
    document.getElementById('qrCodeUpload').style.display = paymentMethod === 'QR Code' ? 'block' : 'none';
    document.getElementById('paymentNumberField').style.display = paymentMethod === 'Payment Number' ? 'block' : 'none';
});

// Event listener for edit payment method selection
document.getElementById('edit-paymentMethod').addEventListener('change', function() {
    const paymentMethod = this.value;
    document.getElementById('edit-qrCodeUpload').style.display = paymentMethod === 'QR Code' ? 'block' : 'none';
    document.getElementById('edit-paymentNumberField').style.display = paymentMethod === 'Payment Number' ? 'block' : 'none';
});
