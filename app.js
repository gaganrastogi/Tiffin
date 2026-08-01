const API = '/api/data';
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 68; // matches r=68 in the SVG

let state = { subscriptions: [], entries: [] };

const $ = (id) => document.getElementById(id);

const saveStatus = $('saveStatus');
const entryForm = $('entryForm');
const planForm = $('planForm');
const currentPlanView = $('currentPlanView');
const showPlanFormBtn = $('showPlanForm');
const cancelPlanFormBtn = $('cancelPlanForm');
const historyList = $('historyList');
const historyEmpty = $('historyEmpty');
const historyCount = $('historyCount');

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

async function loadData() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Failed to load');
    state = await res.json();
  } catch (err) {
    setStatus('Could not load data — check your connection.', true);
    state = { subscriptions: [], entries: [] };
  }
  render();
}

async function persist() {
  setStatus('Saving…');
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (!res.ok) throw new Error('Save failed');
    setStatus('Saved');
    setTimeout(() => setStatus(''), 1500);
  } catch (err) {
    setStatus('Could not save — try again.', true);
  }
}

function setStatus(msg, isError = false) {
  saveStatus.textContent = msg;
  saveStatus.classList.toggle('error', isError);
  saveStatus.classList.toggle('saving', !isError && msg === 'Saving…');
}

function totals() {
  const totalPurchased = state.subscriptions.reduce((s, p) => s + Number(p.count || 0), 0);
  const totalUsed = state.entries.reduce((s, e) => s + Number(e.count || 0), 0);
  const totalSpent = state.subscriptions.reduce((s, p) => s + Number(p.price || 0), 0);
  const pending = Math.max(totalPurchased - totalUsed, 0);
  return { totalPurchased, totalUsed, totalSpent, pending };
}

function render() {
  renderDashboard();
  renderCurrentPlan();
  renderHistory();
}

function renderDashboard() {
  const { totalPurchased, totalUsed, totalSpent, pending } = totals();
  $('statTotal').textContent = totalPurchased;
  $('statUsed').textContent = totalUsed;
  $('statPending').textContent = pending;
  $('statSpent').textContent = '\u20B9' + totalSpent.toLocaleString('en-IN');
  $('gaugePending').textContent = pending;

  const ratio = totalPurchased > 0 ? pending / totalPurchased : 0;
  const offset = GAUGE_CIRCUMFERENCE * (1 - ratio);
  $('gaugeFill').style.strokeDasharray = GAUGE_CIRCUMFERENCE;
  $('gaugeFill').style.strokeDashoffset = offset;
}

function renderCurrentPlan() {
  const plan = state.subscriptions[state.subscriptions.length - 1];
  if (!plan) {
    currentPlanView.innerHTML = `<p class="plan-detail">No plan set up yet. Use "Change subscription" to add one.</p>`;
    return;
  }
  currentPlanView.innerHTML = `
    <div class="plan-price">\u20B9${Number(plan.price).toLocaleString('en-IN')} for ${plan.count} tiffins</div>
    <div class="plan-detail">Started ${fmtDate(plan.date)}${state.subscriptions.length > 1 ? ` &middot; plan #${state.subscriptions.length}` : ''}</div>
  `;
}

function renderHistory() {
  const entries = [...state.entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  historyCount.textContent = entries.length ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : '';
  historyEmpty.classList.toggle('hidden', entries.length > 0);
  historyList.innerHTML = entries.map((e) => `
    <div class="history-row" data-id="${e.id}">
      <span class="history-date">${fmtDate(e.date)}</span>
      <span class="history-count-badge">${e.count} tiffin${e.count > 1 ? 's' : ''}</span>
      <span class="history-note">${escapeHtml(e.note || '')}</span>
      <button class="history-delete" title="Delete entry" data-id="${e.id}">&times;</button>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Events ---

entryForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const date = $('entryDate').value || todayISO();
  const count = Number($('entryCount').value);
  const note = $('entryNote').value.trim();
  if (!count || count < 1) return;

  state.entries.push({ id: uid(), date, count, note });
  entryForm.reset();
  $('entryCount').value = 1;
  $('entryDate').value = todayISO();
  render();
  persist();
});

showPlanFormBtn.addEventListener('click', () => {
  const last = state.subscriptions[state.subscriptions.length - 1];
  $('planPrice').value = last ? last.price : 1000;
  $('planCount').value = last ? last.count : 20;
  $('planDate').value = todayISO();
  planForm.classList.remove('hidden');
  showPlanFormBtn.classList.add('hidden');
});

cancelPlanFormBtn.addEventListener('click', () => {
  planForm.classList.add('hidden');
  showPlanFormBtn.classList.remove('hidden');
});

planForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const price = Number($('planPrice').value);
  const count = Number($('planCount').value);
  const date = $('planDate').value || todayISO();
  if (!count || count < 1) return;

  state.subscriptions.push({ id: uid(), price, count, date });
  planForm.classList.add('hidden');
  showPlanFormBtn.classList.remove('hidden');
  render();
  persist();
});

historyList.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.history-delete');
  if (!btn) return;
  const id = btn.dataset.id;
  state.entries = state.entries.filter((e) => e.id !== id);
  render();
  persist();
});

// --- Init ---
$('entryDate').value = todayISO();
loadData();
