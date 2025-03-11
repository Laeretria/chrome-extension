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

// Modified version that preserves icon visibility
document.addEventListener('DOMContentLoaded', function () {
  const minimizeButton = document.getElementById('minimizeButton')
  const appContainer = document.querySelector('.app-container')
  const sidebar = document.querySelector('.sidebar')
  const tabButtons = document.querySelectorAll('.tab-button')

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

  // Update the adjustSidebarHeight function to use opacity and visibility instead of display
  // for elements you want to transition smoothly

  function adjustSidebarHeight() {
    if (appContainer.classList.contains('minimized')) {
      // Force the sidebar height to match your hardcoded CSS value
      appContainer.style.height = '335px'
      sidebar.style.width = '50px'

      // Hide "Minimaliseer" text with opacity
      const minimizeText = minimizeButton.querySelector('.minimize-text')
      if (minimizeText) {
        minimizeText.style.opacity = '0'
        minimizeText.style.visibility = 'hidden'
      }

      // Hide the powered-by section with opacity
      const poweredBy = sidebar.querySelector('.powered-by')
      if (poweredBy) {
        poweredBy.style.opacity = '0'
        poweredBy.style.visibility = 'hidden'
        // After transition completes, set display none
        setTimeout(() => {
          if (appContainer.classList.contains('minimized')) {
            poweredBy.style.display = 'none'
          }
        }, 300)
      }

      // Ensure tab text is hidden with opacity
      const tabLabels = sidebar.querySelectorAll('.tab-button span')
      tabLabels.forEach((span) => {
        span.style.opacity = '0'
        span.style.visibility = 'hidden'
      })
    } else {
      // Reset styles when maximized
      appContainer.style.height = '550px'
      sidebar.style.height = '100%'
      sidebar.style.width = '200px'

      // Show the powered-by section
      const poweredBy = sidebar.querySelector('.powered-by')
      if (poweredBy) {
        poweredBy.style.display = 'flex'
        // Small delay to allow display:flex to take effect before transition
        setTimeout(() => {
          poweredBy.style.visibility = 'visible'
          poweredBy.style.opacity = '1'
        }, 10)
      }

      // Show tab text and minimize text with opacity
      const tabLabels = sidebar.querySelectorAll('.tab-button span')
      tabLabels.forEach((span) => {
        span.style.visibility = 'visible'
        span.style.opacity = '1'
      })

      // Show "Minimaliseer" text with opacity
      const minimizeText = minimizeButton.querySelector('.minimize-text')
      if (minimizeText) {
        minimizeText.style.visibility = 'visible'
        minimizeText.style.opacity = '1'
      }
    }
  }

  // Apply minimized state or maximized state
  function applyMinimizedState(isMinimized) {
    // Toggle minimized class
    if (isMinimized) {
      appContainer.classList.add('minimized')
    } else {
      appContainer.classList.remove('minimized')
    }

    // DO NOT modify the display of minimize-icon and maximize-icon here
    // Let your original CSS handle that

    // Add favicon
    addFaviconToHeader()

    // Apply correct height
    adjustSidebarHeight()
  }

  // Call when clicking the minimize button
  minimizeButton.addEventListener('click', function () {
    // Toggle the minimized state
    const newMinimizedState = !appContainer.classList.contains('minimized')

    // Update localStorage
    localStorage.setItem('kreatixSEOToolMinimized', newMinimizedState)

    // Apply the state
    applyMinimizedState(newMinimizedState)

    // Toggle icon visibility manually
    const minimizeIcon = minimizeButton.querySelector('.minimize-icon')
    const maximizeIcon = minimizeButton.querySelector('.maximize-icon')

    if (minimizeIcon && maximizeIcon) {
      if (newMinimizedState) {
        minimizeIcon.style.display = 'none'
        maximizeIcon.style.display = 'block'
      } else {
        minimizeIcon.style.display = 'block'
        maximizeIcon.style.display = 'none'
      }
    }
  })

  // Add click events to all tab buttons to maximize when minimized
  tabButtons.forEach((tabButton) => {
    tabButton.addEventListener('click', function (e) {
      // If sidebar is minimized, expand it when clicking any tab
      if (appContainer.classList.contains('minimized')) {
        // Update localStorage
        localStorage.setItem('kreatixSEOToolMinimized', false)

        // Apply maximized state
        applyMinimizedState(false)

        // Toggle icon visibility manually
        const minimizeIcon = minimizeButton.querySelector('.minimize-icon')
        const maximizeIcon = minimizeButton.querySelector('.maximize-icon')

        if (minimizeIcon && maximizeIcon) {
          minimizeIcon.style.display = 'block'
          maximizeIcon.style.display = 'none'
        }
      }
    })
  })

  // Initialize state on page load
  // This needs to happen before any other initialization
  const isMinimized = localStorage.getItem('kreatixSEOToolMinimized') === 'true'
  if (isMinimized) {
    // Apply minimized state immediately
    applyMinimizedState(true)

    // Toggle icon visibility manually
    const minimizeIcon = minimizeButton.querySelector('.minimize-icon')
    const maximizeIcon = minimizeButton.querySelector('.maximize-icon')

    if (minimizeIcon && maximizeIcon) {
      minimizeIcon.style.display = 'none'
      maximizeIcon.style.display = 'block'
    }

    // Also apply after a short delay to ensure everything is applied correctly
    setTimeout(() => {
      applyMinimizedState(true)
    }, 100)
  }

  // Also adjust on window resize
  window.addEventListener('resize', function () {
    if (appContainer.classList.contains('minimized')) {
      adjustSidebarHeight()
    }
  })
})
