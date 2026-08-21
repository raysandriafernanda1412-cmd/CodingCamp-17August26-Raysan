// State Aplikasi
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Makanan', 'Transportasi', 'Hiburan', 'Belanja'];
let budgetLimit = Number(localStorage.getItem('budgetLimit')) || 0;
let chartInstance = null;

// Elemen DOM
const totalBalanceEl = document.getElementById('totalBalance');
const transactionForm = document.getElementById('transactionForm');
const descInput = document.getElementById('descInput');
const amountInput = document.getElementById('amountInput');
const categorySelect = document.getElementById('categorySelect');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const transactionListEl = document.getElementById('transactionList');
const budgetLimitInput = document.getElementById('budgetLimit');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  if (budgetLimitInput) budgetLimitInput.value = budgetLimit || '';
  renderCategories();
  updateUI();
  initTheme();
});

// Update Semua Komponen UI
function updateUI() {
  saveToLocalStorage();
  renderTransactions();
  renderBalance();
  renderChart();
}

// Save State
function saveToLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('categories', JSON.stringify(categories));
  localStorage.setItem('budgetLimit', budgetLimit);
}

// Render Kategori ke Dropdown
function renderCategories() {
  if (!categorySelect) return;
  categorySelect.innerHTML = categories
    .map(cat => `<option value="${cat}">${cat}</option>`)
    .join('');
}

// Render Total Balance
function renderBalance() {
  if (!totalBalanceEl) return;
  const total = transactions.reduce((acc, item) => acc + item.amount, 0);
  totalBalanceEl.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

// Render Daftar Transaksi
function renderTransactions() {
  if (!transactionListEl) return;
  transactionListEl.innerHTML = '';
  transactions.forEach((item, index) => {
    const li = document.createElement('li');
    const isOver = budgetLimit > 0 && item.amount > budgetLimit;
    
    li.className = `transaction-item ${isOver ? 'over-limit' : ''}`;
    li.innerHTML = `
      <div>
        <strong>${item.description}</strong>
        <div style="font-size: 0.75rem; opacity: 0.8;">${item.category}</div>
      </div>
      <div>
        <span>Rp ${item.amount.toLocaleString('id-ID')}</span>
        <button type="button" class="delete-btn" onclick="deleteTransaction(${index})">✕</button>
      </div>
    `;
    transactionListEl.appendChild(li);
  });
}

// Form Submission
if (transactionForm) {
  transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Bersihkan input angka dari titik atau karakter lain
    const rawAmount = amountInput.value.replace(/\./g, '');
    const amountVal = Number(rawAmount);

    if (!descInput.value.trim() || isNaN(amountVal) || amountVal <= 0) {
      alert('Mohon isi deskripsi dan nominal angka yang valid!');
      return;
    }
    
    const newTransaction = {
      description: descInput.value.trim(),
      amount: amountVal,
      category: categorySelect.value
    };

    transactions.push(newTransaction);
    descInput.value = '';
    amountInput.value = '';
    updateUI();
  });
}

// Hapus Transaksi
window.deleteTransaction = function(index) {
  transactions.splice(index, 1);
  updateUI();
};

// Tambah Custom Category
if (addCategoryBtn) {
  addCategoryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const newCategory = prompt('Masukkan nama kategori baru:');
    if (newCategory && newCategory.trim() !== '') {
      const cleanCat = newCategory.trim();
      if (!categories.includes(cleanCat)) {
        categories.push(cleanCat);
        renderCategories();
        categorySelect.value = cleanCat;
        saveToLocalStorage();
      }
    }
  });
}

// Limit Warning Input
if (budgetLimitInput) {
  budgetLimitInput.addEventListener('input', (e) => {
    budgetLimit = Number(e.target.value);
    updateUI();
  });
}

// Dark/Light Mode Toggle
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeToggleBtn) themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
}

// Warna chart — diulang otomatis jika kategori lebih dari 7
const CHART_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#C9CBCF'
];

function getChartColors(count) {
  return Array.from({ length: count }, (_, i) => CHART_COLORS[i % CHART_COLORS.length]);
}

// Visual Chart (Chart.js)
function renderChart() {
  const canvas = document.getElementById('categoryChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Jika belum ada transaksi, tampilkan canvas kosong
  if (transactions.length === 0) {
    return;
  }

  const categoryTotals = categories.reduce((acc, cat) => {
    acc[cat] = transactions
      .filter(t => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return acc;
  }, {});

  // Hanya tampilkan kategori yang punya transaksi
  const activeCategories = categories.filter(cat => categoryTotals[cat] > 0);
  const dataValues = activeCategories.map(cat => categoryTotals[cat]);

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: activeCategories,
      datasets: [{
        data: dataValues,
        backgroundColor: getChartColors(activeCategories.length)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}