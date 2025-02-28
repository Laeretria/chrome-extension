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
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
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

    document.getElementById('loading').classList.add('hidden')

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
    document.getElementById('loading').textContent =
      'Error loading data. Please refresh the page and try again.'
  }
}
