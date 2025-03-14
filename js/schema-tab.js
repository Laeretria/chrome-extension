import { currentWebsiteDomain } from './domain-utils.js'

export function updateSchemaUI(response) {
  const container = document.getElementById('schema-container')
  if (!container) {
    console.error('Schema container not found')
    return
  }

  const loadingElement = document.getElementById('loading-schemas')
  if (loadingElement) {
    loadingElement.classList.add('hidden')
  }

  // Clear container
  container.innerHTML = ''

  // Check if we have schema data
  if (!response || !response.schemas || response.schemas.length === 0) {
    container.innerHTML =
      '<div class="no-data">Geen schema data gevonden op deze pagina.</div>'
    return
  }

  // Create a button container at the top-right
  const buttonContainer = document.createElement('div')
  buttonContainer.style.width = '100%'
  buttonContainer.style.display = 'flex'
  buttonContainer.style.justifyContent = 'flex-end'
  buttonContainer.style.gap = '10px'
  buttonContainer.style.marginBottom = '15px'

  // Add search bar
  const searchContainer = document.createElement('div')
  searchContainer.style.display = 'flex'
  searchContainer.style.width = '100%'
  searchContainer.style.maxWidth = '300px'
  searchContainer.style.position = 'relative'

  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.placeholder = 'Zoeken...'
  searchInput.style.width = '100%'
  searchInput.style.padding = '8px 12px'
  searchInput.style.paddingLeft = '32px' // Space for the icon
  searchInput.style.borderRadius = '6px'
  searchInput.style.border = '1px solid #e7e9f1'
  searchInput.style.fontSize = '14px'
  searchInput.style.color = '#424861'

  // Add this event listener for the focus state
  searchInput.addEventListener('focus', function () {
    this.style.outline = 'none'
    this.style.border = '1px solid #e7e9f1' // Active border style
    this.style.boxShadow = '0 0 0 1px rgba(20, 72, 255, 0.1)' // Optional: light blue glow for better UX
  })

  // Add this event listener for when focus is lost
  searchInput.addEventListener('blur', function () {
    this.style.border = '1px solid #e7e9f1'
    this.style.boxShadow = 'none'
  })

  // Add search icon
  const searchIcon = document.createElement('div')
  searchIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #666;">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `
  searchContainer.appendChild(searchIcon)
  searchContainer.appendChild(searchInput)
  buttonContainer.appendChild(searchContainer)

  // Clear search button (hidden initially)
  const clearSearchButton = document.createElement('button')
  clearSearchButton.innerHTML = '×'
  clearSearchButton.style.position = 'absolute'
  clearSearchButton.style.right = '8px'
  clearSearchButton.style.top = '50%'
  clearSearchButton.style.transform = 'translateY(-50%)'
  clearSearchButton.style.background = 'transparent'
  clearSearchButton.style.border = 'none'
  clearSearchButton.style.fontSize = '18px'
  clearSearchButton.style.cursor = 'pointer'
  clearSearchButton.style.color = '#666'
  clearSearchButton.style.display = 'none'
  clearSearchButton.title = 'Zoekopdracht wissen'
  searchContainer.appendChild(clearSearchButton)

  // Add event listener for the clear button
  clearSearchButton.addEventListener('click', () => {
    // Clear search input
    searchInput.value = ''
    clearSearchButton.style.display = 'none'

    // Get the container element
    const container = document.getElementById('schema-container')

    // Try to completely reset by rebuilding the UI
    if (response && response.schemas) {
      // First store the search UI
      const searchUIElement = buttonContainer.cloneNode(true)

      // Clear the container
      container.innerHTML = ''

      // Add back the search UI
      container.appendChild(searchUIElement)

      // Recreate the schema display from scratch
      updateSchemaUI(response)

      // Reattach event listeners for the new search UI elements
      const newSearchInput = searchUIElement.querySelector('input[type="text"]')
      const newClearButton = searchUIElement.querySelector('button')

      if (newSearchInput) {
        newSearchInput.addEventListener('input', function () {
          const searchTerm = this.value.trim().toLowerCase()
          newClearButton.style.display = searchTerm ? 'block' : 'none'
          filterSchemaElements(searchTerm)
        })
      }

      if (newClearButton) {
        newClearButton.addEventListener('click', () => {
          window.location.reload() // Last resort: just reload the page
        })
      }
    } else {
      // If we can't access the original response, reload the page
      window.location.reload()
    }
  })

  container.appendChild(buttonContainer)

  // Group identical schemas (especially for ratings)
  const groupedSchemas = groupSimilarSchemas(response.schemas)

  // Store schema sections for search functionality
  const schemaSections = []

  // Process and display each schema group
  groupedSchemas.forEach((schemaGroup, groupIndex) => {
    const { schema, count } = schemaGroup

    // Create a schema section
    const schemaSection = document.createElement('div')
    schemaSection.style.backgroundColor = '#f5f9ff'
    schemaSection.style.borderRadius = '6px'
    schemaSection.dataset.schemaIndex = groupIndex
    container.appendChild(schemaSection)

    // Add this line to select all children except the last one
    container.querySelectorAll('div:not(:last-child)').forEach((div) => {
      div.style.marginBottom = '15px'
    })

    // Add to schema sections array for search functionality
    schemaSections.push(schemaSection)

    // Add schema type header
    const schemaHeader = document.createElement('div')
    schemaHeader.style.fontSize = '16px'
    schemaHeader.style.fontWeight = 'bold'
    schemaHeader.style.padding = '10px'
    schemaHeader.style.backgroundColor = '#1448ff'
    schemaHeader.style.color = 'white'
    schemaHeader.style.borderRadius = '6px 6px 0 0'

    schemaHeader.setAttribute('data-schema-header', 'true')

    // Determine schema type and add a counter
    let schemaType = 'Unknown Schema'
    if (schema.type) {
      schemaType = schema.type
    } else if (schema.content && schema.content['@type']) {
      schemaType = schema.content['@type']
    } else if (
      schema.content &&
      schema.content['@context'] &&
      schema.content['@context'].includes('schema.org')
    ) {
      schemaType = 'Schema.org'
    }

    // Show count if there are duplicates
    const countText = count > 1 ? ` (${count} instances)` : ''
    schemaHeader.textContent = `${schemaType} #${groupIndex + 1}${countText}`
    schemaSection.appendChild(schemaHeader)

    // Create a table for this schema's data
    const schemaTable = document.createElement('div')
    schemaTable.style.display = 'table'
    schemaTable.style.width = '100%'
    schemaTable.style.borderCollapse = 'collapse'
    schemaTable.style.backgroundColor = '#e6f3ff'
    schemaTable.style.borderRadius = '0 0 6px 6px'
    schemaTable.style.overflow = 'hidden'
    schemaSection.appendChild(schemaTable)

    // Special handling for JSON-LD with @graph structure
    if (
      schema.content &&
      schema.content['@graph'] &&
      Array.isArray(schema.content['@graph'])
    ) {
      // Add context row
      addTableRow(
        schemaTable,
        '@context',
        schema.content['@context'],
        0,
        '@context'
      )

      // Process each graph item's properties
      schema.content['@graph'].forEach((item, graphIndex) => {
        Object.keys(item)
          .sort()
          .forEach((key, propIndex) => {
            const value = item[key]
            const rowIndex =
              propIndex + 2 + graphIndex * Object.keys(item).length
            const fullKey = `@graph[${graphIndex}].${key}`
            // Extract just the property name for display
            const displayKey = key

            if (typeof value !== 'object' || value === null) {
              addTableRow(schemaTable, fullKey, value, rowIndex, displayKey)
            } else if (Array.isArray(value)) {
              // Skip showing array placeholders
              // Don't add a row for this
            } else {
              // Display object reference
              const objectId = value['@id'] || ''
              if (objectId) {
                addTableRow(
                  schemaTable,
                  fullKey,
                  objectId,
                  rowIndex,
                  displayKey
                )
              } else {
                // Skip showing object placeholders
                // Don't add a row for this

                // Add nested object properties
                Object.entries(value).forEach(
                  ([nestedKey, nestedValue], nestedIndex) => {
                    if (
                      typeof nestedValue !== 'object' ||
                      nestedValue === null
                    ) {
                      const nestedRowIndex = rowIndex + nestedIndex + 1
                      const nestedFullKey = `${fullKey}.${nestedKey}`
                      // Extract just the property name for display
                      const nestedDisplayKey = nestedKey
                      addTableRow(
                        schemaTable,
                        nestedFullKey,
                        nestedValue,
                        nestedRowIndex,
                        nestedDisplayKey
                      )
                    }
                  }
                )
              }
            }
          })
      })
    } else {
      // For non-graph schemas, process properties
      let schemaProperties = []
      if (schema.properties && Array.isArray(schema.properties)) {
        schemaProperties = schema.properties
      } else if (schema.content) {
        schemaProperties = extractPropertiesImproved(schema.content)
      }

      // Sort properties alphabetically
      schemaProperties.sort((a, b) => a.key.localeCompare(b.key))

      // Add each property as a table row
      schemaProperties.forEach((prop, index) => {
        if (!prop.key) return

        // Extract just the property name for display
        const parts = prop.key.split(/[\.\[\]@]/)
        const displayKey = parts[parts.length - 1] || parts[parts.length - 2] // Handle cases where the last part is empty

        addTableRow(schemaTable, prop.key, prop.value, index, displayKey)
      })
    }
  })

  // Add search functionality
  searchInput.addEventListener('input', function () {
    const searchTerm = this.value.trim().toLowerCase()

    // Show/hide clear button based on search term
    clearSearchButton.style.display = searchTerm ? 'block' : 'none'

    // If search field is empty, reset to original state
    if (!searchTerm) {
      // Get the container element
      const container = document.getElementById('schema-container')

      // Try to completely reset by rebuilding the UI
      if (response && response.schemas) {
        // First store the search UI
        const searchUIElement = buttonContainer.cloneNode(true)

        // Clear the container
        container.innerHTML = ''

        // Add back the search UI
        container.appendChild(searchUIElement)

        // Recreate the schema display from scratch
        updateSchemaUI(response)

        // Reattach event listeners for the new search UI elements
        const newSearchInput =
          searchUIElement.querySelector('input[type="text"]')
        const newClearButton = searchUIElement.querySelector('button')

        if (newSearchInput) {
          newSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.trim().toLowerCase()
            newClearButton.style.display = searchTerm ? 'block' : 'none'
            filterSchemaElements(searchTerm)
          })
        }

        if (newClearButton) {
          newClearButton.addEventListener('click', () => {
            newSearchInput.value = ''
            newClearButton.style.display = 'none'
            window.location.reload() // Last resort: just reload the page
          })
        }
      } else {
        // If we can't access the original response, just filter with empty string
        filterSchemaElements('')
      }
    } else {
      // Normal search behavior for non-empty searches
      filterSchemaElements(searchTerm)
    }
  })

  // Search filter function
  function filterSchemaElements(searchTerm) {
    // Create a container for "no results" message if it doesn't exist
    let noResultsElement = document.getElementById('no-search-results')
    if (!noResultsElement) {
      noResultsElement = document.createElement('div')
      noResultsElement.id = 'no-search-results'
      noResultsElement.style.padding = '20px'
      noResultsElement.style.textAlign = 'center'
      noResultsElement.style.color = '#666'
      noResultsElement.style.fontStyle = 'italic'
      noResultsElement.style.display = 'none'
      noResultsElement.textContent = 'No schemas matching your search.'
      container.appendChild(noResultsElement)
    }

    // If no search term, show all and return
    if (!searchTerm) {
      schemaSections.forEach((section) => {
        section.style.display = 'block'

        // Show all rows
        const rows = section.querySelectorAll(
          'div[style*="display: table-row"]'
        )
        rows.forEach((row) => {
          row.style.display = 'table-row'
        })

        // Reset highlight
        const cells = section.querySelectorAll(
          'div[style*="display: table-cell"]'
        )
        cells.forEach((cell) => {
          // First check if there's a link in the cell
          const linkElement = cell.querySelector('a')
          if (linkElement) {
            const originalLinkText =
              linkElement.getAttribute('data-original-text') ||
              linkElement.textContent
            linkElement.textContent = originalLinkText
          } else {
            // Otherwise, remove highlights from text content
            const originalText =
              cell.getAttribute('data-original-text') || cell.textContent
            cell.textContent = originalText
          }
        })
      })

      noResultsElement.style.display = 'none'
      return
    }

    let matchFound = false

    // Loop through schema sections
    schemaSections.forEach((section) => {
      let sectionMatch = false

      // Check schema header text
      const header = section.querySelector(
        'div[style*="background-color: #1448ff"]'
      )
      if (
        header &&
        String(header.textContent)
          .toLowerCase()
          .includes(String(searchTerm).toLowerCase())
      ) {
        sectionMatch = true
      }

      // Check rows in this section
      const rows = section.querySelectorAll('div[style*="display: table-row"]')
      rows.forEach((row) => {
        const cells = row.querySelectorAll('div[style*="display: table-cell"]')
        let rowMatch = false

        cells.forEach((cell) => {
          // Store original text if not already stored
          if (!cell.hasAttribute('data-original-text')) {
            // Check if the cell contains a link
            const linkElement = cell.querySelector('a')
            if (linkElement) {
              linkElement.setAttribute(
                'data-original-text',
                linkElement.textContent
              )
            } else {
              cell.setAttribute('data-original-text', cell.textContent)
            }
          }

          const cellText = String(cell.textContent).toLowerCase()
          const searchTermLower = String(searchTerm).toLowerCase()

          if (cellText.includes(searchTermLower.toLowerCase())) {
            rowMatch = true
            sectionMatch = true

            // Highlight matching text
            const linkElement = cell.querySelector('a')

            if (linkElement) {
              // Handle links separately to maintain href functionality
              const originalText =
                linkElement.getAttribute('data-original-text')
              const regex = new RegExp(
                `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
                'gi'
              )
              let result
              let lastIndex = 0
              let highlightedText = ''

              while ((result = regex.exec(originalText)) !== null) {
                highlightedText += originalText.substring(
                  lastIndex,
                  result.index
                )
                highlightedText += `<mark style="background-color: #1448ff; padding: 0 2px; color: white;">${result[0]}</mark>`
                lastIndex = regex.lastIndex
              }

              highlightedText += originalText.substring(lastIndex)
              linkElement.innerHTML = highlightedText
            } else {
              // Handle regular text cells
              const originalText = cell.getAttribute('data-original-text')
              const regex = new RegExp(
                `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
                'gi'
              )
              let result
              let lastIndex = 0
              let highlightedText = ''

              while ((result = regex.exec(originalText)) !== null) {
                highlightedText += originalText.substring(
                  lastIndex,
                  result.index
                )
                highlightedText += `<mark style="background-color: #1448ff; padding: 0 2px; color: white;">${result[0]}</mark>`
                lastIndex = regex.lastIndex
              }

              highlightedText += originalText.substring(lastIndex)
              cell.innerHTML = highlightedText
            }
          } else {
            // Remove highlight if no match
            const linkElement = cell.querySelector('a')
            if (linkElement) {
              linkElement.textContent =
                linkElement.getAttribute('data-original-text') ||
                linkElement.textContent
            } else {
              cell.textContent =
                cell.getAttribute('data-original-text') || cell.textContent
            }
          }
        })

        // Show/hide row based on match
        row.style.display = rowMatch ? 'table-row' : 'none'
      })

      // Show/hide section based on match
      section.style.display = sectionMatch ? 'block' : 'none'

      if (sectionMatch) {
        matchFound = true
      }
    })

    // Show/hide no results message
    noResultsElement.style.display = matchFound ? 'none' : 'block'
  }

  // Helper function to add a table row with consistent styling and display name
  function addTableRow(table, fullKey, value, index, displayKey) {
    // Skip placeholder values
    if (
      typeof value === 'string' &&
      (value === '{...}' ||
        value.includes('[Array of') ||
        value.includes('complex items'))
    ) {
      return
    }

    const row = document.createElement('div')
    row.style.display = 'table-row'

    // Alternate row colors for better readability
    if (index % 2 === 0) {
      row.style.backgroundColor = '#e6f3ff'
    } else {
      row.style.backgroundColor = '#d9e9ff'
    }

    const keyCell = document.createElement('div')
    keyCell.style.display = 'table-cell'
    keyCell.style.padding = '10px 15px'
    keyCell.style.color = '#1448ff'
    keyCell.style.fontWeight = 'bold'
    keyCell.style.width = '200px'
    keyCell.style.verticalAlign = 'top'
    keyCell.textContent = displayKey || fullKey || '' // Use display key if provided, otherwise use full key

    // Store the full key as a data attribute for reference
    keyCell.dataset.fullKey = fullKey

    const valueCell = document.createElement('div')
    valueCell.style.display = 'table-cell'
    valueCell.style.padding = '10px'
    valueCell.style.wordBreak = 'break-word'
    valueCell.style.verticalAlign = 'top'

    // Format URLs as links
    if (
      typeof value === 'string' &&
      (value.startsWith('http://') || value.startsWith('https://'))
    ) {
      const link = document.createElement('a')
      link.href = value
      link.target = '_blank'
      link.textContent = value
      link.style.color = '#1448ff' // Blue color for links
      valueCell.appendChild(link)
    } else {
      valueCell.textContent = value !== undefined ? String(value) : ''
    }

    row.appendChild(keyCell)
    row.appendChild(valueCell)
    table.appendChild(row)
  }
}

