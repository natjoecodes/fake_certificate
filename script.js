const form = document.getElementById('nameForm');
const input = document.getElementById('nameInput');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = input.value.trim();
  if (!name) return;

  const params = new URLSearchParams({ name });
  window.location.href = `prank.html?${params.toString()}`;
});
