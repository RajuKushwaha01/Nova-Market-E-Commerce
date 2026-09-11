// Variant selection
const variantBtns = document.querySelectorAll('.variant-btn');
const hiddenVariantInput = document.getElementById('selectedVariantId');

variantBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    variantBtns.forEach((b) => b.classList.remove('border-violet'));
    btn.classList.add('border-violet');
    if (hiddenVariantInput) hiddenVariantInput.value = btn.dataset.variantId;
  });
});

// Pincode checker
const checkBtn = document.getElementById('checkPincodeBtn');
if (checkBtn) {
  checkBtn.addEventListener('click', async () => {
    const pincode = document.getElementById('pincodeInput').value.trim();
    const resultBox = document.getElementById('pincodeResult');
    resultBox.textContent = 'Checking...';

    const res = await fetch(`/api/check-pincode?pincode=${pincode}`);
    const data = await res.json();

    if (!data.valid) {
      resultBox innerHTML = `<span class="text-error">${data.message}</span>`;
      return;
    }
    if (!data.deliverable) {
      resultBox.innerHTML = `<span class="text-error">Delivery not available at this pincode.</span>`;
      return;
    }
    resultBox.innerHTML = `
      <span class="text-success">${data.estimatedDate}</span><br>
      <span>${data.freeDelivery ? 'FREE Delivery' : 'Delivery charges apply'}</span><br>
      <span>${data.codAvailable ? 'Cash on Delivery available' : 'COD not available'}</span>
    `;
  });
}