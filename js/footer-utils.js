// Utility function to fetch robots.txt and extract sitemap URLs
export async function getSitemapFromRobots(domain) {
  try {
    // Ensure domain starts with protocol
    const fullDomain = domain.startsWith('http') ? domain : `https://${domain}`

    const response = await fetch(`${fullDomain}/robots.txt`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Kreatix SEO Analyse Tool',
      },
    })

    // Check if response is successful
    if (!response.ok) {
      console.log(`No robots.txt found at ${fullDomain}/robots.txt`)
      return []
    }

    const text = await response.text()

    // Look for Sitemap: directives in robots.txt
    const sitemapMatches = text.match(/^Sitemap:\s*(.+)$/gim)
    if (sitemapMatches && sitemapMatches.length > 0) {
      // Extract and validate URLs from all Sitemap: directives
      return sitemapMatches.map((match) => {
        const url = match.replace(/^Sitemap:\s*/i, '').trim()

        // If URL is relative, make it absolute
        if (!url.startsWith('http')) {
          return new URL(url, fullDomain).href
        }

        return url
      })
    }

    return []
  } catch (error) {
    console.error('Error fetching robots.txt:', error)
    return []
  }
}

// Function to check if a URL exists (returns HTTP status)
export async function checkUrlExists(url) {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Kreatix SEO Analyse Tool',
      },
    })

    clearTimeout(timeoutId)
    return response.status
  } catch (error) {
    console.error('Error checking URL:', error)
    return 404
  }
}

// Function to find working sitemap URL
export async function findSitemapUrl(domain) {
  // Ensure domain starts with protocol
  const fullDomain = domain.startsWith('http') ? domain : `https://${domain}`

  // First try to get sitemap from robots.txt
  const sitemapsFromRobots = await getSitemapFromRobots(fullDomain)
  if (sitemapsFromRobots.length > 0) {
    // Return the first valid sitemap URL from robots.txt
    for (const url of sitemapsFromRobots) {
      const status = await checkUrlExists(url)
      if (status >= 200 && status < 400) {
        return url
      }
    }
  }

  // Get any sitemaps found in the page content via content script
  const sitemapsInPage = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'getSitemapInfo' },
        (response) => {
          if (
            response &&
            response.foundSitemaps &&
            response.foundSitemaps.length > 0
          ) {
            resolve(response.foundSitemaps)
          } else {
            resolve([])
          }
        }
      )
    })
  })

  // Check each sitemap from the page
  for (const url of sitemapsInPage) {
    const status = await checkUrlExists(url)
    if (status >= 200 && status < 400) {
      return url
    }
  }

  // Common sitemap filename patterns to try
  const sitemapPatterns = [
    '/sitemap_index.xml',
    '/sitemap.xml',
    '/sitemap-index.xml',
    '/sitemapindex.xml',
    '/wp-sitemap.xml', // WordPress
    '/sitemap.php', // Some CMS systems
  ]

  // Check each pattern
  for (const pattern of sitemapPatterns) {
    const url = `${fullDomain}${pattern}`
    const status = await checkUrlExists(url)
    if (status >= 200 && status < 400) {
      return url
    }
  }

  // Default fallback
  return `${fullDomain}/sitemap.xml`
}

// Setup footer links function
export async function setupFooterLinks(currentDomain) {
  if (!currentDomain) {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (tabs[0] && tabs[0].url) {
        const url = new URL(tabs[0].url)
        currentDomain = `${url.protocol}//${url.hostname}`
      } else {
        console.error('Could not retrieve current domain')
        return
      }
    } catch (error) {
      console.error('Error retrieving domain:', error)
      return
    }
  }
  // Ensure domain starts with protocol
  const fullDomain = currentDomain.startsWith('http')
    ? currentDomain
    : `https://${currentDomain}`

  const robotsLink = document.getElementById('robotsLink')
  const sitemapLink = document.getElementById('sitemapLink')
  const sitemapLoader = document.getElementById('sitemapLoader')

  if (robotsLink) {
    robotsLink.href = `${fullDomain}/robots.txt`
    robotsLink.addEventListener('click', async (e) => {
      e.preventDefault()
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      chrome.tabs.create({
        url: `${fullDomain}/robots.txt`,
        index: tabs[0].index + 1,
      })
    })
  }

  if (sitemapLink) {
    // Show loading indicator or disable link until we find the sitemap
    if (sitemapLoader) sitemapLoader.style.display = 'inline'
    sitemapLink.classList.add('loading')

    try {
      // Find the actual sitemap URL
      const sitemapUrl = await findSitemapUrl(fullDomain)

      // Update the link with the found URL
      sitemapLink.href = sitemapUrl
      console.log('Found sitemap URL:', sitemapUrl)

      sitemapLink.addEventListener('click', async (e) => {
        e.preventDefault()
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })
        chrome.tabs.create({
          url: sitemapUrl,
          index: tabs[0].index + 1,
        })
      })
    } catch (error) {
      console.error('Error finding sitemap:', error)
      // In case of error, set a default sitemap URL
      sitemapLink.href = `${fullDomain}/sitemap.xml`
    } finally {
      // Hide loader in all cases
      if (sitemapLoader) sitemapLoader.style.display = 'none'
      sitemapLink.classList.remove('loading')
    }
  }
}
