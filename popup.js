// popup.js - Main entry point
import { updateSchemaUI, exportSchemaData } from './js/schema-tab.js'
import { updateOverviewUI } from './js/overview-tab.js'
import { updateHeadingsUI } from './js/headings-tab.js'
import { updateLinksUI } from './js/links-tab.js'
import { updateImagesUI } from './js/images-tab.js'
import { setupTooltips } from './js/tooltips.js'
import { setupFooterLinks } from './js/footer-utils.js'
import { getCleanDomainName, initCurrentDomain } from './js/domain-utils.js'
import { updateSocialUI } from './js/social-tab.js'
import { initScrollToTopButton } from './js/scroll-to-top.js'

// Make currentWebsiteDomain available globally
let currentWebsiteDomain = ''
window.currentWebsiteDomain = ''

// Initialize the extension
document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Initialize current domain
    currentWebsiteDomain = await initCurrentDomain()
    window.currentWebsiteDomain = currentWebsiteDomain

    // Setup tab navigation
    setupTabNavigation()

    initScrollToTopButton()

    // Setup footer links
    await setupInitialFooterLinks()

    // Add logo click handler
    setupLogoClickHandler()

    // Start with overview tab
    loadTabData('overview')
  } catch (error) {
    console.error('Error during initialization:', error)
  }
})

// Setup tab navigation
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab-button')
  const appContainer = document.querySelector('.app-container')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // First, maximize the sidebar if it's minimized
      if (appContainer.classList.contains('minimized')) {
        appContainer.classList.remove('minimized')

        // Update localStorage to reflect the maximized state
        localStorage.setItem('kreatixSEOToolMinimized', 'false')

        // Update icon visibility
        const minimizeIcon = document.querySelector('.minimize-icon')
        const maximizeIcon = document.querySelector('.maximize-icon')
        if (minimizeIcon && maximizeIcon) {
          minimizeIcon.style.display = 'block'
          maximizeIcon.style.display = 'none'
        }
      }

      // Then continue with regular tab switching logic
      tabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')

      document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.remove('active')
      })

      const tabId = `${tab.dataset.tab}-tab`
      document.getElementById(tabId).classList.add('active')

      loadTabData(tab.dataset.tab)
    })
  })
}

// Setup initial footer links
async function setupInitialFooterLinks() {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })

    if (tabs && tabs[0] && tabs[0].url) {
      const url = new URL(tabs[0].url)
      const currentDomain = url.origin
      await setupFooterLinks(currentDomain)
    }
  } catch (error) {
    console.error('Error setting up footer links:', error)
  }
}

// Setup logo click handler
function setupLogoClickHandler() {
  const logoLink = document.getElementById('logo-link')
  if (logoLink) {
    logoLink.addEventListener(
      'click',
      function logoClickHandler(e) {
        e.preventDefault()
        chrome.tabs.create({ url: 'https://kreatix.be' })
        logoLink.removeEventListener('click', logoClickHandler)
      },
      { once: true }
    )
  }
}

// Ensure content script is injected
async function ensureContentScriptInjected(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js'],
    })
  } catch (err) {
    console.error('Error injecting content script:', err)
  }
}

// Main function to load tab data
async function loadTabData(tabName) {
  try {
    console.log(`Loading data for tab: ${tabName}`)
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]

    if (!currentTab) {
      throw new Error('No active tab found')
    }

    await ensureContentScriptInjected(currentTab.id)
    await new Promise((resolve) => setTimeout(resolve, 200))

    let action
    switch (tabName) {
      case 'overview':
        action = 'getOverview'
        break
      case 'images':
        action = 'getImages'
        break
      case 'links':
        action = 'getLinks'
        break
      case 'headings':
        action = 'getHeadings'
        const url = new URL(currentTab.url)
        await setupFooterLinks(`${url.protocol}//${url.hostname}`)
        break
      case 'schema':
        action = 'getSchema'
        break
      case 'social':
        action = 'getSocial'
        break
      default:
        action = 'getOverview'
    }

    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTab.id, { action: action }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error in sendMessage:', chrome.runtime.lastError)
          reject(chrome.runtime.lastError)
        } else {
          console.log(`Received response for ${action}:`, response)
          resolve(response)
        }
      })
    })

    switch (tabName) {
      case 'overview':
        if (response && response.overview) {
          updateOverviewUI(response.overview)
          setTimeout(setupTooltips, 300)
        }
        break
      case 'images':
        if (response && response.images) {
          updateImagesUI(response)
        }
        break
      case 'links':
        if (response) {
          updateLinksUI(response)
        }
        break
      case 'headings':
        if (response) {
          updateHeadingsUI(response)
        }
        break
      case 'schema':
        if (response) {
          updateSchemaUI(response)
        }
        break
      case 'social':
        if (response) {
          updateSocialUI(response)
        }
        break
    }
  } catch (error) {
    console.error('Error loading tab data:', error)
  }
}

