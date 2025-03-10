/**
 * Highlights all images on the current webpage that are missing alt text and could potentially be visible
 * Uses multiple detection strategies to ensure maximum coverage
 * @param {boolean} highlight - Whether to add or remove highlighting
 * @returns {Object} - Results containing count and image information
 */
function highlightVisibleImagesWithNoAlt(highlight = true) {
  // First, remove any previous highlighting
  removeImageHighlighting()

  // If we're not highlighting, just return
  if (!highlight) {
    return { success: true }
  }

  // Add highlighting styles
  addHighlightingStyle()

  const results = {
    missingAltCount: 0,
    imagesWithoutAlt: [],
  }

  // PART 1: Find all images using multiple methods to ensure we don't miss any
  // Method 1: Standard getElementsByTagName
  const standardImages = Array.from(document.getElementsByTagName('img'))

  // Method 2: querySelectorAll for img tags (sometimes finds different results)
  const queriedImages = Array.from(document.querySelectorAll('img'))

  // Method 3: Find images in shadow DOM (for modern web components)
  const shadowImages = findImagesInShadowDOM()

  // Combine all images and remove duplicates
  const allImages = [
    ...new Set([...standardImages, ...queriedImages, ...shadowImages]),
  ]

  // PART 2: Filter images for those without alt text
  const imagesWithoutAlt = allImages.filter((img) => {
    // Check if image has valid alt text
    const hasAlt =
      img.hasAttribute('alt') && img.getAttribute('alt').trim() !== ''
    return !hasAlt
  })

  // PART 3: Only consider images that are potentially visible
  // We'll use very loose criteria here to catch everything
  const potentiallyVisibleImages = imagesWithoutAlt.filter((img) => {
    // Use multiple visibility detection approaches
    const approach1 = isElementRoughlyVisible(img)
    const approach2 = isElementCompletelyVisible(img)
    const approach3 = isElementPotentiallyVisible(img)

    // If ANY approach says it's visible, include it
    return approach1 && approach2 && approach3
  })

  // PART 4: Highlight all potentially visible images without alt text
  potentiallyVisibleImages.forEach((img) => {
    highlightImage(img)

    // Add to results
    try {
      results.imagesWithoutAlt.push({
        src: img.src || '',
        alt: '',
        width: img.width || '',
        height: img.height || '',
        naturalWidth: img.naturalWidth || '',
        naturalHeight: img.naturalHeight || '',
      })
    } catch (e) {
      console.error('Error collecting image data:', e)
    }
  })

  // Update count
  results.missingAltCount = potentiallyVisibleImages.length

  return results
}

/**
 * Finds images within Shadow DOM elements
 * @returns {Array} - Array of image elements found in shadow DOM
 */
function findImagesInShadowDOM() {
  const shadowImages = []

  // Function to recursively search for shadow roots and images within them
  function searchShadowDOM(root) {
    // Get all elements in this root
    const elements = root.querySelectorAll('*')

    elements.forEach((element) => {
      // Check if this element has a shadow root
      if (element.shadowRoot) {
        // Look for images in this shadow root
        const shadowImgs = element.shadowRoot.querySelectorAll('img')
        shadowImages.push(...shadowImgs)

        // Recursively search this shadow root
        searchShadowDOM(element.shadowRoot)
      }
    })
  }

  // Start the search from the document root
  searchShadowDOM(document)

  return shadowImages
}

/**
 * Approach 1: Basic visibility check looking at CSS properties
 * @param {Element} element - The DOM element to check
 * @returns {boolean} - Whether the element is roughly visible
 */
