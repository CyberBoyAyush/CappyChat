# AVChat Changelog

This document contains the version history and changelog for AVChat. For a more detailed and interactive view, visit the [Changelog Page](./frontend/routes/ChangelogPage.tsx) in the application.

## Version Management

AVChat uses semantic versioning (SemVer) for version management:

- **Major version (X.0.0)**: Breaking changes or major feature releases
- **Minor version (X.Y.0)**: New features, backwards compatible
- **Patch version (X.Y.Z)**: Bug fixes, small improvements

## Current Version: 3.3.0

### Version 3.3.0 - August 31, 2025

**Major Updates:**
- 🌟 **Gemini 2.5 Flash Lite Default**: Updated default model across the entire application for improved performance
- 🌐 **Domain Migration**: Migrated to avchat.xyz for better branding and accessibility
- 💳 **Subscription Enhancement**: Improved subscription management with better billing date handling
- 👤 **Guest User Updates**: Enhanced guest user restrictions with new default model

### Version 3.2.0 - August 13, 2025

**New Features:**
- 🔍 **Reddit Search Integration**: Comprehensive Reddit search with dedicated UI and citations
- 🎛️ **Enhanced Search Selector**: Improved search type selection between Web, Reddit, and Chat modes
- 🎨 **UI Component Enhancements**: Enhanced ModelSelector and other components with improved styling
- 🎤 **Voice Input Updates**: Updated voice input icons for better user clarity

### Version 3.1.0 - July 4, 2025

**New Features:**
- 🔍 **Tavily API Integration**: Enhanced web search capabilities with Tavily API
- 🔑 **BYOK Tavily Support**: Bring Your Own Key support for Tavily API
- 🏷️ **Automated Versioning**: Implemented automated version management and changelog generation
- 📚 **Enhanced Citations**: Improved web search citations with better UI components
- 🔓 **Model Flexibility**: Removed model restrictions for web search functionality

### Version 3.0.0 - July 1, 2025

**Major Features:**
- 🖼️ **Image-to-Image Generation**: Revolutionary AI-powered image transformation capabilities
- 📐 **Aspect Ratio Selection**: Comprehensive aspect ratio support for image generation
- 🗑️ **Bulk Image Management**: Advanced bulk operations for image management
- ⚡ **Enhanced Loading Experience**: Improved user feedback and loading states

### Version 2.2.0 - June 30, 2025

**New Features:**
- ⚡ **Gemini 2.0 Flash Model**: Latest Google AI model integration
- 🏃 **Fast Model Indicators**: Visual performance indicators
- 👑 **Juggernaut Pro Model**: Professional-grade image generation
- 👥 **Bulk User Operations**: Administrative management tools

**Improvements:**
- 🔧 Model name updates and optimizations
- 🛡️ Enhanced tier limits for premium users

### Version 2.1.0 - June 29, 2025

**New Features:**
- 📚 **Comprehensive Documentation**: Detailed project documentation
- 📋 **Collapsible Web Sources**: Better citation organization
- 📄 **Thread Pagination**: Enhanced thread management

**Improvements:**
- 🖼️ Enhanced image generation handling
- 👥 Updated team information

### Version 2.0.0 - June 28, 2025

**Major Features:**
- ℹ️ **About Page**: Comprehensive project information
- 🖥️ **Session Management**: Advanced session control system
- 📁 **File Management**: Enhanced file handling capabilities
- ⚙️ **Settings Enhancement**: Improved settings interface

### Version 1.2.0 - June 26, 2025

**New Features:**
- 🧠 **Global Memory System**: Revolutionary memory management
- 🌳 **Improved LLM Display**: Better structured outputs

### Version 1.1.0 - June 18, 2025

**New Features:**
- 🔄 **Real-time Sync**: Enhanced synchronization capabilities
- 🚪 **Bulk User Logout**: Administrative user management
- 💀 **Loading Skeletons**: Improved loading states
- 📤 **File Upload Enhancement**: Better error handling
- 🖥️ **Model Selection UI**: Enhanced interface
- 👤 **Guest User Updates**: Improved restrictions

## Development Scripts

### Changelog Management

```bash
# Analyze recent commits for changelog updates
pnpm update-changelog

# Create a git tag for the current version
pnpm tag-version
```

### Version Configuration

The changelog is managed through the `lib/version.ts` file, which contains:

- Current version information
- Detailed changelog entries
- Feature categorization (new, improvement, fix, security)
- Icon and color mappings for UI display

### Adding New Versions

1. Update `lib/version.ts` with new changelog entry
2. Update `package.json` version number
3. Run `pnpm tag-version` to create git tag
4. The changelog page will automatically reflect the changes

## Contributing to Changelog

When adding new features or fixes:

1. Use conventional commit messages (feat:, fix:, docs:, etc.)
2. Include descriptive commit messages
3. Update the changelog for major releases
4. Follow the established categorization system

## Changelog Categories

- **🆕 New**: Brand new features and capabilities
- **⚡ Improvement**: Enhancements to existing features
- **🐛 Fix**: Bug fixes and corrections
- **🔒 Security**: Security-related updates

Each entry includes:
- Feature title and description
- Appropriate icon and color coding
- Release date and version number
- Categorization for easy filtering