// Add this to your JS file
document.addEventListener('DOMContentLoaded', function () {
  const minimizeButton = document.getElementById('minimizeButton')
  const appContainer = document.querySelector('.app-container')
  const sidebar = document.querySelector('.sidebar')

  // Function to add favicon
  function addFaviconToHeader() {
    const header = sidebar.querySelector('.sidebar-header')
    if (header) {
      // Check if favicon already exists
      let favicon = header.querySelector('.minimized-favicon')

      if (!favicon) {
        // Create favicon element if it doesn't exist
        favicon = document.createElement('img')
        favicon.src = 'assets/logo/kreatix-favicon.jpg'
        favicon.alt = 'Kreatix'
        favicon.className = 'minimized-favicon'
        header.appendChild(favicon)
      }

      // Toggle visibility based on minimized state
      favicon.style.display = appContainer.classList.contains('minimized')
        ? 'block'
        : 'none'

      // Hide title when minimized
      const title = header.querySelector('.sidebar-title')
      if (title) {
        title.style.display = appContainer.classList.contains('minimized')
          ? 'none'
          : 'block'
      }
    }
  }

  // Function to adjust sidebar height
  function adjustSidebarHeight() {
    if (appContainer.classList.contains('minimized')) {
      // Get just the tabs and header elements
      const header = sidebar.querySelector('.sidebar-header')
      const tabs = sidebar.querySelector('.tabs')
      const minButton = sidebar.querySelector('.minimize-button')

      // Calculate exact height needed (sum of visible elements + small padding)
      let totalHeight =
        (header ? header.offsetHeight : 0) +
        (tabs ? tabs.offsetHeight : 0) +
        (minButton ? minButton.offsetHeight : 0) +
        20 // Extra padding

      // Set the exact height
      sidebar.style.height = totalHeight + 'px'

      // Make sure the minimize button is visible
      if (minButton) {
        minButton.style.display = 'flex'
        const maximizeIcon = minButton.querySelector('.maximize-icon')
        if (maximizeIcon) {
          maximizeIcon.style.display = 'block'
        }
      }

      // Hide the powered-by section
      const poweredBy = sidebar.querySelector('.powered-by')
      if (poweredBy) {
        poweredBy.style.display = 'none'
      }
    } else {
      // Reset height when maximized
      sidebar.style.height = '100%'

      // Show the powered-by section
      const poweredBy = sidebar.querySelector('.powered-by')
      if (poweredBy) {
        poweredBy.style.display = 'flex'
      }
    }
  }

  // Call when clicking the minimize button
  minimizeButton.addEventListener('click', function () {
    // Toggle the minimized class
    appContainer.classList.toggle('minimized')

    // Update localStorage
    const currentlyMinimized = appContainer.classList.contains('minimized')
    localStorage.setItem('kreatixSEOToolMinimized', currentlyMinimized)

    // Toggle icon visibility
    const minimizeIcon = document.querySelector('.minimize-icon')
    const maximizeIcon = document.querySelector('.maximize-icon')
    if (minimizeIcon && maximizeIcon) {
      if (currentlyMinimized) {
        minimizeIcon.style.display = 'none'
        maximizeIcon.style.display = 'block'
      } else {
        minimizeIcon.style.display = 'block'
        maximizeIcon.style.display = 'none'
      }
    }

    // Wait a moment for DOM updates, then adjust height

    // Add favicon to header when minimized
    addFaviconToHeader()
    setTimeout(adjustSidebarHeight, 50)
  })

  // Also apply on initial load
  const isMinimized = localStorage.getItem('kreatixSEOToolMinimized') === 'true'
  if (isMinimized) {
    appContainer.classList.add('minimized')
    const minimizeIcon = document.querySelector('.minimize-icon')
    const maximizeIcon = document.querySelector('.maximize-icon')
    if (minimizeIcon && maximizeIcon) {
      minimizeIcon.style.display = 'none'
      maximizeIcon.style.display = 'block'
    }

    // Adjust height after a short delay to ensure DOM is ready
    setTimeout(adjustSidebarHeight, 100)
  }

  // Also adjust on window resize
  window.addEventListener('resize', function () {
    if (appContainer.classList.contains('minimized')) {
      adjustSidebarHeight()
    }
  })
})
