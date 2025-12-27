const { ipcRenderer } = require('electron');

class BrowserApp {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.splitMode = false;
        this.splitTabs = []; // Array of tab IDs in split view
        
        this.urlInput = document.getElementById('url-input');
        this.backBtn = document.getElementById('back-btn');
        this.forwardBtn = document.getElementById('forward-btn');
        this.reloadBtn = document.getElementById('reload-btn');
        this.goBtn = document.getElementById('go-btn');
        this.focusBtn = document.getElementById('focus-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.splitBtn = document.getElementById('split-btn');
        this.bookmarkBtn = document.getElementById('bookmark-btn');
        this.downloadsBtn = document.getElementById('downloads-btn');
        this.historyBtn = document.getElementById('history-btn');
        this.bookmarksBtn = document.getElementById('bookmarks-btn');
        this.helpBtn = document.getElementById('help-btn');
        this.newTabBtn = document.getElementById('new-tab-btn');
        
        this.tabsContainer = document.getElementById('tabs-container');
        this.webviewsContainer = document.getElementById('webviews-container');
        this.focusPanel = document.getElementById('focus-panel');
        this.downloadsPanel = document.getElementById('downloads-panel');
        this.historyPanel = document.getElementById('history-panel');
        this.bookmarksPanel = document.getElementById('bookmarks-panel');
        this.helpPanel = document.getElementById('help-panel');
        this.downloadsList = document.getElementById('downloads-list');
        this.historyList = document.getElementById('history-list');
        this.bookmarksList = document.getElementById('bookmarks-list');
        this.helpContent = document.getElementById('help-content');
        
        this.initializeEventListeners();
        this.initializeKeyboardShortcuts();
        this.initializeGlobalShortcuts();
        this.createNewTab('https://www.google.com', 'New Tab');
    }

