// social.js - Handler for the social tab functionality

/**
 * Helper function to format dates
 * @param {string} dateString - Date string to format
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Helper function to extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Extracted domain
 */
function extractDomain(url) {
  try {
    const domain = new URL(url).hostname
    return domain
  } catch (e) {
    return url
  }
}

/**
 * Shows error message in the social tab
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  const container = document.getElementById('social-tab')
  const contentContainer =
    container.querySelector('.tab-content-container') || container

  contentContainer.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
      </div>
    `
}

/**
 * Creates a Facebook-style preview
 * @param {Object} metadata - The social metadata
 * @returns {HTMLElement} - The Facebook preview element
 */
function createFacebookPreview(metadata) {
  const container = document.createElement('div')
  container.className = 'facebook-preview'

  const og = metadata.og || {}

  // Create preview content based on Open Graph metadata
  let html = `
      <div class="preview-header">
        <div class="preview-avatar">${(og.site_name || 'Site').charAt(0)}</div>
        <div class="preview-info">
          <div class="preview-site-name">${og.site_name || 'Website'}</div>
          <div class="preview-date">${formatDate(
            og.updated_time || new Date()
          )}</div>
        </div>
      </div>
      <div class="preview-content">
    `

  // Add image if available
  if (og.image) {
    html += `
        <div class="preview-image">
          <img src="${og.image}" alt="${
      og.image_alt || 'Preview image'
    }" onerror="this.src='img/placeholder.png';">
        </div>
      `
  }

  html += `
        <div class="preview-text">
          <div class="preview-domain">${extractDomain(
            og.url || window.location.href
          )}</div>
          <div class="preview-title">${
            og.title || document.title || 'No title'
          }</div>
          <div class="preview-description">${
            og.description || 'No description'
          }</div>
        </div>
      </div>
      <div class="preview-footer">
        <div class="preview-action">👍 Like</div>
        <div class="preview-action">💬 Comment</div>
        <div class="preview-action">↗️ Share</div>
      </div>
    `

  container.innerHTML = html
  return container
}

/**
 * Creates a Twitter-style preview
 * @param {Object} metadata - The social metadata
 * @returns {HTMLElement} - The Twitter preview element
 */
function createTwitterPreview(metadata) {
  const container = document.createElement('div')
  container.className = 'twitter-preview'

  const og = metadata.og || {}
  const twitter = metadata.twitter || {}

  // Use Twitter card metadata, fall back to Open Graph if needed
  const title = twitter.title || og.title || document.title || 'No title'
  const description = twitter.description || og.description || 'No description'
  const image = twitter.image || og.image || ''
  const siteName = og.site_name || extractDomain(window.location.href)

  let html = `
      <div class="preview-header">
        <div class="preview-avatar">${siteName.charAt(0)}</div>
        <div class="preview-info">
          <div class="preview-site-name">${siteName}</div>
          <div class="preview-handle">@${siteName
            .toLowerCase()
            .replace(/\s/g, '')}</div>
        </div>
      </div>
      <div class="preview-content">
        <div class="preview-text">${description}</div>
    `

  // Add card preview
  if (image) {
    html += `
        <div class="preview-card">
          <div class="preview-card-image">
            <img src="${image}" alt="Preview" onerror="this.src='img/placeholder.png';">
          </div>
          <div class="preview-card-content">
            <div class="preview-card-domain">${extractDomain(
              og.url || window.location.href
            )}</div>
            <div class="preview-card-title">${title}</div>
      `

    // Add extra Twitter fields if available
    if (twitter.label1 && twitter.data1) {
      html += `
          <div class="preview-card-meta">${twitter.label1}: ${twitter.data1}</div>
        `
    }

    html += `
          </div>
        </div>
      `
  }

  html += `
      </div>
      <div class="preview-footer">
        <div class="preview-action">💬 42</div>
        <div class="preview-action">🔄 128</div>
        <div class="preview-action">❤️ 347</div>
        <div class="preview-action">↗️</div>
      </div>
    `

  container.innerHTML = html
  return container
}

/**
 * Creates a LinkedIn-style preview
 * @param {Object} metadata - The social metadata
 * @returns {HTMLElement} - The LinkedIn preview element
 */
function createLinkedInPreview(metadata) {
  const container = document.createElement('div')
  container.className = 'linkedin-preview'

  const og = metadata.og || {}

  // Use Open Graph metadata
  const title = og.title || document.title || 'No title'
  const description = og.description || 'No description'
  const image = og.image || ''
  const siteName = og.site_name || extractDomain(window.location.href)
  const url = og.url || window.location.href

  let html = `
      <div class="preview-header">
        <div class="preview-avatar">${siteName.charAt(0)}</div>
        <div class="preview-info">
          <div class="preview-site-name">${siteName}</div>
          <div class="preview-meta">Company • ${formatDate(
            og.updated_time || new Date()
          )}</div>
        </div>
      </div>
      <div class="preview-content">
        <div class="preview-text">${description}</div>
        <div class="preview-link-card">
    `

  // Add image if available
  if (image) {
    html += `
          <div class="preview-link-image">
            <img src="${image}" alt="${
      og.image_alt || 'Preview image'
    }" onerror="this.src='img/placeholder.png';">
          </div>
      `
  }

  html += `
          <div class="preview-link-content">
            <div class="preview-link-title">${title}</div>
            <div class="preview-link-url">${url}</div>
          </div>
        </div>
      </div>
      <div class="preview-footer">
        <div class="preview-actions">
          <div class="preview-action">👍 78</div>
          <div class="preview-action">💬 12 comments</div>
        </div>
        <div class="preview-share">Share</div>
      </div>
    `

  container.innerHTML = html
  return container
}

