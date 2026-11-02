//Перевірка підключення файлу
console.log('app.js підключено');

//Оголошення даних варіанта
const transactions = [
    { 
        amount: 400, 
        type: 'витрата', 
        category: 'Їжа', 
        title: 'Кафе', 
        date: '10 вересня 2026',
        datetime: '2026-09-10',
        badgeClass: 'category-badge--food',
        icon: 'assets/food.png',
        alt: 'Категорія Їжа. Зображення столового приладдя'
    },
    { 
        amount: 250, 
        type: 'витрата', 
        category: 'Покупки', 
        title: 'Супермаркет', 
        date: '11 вересня 2026',
        datetime: '2026-09-11',
        badgeClass: 'category-badge--shop',
        icon: 'assets/shop.png',
        alt: 'Категорія Покупки. Зображення візка'
    },
    { 
        amount: 15000, 
        type: 'дохід', 
        category: 'Дохід', 
        title: 'Зарплата', 
        date: '27 серпня 2026',
        datetime: '2026-08-27',
        badgeClass: 'category-badge--income',
        icon: 'assets/income.jpg',
        alt: 'Категорія Дохід. Зображення купюр'
    }
];

const staticCard = document.querySelector('#transactions-list .card');
if (staticCard) {
    staticCard.remove();
}

const listContainer = document.querySelector('#transactions-list');
const balanceElement = document.querySelector('#balance');
const budgetStatusElement = document.querySelector('#budget-status');

function renderTransactions(data) {
    listContainer.innerHTML = '';
    let totalBalance = 0;

    data.forEach(item => {
        const card = document.createElement('li');
        card.classList.add('card');

        //Картинка
        const img = document.createElement('img');
        img.src = item.icon;
        img.alt = item.alt;
        img.classList.add('card_icon');

        // Інфо-блок
        const cardInfo = document.createElement('div');
        cardInfo.classList.add('card-info');

        const title = document.createElement('h3');
        title.textContent = item.title;

        // Кольоровий бейдж
        const categoryBadge = document.createElement('span');
        categoryBadge.classList.add('category-badge', item.badgeClass);
        categoryBadge.textContent = item.category;

        // Поле «amount грн (type)»
        const typeText = document.createElement('p');
        typeText.classList.add('date');
        typeText.textContent = `${item.amount} грн (${item.type})`;

        // Дата додавання запису
        const dateParam = document.createElement('p');
        dateParam.classList.add('date');
        dateParam.textContent = 'Дата: ';

        const timeElem = document.createElement('time');
        timeElem.setAttribute('datetime', item.datetime);
        timeElem.textContent = item.date;
        dateParam.append(timeElem);

        cardInfo.append(title, categoryBadge, typeText, dateParam);

        // Виводимо коментар, якщо він є (для API-даних)
        if (item.comment) {
            const commentParam = document.createElement('p');
            commentParam.classList.add('date'); // Використовуємо існуючий сірий стиль
            commentParam.style.fontStyle = 'italic'; // Трохи виділимо курсивом
            commentParam.textContent = `${item.comment}`;
            cardInfo.append(commentParam);
        }

        //сума
        const amountText = document.createElement('p');
        amountText.classList.add('amount');

        const isIncome = item.type === 'дохід';
        amountText.textContent = `${isIncome ? '+' : '-'}${item.amount} грн`;

        // data-amount
        card.dataset.amount = item.amount;

        // клас income або expense
        if (isIncome) {
            card.classList.add('income');
            amountText.classList.add('amount--income');
            totalBalance += item.amount;
        } else {
            card.classList.add('expense');
            amountText.classList.add('amount--expense');
            totalBalance -= item.amount;
        }

        card.append(img, cardInfo, amountText);
        listContainer.append(card);
    });

    //Оновлення балансу
    if (balanceElement) {
        balanceElement.textContent = `${totalBalance >= 0 ? '+' : ''}${totalBalance} грн`;
    }

    //Оновлення індикатора балансу
    if (budgetStatusElement) {
        if (totalBalance >= 0) {
            budgetStatusElement.textContent = 'Бюджет у нормі';
            budgetStatusElement.className = 'budget-status budget-status--good';
        } else {
            budgetStatusElement.textContent = 'Перевитрати бюджету';
            budgetStatusElement.className = 'budget-status budget-status--warning';
        }
    }
}

renderTransactions(transactions);


// Функція проходить масивом транзакцій за допомогою циклу for,
// розраховує підсумковий баланс та класифікує його за допомогою if/else.
function calculateBalance(operations) {
    let totalBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    // Обробка даних циклом for
    for (let i = 0; i < operations.length; i++) {
        if (operations[i].type === 'дохід') {
            totalBalance += operations[i].amount;
            totalIncome += operations[i].amount;
        } else if (operations[i].type === 'витрата') {
            totalBalance -= operations[i].amount;
            totalExpense += operations[i].amount;
        }
    }

    console.log(`Підсумковий баланс: ${totalBalance} грн`);

    // Умовна класифікація (if/else)
    if (totalBalance >= 0) {
        console.log('Статус бюджету: Підсумковий баланс додатний (бюджет у нормі)');
    } else {
        console.log('Статус бюджету: Підсумковий баланс від’ємний (перевитрати)');
    }

    return { totalBalance, totalIncome, totalExpense };
}

// Виклик функції обробки даних
const summary = calculateBalance(transactions);

// Стрілкова функція для обчислення відсотка частки від загальної суми
const toPercent = (part, total) => Math.round((part / total) * 100);

