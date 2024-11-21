import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Helper function to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

// Fetch and Display Data
document.addEventListener('DOMContentLoaded', async () => {
    const transactionsBody = document.getElementById('transactionsBody');
    const productsBody = document.getElementById('productsBody');
    const totalSalesElement = document.getElementById('totalSales');

    // Authenticate the current user
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to view this page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        let totalSales = 0;

        // Fetch all transactions created by the current user
        const transactionsQuery = query(collection(db, 'Transactions'), where('userId', '==', user.uid));
        const transactionsSnapshot = await getDocs(transactionsQuery);

        transactionsSnapshot.forEach((doc) => {
            const data = doc.data();
            const total = data.quantity * data.price; // Calculate the total for this transaction

            // Update total sales
            totalSales += total;

            // Add transaction to the table
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${data.productName || 'N/A'}</td>
                <td>${data.quantity || 0}</td>
                <td>${formatCurrency(data.price || 0)}</td>
                <td>${formatCurrency(total)}</td>
                <td>${data.timestamp?.toDate().toLocaleString() || 'N/A'}</td>
            `;
            transactionsBody.appendChild(row);
        });

        // Display total sales
        totalSalesElement.textContent = `Total Sales: ${formatCurrency(totalSales)}`;

        // Fetch all products
        const productsSnapshot = await getDocs(collection(db, 'Products'));
        productsSnapshot.forEach((doc) => {
            const data = doc.data();

            // Add product to the table
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${data.productName || 'N/A'}</td>
                <td>${data.stock || 0}</td>
                <td>${formatCurrency(data.price || 0)}</td>
            `;
            productsBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data. Please try again later.');
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