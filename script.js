document.addEventListener('DOMContentLoaded', () => {
    // Fix iOS active state delay
    document.body.addEventListener('touchstart', function() {}, {passive: true});

    const priceInput = document.getElementById('price');
    const quotaDayInput = document.getElementById('quota-day');
    const quotaMonthInput = document.getElementById('quota-month');
    const userPayAmount = document.getElementById('user-pay-amount');
    const govPayAmount = document.getElementById('gov-pay-amount');
    
    // Modal elements
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const settingsModal = document.getElementById('settings-modal');

    // Section elements
    const numpadSection = document.getElementById('numpad-section');
    const resultsSection = document.getElementById('results-section');
    const btnConfirm = document.getElementById('btn-confirm');
    const btnBack = document.getElementById('btn-back');
    const btnDone = document.getElementById('btn-done');

    // History elements
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('close-history');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // State
    let quotaDay = parseFloat(localStorage.getItem('tct_quotaDay')) || 200;
    let quotaMonth = parseFloat(localStorage.getItem('tct_quotaMonth')) || 1000;
    let history = JSON.parse(localStorage.getItem('tct_history')) || [];

    quotaDayInput.value = quotaDay;
    quotaMonthInput.value = quotaMonth;

    function calculate() {
        let price = parseFloat(priceInput.value);
        quotaDay = parseFloat(quotaDayInput.value);
        quotaMonth = parseFloat(quotaMonthInput.value);

        if (isNaN(price) || price < 0) price = 0;
        if (isNaN(quotaDay) || quotaDay < 0) quotaDay = 0;
        if (isNaN(quotaMonth) || quotaMonth < 0) quotaMonth = 0;

        localStorage.setItem('tct_quotaDay', quotaDay);
        localStorage.setItem('tct_quotaMonth', quotaMonth);

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

    // Add event listeners for quota inputs
    quotaDayInput.addEventListener('input', calculate);
    quotaMonthInput.addEventListener('input', calculate);

    // Section toggles
    btnConfirm.addEventListener('click', () => {
        if (priceInput.value === '0' || priceInput.value === '') return;
        numpadSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        calculate();
    });

    btnBack.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        numpadSection.classList.remove('hidden');
    });

    btnDone.addEventListener('click', () => {
        let currentGovPay = parseFloat(govPayAmount.innerText.replace(/,/g, ''));
        let currentUserPay = parseFloat(userPayAmount.innerText.replace(/,/g, ''));
        let currentPrice = parseFloat(priceInput.value);

        // Save History
        history.unshift({
            time: new Date().toLocaleString('th-TH'),
            price: currentPrice,
            gov: currentGovPay,
            user: currentUserPay
        });
        localStorage.setItem('tct_history', JSON.stringify(history));

        // Deduct Quotas
        quotaDay = Math.max(0, quotaDay - currentGovPay);
        quotaMonth = Math.max(0, quotaMonth - currentGovPay);
        quotaDayInput.value = quotaDay;
        quotaMonthInput.value = quotaMonth;
        localStorage.setItem('tct_quotaDay', quotaDay);
        localStorage.setItem('tct_quotaMonth', quotaMonth);

        // Reset App
        priceInput.value = '0';
        resultsSection.classList.add('hidden');
        numpadSection.classList.remove('hidden');
    });

    // Numpad logic
    const numBtns = document.querySelectorAll('.num-btn[data-val]');
    const btnClear = document.getElementById('btn-clear');
    const btnDel = document.getElementById('btn-del');

    numBtns.forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault(); // Prevents simulated mouse click firing later
            if (priceInput.value === '0') {
                priceInput.value = btn.dataset.val;
            } else {
                priceInput.value += btn.dataset.val;
            }
        });
    });

    btnClear.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        priceInput.value = '0';
    });

    btnDel.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        priceInput.value = priceInput.value.slice(0, -1);
        if (priceInput.value === '') {
            priceInput.value = '0';
        }
    });

    // Settings Modal listeners
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // History rendering
    function renderHistory() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align:center; color:#64748b;">ไม่มีประวัติการใช้งาน</p>';
            return;
        }

        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="time">${item.time}</div>
                <div class="details">
                    <span>สินค้า: ${item.price} ฿</span>
                    <span class="text-blue">เป๋าตัง: ${item.user} ฿</span>
                    <span class="text-green">รัฐ: ${item.gov} ฿</span>
                </div>
            `;
            historyList.appendChild(div);
        });
    }

    // History Modal listeners
    historyBtn.addEventListener('click', () => {
        renderHistory();
        historyModal.classList.remove('hidden');
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.add('hidden');
        }
    });

    clearHistoryBtn.addEventListener('click', () => {
        if(confirm('ต้องการล้างประวัติทั้งหมดใช่หรือไม่?')) {
            history = [];
            localStorage.setItem('tct_history', JSON.stringify(history));
            renderHistory();
        }
    });

    // Initial calculation
    calculate();
    
    // Auto focus price input
    priceInput.focus();
});
