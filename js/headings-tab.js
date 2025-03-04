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

    newCopyButton.addEventListener('click', () => {
      // Format headings with perfect left alignment and fix all whitespace issues
      const headingsText = structure
        .map((heading) => {
          const tagPart = `H${heading.level}: `
          return tagPart + normalizeText(heading.text)
        })
        .join('\n')

      navigator.clipboard.writeText(headingsText).then(() => {
        newCopyButton.textContent = 'Gekopieërd'
        setTimeout(() => {
          newCopyButton.textContent = 'Kopiëren'
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
    ['Level', 'Text', 'ID', 'Classes', 'Is Navigation'],
    ...headings.map((heading) => [
      `H${heading.level}`,
      normalizeText(heading.text) || '',
      heading.id || '',
      heading.classes || '',
      heading.isNavigation ? 'Yes' : 'No',
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