function isElementRoughlyVisible(element) {
  if (!element) return false

  try {
    // 1. Check computed styles for the element
    const style = window.getComputedStyle(element)

    // If explicitly hidden, definitely not visible
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      parseFloat(style.opacity) === 0
    ) {
      return false
    }

    // 2. Check if element has zero dimensions
    // Only exclude if BOTH dimensions are zero
    if (element.offsetWidth <= 0 && element.offsetHeight <= 0) {
      return false
    }

    // 3. For images, check if they've loaded correctly
    if (element.tagName === 'IMG') {
      // If image is not complete, consider it visible (it's still loading)
      if (!element.complete) {
        return true
      }

      // If image has loaded but has zero natural dimensions, it failed to load
      if (element.naturalWidth === 0 && element.naturalHeight === 0) {
        return false
      }
    }

    // 4. Consider images with very small dimensions to be visible
    // (could be tracking pixels or small icons)
    if (element.offsetWidth > 0 || element.offsetHeight > 0) {
      return true
    }

    return true
  } catch (e) {
    console.error('Error in isElementRoughlyVisible:', e)
    // Default to assuming it's visible if there's an error
    return true
  }
}

/**
 * Approach 2: More thorough visibility check including parent containers
 * @param {Element} element - The DOM element to check
 * @returns {boolean} - Whether the element is completely visible
 */
function isElementCompletelyVisible(element) {
  if (!element) return false

  try {
    // Check inline styles
    if (
      element.style.display === 'none' ||
      element.style.visibility === 'hidden' ||
      element.style.opacity === '0'
    ) {
      return false
    }

    // Check computed style
    const style = window.getComputedStyle(element)
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      parseFloat(style.opacity) === 0
    ) {
      return false
    }

    // Check if element has zero dimensions
    if (element.offsetWidth <= 0 && element.offsetHeight <= 0) {
      return false
    }

    // Check parent visibility (important for catching images in hidden containers)
    let parent = element.parentElement
    while (parent) {
      const parentStyle = window.getComputedStyle(parent)
      if (
        parentStyle.display === 'none' ||
        parentStyle.visibility === 'hidden'
      ) {
        return false
      }
      parent = parent.parentElement
    }

    return true
  } catch (e) {
    console.error('Error in isElementCompletelyVisible:', e)
    return true
  }
}

/**
 * Approach 3: Loose visibility check that includes images that could potentially be visible
 * @param {Element} element - The DOM element to check
 * @returns {boolean} - Whether the element is potentially visible
 */
function isElementPotentiallyVisible(element) {
  if (!element) return false

  try {
    // Check for images that are styled with display:none
    if (element.style.display === 'none') {
      return false
    }

    // Ignore images that failed to load
    if (
      element.tagName === 'IMG' &&
      element.complete &&
      element.naturalWidth === 0
    ) {
      return false
    }

    // Check for images that are positioned far offscreen
    const rect = element.getBoundingClientRect()
    const extremelyOffscreen =
      rect.top < -10000 ||
      rect.left < -10000 ||
      rect.bottom > 20000 ||
      rect.right > 20000

    if (extremelyOffscreen) {
      return false
    }

    // Consider everything else potentially visible
    return true
  } catch (e) {
    console.error('Error in isElementPotentiallyVisible:', e)
    return true
  }
}

/**
 * Adds the highlighting style definition to the document
 */
function addHighlightingStyle() {
  // Only add the style if it doesn't already exist
  if (!document.getElementById('seo-extension-highlight-style')) {
    const style = document.createElement('style')
    style.id = 'seo-extension-highlight-style'
    style.textContent = `
      .seo-extension-highlighted-img {
        outline: 5px solid red !important;
        outline-offset: -2px !important;
        box-shadow: 0 0 10px rgba(255, 0, 0, 0.7) !important;
        position: relative !important;
        z-index: 2147483647 !important;
      }
    `
    document.head.appendChild(style)
  }
}

/**
 * Highlights an image with a visible border
 * @param {HTMLImageElement} img - The image to highlight
 */
function highlightImage(img) {
  // Add highlighting class
  img.classList.add('seo-extension-highlighted-img')

  // Also apply inline styles to ensure the highlighting works
  img.style.outline = '5px solid red'
  img.style.outlineOffset = '-2px'
  img.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)'
  img.style.position = 'relative'
  img.style.zIndex = '2147483647' // Maximum z-index value
}

/**
 * Removes highlighting from all previously highlighted images
 */
