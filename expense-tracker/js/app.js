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