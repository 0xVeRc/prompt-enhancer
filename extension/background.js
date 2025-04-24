// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    // Initialize storage with default values
    chrome.storage.local.get(['prompt_history', 'default_provider', 'default_model'], (result) => {
        if (!result.prompt_history) {
            chrome.storage.local.set({ prompt_history: [] });
        }
        if (!result.default_provider) {
            chrome.storage.local.set({ default_provider: 'openai' });
        }
        if (!result.default_model) {
            chrome.storage.local.set({ default_model: 'gpt-3.5-turbo' });
        }
    });
});
