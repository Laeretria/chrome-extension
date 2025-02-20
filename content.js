console.log('Content script loaded!')

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Inside your existing message listener
  if (request.action === 'getImages') {
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
  }
  // Add this to your existing message listener
  if (request.action === 'getHeadings') {
    // Get all headings
    const headings = {}
    const headingStructure = []
    let totalHeadings = 0

    // Collect counts for each heading level
    for (let i = 1; i <= 6; i++) {
      const elements = document.getElementsByTagName(`h${i}`)
      headings[`h${i}`] = elements.length
      totalHeadings += elements.length

      // Collect structure info
      Array.from(elements).forEach((heading) => {
        headingStructure.push({
          level: i,
          text: heading.textContent.trim(),
          id: heading.id || '',
          classes: Array.from(heading.classList).join(' '),
        })
      })
    }

    // Get page summary data
    const links = document.getElementsByTagName('a').length
    const images = document.getElementsByTagName('img').length

    // Get document outline
    const outline = generateDocumentOutline(headingStructure)

    sendResponse({
      counts: headings,
      totalHeadings: totalHeadings,
      structure: headingStructure,
      summary: {
        totalLinks: links,
        totalImages: images,
      },
      outline: outline,
    })
  }

  function generateDocumentOutline(headings) {
    let outline = ''
    let previousLevel = 0
    let indent = ''

    headings.forEach((heading) => {
      // Adjust indentation based on heading level
      if (heading.level > previousLevel) {
        indent += '    ' // 4 spaces for each level
      } else if (heading.level < previousLevel) {
        indent = '    '.repeat(heading.level - 1) // Reset indent for higher levels
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
  if (request.action === 'getLinks') {
    console.log('Analyzing links...')

    // Get all anchor tags
    const allLinks = Array.from(document.getElementsByTagName('a'))

    // Define exact external domains to match
    const externalDomains = [
      'e-mailhandtekening.be',
      'btwcalculator.be',
      'facebook.com',
      'instagram.com',
      'linkedin.com',
      'goo.gl',
      'maps.app.goo.gl',
    ]

    // Process all links including duplicates
    const processedLinks = allLinks.map((link) => {
      try {
        const href = link.href
        let isInternal = true // Default to internal

        // Handle tel: links
        if (href.startsWith('tel:')) {
          isInternal = false
        }
        // Handle regular URLs
        else if (href.startsWith('http')) {
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
        }
      } catch (e) {
        // If URL parsing fails, count as internal
        return {
          href: link.href || '#',
          text: link.textContent.trim(),
          isInternal: true,
          hasText: link.textContent.trim().length > 0,
        }
      }
    })

    // Create unique links array
    const uniqueLinks = Array.from(
      new Set(processedLinks.map((link) => link.href))
    ).map((href) => processedLinks.find((link) => link.href === href))

    // Calculate metrics
    const totalInternalLinks = processedLinks.filter(
      (link) => link.isInternal
    ).length
    const totalExternalLinks = processedLinks.filter(
      (link) => !link.isInternal
    ).length

    // Log all external links for debugging
    const externalLinks = processedLinks.filter((link) => !link.isInternal)
    console.log(
      'External links:',
      externalLinks.map((link) => link.href)
    )

    sendResponse({
      links: processedLinks,
      metrics: {
        total: processedLinks.length,
        unique: uniqueLinks.length,
        totalInternal: totalInternalLinks,
        totalExternal: totalExternalLinks,
        uniqueLinks: uniqueLinks,
      },
    })
  }
  return true
})
