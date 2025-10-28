 // Clase principal para la gestión de finanzas
class FinanceManager {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.savingsGoals = JSON.parse(localStorage.getItem('savingsGoals')) || [];
        this.chart = null;
        this.initializeApp();
    }

    // Inicializar la aplicación
    initializeApp() {
        this.bindEvents();
        this.updateDisplay();
        this.createExpenseChart();
        this.renderSavingsGoals(); // Renderizar ahorros al inicio
    }

    // Vincular eventos del DOM
    bindEvents() {
        const form = document.getElementById('transactionFormElement');
        const goalForm = document.getElementById('goalFormElement');
        const filterGroup = document.getElementById('filterGroup');
        const clearAllBtn = document.getElementById('clearAll');
        const addIncomeBtn = document.getElementById('addIncomeBtn');
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        const addSavingBtn = document.getElementById('addSavingBtn');
        const closeFormBtn = document.getElementById('closeFormBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        
        // Eventos de ahorros
        const addGoalBtn = document.getElementById('addGoalBtn');
        const closeGoalFormBtn = document.getElementById('closeGoalFormBtn');
        const cancelGoalBtn = document.getElementById('cancelGoalBtn');

        // Eventos del formulario de transacciones
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Eventos del formulario de metas
        goalForm.addEventListener('submit', (e) => this.handleGoalFormSubmit(e));
        
        // Eventos de filtros
        filterGroup.addEventListener('change', (e) => this.filterTransactions(e.target.value));
        clearAllBtn.addEventListener('click', () => this.clearAllTransactions());
        
        // Eventos de botones principales
        addIncomeBtn.addEventListener('click', () => this.showForm('income'));
        addExpenseBtn.addEventListener('click', () => this.showForm('expense'));
        addSavingBtn.addEventListener('click', () => this.showGoalForm());
        
        // Eventos para cerrar formularios
        closeFormBtn.addEventListener('click', () => this.hideForm());
        cancelBtn.addEventListener('click', () => this.hideForm());
        addGoalBtn.addEventListener('click', () => this.showGoalForm());
        closeGoalFormBtn.addEventListener('click', () => this.hideGoalForm());
        cancelGoalBtn.addEventListener('click', () => this.hideGoalForm());
        
        // Cerrar modales con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const transactionForm = document.getElementById('transactionForm');
                const goalFormElement = document.getElementById('goalForm');
                
                if (transactionForm.style.display === 'block') {
                    this.hideForm();
                }
                if (goalFormElement.style.display === 'block') {
                    this.hideGoalForm();
                }
            }
        });
    }

    // Mostrar formulario
    showForm(type) {
        const form = document.getElementById('transactionForm');
        const formTitle = document.getElementById('formTitle');
        const transactionType = document.getElementById('transactionType');
        const submitBtn = document.getElementById('submitBtn');
        
        // Configurar tipo de transacción
        transactionType.value = type;
        
        // Actualizar título y botón
        if (type === 'income') {
            formTitle.textContent = '💰 Nuevo Ingreso';
            submitBtn.textContent = 'Añadir Ingreso';
            submitBtn.style.background = 'linear-gradient(45deg, #22c55e, #16a34a)';
        } else {
            formTitle.textContent = '💸 Nuevo Gasto';
            submitBtn.textContent = 'Añadir Gasto';
            submitBtn.style.background = 'linear-gradient(45deg, #ef4444, #dc2626)';
        }
        
        // Configurar categorías según el tipo
        this.setupCategories(type);
        
        // Mostrar formulario modal
        form.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Agregar event listener para cerrar al hacer clic fuera
        setTimeout(() => {
            form.addEventListener('click', (e) => {
                if (e.target === form) {
                    this.hideForm();
                }
            });
        }, 100);
    }

    // Ocultar formulario
    hideForm() {
        const form = document.getElementById('transactionForm');
        const formElement = document.getElementById('transactionFormElement');
        
        form.style.display = 'none';
        formElement.reset();
        document.body.classList.remove('modal-open');
    }

    // Configurar categorías según el tipo
    setupCategories(type) {
        const categorySelect = document.getElementById('category');
        
        // Limpiar opciones actuales
        categorySelect.innerHTML = '';
        
        if (type === 'income') {
            categorySelect.innerHTML = `
                <option value="salary">💼 Nómina</option>
                <option value="freelance">💻 Freelance</option>
                <option value="investment">📈 Inversiones</option>
                <option value="haircut-income">✂️ Corte de pelo</option>
                <option value="other-income">💡 Otros ingresos</option>
            `;
        } else {
            categorySelect.innerHTML = `
                <option value="fuel">⛽ Gasolina</option>
                <option value="transport">🚌 Transporte</option>
                <option value="food">🍕 Comida</option>
                <option value="shopping">🛒 Compras</option>
                <option value="entertainment">🎬 Ocio</option>
                <option value="bills">💡 Facturas</option>
                <option value="rent">🏠 Alquiler</option>
                <option value="health">⚕️ Salud</option>
                <option value="hairdresser">💇 Peluquero</option>
                <option value="mechanic">🔧 Mecánico</option>
                <option value="insurance">🛡️ Seguros</option>
                <option value="education">📚 Educación</option>
                <option value="gym">💪 Gimnasio</option>
                <option value="subscriptions">📺 Suscripciones</option>
                <option value="clothing">👕 Ropa</option>
                <option value="gifts">🎁 Regalos</option>
                <option value="pets">🐕 Mascotas</option>
                <option value="home-maintenance">🏡 Mantenimiento Casa</option>
                <option value="fines">🚨 Multas</option>
                <option value="savings">💰 Ahorros</option>
                <option value="other-expense">💸 Otros gastos</option>
            `;
        }
    }

    // Manejar envío del formulario
    handleFormSubmit(e) {
        e.preventDefault();
        
        const transaction = {
            id: Date.now(),
            type: document.getElementById('transactionType').value,
            amount: parseFloat(document.getElementById('amount').value),
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            group: document.getElementById('group').value,
            date: new Date().toISOString()
        };

        this.addTransaction(transaction);

        // Si es un gasto de ahorros, preguntar si quiere añadirlo a alguna meta
        if (transaction.type === 'expense' && transaction.category === 'savings') {
            this.handleSavingsExpense(transaction.amount);
        }

        this.hideForm();
    }

    // Manejar gasto de ahorros
    handleSavingsExpense(amount) {
        if (this.savingsGoals.length === 0) {
            const createGoal = confirm(`Has registrado €${amount} como ahorro. ¿Quieres crear una nueva meta de ahorro para organizar tus ahorros?`);
            if (createGoal) {
                this.showGoalForm();
            }
            return;
        }

        const activeGoals = this.savingsGoals.filter(goal => !goal.completed);
        if (activeGoals.length === 0) {
            const createGoal = confirm(`Has registrado €${amount} como ahorro. No tienes metas activas. ¿Quieres crear una nueva meta?`);
            if (createGoal) {
                this.showGoalForm();
            }
            return;
        }

        // Crear lista de metas activas para seleccionar
        let goalOptions = activeGoals.map((goal, index) => 
            `${index + 1}. ${goal.name} (${this.formatCurrency(goal.saved)}/${this.formatCurrency(goal.amount)})`
        ).join('\n');

        const response = prompt(`Has registrado €${amount} como ahorro. ¿A qué meta quieres añadirlo?\n\n${goalOptions}\n\nEscribe el número de la meta (o 0 para no añadir a ninguna):`);
        
        if (response && !isNaN(response)) {
            const goalIndex = parseInt(response) - 1;
            if (goalIndex >= 0 && goalIndex < activeGoals.length) {
                const selectedGoal = activeGoals[goalIndex];
                selectedGoal.saved += amount;
                
                if (selectedGoal.saved >= selectedGoal.amount) {
                    selectedGoal.completed = true;
                    this.showNotification(`¡Felicidades! Has completado la meta "${selectedGoal.name}"`);
                } else {
                    this.showNotification(`€${amount} añadido a "${selectedGoal.name}"`);
                }
                
                this.saveSavingsToLocalStorage();
                this.renderSavingsGoals();
                this.updateSavingsDisplay();
            }
        }
    }



    // Añadir nueva transacción
    addTransaction(transaction) {
        this.transactions.push(transaction);
        this.saveToLocalStorage();
        this.updateDisplay();
        this.updateChart();
        this.showNotification(`${transaction.type === 'income' ? 'Ingreso' : 'Gasto'} añadido correctamente`);
    }

    // Eliminar transacción
    deleteTransaction(id) {
        this.transactions = this.transactions.filter(transaction => transaction.id !== id);
        this.saveToLocalStorage();
        this.updateDisplay();
        this.updateChart();
        this.showNotification('Transacción eliminada');
    }

    // Guardar en localStorage
    saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    // Actualizar toda la pantalla
    updateDisplay() {
        this.updateBalance();
        this.updateSummaryCards();
        this.renderTransactionsList();
        this.updateSavingsDisplay();
    }

    // Actualizar balance
    updateBalance() {
        const balance = this.calculateBalance();
        const balanceElement = document.getElementById('balance');
        balanceElement.textContent = this.formatCurrency(balance);
        balanceElement.style.color = balance >= 0 ? '#22c55e' : '#ef4444';
    }

    // Actualizar tarjetas de resumen
    updateSummaryCards() {
        const totalIncome = this.calculateTotalByType('income');
        const totalExpenses = this.calculateTotalByType('expense');

        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(totalExpenses);
    }

    // Calcular balance total
    calculateBalance() {
        return this.transactions.reduce((balance, transaction) => {
            return transaction.type === 'income' 
                ? balance + transaction.amount 
                : balance - transaction.amount;
        }, 0);
    }

    // Calcular total por tipo
    calculateTotalByType(type) {
        return this.transactions
            .filter(transaction => transaction.type === type)
            .reduce((total, transaction) => total + transaction.amount, 0);
    }

    // Renderizar lista de transacciones
    renderTransactionsList(filterGroup = 'all') {
        const list = document.getElementById('transactionsList');
        let filteredTransactions = this.transactions;

        if (filterGroup !== 'all') {
            filteredTransactions = this.transactions.filter(t => t.group === filterGroup);
        }

        // Ordenar por fecha (más reciente primero)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredTransactions.length === 0) {
            list.innerHTML = '<div class="no-transactions">No hay transacciones para mostrar</div>';
            return;
        }

        list.innerHTML = filteredTransactions.map(transaction => {
            const categoryInfo = this.getCategoryInfo(transaction.category);
            const groupInfo = this.getGroupInfo(transaction.group);
            const date = new Date(transaction.date).toLocaleDateString('es-ES');

            return `
                <li class="transaction-item ${transaction.type}">
                    <div class="transaction-details">
                        <h4>${categoryInfo} ${transaction.description}</h4>
                        <p>${groupInfo} • ${date}</p>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                    </div>
                    <button class="delete-btn" onclick="financeManager.deleteTransaction(${transaction.id})">
                        🗑️
                    </button>
                </li>
            `;
        }).join('');
    }

    // Filtrar transacciones por grupo
    filterTransactions(group) {
        this.renderTransactionsList(group);
    }

    // Limpiar todas las transacciones
    clearAllTransactions() {
        if (confirm('¿Estás seguro de que quieres eliminar todas las transacciones?')) {
            this.transactions = [];
            this.saveToLocalStorage();
            this.updateDisplay();
            this.updateChart();
            this.showNotification('Todas las transacciones han sido eliminadas');
        }
    }

    // Crear gráfica de gastos
    createExpenseChart() {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#9333ea', // Morado
                        '#ef4444', // Rojo
                        '#f59e0b', // Amarillo/Naranja
                        '#10b981', // Verde
                        '#3b82f6', // Azul
                        '#8b5cf6', // Violeta
                        '#ec4899', // Rosa
                        '#f97316', // Naranja
                        '#06b6d4', // Cyan
                        '#84cc16', // Lima
                        '#6366f1', // Índigo
                        '#d946ef', // Fucsia
                        '#14b8a6', // Teal
                        '#f43f5e', // Rosa rojo
                        '#a855f7', // Morado claro
                        '#22c55e', // Verde claro
                        '#0ea5e9', // Azul cielo
                        '#eab308', // Amarillo
                        '#dc2626', // Rojo oscuro
                        '#7c3aed', // Violeta oscuro
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#ffffff',
                            padding: 10,
                            font: {
                                size: 11
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#9333ea',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = this.formatCurrency(context.raw);
                                const percentage = ((context.raw / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });

        this.updateChart();
    }

    // Actualizar gráfica
    updateChart() {
        if (!this.chart) return;

        const expenses = this.transactions.filter(t => t.type === 'expense');
        const categoryTotals = {};

        expenses.forEach(expense => {
            const categoryName = this.getCategoryInfo(expense.category);
            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + expense.amount;
        });

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    // Obtener información de categoría
    getCategoryInfo(category) {
        const categories = {
            'salary': '💼 Nómina',
            'freelance': '💻 Freelance',
            'investment': '📈 Inversiones',
            'haircut-income': '✂️ Corte de pelo',
            'other-income': '💡 Otros ingresos',
            'fuel': '⛽ Gasolina',
            'transport': '🚌 Transporte',
            'food': '🍕 Comida',
            'shopping': '🛒 Compras',
            'entertainment': '🎬 Ocio',
            'bills': '💡 Facturas',
            'rent': '🏠 Alquiler',
            'health': '⚕️ Salud',
            'hairdresser': '💇 Peluquero',
            'mechanic': '🔧 Mecánico',
            'insurance': '🛡️ Seguros',
            'education': '📚 Educación',
            'gym': '💪 Gimnasio',
            'subscriptions': '📺 Suscripciones',
            'clothing': '👕 Ropa',
            'gifts': '🎁 Regalos',
            'pets': '🐕 Mascotas',
            'home-maintenance': '🏡 Mantenimiento Casa',
            'fines': '🚨 Multas',
            'savings': '💰 Ahorros',
            'other-expense': '💸 Otros gastos'
        };
        return categories[category] || category;
    }

    // Obtener información de grupo
    getGroupInfo(group) {
        const groups = {
            'fixed': '📋 Gastos Fijos',
            'variable': '📊 Gastos Variables',
            'entertainment': '🎉 Ocio',
            'essential': '🏠 Esenciales',
            'investment': '💎 Inversiones'
        };
        return groups[group] || group;
    }

    // === MÉTODOS DE AHORROS ===



    // Mostrar formulario de nueva meta
    showGoalForm() {
        const goalForm = document.getElementById('goalForm');
        goalForm.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Agregar event listener para cerrar al hacer clic fuera
        setTimeout(() => {
            goalForm.addEventListener('click', (e) => {
                if (e.target === goalForm) {
                    this.hideGoalForm();
                }
            });
        }, 100);
    }

    // Ocultar formulario de nueva meta
    hideGoalForm() {
        document.getElementById('goalForm').style.display = 'none';
        document.getElementById('goalFormElement').reset();
        document.body.classList.remove('modal-open');
    }

    // Manejar envío del formulario de metas
    handleGoalFormSubmit(e) {
        e.preventDefault();
        
        const goal = {
            id: Date.now(),
            name: document.getElementById('goalName').value,
            amount: parseFloat(document.getElementById('goalAmount').value),
            saved: 0,
            deadline: document.getElementById('goalDeadline').value,
            description: document.getElementById('goalDescription').value,
            createdAt: new Date().toISOString(),
            completed: false
        };

        this.addSavingGoal(goal);
        this.hideGoalForm();
    }

    // Añadir nueva meta de ahorro
    addSavingGoal(goal) {
        this.savingsGoals.push(goal);
        this.saveSavingsToLocalStorage();
        this.renderSavingsGoals();
        this.updateSavingsDisplay();
        this.showNotification(`Meta "${goal.name}" creada correctamente`);
    }

    // Añadir dinero a una meta
    addMoneyToGoal(goalId) {
        const amount = prompt('¿Cuánto dinero quieres añadir a esta meta?');
        if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
            const goal = this.savingsGoals.find(g => g.id === goalId);
            if (goal) {
                goal.saved += parseFloat(amount);
                if (goal.saved >= goal.amount) {
                    goal.completed = true;
                    this.showNotification(`¡Felicidades! Has completado la meta "${goal.name}"`);
                }
                this.saveSavingsToLocalStorage();
                this.renderSavingsGoals();
                this.updateSavingsDisplay();
                this.showNotification(`€${amount} añadido a "${goal.name}"`);
            }
        }
    }

    // Eliminar meta de ahorro
    deleteSavingGoal(goalId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta meta?')) {
            this.savingsGoals = this.savingsGoals.filter(goal => goal.id !== goalId);
            this.saveSavingsToLocalStorage();
            this.renderSavingsGoals();
            this.updateSavingsDisplay();
            this.showNotification('Meta eliminada');
        }
    }

    // Calcular total de ahorros
    calculateTotalSavings() {
        return this.savingsGoals.reduce((total, goal) => total + goal.saved, 0);
    }

    // Renderizar lista de metas de ahorro
    renderSavingsGoals() {
        const goalsList = document.getElementById('goalsList');
        
        if (this.savingsGoals.length === 0) {
            goalsList.innerHTML = `
                <div class="no-goals">
                    <p>🎯 Sin metas de ahorro</p>
                    <p>¡Crea tu primera meta!</p>
                </div>
            `;
            return;
        }

        // Mostrar solo las primeras 3 metas más recientes para mantenerlo compacto
        const recentGoals = this.savingsGoals.slice(-3).reverse();

        goalsList.innerHTML = recentGoals.map(goal => {
            const progress = Math.min((goal.saved / goal.amount) * 100, 100);
            const isCompleted = goal.completed;

            return `
                <div class="goal-item ${isCompleted ? 'completed' : ''}">
                    <div class="goal-header">
                        <div class="goal-info">
                            <h4>${isCompleted ? '✅ ' : '🎯 '}${goal.name}</h4>
                            <p>${goal.description || 'Meta de ahorro'}</p>
                        </div>
                        <div class="goal-actions">
                            ${!isCompleted ? `<button class="btn-small btn-add-money" onclick="financeManager.addMoneyToGoal(${goal.id})">💰</button>` : ''}
                            <button class="btn-small btn-delete-goal" onclick="financeManager.deleteSavingGoal(${goal.id})">🗑️</button>
                        </div>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-info">
                            <span class="progress-amount">${this.formatCurrency(goal.saved)} / ${this.formatCurrency(goal.amount)}</span>
                            <span class="progress-percentage">${progress.toFixed(0)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${isCompleted ? 'completed' : ''}" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Si hay más de 3 metas, mostrar un indicador
        if (this.savingsGoals.length > 3) {
            goalsList.innerHTML += `
                <div style="text-align: center; padding: 10px; color: #a1a1aa; font-size: 0.8rem;">
                    Y ${this.savingsGoals.length - 3} metas más...
                </div>
            `;
        }
    }

    // Actualizar display de ahorros
    updateSavingsDisplay() {
        const totalSaved = this.calculateTotalSavings();
        const activeGoals = this.savingsGoals.filter(g => !g.completed).length;
        const completedGoals = this.savingsGoals.filter(g => g.completed).length;

        document.getElementById('totalSavedAmount').textContent = this.formatCurrency(totalSaved);
        document.getElementById('activeGoalsCount').textContent = activeGoals;
        document.getElementById('completedGoalsCount').textContent = completedGoals;
    }

    // Guardar ahorros en localStorage
    saveSavingsToLocalStorage() {
        localStorage.setItem('savingsGoals', JSON.stringify(this.savingsGoals));
    }

    // Formatear moneda
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    // Mostrar notificación
    showNotification(message) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #9333ea, #7c3aed);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);

        // Añadir estilos de animación si no existen
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Eliminar notificación después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Exportar datos a JSON
    exportData() {
        const data = {
            transactions: this.transactions,
            savingsGoals: this.savingsGoals,
            exportDate: new Date().toISOString()
        };
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `finanzas_completo_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Importar datos desde JSON
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Soporte para formato anterior (solo transacciones) y nuevo formato
                if (Array.isArray(importedData)) {
                    // Formato anterior - solo transacciones
                    this.transactions = importedData;
                } else if (importedData.transactions || importedData.savingsGoals) {
                    // Formato nuevo - objeto completo
                    if (importedData.transactions) {
                        this.transactions = importedData.transactions;
                    }
                    if (importedData.savingsGoals) {
                        this.savingsGoals = importedData.savingsGoals;
                        this.saveSavingsToLocalStorage();
                    }
                }
                
                this.saveToLocalStorage();
                this.updateDisplay();
                this.updateChart();
                this.showNotification('Datos importados correctamente');
            } catch (error) {
                this.showNotification('Error al importar los datos');
            }
        };
        reader.readAsText(file);
    }
}

// Inicializar la aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.financeManager = new FinanceManager();

    // Añadir funcionalidad de exportar/importar
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📊 Exportar';
    exportBtn.className = 'btn-filter';
    exportBtn.style.marginLeft = '10px';
    exportBtn.addEventListener('click', () => {
        financeManager.exportData();
    });

    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            financeManager.importData(e.target.files[0]);
        }
    });

    const importBtn = document.createElement('button');
    importBtn.textContent = '📁 Importar';
    importBtn.className = 'btn-filter';
    importBtn.style.marginLeft = '10px';
    importBtn.addEventListener('click', () => {
        importInput.click();
    });

    // Añadir botones a la interfaz
    const filtersDiv = document.querySelector('.filters');
    filtersDiv.appendChild(exportBtn);
    filtersDiv.appendChild(importBtn);
    document.body.appendChild(importInput);
});

// Añadir soporte para PWA (Progressive Web App)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}