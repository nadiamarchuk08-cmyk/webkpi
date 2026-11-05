//Перевірка підключення файлу
console.log('app.js підключено');

// Оголошення даних варіанта
const transactions = [
    { 
        amount: 400, type: 'витрата', category: 'Їжа', title: 'Кафе', date: '10 вересня 2026',
        datetime: '2026-09-10', badgeClass: 'category-badge--food', icon: 'assets/food.png', alt: 'Їжа' 
    },
    { 
        amount: 250, type: 'витрата', category: 'Покупки', title: 'Супермаркет', date: '11 вересня 2026',
        datetime: '2026-09-11', badgeClass: 'category-badge--shop', icon: 'assets/shop.png', alt: 'Покупки' 
    },
    { 
        amount: 15000, type: 'дохід', category: 'Дохід', title: 'Зарплата', date: '27 серпня 2026',
        datetime: '2026-08-27', badgeClass: 'category-badge--income', icon: 'assets/income.jpg', alt: 'Дохід' 
    }
];

//ПРАКТИКУМ 10. Vue 3
//Обрано Vue 3 через простоту інтеграції: його шаблони базуються на звичайному HTML, а для запуску достатньо CDN, без потреби у додаткових компіляторах.

//4. Створюємо компонент ExpenseRow
const ExpenseRow = {
    props: ['id', 'title', 'amount', 'type', 'category', 'date', 'badgeClass', 'icon', 'comment'],
    emits: ['delete'],
    template: `
        <li class="card">
            <img :src="icon" :alt="category" class="card_icon">
            <div class="card-info">
                <h3>{{ title }}</h3>
                <span class="category-badge" :class="badgeClass">{{ category }}</span>
                <p class="date">Дата: {{ date }}</p>
                <!-- Додано вивід коментаря з API (Практикум 9) -->
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

//3. Переносимо дані в реактивний стан
const app = Vue.createApp({
    components: {
        ExpenseRow
    },
    data() {
        return {
            // Починаємо з порожнього масиву. 
            // Дані завантажаться з IndexedDB у mounted()
            transactions: [] 
        };
    },
    // Похідне значення
    computed: {
        totalBalance() {
            return this.transactions.reduce((total, item) => {
                return item.type === 'дохід' ? total + item.amount : total - item.amount;
            }, 0);
        },
        //Підрахунок суми за категоріями
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
        //6. Обробник події від дочірнього компонента
        //додано видалення з IDB та localStorage
        async removeTransaction(id) {
            try {
                await deleteTransaction(id); // Видаляємо з IndexedDB
                this.transactions = this.transactions.filter(item => item.id !== id); // Оновлюємо Vue
                saveToLocalStorage(this.transactions); // Синхронізуємо localStorage
            } catch (error) {
                console.error('Помилка видалення:', error);
            }
        },
        //Завантаження при старті
        async loadTransactions() {
            try {
                await migrateFromLocalStorage();
                this.transactions = await getAllTransactions(); // Беремо з IDB
            } catch (error) {
                console.error('Помилка IndexedDB, використовуємо localStorage:', error);
                this.transactions = loadFromLocalStorage(); // Запасний варіант
                showError('Помилка бази даних. Дані завантажено з тимчасового сховища.');
            }
        }
    },

    mounted() {
        this.loadTransactions();
    }
});

const vm = app.mount('#app'); 

/* ============================================================: 
   Функцію renderTransactions(), staticCard.remove() та 
   calculateBalance() ВИДАЛЕНО, оскільки тепер 
   цим займається реактивний Vue.
   ============================================================ */


//ПРАКТИКУМ 11. Робота з IndexedDB та localStorage

const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

// 2. Функції для localStorage
function saveToLocalStorage(items) {
    localStorage.setItem('transactions', JSON.stringify(items));
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem('transactions');
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Пошкоджені дані в localStorage:', error);
        return [];
    }
}

// 6. Відкриття бази IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // 5. Створюємо сховище з autoIncrement: true
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error); 
    });
}

// 7. CRUD-функції для IndexedDB
async function addTransaction(item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        // Видаляємо id, якщо він є
        const itemWithoutId = { ...item };
        delete itemWithoutId.id;

        const request = store.put(itemWithoutId);
        request.onsuccess = () => resolve(request.result); // повертає згенерований ID
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
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// 8. Міграція з localStorage
async function migrateFromLocalStorage() {
    const migrated = localStorage.getItem('migratedToIDB');
    if (migrated) return; 

    const localData = loadFromLocalStorage();
    if (localData.length > 0) {
        console.log('Міграція даних з localStorage в IndexedDB...');
        for (const item of localData) {
            await addTransaction(item);
        }
    }
    localStorage.setItem('migratedToIDB', 'true');
}


//ПРАКТИКУМ 8. Обробка форми
const form          = document.querySelector('#transaction-form');
const titleInput    = document.querySelector('#title');
const amountInput   = document.querySelector('#amount');
const typeSelect    = document.querySelector('#type');
const categoryInput = document.querySelector('#category');

// Довідник категорій
const CATEGORY_META = {
    'Їжа':       { badge: 'category-badge--food',      icon: 'assets/food.png',      alt: 'Категорія "їжа"' },
    'Транспорт': { badge: 'category-badge--transport', icon: 'assets/transport.png', alt: 'Категорія "Транспорт"' },
    'Покупки':   { badge: 'category-badge--shop',      icon: 'assets/shop.png',      alt: 'Категорія "Покупки"' },
    'Дохід':     { badge: 'category-badge--income',    icon: 'assets/income.jpg',    alt: 'Категорія "Дохід"' },
    'Інше':      { badge: 'category-badge--other',     icon: 'assets/expense.png',   alt: 'Категорія "Інше"' }
};

// Валідація
titleInput.addEventListener('input', () => titleInput.setCustomValidity(''));
titleInput.addEventListener('invalid', () => {
    if (titleInput.value.trim() === '') titleInput.setCustomValidity('Будь ласка, введіть назву');
});

amountInput.addEventListener('input', () => {
    if (amountInput.value === '') amountInput.setCustomValidity('');
    else if (Number(amountInput.value) <= 0) amountInput.setCustomValidity('Сума має бути більшою за нуль');
    else amountInput.setCustomValidity('');
});
amountInput.addEventListener('invalid', () => {
    if (amountInput.value === '') amountInput.setCustomValidity('Будь ласка, введіть суму');
});

typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'дохід') categoryInput.value = 'Дохід';
});

// Обробник додавання
// тепер функція async, зберігає в IDB
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title    = titleInput.value.trim();
    const amount   = Number(amountInput.value);
    const type     = typeSelect.value;
    const category = categoryInput.value;
    const meta     = CATEGORY_META[category];

    if (!meta) return; 

    const now = new Date();
    const monthsUa = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
    
    const newTransaction = {
        // id IndexedDB згенерує сама
        amount, type, category, title,
        date: `${now.getDate()} ${monthsUa[now.getMonth()]} ${now.getFullYear()}`,
        badgeClass: meta.badge,
        icon: meta.icon,
        alt: meta.alt
    };

    try {
        const newId = await addTransaction(newTransaction); // Зберігаємо в IDB
        vm.transactions.unshift({ id: newId, ...newTransaction }); // Додаємо у Vue
        saveToLocalStorage(vm.transactions); // Зберігаємо в LocalStorage

        // Очищення
        form.reset();
        titleInput.setCustomValidity('');
        amountInput.setCustomValidity('');
    } catch (error) {
        console.error("Помилка збереження:", error);
        alert("Не вдалося зберегти транзакцію.");
    }
});

//ПРАКТИКУМ 9. Fetch API
const COMMENTS_API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=2';
const CURRENCY_API_URL = 'https://api.frankfurter.app/latest';

const loadingIndicator = document.querySelector('#loading-indicator');
const errorMessageEl   = document.querySelector('#error-message');
const refreshBtn       = document.querySelector('#refresh-btn');

function showLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.style.display = 'block';
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Завантаження...';
    } else {
        loadingIndicator.style.display = 'none';
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Оновити дані з API';
    }
}

function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.style.display = 'block';
}

function hideError() {
    errorMessageEl.style.display = 'none';
}

async function convertCurrency(amount, from = 'EUR', to = 'USD') {
    try {
        const url = `${CURRENCY_API_URL}?amount=${amount}&from=${from}&to=${to}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Помилка API');
        const data = await response.json();
        return data.rates[to];
    } catch (err) {
        console.error('Помилка конвертації:', err);
        return null;
    }
}

