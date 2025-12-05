class UIManager {
    constructor() {
        this.theme = 'dark';
        this.animationsEnabled = true;
        this.soundsEnabled = true;
        this.notificationsEnabled = true;
        this.loadSettings();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('energosphere_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.theme = settings.theme || 'dark';
                this.animationsEnabled = settings.animations !== false;
                this.soundsEnabled = settings.sounds !== false;
                this.notificationsEnabled = settings.notifications !== false;
            } catch (e) {
                console.warn('Ошибка загрузки настроек:', e);
            }
        }
        
        this.applyTheme();
    }
    
    saveSettings() {
        const settings = {
            theme: this.theme,
            animations: this.animationsEnabled,
            sounds: this.soundsEnabled,
            notifications: this.notificationsEnabled,
            savedAt: Date.now()
        };
        
        localStorage.setItem('energosphere_settings', JSON.stringify(settings));
    }
    
    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
        
        const themes = {
            dark: {
                '--background': '#0a1929',
                '--surface': '#1a2a3a',
                '--surface-light': '#2a3a4a',
                '--text': '#ffffff',
                '--text-secondary': '#b0bec5'
            },
            light: {
                '--background': '#f5f7fa',
                '--surface': '#ffffff',
                '--surface-light': '#e3e8f0',
                '--text': '#2d3748',
                '--text-secondary': '#718096'
            },
            cyber: {
                '--background': '#0a0a1a',
                '--surface': '#1a1a3a',
                '--surface-light': '#2a2a4a',
                '--text': '#00ffff',
                '--text-secondary': '#ff00ff'
            }
        };
        
        const theme = themes[this.theme] || themes.dark;
        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });
    }
    
    toggleTheme() {
        const themes = ['dark', 'light', 'cyber'];
        const currentIndex = themes.indexOf(this.theme);
        this.theme = themes[(currentIndex + 1) % themes.length];
        this.applyTheme();
        this.saveSettings();
        this.showNotification(`Тема изменена: ${this.theme}`);
    }
    
    toggleAnimations() {
        this.animationsEnabled = !this.animationsEnabled;
        document.body.classList.toggle('no-animations', !this.animationsEnabled);
        this.saveSettings();
        this.showNotification(`Анимации ${this.animationsEnabled ? 'включены' : 'выключены'}`);
    }
    
    toggleSounds() {
        this.soundsEnabled = !this.soundsEnabled;
        this.saveSettings();
        this.showNotification(`Звуки ${this.soundsEnabled ? 'включены' : 'выключены'}`);
    }
    
    createParticle(x, y, type = 'energy') {
        if (!this.animationsEnabled) return null;
        
        const particle = document.createElement('div');
        particle.className = `particle particle-${type}`;
        
        const colors = {
            energy: '#00e5ff',
            quantum: '#9c27b0',
            crystal: '#ff4081',
            success: '#00e676',
            warning: '#ff9100'
        };
        
        const size = Math.random() * 20 + 10;
        const duration = Math.random() * 1000 + 500;
        
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, ${colors[type] || colors.energy}, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: particleFloat ${duration}ms ease-out forwards;
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, duration);
        
        return particle;
    }
    
    showFloatingText(text, x, y, color = '#00ffaa') {
        if (!this.animationsEnabled) return null;
        
        const floating = document.createElement('div');
        floating.className = 'floating-text';
        floating.textContent = text;
        
        floating.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-weight: bold;
            font-size: 18px;
            pointer-events: none;
            z-index: 10000;
            text-shadow: 0 0 10px currentColor;
            animation: floatUp 1s ease-out forwards;
        `;
        
        document.body.appendChild(floating);
        
        setTimeout(() => {
            floating.remove();
        }, 1000);
        
        return floating;
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        if (!this.notificationsEnabled) return;
        
        const notifications = document.getElementById('notifications') || this.createNotificationsContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                ${this.getNotificationIcon(type)}
            </div>
            <div class="notification-content">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        notification.querySelector('.notification-close').onclick = () => {
            notification.remove();
        };
        
        notifications.appendChild(notification);
        
        // Автоматическое удаление
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease forwards';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
        
        // Звуковое уведомление
        if (this.soundsEnabled) {
            this.playSound(type);
        }
        
        return notification;
    }
    
    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            energy: '⚡',
            quantum: '⚛',
            rebirth: '♾️',
            event: '🎉'
        };
        
        return icons[type] || icons.info;
    }
    
    playSound(type) {
        if (!this.soundsEnabled) return;
        
        // В реальном проекте здесь будет воспроизведение аудиофайлов
        const sounds = {
            click: { frequency: 800, duration: 0.1 },
            purchase: { frequency: 1200, duration: 0.2 },
            rebirth: { frequency: 600, duration: 0.5 },
            error: { frequency: 400, duration: 0.3 },
            notification: { frequency: 1000, duration: 0.15 }
        };
        
        const sound = sounds[type];
        if (sound && window.AudioContext) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = sound.frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + sound.duration);
            } catch (e) {
                console.warn('Ошибка воспроизведения звука:', e);
            }
        }
    }
    
    createNotificationsContainer() {
        const container = document.createElement('div');
        container.id = 'notifications';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 300px;
        `;
        
        document.body.appendChild(container);
        return container;
    }
    
    showModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: var(--surface);
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            border: 2px solid var(--primary);
        `;
        
        modalContent.innerHTML = `
            <h2 style="margin-bottom: 20px; color: var(--primary);">${title}</h2>
            <div class="modal-body">${content}</div>
            <div class="modal-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;"></div>
        `;
        
        const actionsContainer = modalContent.querySelector('.modal-actions');
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = `btn ${button.class || ''}`;
            btn.textContent = button.text;
            btn.onclick = () => {
                if (button.action) button.action();
                modal.remove();
            };
            actionsContainer.appendChild(btn);
        });
        
        // Кнопка закрытия по умолчанию
        if (buttons.length === 0) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn';
            closeBtn.textContent = 'Закрыть';
            closeBtn.onclick = () => modal.remove();
            actionsContainer.appendChild(closeBtn);
        }
        
        // Закрытие по клику на фон
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        return modal;
    }
    
    updateProgressBar(barId, percentage, color = null) {
        const bar = document.getElementById(barId);
        if (!bar) return;
        
        const fill = bar.querySelector('.progress-fill') || this.createProgressFill(bar);
        
        if (color) {
            fill.style.background = color;
        }
        
        fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }
    
    createProgressFill(container) {
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, var(--primary), var(--accent));
            border-radius: inherit;
            transition: width 0.3s ease;
        `;
        
        container.appendChild(fill);
        return fill;
    }
    
    formatNumber(number) {
        if (number >= 1e12) return (number / 1e12).toFixed(2) + 'T';
        if (number >= 1e9) return (number / 1e9).toFixed(2) + 'B';
        if (number >= 1e6) return (number / 1e6).toFixed(2) + 'M';
        if (number >= 1e3) return (number / 1e3).toFixed(1) + 'K';
        return Math.floor(number).toString();
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        } else if (minutes > 0) {
            return `${minutes}м ${secs}с`;
        } else {
            return `${secs}с`;
        }
    }
    
    createTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: var(--surface);
            color: var(--text);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 10002;
            border: 1px solid var(--primary);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        
        const showTooltip = (e) => {
            tooltip.style.left = e.pageX + 10 + 'px';
            tooltip.style.top = e.pageY + 10 + 'px';
            tooltip.style.opacity = 1;
        };
        
        const hideTooltip = () => {
            tooltip.style.opacity = 0;
        };
        
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mousemove', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        
        return {
            destroy: () => {
                element.removeEventListener('mouseenter', showTooltip);
                element.removeEventListener('mousemove', showTooltip);
                element.removeEventListener('mouseleave', hideTooltip);
                tooltip.remove();
            }
        };
    }
    
    // Анимация тряски элемента
    shakeElement(element, intensity = 5) {
        if (!this.animationsEnabled) return;
        
        const originalTransform = element.style.transform || '';
        const shake = [
            `translateX(${intensity}px)`,
            `translateX(${-intensity}px)`,
            `translateX(${intensity}px)`,
            `translateX(${-intensity}px)`,
            `translateX(0)`
        ];
        
        element.style.transition = 'transform 0.1s';
        
        shake.forEach((transform, index) => {
            setTimeout(() => {
                element.style.transform = transform;
            }, index * 50);
        });
        
        setTimeout(() => {
            element.style.transform = originalTransform;
            setTimeout(() => {
                element.style.transition = '';
            }, 100);
        }, 250);
    }
    
    // Показ экрана загрузки
    showLoadingScreen(message = 'Загрузка...') {
        const loading = document.createElement('div');
        loading.id = 'loading-screen';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--background);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10003;
            gap: 20px;
        `;
        
        loading.innerHTML = `
            <div class="loading-spinner" style="
                width: 60px;
                height: 60px;
                border: 4px solid var(--surface-light);
                border-top: 4px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <div class="loading-text" style="
                color: var(--text);
                font-size: 18px;
            ">${message}</div>
        `;
        
        // Добавляем стили для анимации
        if (!document.querySelector('#loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(loading);
        return loading;
    }
    
    hideLoadingScreen() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.style.opacity = '0';
            loading.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (loading.parentNode) {
                    loading.remove();
                }
            }, 300);
        }
    }
}

// Экспортируем глобально для использования в game.js
window.uiManager = new UIManager();
