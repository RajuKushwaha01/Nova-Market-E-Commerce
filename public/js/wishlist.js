document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.wishlist-btn, #wishlistToggleBtn');
  if (!btn) return;
  e.preventDefault();

  const productId = btn.dataset.id;
  const res = await fetch('/api/wishlist/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.csrfToken || '' },
    body: JSON.stringify({ productId }),
  });

  if (res.status === 401 || res.redirected) {
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (data.success) {
    btn.textContent = data.added ? '❤' : '♡';
  }
});