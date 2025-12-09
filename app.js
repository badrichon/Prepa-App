// PrepApp - Suite complète de productivité pour classes préparatoires
class PrepApp {
    constructor() {
        this.currentTab = 'matrix';
        this.tasks = [];
        this.habits = [];
        this.sessions = [];
        this.reminders = [];
        this.moodData = [];
        this.taskIdCounter = 1;
        this.habitIdCounter = 1;
        this.sessionIdCounter = 1;
        this.reminderIdCounter = 1;
        
        // Données de base
        this.subjectColors = {
            'Mathématiques': '#3498db',
            'Physique': '#e74c3c', 
            'Chimie': '#2ecc71',
            'Français': '#f39c12',
            'Anglais': '#9b59b6',
            'Allemand': '#1abc9c',
            'Philosophie': '#34495e',
            'Histoire-Géographie': '#e67e22',
            'Informatique': '#95a5a6',
            'SVT': '#27ae60'
        };
        
        this.wellnessTips = [
            "Prenez des pauses régulières toutes les 90 minutes",
            "Hydratez-vous suffisamment (1.5L d'eau/jour)",
            "Limitez la caféine après 16h pour un meilleur sommeil",
            "Faites 20 minutes d'activité physique quotidienne",
            "Préparez vos affaires la veille pour réduire le stress matinal",
            "Utilisez la technique des 2 minutes : si une tâche prend moins de 2min, faites-la immédiatement"
        ];
        
        // Timer Pomodoro
        this.timer = {
            isRunning: false,
            currentTime: 25 * 60, // 25 minutes en secondes
            totalTime: 25 * 60,
            mode: 'work', // 'work', 'shortBreak', 'longBreak'
            cycle: 1,
            sessions: 0,
            interval: null
        };
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.renderTabs();
        this.updateAllUI();
        this.showDailyTip();
        this.initCharts();
    }

    // ===== NAVIGATION ET ONGLETS =====
    
    setupEventListeners() {
        // Navigation par onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Formulaires
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('habitForm').addEventListener('submit', (e) => this.handleHabitSubmit(e));
        document.getElementById('planningForm').addEventListener('submit', (e) => this.handlePlanningSubmit(e));
        document.getElementById('reminderForm').addEventListener('submit', (e) => this.handleReminderSubmit(e));

        // Pomodoro
        document.getElementById('startTimer').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseTimer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('resetTimer').addEventListener('click', () => this.resetTimer());

        // Habitudes prédéfinies
        document.getElementById('habitPreset').addEventListener('change', (e) => {
            if (e.target.value) {
                document.getElementById('habitName').value = e.target.value;
            }
        });

        // Exercices de respiration
        document.querySelectorAll('.breathing-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.startBreathingExercise(e.target.dataset.exercise));
        });

        document.getElementById('stopBreathing')?.addEventListener('click', () => this.stopBreathingExercise());