// Виклик стрілкової функції з реальними даними та вивід результату
if (summary.totalIncome > 0) {
    const expensePercentage = toPercent(summary.totalExpense, summary.totalIncome);
    console.log(`Частка витрат від загального доходу: ${expensePercentage}%`);
}

//Створення та збереження нових записі вчерез форму. Практикум 8
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

//Валідація полів
titleInput.addEventListener('input', () => {
    titleInput.setCustomValidity('');
});
titleInput.addEventListener('invalid', () => {
    if (titleInput.value.trim() === '') {
        titleInput.setCustomValidity('Будь ласка, введіть назву операції');
    }
});

amountInput.addEventListener('input', () => {
    if (amountInput.value === '') {
        amountInput.setCustomValidity('');
    } else if (Number(amountInput.value) <= 0) {
        amountInput.setCustomValidity('Сума має бути більшою за нуль');
    } else {
        amountInput.setCustomValidity('');
    }
});
amountInput.addEventListener('invalid', () => {
    if (amountInput.value === '') {
        amountInput.setCustomValidity('Будь ласка, введіть суму');
    }
});

typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'дохід') {
        categoryInput.value = 'Дохід';
    }
});

//Обробник нового заису
form.addEventListener('submit', (event) => {
    event.preventDefault();

    //Зчитання значень
    const title    = titleInput.value.trim();
    const amount   = Number(amountInput.value);
    const type     = typeSelect.value;
    const category = categoryInput.value;

    const meta = CATEGORY_META[category];
    if (!meta) return;

    //Створення об'єкту
    const now = new Date();
    const monthsUa = [
        'січня','лютого','березня','квітня','травня','червня',
        'липня','серпня','вересня','жовтня','листопада','грудня'
    ];
    
    const newTransaction = {
        amount,
        type,
        category,
        title,
        date:      `${now.getDate()} ${monthsUa[now.getMonth()]} ${now.getFullYear()}`,
        datetime:  now.toISOString().split('T')[0],
        badgeClass: meta.badge,
        icon:      meta.icon,
        alt:       meta.alt
    };

    transactions.push(newTransaction);

    //Рендер та оновлення балансу
    renderTransactions(transactions);
    calculateBalance(transactions);

    form.reset();
});

//Практикум 9
//Виносимо URL в константи
const COMMENTS_API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=2';
const CURRENCY_API_URL = 'https://api.frankfurter.app/latest';

//Знаходимо елементи для стану завантаження та помилок
const loadingIndicator = document.querySelector('#loading-indicator');
const errorMessageEl   = document.querySelector('#error-message');
const refreshBtn       = document.querySelector('#refresh-btn');

// Допоміжні функції для керування станом UI
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
    errorMessageEl.textContent = '';
}

//Бонусна функція: Конвертація валюти через Frankfurter API
async function convertCurrency(amount, from = 'EUR', to = 'USD') {
    try {
        const url = `${CURRENCY_API_URL}?amount=${amount}&from=${from}&to=${to}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Помилка API валют');
        const data = await response.json();
        return data.rates[to]; //Повертає сконвертовану суму
    } catch (err) {
        console.error('Не вдалося сконвертувати валюту:', err);
        return null;
    }
}

//Головна асинхронна функція завантаження даних
async function loadDataFromAPI() {
    hideError();       //Ховаємо старі помилки
    showLoading(true); //Вмикаємо спінер і блокуємо кнопку

    try {
        //Виконуємо fetch
        const response = await fetch(COMMENTS_API_URL);
        
        //Перевірка статусу
        if (!response.ok) {
            throw new Error(`Сервер відповів кодом ${response.status}`);
        }

        //Розбір JSON в потрібний формат даних
        const comments = await response.json();
        console.log('Отримані дані з API:', comments);

        //Мапимо дані API на формат транзакції
        const apiTransactions = comments.map((item, index) => {
            const randomAmount = (index + 1) * 50; // Штучна сума (50, 100, 150...)
            
            // Визначаємо тип випадково для демонстрації (кожен 3-й - дохід)
            const isIncome = index % 3 === 0; 
            const type = isIncome ? 'дохід' : 'витрата';
            const category = isIncome ? 'Дохід' : 'Інше';
            
            // Беремо стилі з словника
            const meta = CATEGORY_META[category] || { badge: 'category-badge--other', icon: 'assets/expense.png', alt: 'Інше' };

            return {
                amount: randomAmount,
                type: type,
                category: category,
                title: item.name.substring(0, 30) + '...', 
                date: new Date().toLocaleDateString('uk-UA'),
                datetime: new Date().toISOString().split('T')[0],
                badgeClass: meta.badge,
                icon: meta.icon,
                alt: meta.alt,
                comment: item.body
            };
        });

        // Бонус: Конвертуємо суму першої транзакції
        if (apiTransactions.length > 0) {
            const firstAmount = apiTransactions[0].amount;
            const converted = await convertCurrency(firstAmount, 'EUR', 'USD');
            if (converted !== null) {
                console.log(`[БОНУС] ${firstAmount} EUR = ${converted.toFixed(2)} USD`);
            }
        }

        //Виводимо дані в DOM
        renderTransactions(apiTransactions);

    } catch (error) {
        //Обробляємо помилку
        console.error('Деталі помилки:', error);
        showError('Не вдалося завантажити дані. Перевірте з’єднання з інтернетом та спробуйте пізніше.');
    } finally {
        //Ховаємо індикатор завантаження
        showLoading(false);
    }
}

//Прив'язуємо кнопку "Оновити" до функції
refreshBtn.addEventListener('click', loadDataFromAPI);