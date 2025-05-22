// Renderer process script
document.addEventListener('DOMContentLoaded', async () => {
  // Check if electronAPI is available
  if (!window.electronAPI) {
    console.error('electronAPI not available');
    return;
  }

  // Update platform info
  const platformElement = document.getElementById('platform');
  const versionElement = document.getElementById('version');
  const themeElement = document.getElementById('theme');

  if (platformElement) {
    platformElement.textContent = window.electronAPI.platform;
  }

  // Get app version (you'll need to implement this in main process)
  try {
    const version = await window.electronAPI.getVersion?.() || 'Unknown';
    if (versionElement) {
      versionElement.textContent = version;
    }
  } catch (error) {
    console.log('Version API not implemented yet');
    if (versionElement) {
      versionElement.textContent = '1.0.0';
    }
  }

  // Update theme info
  const updateTheme = (isDark) => {
    if (themeElement) {
      themeElement.textContent = isDark ? 'Dark' : 'Light';
    }
  };

  // Initial theme detection
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  updateTheme(prefersDark);

  // Listen for theme changes from main process
  window.electronAPI.onThemeChanged?.(updateTheme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    updateTheme(e.matches);
  });

  // Button event handlers
  const openFileBtn = document.getElementById('openFile');
  const showPreferencesBtn = document.getElementById('showPreferences');

  if (openFileBtn) {
    openFileBtn.addEventListener('click', async () => {
      try {
        const result = await window.electronAPI.openFile?.();
        if (result) {
          console.log('File opened:', result);
          // Handle file opening result
        }
      } catch (error) {
        console.log('File dialog API not implemented yet');
        alert('File dialog functionality will be implemented in the main process');
      }
    });
  }

  if (showPreferencesBtn) {
    showPreferencesBtn.addEventListener('click', () => {
      // This would trigger the preferences window
      console.log('Preferences clicked');
      alert('Preferences window would open here');
    });
  }

  // Listen for preferences menu item
  window.electronAPI.onOpenPreferences?.(() => {
    console.log('Preferences opened from menu');
    alert('Preferences opened from menu');
  });

  // Listen for deep links
  window.electronAPI.onDeepLink?.((url) => {
    console.log('Deep link received:', url);
    alert(`Deep link received: ${url}`);
  });

  // Example of using the store
  try {
    // Save some example data
    await window.electronAPI.store?.set('lastOpened', new Date().toISOString());
    
    // Retrieve data
    const lastOpened = await window.electronAPI.store?.get('lastOpened');
    console.log('Last opened:', lastOpened);
  } catch (error) {
    console.log('Store API not fully implemented yet');
  }

  // Add some interactive features
  addInteractiveFeatures();
});

function addInteractiveFeatures() {
  // Add hover effects and animations
  const features = document.querySelectorAll('.feature');
  
  features.forEach(feature => {
    feature.addEventListener('mouseenter', () => {
      feature.style.transform = 'translateY(-4px) scale(1.02)';
    });
    
    feature.addEventListener('mouseleave', () => {
      feature.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Add keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Cmd/Ctrl + O for open file
    if ((event.metaKey || event.ctrlKey) && event.key === 'o') {
      event.preventDefault();
      document.getElementById('openFile')?.click();
    }
    
    // Cmd/Ctrl + , for preferences
    if ((event.metaKey || event.ctrlKey) && event.key === ',') {
      event.preventDefault();
      document.getElementById('showPreferences')?.click();
    }
  });

  // Add smooth scrolling
  document.documentElement.style.scrollBehavior = 'smooth';
}

// Handle window focus/blur for better UX
window.addEventListener('focus', () => {
  document.body.classList.add('window-focused');
});

window.addEventListener('blur', () => {
  document.body.classList.remove('window-focused');
});

// Log that renderer is ready
console.log('Electron macOS Template renderer loaded successfully');
console.log('Platform:', window.electronAPI?.platform);
console.log('Available APIs:', Object.keys(window.electronAPI || {})); 