function removeImageHighlighting() {
  // Remove highlighting class and inline styles from elements
  document.querySelectorAll('.seo-extension-highlighted-img').forEach((img) => {
    img.classList.remove('seo-extension-highlighted-img')
    img.style.outline = ''
    img.style.outlineOffset = ''
    img.style.boxShadow = ''
    img.style.position = ''
    img.style.zIndex = ''
  })

  // Also remove any a11y-check-highlighted class (from your original code)
  document.querySelectorAll('.a11y-check-highlighted').forEach((el) => {
    el.classList.remove('a11y-check-highlighted')
    el.style.outline = ''
    el.style.outlineOffset = ''
  })

  // Remove the highlighting style if it exists
  const style = document.getElementById('seo-extension-highlight-style')
  if (style) {
    style.remove()
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Keep all existing message handlers
  if (request.action === 'getOverview') {
    // Enhanced canonical detection logic
    // 1. First try with querySelector (your current method)
    let canonicalElement = document.querySelector('link[rel="canonical"]')

    // 2. If not found, try with getElementsByTagName which can sometimes catch elements missed by querySelector
    if (!canonicalElement) {
      const allLinks = document.getElementsByTagName('link')
      for (let i = 0; i < allLinks.length; i++) {
        if (allLinks[i].getAttribute('rel') === 'canonical') {
          canonicalElement = allLinks[i]
          break
        }
      }
    }

    // 3. Look in the raw HTML as a last resort (for dynamically added or malformed tags)
    if (!canonicalElement) {
      const htmlContent = document.documentElement.outerHTML
      const canonicalRegex =
        /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i
      const match = htmlContent.match(canonicalRegex)

      if (match && match[1]) {
        // Create a temporary element to extract the href properly
        const tempLink = document.createElement('a')
        tempLink.href = match[1]

        // Create a synthetic canonicalElement with an href getter
        canonicalElement = {
          get href() {
            return tempLink.href // This returns the absolute URL
          },
        }
      }
    }

    // Now determine if canonical exists and get its href
    const canonicalHref = canonicalElement ? canonicalElement.href : null

    const overview = {
      publisher:
        document.querySelector('meta[name="publisher"]')?.content || '',
      language: document.documentElement.lang || '',
      title: {
        content: document.title,
        length: document.title.length,
      },
      description: {
        content:
          document.querySelector('meta[name="description"]')?.content || '',
        length:
          document.querySelector('meta[name="description"]')?.content?.length ||
          0,
      },
      url: {
        current: window.location.href,
        isIndexable: true, // Will be updated based on robots meta
      },
      canonical: {
        href: canonicalHref,
        isSelfReferencing: false,
        exists: !!canonicalHref,
      },
      robots: {
        meta: document.querySelector('meta[name="robots"]')?.content || '',
        xRobotsTag: null, // This will be checked via headers in the popup.js
      },
      keywords: document.querySelector('meta[name="keywords"]')?.content || '',
      wordCount: (() => {
        try {
          // Create a clone of the body
          const clone = document.body.cloneNode(true)

          // Remove only essential non-content elements
          const removeSelectors = [
            'script',
            'style',
            'noscript',
            'iframe',
            'meta',
            'link',
            'head',
            '[style*="display: none"]',
            '[hidden]',
            '[aria-hidden="true"]',
            'select',
            'option',
            'textarea',
            'code',
            'pre',
            '.code',
            '.pre',
          ]

          clone
            .querySelectorAll(removeSelectors.join(','))
            .forEach((el) => el.remove())

          // Include alt text from images
          let text = ''
          clone.querySelectorAll('img[alt]').forEach((img) => {
            const alt = img.getAttribute('alt')
            if (alt && alt.trim() && alt.length > 1) {
              // Only include meaningful alt text
              text += ' ' + alt
            }
          })

          // Get text content from visible elements
          const walker = document.createTreeWalker(
            clone,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                // Skip if parent is hidden
                const style = window.getComputedStyle(node.parentElement)
                if (
                  style.display === 'none' ||
                  style.visibility === 'hidden' ||
                  style.opacity === '0'
                ) {
                  return NodeFilter.FILTER_REJECT
                }

                // Skip empty text nodes or those with just whitespace
                if (!node.textContent.trim()) {
                  return NodeFilter.FILTER_REJECT
                }

                return NodeFilter.FILTER_ACCEPT
              },
            },
            false
          )

          let node
          while ((node = walker.nextNode())) {
            text += ' ' + node.textContent
          }

          // Text cleanup
          text = text
            .replace(/[\r\n\t]+/g, ' ') // Replace newlines and tabs
            .replace(/\s+/g, ' ') // Normalize spaces
            .replace(/[^\w\s'-]+/g, ' ') // Keep only words, spaces, hyphens, apostrophes
            .replace(/(?<=\s)-+|-+(?=\s)/g, ' ') // Handle hyphens
            .replace(/'+(?=\s)|(?<=\s)'+/g, ' ') // Handle apostrophes
            .toLowerCase()
            .trim()

          // Split and count words
          const words = text.split(/\s+/).filter((word) => {
            // Include words that:
            // 1. Are at least 2 characters or are meaningful single characters (like "a")
            // 2. Contain letters or numbers
            // 3. Aren't just symbols
            return (
              (word.length >= 2 || /^[ai]$/.test(word)) &&
              (/[a-z]/.test(word) || /\d/.test(word)) &&
              !/^[-']+$/.test(word)
            )
          })

          return words.length
        } catch (error) {
          console.error('Error calculating word count:', error)
          return 0
        }
      })(),
    }

    // Use normalized URL comparison for self-referencing check
    if (overview.canonical.exists && overview.canonical.href) {
      overview.canonical.isSelfReferencing =
        normalizeUrl(overview.canonical.href) ===
        normalizeUrl(window.location.href)
    }

    // Check indexability based on robots meta
    if (overview.robots.meta) {
      const robotsDirectives = overview.robots.meta
        .toLowerCase()
        .split(',')
        .map((d) => d.trim())
      overview.url.isIndexable = !robotsDirectives.includes('noindex')
    }

    sendResponse({ overview })
  } else if (request.action === 'getImages') {
    const images = Array.from(document.getElementsByTagName('img')).map(
      (img) => ({
        src: img.src,
        alt: img.alt,
        title: img.title,
        width: img.width,
        height: img.height,
      })
    )

    const summary = {
      total: images.length,
      missingAlt: images.filter((img) => !img.alt).length,
      missingTitle: images.filter((img) => !img.title).length,
    }

    sendResponse({
      images: images,
      summary: summary,
    })
  } else if (request.action === 'getLinks') {
    const externalDomains = [
      'e-mailhandtekening.be',
      'btwcalculator.be',
      'facebook.com',
      'instagram.com',
      'linkedin.com',
      'goo.gl',
      'maps.app.goo.gl',
    ]

    const allLinks = Array.from(document.getElementsByTagName('a'))
    const processedLinks = allLinks.map((link) => {
      try {
        const href = link.href
        let isInternal = true

        if (href.startsWith('tel:')) {
          isInternal = false
        } else if (href.startsWith('http')) {
          const url = new URL(href)
          const isExternalDomain = externalDomains.some((domain) =>
            url.hostname.includes(domain)
          )
          if (isExternalDomain) {
            isInternal = false
          }
        }

        return {
          href: href || '#',
          text: link.textContent.trim(),
          isInternal: isInternal,
          hasText: link.textContent.trim().length > 0,
          rel: link.getAttribute('rel') || '',
        }
      } catch (e) {
        return {
          href: link.href || '#',
          text: link.textContent.trim(),
          isInternal: true,
          hasText: link.textContent.trim().length > 0,
          rel: link.getAttribute('rel') || '',
        }
      }
    })

    const metrics = {
      total: processedLinks.length,
      unique: new Set(processedLinks.map((link) => link.href)).size,
      totalInternal: processedLinks.filter((link) => link.isInternal).length,
      totalExternal: processedLinks.filter((link) => !link.isInternal).length,
      uniqueLinks: processedLinks,
    }

    sendResponse({
      links: processedLinks,
      metrics: metrics,
    })
  } else if (request.action === 'getHeadings') {
    const headings = {}
    const structure = []
    let totalHeadings = 0

    // First pass: collect all headings with additional context
    for (let i = 1; i <= 6; i++) {
      const elements = document.getElementsByTagName(`h${i}`)
      headings[`h${i}`] = elements.length
      totalHeadings += elements.length

      Array.from(elements).forEach((heading) => {
        // Check parent elements for navigation context
        let isNavigation = false
        let currentParent = heading.parentElement

        // Check up to 3 levels of parents for navigation-related elements
        for (let j = 0; j < 3 && currentParent; j++) {
          const parentClasses = (currentParent.className || '').toLowerCase()
          const parentId = (currentParent.id || '').toLowerCase()
          const parentTag = currentParent.tagName.toLowerCase()

          if (
            parentTag === 'nav' ||
            parentClasses.includes('nav') ||
            parentClasses.includes('menu') ||
            parentClasses.includes('navigation') ||
            parentId.includes('nav') ||
            parentId.includes('menu') ||
            currentParent.getAttribute('role') === 'navigation'
          ) {
            isNavigation = true
            break
          }

          currentParent = currentParent.parentElement
        }

        structure.push({
          level: i,
          text: heading.textContent.trim(),
          id: heading.id || '',
          classes: Array.from(heading.classList).join(' '),
          isNavigation: isNavigation,
          // Store position in DOM for accurate ordering
          position: getNodePosition(heading),
        })
      })
    }

    // Add special handling for navigation elements that aren't headings
    const navigationElements = document.querySelectorAll(
      'nav, [role="navigation"], .navigation, .nav, .navbar, .menu'
    )
    navigationElements.forEach((navElement) => {
      // Only include text-containing navigation elements
      const textContent = navElement.textContent.trim()
      if (textContent && !isElementCapturedInHeadings(navElement, structure)) {
        structure.push({
          level: 2, // Treat nav elements as h2 by default
          text:
            textContent.substring(0, 50) +
            (textContent.length > 50 ? '...' : ''),
          id: navElement.id || '',
          classes: Array.from(navElement.classList).join(' '),
          isNavigation: true,
          position: getNodePosition(navElement),
        })
      }
    })

    // Sort by DOM position to maintain correct order
    structure.sort((a, b) => {
      return a.position - b.position
    })

    const links = document.getElementsByTagName('a').length
    const images = document.getElementsByTagName('img').length

    sendResponse({
      counts: headings,
      totalHeadings: totalHeadings,
      structure: structure,
      summary: {
        totalLinks: links,
        totalImages: images,
      },
    })
  }
  // NEW HANDLER: Add a handler for robots.txt and sitemap information
  else if (request.action === 'getSitemapInfo') {
    // We'll handle the sitemap detection on the content side
    // First, check if current page has any sitemap links in the HTML
    const sitemapLinks = Array.from(document.querySelectorAll('a'))
      .filter((a) => {
        return (
          a.href &&
          (a.href.includes('sitemap.xml') ||
            a.href.includes('sitemap_index.xml') ||
            a.href.includes('sitemap-index.xml') ||
            a.href.includes('sitemapindex.xml') ||
            a.href.includes('wp-sitemap.xml') ||
            a.href.toLowerCase().includes('sitemap'))
        )
      })
      .map((a) => a.href)

    // Also check for <link> elements that might point to sitemaps
    const sitemapLinkElements = Array.from(
      document.querySelectorAll('link[rel="sitemap"]')
    ).map((link) => link.href)

    // Get the domain from the current URL
    const domain = window.location.origin

    // Combine all found sitemap URLs
    const foundSitemaps = [
      ...new Set([...sitemapLinks, ...sitemapLinkElements]),
    ]

    sendResponse({
      domain: domain,
      foundSitemaps: foundSitemaps,
    })
    return true // Important: Return true to indicate async response
  } else if (request.action === 'getSchema') {
    sendResponse(getAllSchemas())

    function extractSchemaData() {
      const schemas = []

      // Extract JSON-LD schemas
      const jsonLdScripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
      )

      jsonLdScripts.forEach((script, index) => {
        try {
          const jsonContent = JSON.parse(script.textContent)

          // Process JSON-LD content into flattened properties
          const properties = []

          function flattenObject(obj, prefix = '') {
            if (!obj) return

            if (typeof obj === 'object') {
              if (Array.isArray(obj)) {
                obj.forEach((item, index) => {
                  if (typeof item === 'object' && item !== null) {
                    flattenObject(item, `${prefix}${index}`)
                  } else {
                    properties.push({ key: `${prefix}${index}`, value: item })
                  }
                })
              } else {
                Object.keys(obj).forEach((key) => {
                  const value = obj[key]

                  if (typeof value === 'object' && value !== null) {
                    flattenObject(value, `${prefix}${key}@`)
                  } else {
                    properties.push({ key: `${prefix}${key}`, value: value })
                  }
                })
              }
            }
          }

          flattenObject(jsonContent)

          schemas.push({
            type: 'JSON-LD',
            properties: properties,
          })
        } catch (error) {
          console.error('Error parsing JSON-LD:', error)
        }
      })

      // Add code for Microdata and RDFa extraction here...

      return schemas
    }

    try {
      const schemas = extractSchemaData()

      sendResponse({
        schemas: schemas,
        success: true,
      })
    } catch (error) {
      console.error('Schema extraction error:', error)
      sendResponse({
        schemas: [],
        success: false,
        error: error.message,
      })
    }

    return true
  } else if (request.action === 'getSocial') {
    sendResponse({
      social: extractSocialMetadata(),
    })
  } else if (request.action === 'highlightImagesWithNoAlt') {
    if (request.action === 'highlightImagesWithNoAlt') {
      try {
        // Run the highlighting function
        const result = highlightVisibleImagesWithNoAlt(request.highlight)

        // Send the results back
        sendResponse({
          success: true,
          count: result.missingAltCount,
          images: result.imagesWithoutAlt,
        })
      } catch (error) {
        console.error('Error during highlighting:', error)
        sendResponse({
          success: false,
          error: error.message,
        })
      }
    }
  }

  // Helper function to get position of a node in the DOM
  function getNodePosition(node) {
    // Walk the DOM tree and count nodes
    let position = 0
    const walker = document.createTreeWalker(
      document.documentElement,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    )

    while (walker.nextNode()) {
      position++
      if (walker.currentNode === node) {
        return position
      }
    }

    return Infinity // Should never happen
  }

  // Helper function to check if an element is already represented in headings
  function isElementCapturedInHeadings(element, headingsArray) {
    // Check if this element contains any of the headings
    return headingsArray.some((heading) => {
      const headingElement = heading.id
        ? document.getElementById(heading.id)
        : null
      return (
        (headingElement && element.contains(headingElement)) ||
        heading.id === element.id
      )
    })
  }

  // Return true to indicate we might send a response asynchronously
  return true
})