        // Suivi d'humeur
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.recordMood(e.target.dataset.mood));
        });

        // Thème
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    switchTab(tabName) {
        // Mise à jour des boutons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Mise à jour du contenu
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        
        // Actions spécifiques par onglet
        if (tabName === 'habits') {
            this.renderHabits();
        } else if (tabName === 'planning') {
            this.renderPlanning();
        } else if (tabName === 'analytics') {
            this.updateAnalytics();
        } else if (tabName === 'reminders') {
            this.renderReminders();
        }
    }

    renderTabs() {
        this.switchTab(this.currentTab);
    }

    // ===== MATRICE D'EISENHOWER =====
    
    setupDragAndDrop() {
        const quadrants = ['urgent-important', 'important-not-urgent', 'urgent-not-important', 'not-urgent-not-important'];
        
        quadrants.forEach(quadrantId => {
            const element = document.getElementById(quadrantId);
            if (element) {
                new Sortable(element, {
                    group: 'tasks',
                    animation: 150,
                    ghostClass: 'dragging',
                    onEnd: (evt) => this.handleTaskMove(evt)
                });
            }
        });
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        
        const taskData = {
            id: this.taskIdCounter++,
            title: document.getElementById('taskTitle').value,
            category: document.getElementById('taskCategory').value,
            quadrant: document.getElementById('taskQuadrant').value,
            dueDate: document.getElementById('taskDueDate').value,
            duration: document.getElementById('taskDuration').value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (!taskData.title || !taskData.quadrant) {
            alert('Veuillez remplir au minimum le titre et le quadrant de la tâche.');
            return;
        }

        this.addTask(taskData);
        e.target.reset();
    }

    addTask(taskData) {
        this.tasks.push(taskData);
        this.saveData();
        this.renderTask(taskData);
        this.updateTaskUI();
    }

    renderTask(task) {
        const taskElement = this.createTaskElement(task);
        const quadrantElement = document.getElementById(task.quadrant);
        
        if (quadrantElement) {
            const examples = quadrantElement.querySelector('.quadrant-examples');
            if (examples) {
                examples.insertAdjacentElement('afterend', taskElement);
            } else {
                quadrantElement.appendChild(taskElement);
            }
            this.updateQuadrantState(task.quadrant);
        }
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskDiv.dataset.taskId = task.id;
        
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const today = new Date();
        
        let dueDateClass = '';
        let dueDateText = '';
        
        if (dueDate) {
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff < 0) {
                dueDateClass = 'overdue';
                dueDateText = '🔴 En retard';
            } else if (daysDiff === 0) {
                dueDateClass = 'due-soon';
                dueDateText = '🟡 Aujourd\'hui';
            } else if (daysDiff === 1) {
                dueDateClass = 'due-soon';
                dueDateText = '🟠 Demain';
            } else {
                dueDateText = dueDate.toLocaleDateString('fr-FR');
            }
        }

        const categoryColor = this.subjectColors[task.category] || '#666';
        const categoryHtml = task.category ? 
            `<span class="task-category" style="background-color: ${categoryColor}">${task.category}</span>` : '';
        const dueDateHtml = dueDate ? `<span class="task-due-date ${dueDateClass}">${dueDateText}</span>` : '';
        const durationHtml = task.duration ? `<span class="task-duration">⏱️ ${task.duration} min</span>` : '';

        taskDiv.innerHTML = `
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title-container">
                        <h4 class="task-title">${task.title}</h4>
                    </div>
                    <div class="task-meta">
                        ${categoryHtml}
                        ${dueDateHtml}
                        ${durationHtml}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-delete" title="Supprimer la tâche">🗑️</button>
            </div>
        `;

        // Événements
        const checkbox = taskDiv.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => this.toggleTaskComplete(task.id));
        
        const deleteBtn = taskDiv.querySelector('.task-delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        return taskDiv;
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveData();
            this.updateTaskElement(task);
            this.updateTaskUI();
        }
    }

    updateTaskElement(task) {
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (taskElement) {
            taskElement.classList.toggle('completed', task.completed);
            const checkbox = taskElement.querySelector('.task-checkbox');
            checkbox.checked = task.completed;
        }
    }

    deleteTask(taskId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                const task = this.tasks[taskIndex];
                this.tasks.splice(taskIndex, 1);
                this.saveData();
                
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskElement) {
                    taskElement.remove();
                }
                
                this.updateQuadrantState(task.quadrant);
                this.updateTaskUI();
            }
        }
    }

    handleTaskMove(evt) {
        const taskId = parseInt(evt.item.dataset.taskId);
        const newQuadrant = evt.to.id;
        
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.quadrant !== newQuadrant) {
            const oldQuadrant = task.quadrant;
            task.quadrant = newQuadrant;
            this.saveData();
            this.updateQuadrantState(oldQuadrant);
            this.updateQuadrantState(newQuadrant);
            this.updateTaskUI();
        }
    }

    updateQuadrantState(quadrantId) {
        const quadrantElement = document.getElementById(quadrantId);
        if (quadrantElement) {
            const tasks = quadrantElement.querySelectorAll('.task-item');
            quadrantElement.classList.toggle('empty', tasks.length === 0);
        }
    }

    updateTaskUI() {
        this.updateTaskCounts();
        this.updateFooterStats();
    }

    updateTaskCounts() {
        const quadrants = ['urgent-important', 'important-not-urgent', 'urgent-not-important', 'not-urgent-not-important'];
        
        quadrants.forEach(quadrantId => {
            const count = this.tasks.filter(task => task.quadrant === quadrantId).length;
            const countElement = document.getElementById(`count-${quadrantId}`);
            if (countElement) {
                countElement.textContent = `${count} tâche${count !== 1 ? 's' : ''}`;
            }
        });
    }

    // ===== TIMER POMODORO =====
    
    startTimer() {
        if (!this.timer.isRunning) {
            this.timer.isRunning = true;
            this.timer.interval = setInterval(() => this.updateTimer(), 1000);
            
            document.getElementById('startTimer').disabled = true;
            document.getElementById('pauseTimer').disabled = false;
        }
    }

    pauseTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.interval);
        
        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;
    }

    resetTimer() {
        this.pauseTimer();
        
        const workDuration = parseInt(document.getElementById('workDuration').value) || 25;
        this.timer.currentTime = workDuration * 60;
        this.timer.totalTime = workDuration * 60;
        this.timer.mode = 'work';
        
        this.updateTimerDisplay();
        document.getElementById('startTimer').disabled = false;
    }

    updateTimer() {
        this.timer.currentTime--;
        
        if (this.timer.currentTime <= 0) {
            this.timerComplete();
        }
        
        this.updateTimerDisplay();
    }

    timerComplete() {
        this.pauseTimer();
        
        // Notification sonore (simple beep)
        this.playNotificationSound();
        
        if (this.timer.mode === 'work') {
            this.timer.sessions++;
            
            // Pause courte ou longue selon le cycle
            if (this.timer.cycle % 4 === 0) {
                this.startLongBreak();
            } else {
                this.startShortBreak();
            }
        } else {
            // Retour au travail
            this.startWorkSession();
        }
        
        this.updatePomodoroStats();
    }

    startWorkSession() {
        const workDuration = parseInt(document.getElementById('workDuration').value) || 25;
        this.timer.currentTime = workDuration * 60;
        this.timer.totalTime = workDuration * 60;
        this.timer.mode = 'work';
        this.timer.cycle++;
        
        document.getElementById('timerLabel').textContent = 'Session de travail';
        this.updateTimerDisplay();
    }

    startShortBreak() {
        const breakDuration = parseInt(document.getElementById('breakDuration').value) || 5;
        this.timer.currentTime = breakDuration * 60;
        this.timer.totalTime = breakDuration * 60;
        this.timer.mode = 'shortBreak';
        
        document.getElementById('timerLabel').textContent = 'Pause courte';
        this.updateTimerDisplay();
    }

    startLongBreak() {
        const longBreakDuration = parseInt(document.getElementById('longBreakDuration').value) || 15;
        this.timer.currentTime = longBreakDuration * 60;
        this.timer.totalTime = longBreakDuration * 60;
        this.timer.mode = 'longBreak';
        
        document.getElementById('timerLabel').textContent = 'Pause longue';
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.currentTime / 60);
        const seconds = this.timer.currentTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timerDisplay').textContent = timeString;
        
        // Mise à jour du cercle de progression
        const progress = ((this.timer.totalTime - this.timer.currentTime) / this.timer.totalTime) * 283;
        const progressCircle = document.getElementById('timerProgress');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = 283 - progress;
        }
    }

    updatePomodoroStats() {
        document.getElementById('sessionsToday').textContent = this.timer.sessions;
        document.getElementById('cycleProgress').textContent = `${((this.timer.cycle - 1) % 4) + 1}/4`;
        
        const totalHours = Math.floor((this.timer.sessions * 25) / 60);
        document.getElementById('totalTime').textContent = `${totalHours}h`;
    }

    playNotificationSound() {
        // Création d'un son simple avec Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // ===== SUIVI DES HABITUDES =====
    
    handleHabitSubmit(e) {
        e.preventDefault();
        
        const habitName = document.getElementById('habitName').value.trim();
        if (!habitName) return;
        
        const habitData = {
            id: this.habitIdCounter++,
            name: habitName,
            createdAt: new Date().toISOString(),
            completions: {}
        };
        
        this.habits.push(habitData);
        this.saveData();
        this.renderHabits();
        e.target.reset();
        document.getElementById('habitPreset').value = '';
    }

    renderHabits() {
        const container = document.getElementById('habitsGrid');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.habits.forEach(habit => {
            const habitCard = this.createHabitCard(habit);
            container.appendChild(habitCard);
        });
    }

    createHabitCard(habit) {
        const card = document.createElement('div');
        card.className = 'habit-card card';
        
        const streak = this.calculateStreak(habit);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Générer le calendrier du mois
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        
        let calendarHTML = '';
        
        // Jours vides au début
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="habit-day"></div>';
        }
        
        // Jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isCompleted = habit.completions[dateStr] || false;
            const isToday = day === today.getDate();
            
            const classes = ['habit-day'];
            if (isCompleted) classes.push('completed');
            if (isToday) classes.push('today');
            
            calendarHTML += `<div class="${classes.join(' ')}" data-habit-id="${habit.id}" data-date="${dateStr}">${day}</div>`;
        }
        
        card.innerHTML = `
            <div class="card__body">
                <div class="habit-header">
                    <h4 class="habit-name">${habit.name}</h4>
                    <span class="habit-streak">${streak} jours</span>
                    <button class="btn btn--outline btn--sm habit-delete" data-habit-id="${habit.id}">🗑️</button>
                </div>
                <div class="habit-calendar">
                    ${calendarHTML}
                </div>
            </div>
        `;
        
        // Événements
        card.querySelectorAll('.habit-day[data-date]').forEach(dayElement => {
            dayElement.addEventListener('click', () => {
                this.toggleHabitCompletion(habit.id, dayElement.dataset.date);
            });
        });
        
        card.querySelector('.habit-delete').addEventListener('click', () => {
            this.deleteHabit(habit.id);
        });
        
        return card;
    }

    toggleHabitCompletion(habitId, dateStr) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;
        
        habit.completions[dateStr] = !habit.completions[dateStr];
        this.saveData();
        this.renderHabits();
    }

    calculateStreak(habit) {
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        while (true) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (habit.completions[dateStr]) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    deleteHabit(habitId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette habitude ?')) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.saveData();
            this.renderHabits();
        }
    }

    // ===== PLANIFICATEUR =====
    
    handlePlanningSubmit(e) {
        e.preventDefault();
        
        const sessionData = {
            id: this.sessionIdCounter++,
            subject: document.getElementById('sessionSubject').value,
            date: document.getElementById('sessionDate').value,
            time: document.getElementById('sessionTime').value,
            duration: parseFloat(document.getElementById('sessionDuration').value),
            topic: document.getElementById('sessionTopic').value,
            createdAt: new Date().toISOString()
        };
        
        if (!sessionData.subject || !sessionData.date || !sessionData.time) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        
        this.sessions.push(sessionData);
        this.saveData();
        this.renderPlanning();
        e.target.reset();
    }

    renderPlanning() {
        const container = document.getElementById('planningCalendar');
        if (!container) return;
        
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Début de semaine (dimanche)
        
        const hours = Array.from({length: 16}, (_, i) => i + 7); // 7h à 22h
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        
        let calendarHTML = `
            <div class="calendar-header">
                <h3>Semaine du ${weekStart.toLocaleDateString('fr-FR')}</h3>
            </div>
            <div class="calendar-week">
                <div class="calendar-time"></div>
        `;
        
        // En-têtes des jours
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            calendarHTML += `<div class="calendar-day">${days[i]} ${date.getDate()}</div>`;
        }
        calendarHTML += '</div>';
        
        // Grille horaire
        hours.forEach(hour => {
            calendarHTML += '<div class="calendar-week">';
            calendarHTML += `<div class="calendar-time">${hour}:00</div>`;
            
            for (let day = 0; day < 7; day++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + day);
                const dateStr = date.toISOString().split('T')[0];
                
                // Rechercher les sessions pour ce jour et cette heure
                const sessionsForSlot = this.sessions.filter(session => 
                    session.date === dateStr && 
                    parseInt(session.time.split(':')[0]) === hour
                );
                
                let slotHTML = '<div class="session-slot">';
                sessionsForSlot.forEach(session => {
                    const color = this.subjectColors[session.subject] || '#666';
                    slotHTML += `
                        <div class="session-item" style="background-color: ${color}">
                            <div>${session.subject}</div>
                            <div style="font-size: 10px;">${session.topic || session.time}</div>
                        </div>
                    `;
                });
                slotHTML += '</div>';
                
                calendarHTML += slotHTML;
            }
            
            calendarHTML += '</div>';
        });
        
        container.innerHTML = calendarHTML;
    }

    // ===== BIEN-ÊTRE =====
    
    startBreathingExercise(type) {
        const exercises = {
            '4-7-8': { inhale: 4, hold: 7, exhale: 8, cycles: 4 },
            'coherence': { inhale: 5, hold: 0, exhale: 5, cycles: 6 },
            'carre': { inhale: 4, hold: 4, exhale: 4, cycles: 4 }
        };
        
        const exercise = exercises[type];
        if (!exercise) return;
        
        const guide = document.getElementById('breathingGuide');
        const circle = guide.querySelector('.breathing-circle');
        const instruction = guide.querySelector('.breathing-instruction');
        
        guide.style.display = 'block';
        document.querySelector('.breathing-exercises').style.display = 'none';
        
        let currentCycle = 0;
        let phase = 'inhale'; // 'inhale', 'hold', 'exhale'
        
        const runCycle = () => {
            if (currentCycle >= exercise.cycles) {
                this.stopBreathingExercise();
                return;
            }
            
            const durations = {
                'inhale': exercise.inhale * 1000,
                'hold': exercise.hold * 1000,
                'exhale': exercise.exhale * 1000
            };
            
            if (phase === 'inhale') {
                instruction.textContent = `Inspirez (${exercise.inhale}s)`;
                circle.classList.add('inhale');
                circle.classList.remove('exhale');
                
                setTimeout(() => {
                    if (exercise.hold > 0) {
                        phase = 'hold';
                        runCycle();
                    } else {
                        phase = 'exhale';
                        runCycle();
                    }
                }, durations.inhale);
                
            } else if (phase === 'hold') {
                instruction.textContent = `Retenez (${exercise.hold}s)`;
                
                setTimeout(() => {
                    phase = 'exhale';
                    runCycle();
                }, durations.hold);
                
            } else if (phase === 'exhale') {
                instruction.textContent = `Expirez (${exercise.exhale}s)`;
                circle.classList.add('exhale');
                circle.classList.remove('inhale');
                
                setTimeout(() => {
                    currentCycle++;
                    phase = 'inhale';
                    runCycle();
                }, durations.exhale);
            }
        };
        
        runCycle();
    }

    stopBreathingExercise() {
        const guide = document.getElementById('breathingGuide');
        const circle = guide.querySelector('.breathing-circle');
        
        guide.style.display = 'none';
        document.querySelector('.breathing-exercises').style.display = 'block';
        
        circle.classList.remove('inhale', 'exhale');
    }

    recordMood(mood) {
        const today = new Date().toISOString().split('T')[0];
        
        this.moodData = this.moodData.filter(entry => entry.date !== today);
        this.moodData.push({
            date: today,
            mood: parseInt(mood),
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
        
        // Mise à jour visuelle
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-mood="${mood}"]`).classList.add('selected');
        
        this.updateMoodHistory();
    }

    updateMoodHistory() {
        const container = document.getElementById('moodHistory');
        if (!container) return;
        
        const recent = this.moodData.slice(-7).reverse();
        container.innerHTML = recent.map(entry => 
            `<div>📅 ${new Date(entry.date).toLocaleDateString('fr-FR')}: ${this.getMoodEmoji(entry.mood)}</div>`
        ).join('');
    }

    getMoodEmoji(mood) {
        const emojis = ['', '😞', '😕', '😐', '🙂', '😊'];
        return emojis[mood] || '😐';
    }

    showDailyTip() {
        const tipContainer = document.getElementById('dailyTip');
        if (!tipContainer) return;
        
        const today = new Date();
        const tipIndex = today.getDate() % this.wellnessTips.length;
        tipContainer.innerHTML = `
            <strong>💡 Conseil du jour :</strong><br>
            ${this.wellnessTips[tipIndex]}
        `;
    }

    // ===== RAPPELS =====
    
    handleReminderSubmit(e) {
        e.preventDefault();
        
        const reminderData = {
            id: this.reminderIdCounter++,
            title: document.getElementById('reminderTitle').value,
            type: document.getElementById('reminderType').value,
            date: document.getElementById('reminderDate').value,
            time: document.getElementById('reminderTime').value,
            priority: document.getElementById('reminderPriority').value,
            createdAt: new Date().toISOString()
        };
        
        if (!reminderData.title || !reminderData.type || !reminderData.date || !reminderData.time) {
            alert('Veuillez remplir tous les champs.');
            return;
        }
        
        this.reminders.push(reminderData);
        this.saveData();
        this.renderReminders();
        e.target.reset();
    }

    renderReminders() {
        const container = document.getElementById('remindersList');
        if (!container) return;
        
        // Trier par date
        const sortedReminders = [...this.reminders].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });
        
        container.innerHTML = sortedReminders.map(reminder => 
            this.createReminderHTML(reminder)
        ).join('');
        
        // Ajouter les événements
        container.querySelectorAll('.reminder-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteReminder(parseInt(e.target.dataset.reminderId));
            });
        });
    }

    createReminderHTML(reminder) {
        const reminderDate = new Date(`${reminder.date}T${reminder.time}`);
        const now = new Date();
        const isPast = reminderDate < now;
        
        return `
            <div class="reminder-item ${isPast ? 'past' : ''}">
                <div class="reminder-content">
                    <h4>${reminder.title}</h4>
                    <div class="reminder-meta">
                        <span class="reminder-type">${reminder.type}</span>
                        <span>📅 ${reminderDate.toLocaleDateString('fr-FR')}</span>
                        <span>🕐 ${reminder.time}</span>
                        <span class="reminder-priority ${reminder.priority}">${this.getPriorityText(reminder.priority)}</span>
                    </div>
                </div>
                <div class="reminder-actions">
                    <button class="btn btn--outline btn--sm reminder-delete" data-reminder-id="${reminder.id}">🗑️</button>
                </div>
            </div>
        `;
    }

    getPriorityText(priority) {
        const priorities = {
            'low': 'Faible',
            'medium': 'Moyenne', 
            'high': 'Élevée'
        };
        return priorities[priority] || priority;
    }

    deleteReminder(reminderId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce rappel ?')) {
            this.reminders = this.reminders.filter(r => r.id !== reminderId);
            this.saveData();
            this.renderReminders();
        }
    }

    // ===== ANALYTICS =====
    
    initCharts() {
        // Attendre que Chart.js soit chargé
        if (typeof Chart !== 'undefined') {
            setTimeout(() => this.updateAnalytics(), 100);
        }
    }

    updateAnalytics() {
        this.updateOverviewStats();
        this.createSubjectChart();
        this.createProgressChart();
    }

    updateOverviewStats() {
        // Heures de cette semaine
        const weeklyHours = this.calculateWeeklyHours();
        document.getElementById('weeklyHours').textContent = `${weeklyHours}h`;
        
        // Série d'habitudes
        const habitStreak = this.calculateBestHabitStreak();
        document.getElementById('habitStreak').textContent = habitStreak;
        
        // Taux de réussite
        const completionRate = this.calculateCompletionRate();
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    }

    calculateWeeklyHours() {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        
        const weeklyTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= weekStart && task.completed && task.duration;
        });
        
        const totalMinutes = weeklyTasks.reduce((total, task) => 
            total + (parseInt(task.duration) || 0), 0);
        
        return Math.round(totalMinutes / 60 * 10) / 10;
    }

    calculateBestHabitStreak() {
        if (this.habits.length === 0) return 0;
        
        const streaks = this.habits.map(habit => this.calculateStreak(habit));
        return Math.max(...streaks, 0);
    }

    calculateCompletionRate() {
        if (this.tasks.length === 0) return 0;
        
        const completed = this.tasks.filter(task => task.completed).length;
        return Math.round((completed / this.tasks.length) * 100);
    }

    createSubjectChart() {
        const ctx = document.getElementById('subjectChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        // Calculer le temps par matière
        const subjectTime = {};
        this.tasks.forEach(task => {
            if (task.category && task.duration && task.completed) {
                subjectTime[task.category] = (subjectTime[task.category] || 0) + parseInt(task.duration);
            }
        });
        
        const subjects = Object.keys(subjectTime);
        const times = Object.values(subjectTime);
        const colors = subjects.map(subject => this.subjectColors[subject] || '#666');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: subjects,
                datasets: [{
                    data: times,
                    backgroundColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        // Données des 7 derniers jours
        const last7Days = [];
        const taskCounts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            last7Days.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }));
            
            const dayTasks = this.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate.toISOString().split('T')[0] === dateStr && task.completed;
            }).length;
            
            taskCounts.push(dayTasks);
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Tâches complétées',
                    data: taskCounts,
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // ===== THÈME =====
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        
        const toggle = document.getElementById('themeToggle');
        toggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        // Sauvegarder la préférence
        try {
            localStorage.setItem('prepapp_theme', newTheme);
        } catch (error) {
            console.warn('Impossible de sauvegarder le thème');
        }
    }

    // ===== RACCOURCIS CLAVIER =====
    
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.switchTab('matrix');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchTab('pomodoro');
                    break;
                case '3':
                    e.preventDefault();
                    this.switchTab('habits');
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.currentTab === 'matrix') {
                        document.getElementById('taskForm').dispatchEvent(new Event('submit'));
                    }
                    break;
            }
        }
        
        // Spacebar pour démarrer/arrêter le timer
        if (e.code === 'Space' && this.currentTab === 'pomodoro' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            if (this.timer.isRunning) {
                this.pauseTimer();
            } else {
                this.startTimer();
            }
        }
    }

    // ===== SAUVEGARDE ET CHARGEMENT =====
    
    saveData() {
        try {
            const data = {
                tasks: this.tasks,
                habits: this.habits,
                sessions: this.sessions,
                reminders: this.reminders,
                moodData: this.moodData,
                timer: {
                    sessions: this.timer.sessions,
                    cycle: this.timer.cycle
                },
                counters: {
                    taskId: this.taskIdCounter,
                    habitId: this.habitIdCounter,
                    sessionId: this.sessionIdCounter,
                    reminderId: this.reminderIdCounter
                }
            };
            
            localStorage.setItem('prepapp_data', JSON.stringify(data));
        } catch (error) {
            console.warn('Impossible de sauvegarder les données:', error);
        }
    }

    loadData() {
        try {
            const savedData = localStorage.getItem('prepapp_data');
            
            if (savedData) {
                const data = JSON.parse(savedData);
                
                this.tasks = data.tasks || [];
                this.habits = data.habits || [];
                this.sessions = data.sessions || [];
                this.reminders = data.reminders || [];
                this.moodData = data.moodData || [];
                
                if (data.timer) {
                    this.timer.sessions = data.timer.sessions || 0;
                    this.timer.cycle = data.timer.cycle || 1;
                }
                
                if (data.counters) {
                    this.taskIdCounter = data.counters.taskId || 1;
                    this.habitIdCounter = data.counters.habitId || 1;
                    this.sessionIdCounter = data.counters.sessionId || 1;
                    this.reminderIdCounter = data.counters.reminderId || 1;
                }
            }
            
            // Charger le thème
            const savedTheme = localStorage.getItem('prepapp_theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-color-scheme', savedTheme);
                const toggle = document.getElementById('themeToggle');
                if (toggle) {
                    toggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
                }
            }
            
        } catch (error) {
            console.warn('Impossible de charger les données:', error);
        }
    }

    updateAllUI() {
        // Rendre toutes les tâches
        this.tasks.forEach(task => {
            this.renderTask(task);
        });
        
        this.updateTaskUI();
        this.updateFooterStats();
        this.updatePomodoroStats();
        this.updateMoodHistory();
        
        // Définir la date d'aujourd'hui par défaut
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('sessionDate').value = today;
        document.getElementById('reminderDate').value = today;
    }

    updateFooterStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        document.getElementById('totalTasksFooter').textContent = totalTasks;
        document.getElementById('completedTasksFooter').textContent = completedTasks;
        document.getElementById('productivityScore').textContent = `${productivityScore}%`;
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new PrepApp();
});