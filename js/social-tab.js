// social.js - Handler for the social tab functionality

/**
 * Helper function to format dates
 * @param {string} dateString - Date string to format
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Updated helper function to extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Extracted domain
 */
function extractDomain(url) {
  try {
    // First try to get canonical URL
    let sourceUrl = url
    try {
      const canonicalLink = document.querySelector('link[rel="canonical"]')
      if (canonicalLink && canonicalLink.href) {
        sourceUrl = canonicalLink.href
      }
    } catch (domError) {
      // Silently continue with original URL if DOM access fails
    }

    const domain = new URL(sourceUrl).hostname

    // Significantly improved domain validation
    // Only invalidate domains in very specific cases:
    // 1. No dots at all (every valid domain has at least one dot)
    // 2. Extremely long string of only alphanumeric chars (likely an ID, not a domain)
    if (
      !domain.includes('.') ||
      (/^[a-z0-9]{30,}$/i.test(domain) && !domain.includes('.'))
    ) {
      return 'voorbeeld-domein.be'
    }

    // For IP addresses and localhost, you might want to use a placeholder
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(domain) || domain === 'localhost') {
      return 'voorbeeld-domein.be'
    }

    return domain
  } catch (e) {
    return 'voorbeeld-domein.be'
  }
}

/**
 * Function to extract and display site name from various sources
 * @param {Object} metadata - The metadata object
 * @param {string} url - Current page URL
 * @returns {string} - Site name to display
 */
function getSiteName(metadata, url) {
  const og = metadata.og || {}

  // Priority order for site name:
  // 1. og:site_name from metadata (most reliable when available)
  // 2. Domain name extracted from canonical URL or current URL
  // 3. Fallback to example domain

  if (og.site_name && og.site_name.trim().length > 0) {
    return og.site_name
  }

  // Get domain, preferring canonical URL
  const domain = extractDomain(url)

  // Format domain for display - remove www. prefix
  return domain.replace(/^www\./, '')
}

/**
 * Creates a universal social media preview
 * @param {Object} metadata - The social metadata
 * @returns {HTMLElement} - The universal preview element
 */
function createSocialPreview(metadata) {
  const container = document.createElement('div')
  container.className = 'social-preview social-preview-compact'

  const og = metadata.og || {}
  const twitter = metadata.twitter || {}

  // Use metadata values, fall back to defaults if needed
  const title = og.title || twitter.title || document.title || 'Geen titel'
  const description =
    og.description || twitter.description || 'Geen beschrijving'
  const image = og.image || twitter.image || ''
  const url = og.url || window.location.href

  // Use getSiteName function for more reliable site name
  const siteName = getSiteName(metadata, url)

  // Display the domain (without www.)
  const displayDomain = extractDomain(url).replace(/^www\./, '')

  let html = `
      <div class="preview-header">
        <div class="preview-avatar">${siteName.charAt(0)}</div>
        <div class="preview-info">
          <div class="preview-site-name">${siteName}</div>
          <div class="preview-date">${formatDate(
            og.updated_time || new Date()
          )}</div>
        </div>
      </div>
      <div class="preview-content">
    `

  // Add image if available
  if (image) {
    html += `
        <div class="preview-image preview-image-compact">
          <img src="${image}" alt="${
      og.image_alt || 'Voorbeeldafbeelding'
    }" onerror="this.src='img/placeholder.png';">
        </div>
      `
  }

  html += `
        <div class="preview-text">
          <div class="preview-domain">${displayDomain}</div>
          <div class="preview-title">${title}</div>
          <div class="preview-description">${description}</div>
        </div>
      </div>
      <div class="preview-footer">
        <div class="preview-action">👍 42</div>
        <div class="preview-action">💬 15</div>
        <div class="preview-action">↗️ Delen</div>
      </div>
    `

  container.innerHTML = html
  return container
}

/**
 * Creates an empty social preview to show when no metadata exists
 * @returns {HTMLElement} - The empty social preview element
 */
