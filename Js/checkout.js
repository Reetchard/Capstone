document.addEventListener('DOMContentLoaded', function() {
    // Load cart items from localStorage or sessionStorage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    const cartItemsContainer = document.getElementById('cartItems');
    const totalAmountElement = document.getElementById('totalAmount');

    let totalAmount = 0;

    cartItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <img src="${item.photoURL || 'default-image.png'}" alt="${item.name}" style="width: 50px; height: auto;">
            <p>${item.name}</p>
            <p>$${item.price}</p>
            <p>Quantity: ${item.quantity}</p>
        `;
        cartItemsContainer.appendChild(itemElement);

        totalAmount += item.price * item.quantity;
    });

    totalAmountElement.textContent = totalAmount.toFixed(2);

    document.getElementById('proceedToPayment').addEventListener('click', function() {
        // Implement payment processing here
        alert('Proceeding to payment.');
    });
});
function updateCartItems(name, price, quantity, photoURL) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    // Check if item already in cart
    const existingItemIndex = cartItems.findIndex(item => item.name === name);
    if (existingItemIndex > -1) {
        cartItems[existingItemIndex].quantity += quantity;
    } else {
        cartItems.push({ name, price, quantity, photoURL });
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCount();
}
