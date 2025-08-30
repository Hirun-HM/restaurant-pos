// Helper function to convert units to standard measurements
export const convertToStandardUnit = (value, unit) => {
    const numValue = parseFloat(value);
    switch(unit.toLowerCase()) {
        case 'g': return numValue;
        case 'kg': return numValue * 1000;
        case 'tbsp': return numValue * 15; // Assuming 1 tbsp = 15g
        case 'pcs': return numValue;
        case 'cloves': return numValue * 5; // Assuming 1 clove = 5g
        default: return numValue;
    }
};

export const sriLankanDishes = {
    kottu: {
        name: "Kottu Roti",
        ingredients: {
            roti: { amount: 400, unit: 'g', stockId: 'roti' },
            chicken: { amount: 250, unit: 'g', stockId: 'chicken' },
            egg: { amount: 2, unit: 'pcs', stockId: 'eggs' },
            vegetables: { amount: 200, unit: 'g', stockId: 'mixed_vegetables' },
            soySauce: { amount: 2, unit: 'tbsp', stockId: 'soy_sauce' },
            curryPowder: { amount: 1, unit: 'tbsp', stockId: 'curry_powder' },
            salt: { amount: 5, unit: 'g', stockId: 'salt' },
            oil: { amount: 2, unit: 'tbsp', stockId: 'cooking_oil' }
        },
        portionSize: 1
    },
    riceAndCurry: {
        name: "Rice & Curry",
        ingredients: {
            rice: { amount: 500, unit: 'g', stockId: 'rice' },
            dhalCurry: { amount: 250, unit: 'g', stockId: 'dhal' },
            chickenCurry: { amount: 300, unit: 'g', stockId: 'chicken' },
            polSambol: { amount: 150, unit: 'g', stockId: 'pol_sambol' },
            mallung: { amount: 100, unit: 'g', stockId: 'mallung_greens' },
            papadam: { amount: 2, unit: 'pcs', stockId: 'papadam' }
        },
        portionSize: 1
    },
    seafoodDish: {
        name: "Devilled Seafood",
        ingredients: {
            prawns: { amount: 500, unit: 'g', stockId: 'prawns' },
            onion: { amount: 150, unit: 'g', stockId: 'onions' },
            capsicum: { amount: 100, unit: 'g', stockId: 'capsicum' },
            tomatoSauce: { amount: 3, unit: 'tbsp', stockId: 'tomato_sauce' },
            chiliPaste: { amount: 2, unit: 'tbsp', stockId: 'chili_paste' },
            soySauce: { amount: 1, unit: 'tbsp', stockId: 'soy_sauce' },
            garlic: { amount: 2, unit: 'cloves', stockId: 'garlic' },
            salt: { amount: 5, unit: 'g', stockId: 'salt' },
            oil: { amount: 3, unit: 'tbsp', stockId: 'cooking_oil' }
        },
        portionSize: 1
    }
};

// Function to check if we have enough stock for a dish
export const checkStockAvailability = (dish, quantity, stockItems) => {
    const dishData = sriLankanDishes[dish];
    if (!dishData) return { available: false, missingItems: [], insufficientItems: [] };

    const missingItems = [];
    const insufficientItems = [];

    for (const [ingredient, details] of Object.entries(dishData.ingredients)) {
        const stockItem = stockItems.find(item => item.id === details.stockId);
        
        if (!stockItem) {
            missingItems.push(ingredient);
            continue;
        }

        const requiredAmount = convertToStandardUnit(details.amount, details.unit) * quantity;
        const availableAmount = convertToStandardUnit(stockItem.quantity, stockItem.unit);

        if (availableAmount < requiredAmount) {
            insufficientItems.push({
                ingredient,
                required: requiredAmount,
                available: availableAmount,
                unit: stockItem.unit
            });
        }
    }

    return {
        available: missingItems.length === 0 && insufficientItems.length === 0,
        missingItems,
        insufficientItems
    };
};

// Function to update stock when a dish is ordered
export const updateStockForDish = (dish, quantity, stockItems, setStockItems) => {
    const dishData = sriLankanDishes[dish];
    if (!dishData) return false;

    const availability = checkStockAvailability(dish, quantity, stockItems);
    if (!availability.available) return false;

    const updatedStockItems = stockItems.map(stockItem => {
        for (const [, details] of Object.entries(dishData.ingredients)) {
            if (stockItem.id === details.stockId) {
                const requiredAmount = convertToStandardUnit(details.amount, details.unit) * quantity;
                const currentAmount = convertToStandardUnit(stockItem.quantity, stockItem.unit);
                
                return {
                    ...stockItem,
                    quantity: currentAmount - requiredAmount
                };
            }
        }
        return stockItem;
    });

    setStockItems(updatedStockItems);
    return true;
};
