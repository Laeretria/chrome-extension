chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getOverview') {
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
        href:
          document.querySelector('link[rel="canonical"]')?.href ||
          window.location.href,
        isSelfReferencing: true, // Will be updated in the comparison
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

    // Check if canonical is self-referencing
    overview.canonical.isSelfReferencing =
      overview.canonical.href === window.location.href

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

    for (let i = 1; i <= 6; i++) {
      const elements = document.getElementsByTagName(`h${i}`)
      headings[`h${i}`] = elements.length
      totalHeadings += elements.length

      Array.from(elements).forEach((heading) => {
        structure.push({
          level: i,
          text: heading.textContent.trim(),
          id: heading.id || '',
          classes: Array.from(heading.classList).join(' '),
        })
      })
    }

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