/**
 * Creates a summary of all detected metadata
 * @param {Object} metadata - The social metadata
 * @returns {HTMLElement} - The metadata summary element
 */
function createMetadataSummary(metadata) {
  const container = document.createElement('div')
  container.className = 'metadata-summary'

  // Create header
  const header = document.createElement('h3')
  header.textContent = 'Detected Metadata'
  container.appendChild(header)

  // Create two-column layout
  const columns = document.createElement('div')
  columns.className = 'metadata-columns'

  // Open Graph column
  const ogColumn = document.createElement('div')
  ogColumn.className = 'metadata-column'
  const ogHeader = document.createElement('h4')
  ogHeader.textContent = 'Open Graph (Facebook)'
  ogColumn.appendChild(ogHeader)

  const ogList = document.createElement('ul')
  const og = metadata.og || {}
  for (const [key, value] of Object.entries(og)) {
    const item = document.createElement('li')
    item.innerHTML = `<strong>${key}:</strong> ${value}`
    ogList.appendChild(item)
  }

  if (Object.keys(og).length === 0) {
    const item = document.createElement('li')
    item.textContent = 'No Open Graph metadata found'
    ogList.appendChild(item)
  }

  ogColumn.appendChild(ogList)

  // Twitter column
  const twitterColumn = document.createElement('div')
  twitterColumn.className = 'metadata-column'
  const twitterHeader = document.createElement('h4')
  twitterHeader.textContent = 'X'
  twitterColumn.appendChild(twitterHeader)

  const twitterList = document.createElement('ul')
  const twitter = metadata.twitter || {}
  for (const [key, value] of Object.entries(twitter)) {
    const item = document.createElement('li')
    item.innerHTML = `<strong>${key}:</strong> ${value}`
    twitterList.appendChild(item)
  }

  if (Object.keys(twitter).length === 0) {
    const item = document.createElement('li')
    item.textContent = 'No X Card metadata found'
    twitterList.appendChild(item)
  }

  twitterColumn.appendChild(twitterList)

  // Add columns to container
  columns.appendChild(ogColumn)
  columns.appendChild(twitterColumn)
  container.appendChild(columns)

  return container
}

/**
 * Creates the UI for displaying social previews
 * @param {Object} metadata - The extracted social metadata
 * @returns {HTMLElement} - The created UI element
 */
function createSocialPreviewUI(metadata) {
  // Create container element
  const container = document.createElement('div')
  container.className = 'social-preview-container'

  // Create tabs
  const tabContainer = document.createElement('div')
  tabContainer.className = 'social-preview-tabs'

  const platforms = ['Facebook', 'X', 'LinkedIn']
  const tabs = platforms.map((platform) => {
    const tab = document.createElement('button')
    tab.textContent = platform
    tab.className = 'social-preview-tab'
    tab.dataset.platform = platform.toLowerCase()
    return tab
  })

  // Add tabs to container
  tabs.forEach((tab) => tabContainer.appendChild(tab))
  container.appendChild(tabContainer)

  // Create preview containers
  const previewsContainer = document.createElement('div')
  previewsContainer.className = 'social-preview-content'

  // Facebook preview
  const facebookPreview = createFacebookPreview(metadata)
  facebookPreview.className = 'social-preview-item active'
  facebookPreview.dataset.platform = 'facebook'

  // Twitter preview
  const twitterPreview = createTwitterPreview(metadata)
  twitterPreview.className = 'social-preview-item'
  twitterPreview.dataset.platform = 'x'
  twitterPreview.style.display = 'none'

  // LinkedIn preview
  const linkedinPreview = createLinkedInPreview(metadata)
  linkedinPreview.className = 'social-preview-item'
  linkedinPreview.dataset.platform = 'linkedin'
  linkedinPreview.style.display = 'none'

  // Add previews to container
  previewsContainer.appendChild(facebookPreview)
  previewsContainer.appendChild(twitterPreview)
  previewsContainer.appendChild(linkedinPreview)
  container.appendChild(previewsContainer)

  // Add metadata summary
  const metadataContainer = createMetadataSummary(metadata)
  container.appendChild(metadataContainer)

  // Add tab switching functionality
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')

      // Show selected preview
      const platform = tab.dataset.platform
      document.querySelectorAll('.social-preview-item').forEach((preview) => {
        if (preview.dataset.platform === platform) {
          preview.style.display = 'block'
        } else {
          preview.style.display = 'none'
        }
      })
    })
  })

  // Set first tab as active
  tabs[0].classList.add('active')

  return container
}

/**
 * Updates the UI with social metadata
 * @param {Object} data - Social metadata from the content script
 */
export function updateSocialUI(data) {
  if (!data || !data.social) {
    showErrorMessage('No social media metadata found')
    return
  }

  const socialData = data.social
  const container = document.getElementById('social-tab')

  // Clear any existing content
  const contentContainer =
    container.querySelector('.tab-content-container') || container
  contentContainer.innerHTML = ''

  // Create the social preview UI
  const socialPreviewUI = createSocialPreviewUI(socialData)
  contentContainer.appendChild(socialPreviewUI)
}