    initializeEventListeners() {
        // Navigation controls
        this.backBtn.addEventListener('click', () => this.goBack());
        this.forwardBtn.addEventListener('click', () => this.goForward());
        this.reloadBtn.addEventListener('click', () => this.reload());
        this.goBtn.addEventListener('click', () => this.navigateToUrl());
        this.newTabBtn.addEventListener('click', () => this.createNewTab());
        this.splitBtn.addEventListener('click', () => this.toggleSplitView());
        
        // URL input
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigateToUrl();
            }
        });
        
        // Action buttons
        this.bookmarkBtn.addEventListener('click', () => this.addBookmark());
        this.focusBtn.addEventListener('click', () => this.toggleFocusPanel());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.downloadsBtn.addEventListener('click', () => this.toggleDownloadsPanel());
        this.historyBtn.addEventListener('click', () => this.toggleHistoryPanel());
        this.bookmarksBtn.addEventListener('click', () => this.toggleBookmarksPanel());
        this.helpBtn.addEventListener('click', () => this.toggleHelpPanel());
        
        // Panel close buttons
        document.getElementById('close-focus').addEventListener('click', () => {
            this.focusPanel.classList.add('hidden');
        });
        
        document.getElementById('close-downloads').addEventListener('click', () => {
            this.downloadsPanel.classList.add('hidden');
        });
        
        document.getElementById('close-history').addEventListener('click', () => {
            this.historyPanel.classList.add('hidden');
        });
        
        document.getElementById('close-bookmarks').addEventListener('click', () => {
            this.bookmarksPanel.classList.add('hidden');
        });
        
        document.getElementById('close-help').addEventListener('click', () => {
            this.helpPanel.classList.add('hidden');
        });
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when typing in input fields (except address bar shortcuts)
            const isInputFocused = document.activeElement.tagName === 'INPUT' || 
                                 document.activeElement.tagName === 'TEXTAREA' ||
                                 document.activeElement.isContentEditable;
            
            // Address bar shortcuts (work even when input is focused)
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this.focusAddressBar();
                return;
            }
            
            // Skip other shortcuts if input is focused
            if (isInputFocused && document.activeElement !== this.urlInput) {
                return;
            }
            
            // Navigation shortcuts
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.reload();
            } else if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goBack();
            } else if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                this.goForward();
            }
            // Tab management shortcuts
            else if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.createNewTab();
            } else if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                this.closeCurrentTab();
            } else if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.switchToPreviousTab();
                } else {
                    this.switchToNextTab();
                }
            }
            // Bookmark shortcuts
            else if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.addBookmark();
            } else if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                this.toggleHistoryPanel();
            } else if (e.ctrlKey && e.shiftKey && e.key === 'O') {
                e.preventDefault();
                this.toggleBookmarksPanel();
            } else if (e.key === 'F1') {
                e.preventDefault();
                this.toggleHelpPanel();
            }
            // Split view shortcut
            else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.toggleSplitView();
            }
            // Number key tab switching (Ctrl + 1-9)
            else if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const tabIndex = parseInt(e.key) - 1;
                if (tabIndex < this.tabs.length) {
                    this.switchToTab(this.tabs[tabIndex].id);
                }
            }
            // Home shortcut
            else if (e.altKey && e.key === 'Home') {
                e.preventDefault();
                this.goHome();
            }
            // Refresh shortcuts (F5 and Ctrl+F5)
            else if (e.key === 'F5') {
                e.preventDefault();
                if (e.ctrlKey) {
                    this.hardReload();
                } else {
                    this.reload();
                }
            }
            // Fullscreen shortcut (F11)
            else if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
    }

    initializeGlobalShortcuts() {
        // Listen for global shortcuts from main process
        ipcRenderer.on('shortcut-focus-address-bar', () => this.focusAddressBar());
        ipcRenderer.on('shortcut-reload', () => this.reload());
        ipcRenderer.on('shortcut-hard-reload', () => this.hardReload());
        ipcRenderer.on('shortcut-go-back', () => this.goBack());
        ipcRenderer.on('shortcut-go-forward', () => this.goForward());
        ipcRenderer.on('shortcut-go-home', () => this.goHome());
        ipcRenderer.on('shortcut-new-tab', () => this.createNewTab());
        ipcRenderer.on('shortcut-close-tab', () => this.closeCurrentTab());
        ipcRenderer.on('shortcut-next-tab', () => this.switchToNextTab());
        ipcRenderer.on('shortcut-previous-tab', () => this.switchToPreviousTab());
        ipcRenderer.on('shortcut-bookmark', () => this.addBookmark());
        ipcRenderer.on('shortcut-downloads', () => this.toggleDownloadsPanel());
        ipcRenderer.on('shortcut-history', () => this.toggleHistoryPanel());
        ipcRenderer.on('shortcut-bookmarks', () => this.toggleBookmarksPanel());
        ipcRenderer.on('shortcut-split-view', () => this.toggleSplitView());
        ipcRenderer.on('shortcut-help', () => this.toggleHelpPanel());
        ipcRenderer.on('shortcut-switch-tab', (event, tabIndex) => {
            if (tabIndex < this.tabs.length) {
                this.switchToTab(this.tabs[tabIndex].id);
            }
        });
        
        // Fullscreen event listeners
        ipcRenderer.on('fullscreen-changed', (event, isFullScreen) => {
            this.updateFullscreenButton(isFullScreen);
        });
        
        // Download event listeners
        ipcRenderer.on('download-started', (event, downloadData) => {
            this.onDownloadStarted(downloadData);
        });
        
        ipcRenderer.on('download-progress', (event, downloadData) => {
            this.onDownloadProgress(downloadData);
        });
        
        ipcRenderer.on('download-completed', (event, downloadData) => {
            this.onDownloadCompleted(downloadData);
        });
    }

    createNewTab(url = 'https://www.google.com', title = 'New Tab') {
        const tabId = this.nextTabId++;
        
        // Create tab element
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tabId;
        tabElement.innerHTML = `
            <span class="tab-title">${this.escapeHtml(title)}</span>
            <button class="tab-close">×</button>
        `;
        
        // Create webview wrapper
        const webviewWrapper = document.createElement('div');
        webviewWrapper.className = 'webview-wrapper';
        webviewWrapper.dataset.tabId = tabId;
        
        // Create webview
        const webview = document.createElement('webview');
        webview.src = url;
        webview.style.width = '100%';
        webview.style.height = '100%';
        webview.setAttribute('webpreferences', 'contextIsolation=false,webSecurity=false');
        webview.setAttribute('partition', 'persist:main');
        
        webviewWrapper.appendChild(webview);
        
        // Create tab object
        const tab = {
            id: tabId,
            url: url,
            title: title,
            element: tabElement,
            webview: webview,
            wrapper: webviewWrapper,
            canGoBack: false,
            canGoForward: false
        };
        
        // Add event listeners
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                if (this.splitMode && e.ctrlKey) {
                    // Ctrl+click in split mode adds/removes tab from split view
                    this.toggleTabInSplit(tabId);
                } else {
                    this.switchToTab(tabId);
                }
            }
        });
        
        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tabId);
        });
        
        this.setupWebviewEvents(tab);
        
        // Add to DOM
        this.tabsContainer.appendChild(tabElement);
        this.webviewsContainer.appendChild(webviewWrapper);
        
        // Add to tabs array
        this.tabs.push(tab);
        
        // Switch to new tab
        this.switchToTab(tabId);
        
        return tab;
    }

    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;
        
        const tab = this.tabs[tabIndex];
        
        // Remove from split tabs if present
        const splitIndex = this.splitTabs.indexOf(tabId);
        if (splitIndex !== -1) {
            this.splitTabs.splice(splitIndex, 1);
        }
        
        // Remove from DOM
        tab.element.remove();
        tab.wrapper.remove();
        
        // Remove from array
        this.tabs.splice(tabIndex, 1);
        
        // If this was the active tab, switch to another
        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                // Switch to the tab before the closed one, or the first tab
                const newActiveIndex = Math.max(0, tabIndex - 1);
                this.switchToTab(this.tabs[newActiveIndex].id);
            } else {
                // No tabs left, create a new one
                this.createNewTab();
            }
        }
        
        // Update split view if in split mode
        if (this.splitMode) {
            // If we have less than 2 tabs in split, try to add another
            if (this.splitTabs.length < 2 && this.tabs.length > 1) {
                const availableTab = this.tabs.find(t => !this.splitTabs.includes(t.id));
                if (availableTab) {
                    this.splitTabs.push(availableTab.id);
                }
            }
            
            // If only one tab left, exit split mode
            if (this.tabs.length <= 1) {
                this.toggleSplitView();
            } else {
                this.updateSplitView();
            }
        }
    }

    switchToTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        // Update active tab
        this.activeTabId = tabId;
        
        if (this.splitMode) {
            // In split mode, manage split tabs
            if (!this.splitTabs.includes(tabId)) {
                if (this.splitTabs.length >= 2) {
                    // Replace the first split tab
                    this.splitTabs[0] = tabId;
                } else {
                    this.splitTabs.push(tabId);
                }
            }
            this.updateSplitView();
        } else {
            // Normal single tab mode
            this.tabs.forEach(t => {
                t.element.classList.toggle('active', t.id === tabId);
                t.wrapper.classList.toggle('active', t.id === tabId);
            });
        }
        
        // Update URL input and navigation buttons
        this.urlInput.value = tab.url;
        this.updateNavigationButtons();
    }

    toggleSplitView() {
        this.splitMode = !this.splitMode;
        
        if (this.splitMode) {
            // Enable split view
            this.webviewsContainer.classList.add('split-view');
            this.splitBtn.style.backgroundColor = '#007acc';
            this.splitBtn.style.color = 'white';
            
            // Initialize split with current active tab and create a new one if needed
            this.splitTabs = [this.activeTabId];
            if (this.tabs.length > 1) {
                // Add the next available tab
                const otherTab = this.tabs.find(t => t.id !== this.activeTabId);
                if (otherTab) {
                    this.splitTabs.push(otherTab.id);
                }
            } else {
                // Create a new tab for split view
                const newTab = this.createNewTab();
                this.splitTabs.push(newTab.id);
            }
            
            this.updateSplitView();
        } else {
            // Disable split view
            this.webviewsContainer.classList.remove('split-view');
            this.splitBtn.style.backgroundColor = '';
            this.splitBtn.style.color = '';
            this.splitTabs = [];
            
            // Return to normal single tab view
            this.tabs.forEach(t => {
                t.element.classList.remove('split-active');
                t.wrapper.classList.remove('split-active');
                t.element.classList.toggle('active', t.id === this.activeTabId);
                t.wrapper.classList.toggle('active', t.id === this.activeTabId);
            });
        }
    }

    toggleTabInSplit(tabId) {
        if (!this.splitMode) return;
        
        const index = this.splitTabs.indexOf(tabId);
        if (index !== -1) {
            // Remove from split
            this.splitTabs.splice(index, 1);
        } else {
            // Add to split (max 2 tabs)
            if (this.splitTabs.length >= 2) {
                // Replace the last tab
                this.splitTabs[1] = tabId;
            } else {
                this.splitTabs.push(tabId);
            }
        }
        
        this.updateSplitView();
    }

    updateSplitView() {
        if (!this.splitMode) return;
        
        // Update all tabs
        this.tabs.forEach(tab => {
            const isInSplit = this.splitTabs.includes(tab.id);
            const isActive = tab.id === this.activeTabId;
            
            tab.element.classList.toggle('active', isActive && !this.splitMode);
            tab.element.classList.toggle('split-active', isInSplit);
            tab.wrapper.classList.toggle('active', isActive && !this.splitMode);
            tab.wrapper.classList.toggle('split-active', isInSplit);
        });
    }

    getActiveTab() {
        return this.tabs.find(tab => tab.id === this.activeTabId);
    }

    setupWebviewEvents(tab) {
        const webview = tab.webview;
        
        webview.addEventListener('dom-ready', () => {
            console.log(`Tab ${tab.id} DOM ready`);
            this.updateNavigationButtons();
        });

        webview.addEventListener('did-start-loading', () => {
            console.log(`Tab ${tab.id} started loading`);
        });

        webview.addEventListener('did-stop-loading', () => {
            console.log(`Tab ${tab.id} stopped loading`);
        });

        webview.addEventListener('did-fail-load', (e) => {
            console.error(`Tab ${tab.id} failed to load:`, e);
        });

        webview.addEventListener('will-navigate', async (e) => {
            const isBlocked = await this.checkSiteBlocking(e.url);
            if (isBlocked) {
                e.preventDefault();
                this.showBlockedPage(webview, e.url);
            }
        });

        webview.addEventListener('did-navigate', (e) => {
            console.log(`Tab ${tab.id} navigated to:`, e.url);
            tab.url = e.url;
            if (tab.id === this.activeTabId) {
                this.urlInput.value = e.url;
            }
            this.updateNavigationButtons();
        });

        webview.addEventListener('did-navigate-in-page', (e) => {
            tab.url = e.url;
            if (tab.id === this.activeTabId) {
                this.urlInput.value = e.url;
            }
            this.updateNavigationButtons();
        });

        webview.addEventListener('page-title-updated', (e) => {
            tab.title = e.title;
            tab.element.querySelector('.tab-title').textContent = e.title;
            this.saveToHistory(tab);
        });

        webview.addEventListener('did-finish-load', () => {
            console.log(`Tab ${tab.id} finished loading`);
            this.updateNavigationButtons();
        });
    }

    async navigateToUrl() {
        const activeTab = this.getActiveTab();
        if (!activeTab) return;
        
        let url = this.urlInput.value.trim();
        
        if (!url) return;
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // Check if it looks like a domain
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                // Treat as search query
                url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
            }
        }
        
        // Check if site is blocked
        const isBlocked = await this.checkSiteBlocking(url);
        if (isBlocked) {
            this.showBlockedPage(activeTab.webview, url);
            return;
        }
        
        activeTab.webview.src = url;
        activeTab.url = url;
    }

    goBack() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.webview.canGoBack()) {
            activeTab.webview.goBack();
        }
    }

    goForward() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.webview.canGoForward()) {
            activeTab.webview.goForward();
        }
    }

    reload() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            activeTab.webview.reload();
        }
    }

    updateNavigationButtons() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            this.backBtn.disabled = !activeTab.webview.canGoBack();
            this.forwardBtn.disabled = !activeTab.webview.canGoForward();
        } else {
            this.backBtn.disabled = true;
            this.forwardBtn.disabled = true;
        }
    }

    async saveToHistory(tab) {
        if (!tab.url || tab.url === 'about:blank') return;
        
        const historyEntry = {
            url: tab.url,
            title: tab.title || tab.url,
            timestamp: new Date().toISOString()
        };
        
        await ipcRenderer.invoke('save-history', historyEntry);
    }

    async addBookmark() {
        const activeTab = this.getActiveTab();
        if (!activeTab || !activeTab.url || activeTab.url === 'about:blank') return;
        
        const bookmark = {
            url: activeTab.url,
            title: activeTab.title || activeTab.url,
            timestamp: new Date().toISOString()
        };
        
        const success = await ipcRenderer.invoke('save-bookmark', bookmark);
        
        if (success) {
            // Visual feedback
            this.bookmarkBtn.style.color = '#007acc';
            setTimeout(() => {
                this.bookmarkBtn.style.color = '';
            }, 1000);
        }
    }

    async toggleHistoryPanel() {
        const isHidden = this.historyPanel.classList.contains('hidden');
        
        // Close other panels if open
        this.focusPanel.classList.add('hidden');
        this.downloadsPanel.classList.add('hidden');
        this.bookmarksPanel.classList.add('hidden');
        this.helpPanel.classList.add('hidden');
        
        if (isHidden) {
            await this.loadHistory();
            this.historyPanel.classList.remove('hidden');
        } else {
            this.historyPanel.classList.add('hidden');
        }
    }

    async toggleBookmarksPanel() {
        const isHidden = this.bookmarksPanel.classList.contains('hidden');
        
        // Close other panels if open
        this.focusPanel.classList.add('hidden');
        this.downloadsPanel.classList.add('hidden');
        this.historyPanel.classList.add('hidden');
        this.helpPanel.classList.add('hidden');
        
        if (isHidden) {
            await this.loadBookmarks();
            this.bookmarksPanel.classList.remove('hidden');
        } else {
            this.bookmarksPanel.classList.add('hidden');
        }
    }

    toggleHelpPanel() {
        const isHidden = this.helpPanel.classList.contains('hidden');
        
        // Close other panels if open
        this.focusPanel.classList.add('hidden');
        this.downloadsPanel.classList.add('hidden');
        this.historyPanel.classList.add('hidden');
        this.bookmarksPanel.classList.add('hidden');
        
        if (isHidden) {
            this.loadHelpContent();
            this.helpPanel.classList.remove('hidden');
        } else {
            this.helpPanel.classList.add('hidden');
        }
    }

    async toggleFocusPanel() {
        const isHidden = this.focusPanel.classList.contains('hidden');
        
        // Close other panels if open
        this.downloadsPanel.classList.add('hidden');
        this.historyPanel.classList.add('hidden');
        this.bookmarksPanel.classList.add('hidden');
        this.helpPanel.classList.add('hidden');
        
        if (isHidden) {
            await this.loadFocusSettings();
            this.setupFocusEventListeners();
            this.focusPanel.classList.remove('hidden');
        } else {
            this.focusPanel.classList.add('hidden');
        }
    }

    async loadFocusSettings() {
        const settings = await ipcRenderer.invoke('get-blocked-sites');
        
        // Update enabled toggle
        document.getElementById('focus-enabled').checked = settings.enabled;
        
        // Load blocked domains
        this.renderBlockedDomains(settings.blockedDomains);
        
        // Load time rules
        this.renderTimeRules(settings.timeRules);
    }

    setupFocusEventListeners() {
        // Enable/disable toggle
        document.getElementById('focus-enabled').addEventListener('change', (e) => {
            this.updateFocusEnabled(e.target.checked);
        });
        
        // Add domain button
        document.getElementById('add-domain-btn').addEventListener('click', () => {
            this.addBlockedDomain();
        });
        
        // Add domain on Enter key
        document.getElementById('domain-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addBlockedDomain();
            }
        });
        
        // Add time rule button
        document.getElementById('add-time-rule-btn').addEventListener('click', () => {
            this.addTimeRule();
        });
    }

    renderBlockedDomains(domains) {
        const container = document.getElementById('blocked-domains-list');
        
        if (domains.length === 0) {
            container.innerHTML = '<div class="empty-state">No blocked domains</div>';
            return;
        }
        
        container.innerHTML = domains.map((domain, index) => `
            <div class="blocked-item">
                <span class="blocked-item-text">${this.escapeHtml(domain)}</span>
                <button class="remove-btn" data-action="remove-domain" data-index="${index}">×</button>
            </div>
        `).join('');
        
        // Set up event listeners for remove buttons
        this.setupBlockedDomainsListeners();
    }

    renderTimeRules(rules) {
        const container = document.getElementById('time-rules-list');
        
        if (rules.length === 0) {
            container.innerHTML = '<div class="empty-state">No time rules</div>';
            return;
        }
        
        container.innerHTML = rules.map((rule, index) => {
            const daysText = this.formatDays(rule.days);
            const statusText = rule.enabled ? 'Active' : 'Inactive';
            const domainText = rule.domain ? rule.domain : 'All sites';
            
            return `
                <div class="blocked-item">
                    <span class="blocked-item-text">
                        <strong>${domainText}</strong>: ${rule.startTime} - ${rule.endTime} (${daysText}) - ${statusText}
                    </span>
                    <button class="remove-btn" data-action="remove-rule" data-index="${index}">×</button>
                </div>
            `;
        }).join('');
        
        // Set up event listeners for remove buttons
        this.setupTimeRulesListeners();
    }

    setupBlockedDomainsListeners() {
        const container = document.getElementById('blocked-domains-list');
        
        // Remove existing listener to prevent duplicates
        if (this.domainsClickHandler) {
            container.removeEventListener('click', this.domainsClickHandler);
        }
        
        // Create bound handler
        this.domainsClickHandler = (e) => {
            if (e.target.classList.contains('remove-btn') && e.target.dataset.action === 'remove-domain') {
                const index = parseInt(e.target.dataset.index);
                this.removeBlockedDomain(index);
            }
        };
        
        // Add event listener with delegation
        container.addEventListener('click', this.domainsClickHandler);
    }

    setupTimeRulesListeners() {
        const container = document.getElementById('time-rules-list');
        
        // Remove existing listener to prevent duplicates
        if (this.rulesClickHandler) {
            container.removeEventListener('click', this.rulesClickHandler);
        }
        
        // Create bound handler
        this.rulesClickHandler = (e) => {
            if (e.target.classList.contains('remove-btn') && e.target.dataset.action === 'remove-rule') {
                const index = parseInt(e.target.dataset.index);
                this.removeTimeRule(index);
            }
        };
        
        // Add event listener with delegation
        container.addEventListener('click', this.rulesClickHandler);
    }

    formatDays(days) {
        if (!days || days.length === 0) return 'All days';
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map(day => dayNames[day]).join(', ');
    }

    async addBlockedDomain() {
        const input = document.getElementById('domain-input');
        const domain = input.value.trim().toLowerCase();
        
        if (!domain) return;
        
        // Remove protocol if present
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
        
        const settings = await ipcRenderer.invoke('get-blocked-sites');
        
        if (!settings.blockedDomains.includes(cleanDomain)) {
            settings.blockedDomains.push(cleanDomain);
            await ipcRenderer.invoke('save-blocked-sites', settings);
            this.renderBlockedDomains(settings.blockedDomains);
        }
        
        input.value = '';
    }

    async removeBlockedDomain(index) {
        console.log('Removing blocked domain at index:', index);
        const settings = await ipcRenderer.invoke('get-blocked-sites');
        console.log('Current domains:', settings.blockedDomains);
        
        if (index >= 0 && index < settings.blockedDomains.length) {
            settings.blockedDomains.splice(index, 1);
            await ipcRenderer.invoke('save-blocked-sites', settings);
            this.renderBlockedDomains(settings.blockedDomains);
            console.log('Domain removed, new list:', settings.blockedDomains);
        } else {
            console.error('Invalid index for domain removal:', index);
        }
    }

    async addTimeRule() {
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const domainInput = document.getElementById('time-rule-domain');
        const domain = domainInput.value.trim();
        const dayCheckboxes = document.querySelectorAll('.days-checkboxes input[type="checkbox"]:checked');
        
        if (!startTime || !endTime) return;
        
        const selectedDays = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
        
        // Clean domain (remove protocol and www if present)
        const cleanDomain = domain ? domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase() : '';
        
        const rule = {
            startTime,
            endTime,
            days: selectedDays,
            domain: cleanDomain,
            enabled: true
        };
        
        const settings = await ipcRenderer.invoke('get-blocked-sites');
        settings.timeRules.push(rule);
        await ipcRenderer.invoke('save-blocked-sites', settings);
        this.renderTimeRules(settings.timeRules);
        
        // Clear the domain input field after adding the rule
        domainInput.value = '';
    }

    async removeTimeRule(index) {
        console.log('Removing time rule at index:', index);
        const settings = await ipcRenderer.invoke('get-blocked-sites');
        console.log('Current rules:', settings.timeRules);
        
        if (index >= 0 && index < settings.timeRules.length) {
            settings.timeRules.splice(index, 1);
            await ipcRenderer.invoke('save-blocked-sites', settings);
            this.renderTimeRules(settings.timeRules);
            console.log('Rule removed, new list:', settings.timeRules);
        } else {
            console.error('Invalid index for rule removal:', index);
        }
    }

    async updateFocusEnabled(enabled) {
        const settings = await ipcRenderer.invoke('get-blocked-sites');
        settings.enabled = enabled;
        await ipcRenderer.invoke('save-blocked-sites', settings);
    }

    async checkSiteBlocking(url) {
        const isBlocked = await ipcRenderer.invoke('is-site-blocked', url);
        return isBlocked;
    }

    showBlockedPage(webview, url) {
        const domain = new URL(url).hostname;
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        const blockedHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Site Blocked - ShoaeebBrowser</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-align: center;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                    }
                    h1 {
                        font-size: 3em;
                        margin-bottom: 20px;
                        opacity: 0.9;
                    }
                    p {
                        font-size: 1.2em;
                        margin-bottom: 30px;
                        opacity: 0.8;
                        max-width: 500px;
                    }
                    .domain {
                        font-weight: bold;
                        color: #ffd700;
                    }
                    .time-info {
                        font-size: 1em;
                        opacity: 0.7;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <h1>🎯 Focus Mode Active</h1>
                <p>Access to <span class="domain">${domain}</span> is currently blocked to help you stay focused.</p>
                <div class="time-info">Blocked at ${timeString}</div>
            </body>
            </html>
        `;
        
        webview.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(blockedHTML)}`);
    }

    async toggleDownloadsPanel() {
        const isHidden = this.downloadsPanel.classList.contains('hidden');
        
        // Close other panels if open
        this.focusPanel.classList.add('hidden');
        this.historyPanel.classList.add('hidden');
        this.bookmarksPanel.classList.add('hidden');
        this.helpPanel.classList.add('hidden');
        
        if (isHidden) {
            await this.loadDownloads();
            this.downloadsPanel.classList.remove('hidden');
        } else {
            this.downloadsPanel.classList.add('hidden');
        }
    }

    async loadHistory() {
        const history = await ipcRenderer.invoke('get-history');
        this.renderHistoryList(history);
    }

    async loadBookmarks() {
        const bookmarks = await ipcRenderer.invoke('get-bookmarks');
        this.renderBookmarksList(bookmarks);
    }

    loadHelpContent() {
        const shortcuts = [
            {
                category: 'Navigation',
                items: [
                    { description: 'Focus address bar', keys: 'Ctrl + L' },
                    { description: 'Reload page', keys: 'Ctrl + R' },
                    { description: 'Reload page', keys: 'F5' },
                    { description: 'Hard reload (ignore cache)', keys: 'Ctrl + F5' },
                    { description: 'Go back', keys: 'Alt + ←' },
                    { description: 'Go forward', keys: 'Alt + →' },
                    { description: 'Go to homepage', keys: 'Alt + Home' }
                ]
            },
            {
                category: 'Tab Management',
                items: [
                    { description: 'New tab', keys: 'Ctrl + T' },
                    { description: 'Close current tab', keys: 'Ctrl + W' },
                    { description: 'Next tab', keys: 'Ctrl + Tab' },
                    { description: 'Previous tab', keys: 'Ctrl + Shift + Tab' },
                    { description: 'Switch to tab 1-9', keys: 'Ctrl + 1-9' }
                ]
            },
            {
                category: 'Bookmarks & History',
                items: [
                    { description: 'Bookmark current page', keys: 'Ctrl + D' },
                    { description: 'Show focus mode', keys: 'Click 🎯 button' },
                    { description: 'Show downloads', keys: 'Ctrl + J' },
                    { description: 'Show history', keys: 'Ctrl + H' },
                    { description: 'Show bookmarks', keys: 'Ctrl + Shift + O' }
                ]
            },
            {
                category: 'Split View',
                items: [
                    { description: 'Toggle split view', keys: 'Ctrl + Shift + S' },
                    { description: 'Add tab to split (in split mode)', keys: 'Ctrl + Click Tab' }
                ]
            },
            {
                category: 'View',
                items: [
                    { description: 'Toggle fullscreen', keys: 'F11' },
                    { description: 'Exit fullscreen', keys: 'Escape' }
                ]
            },
            {
                category: 'Help',
                items: [
                    { description: 'Show this help', keys: 'F1' }
                ]
            }
        ];

        this.renderHelpContent(shortcuts);
    }

    async loadDownloads() {
        const downloads = await ipcRenderer.invoke('get-downloads');
        this.renderDownloadsList(downloads);
    }

    onDownloadStarted(downloadData) {
        // Refresh downloads panel if it's open
        if (!this.downloadsPanel.classList.contains('hidden')) {
            this.loadDownloads();
        }
    }

    onDownloadProgress(downloadData) {
        // Update progress bar if downloads panel is open
        if (!this.downloadsPanel.classList.contains('hidden')) {
            this.updateDownloadProgress(downloadData);
        }
    }

    onDownloadCompleted(downloadData) {
        // Refresh downloads panel if it's open
        if (!this.downloadsPanel.classList.contains('hidden')) {
            this.loadDownloads();
        }
    }

    updateDownloadProgress(downloadData) {
        const downloadElement = document.querySelector(`[data-download-id="${downloadData.id}"]`);
        if (downloadElement) {
            const progressFill = downloadElement.querySelector('.progress-fill');
            const progressInfo = downloadElement.querySelector('.download-info');
            const stateElement = downloadElement.querySelector('.download-state');
            
            if (progressFill) {
                progressFill.style.width = `${downloadData.progress}%`;
                progressFill.className = `progress-fill ${downloadData.state}`;
            }
            
            if (progressInfo) {
                const sizeText = this.formatFileSize(downloadData.receivedBytes, downloadData.totalBytes);
                progressInfo.textContent = `${downloadData.progress}% - ${sizeText}`;
            }
            
            if (stateElement) {
                stateElement.textContent = downloadData.state;
                stateElement.className = `download-state ${downloadData.state}`;
            }
        }
    }

    renderHistoryList(history) {
        if (history.length === 0) {
            this.historyList.innerHTML = '<div class="empty-state">No history yet</div>';
            return;
        }

        this.historyList.innerHTML = history.map(item => `
            <div class="history-item" onclick="browserApp.navigateToHistoryItem('${item.url}')">
                <div class="item-title">${this.escapeHtml(item.title)}</div>
                <div class="item-url">${this.escapeHtml(item.url)}</div>
                <div class="item-time">${this.formatTime(item.timestamp)}</div>
            </div>
        `).join('');
    }

    renderBookmarksList(bookmarks) {
        if (bookmarks.length === 0) {
            this.bookmarksList.innerHTML = '<div class="empty-state">No bookmarks yet</div>';
            return;
        }

        this.bookmarksList.innerHTML = bookmarks.map(item => `
            <div class="bookmark-item" onclick="browserApp.navigateToBookmark('${item.url}')">
                <div class="item-title">${this.escapeHtml(item.title)}</div>
                <div class="item-url">${this.escapeHtml(item.url)}</div>
            </div>
        `).join('');
    }

    renderHelpContent(shortcuts) {
        const helpHtml = shortcuts.map(section => `
            <div class="help-section">
                <h4>${section.category}</h4>
                ${section.items.map(item => `
                    <div class="shortcut-item">
                        <span class="shortcut-description">${item.description}</span>
                        <span class="shortcut-keys">${item.keys}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');

        const noteHtml = `
            <div class="help-note">
                <strong>Tips:</strong><br>
                • Most shortcuts work globally except when typing in input fields<br>
                • In split view, Ctrl+click any tab to add/remove it from the split<br>
                • Use Ctrl+L to quickly focus and select the address bar text<br>
                • F1 opens this help panel from anywhere in the browser
            </div>
        `;

        this.helpContent.innerHTML = helpHtml + noteHtml;
    }

    renderDownloadsList(downloads) {
        if (downloads.length === 0) {
            this.downloadsList.innerHTML = '<div class="empty-state">No downloads yet</div>';
            return;
        }

        this.downloadsList.innerHTML = downloads.map(download => {
            const sizeText = this.formatFileSize(download.receivedBytes, download.totalBytes);
            const isActive = download.state === 'progressing' && !download.isPaused;
            const isCompleted = download.state === 'completed';
            const isPaused = download.state === 'paused' || download.isPaused;
            const isFailed = download.state === 'interrupted' || download.state === 'cancelled';

            return `
                <div class="download-item" data-download-id="${download.id}">
                    <div class="download-header">
                        <div class="download-filename" title="${this.escapeHtml(download.filename)}">
                            ${this.escapeHtml(download.filename)}
                        </div>
                        <div class="download-size">${sizeText}</div>
                    </div>
                    
                    <div class="download-progress">
                        <div class="progress-bar">
                            <div class="progress-fill ${download.state}" style="width: ${download.progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="download-status">
                        <div class="download-info">
                            <span class="download-state ${download.state}">${download.state}</span>
                            ${download.progress}% - ${sizeText}
                        </div>
                        
                        <div class="download-controls">
                            ${isActive ? `
                                <button class="download-btn" data-action="pause" data-download-id="${download.id}">Pause</button>
                                <button class="download-btn" data-action="cancel" data-download-id="${download.id}">Cancel</button>
                            ` : ''}
                            
                            ${isPaused ? `
                                <button class="download-btn" data-action="resume" data-download-id="${download.id}">Resume</button>
                                <button class="download-btn" data-action="cancel" data-download-id="${download.id}">Cancel</button>
                            ` : ''}
                            
                            ${isCompleted ? `
                                <button class="download-btn" data-action="show-folder" data-file-path="${this.escapeHtml(download.savePath)}">Show in Folder</button>
                            ` : ''}
                            
                            ${isFailed ? `
                                <button class="download-btn" data-action="retry" data-download-url="${this.escapeHtml(download.url)}">Retry</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for download buttons
        this.setupDownloadButtonListeners();
    }

    setupDownloadButtonListeners() {
        // Remove existing listeners to prevent duplicates
        this.downloadsList.removeEventListener('click', this.downloadButtonHandler);
        
        // Create bound handler
        this.downloadButtonHandler = (e) => {
            if (e.target.classList.contains('download-btn')) {
                const action = e.target.dataset.action;
                const downloadId = e.target.dataset.downloadId;
                const filePath = e.target.dataset.filePath;
                const downloadUrl = e.target.dataset.downloadUrl;

                switch (action) {
                    case 'pause':
                        this.pauseDownload(downloadId);
                        break;
                    case 'resume':
                        this.resumeDownload(downloadId);
                        break;
                    case 'cancel':
                        this.cancelDownload(downloadId);
                        break;
                    case 'show-folder':
                        this.openDownloadLocation(filePath);
                        break;
                    case 'retry':
                        this.retryDownload(downloadUrl);
                        break;
                }
            }
        };

        // Add event listener with delegation
        this.downloadsList.addEventListener('click', this.downloadButtonHandler);
    }

    async pauseDownload(downloadId) {
        console.log('Pausing download:', downloadId);
        const result = await ipcRenderer.invoke('pause-download', downloadId);
        console.log('Pause result:', result);
        this.loadDownloads();
    }

    async resumeDownload(downloadId) {
        console.log('Resuming download:', downloadId);
        const result = await ipcRenderer.invoke('resume-download', downloadId);
        console.log('Resume result:', result);
        this.loadDownloads();
    }

    async cancelDownload(downloadId) {
        console.log('Cancelling download:', downloadId);
        const result = await ipcRenderer.invoke('cancel-download', downloadId);
        console.log('Cancel result:', result);
        this.loadDownloads();
    }

    async openDownloadLocation(filePath) {
        console.log('Opening download location:', filePath);
        const result = await ipcRenderer.invoke('open-download-location', filePath);
        console.log('Open location result:', result);
    }

    retryDownload(url) {
        // Navigate to the URL to trigger download again
        const activeTab = this.getActiveTab();
        if (activeTab) {
            activeTab.webview.src = url;
        }
    }

    formatFileSize(received, total) {
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        };

        if (total > 0) {
            return `${formatBytes(received)} / ${formatBytes(total)}`;
        } else {
            return formatBytes(received);
        }
    }

    navigateToHistoryItem(url) {
        this.urlInput.value = url;
        this.navigateToUrl();
        this.historyPanel.classList.add('hidden');
    }

    navigateToBookmark(url) {
        this.urlInput.value = url;
        this.navigateToUrl();
        this.bookmarksPanel.classList.add('hidden');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    // Keyboard shortcut helper methods
    focusAddressBar() {
        this.urlInput.focus();
        this.urlInput.select();
    }

    closeCurrentTab() {
        if (this.activeTabId) {
            this.closeTab(this.activeTabId);
        }
    }

    switchToNextTab() {
        if (this.tabs.length <= 1) return;
        
        const currentIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        this.switchToTab(this.tabs[nextIndex].id);
    }

    switchToPreviousTab() {
        if (this.tabs.length <= 1) return;
        
        const currentIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
        const prevIndex = currentIndex === 0 ? this.tabs.length - 1 : currentIndex - 1;
        this.switchToTab(this.tabs[prevIndex].id);
    }

    goHome() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            activeTab.webview.src = 'https://www.google.com';
            activeTab.url = 'https://www.google.com';
            this.urlInput.value = 'https://www.google.com';
        }
    }

    hardReload() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            activeTab.webview.reloadIgnoringCache();
        }
    }

    async toggleFullscreen() {
        try {
            const isFullScreen = await ipcRenderer.invoke('toggle-fullscreen');
            this.updateFullscreenButton(isFullScreen);
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    }

    updateFullscreenButton(isFullScreen) {
        if (isFullScreen) {
            this.fullscreenBtn.textContent = '⛶';
            this.fullscreenBtn.title = 'Exit Fullscreen (F11 or Esc)';
            this.fullscreenBtn.style.backgroundColor = '#007acc';
            this.fullscreenBtn.style.color = 'white';
        } else {
            this.fullscreenBtn.textContent = '⛶';
            this.fullscreenBtn.title = 'Fullscreen (F11)';
            this.fullscreenBtn.style.backgroundColor = '';
            this.fullscreenBtn.style.color = '';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.browserApp = new BrowserApp();
});