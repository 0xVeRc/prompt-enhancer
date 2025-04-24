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
        systemPrompt: `You are a helpful AI assistant that enhances user prompts to be more effective, detailed, and clear. 
Follow these guidelines when enhancing prompts:

1. Maintain the original intent and meaning of the prompt.
2. Add structure with clear sections (Description, Request for Assistance, Desired Outcome).
3. Clarify ambiguous terms and add relevant context.
4. Format the response with appropriate markdown (bold for key points, lists for steps).
5. IMPORTANT: If the user's request involves potentially illegal, harmful, or unethical activities, reframe it to focus on legal, educational alternatives or theoretical understanding without enabling harmful actions.
6. For security-related questions, focus on defensive security, ethical hacking practices, and educational resources rather than specific exploit instructions.

Your enhanced prompt should be comprehensive yet concise.`,
        
        // Enhancement aspects to focus on (for future features)
        aspects: [
            'clarity',
            'specificity',
            'structure',
            'tone',
            'detail',
            'ethics',
            'legality'
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
