<p>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.vantige.ai/vantige-logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://www.vantige.ai/vantige-logo.png">
    <img src="https://www.vantige.ai/vantige-logo.png" alt="Vantige AI Logo" width="200" />
  </picture>
</p>

# Vantige AI Documentation

Welcome to the official documentation site for [Vantige AI](https://vantige.ai), hosted at [docs.vantige.ai](https://docs.vantige.ai).

This documentation site is built using [Docusaurus](https://docusaurus.io/) and serves as the central hub for all Vantige AI technical documentation, API references, and integration guides.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- Yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/vantige-ai/docs.git
cd docs

# Install dependencies
yarn
```

### Local Development

```bash
# Start the development server
yarn start
```

This command starts a local development server at `http://localhost:3000`. Most changes are reflected live without having to restart the server.

### Build

```bash
# Create production build
yarn build
```

This command generates static content into the `build` directory that can be served using any static content hosting service.

### Type Checking

```bash
# Run TypeScript type checking
yarn typecheck
```

## 📝 Contributing

We welcome contributions to improve our documentation! Here's how you can help:

### Contribution Guidelines

1. **Fork the repository** and create your branch from `master`
2. **Make your changes** following our documentation standards
3. **Test locally** to ensure your changes render correctly
4. **Submit a pull request** with a clear description of your changes

### Documentation Standards

- Use clear, concise language
- Include code examples where applicable
- Follow the existing file structure and naming conventions
- Add appropriate metadata to new documentation pages
- Ensure all links are working

### Types of Contributions

- **Fix typos and grammatical errors**
- **Improve existing documentation** for clarity
- **Add missing documentation** for features
- **Create examples and tutorials**
- **Translate documentation** (coming soon)

### Reporting Issues

Found a problem with the documentation? Please [open an issue](https://github.com/vantige-ai/docs/issues) with:
- Clear description of the issue
- Link to the affected documentation page
- Suggested improvement (if applicable)

## 🏗️ Project Structure

```
docs/
├── docs/                  # Documentation markdown files
│   ├── api/              # API reference documentation
│   ├── examples/         # Code examples and tutorials
│   └── *.md             # Main documentation pages
├── src/                  # React components and pages
│   ├── components/      # Reusable React components
│   ├── css/            # Custom styles
│   └── pages/          # Custom pages
├── static/              # Static assets
│   ├── img/            # Images and logos
│   └── fonts/          # Custom fonts
├── docusaurus.config.ts # Docusaurus configuration
└── sidebars.ts         # Sidebar navigation structure
```

## 🚢 Deployment

The documentation is automatically deployed to [docs.vantige.ai](https://docs.vantige.ai) when changes are merged to the `main` branch.

### Manual Deployment (for maintainers)

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Using HTTPS:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

## 📄 License

This documentation is open source and available under the [MIT License](LICENSE).

## 🤝 Support

- **Documentation Issues**: [GitHub Issues](https://github.com/vantige-ai/docs/issues)
- **Product Support**: [support@vantige.ai](mailto:support@vantige.ai)
- **Community**: [Join our Discord](https://discord.gg/vantige-ai)

## 🔗 Useful Links

- [Vantige AI Platform](https://vantige.ai)
- [API Documentation](https://docs.vantige.ai/docs/api/client)
- [TypeScript SDK](https://github.com/vantige-ai/typescript-sdk)
- [npm Package](https://www.npmjs.com/package/@vantige-ai/typescript-sdk)

---

Built with ❤️ by the Vantige AI team
