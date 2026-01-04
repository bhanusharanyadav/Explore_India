
const Cart = {
    
    getItems: function () {
        const cartData = localStorage.getItem('travelCart');
        return cartData ? JSON.parse(cartData) : [];
    },

    
    saveItems: function (items) {
        localStorage.setItem('travelCart', JSON.stringify(items));
        this.updateCartBadge();
    },

    
    addItem: function (item) {
        const items = this.getItems();

        
        const existingIndex = items.findIndex(i =>
            i.packageName === item.packageName && i.state === item.state
        );

        if (existingIndex > -1) {
            alert('This package is already in your cart!');
            return false;
        }

        items.push({
            packageName: item.packageName,
            state: item.state,
            price: item.price,
            days: item.days,
            features: item.features || [],
            addedAt: new Date().toISOString()
        });

        this.saveItems(items);
        return true;
    },

    
    removeItem: function (packageName, state) {
        let items = this.getItems();
        items = items.filter(item =>
            !(item.packageName === packageName && item.state === state)
        );
        this.saveItems(items);
        this.renderCartItems();
    },

    
    clearCart: function () {
        localStorage.removeItem('travelCart');
        this.updateCartBadge();
        this.renderCartItems();
    },

   
    getTotalPrice: function () {
        const items = this.getItems();
        return items.reduce((total, item) => total + parseInt(item.price), 0);
    },

    
    updateCartBadge: function () {
        const badge = document.querySelector('.cart-badge');
        const items = this.getItems();
        if (badge) {
            badge.textContent = items.length;
            badge.style.display = items.length > 0 ? 'flex' : 'none';
        }
    },

    
    renderCartItems: function () {
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const cartTotal = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (!cartItemsContainer) return;

        const items = this.getItems();

        if (items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <small>Add some amazing tour packages to get started!</small>
                </div>
            `;
            if (cartTotal) cartTotal.textContent = '₹0';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        cartItemsContainer.innerHTML = items.map(item => `
            <div class="cart-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="cart-item-title">${item.packageName}</div>
                        <div class="cart-item-details">
                            <i class="fas fa-map-marker-alt me-1"></i>${item.state}
                            ${item.days ? `<span class="ms-2"><i class="fas fa-calendar me-1"></i>${item.days}</span>` : ''}
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="cart-item-price">₹${parseInt(item.price).toLocaleString()}</div>
                        <button class="btn btn-sm btn-danger cart-remove-btn mt-2" 
                                onclick="Cart.removeItem('${item.packageName.replace(/'/g, "\\'")}', '${item.state.replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const total = this.getTotalPrice();
        if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString()}`;
        if (checkoutBtn) checkoutBtn.disabled = false;
    }
};



const RatingSystem = {
    
    submitRating: function (packageName, state, rating) {
        return fetch('submit_rating.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                package_name: packageName,
                state: state,
                rating: rating
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    return data;
                } else {
                    throw new Error(data.message);
                }
            });
    },

    
    getRating: function (packageName, state) {
        return fetch(`get_ratings.php?package_name=${encodeURIComponent(packageName)}&state=${encodeURIComponent(state)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    return {
                        average: data.average_rating || 0,
                        count: data.total_ratings || 0
                    };
                }
                return { average: 0, count: 0 };
            })
            .catch(error => {
                console.error('Error fetching rating:', error);
                return { average: 0, count: 0 };
            });
    },

    
    renderStars: function (rating, container) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let starsHTML = '';

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHTML += '<i class="fas fa-star star filled"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHTML += '<i class="fas fa-star-half-alt star filled"></i>';
            } else {
                starsHTML += '<i class="far fa-star star"></i>';
            }
        }

        container.innerHTML = starsHTML;
    },

    
    renderInteractiveStars: function (container, packageName, state) {
        container.innerHTML = '';
        container.classList.add('interactive');

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            star.className = 'far fa-star star';
            star.dataset.rating = i;

            star.addEventListener('click', function () {
                const rating = parseInt(this.dataset.rating);
                RatingSystem.submitRating(packageName, state, rating)
                    .then(data => {
                        alert(`Thank you for rating! Average: ${data.average_rating} stars (${data.total_ratings} ratings)`);
                        // Update display
                        RatingSystem.loadAndDisplayRating(packageName, state);
                    })
                    .catch(error => {
                        alert('Error submitting rating: ' + error.message);
                    });
            });

            star.addEventListener('mouseenter', function () {
                const rating = parseInt(this.dataset.rating);
                const stars = container.querySelectorAll('.star');
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas', 'filled');
                    } else {
                        s.classList.remove('fas', 'filled');
                        s.classList.add('far');
                    }
                });
            });

            container.appendChild(star);
        }

        container.addEventListener('mouseleave', function () {
            const stars = container.querySelectorAll('.star');
            stars.forEach(s => {
                s.classList.remove('fas', 'filled');
                s.classList.add('far');
            });
        });
    },

    
    loadAndDisplayRating: function (packageName, state) {
        const ratingContainer = document.querySelector(`[data-package="${packageName}"][data-state="${state}"] .rating-display`);
        const ratingInfo = document.querySelector(`[data-package="${packageName}"][data-state="${state}"] .rating-info`);

        if (!ratingContainer) return;

        this.getRating(packageName, state).then(data => {
            this.renderStars(data.average, ratingContainer);
            if (ratingInfo) {
                ratingInfo.innerHTML = `
                    <span class="rating-average">${data.average.toFixed(1)}</span>
                    <span class="rating-count">(${data.count} ${data.count === 1 ? 'rating' : 'ratings'})</span>
                `;
            }
        });
    }
};