// Helper function to group similar schemas (especially for ratings)
function groupSimilarSchemas(schemas) {
  const groups = []
  const processedIndices = new Set()

  // First pass - group identical Microdata schemas
  schemas.forEach((schema, index) => {
    if (processedIndices.has(index)) return

    // Mark this schema as processed
    processedIndices.add(index)

    // Check if this is a Rating schema
    const isRatingSchema = schema.type && schema.type.includes('Rating')

    // If it's not a Rating, or we can't determine properties, treat it as unique
    if (!isRatingSchema || !schema.properties) {
      groups.push({ schema, count: 1 })
      return
    }

    // Count identical Rating schemas
    let count = 1
    const schemaJSON = JSON.stringify(schema.properties)

    // Look for identical schemas
    schemas.forEach((otherSchema, otherIndex) => {
      if (index === otherIndex || processedIndices.has(otherIndex)) return

      const otherIsRating =
        otherSchema.type && otherSchema.type.includes('Rating')

      if (otherIsRating && otherSchema.properties) {
        const otherJSON = JSON.stringify(otherSchema.properties)

        if (schemaJSON === otherJSON) {
          count++
          processedIndices.add(otherIndex)
        }
      }
    })

    groups.push({ schema, count })
  })

  // Second pass - handle non-Microdata schemas
  schemas.forEach((schema, index) => {
    if (processedIndices.has(index)) return

    processedIndices.add(index)
    groups.push({ schema, count: 1 })
  })

  return groups
}

