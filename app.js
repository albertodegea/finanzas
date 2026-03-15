/* ===== FinControl — app.js ===== */
(() => {
    'use strict';

    // ── Storage helpers ──
    const STORAGE_KEY = 'fincontrol_data';

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch { /* ignore corrupt data */ }
        return getDefaultData();
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function getDefaultData() {
        return {
            incomes: [],
            fixedExpenses: [],
            variableExpenses: [],
            savings: [],
            debts: [],
        };
    }

    // ── State ──
    let state = loadData();
    let currentDate = new Date();
    let currentSection = 'dashboard';

    // ── Category icons/emojis ──
    const categoryEmojis = {
        salario: '💰', freelance: '💻', inversiones: '📈', regalos: '🎁', otros_income: '📥',
        vivienda: '🏠', transporte: '🚗', alimentacion: '🛒', salud: '🏥',
        entretenimiento: '🎮', educacion: '📚', suscripciones: '📱', seguros: '🛡️',
        ropa: '👕', restaurantes: '🍽️', ocio: '🎬', otros: '📦',
    };

    const categoryColors = [
        '#6c5ce7', '#00cec9', '#ff6b6b', '#feca57',
        '#54a0ff', '#a29bfe', '#fd79a8', '#8888a0',
        '#e17055', '#00b894', '#fdcb6e', '#636e72',
    ];

    // ── Utility functions ──
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function formatCurrency(n) {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
    }

    function getMonthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function getMonthLabel(date) {
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }

    function filterByMonth(items, monthKey) {
        return items.filter(i => i.date && i.date.startsWith(monthKey));
    }

    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── DOM references ──
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const sidebar = $('#sidebar');
    const hamburger = $('#hamburger');
    const overlay = $('#overlay');
    const modalOverlay = $('#modalOverlay');
    const modal = $('#modal');
    const modalTitle = $('#modalTitle');
    const modalBody = $('#modalBody');
    const modalClose = $('#modalClose');
    const toastContainer = $('#toastContainer');
    const monthLabel = $('#currentMonth');
    const monthLabel2 = $('#currentMonth2');
    const monthSelectMobile = $('#monthSelectMobile');

    // ── Month navigation ──
    function updateMonthDisplay() {
        const label = getMonthLabel(currentDate);
        monthLabel.textContent = label;
        monthLabel2.textContent = label;
        populateMobileMonthSelect();
        renderCurrentSection();
    }

    function populateMobileMonthSelect() {
        const options = [];
        for (let i = -6; i <= 6; i++) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const key = getMonthKey(d);
            const label = getMonthLabel(d);
            const selected = i === 0 ? 'selected' : '';
            options.push(`<option value="${key}" ${selected}>${label}</option>`);
        }
        monthSelectMobile.innerHTML = options.join('');
    }

    $('#prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateMonthDisplay();
    });

    $('#nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateMonthDisplay();
    });

    $('#prevMonth2').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateMonthDisplay();
    });

    $('#nextMonth2').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateMonthDisplay();
    });

    monthSelectMobile.addEventListener('change', (e) => {
        const [y, m] = e.target.value.split('-');
        currentDate = new Date(parseInt(y), parseInt(m) - 1, 1);
        updateMonthDisplay();
    });

    // ── Navigation ──
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            navigateTo(section);
        });
    });

    function navigateTo(section) {
        currentSection = section;
        $$('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = $(`.nav-link[data-section="${section}"]`);
        if (activeLink) activeLink.classList.add('active');

        $$('.section').forEach(s => s.classList.remove('active'));
        const activeSection = $(`#section-${section}`);
        if (activeSection) activeSection.classList.add('active');

        closeSidebar();
        renderCurrentSection();
    }

    // ── Mobile sidebar ──
    hamburger.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);

    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    // ── Modal ──
    function openModal(title, bodyHTML) {
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHTML;
        modalOverlay.classList.add('active');
        const firstInput = modalBody.querySelector('input, select');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeModal(); closeFab(); }
    });

    // ── Toast ──
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ── Render helpers ──
    function renderCurrentSection() {
        switch (currentSection) {
            case 'dashboard': renderDashboard(); break;
            case 'ingresos': renderIncomes(); break;
            case 'gastos-fijos': renderFixedExpenses(); break;
            case 'gastos-variables': renderVariableExpenses(); break;
            case 'ahorros': renderSavings(); break;
            case 'deudas': renderDebts(); break;
            case 'historial': renderHistory(); break;
        }
    }

    // ═══════════════════════════════════
    //  DASHBOARD
    // ═══════════════════════════════════
    function renderDashboard() {
        const mk = getMonthKey(currentDate);
        const incomes = filterByMonth(state.incomes, mk);
        const fixed = filterByMonth(state.fixedExpenses, mk);
        const variable = filterByMonth(state.variableExpenses, mk);

        const totalInc = incomes.reduce((s, i) => s + i.amount, 0);
        const totalFixed = fixed.reduce((s, i) => s + i.amount, 0);
        const totalVar = variable.reduce((s, i) => s + i.amount, 0);
        const totalExp = totalFixed + totalVar;
        const totalSav = state.savings.reduce((s, i) => s + i.current, 0);
        const balance = totalInc - totalExp;

        $('#totalIncome').textContent = formatCurrency(totalInc);
        $('#totalExpenses').textContent = formatCurrency(totalExp);
        $('#totalBalance').textContent = formatCurrency(balance);
        $('#totalBalance').style.color = balance >= 0 ? 'var(--blue)' : 'var(--red)';
        $('#totalSavings').textContent = formatCurrency(totalSav);

        renderExpenseChart(fixed, variable);
        renderTrendChart();
        renderRecentTransactions(mk);
    }

    // ── Expense Donut Chart (Canvas) ──
    function renderExpenseChart(fixed, variable) {
        const canvas = $('#expenseChart');
        const ctx = canvas.getContext('2d');
        const legend = $('#expenseChartLegend');

        // Group by category
        const categoryMap = {};
        [...fixed, ...variable].forEach(item => {
            const cat = item.category || 'otros';
            categoryMap[cat] = (categoryMap[cat] || 0) + item.amount;
        });

        const entries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        const total = entries.reduce((s, [, v]) => s + v, 0);

        // Resize canvas
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(canvas.parentElement.clientWidth - 40, 220);
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, size, size);

        if (total === 0) {
            ctx.fillStyle = '#2a2a40';
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0a0a0f';
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#5a5a70';
            ctx.font = '500 13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Sin datos', size / 2, size / 2);
            legend.innerHTML = '';
            return;
        }

        let startAngle = -Math.PI / 2;
        const cx = size / 2, cy = size / 2;
        const outerR = size / 2 - 10;
        const innerR = size / 4;

        entries.forEach(([cat, val], i) => {
            const slice = (val / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
            ctx.arc(cx, cy, innerR, startAngle + slice, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = categoryColors[i % categoryColors.length];
            ctx.fill();
            startAngle += slice;
        });

        // Center text
        ctx.fillStyle = '#0a0a0f';
        ctx.beginPath();
        ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8e8f0';
        ctx.font = '700 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatCurrency(total), cx, cy);

        // Legend
        legend.innerHTML = entries.map(([cat, val], i) =>
            `<div class="legend-item">
                <span class="legend-dot" style="background:${categoryColors[i % categoryColors.length]}"></span>
                ${sanitize(cat)} (${Math.round(val / total * 100)}%)
            </div>`
        ).join('');
    }

    // ── Trend Bar Chart (Canvas) ──
    function renderTrendChart() {
        const canvas = $('#trendChart');
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const w = canvas.parentElement.clientWidth - 40;
        const h = 220;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            months.push({ date: d, key: getMonthKey(d), label: d.toLocaleDateString('es-ES', { month: 'short' }) });
        }

        const data = months.map(m => {
            const inc = filterByMonth(state.incomes, m.key).reduce((s, i) => s + i.amount, 0);
            const exp = filterByMonth(state.fixedExpenses, m.key).reduce((s, i) => s + i.amount, 0)
                      + filterByMonth(state.variableExpenses, m.key).reduce((s, i) => s + i.amount, 0);
            return { label: m.label, income: inc, expense: exp };
        });

        const maxVal = Math.max(1, ...data.map(d => Math.max(d.income, d.expense)));
        const chartPadding = { top: 20, right: 20, bottom: 35, left: 10 };
        const chartW = w - chartPadding.left - chartPadding.right;
        const chartH = h - chartPadding.top - chartPadding.bottom;
        const barGroupWidth = chartW / data.length;
        const barWidth = barGroupWidth * 0.28;
        const gap = barGroupWidth * 0.08;

        // Grid lines
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = chartPadding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(chartPadding.left, y);
            ctx.lineTo(w - chartPadding.right, y);
            ctx.stroke();
        }

        data.forEach((d, i) => {
            const x = chartPadding.left + barGroupWidth * i + barGroupWidth / 2;
            const incH = (d.income / maxVal) * chartH;
            const expH = (d.expense / maxVal) * chartH;
            const baseY = chartPadding.top + chartH;

            // Income bar
            ctx.fillStyle = '#00cec9';
            roundRect(ctx, x - barWidth - gap / 2, baseY - incH, barWidth, incH, 4);

            // Expense bar
            ctx.fillStyle = '#ff6b6b';
            roundRect(ctx, x + gap / 2, baseY - expH, barWidth, expH, 4);

            // Label
            ctx.fillStyle = '#8888a0';
            ctx.font = '500 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x, baseY + 20);
        });

        // Mini legend
        ctx.fillStyle = '#00cec9';
        roundRect(ctx, w - 160, 5, 10, 10, 2);
        ctx.fillStyle = '#8888a0';
        ctx.font = '500 11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Ingresos', w - 145, 14);

        ctx.fillStyle = '#ff6b6b';
        roundRect(ctx, w - 80, 5, 10, 10, 2);
        ctx.fillStyle = '#8888a0';
        ctx.fillText('Gastos', w - 65, 14);
    }

    function roundRect(ctx, x, y, w, h, r) {
        if (h <= 0) return;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    // ── Recent Transactions ──
    function renderRecentTransactions(mk) {
        const container = $('#recentTransactions');
        const all = [
            ...filterByMonth(state.incomes, mk).map(i => ({ ...i, type: 'income' })),
            ...filterByMonth(state.fixedExpenses, mk).map(i => ({ ...i, type: 'fixed' })),
            ...filterByMonth(state.variableExpenses, mk).map(i => ({ ...i, type: 'variable' })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

        if (!all.length) {
            container.innerHTML = '<p class="empty-msg">No hay movimientos este mes</p>';
            return;
        }

        container.innerHTML = all.map(t => {
            const isIncome = t.type === 'income';
            const emoji = categoryEmojis[t.category] || '📦';
            const bg = isIncome ? 'var(--green-soft)' : 'var(--red-soft)';
            const color = isIncome ? 'var(--green)' : 'var(--red)';
            const sign = isIncome ? '+' : '-';
            return `<div class="transaction-item">
                <div class="transaction-icon" style="background:${bg}">${emoji}</div>
                <div class="transaction-info">
                    <div class="transaction-name">${sanitize(t.name)}</div>
                    <div class="transaction-date">${formatDate(t.date)}</div>
                </div>
                <div class="transaction-amount" style="color:${color}">${sign}${formatCurrency(t.amount)}</div>
            </div>`;
        }).join('');
    }

    // ═══════════════════════════════════
    //  INCOMES
    // ═══════════════════════════════════
    const incomeCategories = ['salario', 'freelance', 'inversiones', 'regalos', 'otros_income'];

    function renderIncomes() {
        const mk = getMonthKey(currentDate);
        const items = filterByMonth(state.incomes, mk);
        const list = $('#incomeList');

        if (!items.length) {
            list.innerHTML = '<p class="empty-msg">No hay ingresos registrados este mes</p>';
            return;
        }

        const total = items.reduce((s, i) => s + i.amount, 0);
        list.innerHTML = items.map(i => `
            <div class="data-item">
                <div class="data-item-icon cat-${i.category || 'otros'}">${categoryEmojis[i.category] || '📥'}</div>
                <div class="data-item-info">
                    <div class="data-item-name">${sanitize(i.name)}</div>
                    <div class="data-item-detail">${sanitize(i.category || 'otros')} · ${formatDate(i.date)}</div>
                </div>
                <div class="data-item-amount income">+${formatCurrency(i.amount)}</div>
                <div class="data-item-actions">
                    <button class="btn-secondary" onclick="app.editIncome('${i.id}')">Editar</button>
                    <button class="btn-danger" onclick="app.deleteIncome('${i.id}')">Eliminar</button>
                </div>
            </div>
        `).join('') + `<div class="data-item" style="border-color:var(--green);justify-content:flex-end;gap:0.5rem">
            <span style="color:var(--text-secondary);font-size:0.85rem">Total:</span>
            <span class="data-item-amount income" style="font-size:1.15rem">+${formatCurrency(total)}</span>
        </div>`;
    }

    function showIncomeForm(item = null) {
        const isEdit = !!item;
        const today = new Date().toISOString().split('T')[0];
        openModal(isEdit ? 'Editar Ingreso' : 'Nuevo Ingreso', `
            <form id="incomeForm">
                <div class="form-group">
                    <label>Nombre</label>
                    <input class="form-input" name="name" required placeholder="Ej: Nómina marzo" value="${isEdit ? sanitize(item.name) : ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Cantidad (€)</label>
                        <input class="form-input" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" value="${isEdit ? item.amount : ''}">
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input class="form-input" name="date" type="date" required value="${isEdit ? item.date : today}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Categoría</label>
                    <select class="form-select" name="category">
                        ${incomeCategories.map(c => `<option value="${c}" ${isEdit && item.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Notas (opcional)</label>
                    <textarea class="form-textarea" name="notes" placeholder="Añade notas...">${isEdit ? sanitize(item.notes || '') : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Añadir Ingreso'}</button>
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancelar</button>
                </div>
            </form>
        `);

        $('#incomeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = {
                id: isEdit ? item.id : generateId(),
                name: fd.get('name').trim(),
                amount: parseFloat(fd.get('amount')),
                date: fd.get('date'),
                category: fd.get('category'),
                notes: fd.get('notes').trim(),
            };
            if (isEdit) {
                const idx = state.incomes.findIndex(i => i.id === item.id);
                if (idx >= 0) state.incomes[idx] = data;
            } else {
                state.incomes.push(data);
            }
            saveData();
            closeModal();
            renderCurrentSection();
            showToast(isEdit ? 'Ingreso actualizado' : 'Ingreso añadido');
        });
    }

    $('#btnAddIncome').addEventListener('click', () => showIncomeForm());

    // ═══════════════════════════════════
    //  FIXED EXPENSES
    // ═══════════════════════════════════
    const fixedCategories = ['vivienda', 'transporte', 'seguros', 'suscripciones', 'educacion', 'salud', 'otros'];

    function renderFixedExpenses() {
        const mk = getMonthKey(currentDate);
        const items = filterByMonth(state.fixedExpenses, mk);
        const list = $('#fixedExpenseList');

        if (!items.length) {
            list.innerHTML = '<p class="empty-msg">No hay gastos fijos registrados este mes</p>';
            return;
        }

        const total = items.reduce((s, i) => s + i.amount, 0);
        list.innerHTML = items.map(i => `
            <div class="data-item">
                <div class="data-item-icon cat-${i.category || 'otros'}">${categoryEmojis[i.category] || '📦'}</div>
                <div class="data-item-info">
                    <div class="data-item-name">${sanitize(i.name)}</div>
                    <div class="data-item-detail">${sanitize(i.category || 'otros')} · ${formatDate(i.date)}</div>
                </div>
                <div class="data-item-amount expense">-${formatCurrency(i.amount)}</div>
                <div class="data-item-actions">
                    <button class="btn-secondary" onclick="app.editFixed('${i.id}')">Editar</button>
                    <button class="btn-danger" onclick="app.deleteFixed('${i.id}')">Eliminar</button>
                </div>
            </div>
        `).join('') + `<div class="data-item" style="border-color:var(--red);justify-content:flex-end;gap:0.5rem">
            <span style="color:var(--text-secondary);font-size:0.85rem">Total:</span>
            <span class="data-item-amount expense" style="font-size:1.15rem">-${formatCurrency(total)}</span>
        </div>`;
    }

    function showFixedExpenseForm(item = null) {
        const isEdit = !!item;
        const today = new Date().toISOString().split('T')[0];
        openModal(isEdit ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo', `
            <form id="fixedForm">
                <div class="form-group">
                    <label>Nombre</label>
                    <input class="form-input" name="name" required placeholder="Ej: Alquiler" value="${isEdit ? sanitize(item.name) : ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Cantidad (€)</label>
                        <input class="form-input" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" value="${isEdit ? item.amount : ''}">
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input class="form-input" name="date" type="date" required value="${isEdit ? item.date : today}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Categoría</label>
                    <select class="form-select" name="category">
                        ${fixedCategories.map(c => `<option value="${c}" ${isEdit && item.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Notas (opcional)</label>
                    <textarea class="form-textarea" name="notes" placeholder="Añade notas...">${isEdit ? sanitize(item.notes || '') : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Añadir Gasto Fijo'}</button>
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancelar</button>
                </div>
            </form>
        `);

        $('#fixedForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = {
                id: isEdit ? item.id : generateId(),
                name: fd.get('name').trim(),
                amount: parseFloat(fd.get('amount')),
                date: fd.get('date'),
                category: fd.get('category'),
                notes: fd.get('notes').trim(),
            };
            if (isEdit) {
                const idx = state.fixedExpenses.findIndex(i => i.id === item.id);
                if (idx >= 0) state.fixedExpenses[idx] = data;
            } else {
                state.fixedExpenses.push(data);
            }
            saveData();
            closeModal();
            renderCurrentSection();
            showToast(isEdit ? 'Gasto fijo actualizado' : 'Gasto fijo añadido');
        });
    }

    $('#btnAddFixedExpense').addEventListener('click', () => showFixedExpenseForm());

    // ═══════════════════════════════════
    //  VARIABLE EXPENSES
    // ═══════════════════════════════════
    const variableCategories = ['alimentacion', 'transporte', 'entretenimiento', 'restaurantes', 'ropa', 'ocio', 'salud', 'otros'];

    function renderVariableExpenses() {
        const mk = getMonthKey(currentDate);
        const items = filterByMonth(state.variableExpenses, mk);
        const list = $('#variableExpenseList');

        if (!items.length) {
            list.innerHTML = '<p class="empty-msg">No hay gastos variables registrados este mes</p>';
            return;
        }

        const total = items.reduce((s, i) => s + i.amount, 0);
        list.innerHTML = items.map(i => `
            <div class="data-item">
                <div class="data-item-icon cat-${i.category || 'otros'}">${categoryEmojis[i.category] || '📦'}</div>
                <div class="data-item-info">
                    <div class="data-item-name">${sanitize(i.name)}</div>
                    <div class="data-item-detail">${sanitize(i.category || 'otros')} · ${formatDate(i.date)}</div>
                </div>
                <div class="data-item-amount expense">-${formatCurrency(i.amount)}</div>
                <div class="data-item-actions">
                    <button class="btn-secondary" onclick="app.editVariable('${i.id}')">Editar</button>
                    <button class="btn-danger" onclick="app.deleteVariable('${i.id}')">Eliminar</button>
                </div>
            </div>
        `).join('') + `<div class="data-item" style="border-color:var(--red);justify-content:flex-end;gap:0.5rem">
            <span style="color:var(--text-secondary);font-size:0.85rem">Total:</span>
            <span class="data-item-amount expense" style="font-size:1.15rem">-${formatCurrency(total)}</span>
        </div>`;
    }

    function showVariableExpenseForm(item = null) {
        const isEdit = !!item;
        const today = new Date().toISOString().split('T')[0];
        openModal(isEdit ? 'Editar Gasto Variable' : 'Nuevo Gasto Variable', `
            <form id="variableForm">
                <div class="form-group">
                    <label>Nombre</label>
                    <input class="form-input" name="name" required placeholder="Ej: Compra supermercado" value="${isEdit ? sanitize(item.name) : ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Cantidad (€)</label>
                        <input class="form-input" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" value="${isEdit ? item.amount : ''}">
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input class="form-input" name="date" type="date" required value="${isEdit ? item.date : today}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Categoría</label>
                    <select class="form-select" name="category">
                        ${variableCategories.map(c => `<option value="${c}" ${isEdit && item.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Notas (opcional)</label>
                    <textarea class="form-textarea" name="notes" placeholder="Añade notas...">${isEdit ? sanitize(item.notes || '') : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Añadir Gasto Variable'}</button>
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancelar</button>
                </div>
            </form>
        `);

        $('#variableForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = {
                id: isEdit ? item.id : generateId(),
                name: fd.get('name').trim(),
                amount: parseFloat(fd.get('amount')),
                date: fd.get('date'),
                category: fd.get('category'),
                notes: fd.get('notes').trim(),
            };
            if (isEdit) {
                const idx = state.variableExpenses.findIndex(i => i.id === item.id);
                if (idx >= 0) state.variableExpenses[idx] = data;
            } else {
                state.variableExpenses.push(data);
            }
            saveData();
            closeModal();
            renderCurrentSection();
            showToast(isEdit ? 'Gasto variable actualizado' : 'Gasto variable añadido');
        });
    }

    $('#btnAddVariableExpense').addEventListener('click', () => showVariableExpenseForm());

    // ═══════════════════════════════════
    //  SAVINGS
    // ═══════════════════════════════════
    function renderSavings() {
        const container = $('#savingsList');
        if (!state.savings.length) {
            container.innerHTML = '<p class="empty-msg">No hay objetivos de ahorro</p>';
            return;
        }

        container.innerHTML = state.savings.map(s => {
            const pct = s.goal > 0 ? Math.min(100, (s.current / s.goal) * 100) : 0;
            return `<div class="saving-card">
                <div class="saving-card-header">
                    <div class="saving-card-title">${sanitize(s.name)}</div>
                    <div class="data-item-actions">
                        <button class="btn-secondary" onclick="app.editSaving('${s.id}')">Editar</button>
                        <button class="btn-danger" onclick="app.deleteSaving('${s.id}')">Eliminar</button>
                    </div>
                </div>
                <div class="saving-card-amounts">
                    <span class="current">${formatCurrency(s.current)}</span>
                    <span>de ${formatCurrency(s.goal)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${pct}%"></div>
                </div>
                <div class="saving-card-actions">
                    <button class="btn-success" onclick="app.addToSaving('${s.id}')">+ Aportar</button>
                    <button class="btn-secondary" onclick="app.withdrawFromSaving('${s.id}')">- Retirar</button>
                </div>
                ${s.notes ? `<div style="margin-top:0.75rem;font-size:0.78rem;color:var(--text-muted)">${sanitize(s.notes)}</div>` : ''}
            </div>`;
        }).join('');
    }

    function showSavingForm(item = null) {
        const isEdit = !!item;
        openModal(isEdit ? 'Editar Objetivo' : 'Nuevo Objetivo de Ahorro', `
            <form id="savingForm">
                <div class="form-group">
                    <label>Nombre del Objetivo</label>
                    <input class="form-input" name="name" required placeholder="Ej: Vacaciones" value="${isEdit ? sanitize(item.name) : ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Meta (€)</label>
                        <input class="form-input" name="goal" type="number" step="0.01" min="0.01" required placeholder="0.00" value="${isEdit ? item.goal : ''}">
                    </div>
                    <div class="form-group">
                        <label>Ahorro Actual (€)</label>
                        <input class="form-input" name="current" type="number" step="0.01" min="0" placeholder="0.00" value="${isEdit ? item.current : '0'}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Notas (opcional)</label>
                    <textarea class="form-textarea" name="notes" placeholder="Añade notas...">${isEdit ? sanitize(item.notes || '') : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Crear Objetivo'}</button>
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancelar</button>
                </div>
            </form>
        `);

        $('#savingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = {
                id: isEdit ? item.id : generateId(),
                name: fd.get('name').trim(),
                goal: parseFloat(fd.get('goal')),
                current: parseFloat(fd.get('current')) || 0,
                notes: fd.get('notes').trim(),
            };
            if (isEdit) {
                const idx = state.savings.findIndex(s => s.id === item.id);
                if (idx >= 0) state.savings[idx] = data;
            } else {
                state.savings.push(data);
            }
            saveData();
            closeModal();
            renderCurrentSection();
            showToast(isEdit ? 'Objetivo actualizado' : 'Objetivo creado');
        });
    }

    function addToSaving(id) {
        const saving = state.savings.find(s => s.id === id);
        if (!saving) return;
        openModal('Aportar a ' + saving.name, `
            <form id="addSavingForm">
                <div class="form-group">
                    <label>Cantidad a aportar (€)</label>
                    <input class="form-input" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Aportar</button>
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancelar</button>
                </div>
            </form>
        `);
        $('#addSavingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(new FormData(e.target).get('amount'));
            saving.current = Math.round((saving.current + amount) * 100) / 100;
            saveData();
            closeModal();
            renderCurrentSection();
            showToast(`+${formatCurrency(amount)} aportados a ${saving.name}`);
        });
    }

    function withdrawFromSaving(id) {
        const saving = state.savings.find(s => s.id === id);
        if (!saving) return;
        openModal('Retirar de ' + saving.name, `
            <form id="withdrawForm">
                <div class="form-group">
                    <label>Cantidad a retirar (€) — Disponible: ${formatCurrency(saving.current)}</label>
                    <input class="form-input" name="amount" type="number" step="0.01" min="0.01" max="${saving.current}" required placeholder="0.00">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Retirar</button>
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancelar</button>
                </div>
            </form>
        `);
        $('#withdrawForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(new FormData(e.target).get('amount'));
            saving.current = Math.max(0, Math.round((saving.current - amount) * 100) / 100);
            saveData();
            closeModal();
            renderCurrentSection();
            showToast(`-${formatCurrency(amount)} retirados de ${saving.name}`);
        });
    }

    $('#btnAddSaving').addEventListener('click', () => showSavingForm());

    // ═══════════════════════════════════
    //  DEBTS
    // ═══════════════════════════════════
    function renderDebts() {
        const container = $('#debtList');
        if (!state.debts.length) {
            container.innerHTML = '<p class="empty-msg">No hay deudas registradas</p>';
            return;
        }

        const totalPending = state.debts.filter(d => !d.paid).reduce((s, d) => s + d.amount, 0);
        container.innerHTML = state.debts.map(d => `
            <div class="data-item" style="${d.paid ? 'opacity:0.55' : ''}">
                <div class="data-item-icon" style="background:var(--blue-soft);font-size:1.3rem">👤</div>
                <div class="data-item-info">
                    <div class="data-item-name">${sanitize(d.person)} ${d.paid ? '<span class="badge badge-paid">Pagada</span>' : '<span class="badge badge-pending">Pendiente</span>'}</div>
                    <div class="data-item-detail">${sanitize(d.concept)} · ${formatDate(d.date)}</div>
                </div>
                <div class="data-item-amount debt">${formatCurrency(d.amount)}</div>
                <div class="data-item-actions">
                    ${!d.paid ? `<button class="btn-success" onclick="app.markDebtPaid('${d.id}')">Cobrada</button>` : `<button class="btn-secondary" onclick="app.markDebtUnpaid('${d.id}')">Reabrir</button>`}
                    <button class="btn-secondary" onclick="app.editDebt('${d.id}')">Editar</button>
                    <button class="btn-danger" onclick="app.deleteDebt('${d.id}')">Eliminar</button>
                </div>
            </div>
        `).join('') + `<div class="data-item" style="border-color:var(--blue);justify-content:flex-end;gap:0.5rem">
            <span style="color:var(--text-secondary);font-size:0.85rem">Pendiente total:</span>
            <span class="data-item-amount debt" style="font-size:1.15rem">${formatCurrency(totalPending)}</span>
        </div>`;
    }

    function showDebtForm(item = null) {
        const isEdit = !!item;
        const today = new Date().toISOString().split('T')[0];
        openModal(isEdit ? 'Editar Deuda' : 'Nueva Deuda', `
            <form id="debtForm">
                <div class="form-group">
                    <label>¿Quién te debe?</label>
                    <input class="form-input" name="person" required placeholder="Ej: Carlos" value="${isEdit ? sanitize(item.person) : ''}">
                </div>
                <div class="form-group">
                    <label>Concepto</label>
                    <input class="form-input" name="concept" required placeholder="Ej: Cena del viernes" value="${isEdit ? sanitize(item.concept) : ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Cantidad (€)</label>
                        <input class="form-input" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" value="${isEdit ? item.amount : ''}">
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input class="form-input" name="date" type="date" required value="${isEdit ? item.date : today}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Notas (opcional)</label>
                    <textarea class="form-textarea" name="notes" placeholder="Añade notas...">${isEdit ? sanitize(item.notes || '') : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Añadir Deuda'}</button>
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancelar</button>
                </div>
            </form>
        `);

        $('#debtForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = {
                id: isEdit ? item.id : generateId(),
                person: fd.get('person').trim(),
                concept: fd.get('concept').trim(),
                amount: parseFloat(fd.get('amount')),
                date: fd.get('date'),
                notes: fd.get('notes').trim(),
                paid: isEdit ? item.paid : false,
            };
            if (isEdit) {
                const idx = state.debts.findIndex(d => d.id === item.id);
                if (idx >= 0) state.debts[idx] = data;
            } else {
                state.debts.push(data);
            }
            saveData();
            closeModal();
            renderCurrentSection();
            showToast(isEdit ? 'Deuda actualizada' : 'Deuda añadida');
        });
    }

    $('#btnAddDebt').addEventListener('click', () => showDebtForm());

    // ═══════════════════════════════════
    //  HISTORY
    // ═══════════════════════════════════
    function renderHistory() {
        const filter = $('#historyFilter').value;
        let items = [];

        if (filter === 'all' || filter === 'income') {
            items.push(...state.incomes.map(i => ({ ...i, type: 'income', typeLabel: 'Ingreso' })));
        }
        if (filter === 'all' || filter === 'fixed') {
            items.push(...state.fixedExpenses.map(i => ({ ...i, type: 'fixed', typeLabel: 'Gasto Fijo' })));
        }
        if (filter === 'all' || filter === 'variable') {
            items.push(...state.variableExpenses.map(i => ({ ...i, type: 'variable', typeLabel: 'Gasto Variable' })));
        }
        if (filter === 'all' || filter === 'debt') {
            items.push(...state.debts.map(i => ({ ...i, name: i.person + ' — ' + i.concept, type: 'debt', typeLabel: 'Deuda' })));
        }

        items.sort((a, b) => new Date(b.date) - new Date(a.date));

        const list = $('#historyList');
        if (!items.length) {
            list.innerHTML = '<p class="empty-msg">No hay registros en el historial</p>';
            return;
        }

        list.innerHTML = items.map(i => {
            const isIncome = i.type === 'income';
            const isDebt = i.type === 'debt';
            const emoji = isDebt ? '👤' : (categoryEmojis[i.category] || '📦');
            const amountClass = isIncome ? 'income' : isDebt ? 'debt' : 'expense';
            const sign = isIncome ? '+' : isDebt ? '' : '-';
            return `<div class="data-item">
                <div class="data-item-icon cat-${i.category || 'otros'}">${emoji}</div>
                <div class="data-item-info">
                    <div class="data-item-name">${sanitize(i.name)}</div>
                    <div class="data-item-detail">${sanitize(i.typeLabel)} · ${formatDate(i.date)}</div>
                </div>
                <div class="data-item-amount ${amountClass}">${sign}${formatCurrency(i.amount)}</div>
            </div>`;
        }).join('');
    }

    $('#historyFilter').addEventListener('change', renderHistory);

    // ═══════════════════════════════════
    //  EXPORT / IMPORT
    // ═══════════════════════════════════
    $('#btnExport').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fincontrol_${getMonthKey(new Date())}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Datos exportados correctamente', 'info');
    });

    $('#btnImport').addEventListener('click', () => {
        $('#importFile').click();
    });

    $('#importFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (imported.incomes && imported.fixedExpenses && imported.variableExpenses && imported.savings && imported.debts) {
                    state = imported;
                    saveData();
                    renderCurrentSection();
                    showToast('Datos importados correctamente');
                } else {
                    showToast('Formato de archivo no válido', 'error');
                }
            } catch {
                showToast('Error al leer el archivo', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // ═══════════════════════════════════
    //  DELETE HELPERS
    // ═══════════════════════════════════
    function deleteItem(collection, id, label) {
        if (!confirm(`¿Eliminar ${label}?`)) return;
        state[collection] = state[collection].filter(i => i.id !== id);
        saveData();
        renderCurrentSection();
        showToast(`${label} eliminado`);
    }

    // ═══════════════════════════════════
    //  PUBLIC API (for inline onclick)
    // ═══════════════════════════════════
    window.app = {
        closeModal,
        // Incomes
        editIncome(id) { showIncomeForm(state.incomes.find(i => i.id === id)); },
        deleteIncome(id) { deleteItem('incomes', id, 'Ingreso'); },
        // Fixed
        editFixed(id) { showFixedExpenseForm(state.fixedExpenses.find(i => i.id === id)); },
        deleteFixed(id) { deleteItem('fixedExpenses', id, 'Gasto fijo'); },
        // Variable
        editVariable(id) { showVariableExpenseForm(state.variableExpenses.find(i => i.id === id)); },
        deleteVariable(id) { deleteItem('variableExpenses', id, 'Gasto variable'); },
        // Savings
        editSaving(id) { showSavingForm(state.savings.find(s => s.id === id)); },
        deleteSaving(id) { deleteItem('savings', id, 'Objetivo de ahorro'); },
        addToSaving(id) { addToSaving(id); },
        withdrawFromSaving(id) { withdrawFromSaving(id); },
        // Debts
        editDebt(id) { showDebtForm(state.debts.find(d => d.id === id)); },
        deleteDebt(id) { deleteItem('debts', id, 'Deuda'); },
        markDebtPaid(id) {
            const d = state.debts.find(d => d.id === id);
            if (d) { d.paid = true; saveData(); renderCurrentSection(); showToast('Deuda marcada como cobrada'); }
        },
        markDebtUnpaid(id) {
            const d = state.debts.find(d => d.id === id);
            if (d) { d.paid = false; saveData(); renderCurrentSection(); showToast('Deuda reabierta'); }
        },
    };

    // ═══════════════════════════════════
    //  FAB (Floating Action Button)
    // ═══════════════════════════════════
    const fabBtn = $('#fabBtn');
    const fabMenu = $('#fabMenu');
    const fabContainer = $('#fabContainer');
    let fabBackdrop = null;

    function createFabBackdrop() {
        if (fabBackdrop) return;
        fabBackdrop = document.createElement('div');
        fabBackdrop.className = 'fab-backdrop';
        document.body.appendChild(fabBackdrop);
        fabBackdrop.addEventListener('click', closeFab);
    }

    function toggleFab() {
        const isOpen = fabBtn.classList.contains('active');
        if (isOpen) { closeFab(); } else { openFab(); }
    }

    function openFab() {
        createFabBackdrop();
        fabBtn.classList.add('active');
        fabMenu.classList.add('active');
        fabBackdrop.classList.add('active');
    }

    function closeFab() {
        fabBtn.classList.remove('active');
        fabMenu.classList.remove('active');
        if (fabBackdrop) fabBackdrop.classList.remove('active');
    }

    fabBtn.addEventListener('click', toggleFab);

    $$('.fab-option').forEach(opt => {
        opt.addEventListener('click', () => {
            closeFab();
            switch (opt.dataset.action) {
                case 'income':   showIncomeForm(); break;
                case 'fixed':    showFixedExpenseForm(); break;
                case 'variable': showVariableExpenseForm(); break;
                case 'saving':   showSavingForm(); break;
                case 'debt':     showDebtForm(); break;
            }
        });
    });

    // ── Resize handler for charts ──
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (currentSection === 'dashboard') renderDashboard();
        }, 200);
    });

    // ── Init ──
    updateMonthDisplay();
})();
