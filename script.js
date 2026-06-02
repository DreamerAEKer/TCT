document.addEventListener('DOMContentLoaded', () => {
    // Fix iOS active state delay
    document.body.addEventListener('touchstart', function() {}, {passive: true});

    // Inputs
    const priceInput = document.getElementById('price');
    const govPriceInput = document.getElementById('gov-price');
    let activeInput = priceInput; // default

    // Quotas
    const quotaDayInput = document.getElementById('quota-day');
    const quotaMonthInput = document.getElementById('quota-month');
    
    // Split Bill Elements
    const userPayAmount = document.getElementById('user-pay-amount');
    const govPayAmount = document.getElementById('gov-pay-amount');
    
    // Fill 40% Elements
    const fillUserTopup = document.getElementById('fill-user-topup');
    const fillTotalAmount = document.getElementById('fill-total-amount');
    const fillGovPart = document.getElementById('fill-gov-part');
    const fillUserPart = document.getElementById('fill-user-part');
    const fillTotalPart = document.getElementById('fill-total-part');

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

    // Tab elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // State
    let quotaDay = Math.round((parseFloat(localStorage.getItem('tct_quotaDay')) || 200) * 100) / 100;
    let quotaMonth = Math.round((parseFloat(localStorage.getItem('tct_quotaMonth')) || 1000) * 100) / 100;
    let history = JSON.parse(localStorage.getItem('tct_history')) || [];

    const timeAlert = document.getElementById('time-alert');

    quotaDayInput.value = quotaDay;
    quotaMonthInput.value = quotaMonth;

    function checkTimeRestriction() {
        const now = new Date();
        const hours = now.getHours();
        // Allowed time: 06:00 - 23:00
        if (hours < 6 || hours >= 23) {
            timeAlert.classList.remove('hidden');
        } else {
            timeAlert.classList.add('hidden');
        }
    }
    
    // Check time once on load
    checkTimeRestriction();

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));

            // Add active to clicked
            btn.classList.add('active');
            const targetId = `tab-${btn.dataset.tab}`;
            document.getElementById(targetId).classList.remove('hidden');

            // Switch active input
            document.querySelectorAll('.numpad-target').forEach(inp => inp.classList.remove('active-target'));
            if (btn.dataset.tab === 'split') {
                activeInput = priceInput;
                activeInput.classList.add('active-target');
                numpadSection.classList.remove('hidden');
                if (priceInput.value !== '' && priceInput.value !== '0' && !resultsSection.classList.contains('hidden')) {
                    numpadSection.classList.add('hidden');
                }
            } else if (btn.dataset.tab === 'fill40') {
                activeInput = govPriceInput;
                activeInput.classList.add('active-target');
                numpadSection.classList.remove('hidden'); // Fill 40 updates live, always show numpad initially unless we decide otherwise
            }
            calculate();
        });
    });

    function calculate() {
        checkTimeRestriction(); // Check again when user calculates
        
        // Quota updates
        quotaDay = parseFloat(quotaDayInput.value);
        quotaMonth = parseFloat(quotaMonthInput.value);
        if (isNaN(quotaDay) || quotaDay < 0) quotaDay = 0;
        if (isNaN(quotaMonth) || quotaMonth < 0) quotaMonth = 0;
        localStorage.setItem('tct_quotaDay', quotaDay);
        localStorage.setItem('tct_quotaMonth', quotaMonth);

        // Active Tab Logic
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;

        if (activeTab === 'split') {
            let price = parseFloat(priceInput.value);
            if (isNaN(price) || price < 0) price = 0;

            if (quotaDay > 200) quotaDay = 200;
            if (quotaMonth > 1000) quotaMonth = 1000;

            // Government pays 60%, capped at BOTH remaining daily and monthly quotas
            let govPay = price * 0.6;
            govPay = Math.min(govPay, quotaDay, quotaMonth);

            // User pays the rest
            let userPay = price - govPay;

            // Format to 2 decimal places
            const formattedUserPay = userPay.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const formattedGovPay = govPay.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            if (userPayAmount.innerText !== formattedUserPay) {
                userPayAmount.innerText = formattedUserPay;
                triggerAnimation(userPayAmount);
            }
            if (govPayAmount.innerText !== formattedGovPay) {
                govPayAmount.innerText = formattedGovPay;
                triggerAnimation(govPayAmount);
            }
        } else if (activeTab === 'fill40') {
            let govInput = parseFloat(govPriceInput.value);
            if (isNaN(govInput) || govInput < 0) govInput = 0;

            let total = govInput / 0.6;
            let userTopup = total * 0.4;

            const formatMoney = (val) => '฿' + val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            fillUserTopup.innerText = formatMoney(userTopup);
            fillTotalAmount.innerText = formatMoney(total);
            fillGovPart.innerText = formatMoney(govInput);
            fillUserPart.innerText = formatMoney(userTopup);
            fillTotalPart.innerText = formatMoney(total);
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

    // Section toggles for Split Mode
    btnConfirm.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        if (activeTab === 'split') {
            if (priceInput.value === '0' || priceInput.value === '') return;
            numpadSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            calculate();
        }
        // Fill 40% mode auto-calculates live, confirm button could just hide numpad if desired
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
            if (activeInput.value === '0') {
                activeInput.value = btn.dataset.val;
            } else {
                activeInput.value += btn.dataset.val;
            }
            if (document.querySelector('.tab-btn.active').dataset.tab === 'fill40') {
                calculate();
            }
        });
    });

    btnClear.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        activeInput.value = '0';
        if (document.querySelector('.tab-btn.active').dataset.tab === 'fill40') {
            calculate();
        }
    });

    btnDel.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        activeInput.value = activeInput.value.slice(0, -1);
        if (activeInput.value === '') {
            activeInput.value = '0';
        }
        if (document.querySelector('.tab-btn.active').dataset.tab === 'fill40') {
            calculate();
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
});