// Improved function to extract properties without duplication
export function extractPropertiesImproved(content) {
  const properties = []

  // Handle @graph separately for better organization
  if (content['@graph'] && Array.isArray(content['@graph'])) {
    properties.push({
      key: '@context',
      value: content['@context'],
    })

    // Don't add the array summary
    // properties.push({
    //   key: '@graph',
    //   value: `[Array of ${content['@graph'].length} items]`
    // });

    // Process each graph item independently
    content['@graph'].forEach((item, index) => {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value !== 'object' || value === null) {
          properties.push({
            key: `@graph[${index}].${key}`,
            value: value,
          })
        } else if (Array.isArray(value)) {
          // Skip array placeholders in the display
          // But still process nested values
          if (
            value.length > 0 &&
            typeof value[0] === 'object' &&
            value[0] !== null
          ) {
            value.forEach((nestedItem, nestedIndex) => {
              if (typeof nestedItem === 'object' && nestedItem !== null) {
                Object.entries(nestedItem).forEach(
                  ([nestedKey, nestedValue]) => {
                    if (
                      typeof nestedValue !== 'object' ||
                      nestedValue === null
                    ) {
                      properties.push({
                        key: `@graph[${index}].${key}[${nestedIndex}].${nestedKey}`,
                        value: nestedValue,
                      })
                    }
                  }
                )
              }
            })
          }
        } else {
          // Handle nested objects in graph items
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (typeof nestedValue !== 'object' || nestedValue === null) {
              properties.push({
                key: `@graph[${index}].${key}.${nestedKey}`,
                value: nestedValue,
              })
            }
          })
        }
      })
    })

    return properties
  }

  // For non-graph content, process normally
  Object.entries(content).forEach(([key, value]) => {
    if (typeof value !== 'object' || value === null) {
      properties.push({
        key: key,
        value: value,
      })
    } else if (Array.isArray(value)) {
      // Skip array placeholders in the display
      // But still process nested values
      if (
        value.length > 0 &&
        typeof value[0] === 'object' &&
        value[0] !== null
      ) {
        value.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            Object.entries(item).forEach(([nestedKey, nestedValue]) => {
              if (typeof nestedValue !== 'object' || nestedValue === null) {
                properties.push({
                  key: `${key}[${i}].${nestedKey}`,
                  value: nestedValue,
                })
              }
            })
          }
        })
      }
    } else {
      // Skip object placeholders in the display
      // But still process nested values
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (typeof nestedValue !== 'object' || nestedValue === null) {
          properties.push({
            key: `${key}.${nestedKey}`,
            value: nestedValue,
          })
        }
      })
    }
  })

  return properties
}

