/* Runs in the context of the webpage
Collects information about all images on the page
Extracts src, alt text, and dimensions
Sends data back to the popup */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getImages') {
    const images = Array.from(document.getElementsByTagName('img')).map(
      (img) => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
      })
    )

    sendResponse({ images: images })
  } else if (request.action === 'getLinks') {
    const currentDomain = window.location.hostname
    const links = Array.from(document.getElementsByTagName('a')).map((link) => {
      const url = new URL(link.href, window.location.href)
      const isInternal = url.hostname === currentDomain

      return {
        href: link.href,
        text: link.textContent.trim(),
        isInternal: isInternal,
        hasText: link.textContent.trim().length > 0,
      }
    })

    sendResponse({ links: links })
  }
  return true // Keep the message channel open for async response
})