document.addEventListener('DOMContentLoaded', function () {
    console.log("Travel Explorer website scripts loaded successfully.");

    
    Cart.updateCartBadge();

   
    const exploreBtn = document.getElementById('exploreBtn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const statesSection = document.getElementById('states');
            if (statesSection) {
                statesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }


    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', function () {
            const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
            Cart.renderCartItems();
            cartModal.show();
        });
    }

    
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function () {
            const card = this.closest('.card');
            const packageName = card.querySelector('.card-header h4')?.textContent.trim() || 'Package';
            const priceElement = card.querySelector('.pricing-card-title');
            const priceText = priceElement?.textContent || '0';
            const price = priceText.match(/₹(\d+)/)?.[1] || '0';
            const daysText = priceText.match(/(\d+)\s*days?/)?.[1] || '';

            
            const pageTitle = document.querySelector('h1')?.textContent || '';
            const state = pageTitle.split(':')[0]?.trim() || 'Unknown';

            const item = {
                packageName: packageName,
                state: state,
                price: price,
                days: daysText ? `${daysText} days` : ''
            };

            if (Cart.addItem(item)) {
                
                this.innerHTML = '<i class="fas fa-check"></i> Added!';
                this.classList.add('btn-success');
                this.classList.remove('btn-add-to-cart');

                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                    this.classList.remove('btn-success');
                    this.classList.add('btn-add-to-cart');
                }, 2000);
            }
        });
    });

    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            const cartItems = Cart.getItems();
            if (cartItems.length === 0) {
                alert('Your cart is empty!');
                return;
            }

           
            const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            if (cartModal) cartModal.hide();

            const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
            paymentModal.show();
        });
    }

    
    const payNowBtn = document.getElementById('payNowBtn');

    
    function submitBooking(bookingData, btn) {
        fetch('process_payment.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    Cart.clearCart();
                    const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
                    if (paymentModal) paymentModal.hide();
                    document.getElementById('paymentForm').reset();
                    const qrCodeContainer = document.getElementById('qrCodeContainer');
                    if (qrCodeContainer) qrCodeContainer.classList.add('d-none');
                } else {
                    alert('Booking failed: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while processing your booking. Please try again.');
            })
            .finally(() => {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Pay Now';
                }
            });
    }

    if (payNowBtn) {
        payNowBtn.addEventListener('click', function () {
            const customerName = document.getElementById('customerName')?.value.trim();
            const customerEmail = document.getElementById('customerEmail')?.value.trim();
            const customerPhone = document.getElementById('customerPhone')?.value.trim();
            const selectedMethodInput = document.querySelector('input[name="paymentMethod"]:checked');

            // Validate inputs
            if (!customerName || !customerEmail || !customerPhone) {
                alert('Please fill in all customer details.');
                return;
            }

            if (!selectedMethodInput) {
                alert('Please select a payment method.');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerEmail)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Phone validation
            if (customerPhone.length < 10) {
                alert('Please enter a valid phone number.');
                return;
            }

            const selectedMethod = selectedMethodInput.value;
            const cartItems = Cart.getItems();

            if (cartItems.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            // Disable button
            payNowBtn.disabled = true;
            payNowBtn.textContent = 'Processing...';

            if (selectedMethod === 'Razorpay') {
                fetch('create_order.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: Cart.getTotalPrice() })
                })
                    .then(res => res.json())
                    .then(order => {
                        if (order.error) {
                            alert('Error creating order: ' + order.error);
                            payNowBtn.disabled = false;
                            payNowBtn.textContent = 'Pay Now';
                            return;
                        }

                        var options = {
                            "key": "rzp_test_VVaxe8RQLNF0DS",
                            "amount": order.amount,
                            "currency": "INR",
                            "name": "Travel Explorer",
                            "description": "Tour Booking",
                            "order_id": order.id,
                            "handler": function (response) {
                                // Payment Success
                                const bookingData = {
                                    customer_name: customerName,
                                    customer_email: customerEmail,
                                    customer_phone: customerPhone,
                                    payment_method: "Razorpay (ID: " + response.razorpay_payment_id + ")",
                                    cart_items: cartItems,
                                    total_amount: Cart.getTotalPrice()
                                };
                                submitBooking(bookingData, payNowBtn);
                            },
                            "prefill": {
                                "name": customerName,
                                "email": customerEmail,
                                "contact": customerPhone
                            },
                            "theme": {
                                "color": "#3399cc"
                            },
                            "modal": {
                                "ondismiss": function () {
                                    payNowBtn.disabled = false;
                                    payNowBtn.textContent = 'Pay Now';
                                }
                            }
                        };
                        var rzp1 = new Razorpay(options);
                        rzp1.on('payment.failed', function (response) {
                            alert("Payment Failed: " + response.error.description);
                            payNowBtn.disabled = false;
                            payNowBtn.textContent = 'Pay Now';
                        });
                        rzp1.open();
                    })
                    .catch(err => {
                        console.error(err);
                        alert('Error initiating payment');
                        payNowBtn.disabled = false;
                        payNowBtn.textContent = 'Pay Now';
                    });
            } else {
                // Standard Payment
                const bookingData = {
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                    payment_method: selectedMethod,
                    cart_items: cartItems,
                    total_amount: Cart.getTotalPrice()
                };
                submitBooking(bookingData, payNowBtn);
            }
        });
    }

    // Handle Payment Method Change (QR Code display)
    const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
    const qrCodeContainer = document.getElementById('qrCodeContainer');

    if (paymentMethodInputs.length > 0 && qrCodeContainer) {
        paymentMethodInputs.forEach(input => {
            input.addEventListener('change', function () {
                if (this.value === 'QRCode') {
                    qrCodeContainer.classList.remove('d-none');
                } else {
                    qrCodeContainer.classList.add('d-none');
                }
            });
        });
    }

    // Initialize ratings on page load
    const ratingContainers = document.querySelectorAll('[data-package][data-state]');
    ratingContainers.forEach(container => {
        const packageName = container.dataset.package;
        const state = container.dataset.state;
        RatingSystem.loadAndDisplayRating(packageName, state);
    });

    // Initialize interactive rating stars
    const interactiveRatingContainers = document.querySelectorAll('.rating-interactive');
    interactiveRatingContainers.forEach(container => {
        const packageName = container.dataset.package;
        const state = container.dataset.state;
        RatingSystem.renderInteractiveStars(container, packageName, state);
    });
});

const track = document.getElementById('photoStack');
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
let currentIndex = 0;
let autoSlideInterval;

// Configuration
const AUTO_SLIDE_DELAY = 3000; // 3 seconds

function updateSlidePosition() {
    const translateX = -(currentIndex * 100);
    track.style.transform = `translateX(${translateX}%)`;
}

function nextPhoto() {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlidePosition();
    resetTimer();
}

function prevPhoto() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlidePosition();
    resetTimer();
}

function startAutoSlide() {
    autoSlideInterval = setInterval(nextPhoto, AUTO_SLIDE_DELAY);
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

function resetTimer() {
    stopAutoSlide();
    startAutoSlide();
}

// Event Listeners
document.querySelector('.stack-container').addEventListener('mouseenter', stopAutoSlide);
document.querySelector('.stack-container').addEventListener('mouseleave', startAutoSlide);

// Initialize
startAutoSlide();

