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
 * Helper function to extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Extracted domain
 */
function extractDomain(url) {
  try {
    const domain = new URL(url).hostname

    // Check if the domain looks like a real domain or an internal identifier
    // Real domains typically have a TLD (.com, .nl, etc.) and don't consist only of random characters
    if (!domain.includes('.') || /^[a-z0-9]{30,}$/i.test(domain)) {
      return 'voorbeeld-domein.be' // This is likely an internal identifier, use a placeholder
    }

    return domain
  } catch (e) {
    return 'voorbeeld-domein.be'
  }
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
      og.image_alt || 'Voorbeeldafbeelding'
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
            og.title || document.title || 'Geen titel'
          }</div>
          <div class="preview-description">${
            og.description || 'Geen beschrijving'
          }</div>
        </div>
      </div>
      <div class="preview-footer">
        <div class="preview-action">👍 Like</div>
        <div class="preview-action">💬 Reageer</div>
        <div class="preview-action">↗️ Delen</div>
      </div>
    `

  container.innerHTML = html
  return container
}

/**
 * Creates an empty Facebook preview to show when no metadata exists
 * @returns {HTMLElement} - The empty Facebook preview element
 */
function createEmptyFacebookPreview() {
  const container = document.createElement('div')
  container.className = 'facebook-preview facebook-preview-empty'

  container.innerHTML = `
    <div class="preview-header">
      <div class="preview-avatar">W</div>
      <div class="preview-info">
        <div class="preview-site-name">Website</div>
        <div class="preview-date">${formatDate(new Date())}</div>
      </div>
    </div>
    <div class="preview-content">
      <div class="preview-empty-state">
        <div class="preview-placeholder-image">
          <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>Geen afbeeldingsmetadata gevonden</span>
        </div>
        <div class="preview-text">
          <div class="preview-domain">${extractDomain(
            window.location.href
          )}</div>
          <div class="preview-title preview-placeholder">
            <span>Ontbrekende og:title</span>
          </div>
          <div class="preview-description preview-placeholder">
            <span>Ontbrekende og:description. Bij het delen op Facebook zal deze link verschijnen zonder een goede beschrijving, waardoor deze minder aantrekkelijk is en minder kans heeft om aangeklikt te worden.</span>
          </div>
        </div>
      </div>
    </div>
    <div class="preview-footer">
      <div class="preview-action">👍 Like</div>
      <div class="preview-action">💬 Reageer</div>
      <div class="preview-action">↗️ Delen</div>
    </div>
  `

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
  const title = twitter.title || og.title || document.title || 'Geen titel'
  const description =
    twitter.description || og.description || 'Geen beschrijving'
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
            <img src="${image}" alt="Voorbeeld" onerror="this.src='img/placeholder.png';">
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
 * Creates an empty Twitter/X preview to show when no metadata exists
 * @returns {HTMLElement} - The empty Twitter preview element
 */
function createEmptyTwitterPreview() {
  const container = document.createElement('div')
  container.className = 'twitter-preview twitter-preview-empty'

  const domain = extractDomain(window.location.href)
  const handle = domain.replace(/\./g, '')

  container.innerHTML = `
    <div class="preview-header">
      <div class="preview-avatar">X</div>
      <div class="preview-info">
        <div class="preview-site-name">Website</div>
        <div class="preview-handle">@${handle}</div>
      </div>
    </div>
    <div class="preview-content">
      <div class="preview-text preview-placeholder">
        <span>Bij het delen op X/Twitter zal je content verschijnen zonder een goede beschrijving.</span>
      </div>
      <div class="preview-card preview-empty-card">
        <div class="preview-card-image preview-placeholder">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>Ontbrekende twitter:image</span>
        </div>
        <div class="preview-card-content">
          <div class="preview-card-domain">${domain}</div>
          <div class="preview-card-title preview-placeholder">
            <span>Ontbrekende twitter:title</span>
          </div>
        </div>
      </div>
    </div>
    <div class="preview-footer">
      <div class="preview-action">💬 0</div>
      <div class="preview-action">🔄 0</div>
      <div class="preview-action">❤️ 0</div>
      <div class="preview-action">↗️</div>
    </div>
  `

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
  const title = og.title || document.title || 'Geen titel'
  const description = og.description || 'Geen beschrijving'
  const image = og.image || ''
  const siteName = og.site_name || extractDomain(window.location.href)
  const url = og.url || window.location.href

  let html = `
      <div class="preview-header">
        <div class="preview-avatar">${siteName.charAt(0)}</div>
        <div class="preview-info">
          <div class="preview-site-name">${siteName}</div>
          <div class="preview-meta">Bedrijf • ${formatDate(
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
      og.image_alt || 'Voorbeeldafbeelding'
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
          <div class="preview-action">💬 12 reacties</div>
        </div>
        <div class="preview-share">Delen</div>
      </div>
    `

  container.innerHTML = html
  return container
}

/**
 * Creates an empty LinkedIn preview to show when no metadata exists
 * @returns {HTMLElement} - The empty LinkedIn preview element
 */
function createEmptyLinkedInPreview() {
  const container = document.createElement('div')
  container.className = 'linkedin-preview linkedin-preview-empty'

  const domain = extractDomain(window.location.href)

  container.innerHTML = `
    <div class="preview-header">
      <div class="preview-avatar">L</div>
      <div class="preview-info">
        <div class="preview-site-name">Bedrijf</div>
        <div class="preview-meta">Bedrijf • ${formatDate(new Date())}</div>
      </div>
    </div>
    <div class="preview-content">
      <div class="preview-text preview-placeholder">
        <span>LinkedIn gebruikt gewoonlijk Open Graph metadata voor linkvoorbeelden.</span>
      </div>
      <div class="preview-link-card preview-empty-card">
        <div class="preview-link-image preview-placeholder">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>Ontbrekende og:image</span>
        </div>
        <div class="preview-link-content">
          <div class="preview-link-title preview-placeholder">
            <span>Ontbrekende og:title</span>
          </div>
          <div class="preview-link-url">${window.location.href}</div>
        </div>
      </div>
    </div>
    <div class="preview-footer">
      <div class="preview-actions">
        <div class="preview-action">👍 0</div>
        <div class="preview-action">💬 0 reacties</div>
      </div>
      <div class="preview-share">Delen</div>
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
    item.textContent = 'Geen Open Graph metadata gevonden'
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

  // Create either populated or empty previews
  let facebookPreview, twitterPreview, linkedinPreview

  if (hasData) {
    // Regular previews with available data
    facebookPreview = createFacebookPreview(metadata)
    twitterPreview = createTwitterPreview(metadata)
    linkedinPreview = createLinkedInPreview(metadata)
  } else {
    // Empty state previews
    facebookPreview = createEmptyFacebookPreview()
    twitterPreview = createEmptyTwitterPreview()
    linkedinPreview = createEmptyLinkedInPreview()

    // Add a notice above the previews
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
        <strong>Dit is een voorbeeldsimulatie</strong> die laat zien hoe je link eruit zou zien op sociale media zonder de juiste metadata.
      </div>
    `
    previewsContainer.appendChild(notice)
  }

  // Set display properties
  facebookPreview.className = 'social-preview-item active'
  facebookPreview.dataset.platform = 'facebook'

  twitterPreview.className = 'social-preview-item'
  twitterPreview.dataset.platform = 'x'
  twitterPreview.style.display = 'none'

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

  // Add CSS for empty states if needed
  if (!hasData) {
    const style = document.createElement('style')
    style.textContent = `
      .preview-placeholder {
        background-color: #f8f9fa;
        border: 1px dashed #dee2e6;
        padding: 6px 10px;
        color: #6c757d;
        border-radius: 4px;
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
        min-height: 150px;
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
        border-radius: 0 4px 4px 0;
      }
      
      .preview-notice-icon {
        margin-right: 10px;
        color: #ffc107;
      }
      
      .preview-empty-card {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .empty-state-container {
        text-align: center;
        background: var(--white);
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
        box-shadow: rgba(0, 0, 0, 0.08) 0 4px 12px 0;
        margin: 1.5rem 0;
      }
      
      .empty-state-icon {
        margin: 0 auto 1rem;
        color: var(--primary-color);
        display: flex;
        justify-content: center;
      }
      
      .empty-state-title {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        color: #343a40;
      }
      
      .empty-state-description {
        margin-bottom: 1.5rem;
        color: #495057;
        line-height: 1.5;
      }
      
      .empty-state-recommendations {
        text-align: left;
        background: #e9ecef;
        padding: 1.5rem;
        border-radius: 6px;
      }
      
      .tag-recommendations {
        margin-bottom: 1rem;
      }
      
      .tag-recommendations li {
        margin-bottom: 0.5rem;
      }
      
      .empty-state-benefits {
        background: #d4edda;
        border-left: 4px solid #28a745;
        padding: 0.75rem;
        border-radius: 0 4px 4px 0;
        margin-top: 1rem;
      }
    `
    container.appendChild(style)
  }

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
 * Creates the HTML for the empty state message
 * @param {string} platform - The social media platform (optional)
 * @returns {string} - HTML string for the empty state message
 */
function createEmptyStateMessageHTML(platform = null) {
  let platformSpecificTips = ''

  // Add platform-specific tips if a platform is specified
  if (platform === 'facebook') {
    platformSpecificTips = `
      <li><strong>og:title</strong> - De titel van je pagina</li>
      <li><strong>og:description</strong> - Een korte beschrijving van je inhoud</li>
      <li><strong>og:image</strong> - Een afbeeldings-URL (minimaal 1200 x 630 pixels aanbevolen)</li>
      <li><strong>og:url</strong> - De canonieke URL van je pagina</li>
    `
  } else if (platform === 'x' || platform === 'twitter') {
    platformSpecificTips = `
      <li><strong>twitter:card</strong> - Het kaarttype (summary, summary_large_image, etc.)</li>
      <li><strong>twitter:title</strong> - De titel van je pagina</li>
      <li><strong>twitter:description</strong> - Een beschrijving van je inhoud</li>
      <li><strong>twitter:image</strong> - Een afbeeldings-URL (1200 x 675 pixels aanbevolen)</li>
    `
  } else if (platform === 'linkedin') {
    platformSpecificTips = `
      <li><strong>og:title</strong> - LinkedIn gebruikt Open Graph tags</li>
      <li><strong>og:description</strong> - Een beknopte samenvatting van je inhoud</li>
      <li><strong>og:image</strong> - Een afbeeldings-URL (1104 x 736 pixels aanbevolen)</li>
    `
  } else {
    // General tips for all platforms
    platformSpecificTips = `
      <li><strong>og:title</strong> - De titel van je pagina</li>
      <li><strong>og:description</strong> - Een beschrijving van je inhoud</li>
      <li><strong>og:image</strong> - Een afbeeldings-URL</li>
      <li><strong>twitter:card</strong> - Type Twitter-kaart</li>
    `
  }

  return `
    <div class="empty-state-icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    </div>
    <h3 class="empty-state-title">Geen Social Media Metadata Gevonden</h3>
    <p class="empty-state-description">
      Deze pagina mist metadata die de weergave zou verbeteren wanneer deze wordt gedeeld op sociale media.
      Zonder de juiste metadata zullen sociale platforms standaardwaarden gebruiken die je content mogelijk niet effectief weergeven.
    </p>
    <div class="empty-state-recommendations">
      <h4>Aanbevolen Tags:</h4>
      <ul class="tag-recommendations">
        ${platformSpecificTips}
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
  const container = document.getElementById('social-tab')

  // Clear any existing content
  const contentContainer =
    container.querySelector('.tab-content-container') || container
  contentContainer.innerHTML = ''

  // Create the social preview UI (it will handle empty data internally)
  const socialPreviewUI = createSocialPreviewUI(socialData)
  contentContainer.appendChild(socialPreviewUI)

  // If no data was found, also show the detailed empty state message below the preview
  if (
    !data ||
    !data.social ||
    (Object.keys(socialData.og || {}).length === 0 &&
      Object.keys(socialData.twitter || {}).length === 0)
  ) {
    // Get the active platform tab if one exists
    const activeTab = document.querySelector('.social-preview-tab.active')
    const platform = activeTab ? activeTab.dataset.platform : null

    // Create the empty state message container
    const emptyStateContainer = document.createElement('div')
    emptyStateContainer.className = 'empty-state-container'

    // Add the empty state message
    emptyStateContainer.innerHTML = createEmptyStateMessageHTML(platform)

    // Append it after the preview
    contentContainer.appendChild(emptyStateContainer)
  }
}
