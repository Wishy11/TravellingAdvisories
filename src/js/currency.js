// API Configuration
const EXCHANGE_API_KEY = 'f5b56c5e50540e5167068e33';

// Main currency conversion function
async function convertCurrency() {
    const amount = document.getElementById('amount').value;
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const resultDiv = document.getElementById('conversionResult');
    const lastUpdatedDiv = document.getElementById('lastUpdated');

    try {
        resultDiv.innerHTML = '<div class="spinner-border spinner-border-sm text-light" role="status"></div>';
        
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/${fromCurrency}`);
        const data = await response.json();

        if (data.result === 'success') {
            const rate = data.conversion_rates[toCurrency];
            const result = (amount * rate).toFixed(2);
            const formattedAmount = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: fromCurrency
            }).format(amount);
            const formattedResult = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: toCurrency
            }).format(result);

            resultDiv.innerHTML = `${formattedAmount} = ${formattedResult}`;
            lastUpdatedDiv.innerHTML = `Last updated: ${new Date(data.time_last_update_unix * 1000).toLocaleString()}`;
        } else {
            throw new Error('Failed to fetch exchange rates');
        }
    } catch (error) {
        console.error('Currency conversion error:', error);
        resultDiv.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    }
}

// Event Listeners
// Currency swap button handler
document.getElementById('swapCurrencies').addEventListener('click', () => {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    convertCurrency();
});

// Real-time conversion listeners
['amount', 'fromCurrency', 'toCurrency'].forEach(id => {
    document.getElementById(id).addEventListener('change', convertCurrency);
});