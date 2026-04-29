// Lista de tarefas em memória
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();
    attachEventListeners();
    updateStats();
});

// Event Listeners
function attachEventListeners() {
    // Adicionar tarefa
    const addBtn = document.getElementById('addBtn');
    const taskInput = document.getElementById('taskInput');
    
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.closest('.filter-btn').classList.add('active');
            currentFilter = e.target.closest('.filter-btn').getAttribute('data-filter');
            renderTasks();
        });
    });

    // Botões de ação
    document.getElementById('clearCompletedBtn').addEventListener('click', clearCompleted);
    document.getElementById('exportBtn').addEventListener('click', exportTasks);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllTasks);

    // Modal de edição
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    document.getElementById('editForm').addEventListener('submit', saveEdit);
}

// Adicionar tarefa
function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();

    if (text === '') {
        alert('Por favor, digite uma tarefa!');
        input.focus();
        return;
    }

    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        priority: 'medium',
        createdAt: new Date().toLocaleString('pt-BR'),
        completedAt: null
    };

    tasks.push(task);
    input.value = '';
    input.focus();

    saveTasks();
    renderTasks();
    updateStats();
}

// Alternar conclusão de tarefa
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toLocaleString('pt-BR') : null;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// Abrir modal de edição
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        editingTaskId = id;
        document.getElementById('editTaskInput').value = task.text;
        document.getElementById('editPriorityInput').value = task.priority;
        document.getElementById('editModal').classList.add('active');
        document.getElementById('editTaskInput').focus();
    }
}

// Fechar modal de edição
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingTaskId = null;
}

// Salvar edição
function saveEdit(e) {
    e.preventDefault();
    
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
        task.text = document.getElementById('editTaskInput').value.trim();
        task.priority = document.getElementById('editPriorityInput').value;
        
        saveTasks();
        renderTasks();
        closeEditModal();
        updateStats();
    }
}

// Deletar tarefa
function deleteTask(id) {
    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// Limpar tarefas concluídas
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    
    if (completedCount === 0) {
        alert('Não há tarefas concluídas para limpar!');
        return;
    }

    if (confirm(`Deseja remover ${completedCount} tarefa(s) concluída(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// Limpar todas as tarefas
function clearAllTasks() {
    if (tasks.length === 0) {
        alert('Não há tarefas para limpar!');
        return;
    }

    if (confirm('Deseja remover TODAS as tarefas? Esta ação não pode ser desfeita!')) {
        tasks = [];
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// Exportar tarefas
function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tarefas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Renderizar tarefas
function renderTasks() {
    const container = document.getElementById('tasksList');
    let filteredTasks = filterTasks(tasks);

    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>${getEmptyMessage()}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="checkbox-wrapper">
                <input 
                    type="checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    onchange="toggleTask(${task.id})"
                >
            </div>
            <div class="task-text">
                <div>
                    <span class="task-priority priority-${task.priority}">
                        ${getPriorityLabel(task.priority)}
                    </span>
                    ${task.text}
                </div>
                <div style="font-size: 0.8em; color: #999; margin-top: 5px;">
                    Criada em: ${task.createdAt}
                    ${task.completedAt ? `<br>Concluída em: ${task.completedAt}` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit-btn" onclick="openEditModal(${task.id})" title="Editar">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="task-btn delete-btn" onclick="deleteTask(${task.id})" title="Deletar">
                    <i class="fas fa-trash"></i> Deletar
                </button>
            </div>
        </div>
    `).join('');
}

// Filtrar tarefas
function filterTasks(tasksToFilter) {
    switch (currentFilter) {
        case 'active':
            return tasksToFilter.filter(t => !t.completed);
        case 'completed':
            return tasksToFilter.filter(t => t.completed);
        case 'high':
            return tasksToFilter.filter(t => t.priority === 'high');
        default:
            return tasksToFilter;
    }
}

// Mensagem de lista vazia
function getEmptyMessage() {
    const messages = {
        'all': 'Nenhuma tarefa encontrada. Adicione uma para começar!',
        'active': 'Nenhuma tarefa ativa. Parabéns!',
        'completed': 'Nenhuma tarefa concluída ainda.',
        'high': 'Nenhuma tarefa com prioridade alta.'
    };
    return messages[currentFilter] || messages['all'];
}

// Label de prioridade
function getPriorityLabel(priority) {
    const labels = {
        'low': '🟢 Baixa',
        'medium': '🟡 Média',
        'high': '🔴 Alta'
    };
    return labels[priority] || 'Média';
}

// Atualizar estatísticas
function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('activeTasks').textContent = active;
    document.getElementById('completedTasks').textContent = completed;
}

// LOCAL STORAGE FUNCTIONS
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (e) {
        console.error('Erro ao salvar tarefas no localStorage:', e);
        alert('Erro ao salvar as tarefas. Seu navegador pode ter armazenamento limitado.');
    }
}

function loadTasks() {
    try {
        const stored = localStorage.getItem('tasks');
        if (stored) {
            tasks = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Erro ao carregar tarefas do localStorage:', e);
        tasks = [];
    }
}
