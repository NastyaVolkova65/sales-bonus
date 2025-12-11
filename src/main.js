/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   let revenue = 0;

     for (const item of purchase.items) {
        const fullPrice = item.sale_price * item.quantity;
        const discountDecimal = item.discount / 100;
        const discountedPrice = fullPrice * (1 - discountDecimal);
        revenue += discountedPrice;
    }

    return revenue;
}


/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
      if (index === total - 1) {
        return 0; // 0% бонус
    }

    if (index === 0) {
        return 15; // 15% бонус
    }

    if (index === 1 || index === 2) {
        return 10; // 10% бонус
    }

    return 5; // 5% бонус
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    if (!data || typeof data !== 'object') {
        throw new Error('Данные должны быть объектом');
    }

    if (!data.sellers || !Array.isArray(data.sellers)) {
        throw new Error('Отсутствует массив продавцов');
    }

    if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Отсутствует массив товаров');
    }

    if (!data.purchase_records || !Array.isArray(data.purchase_records)) {
        throw new Error('Отсутствует массив покупок');
    }

    if (!options || typeof options !== 'object') {
        throw new Error('Options должны быть объектом');
    }

    const { calculateRevenue, calculateBonus } = options;

    // @TODO: Проверка наличия опций
    if (typeof calculateRevenue !== 'function') {
         throw new Error('calculateRevenue должна быть функцией');
    }

    if (typeof calculateBonus !== 'function') {
        throw new Error('calculateBonus должна быть функцией');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = {};

    for (const seller of data.sellers) {
        sellerStats[seller.id] = {
            seller_id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {} // для подсчёта проданных товаров
        };
    }

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellersMap = Object.fromEntries(
    data.sellers.map(seller => [seller.id, seller])
    );

    const productsMap = Object.fromEntries(
    data.products.map(product => [product.sku, product])
    );


    // @TODO: Расчет выручки и прибыли для каждого продавца

    for (const purchase of data.purchase_records) {
        const sellerId = purchase.seller_id;
        const seller = sellerStats[sellerId]; // Получаем продавца

    if (!seller) {
        continue; // пропускаем, если продавец не найден
    }

    // Увеличиваем счётчик продаж
        seller.sales_count++;

    // Увеличиваем общую выручку на total_amount из чека
        seller.revenue += purchase.total_amount || 0;

    // Рассчитываем прибыль от каждого товара в покупке
    for (const item of purchase.items) {
        const product = productsMap[item.sku];

        if (!product) {
            continue; // пропускаем, если товар не найден
        }

        // Выручка от этого товара с учётом скидки
        const itemRevenue = item.sale_price * item.quantity * (1 - item.discount / 100);

        // Себестоимость товара
        const itemCost = product.purchase_price * item.quantity;

        // Прибыль = Выручка - Себестоимость
        const itemProfit = itemRevenue - itemCost;

        seller.profit += itemProfit;

        // Подсчёт количества проданных товаров
        if (!seller.products_sold[item.sku]) {
            seller.products_sold[item.sku] = 0;
        }
        seller.products_sold[item.sku] += item.quantity;
        }
    }
    // @TODO: Сортировка продавцов по прибыли

    const sortedSellers = Object.values(sellerStats).sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования

    sortedSellers.forEach((seller, index) => {
        // Рассчитываем бонус
        seller.bonus = calculateBonus(index, sortedSellers.length, seller);

        // Формируем топ-10 товаров
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity })) // Преобразуем в массив объектов
            .sort((a, b) => b.quantity - a.quantity) // Сортируем по убыванию количества
            .slice(0, 10); // Берем первые 10 элементов
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями

    return sortedSellers.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products, // Уже массив объектов {sku, quantity}
        bonus: +seller.bonus.toFixed(2)
    }));
}