function generateDocumentOutline(headings) {
  let outline = ''
  let previousLevel = 0
  let indent = ''

  headings.forEach((heading) => {
    if (heading.level > previousLevel) {
      indent += '    '
    } else if (heading.level < previousLevel) {
      indent = '    '.repeat(heading.level - 1)
    }

    outline += `${indent}${heading.text}\n`
    previousLevel = heading.level
  })

  return outline
}

function generateXMLStructure(headings) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<headings>\n'

  headings.forEach((heading) => {
    const indent = '    '.repeat(heading.level)
    xml += `${indent}<h${heading.level}`

    if (heading.id) {
      xml += ` id="${heading.id}"`
    }
    if (heading.classes) {
      xml += ` class="${heading.classes}"`
    }

    xml += `>${heading.text}</h${heading.level}>\n`
  })

  xml += '</headings>'
  return xml
}

/**
 * Extracts Open Graph and Twitter Card metadata from the current page
 * @returns {Object} Object containing all social metadata
 */
function extractSocialMetadata() {
  const metadata = {
    og: {},
    twitter: {},
  }

  // Get all meta tags
  const metaTags = document.querySelectorAll('meta')

  // Extract Open Graph metadata
  metaTags.forEach((tag) => {
    // Open Graph tags
    if (
      tag.getAttribute('property') &&
      tag.getAttribute('property').startsWith('og:')
    ) {
      const key = tag.getAttribute('property').replace('og:', '')
      metadata.og[key] = tag.getAttribute('content')
    }

    // Twitter Card tags
    if (
      tag.getAttribute('name') &&
      tag.getAttribute('name').startsWith('twitter:')
    ) {
      const key = tag.getAttribute('name').replace('twitter:', '')
      metadata.twitter[key] = tag.getAttribute('content')
    }
  })

  return metadata
}

