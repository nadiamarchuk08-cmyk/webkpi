//Перевірка підключення файлу
console.log('app.js підключено');

//ПРАКТИКУМ 10. Vue 3
const ExpenseRow = {
    props: ['id', 'title', 'amount', 'type', 'category', 'date', 'badgeClass', 'icon', 'comment'],
    // ДОДАНО ДЛЯ ПРАКТИКУМУ 13: подія view-category
    emits: ['delete', 'view-category'], 
    template: `
        <li class="card">
            <img :src="icon" :alt="category" class="card_icon">
            <div class="card-info">
                <h3>{{ title }}</h3>
                <!-- ДОДАНО ДЛЯ ПРАКТИКУМУ 13: клік по бейджу веде на сторінку категорії -->
                <span class="category-badge" :class="badgeClass" @click="$emit('view-category', category)" style="cursor: pointer;" title="Показати всі витрати цієї категорії">
                    {{ category }}
                </span>
                <p class="date">Дата: {{ date }}</p>
                <p v-if="comment" class="date" style="font-style: italic;">💬 {{ comment }}</p>
            </div>
            
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                <p class="amount" :class="type === 'дохід' ? 'amount--income' : 'amount--expense'">
                    {{ type === 'дохід' ? '+' : '-' }}{{ amount }} грн
                </p>
                <button @click="$emit('delete', id)" style="background:none; border:none; color:red; cursor:pointer; font-size:12px; margin-top:5px;">
                    Видалити
                </button>
            </div>
        </li>
    `
};

const app = Vue.createApp({
    components: { ExpenseRow },
    data() {
        return {
            transactions: [],
            // ДОДАНО ДЛЯ ПРАКТИКУМУ 13: Поточний шлях
            currentPath: window.location.hash.slice(1) || '/' 
        };
    },
    computed: {
        // ДОДАНО ДЛЯ ПРАКТИКУМУ 13: Визначення активного маршруту
        currentRoute() {
            if (this.currentPath.startsWith('/category/')) return '/category/:category';
            if (['/', '/stats'].includes(this.currentPath)) return this.currentPath;
            return '404';
        },
        // ДОДАНО ДЛЯ ПРАКТИКУМУ 13: Отримання параметру категорії з URL
        currentCategory() {
            if (this.currentPath.startsWith('/category/')) {
                return decodeURIComponent(this.currentPath.split('/')[2]);
            }
            return null;
        },
        // ДОДАНО ДЛЯ ПРАКТИКУМУ 13: Фільтрація транзакцій для сторінки категорії
        filteredTransactions() {
            return this.transactions.filter(item => item.category === this.currentCategory);
        },
        totalBalance() {
            return this.transactions.reduce((total, item) => {
                return item.type === 'дохід' ? total + item.amount : total - item.amount;
            }, 0);
        },
        categoryTotals() {
            const totals = {};
            this.transactions.forEach(item => {
                if (item.type === 'витрата') {
                    if (!totals[item.category]) totals[item.category] = 0;
                    totals[item.category] += item.amount;
                }
            });
            return totals;
        }
    },
    methods: {
        // ДОДАНО ДЛЯ ПРАКТИКУМУ 13: Функція навігації
        navigate(path) {
            window.location.hash = path;
        },
        navigateToCategory(category) {
            this.navigate(`/category/${encodeURIComponent(category)}`);
        },
        async removeTransaction(id) {
            try {
                await deleteTransaction(id);
                this.transactions = this.transactions.filter(item => item.id !== id);
                saveToLocalStorage(this.transactions);
            } catch (error) {
                console.error('Помилка видалення:', error);
            }
        },
        async loadTransactions() {
            try {
                await migrateFromLocalStorage();
                this.transactions = await getAllTransactions();
            } catch (error) {
                console.error('Помилка IndexedDB:', error);
                this.transactions = loadFromLocalStorage();
                showError('Помилка бази даних. Дані завантажено з тимчасового сховища.');
            }
        },
        getCategoryBadgeClass(category) {
            const meta = CATEGORY_META[category];
            return meta ? meta.badge : 'category-badge--other';
        }
    },
    mounted() {
        this.loadTransactions();
        
        // ДОДАНО ДЛЯ ПРАКТИКУМУ 13: Слухач зміни хешу (Крок 7)
        window.addEventListener('hashchange', () => {
            this.currentPath = window.location.hash.slice(1) || '/';
            
            // Якщо перейшли на статистику, треба перемалювати Canvas
            if (this.currentRoute === '/stats') {
                this.$nextTick(() => {
                    drawPieChart(1);
                });
            }
        });
    }
});

