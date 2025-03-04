import { ApiService } from './api-service.js';
import config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize API key from environment variables if available
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envApiKey && !localStorage.getItem('openai_api_key')) {
        localStorage.setItem('openai_api_key', envApiKey);
    }

    const apiService = new ApiService(config);
    const originalPromptInput = document.getElementById('original-prompt');
    const enhanceButton = document.getElementById('enhance-button');
    const resultContainer = document.getElementById('result-container');
    const enhancedPromptOutput = document.getElementById('enhanced-prompt');
    const copyButton = document.getElementById('copy-button');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsButton = document.getElementById('close-settings');
    const saveSettingsButton = document.getElementById('save-settings');
    const apiProviderSelect = document.getElementById('api-provider');

    // Load prompt history from localStorage
    let promptHistory = JSON.parse(localStorage.getItem('prompt_history') || '[]');

    // Create history container
    const historyContainer = document.createElement('div');
    historyContainer.className = 'glass-card p-8 md:p-10 mt-8';
    historyContainer.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">History</h2>
            <button id="clear-history" class="text-sm text-primary-light hover:text-white transition-colors">
                Clear History
            </button>
        </div>
        <div id="history-list" class="space-y-6"></div>
    `;
    resultContainer.parentNode.insertBefore(historyContainer, resultContainer.nextSibling);

    // Function to display history
    function displayHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        promptHistory.slice().reverse().forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'bg-opacity-10 bg-white backdrop-blur-sm rounded-xl p-6 space-y-4';
            historyItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="text-sm text-gray-400">${new Date(item.timestamp).toLocaleString()}</div>
                    <button class="delete-history text-sm text-red-400 hover:text-red-300 transition-colors" data-index="${promptHistory.length - 1 - index}">
                        Delete
                    </button>
                </div>
                <div>
                    <div class="text-sm font-medium mb-2">Original Prompt:</div>
                    <div class="text-gray-300">${item.originalPrompt}</div>
                </div>
                <div>
                    <div class="text-sm font-medium mb-2">Enhanced Prompt:</div>
                    <div class="text-gray-300">${item.enhancedPrompt}</div>
                </div>
                <button class="reuse-prompt text-sm text-primary-light hover:text-white transition-colors" data-prompt="${encodeURIComponent(item.originalPrompt)}">
                    Reuse Prompt
                </button>
            `;
            historyList.appendChild(historyItem);
        });

        // Update history visibility
        historyContainer.style.display = promptHistory.length ? 'block' : 'none';
    }

    // Clear history button
    document.getElementById('clear-history').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all history?')) {
            promptHistory = [];
            localStorage.setItem('prompt_history', JSON.stringify(promptHistory));
            displayHistory();
        }
    });

    // Delete history item
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-history')) {
            const index = parseInt(e.target.dataset.index);
            promptHistory.splice(index, 1);
            localStorage.setItem('prompt_history', JSON.stringify(promptHistory));
            displayHistory();
        }
    });

    // Reuse prompt
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('reuse-prompt')) {
            const prompt = decodeURIComponent(e.target.dataset.prompt);
            originalPromptInput.value = prompt;
            originalPromptInput.focus();
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Show/hide API settings based on provider selection
    const apiSettingsPanels = document.querySelectorAll('.api-settings');
    apiProviderSelect.addEventListener('change', () => {
        apiSettingsPanels.forEach(panel => {
            panel.classList.add('hidden');
        });
        document.getElementById(`${apiProviderSelect.value}-settings`)?.classList.remove('hidden');
    });

    // Settings modal controls
    settingsButton.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        // Load current API key into the input
        const currentKey = localStorage.getItem(`${apiProviderSelect.value}_api_key`);
        if (currentKey) {
            document.getElementById(`${apiProviderSelect.value}-api-key`).value = currentKey;
        }
    });

    closeSettingsButton.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // Handle enhance button click
    enhanceButton.addEventListener('click', async () => {
        const originalPrompt = originalPromptInput.value.trim();
        if (!originalPrompt) {
            showNotification('Please enter a prompt', 'error');
            return;
        }

        try {
            // Show loading state
            enhanceButton.disabled = true;
            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'loading-spinner';
            enhanceButton.textContent = '';
            enhanceButton.appendChild(loadingSpinner);

            // Call API
            const enhancedText = await apiService.enhancePrompt(originalPrompt);

            // Show result
            enhancedPromptOutput.textContent = enhancedText;
            resultContainer.classList.remove('hidden');
            
            // Save to history
            promptHistory.push({
                timestamp: new Date().toISOString(),
                originalPrompt: originalPrompt,
                enhancedPrompt: enhancedText
            });
            localStorage.setItem('prompt_history', JSON.stringify(promptHistory));
            displayHistory();
            
            // Auto copy to clipboard
            await navigator.clipboard.writeText(enhancedText);
            showNotification('Enhanced prompt copied to clipboard!', 'success');

        } catch (error) {
            showNotification(error.message, 'error');
            if (error.message.includes('API key is required')) {
                settingsModal.classList.remove('hidden');
            }
        } finally {
            // Reset button state
            enhanceButton.disabled = false;
            enhanceButton.innerHTML = '<span class="relative z-10">Enhance</span><svg class="ml-2 w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>';
        }
    });

    // Manual copy button
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(enhancedPromptOutput.textContent);
            showNotification('Copied to clipboard!', 'success');
        } catch (error) {
            showNotification('Failed to copy to clipboard', 'error');
        }
    });

    // Save settings
    saveSettingsButton.addEventListener('click', () => {
        const provider = apiProviderSelect.value;
        const apiKey = document.getElementById(`${provider}-api-key`).value.trim();
        
        if (!apiKey) {
            showNotification('Please enter an API key', 'error');
            return;
        }

        const model = document.getElementById(`${provider}-model`).value;

        // Save to localStorage
        localStorage.setItem(`${provider}_api_key`, apiKey);
        localStorage.setItem('default_provider', provider);
        localStorage.setItem('default_model', model);

        // Update config and API service
        config.api.provider = provider;
        config.api.model = model;
        apiService.provider = provider;
        apiService.model = model;
        apiService.apiKeys[provider] = apiKey;

        showNotification('Settings saved successfully!', 'success');
        settingsModal.classList.add('hidden');
    });

    // Load saved settings
    const loadSavedSettings = () => {
        const savedProvider = localStorage.getItem('default_provider') || 'openai';
        apiProviderSelect.value = savedProvider;
        
        // Trigger change event to show correct settings
        const event = new Event('change');
        apiProviderSelect.dispatchEvent(event);

        // Load saved API keys
        ['openai', 'anthropic', 'custom'].forEach(provider => {
            const savedKey = localStorage.getItem(`${provider}_api_key`);
            if (savedKey) {
                document.getElementById(`${provider}-api-key`).value = savedKey;
            }
        });

        // Load saved model
        const savedModel = localStorage.getItem('default_model');
        if (savedModel) {
            document.getElementById(`${savedProvider}-model`).value = savedModel;
        }
    };

    loadSavedSettings();
    displayHistory();
});

// Notification system
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `${type}-notification notification`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