function createEmptySocialPreview() {
  const container = document.createElement('div')
  container.className =
    'social-preview social-preview-empty social-preview-compact'

  // Use the improved domain extraction
  const url = window.location.href
  const domain = extractDomain(url).replace(/^www\./, '')

  container.innerHTML = `
    <div class="preview-header">
      <div class="preview-avatar">S</div>
      <div class="preview-info">
        <div class="preview-site-name">Website</div>
        <div class="preview-date">${formatDate(new Date())}</div>
      </div>
    </div>
    <div class="preview-content">
      <div class="preview-empty-state">
        <div class="preview-placeholder-image preview-image-compact">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>Geen afbeeldingsmetadata gevonden</span>
        </div>
        <div class="preview-text">
          <div class="preview-domain">${domain}</div>
          <div class="preview-title preview-placeholder">
            <span>Ontbrekende og:title</span>
          </div>
          <div class="preview-description preview-placeholder">
            <span>Ontbrekende og:description. Bij het delen op sociale media zal deze link verschijnen zonder een goede beschrijving, waardoor deze minder aantrekkelijk is en minder kans heeft om aangeklikt te worden.</span>
          </div>
        </div>
      </div>
    </div>
    <div class="preview-footer">
      <div class="preview-action">👍 12</div>
      <div class="preview-action">💬 3</div>
      <div class="preview-action">↗️ Delen</div>
    </div>
  `

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
  header.textContent = 'Gedetecteerde Metadata'
  container.appendChild(header)

  // Create two-column layout
  const columns = document.createElement('div')
  columns.className = 'metadata-columns'

  // Open Graph column
  const ogColumn = document.createElement('div')
  ogColumn.className = 'metadata-column'
  const ogHeader = document.createElement('h4')
  ogHeader.textContent = 'Open Graph (Facebook, LinkedIn)'
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
    item.textContent = 'Geen Open Graph metadata gevonden'
    ogList.appendChild(item)
  }

  ogColumn.appendChild(ogList)

  // Twitter column
  const twitterColumn = document.createElement('div')
  twitterColumn.className = 'metadata-column'
  const twitterHeader = document.createElement('h4')
  twitterHeader.textContent = 'X/Twitter'
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
    item.textContent = 'Geen X Card metadata gevonden'
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

  // Check if we have valid metadata
  const hasOgData = metadata.og && Object.keys(metadata.og).length > 0
  const hasTwitterData =
    metadata.twitter && Object.keys(metadata.twitter).length > 0
  const hasData = hasOgData || hasTwitterData

  // Create preview container
  const previewContainer = document.createElement('div')
  previewContainer.className = 'social-preview-content'

  // Always add the notice message at the top (per requirement #2)
  const notice = document.createElement('div')
  notice.className = 'preview-notice'
  notice.innerHTML = `
    <div class="preview-notice-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <div class="preview-notice-text">
      <strong>Dit is een voorbeeldsimulatie</strong> die laat zien hoe je link eruit zou zien op sociale media. Wanneer er geen afbeeldingsmetadata gevonden is, zal Meta automatisch de eerste beschikbare afbeelding tonen.
    </div>
  `
  previewContainer.appendChild(notice)

  // Create either populated or empty preview
  const socialPreview = hasData
    ? createSocialPreview(metadata)
    : createEmptySocialPreview()
  previewContainer.appendChild(socialPreview)
  container.appendChild(previewContainer)

  // Add metadata summary
  const metadataContainer = createMetadataSummary(metadata)
  container.appendChild(metadataContainer)

  // Add CSS for compact previews and empty states
  const style = document.createElement('style')
  style.textContent = `
    .social-preview-compact .preview-image-compact {
      max-height: 400px;
      overflow: hidden;
    }
    
    .social-preview-compact .preview-image-compact img {
      max-height: 400px;
      object-fit: contain;
      width: 100%;
      background-color: #f8f9fa;
    }
    
    .social-preview-compact .preview-placeholder-image {
      max-height: 400px;
      padding: 10px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .preview-placeholder {
      background-color: #f8f9fa;
      border: 1px dashed #dee2e6;
      padding: 6px 10px;
      color: #6c757d;
      border-radius: 6px;
      font-style: italic;
    }
    
    .preview-placeholder-image {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f8f9fa;
      border: 1px dashed #dee2e6;
      padding: 20px;
      margin-bottom: 10px;
      color: #6c757d;
    }
    
    .preview-placeholder-image svg {
      margin-bottom: 10px;
      color: #adb5bd;
    }
    
    .preview-notice {
      display: flex;
      align-items: center;
      background-color: #fff8e6;
      border-left: 4px solid #ffc107;
      padding: 10px 15px;
      margin-bottom: 15px;
      border-radius: 6px;
    }
    
    .preview-notice-icon {
      margin-right: 10px;
      color: #ffc107;
    }
    
    .preview-empty-card {
      border: 1px solid #e9ecef;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .empty-state-container {
      display: flex;
      flex-direction: column;
      text-align: left;
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin-top: 20px;
      margin-bottom: 0px;
      border: 1px solid #eee;
    }

    .empty-state-icon {
      margin-right: 12px;
    }
    
    .empty-state-icon svg {
      display: block;
      background-color: var(--background-color);
      color: var(--primary-color);
      border-radius: 6px;
      padding: 8px;
    }
    
    .empty-state-title {
      color: black;
      margin-top: 0px !important;
      padding: 0px !important;
      color: var(--title-color);
      text-align: left;
      margin-bottom: 0px !important;
    }
    
    .empty-state-description {
      margin-bottom: 1.5rem;
      color: #495057;
      line-height: 1.5;
      text-align: left;
    }

    .empty-state-header {
      display: flex;
      align-items: center;
    }
    
    .empty-state-recommendations {
      text-align: left;
      background:rgb(255, 255, 255);
      padding-bottom: 0px !important;
      border-radius: 6px;
    }
    
    .tag-recommendations {
      margin-bottom: 1rem;
      text-align: left;
    }
    
    .tag-recommendations li {
      margin-bottom: 0.5rem;
      text-align: left;
    }
    
    .empty-state-benefits {
      background: #d4edda;
      border-left: 4px solid #28a745;
      padding: 10px 15px;
      border-radius: 6px;
      margin-top: 1rem;
      font-size: 14px;
    }
    .empty-state-benefits p{
      padding: 0px !important;
      margin: 0px !important;
    }
  `
  container.appendChild(style)

  return container
}

