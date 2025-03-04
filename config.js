// Prompt Enhancer Configuration
// You can modify these settings to customize the application

// Load environment variables
const loadEnvVariables = () => {
    const envVars = {
        OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
        ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY
    };

    // Save API keys to localStorage if they exist in env
    if (envVars.OPENAI_API_KEY && !localStorage.getItem('openai_api_key')) {
        localStorage.setItem('openai_api_key', envVars.OPENAI_API_KEY);
    }
    if (envVars.ANTHROPIC_API_KEY && !localStorage.getItem('anthropic_api_key')) {
        localStorage.setItem('anthropic_api_key', envVars.ANTHROPIC_API_KEY);
    }
};

// Try to load environment variables
try {
    loadEnvVariables();
} catch (error) {
    console.warn('Failed to load environment variables:', error);
}

const config = {
    // API Settings
    api: {
        provider: localStorage.getItem('default_provider') || 'openai', // 'openai', 'anthropic', 'custom'
        model: localStorage.getItem('default_model') || 'gpt-3.5-turbo', // 'gpt-4', 'gpt-3.5-turbo', 'claude-2', etc.
        temperature: 0.7, // 0-1, lower is more deterministic
        maxTokens: 1000,
        mockMode: false, // Set to true to use mock API calls
    },
    
    // Enhancement Settings
    enhancement: {
        // System prompt to guide the enhancement process
        systemPrompt: `You are a prompt enhancement expert. Your task is to improve the given prompt by making it more specific, detailed, and effective while maintaining its original intent.

Please consider:
1. Adding specific details for context
2. Improving structure and organization
3. Clarifying expected output format
4. Adding appropriate parameters
5. Refining language for better AI understanding
6. Including tone guidance when relevant`,
        
        // Enhancement aspects to focus on (for future features)
        aspects: [
            'clarity',
            'specificity',
            'structure',
            'tone',
            'detail'
        ]
    },
    
    // Security Settings
    security: {
        enableEncryption: true,
        storagePrefix: 'prompt_enhancer_'
    },
    
    // Rate Limiting Settings
    rateLimiting: {
        maxRequestsPerMinute: 60,
        retryAttempts: 3,
        retryDelay: 1000
    }
};

// Export for ES modules
export default config;

// Also make it available globally
window.config = config;
