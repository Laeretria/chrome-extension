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
  buttonContainer.style.textAlign = 'right'
  buttonContainer.style.display = 'flex'
  buttonContainer.style.justifyContent = 'flex-end'
  buttonContainer.style.gap = '10px'
  buttonContainer.style.marginBottom = '10px'

  // Add export text button
  const exportButton = document.createElement('button')
  exportButton.className = 'schema-export-btn'
  exportButton.style.padding = '8px 16px'
  exportButton.style.borderRadius = '4px'
  exportButton.style.color = 'white'
  exportButton.style.border = 'none'
  exportButton.style.cursor = 'pointer'
  exportButton.innerHTML = `
           <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            stroke-width="1.5"
            style="vertical-align: middle;
            margin-right: 6px;
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z"
                fill="#1C274C"
              ></path>
              <path
                d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z"
                fill="#1C274C"
              ></path>
            </g>
          </svg>
    Exporteer Text
  `
  exportButton.addEventListener('click', () => {
    exportSchemaData(response.schemas)
  })
  buttonContainer.appendChild(exportButton)

  // Add JSON export button
  const jsonExportButton = document.createElement('button')
  jsonExportButton.className = 'schema-export-btn'
  jsonExportButton.style.padding = '8px 16px'
  jsonExportButton.style.borderRadius = '4px'
  jsonExportButton.style.color = 'white'
  jsonExportButton.style.border = 'none'
  jsonExportButton.style.cursor = 'pointer'
  jsonExportButton.innerHTML = `
           <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            stroke-width="1.5"
            style="vertical-align: middle;
            margin-right: 6px;
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z"
                fill="#1C274C"
              ></path>
              <path
                d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z"
                fill="#1C274C"
              ></path>
            </g>
          </svg>
    Exporteer JSON
  `
  jsonExportButton.addEventListener('click', () => {
    exportSchemaDataAsJSON(response.schemas)
  })
  buttonContainer.appendChild(jsonExportButton)

  container.appendChild(buttonContainer)

  // Group identical schemas (especially for ratings)
  const groupedSchemas = groupSimilarSchemas(response.schemas)

  // Process and display each schema group
  groupedSchemas.forEach((schemaGroup, groupIndex) => {
    const { schema, count } = schemaGroup

    // Create a schema section
    const schemaSection = document.createElement('div')
    schemaSection.style.marginBottom = '20px'
    schemaSection.style.backgroundColor = '#f5f9ff'
    schemaSection.style.borderRadius = '8px'
    container.appendChild(schemaSection)

    // Add schema type header
    const schemaHeader = document.createElement('div')
    schemaHeader.style.fontSize = '16px'
    schemaHeader.style.fontWeight = 'bold'
    schemaHeader.style.padding = '10px'
    schemaHeader.style.backgroundColor = '#1448ff'
    schemaHeader.style.color = 'white'
    schemaHeader.style.borderRadius = '6px 6px 0 0'

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

// Export functions for text and JSON remain the same
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

        // Add the value
        exportContent += `${prop.value !== undefined ? value : ''}\n\n`
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

export function exportSchemaDataAsJSON(schemas) {
  // Process each schema to make it more readable
  const processedSchemas = schemas.map((schema, index) => {
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

    // Return schema with appropriate structure based on type
    if (schema.content) {
      return {
        schemaType,
        schemaIndex: index + 1,
        data: schema.content,
      }
    } else if (schema.properties && Array.isArray(schema.properties)) {
      // Convert properties array to object
      const propsObject = {}
      schema.properties.forEach((prop) => {
        if (prop.key) {
          propsObject[prop.key] = prop.value
        }
      })
      return {
        schemaType,
        schemaIndex: index + 1,
        data: propsObject,
      }
    }

    return {
      schemaType,
      schemaIndex: index + 1,
      data: {},
    }
  })

  // Convert to JSON string with pretty formatting
  const jsonString = JSON.stringify(processedSchemas, null, 2)

  // Create and download file
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${currentWebsiteDomain}_schemas.json`
  link.click()

  URL.revokeObjectURL(url)
}
