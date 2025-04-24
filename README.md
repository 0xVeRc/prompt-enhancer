# Prompt Enhancer

A modern tool that helps you enhance your prompts for better AI interactions. Available as both a web application and a browser extension.

**🌐 [Live Demo](https://prompt-enhancer-liart.vercel.app/)** - Try it now without installation!

## Features

- **Clean, Minimalist Interface**: A distraction-free environment focused on your prompt
- **One-Click Enhancement**: Transform basic prompts into detailed, effective instructions
- **Multiple AI Providers**: Support for OpenAI (GPT models), Anthropic (Claude models), and custom API endpoints
- **Modern Design**: Sleek glassmorphism UI with a beautiful gradient background
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Browser Extension**: Enhance your prompts directly within your browser
- **No Account Required**: Start enhancing prompts immediately without sign-up
- **Secure**: API keys are stored locally in your browser and never sent to our servers

## Installation

### Web Application

1. Clone the repository:
   ```bash
   git clone https://github.com/0xVeRc/prompt-enhancer.git
   cd prompt-enhancer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Browser Extension

1. Clone the repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` folder from the cloned repository

## Usage

1. Open the web app or the browser extension
2. Enter your API key in the settings (click the gear icon)
3. Type or paste your prompt in the input area
4. Click "Enhance"
5. Copy the enhanced prompt for use with your favorite AI tool

## Configuration

The application supports three API providers:

- **OpenAI**: Requires an OpenAI API key (https://platform.openai.com/)
- **Anthropic**: Requires an Anthropic API key (https://console.anthropic.com/)
- **Custom API**: For use with other API providers or local models

## Development

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Building the Extension

The extension files are already in the `extension/` directory. After making changes, reload the extension in your browser.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Inspired by the need for better AI prompts
- Thanks to all contributors and users