function getAllSchemas() {
  const schemas = []

  // 1. Detect JSON-LD schemas (most common)
  const jsonldScripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  )
  jsonldScripts.forEach((script) => {
    try {
      const content = JSON.parse(script.textContent)
      schemas.push({
        type: 'JSON-LD',
        content: content,
      })
    } catch (e) {
      console.error('Error parsing JSON-LD:', e)
    }
  })

  // 2. Detect Microdata schemas
  const itemscopes = document.querySelectorAll('[itemscope]')
  itemscopes.forEach((element) => {
    const properties = []
    const itemType = element.getAttribute('itemtype') || 'Unknown'

    // Get all itemprop elements
    const itemprops = element.querySelectorAll('[itemprop]')
    itemprops.forEach((prop) => {
      let value = ''

      // Extract value based on tag and attributes
      if (prop.tagName === 'META') {
        value = prop.getAttribute('content') || ''
      } else if (prop.tagName === 'IMG') {
        value = prop.getAttribute('src') || ''
      } else if (prop.tagName === 'A') {
        value = prop.getAttribute('href') || prop.textContent.trim()
      } else if (prop.tagName === 'TIME') {
        value = prop.getAttribute('datetime') || prop.textContent.trim()
      } else {
        value = prop.textContent.trim()
      }

      properties.push({
        key: prop.getAttribute('itemprop'),
        value: value,
      })
    })

    if (properties.length > 0) {
      schemas.push({
        type: 'Microdata: ' + itemType.replace('http://schema.org/', ''),
        properties: properties,
      })
    }
  })

  // 3. Detect RDFa schemas
  const rdfaElements = document.querySelectorAll('[typeof]')
  rdfaElements.forEach((element) => {
    const properties = []
    const itemType = element.getAttribute('typeof') || 'Unknown'

    // Get all property elements
    const propElements = element.querySelectorAll('[property]')
    propElements.forEach((prop) => {
      let value = ''

      // Extract value based on tag and attributes
      if (prop.getAttribute('content')) {
        value = prop.getAttribute('content')
      } else if (prop.tagName === 'IMG') {
        value = prop.getAttribute('src') || ''
      } else if (prop.tagName === 'A') {
        value = prop.getAttribute('href') || prop.textContent.trim()
      } else {
        value = prop.textContent.trim()
      }

      properties.push({
        key: prop.getAttribute('property').replace('schema:', ''),
        value: value,
      })
    })

    if (properties.length > 0) {
      schemas.push({
        type: 'RDFa: ' + itemType.replace('schema:', ''),
        properties: properties,
      })
    }
  })

  return { schemas }
}

// Function to normalize URLs for comparison
function normalizeUrl(url) {
  try {
    // Parse the URL
    const parsedUrl = new URL(url)

    // Convert to lowercase
    let normalizedUrl = parsedUrl.toString().toLowerCase()

    // Remove trailing slash if present
    if (normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl.slice(0, -1)
    }

    // Remove 'www.' subdomain if present
    normalizedUrl = normalizedUrl.replace(/^(https?:\/\/)www\./i, '$1')

    // Remove default ports (80 for HTTP, 443 for HTTPS)
    normalizedUrl = normalizedUrl.replace(':80/', '/').replace(':443/', '/')

    // Handle URL fragments and query parameters based on your requirements
    // This example removes them, but you might want different behavior
    const urlWithoutFragment = normalizedUrl.split('#')[0]
    const urlWithoutQuery = urlWithoutFragment.split('?')[0]

    return urlWithoutQuery
  } catch (e) {
    console.error('Error normalizing URL:', e)
    return url // Return original URL if parsing fails
  }
}
