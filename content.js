console.log('Content script loaded!')

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
