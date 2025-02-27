// Function to extract domain name in a clean format for filenames
export function getCleanDomainName(url) {
  try {
    const urlObj = new URL(url)
    // Remove www. prefix if present and get hostname
    let fullDomain = urlObj.hostname.replace(/^www\./, '')

    // Extract just the first part of the domain (before the first dot)
    let mainDomain = fullDomain.split('.')[0]

    return mainDomain
  } catch (error) {
    console.error('Error parsing URL:', error)
    return 'website' // Fallback name
  }
}

// Initialize current domain - call this early in your code
export async function initCurrentDomain() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs && tabs[0] && tabs[0].url) {
      const url = tabs[0].url
      currentWebsiteDomain = getCleanDomainName(url)
      console.log('Current website domain:', currentWebsiteDomain)
    }
  } catch (error) {
    console.error('Error getting current domain:', error)
    currentWebsiteDomain = 'website' // Fallback
  }
}
