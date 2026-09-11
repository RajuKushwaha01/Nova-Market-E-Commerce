function toast(message) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 999;
    background: #111827; border: 1px solid #7C3AED; color: #F8FAFC;
    padding: 12px 18px; border-radius: 8px; font-size: 14px;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}