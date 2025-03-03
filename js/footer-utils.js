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
  let sitemapsInPage = []
  try {
    sitemapsInPage = await new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) {
          console.error('No active tab found')
          resolve([])
          return
        }

        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'getSitemapInfo' },
          (response) => {
            // Handle potential chrome.runtime.lastError
            if (chrome.runtime.lastError) {
              console.error('Error in sendMessage:', chrome.runtime.lastError)
              resolve([])
              return
            }

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
  } catch (error) {
    console.error('Error getting sitemaps from page:', error)
  }

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

// Helper function to safely get current domain
async function getCurrentDomain() {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })

    if (tabs[0] && tabs[0].url) {
      const url = new URL(tabs[0].url)
      return `${url.protocol}//${url.hostname}`
    } else {
      console.error('Could not retrieve current domain')
      return null
    }
  } catch (error) {
    console.error('Error retrieving domain:', error)
    return null
  }
}

// Track which links have already been set up to prevent duplicates
const setupCompletedLinks = new Set()

// Setup footer links function with support for different tab IDs
export async function setupFooterLinks(currentDomain) {
  console.log('Setting up footer links for domain:', currentDomain)

  // If no domain provided, try to get it from the active tab
  if (!currentDomain) {
    currentDomain = await getCurrentDomain()
    if (!currentDomain) {
      console.error('Failed to determine domain')
      return
    }
  }

  // Ensure domain starts with protocol
  const fullDomain = currentDomain.startsWith('http')
    ? currentDomain
    : `https://${currentDomain}`

  console.log('Using domain:', fullDomain)

  // Check for elements with different possible ID prefixes
  const possiblePrefixes = ['', 'headings-', 'overview-']

  for (const prefix of possiblePrefixes) {
    const robotsLinkId = `${prefix}robotsLink`
    const sitemapLinkId = `${prefix}sitemapLink`
    const sitemapLoaderId = `${prefix}sitemapLoader`

    // Skip if we've already set up these links
    if (
      setupCompletedLinks.has(robotsLinkId) ||
      setupCompletedLinks.has(sitemapLinkId)
    ) {
      console.log(`Links with prefix '${prefix}' already set up, skipping`)
      continue
    }

    console.log(`Looking for robotsLink with ID: ${robotsLinkId}`)
    console.log(`Looking for sitemapLink with ID: ${sitemapLinkId}`)

    const robotsLink = document.getElementById(robotsLinkId)
    const sitemapLink = document.getElementById(sitemapLinkId)
    const sitemapLoader = document.getElementById(sitemapLoaderId)

    if (robotsLink) {
      console.log(`Found robotsLink with ID: ${robotsLinkId}`)

      // Mark this link as set up to avoid duplicates
      setupCompletedLinks.add(robotsLinkId)

      // Clear any existing event listeners by replacing with a clone
      const newRobotsLink = robotsLink.cloneNode(true)
      if (robotsLink.parentNode) {
        robotsLink.parentNode.replaceChild(newRobotsLink, robotsLink)
      }

      // Set the href
      const robotsTxtUrl = `${fullDomain}/robots.txt`
      newRobotsLink.href = robotsTxtUrl

      // Add click event listener
      newRobotsLink.addEventListener('click', (e) => {
        e.preventDefault()
        console.log(`Opening robots.txt: ${robotsTxtUrl}`)

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error in chrome.tabs.query:',
              chrome.runtime.lastError
            )
            return
          }

          if (!tabs || !tabs[0]) {
            console.error('No active tab found')
            return
          }

          chrome.tabs.create({
            url: robotsTxtUrl,
            index: tabs[0].index + 1,
          })
        })
      })
    }

    if (sitemapLink) {
      console.log(`Found sitemapLink with ID: ${sitemapLinkId}`)

      // Mark this link as set up to avoid duplicates
      setupCompletedLinks.add(sitemapLinkId)

      // Show loading indicator if available
      if (sitemapLoader) sitemapLoader.style.display = 'inline'
      sitemapLink.classList.add('loading')

      // Find the sitemap URL and set up the link
      findSitemapUrl(fullDomain)
        .then((sitemapUrl) => {
          console.log(`Found sitemap URL for ${prefix}:`, sitemapUrl)

          // Clear any existing event listeners by replacing with a clone
          const newSitemapLink = sitemapLink.cloneNode(true)
          if (sitemapLink.parentNode) {
            sitemapLink.parentNode.replaceChild(newSitemapLink, sitemapLink)
          }

          // Update the link with found URL
          newSitemapLink.href = sitemapUrl
          newSitemapLink.classList.remove('loading')

          // Add click event listener
          newSitemapLink.addEventListener('click', (e) => {
            e.preventDefault()
            console.log(`Opening sitemap: ${sitemapUrl}`)

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (chrome.runtime.lastError) {
                console.error(
                  'Error in chrome.tabs.query:',
                  chrome.runtime.lastError
                )
                return
              }

              if (!tabs || !tabs[0]) {
                console.error('No active tab found')
                return
              }

              chrome.tabs.create({
                url: sitemapUrl,
                index: tabs[0].index + 1,
              })
            })
          })

          // Hide the loader
          if (sitemapLoader) sitemapLoader.style.display = 'none'
        })
        .catch((error) => {
          console.error(`Error finding sitemap for ${prefix}:`, error)

          // In case of error, set a default sitemap URL
          sitemapLink.href = `${fullDomain}/sitemap.xml`

          // Hide the loader
          if (sitemapLoader) sitemapLoader.style.display = 'none'
          sitemapLink.classList.remove('loading')
        })
    }
  }
}