const vm = app.mount('#app'); 

//ПРАКТИКУМ 12. Canvas API
const CHART_COLORS = { 'Їжа': '#ff922b', 'Транспорт': '#be4bdb', 'Покупки': '#339af0', 'Інше': '#868e96', 'Дохід': '#40c057' };
let animationFrameId = null;

function drawPieChart(progress = 1) {
    // Знаходимо canvas щоразу, бо він може бути відсутнім на інших сторінках
    const canvas = document.getElementById('expense-chart');
    if (!canvas) return; 
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const data = vm.categoryTotals;
    const categories = Object.keys(data);
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) {
        ctx.fillStyle = '#adb5bd'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Немає даних для діаграми', canvas.width / 2, canvas.height / 2);
        return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    let startAngle = -Math.PI / 2;

    categories.forEach(category => {
        const amount = data[category];
        const sliceAngle = (amount / total) * 2 * Math.PI;
        const currentSliceAngle = sliceAngle * progress;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + currentSliceAngle);
        ctx.closePath();

        ctx.fillStyle = CHART_COLORS[category] || '#ced4da';
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

        startAngle += currentSliceAngle;
    });
}

function animateChart() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    let startTime = null;
    const duration = 600;
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        drawPieChart(progress);
        if (progress < 1) animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
}

// Перемальовуємо діаграму при зміні даних
vm.$watch('transactions', () => { animateChart(); }, { deep: true });
vm.$watch('currentRoute', () => { 
    if (vm.currentRoute === '/stats') animateChart(); 
});


// ПРАКТИКУМ 11. Робота з IndexedDB та localStorage
const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

function saveToLocalStorage(items) { localStorage.setItem('transactions', JSON.stringify(items)); }
function loadFromLocalStorage() {
    try { const raw = localStorage.getItem('transactions'); return raw ? JSON.parse(raw) : []; } 
    catch (error) { return []; }
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error); 
    });
}

async function addTransaction(item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const itemWithoutId = { ...item };
        delete itemWithoutId.id;
        const request = store.put(itemWithoutId);
        request.onsuccess = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
    });
}

