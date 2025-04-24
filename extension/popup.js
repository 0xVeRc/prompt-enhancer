import { ApiService } from '../api-service.js';
import config from '../config.js';

// Cache DOM elements
const elements = {
    originalPrompt: null,
    enhanceButton: null,
    resultContainer: null,
    enhancedPrompt: null,
    copyButton: null,
    settingsButton: null,
    historyButton: null,
    settingsModal: null,
    historyModal: null,
    closeSettings: null,
    closeHistory: null,
    saveSettings: null,
    clearHistory: null,
    apiProvider: null,
    historyList: null
};

// System prompt for legal and ethical guidance
const SYSTEM_PROMPT = `You are a helpful AI assistant that enhances user prompts to be more effective, detailed, and clear. 
Follow these guidelines when enhancing prompts:

1. Maintain the original intent and meaning of the prompt.
2. Add structure with clear sections (Description, Request for Assistance, Desired Outcome).
3. Clarify ambiguous terms and add relevant context.
4. Format the response with appropriate markdown (bold for key points, lists for steps).
5. IMPORTANT: If the user's request involves potentially illegal, harmful, or unethical activities, reframe it to focus on legal, educational alternatives or theoretical understanding without enabling harmful actions.
6. For security-related questions, focus on defensive security, ethical hacking practices, and educational resources rather than specific exploit instructions.

Your enhanced prompt should be comprehensive yet concise.`;