async function loadDataFromAPI() {
    hideError();
    showLoading(true);

    try {
        const response = await fetch(COMMENTS_API_URL);
        if (!response.ok) throw new Error(`Код ${response.status}`);
        const comments = await response.json();

        const apiTransactions = comments.map((item, index) => {
            const randomAmount = (index + 1) * 50;
            const isIncome = index % 3 === 0;
            const type = isIncome ? 'дохід' : 'витрата';
            const category = isIncome ? 'Дохід' : 'Інше';
            const meta = CATEGORY_META[category] || { badge: 'category-badge--other', icon: 'assets/expense.png' };

            return {
                amount: randomAmount,
                type: type,
                category: category,
                title: item.name.substring(0, 30) + '...',
                date: new Date().toLocaleDateString('uk-UA'),
                badgeClass: meta.badge,
                icon: meta.icon,
                comment: item.body
            };
        });

        if (apiTransactions.length > 0) {
            const converted = await convertCurrency(apiTransactions[0].amount, 'EUR', 'USD');
            if (converted !== null) console.log(`[БОНУС] ${apiTransactions[0].amount} EUR = ${converted.toFixed(2)} USD`);
        }
        
        //зберігаємо кожну транзакцію з API в IDB
        for (const tx of apiTransactions) {
            const newId = await addTransaction(tx);
            vm.transactions.push({ id: newId, ...tx });
        }
        
        saveToLocalStorage(vm.transactions); // Синхронізуємо LocalStorage

    } catch (error) {
        console.error(error);
        showError('Не вдалося завантажити дані...');
    } finally {
        showLoading(false);
    }
}

refreshBtn.addEventListener('click', loadDataFromAPI);