async function getAllTransactions() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteTransaction(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function migrateFromLocalStorage() {
    const migrated = localStorage.getItem('migratedToIDB');
    if (migrated) return; 
    const localData = loadFromLocalStorage();
    if (localData.length > 0) { for (const item of localData) await addTransaction(item); }
    localStorage.setItem('migratedToIDB', 'true');
}


// ПРАКТИКУМ 8. Обробка форми
const form          = document.querySelector('#transaction-form');
const titleInput    = document.querySelector('#title');
const amountInput   = document.querySelector('#amount');
const typeSelect    = document.querySelector('#type');
const categoryInput = document.querySelector('#category');

const CATEGORY_META = {
    'Їжа':       { badge: 'category-badge--food',      icon: 'assets/food.png',      alt: 'Їжа' },
    'Транспорт': { badge: 'category-badge--transport', icon: 'assets/transport.png', alt: 'Транспорт' },
    'Покупки':   { badge: 'category-badge--shop',      icon: 'assets/shop.png',      alt: 'Покупки' },
    'Дохід':     { badge: 'category-badge--income',    icon: 'assets/income.jpg',    alt: 'Дохід' },
    'Інше':      { badge: 'category-badge--other',     icon: 'assets/expense.png',   alt: 'Інше' }
};

titleInput.addEventListener('input', () => titleInput.setCustomValidity(''));
titleInput.addEventListener('invalid', () => { if (titleInput.value.trim() === '') titleInput.setCustomValidity('Будь ласка, введіть назву'); });
amountInput.addEventListener('input', () => {
    if (amountInput.value === '') amountInput.setCustomValidity('');
    else if (Number(amountInput.value) <= 0) amountInput.setCustomValidity('Сума має бути більшою за нуль');
    else amountInput.setCustomValidity('');
});
amountInput.addEventListener('invalid', () => { if (amountInput.value === '') amountInput.setCustomValidity('Будь ласка, введіть суму'); });
typeSelect.addEventListener('change', () => { if (typeSelect.value === 'дохід') categoryInput.value = 'Дохід'; });

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim(), amount = Number(amountInput.value);
    const type = typeSelect.value, category = categoryInput.value;
    const meta = CATEGORY_META[category];
    if (!meta) return; 

    const now = new Date();
    const monthsUa = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
    
    const newTransaction = {
        amount, type, category, title,
        date: `${now.getDate()} ${monthsUa[now.getMonth()]} ${now.getFullYear()}`,
        badgeClass: meta.badge, icon: meta.icon, alt: meta.alt
    };

    try {
        const newId = await addTransaction(newTransaction);
        vm.transactions.unshift({ id: newId, ...newTransaction });
        saveToLocalStorage(vm.transactions);
        form.reset();
        titleInput.setCustomValidity(''); amountInput.setCustomValidity('');
    } catch (error) { alert("Не вдалося зберегти транзакцію."); }
});


// ПРАКТИКУМ 9. Fetch API
const COMMENTS_API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=2';
const CURRENCY_API_URL = 'https://api.frankfurter.app/latest';
const loadingIndicator = document.querySelector('#loading-indicator');
const errorMessageEl   = document.querySelector('#error-message');
const refreshBtn       = document.querySelector('#refresh-btn');

function showLoading(isLoading) {
    if (isLoading) { loadingIndicator.style.display = 'block'; refreshBtn.disabled = true; refreshBtn.textContent = 'Завантаження...'; } 
    else { loadingIndicator.style.display = 'none'; refreshBtn.disabled = false; refreshBtn.textContent = 'Оновити дані з API'; }
}
function showError(message) { errorMessageEl.textContent = message; errorMessageEl.style.display = 'block'; }
function hideError() { errorMessageEl.style.display = 'none'; }

async function convertCurrency(amount, from = 'EUR', to = 'USD') {
    try {
        const response = await fetch(`${CURRENCY_API_URL}?amount=${amount}&from=${from}&to=${to}`);
        if (!response.ok) throw new Error('Помилка API');
        const data = await response.json();
        return data.rates[to];
    } catch (err) { return null; }
}

async function loadDataFromAPI() {
    hideError(); showLoading(true);
    try {
        const response = await fetch(COMMENTS_API_URL);
        if (!response.ok) throw new Error(`Код ${response.status}`);
        const comments = await response.json();

        const apiTransactions = comments.map((item, index) => {
            const randomAmount = (index + 1) * 50;
            const isIncome = index % 3 === 0;
            const type = isIncome ? 'дохід' : 'витрата';
            const category = isIncome ? 'Дохід' : 'Інше';
            const meta = CATEGORY_META[category];
            return {
                amount: randomAmount, type: type, category: category,
                title: item.name.substring(0, 30) + '...',
                date: new Date().toLocaleDateString('uk-UA'),
                badgeClass: meta.badge, icon: meta.icon, comment: item.body
            };
        });

        if (apiTransactions.length > 0) await convertCurrency(apiTransactions[0].amount, 'EUR', 'USD');
        
        for (const tx of apiTransactions) {
            const newId = await addTransaction(tx);
            vm.transactions.push({ id: newId, ...tx });
        }
        saveToLocalStorage(vm.transactions);
    } catch (error) {
        showError('Не вдалося завантажити дані...');
    } finally { showLoading(false); }
}
refreshBtn.addEventListener('click', loadDataFromAPI);