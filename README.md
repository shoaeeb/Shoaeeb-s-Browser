# ShoaeebBrowser

A modern desktop browser built with Electron, featuring productivity tools and focus mode capabilities.

## 🚀 Features

### Core Browser Features
- **Multi-tab browsing** with intuitive tab management
- **Split-view mode** for side-by-side browsing
- **Navigation controls** (back, forward, reload, address bar)
- **Session persistence** - login sessions persist across tabs
- **Download manager** with pause/resume functionality

### Productivity Features
- **Focus Mode** with site blocking capabilities
- **Time-based blocking** - block specific sites during certain hours
- **Domain-specific rules** - block individual sites or all sites
- **Bookmark system** for saving favorite sites
- **History tracking** with easy access to visited pages

### User Experience
- **Global keyboard shortcuts** that work system-wide
- **Clean, minimal interface** focused on browsing
- **Help panel** with all keyboard shortcuts listed
- **Customizable blocking rules** with day-of-week selection

## 📸 Screenshots

*Add screenshots of your browser here*

## 🔧 Installation

### Option 1: Download Pre-built Executable
1. Go to [Releases](../../releases)
2. Download `ShoaeebBrowser Setup 1.0.0.exe`
3. Run the installer and follow the setup wizard

### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/yourusername/shoaeeb-browser.git
cd shoaeeb-browser

# Install dependencies
npm install

# Run in development mode
npm start

# Build executable
npm run build-win
```

## ⌨️ Keyboard Shortcuts

### Navigation
- `Ctrl + L` - Focus address bar
- `Ctrl + R` / `F5` - Reload page
- `Ctrl + F5` - Hard reload (ignore cache)
- `Alt + ←` / `Alt + →` - Back/Forward
- `Alt + Home` - Go to homepage

### Tab Management
- `Ctrl + T` - New tab
- `Ctrl + W` - Close current tab
- `Ctrl + Tab` - Next tab
- `Ctrl + Shift + Tab` - Previous tab
- `Ctrl + 1-9` - Switch to tab 1-9

### Features
- `Ctrl + D` - Bookmark current page
- `Ctrl + H` - Show history
- `Ctrl + Shift + O` - Show bookmarks
- `Ctrl + J` - Show downloads
- `Ctrl + Shift + S` - Toggle split view
- `F1` - Show help

## 🎯 Focus Mode

The focus mode helps you stay productive by blocking distracting websites:

### Manual Blocking
- Add domains to block list (e.g., `facebook.com`, `twitter.com`)
- Instantly blocks access to specified sites

### Time-based Blocking
- Block specific sites during certain hours
- Set different rules for different days of the week
- Example: Block social media from 9 AM to 5 PM on weekdays

### Usage Example
```
Domain: facebook.com
Time: 14:00 to 17:00
Days: Monday to Friday
```
This blocks Facebook from 2 PM to 5 PM on weekdays only.

## 🛠️ Development

### Prerequisites
- Node.js (v16 or higher)
- npm

### Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Run with dev tools
npm run dev
```

### Building
```bash
# Build for Windows
npm run build-win

# Build for all platforms
npm run build

# Build without publishing
npm run dist
```

### Project Structure
```
shoaeeb-browser/
├── main.js              # Main Electron process
├── renderer.js          # Renderer process (UI logic)
├── index.html           # Main UI
├── styles.css           # Styling
├── data/                # User data storage
│   ├── *.json.template  # Template files for new installations
│   └── *.json           # Actual user data (gitignored)
├── assets/              # Icons and resources
└── dist/                # Built executables (gitignored)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/)
- Packaged with [electron-builder](https://www.electron.build/)
- Icons from [your icon source]

## 📞 Support

If you encounter any issues or have questions:
- Open an [issue](../../issues)
- Check the [documentation](BUILD.md)
- Review the help panel in the browser (F1)

---

**Made with ❤️ by Shoaeeb**