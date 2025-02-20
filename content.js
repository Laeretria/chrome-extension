chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
