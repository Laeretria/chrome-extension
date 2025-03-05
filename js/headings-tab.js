// Import footer utilities to ensure footer links work
import { setupFooterLinks } from './footer-utils.js'
import { currentWebsiteDomain } from './domain-utils.js'

export function updateHeadingsUI(response) {
  const { counts, structure, summary } = response

  // Update heading count statistics
  for (let i = 1; i <= 6; i++) {
    const countElement = document.getElementById(`h${i}-count`)
    if (countElement) {
      countElement.textContent = counts[`h${i}`] || 0
    }

    // Also update the overview tab stats if they exist
    const overviewCountElement = document.getElementById(`overview-h${i}-count`)
    if (overviewCountElement) {
      overviewCountElement.textContent = counts[`h${i}`] || 0
    }
  }

  // Add warning for multiple H1 tags
  const h1Count = counts.h1 || 0
  const structureList = document.getElementById('headingsStructure')

  if (structureList) {
    // Clear the structure list
    structureList.innerHTML = ''

    // Add warning message if multiple H1 tags are detected
    if (h1Count > 1) {
      const warningDiv = document.createElement('div')
      warningDiv.className = 'heading-warning multiple-h1-warning'

      warningDiv.innerHTML = `
        <strong>Warning:</strong> Found ${h1Count} H1 tags on this page. 
        For optimal SEO, it's recommended to have only one H1 tag per page.
      `

      structureList.appendChild(warningDiv)
    }

    // Display all headings in DOM order with proper indentation
    structure.forEach((heading) => {
      const headingDiv = document.createElement('div')
      headingDiv.className = 'heading-item'
      headingDiv.setAttribute('data-level', heading.level)

      const tagSpan = document.createElement('span')
      tagSpan.className = 'heading-tag'
      tagSpan.textContent = `H${heading.level}`

      // Set tag color based on heading level
      const colors = {
        1: '#e9f5ff', // Light blue
        2: '#e3f1e3', // Light green
        3: '#fff8e1', // Light yellow
        4: '#f3e5f5', // Light purple
        5: '#e8eaf6', // Light indigo
        6: '#fbe9e7', // Light orange
      }
      tagSpan.style.backgroundColor = colors[heading.level] || '#f5f5f5'

      // Add navigation indicator if heading is part of navigation
      if (heading.isNavigation) {
        tagSpan.style.borderLeft = '3px solid #1448ff'
      }

      // Highlight H1 tags if there are multiple
      if (heading.level === 1 && h1Count > 1) {
        tagSpan.classList.add('multiple-h1-tag')
      }

      const textSpan = document.createElement('span')
      textSpan.className = 'heading-text'
      textSpan.textContent = heading.text

      headingDiv.appendChild(tagSpan)
      headingDiv.appendChild(textSpan)
      structureList.appendChild(headingDiv)
    })
  }

  // Update images and links counts
  const linksElement = document.getElementById('headingsPageLinks')
  const imagesElement = document.getElementById('headingsPageImages')

  if (linksElement) linksElement.textContent = summary.totalLinks || 0
  if (imagesElement) imagesElement.textContent = summary.totalImages || 0

  // Helper function to normalize text by removing extra whitespace
  function normalizeText(text) {
    return text
      .replace(/[\n\r\t]+/g, ' ') // Replace all newlines and tabs with spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces to a single space
      .trim() // Remove spaces from beginning and end
  }

  // Update the copy button functionality
  const copyButton = document.getElementById('copyHeadings')
  if (copyButton) {
    // Remove any existing click handlers to prevent duplicates
    const newCopyButton = copyButton.cloneNode(true)
    copyButton.parentNode.replaceChild(newCopyButton, copyButton)

    // Define SVG icons
    const copySvg = `<svg viewBox="0 0 24 24" 
              width="18"
              height="18"
              fill="currentColor"
              stroke-width="1.5"
              xmlns="http://www.w3.org/2000/svg"
              style="margin-right: 4px; vertical-align: middle;">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M15.24 2H11.3458C9.58159 1.99999 8.18418 1.99997 7.09054 2.1476C5.96501 2.29953 5.05402 2.61964 4.33559 3.34096C3.61717 4.06227 3.29833 4.97692 3.14701 6.10697C2.99997 7.205 2.99999 8.60802 3 10.3793V16.2169C3 17.725 3.91995 19.0174 5.22717 19.5592C5.15989 18.6498 5.15994 17.3737 5.16 16.312L5.16 11.3976L5.16 11.3024C5.15993 10.0207 5.15986 8.91644 5.27828 8.03211C5.40519 7.08438 5.69139 6.17592 6.4253 5.43906C7.15921 4.70219 8.06404 4.41485 9.00798 4.28743C9.88877 4.16854 10.9887 4.1686 12.2652 4.16867L12.36 4.16868H15.24L15.3348 4.16867C16.6113 4.1686 17.7088 4.16854 18.5896 4.28743C18.0627 2.94779 16.7616 2 15.24 2Z" fill="#ffffff"></path> <path d="M6.6001 11.3974C6.6001 8.67119 6.6001 7.3081 7.44363 6.46118C8.28716 5.61426 9.64481 5.61426 12.3601 5.61426H15.2401C17.9554 5.61426 19.313 5.61426 20.1566 6.46118C21.0001 7.3081 21.0001 8.6712 21.0001 11.3974V16.2167C21.0001 18.9429 21.0001 20.306 20.1566 21.1529C19.313 21.9998 17.9554 21.9998 15.2401 21.9998H12.3601C9.64481 21.9998 8.28716 21.9998 7.44363 21.1529C6.6001 20.306 6.6001 18.9429 6.6001 16.2167V11.3974Z" fill="#ffffff"></path> </g></svg>`

    // Set initial button content with copy icon
    newCopyButton.innerHTML = copySvg + 'Kopiëren'

    newCopyButton.addEventListener('click', () => {
      // Format headings with perfect left alignment and fix all whitespace issues
      const headingsText = structure
        .map((heading) => {
          const tagPart = `H${heading.level}: `
          return tagPart + normalizeText(heading.text)
        })
        .join('\n')

      navigator.clipboard.writeText(headingsText).then(() => {
        // Change to check icon and "Gekopieërd" text
        newCopyButton.innerHTML = copySvg + 'Gekopieërd'

        setTimeout(() => {
          // Change back to copy icon and "Kopiëren" text
          newCopyButton.innerHTML = copySvg + 'Kopiëren'
        }, 2000)
      })
    })
  }

  // Add export button for headings
  const exportHeadingsButton = document.getElementById('exportHeadings')
  if (exportHeadingsButton) {
    // Remove any existing click handlers
    const newExportButton = exportHeadingsButton.cloneNode(true)
    exportHeadingsButton.parentNode.replaceChild(
      newExportButton,
      exportHeadingsButton
    )

    newExportButton.addEventListener('click', () => {
      exportHeadings(structure, `${currentWebsiteDomain}_headings.csv`)
    })
  }

  // Setup footer links
  setupFooterLinks(currentWebsiteDomain)
}

export function exportHeadings(headings, filename) {
  // Helper function to normalize text by removing extra whitespace
  function normalizeText(text) {
    return text
      .replace(/[\n\r\t]+/g, ' ') // Replace all newlines and tabs with spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces to a single space
      .trim() // Remove spaces from beginning and end
  }

  const csvContent = [
    ['Level', 'Text'],
    ...headings.map((heading) => [
      `H${heading.level}`,
      normalizeText(heading.text) || '',
    ]),
  ]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
