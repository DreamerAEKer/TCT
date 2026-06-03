document.addEventListener('DOMContentLoaded', () => {
    // Prevent iOS Safari bounce/active delay
    document.body.addEventListener('touchstart', function() {}, {passive: true});

    // Elements - Global
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const timeAlert = document.getElementById('time-alert');
    
    // Modals
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const settingQuotaDay = document.getElementById('setting-quota-day');
    const settingQuotaMonth = document.getElementById('setting-quota-month');

    const historyBtn = document.getElementById('history-btn');
    const closeHistoryBtn = document.getElementById('close-history');
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // TAB 1: Calculate
    const calcPrice = document.getElementById('calc-price');
    const calcUserPay = document.getElementById('calc-user-pay');
    const calcGovPay = document.getElementById('calc-gov-pay');
    const calcNumpad = document.getElementById('calc-numpad');
    const calcResults = document.getElementById('calc-results');
    const calcActions = document.getElementById('calc-actions');
    const btnCalcConfirm = document.getElementById('btn-calc-confirm');
    const btnCalcEdit = document.getElementById('btn-calc-edit');
    const btnCalcDone = document.getElementById('btn-calc-done');
    const numBtns = document.querySelectorAll('.num-btn[data-val]');
    const btnClear = document.querySelector('.clear-btn');
    const btnDel = document.querySelector('.del-btn');

    // TAB 2: Top-up
    const topupPrice = document.getElementById('topup-price');
    const topupQuota = document.getElementById('topup-quota');
    const topupAmount = document.getElementById('topup-amount');

    // TAB 3: Split
    const splitTotalPrice = document.getElementById('split-total-price');
    const splitCountEl = document.getElementById('split-count');
    const btnRemovePerson = document.getElementById('btn-remove-person');
    const btnAddPerson = document.getElementById('btn-add-person');
    const btnSplitEqual = document.getElementById('btn-split-equal');
    const btnSplitCustom = document.getElementById('btn-split-custom');
    const splitPersonsList = document.getElementById('split-persons-list');
    const splitSumEntered = document.getElementById('split-sum-entered');
    const splitErrorMsg = document.getElementById('split-error-msg');

    // State Variables
    let globalQuotaDay = 200;
    let globalQuotaMonth = 1000;
    let historyData = [];
    
    // Split State
    let splitCount = 2;
    let isSplitEqual = true;
    let splitPersons = [];

    // Initialize State from LocalStorage
    function initState() {
        // Fix for "0 baht" bug - fallback to defaults if 0 or invalid
        let qd = parseFloat(localStorage.getItem('tct_quotaDay'));
        if (isNaN(qd) || qd <= 0) qd = 200;
        globalQuotaDay = qd;

        let qm = parseFloat(localStorage.getItem('tct_quotaMonth'));
        if (isNaN(qm) || qm <= 0) qm = 1000;
        globalQuotaMonth = qm;

        historyData = JSON.parse(localStorage.getItem('tct_history')) || [];
        
        settingQuotaDay.value = globalQuotaDay;
        settingQuotaMonth.value = globalQuotaMonth;
        topupQuota.value = globalQuotaDay; // default Top-up quota to daily quota
    }

    function checkTimeRestriction() {
        const h = new Date().getHours();
        if (h < 6 || h >= 23) {
            timeAlert.classList.remove('hidden');
        } else {
            timeAlert.classList.add('hidden');
        }
    }

    function triggerPulse(element) {
        element.classList.remove('animate-pulse');
        void element.offsetWidth; // Reflow
        element.classList.add('animate-pulse');
    }

    function formatMoney(amount) {
        return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ========== Core Calculate Logic (60/40) ==========
    function calculate6040(price, quotaD, quotaM) {
        if (isNaN(price) || price <= 0) return { gov: 0, user: 0 };
        let gov = price * 0.6;
        gov = Math.min(gov, quotaD, quotaM);
        let user = price - gov;
        return { gov, user };
    }

    // ========== TAB SWITCHING ==========
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // ========== TAB 1: Normal Calculate ==========
    numBtns.forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (calcPrice.value === '0') calcPrice.value = btn.dataset.val;
            else calcPrice.value += btn.dataset.val;
        });
    });

    btnClear.addEventListener('pointerdown', (e) => { e.preventDefault(); calcPrice.value = '0'; });
    btnDel.addEventListener('pointerdown', (e) => { 
        e.preventDefault(); 
        calcPrice.value = calcPrice.value.slice(0, -1) || '0'; 
    });

    btnCalcConfirm.addEventListener('click', () => {
        let p = parseFloat(calcPrice.value);
        if (isNaN(p) || p <= 0) return;
        
        checkTimeRestriction();
        let res = calculate6040(p, globalQuotaDay, globalQuotaMonth);
        
        calcUserPay.innerText = formatMoney(res.user);
        calcGovPay.innerText = formatMoney(res.gov);
        
        calcNumpad.classList.add('hidden');
        calcResults.classList.remove('hidden');
        calcActions.classList.remove('hidden');
        
        triggerPulse(calcUserPay);
        triggerPulse(calcGovPay);
    });

    btnCalcEdit.addEventListener('click', () => {
        calcResults.classList.add('hidden');
        calcActions.classList.add('hidden');
        calcNumpad.classList.remove('hidden');
    });

    btnCalcDone.addEventListener('click', () => {
        let p = parseFloat(calcPrice.value);
        let res = calculate6040(p, globalQuotaDay, globalQuotaMonth);
        historyData.unshift({
            time: new Date().toLocaleString('th-TH'),
            type: 'คำนวณปกติ',
            price: p, gov: res.gov, user: res.user
        });
        localStorage.setItem('tct_history', JSON.stringify(historyData));
        
        calcPrice.value = '0';
        calcResults.classList.add('hidden');
        calcActions.classList.add('hidden');
        calcNumpad.classList.remove('hidden');
    });

    // ========== TAB 2: Top-up ==========
    function calcTopup() {
        let p = parseFloat(topupPrice.value) || 0;
        let q = parseFloat(topupQuota.value) || 0;
        
        if (p <= 0) {
            topupAmount.innerText = "0.00";
            return;
        }

        // We assume Top-up quota applies as the limiting factor (ignoring month quota if they just check day)
        // Gov pays 60%, capped at Q
        let gov = Math.min(p * 0.6, q);
        let user = p - gov;
        
        topupAmount.innerText = formatMoney(user);
    }

    topupPrice.addEventListener('input', calcTopup);
    topupQuota.addEventListener('input', calcTopup);

    // ========== TAB 3: Split Bill ==========
    function initSplitPersons() {
        splitPersons = [];
        for(let i=0; i<splitCount; i++) {
            splitPersons.push({
                id: i,
                price: 0,
                customQuota: globalQuotaDay, // default to global daily quota
                useCustomQuota: false
            });
        }
        renderSplitPersons();
    }

    function renderSplitPersons() {
        splitCountEl.innerText = splitCount;
        splitPersonsList.innerHTML = '';

        splitPersons.forEach((person, index) => {
            const div = document.createElement('div');
            div.className = 'person-item';
            div.innerHTML = `
                <div class="person-header">
                    <div class="person-name">คนที่ ${index + 1}</div>
                    <input type="number" class="person-price-input" 
                        data-index="${index}" 
                        value="${person.price ? person.price.toFixed(2) : ''}" 
                        placeholder="0"
                        ${isSplitEqual ? 'disabled' : ''}>
                </div>
                
                <div class="person-quota-input-wrapper ${person.useCustomQuota ? '' : 'hidden'}">
                    สิทธิรายวัน: <input type="number" class="person-custom-quota" data-index="${index}" value="${person.customQuota}">
                </div>
                <button class="person-quota-toggle" data-index="${index}">
                    ${person.useCustomQuota ? 'ใช้สิทธิค่าเริ่มต้น' : 'ระบุสิทธิคงเหลือแยก'}
                </button>

                <div class="person-results mt-2">
                    <div class="text-blue">
                        <span class="text-xs">เป๋าตัง</span>
                        <span class="res-user">0.00 ฿</span>
                    </div>
                    <div class="text-green" style="text-align: right;">
                        <span class="text-xs">รัฐช่วย</span>
                        <span class="res-gov">0.00 ฿</span>
                    </div>
                </div>
            `;
            splitPersonsList.appendChild(div);
        });

        // Attach events to new inputs
        document.querySelectorAll('.person-price-input').forEach(inp => {
            inp.addEventListener('input', (e) => {
                let idx = e.target.dataset.index;
                splitPersons[idx].price = parseFloat(e.target.value) || 0;
                updateSplitCalculations(); 
            });
        });

        document.querySelectorAll('.person-quota-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                let idx = e.target.dataset.index;
                splitPersons[idx].useCustomQuota = !splitPersons[idx].useCustomQuota;
                renderSplitPersons(); 
            });
        });

        document.querySelectorAll('.person-custom-quota').forEach(inp => {
            inp.addEventListener('input', (e) => {
                let idx = e.target.dataset.index;
                splitPersons[idx].customQuota = parseFloat(e.target.value) || 0;
                updateSplitCalculations();
            });
        });

        updateSplitCalculations();
    }

    function updateSplitCalculations() {
        let totalInputPrice = parseFloat(splitTotalPrice.value) || 0;
        let perPersonPrice = isSplitEqual ? (totalInputPrice / splitCount) : 0;
        let sumEntered = 0;

        const items = document.querySelectorAll('.person-item');

        splitPersons.forEach((person, index) => {
            if (isSplitEqual) {
                person.price = perPersonPrice;
                let inp = items[index].querySelector('.person-price-input');
                if (inp) inp.value = (person.price > 0 ? person.price.toFixed(2) : '');
            }
            sumEntered += (parseFloat(person.price) || 0);

            // Calculate for this person
            let activeQuota = person.useCustomQuota ? person.customQuota : globalQuotaDay;
            let res = calculate6040(person.price, activeQuota, globalQuotaMonth);

            // Update DOM text directly
            items[index].querySelector('.res-user').innerText = formatMoney(res.user) + ' ฿';
            items[index].querySelector('.res-gov').innerText = formatMoney(res.gov) + ' ฿';
        });

        // Update Summary
        if (isSplitEqual) {
            splitSumEntered.innerText = formatMoney(totalInputPrice) + ' ฿';
            splitErrorMsg.classList.add('hidden');
        } else {
            splitSumEntered.innerText = formatMoney(sumEntered) + ' ฿';
            if (Math.abs(totalInputPrice - sumEntered) > 0.02 && totalInputPrice > 0) {
                splitErrorMsg.classList.remove('hidden');
            } else {
                splitErrorMsg.classList.add('hidden');
            }
        }
    }

    splitTotalPrice.addEventListener('input', updateSplitCalculations);

    btnAddPerson.addEventListener('click', () => {
        if (splitCount < 10) {
            splitCount++;
            splitPersons.push({ id: splitCount, price: 0, customQuota: globalQuotaDay, useCustomQuota: false });
            renderSplitPersons();
        }
    });

    btnRemovePerson.addEventListener('click', () => {
        if (splitCount > 1) {
            splitCount--;
            splitPersons.pop();
            renderSplitPersons();
        }
    });

    btnSplitEqual.addEventListener('click', () => {
        isSplitEqual = true;
        btnSplitEqual.classList.add('active');
        btnSplitCustom.classList.remove('active');
        renderSplitPersons();
    });

    btnSplitCustom.addEventListener('click', () => {
        isSplitEqual = false;
        btnSplitCustom.classList.add('active');
        btnSplitEqual.classList.remove('active');
        renderSplitPersons();
    });

    // ========== Modals Logic ==========
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    
    btnSaveSettings.addEventListener('click', () => {
        let qd = parseFloat(settingQuotaDay.value);
        let qm = parseFloat(settingQuotaMonth.value);
        
        if (!isNaN(qd) && qd > 0) globalQuotaDay = qd;
        if (!isNaN(qm) && qm > 0) globalQuotaMonth = qm;

        localStorage.setItem('tct_quotaDay', globalQuotaDay);
        localStorage.setItem('tct_quotaMonth', globalQuotaMonth);
        
        // Update top-up quota if tab is active
        topupQuota.value = globalQuotaDay;
        calcTopup();
        
        // Re-render split if needed
        renderSplitPersons();
        
        settingsModal.classList.add('hidden');
    });

    historyBtn.addEventListener('click', () => {
        historyList.innerHTML = '';
        if (historyData.length === 0) {
            historyList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 2rem;">ไม่มีประวัติการใช้งาน</p>';
        } else {
            historyData.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div class="time">${item.time} - ${item.type}</div>
                    <div style="display:flex; justify-content:space-between; margin-top:0.5rem;">
                        <span class="text-bold">สินค้า: ${item.price} ฿</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:0.25rem;">
                        <span class="text-blue text-xs">เป๋าตัง: ${item.user} ฿</span>
                        <span class="text-green text-xs">รัฐ: ${item.gov} ฿</span>
                    </div>
                `;
                historyList.appendChild(div);
            });
        }
        historyModal.classList.remove('hidden');
    });

    closeHistoryBtn.addEventListener('click', () => historyModal.classList.add('hidden'));

    clearHistoryBtn.addEventListener('click', () => {
        if(confirm('ต้องการล้างประวัติทั้งหมดใช่หรือไม่?')) {
            historyData = [];
            localStorage.setItem('tct_history', JSON.stringify(historyData));
            historyBtn.click(); // re-render
        }
    });

    // Run Initialization
    initState();
    checkTimeRestriction();
    initSplitPersons();
});
