// API Service for Prompt Enhancer
// Handles different API providers and configurations

import { ValidationService } from './validation-service.js';
import config from './config.js';

export class ApiService {
    constructor(customConfig) {
        this.config = customConfig || config;
        this.provider = this.config.api.provider;
        this.model = this.config.api.model;
        this.validationService = new ValidationService(this.config);
        this.retryAttempts = 3;
        this.retryDelay = 1000; // ms

        // Load API keys from localStorage
        this.apiKeys = {
            openai: localStorage.getItem('openai_api_key'),
            anthropic: localStorage.getItem('anthropic_api_key'),
            custom: localStorage.getItem('custom_api_key')
        };
    }

    /**
     * Update configuration settings
     * @param {Object} newConfig - New configuration settings
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.provider = newConfig.provider || this.provider;
        
        if (newConfig[this.provider]) {
            this.model = newConfig[this.provider].model || this.model;
            if (newConfig[this.provider].apiKey) {
                this.apiKeys[this.provider] = newConfig[this.provider].apiKey;
            }
        }
    }

    /**
     * Enhance a prompt using the configured API provider
     * @param {string} prompt - The original prompt to enhance
     * @param {string} systemPrompt - Optional custom system prompt to override default
     * @returns {Promise<string>} - The enhanced prompt
     */
    async enhancePrompt(prompt, systemPrompt) {
        // Validate prompt
        const validation = this.validationService.validatePrompt(prompt);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Get current API key
        const apiKey = this.apiKeys[this.provider];
        if (!apiKey) {
            throw new Error(`${this.provider.toUpperCase()} API key is required. Please add it in the settings.`);
        }

        // Use provided system prompt or default from config
        const finalSystemPrompt = systemPrompt || this.config.enhancement.systemPrompt;

        let attempt = 0;
        while (attempt < this.retryAttempts) {
            try {
                switch (this.provider) {
                    case 'openai':
                        return await this.callOpenAI(prompt, apiKey, finalSystemPrompt);
                    case 'anthropic':
                        return await this.callAnthropic(prompt, apiKey, finalSystemPrompt);
                    case 'custom':
                        return await this.callCustomAPI(prompt, apiKey, finalSystemPrompt);
                    default:
                        throw new Error('Unsupported API provider');
                }
            } catch (error) {
                attempt++;
                if (attempt === this.retryAttempts) {
                    throw this.enhanceError(error);
                }
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    /**
     * Enhance a prompt using OpenAI's API
     * @param {string} prompt - The original prompt to enhance
     * @param {string} apiKey - The OpenAI API key
     * @param {string} systemPrompt - The system prompt to use
     * @returns {Promise<string>} - The enhanced prompt
     */
    async callOpenAI(prompt, apiKey, systemPrompt) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: `Please enhance this prompt: ${prompt}`
                        }
                    ],
                    temperature: this.config.api.temperature
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'OpenAI API request failed');
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            throw this.enhanceError(error);
        }
    }

    /**
     * Enhance a prompt using Anthropic's API (Claude)
     * @param {string} prompt - The original prompt to enhance
     * @param {string} apiKey - The Anthropic API key
     * @param {string} systemPrompt - The system prompt to use
     * @returns {Promise<string>} - The enhanced prompt
     */
    async callAnthropic(prompt, apiKey, systemPrompt) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    system: systemPrompt,
                    messages: [
                        {
                            role: "user",
                            content: `Please enhance this prompt: ${prompt}`
                        }
                    ],
                    max_tokens: this.config.api.maxTokens
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Anthropic API request failed');
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            throw this.enhanceError(error);
        }
    }

    /**
     * Enhance a prompt using a custom API endpoint
     * @param {string} prompt - The original prompt to enhance
     * @param {string} apiKey - The custom API key
     * @param {string} systemPrompt - The system prompt to use
     * @returns {Promise<string>} - The enhanced prompt
     */
    async callCustomAPI(prompt, apiKey, systemPrompt) {
        const apiUrl = localStorage.getItem('custom_api_url');
        if (!apiUrl) {
            throw new Error('Custom API URL is required');
        }

        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt,
                    system: systemPrompt,
                    max_tokens: this.config.api.maxTokens,
                    temperature: this.config.api.temperature
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Custom API request failed');
            }

            const data = await response.json();
            return data.result || data.text || data.content || data.output;
        } catch (error) {
            throw this.enhanceError(error);
        }
    }

    /**
     * Enhance error messages for better user feedback
     * @param {Error} error - The original error
     * @returns {Error} - The enhanced error
     */
    enhanceError(error) {
        // Enhance error messages for better user feedback
        const errorMap = {
            'Failed to fetch': 'Network error. Please check your internet connection.',
            '401': 'Invalid API key. Please check your settings.',
            '403': 'Access denied. Please verify your API key and permissions.',
            '429': 'Rate limit exceeded. Please try again later.',
            '500': 'Server error. Please try again later.',
        };

        const message = error.message || 'Unknown error occurred';
        
        // Check if the message contains any of our mapped errors
        for (const [key, value] of Object.entries(errorMap)) {
            if (message.includes(key)) {
                return new Error(value);
            }
        }
        
        return error;
    }
}
