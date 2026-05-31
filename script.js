document.addEventListener('DOMContentLoaded', () => {
    const priceInput = document.getElementById('price');
    const quotaDayInput = document.getElementById('quota-day');
    const quotaMonthInput = document.getElementById('quota-month');
    const userPayAmount = document.getElementById('user-pay-amount');
    const govPayAmount = document.getElementById('gov-pay-amount');

    function calculate() {
        let price = parseFloat(priceInput.value);
        let quotaDay = parseFloat(quotaDayInput.value);
        let quotaMonth = parseFloat(quotaMonthInput.value);

        if (isNaN(price) || price < 0) price = 0;
        if (isNaN(quotaDay) || quotaDay < 0) quotaDay = 0;
        if (isNaN(quotaMonth) || quotaMonth < 0) quotaMonth = 0;

        if (quotaDay > 200) quotaDay = 200; // Maximum daily quota per rule
        if (quotaMonth > 1000) quotaMonth = 1000; // Maximum monthly quota

        // Government pays 60%, capped at BOTH remaining daily and monthly quotas
        let govPay = price * 0.6;
        govPay = Math.min(govPay, quotaDay, quotaMonth);

        // User pays the rest
        let userPay = price - govPay;

        // Format to 2 decimal places
        const formattedUserPay = userPay.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedGovPay = govPay.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Update DOM if changed
        if (userPayAmount.innerText !== formattedUserPay) {
            userPayAmount.innerText = formattedUserPay;
            triggerAnimation(userPayAmount);
        }
        
        if (govPayAmount.innerText !== formattedGovPay) {
            govPayAmount.innerText = formattedGovPay;
            triggerAnimation(govPayAmount);
        }
    }

    function triggerAnimation(element) {
        element.classList.remove('animate-pulse');
        // Force reflow
        void element.offsetWidth;
        element.classList.add('animate-pulse');
    }

    // Add event listeners
    priceInput.addEventListener('input', calculate);
    quotaDayInput.addEventListener('input', calculate);
    quotaMonthInput.addEventListener('input', calculate);

    // Initial calculation
    calculate();
    
    // Auto focus price input
    priceInput.focus();
});