export function exportSchemaData(schemas) {
  let exportContent = ''

  schemas.forEach((schema, schemaIndex) => {
    // Extract schema type
    let schemaType = 'Unknown Schema'
    if (schema.type) {
      schemaType = schema.type
    } else if (schema.content && schema.content['@type']) {
      schemaType = schema.content['@type']
    } else if (
      schema.content &&
      schema.content['@context'] &&
      schema.content['@context'].includes('schema.org')
    ) {
      schemaType = 'Schema.org'
    }

    // Add schema header
    exportContent += `=== ${schemaType} #${schemaIndex + 1} ===\n\n`

    // Special handling for JSON-LD with @graph
    if (
      schema.content &&
      schema.content['@graph'] &&
      Array.isArray(schema.content['@graph'])
    ) {
      // Add context information
      exportContent += `**@context**\n${schema.content['@context']}\n\n`

      // Add information about number of items in the graph
      exportContent += `**@graph**\n[Array of ${schema.content['@graph'].length} items]\n\n`

      // Process each item in the graph
      schema.content['@graph'].forEach((item, graphIndex) => {
        // Sort the properties alphabetically
        const sortedKeys = Object.keys(item).sort()

        sortedKeys.forEach((key) => {
          const value = item[key]

          if (typeof value !== 'object' || value === null) {
            exportContent += `**@graph[${graphIndex}].${key}**\n${
              value !== undefined ? value : ''
            }\n\n`
          } else if (Array.isArray(value)) {
            exportContent += `**@graph[${graphIndex}].${key}**\n[Array of ${value.length} items]\n\n`
          } else {
            exportContent += `**@graph[${graphIndex}].${key}**\n{Object}\n\n`

            // Also include nested object properties
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (typeof nestedValue !== 'object' || nestedValue === null) {
                exportContent += `**@graph[${graphIndex}].${key}.${nestedKey}**\n${
                  nestedValue !== undefined ? nestedValue : ''
                }\n\n`
              }
            })
          }
        })
      })
    } else {
      // For non-graph schemas, use the existing logic
      let schemaProperties = []
      if (schema.properties && Array.isArray(schema.properties)) {
        schemaProperties = schema.properties
      } else if (schema.content) {
        schemaProperties = extractPropertiesImproved(schema.content)
      }

      // Sort properties alphabetically
      schemaProperties.sort((a, b) => a.key.localeCompare(b.key))

      // Format each property with bold keys
      schemaProperties.forEach((prop) => {
        if (!prop.key) return

        // Add the key in bold
        exportContent += `**${prop.key}**\n`

        // Add the value - FIX: Use prop.value instead of value
        exportContent += `${prop.value !== undefined ? prop.value : ''}\n\n`
      })
    }

    // Add separator between schemas
    exportContent += '\n---\n\n'
  })

  // Create and download file
  const blob = new Blob([exportContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${currentWebsiteDomain}_schemas.txt`
  link.click()

  URL.revokeObjectURL(url)
}
