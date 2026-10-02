const API = '/api/items';
const icons = { Electronics: '⌁', 'ID/Keys': '⌘', Books: '▤', Other: '◇' };
const grid = document.querySelector('#itemsGrid');
const search = document.querySelector('#searchInput');
const filter = document.querySelector('#statusFilter');
const form = document.querySelector('#itemForm');
let items = [];

async function loadItems() {
  try {
    const response = await fetch(API);
    if (!response.ok) throw new Error('Could not load items');
    items = await response.json();
    render();
  } catch (error) {
    grid.innerHTML = '<div class="empty">The noticeboard is offline. Start CampusTrackServer.java on port 8080 and refresh.</div>';
    document.querySelector('#itemCount').textContent = 'Offline';
  }
}

function render() {
  const query = search.value.trim().toLowerCase();
  const selected = filter.value;
  const visible = items.filter(item => (selected === 'ALL' || item.status === selected) && (!query || `${item.name} ${item.category} ${item.location}`.toLowerCase().includes(query)));
  document.querySelector('#itemCount').textContent = `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`;
  grid.innerHTML = visible.length ? visible.map(card).join('') : '<div class="empty">No items match your search yet.</div>';
}

function card(item) {
  const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently';
  return `<article class="item-card"><div class="card-top"><div><span class="category-icon">${icons[item.category] || icons.Other}</span><h3>${escapeHtml(item.name)}</h3><span class="category">${escapeHtml(item.category)}</span></div><span class="status status-${item.status}">${item.status}</span></div><div class="details"><span>⌖ <b>${escapeHtml(item.location)}</b></span><span>◎ <b>${escapeHtml(item.contact)}</b></span><span>Posted ${date}</span></div>${item.status !== 'CLAIMED' ? `<button class="claim" data-id="${item.id}">Mark as claimed →</button>` : ''}</article>`;
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[char])); }

form.addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.querySelector('#formMessage');
  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Could not post item');
    form.reset();
    message.textContent = 'Posted to the noticeboard.';
    await loadItems();
  } catch (error) { message.textContent = 'Could not post. Is the Java server running?'; message.className = 'form-message error'; }
});

grid.addEventListener('click', async event => {
  const button = event.target.closest('.claim');
  if (!button) return;
  button.disabled = true;
  try { await fetch(`${API}/claim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Number(button.dataset.id) }) }); await loadItems(); }
  catch (error) { button.disabled = false; }
});
search.addEventListener('input', render);
filter.addEventListener('change', render);
loadItems();
