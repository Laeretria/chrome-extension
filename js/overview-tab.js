// Import the setupFooterLinks function from footer-utils.js
import { setupFooterLinks } from './footer-utils.js'
import { tooltipData } from './tooltips.js'
import { createCustomTooltip, setupCustomTooltips } from './custom-tooltips.js'

export async function updateOverviewUI(overview) {
  // SEO recommendation constants
  const SEO_LIMITS = {
    title: {
      min: 30,
      recommended: 50,
      max: 60,
    },
    description: {
      min: 120,
      recommended: 155,
      max: 160,
    },
  }

  setupCustomTooltips()

  // Helper function to validate and set appropriate class
  function validateCharacterCount(count, element, type) {
    // Remove any existing status classes
    element.classList.remove('count-good', 'count-warning', 'count-error')

    const limits = SEO_LIMITS[type]
    let statusClass = ''
    let svgIcon = ''

    if (count >= limits.min && count <= limits.max) {
      // Within recommended range - green
      statusClass = 'count-good'
      svgIcon =
        '<svg class="status-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>'
    } else {
      // Below or above range - red
      statusClass = 'count-error'
      svgIcon =
        '<svg class="status-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 20L4 4.00003M20 4L4.00002 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path> </g></svg>'
    }

    // Add the appropriate class
    element.classList.add(statusClass)

    // Set the content with SVG followed by text
    element.innerHTML =
      svgIcon + `<span class="count-text">${count} tekens</span>`
  }

  // Update title section
  document.getElementById('page-title').textContent = overview.title.content
  const titleCountElement = document
    .querySelector('#page-title')
    .previousElementSibling.querySelector('.character-count')
  validateCharacterCount(overview.title.length, titleCountElement, 'title')

  // Update description section
  const descriptionElement = document.getElementById('page-description')
  descriptionElement.textContent = overview.description.content || 'Ontbreekt'

  // Mark missing descriptions with red text
  if (!overview.description.content) {
    descriptionElement.classList.add('missing')
  } else {
    descriptionElement.classList.remove('missing')
  }

  const descriptionCountElement = document
    .querySelector('#page-description')
    .previousElementSibling.querySelector('.character-count')
  validateCharacterCount(
    overview.description.length,
    descriptionCountElement,
    'description'
  )

  const urlElement = document.getElementById('page-url')

  // Create an <a> tag and set its properties
  const link = document.createElement('a')
  link.href = overview.url.current
  link.textContent = overview.url.current
  link.target = '_blank' // Opens in a new tab
  link.rel = 'noopener noreferrer' // Security best practice
  link.classList.add('clickable-link') // Optional styling

  // Clear existing content and append the new link
  urlElement.textContent = '' // Clear any existing text
  urlElement.appendChild(link)

  const urlStatusElement = document
    .querySelector('#page-url')
    .previousElementSibling.querySelector('.meta-status')

  // Clear existing content
  urlStatusElement.innerHTML = ''

  // Determine status
  let statusText = overview.url.isIndexable
    ? 'Indexeerbaar'
    : 'Niet indexeerbaar'
  let statusClass = overview.url.isIndexable ? 'indexable' : 'non-indexable'
  let svgIcon = ''

  // Set appropriate SVG based on indexability
  if (overview.url.isIndexable) {
    // Checkmark SVG for indexable
    svgIcon =
      '<svg class="status-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>'
  } else {
    // X mark SVG for non-indexable
    svgIcon =
      '<svg class="status-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 20L4 4.00003M20 4L4.00002 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path> </g></svg>'
  }

  // Create SVG container
  const svgContainerURL = document.createElement('span')
  svgContainerURL.className = 'status-icon'
  svgContainerURL.innerHTML = svgIcon

  // Create text container
  const textContainerURL = document.createElement('span')
  textContainerURL.className = 'status-text'
  textContainerURL.textContent = statusText

  // Append both containers to the main element
  urlStatusElement.appendChild(svgContainerURL)
  urlStatusElement.appendChild(textContainerURL)

  // Set the appropriate class
  urlStatusElement.className = `meta-status ${statusClass}`

  // In your code where you need the URL tooltip
  const tooltipKey = overview.url.isIndexable ? 'indexable' : 'nonIndexable'
  if (tooltipData[tooltipKey]) {
    createCustomTooltip(textContainerURL, tooltipData[tooltipKey], 'url')
  }

  const canonicalElement = document.getElementById('page-canonical')

  if (overview.canonical.exists && overview.canonical.href) {
    // Create an <a> tag and set its properties
    const link = document.createElement('a')
    link.href = overview.canonical.href
    link.textContent = overview.canonical.href
    link.target = '_blank' // Opens in a new tab
    link.rel = 'noopener noreferrer' // Security best practice
    link.classList.add('clickable-link') // Optional styling

    // Clear existing content and append the new link
    canonicalElement.textContent = '' // Clear any existing text
    canonicalElement.appendChild(link)
  } else {
    // Show "Ontbreekt" when canonical doesn't exist
    canonicalElement.textContent = 'Ontbreekt'
    canonicalElement.classList.add('missing')
  }

  const canonicalStatusElement = document
    .querySelector('#page-canonical')
    .previousElementSibling.querySelector('.meta-status')

  // Clear existing content
  canonicalStatusElement.innerHTML = ''

  // Determine status
  let statusTextCanonical = 'Ontbreekt'
  let statusClassCanonical = 'missing'
  let svgIconCanonical = ''

  if (overview.canonical.exists) {
    if (overview.canonical.isSelfReferencing) {
      // Self-referencing canonical
      statusTextCanonical = 'Self-referencing'
      statusClassCanonical = 'self-referencing'
      svgIconCanonical =
        '<svg class="status-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>'
    } else {
      // External canonical
      statusTextCanonical = 'Extern'
      statusClassCanonical = 'externalCanonical'
      svgIconCanonical =
        '<svg class="status-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 20L4 4.00003M20 4L4.00002 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path> </g></svg>'
    }
  } else {
    // Missing canonical
    statusTextCanonical = 'Ontbreekt'
    statusClassCanonical = 'missingCanonical'
    svgIconCanonical =
      '<svg class="status-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 20L4 4.00003M20 4L4.00002 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path> </g></svg>'
  }

  // Create SVG container
  const svgContainer = document.createElement('span')
  svgContainer.className = 'status-icon'
  svgContainer.innerHTML = svgIconCanonical

  // Create text container
  const textContainer = document.createElement('span')
  textContainer.className = 'status-text'
  textContainer.textContent = statusTextCanonical

  // Append both containers to the main element
  canonicalStatusElement.appendChild(svgContainer)
  canonicalStatusElement.appendChild(textContainer)

  // Set the appropriate class
  canonicalStatusElement.className = `meta-status ${statusClassCanonical}`

  // Determine tooltip key based on status
  let tooltipKeyCanonical
  if (!overview.canonical.exists) {
    tooltipKeyCanonical = 'missingCanonical'
  } else if (overview.canonical.isSelfReferencing) {
    tooltipKeyCanonical = 'selfReferencing'
  } else {
    tooltipKeyCanonical = 'external'
  }

  // Add tooltip if data exists
  if (tooltipData[tooltipKeyCanonical]) {
    createCustomTooltip(
      textContainer,
      tooltipData[tooltipKeyCanonical],
      'canonical'
    )
  }

  // Update robots tag
  document.getElementById('robots-tag').textContent =
    overview.robots.meta || 'Ontbreekt'
  if (!overview.robots.meta) {
    document.getElementById('robots-tag').classList.add('missing')
  }

  // Update word count
  document.getElementById('word-count').textContent =
    overview.wordCount.toLocaleString()

  // Update language
  document.getElementById('language').textContent =
    overview.language || 'Ontbreekt'
  if (!overview.language) {
    document.getElementById('language').classList.add('missing')
  }

  // Get headings data for the footer
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]

    const headingsResponse = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        currentTab.id,
        { action: 'getHeadings' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve(response)
          }
        }
      )
    })

    // Update heading counts in overview
    if (headingsResponse && headingsResponse.counts) {
      for (let i = 1; i <= 6; i++) {
        const countElement = document.getElementById(`overview-h${i}-count`)
        if (countElement) {
          countElement.textContent = headingsResponse.counts[`h${i}`] || 0
        }
      }

      // Update images and links counts
      document.getElementById('overview-images').textContent =
        headingsResponse.summary.totalImages || 0
      document.getElementById('overview-links').textContent =
        headingsResponse.summary.totalLinks || 0
    }

    // Get domain from current tab URL
    const url = new URL(currentTab.url)
    const domain = `${url.protocol}//${url.hostname}`

    // Use the centralized footer setup function instead of duplicating the code
    await setupFooterLinks(domain)
  } catch (error) {
    console.error('Error updating overview footer:', error)
  }
}
