// ValidationService for Prompt Enhancer
// Handles all validation logic for inputs and configurations

export class ValidationService {
    constructor(config) {
        this.config = config || window.config;
        this.errors = new Map();
        
        // Validation constants
        this.LIMITS = {
            PROMPT: {
                MIN_LENGTH: 3,
                MAX_LENGTH: 2000
            },
            API_KEY: {
                MIN_LENGTH: 20,
                OPENAI_PREFIX: 'sk-',
                ANTHROPIC_PREFIX: 'sk_ant_'
            },
            URL: {
                MAX_LENGTH: 2083, // Maximum URL length for most browsers
                REQUIRED_PROTOCOL: /^https?:\/\//
            }
        };
    }

    /**
     * Validates a prompt string
     * @param {string} prompt - The prompt to validate
     * @returns {object} - Validation result {isValid: boolean, errors: string[]}
     */
    validatePrompt(prompt) {
        const errors = [];
        
        if (!prompt) {
            errors.push('Prompt is required');
            return { isValid: false, errors };
        }
        
        if (prompt.length < this.LIMITS.PROMPT.MIN_LENGTH) {
            errors.push(`Prompt must be at least ${this.LIMITS.PROMPT.MIN_LENGTH} characters long`);
        }
        
        if (prompt.length > this.LIMITS.PROMPT.MAX_LENGTH) {
            errors.push(`Prompt must not exceed ${this.LIMITS.PROMPT.MAX_LENGTH} characters`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validates an API key based on the provider
     * @param {string} apiKey - The API key to validate
     * @param {string} provider - The API provider (openai, anthropic, custom)
     * @returns {object} - Validation result {isValid: boolean, errors: string[]}
     */
    validateApiKey(apiKey, provider) {
        const errors = [];
        
        if (!apiKey && provider !== 'custom') {
            errors.push('API key is required');
            return { isValid: false, errors };
        }
        
        if (apiKey.length < this.LIMITS.API_KEY.MIN_LENGTH && provider !== 'custom') {
            errors.push(`API key must be at least ${this.LIMITS.API_KEY.MIN_LENGTH} characters long`);
        }
        
        switch (provider) {
            case 'openai':
                if (!apiKey.startsWith(this.LIMITS.API_KEY.OPENAI_PREFIX)) {
                    errors.push('Invalid OpenAI API key format. Should start with "sk-"');
                }
                break;
                
            case 'anthropic':
                if (!apiKey.startsWith(this.LIMITS.API_KEY.ANTHROPIC_PREFIX)) {
                    errors.push('Invalid Anthropic API key format. Should start with "sk_ant_"');
                }
                break;
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validates a URL string (for custom API endpoints)
     * @param {string} url - The URL to validate
     * @returns {object} - Validation result {isValid: boolean, errors: string[]}
     */
    validateUrl(url) {
        const errors = [];
        
        if (!url) {
            errors.push('URL is required');
            return { isValid: false, errors };
        }
        
        if (url.length > this.LIMITS.URL.MAX_LENGTH) {
            errors.push(`URL is too long (max ${this.LIMITS.URL.MAX_LENGTH} characters)`);
        }
        
        if (!this.LIMITS.URL.REQUIRED_PROTOCOL.test(url)) {
            errors.push('URL must start with http:// or https://');
        }
        
        try {
            new URL(url);
        } catch (e) {
            errors.push('Invalid URL format');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validates the complete configuration
     * @param {object} config - The configuration object to validate
     * @returns {object} - Validation result {isValid: boolean, errors: object}
     */
    validateConfig(config) {
        const errors = {};
        
        // Validate provider
        if (!['openai', 'anthropic', 'custom'].includes(config.api.provider)) {
            errors.provider = ['Invalid API provider'];
        }
        
        // Validate API key
        const apiKeyValidation = this.validateApiKey(
            config.api.provider === 'openai' ? localStorage.getItem('openai_api_key') :
            config.api.provider === 'anthropic' ? localStorage.getItem('anthropic_api_key') :
            localStorage.getItem('custom_api_key'),
            config.api.provider
        );
        
        if (!apiKeyValidation.isValid) {
            errors.apiKey = apiKeyValidation.errors;
        }
        
        // Validate custom URL if needed
        if (config.api.provider === 'custom') {
            const urlValidation = this.validateUrl(localStorage.getItem('custom_api_url'));
            if (!urlValidation.isValid) {
                errors.customUrl = urlValidation.errors;
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * Clear all validation errors
     */
    clearErrors() {
        this.errors.clear();
    }
}
