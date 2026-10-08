//Перевірка підключення файлу
console.log('app.js підключено');

//Оголошення даних варіанта
const transactions = [
    { amount: 400, type: 'витрата' },
    { amount: 250, type: 'витрата' },
    { amount: 15000, type: 'дохід' }
];

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