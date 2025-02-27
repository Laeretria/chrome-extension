// Function to find working sitemap URL
export async function findSitemapUrl(domain) {
  // First try to get sitemap from robots.txt
  const sitemapsFromRobots = await getSitemapFromRobots(domain)
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
    const url = `${domain}${pattern}`
    const status = await checkUrlExists(url)
    if (status >= 200 && status < 400) {
      return url
    }
  }

  // Default fallback
  return `${domain}/sitemap.xml`
}
