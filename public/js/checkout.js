const placeBtn = document.getElementById('placeOrderBtn');
const errorBox = document.getElementById('checkoutError');

const SUBTOTAL = window.CHECKOUT_SUBTOTAL;
let appliedCoupon = null;

document.getElementById('applyCouponBtn')?.addEventListener('click', async () => {
  const code = document.getElementById('couponInput').value.trim();
  const msgBox = document.getElementById('couponMessage');
  if (!code) return;

  try {
    const res = await fetch('/api/coupons/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.csrfToken },
      body: JSON.stringify({ code, orderValue: SUBTOTAL }),
    });
    const data = await res.json();

    if (!data.success) {
      msgBox.textContent = data.message;
      msgBox.className = 'text-error text-xs mt-2';
      appliedCoupon = null;
      document.getElementById('couponRow').style.display = 'none';
    } else {
      msgBox.textContent = data.message;
      msgBox.className = 'text-success text-xs mt-2';
      appliedCoupon = { code: data.code, discount: data.discount };
      document.getElementById('couponRow').style.display = 'flex';
      document.getElementById('couponDiscountAmount').textContent = `- ₹${data.discount}`;
    }
    updateTotal();
  } catch (err) {
    msgBox.textContent = 'Failed to apply coupon. Please try again.';
    msgBox.className = 'text-error text-xs mt-2';
  }
});

function updateTotal() {
  const deliveryFee = window.CHECKOUT_DELIVERY_FEE;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  document.getElementById('finalTotal').textContent = `₹${SUBTOTAL + deliveryFee - discount}`;
}

const timerBox = document.getElementById('reservationTimer');
if (timerBox) {
  const expires = new Date(timerBox.dataset.expires).getTime();
  setInterval(() => {
    const diff = expires - Date.now();
    if (diff <= 0) {
      timerBox.textContent = 'Reservation expired — please return to your cart and try again.';
      placeBtn.disabled = true;
      return;
    }
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    timerBox.textContent = `Items reserved — complete checkout within ${mins}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

placeBtn.addEventListener('click', async () => {
  errorBox.textContent = '';
  const addressId = document.querySelector('input[name="addressId"]:checked')?.value;
  const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked').value;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

  if (!addressId) {
    errorBox.textContent = 'Please select a delivery address.';
    return;
  }

  if (paymentMethod === 'COD') {
    document.getElementById('codAddressId').value = addressId;
    document.getElementById('codDeliveryOption').value = deliveryOption;
    document.getElementById('codCouponCode').value = appliedCoupon ? appliedCoupon.code : '';
    document.getElementById('codForm').submit();
    return;
  }

  placeBtn.disabled = true;
  placeBtn.textContent = 'Processing...';

  try {
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.csrfToken },
      body: JSON.stringify({ 
        addressId, 
        deliveryOption, 
        couponCode: appliedCoupon ? appliedCoupon.code : '' 
      }),
    });
    const data = await res.json();

    if (!data.success) {
      errorBox.textContent = data.message || 'Could not start payment.';
      placeBtn.disabled = false;
      placeBtn.textContent = 'Place Order';
      return;
    }

    const options = {
      key: window.RAZORPAY_KEY,
      amount: data.amount,
      currency: data.currency,
      name: 'NOVA MARKET',
      description: 'Order Payment',
      order_id: data.orderId,
      theme: { color: '#7C3AED' },
      handler: async function (response) {
        const verifyRes = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.csrfToken },
          body: JSON.stringify(response),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          window.location.href = `/order-success/${verifyData.orderId}`;
        } else {
          errorBox.textContent = verifyData.message || 'Payment verification failed.';
          placeBtn.disabled = false;
          placeBtn.textContent = 'Place Order';
        }
      },
      modal: {
        ondismiss: function () {
          placeBtn.disabled = false;
          placeBtn.textContent = 'Place Order';
        },
      },
    };

    new Razorpay(options).open();
  } catch (err) {
    errorBox.textContent = 'Something went wrong. Try again.';
    placeBtn.disabled = false;
    placeBtn.textContent = 'Place Order';
  }
});