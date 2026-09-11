const input = document.getElementById('searchInput');
const box = document.getElementById('suggestionsBox');
let debounceTimer;

if (input) {
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) { box.innerHTML = ''; return; }

    debounceTimer = setTimeout(async () => {
      const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      renderSuggestions(data);
    }, 300);
  });
}

function renderSuggestions(data) {
  if (!data.products.length && !data.brands.length && !data.categories.length) {
    box.innerHTML = '';
    return;
  }

  let html = '<div class="absolute z-50 w-full bg-card border border-border2 rounded-md mt-1 overflow-hidden">';

  data.products.forEach((p) => {
    html += `<a href="/product/${p._id}" class="flex items-center gap-3 px-4 py-2 hover:bg-navy2 text-sm">
      <span>${p.name}</span></a>`;
  });
  data.categories.forEach((c) => {
    html += `<a href="/products?category=${c.slug}" class="block px-4 py-2 hover:bg-navy2 text-sm text-cyan">In ${c.name}</a>`;
  });
  data.brands.forEach((b) => {
    html += `<a href="/products?brand=${b}" class="block px-4 py-2 hover:bg-navy2 text-sm text-textSecondary">Brand: ${b}</a>`;
  });

  html += '</div>';
  box.innerHTML = html;
}

document.addEventListener('click', (e) => {
  if (box && !box.contains(e.target) && e.target !== input) box.innerHTML = '';
});