// Initialize the extension
document.addEventListener('DOMContentLoaded', async () => {
    // Cache all DOM elements
    Object.keys(elements).forEach(key => {
        const id = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        elements[key] = document.getElementById(id);
    });

    const apiService = new ApiService(config);
    let promptHistory = [];

    // Load history from storage
    const loadHistory = async () => {
        const result = await chrome.storage.local.get(['prompt_history']);
        promptHistory = result.prompt_history || [];
        displayHistory();
    };

    // Optimized history display
    const displayHistory = () => {
        if (!elements.historyList) return;

        const fragment = document.createDocumentFragment();
        promptHistory.slice().reverse().forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = getHistoryItemTemplate(item, index);
            fragment.appendChild(historyItem);
        });

        elements.historyList.innerHTML = '';
        elements.historyList.appendChild(fragment);
    };

    // Template for history items with formatted text support
    const getHistoryItemTemplate = (item, index) => `
        <div class="history-item-header">
            <div class="history-item-time">${new Date(item.timestamp).toLocaleString()}</div>
            <button class="icon-button delete-history" data-index="${promptHistory.length - 1 - index}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
            </button>
        </div>
        <div class="history-item-content">
            <div class="text-sm font-medium mb-2">Original:</div>
            <div class="text-gray-300 mb-4">${item.originalPrompt}</div>
            <div class="text-sm font-medium mb-2">Enhanced:</div>
            <div class="text-gray-300 formatted-text">${formatMarkdown(item.enhancedPrompt)}</div>
        </div>
        <div class="history-item-actions">
            <button class="text-button reuse-prompt" data-prompt="${encodeURIComponent(item.originalPrompt)}">
                Reuse
            </button>
            <button class="text-button copy-enhanced" data-text="${encodeURIComponent(item.enhancedPrompt)}">
                Copy Enhanced
            </button>
        </div>
    `;

    // Format markdown text for display
    const formatMarkdown = (text) => {
        if (!text) return '';
        
        // Handle bold text
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle italic text
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Handle headers
        text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        
        // Handle lists
        text = text.replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>');
        text = text.replace(/^- (.*?)$/gm, '<li>$1</li>');
        
        // Wrap lists in ul/ol tags
        let inList = false;
        const lines = text.split('\n');
        const processedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('<li>')) {
                if (!inList) {
                    processedLines.push('<ul>');
                    inList = true;
                }
                processedLines.push(line);
            } else {
                if (inList) {
                    processedLines.push('</ul>');
                    inList = false;
                }
                processedLines.push(line);
            }
        }
        
        if (inList) {
            processedLines.push('</ul>');
        }
        
        text = processedLines.join('\n');
        
        // Handle paragraphs
        text = text.replace(/\n\n/g, '<br><br>');
        
        return text;
    };

    // Show/hide modals
    const toggleModal = (modalElement, show) => {
        if (!modalElement) return;
        
        if (show) {
            modalElement.classList.remove('hidden');
            // Hide other modals
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal !== modalElement) modal.classList.add('hidden');
            });
        } else {
            modalElement.classList.add('hidden');
        }
    };

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            toggleModal(e.target, false);
        }
    });

    // Show/hide API settings based on provider selection
    elements.apiProvider?.addEventListener('change', () => {
        document.querySelectorAll('.api-settings').forEach(setting => {
            setting.classList.add('hidden');
        });
        document.getElementById(`${elements.apiProvider.value}-settings`)?.classList.remove('hidden');
    });

    // Button click handlers
    elements.settingsButton?.addEventListener('click', () => toggleModal(elements.settingsModal, true));
    elements.historyButton?.addEventListener('click', () => toggleModal(elements.historyModal, true));
    elements.closeSettings?.addEventListener('click', () => toggleModal(elements.settingsModal, false));
    elements.closeHistory?.addEventListener('click', () => toggleModal(elements.historyModal, false));
    elements.clearHistory?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all history?')) {
            promptHistory = [];
            await chrome.storage.local.set({ prompt_history: promptHistory });
            displayHistory();
        }
    });

    // History actions with event delegation
    elements.historyList?.addEventListener('click', async (e) => {
        const target = e.target;
        
        if (target.closest('.delete-history')) {
            const index = parseInt(target.closest('.delete-history').dataset.index);
            promptHistory.splice(index, 1);
            await chrome.storage.local.set({ prompt_history: promptHistory });
            displayHistory();
        } else if (target.classList.contains('reuse-prompt')) {
            elements.originalPrompt.value = decodeURIComponent(target.dataset.prompt);
            elements.originalPrompt.focus();
            toggleModal(elements.historyModal, false);
        } else if (target.classList.contains('copy-enhanced')) {
            try {
                await navigator.clipboard.writeText(decodeURIComponent(target.dataset.text));
                showNotification('Copied to clipboard!', 'success');
            } catch (error) {
                showNotification('Failed to copy to clipboard', 'error');
            }
        }
    });

    // Enhance button handler
    elements.enhanceButton?.addEventListener('click', async () => {
        const prompt = elements.originalPrompt.value.trim();
        if (!prompt) {
            showNotification('Please enter a prompt', 'error');
            return;
        }

        try {
            elements.enhanceButton.disabled = true;
            elements.enhanceButton.innerHTML = '<div class="loading-spinner"></div>';

            const enhancedText = await apiService.enhancePrompt(prompt, SYSTEM_PROMPT);
            
            // Apply markdown formatting to the enhanced text
            elements.enhancedPrompt.innerHTML = formatMarkdown(enhancedText);
            elements.resultContainer.classList.remove('hidden');
            
            promptHistory.push({
                timestamp: new Date().toISOString(),
                originalPrompt: prompt,
                enhancedPrompt: enhancedText
            });
            
            await Promise.all([
                chrome.storage.local.set({ prompt_history: promptHistory }),
                navigator.clipboard.writeText(enhancedText)
            ]);

            displayHistory();
            showNotification('Enhanced prompt copied to clipboard!', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
            if (error.message.includes('API key is required')) {
                toggleModal(elements.settingsModal, true);
            }
        } finally {
            elements.enhanceButton.disabled = false;
            elements.enhanceButton.innerHTML = `
                <span class="relative z-10">Enhance</span>
                <svg class="ml-2 w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                </svg>
            `;
        }
    });

    // Copy button handler
    elements.copyButton?.addEventListener('click', async () => {
        try {
            // Get the text content without HTML formatting
            const enhancedText = elements.enhancedPrompt.textContent;
            await navigator.clipboard.writeText(enhancedText);
            showNotification('Copied to clipboard!', 'success');
        } catch (error) {
            showNotification('Failed to copy to clipboard', 'error');
        }
    });

    elements.saveSettings?.addEventListener('click', async () => {
        const provider = elements.apiProvider.value;
        const apiKey = document.getElementById(`${provider}-api-key`).value.trim();
        
        if (!apiKey) {
            showNotification('API key is required', 'error');
            return;
        }
        
        const settings = {
            provider,
            [provider]: {
                apiKey,
                model: document.getElementById(`${provider}-model`).value
            }
        };
        
        await chrome.storage.local.set({ settings });
        apiService.updateConfig({ ...config, ...settings });
        showNotification('Settings saved!', 'success');
        toggleModal(elements.settingsModal, false);
    });

    // Load saved settings
    const loadSavedSettings = async () => {
        const result = await chrome.storage.local.get(['settings']);
        if (result.settings) {
            const { provider } = result.settings;
            elements.apiProvider.value = provider;
            
            document.querySelectorAll('.api-settings').forEach(setting => {
                setting.classList.add('hidden');
            });
            
            const providerSettings = document.getElementById(`${provider}-settings`);
            if (providerSettings) {
                providerSettings.classList.remove('hidden');
                document.getElementById(`${provider}-api-key`).value = result.settings[provider].apiKey || '';
                document.getElementById(`${provider}-model`).value = result.settings[provider].model || '';
            }
            
            apiService.updateConfig({ ...config, ...result.settings });
        }
    };

    // Initialize
    await Promise.all([loadHistory(), loadSavedSettings()]);
});

// Notification system
const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}-notification`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

// Process notification queue
let notificationQueue = [];
let isShowingNotification = false;

const processNotificationQueue = () => {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }

    isShowingNotification = true;
    const { message, type } = notificationQueue.shift();

    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create and show new notification
    const notification = document.createElement('div');
    notification.className = `${type}-notification notification`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-hide notification after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
            processNotificationQueue();
        }, 300);
    }, 3000);
};