/**
 * Creates the HTML for the empty state message
 * @returns {string} - HTML string for the empty state message
 */
function createEmptyStateMessageHTML() {
  return `
    <div class="empty-state-header">
      <div class="empty-state-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <h3 class="empty-state-title">Geen metadata van sociale media gevonden</h3>
    </div>
    <p class="empty-state-description">
      Deze pagina mist metadata die de weergave zou verbeteren wanneer deze wordt gedeeld op sociale media.
      Zonder de juiste metadata zullen sociale platforms standaardwaarden gebruiken die je content mogelijk niet effectief weergeven.
    </p>
    <div class="empty-state-recommendations">
      <h4 class="empty-state-title">Aanbevolen Tags:</h4>
      <ul class="tag-recommendations">
        <li><strong>og:title</strong> - De titel van je pagina</li>
        <li><strong>og:description</strong> - Een beschrijving van je inhoud</li>
        <li><strong>og:image</strong> - Een afbeeldings-URL (minimaal 1200 x 630 pixels aanbevolen)</li>
        <li><strong>og:url</strong> - De canonieke URL van je pagina</li>
        <li><strong>twitter:card</strong> - Het kaarttype (summary, summary_large_image, etc.)</li>
      </ul>
      <div class="empty-state-benefits">
        <p><strong>Voordelen:</strong> De juiste social media metadata kan klikpercentages met wel 50% verhogen en zorgt voor betere merkzichtbaarheid.</p>
      </div>
    </div>
  `
}

/**
 * Updates the UI with social metadata
 * @param {Object} data - Social metadata from the content script
 */
export function updateSocialUI(data) {
  // Always create a preview, even with empty data
  const socialData = data && data.social ? data.social : { og: {}, twitter: {} }

  // Get the main tab container
  const container = document.getElementById('social-tab')

  // Find the social-preview div inside the structure-list (your existing HTML)
  const socialPreviewDiv = document.getElementById('social-preview')

  // Clear any existing content in the social-preview div
  if (socialPreviewDiv) {
    socialPreviewDiv.innerHTML = ''

    // Create the social preview UI (it will handle empty data internally)
    const socialPreviewUI = createSocialPreviewUI(socialData)

    // Append the content to the existing social-preview div
    socialPreviewDiv.appendChild(socialPreviewUI)

    // If no data was found, also show the detailed empty state message below the preview
    if (
      !data ||
      !data.social ||
      (Object.keys(socialData.og || {}).length === 0 &&
        Object.keys(socialData.twitter || {}).length === 0)
    ) {
      // Create the empty state message container
      const emptyStateContainer = document.createElement('div')
      emptyStateContainer.className = 'empty-state-container'

      // Add the empty state message
      emptyStateContainer.innerHTML = createEmptyStateMessageHTML()

      // Append it after the preview
      socialPreviewDiv.appendChild(emptyStateContainer)
    }
  }
}
