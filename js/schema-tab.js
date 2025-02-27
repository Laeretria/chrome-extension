export function updateSchemaUI(response) {
  console.log('Schema response structure:', JSON.stringify(response, null, 2))

  const container = document.getElementById('schema-container')
  if (!container) {
    console.error('Schema container not found')
    return
  }

  const loadingElement = document.getElementById('loading-schemas')
  if (loadingElement) {
    loadingElement.classList.add('hidden')
  }

  // Check if we have schema data
  if (!response || !response.schemas || response.schemas.length === 0) {
    container.innerHTML =
      '<div class="no-data">Geen schema data gevonden op deze pagina.</div>'
    return
  }

  // Clear container
  container.innerHTML = ''

  // Add export button
  const exportButton = document.createElement('button')
  exportButton.className = 'schema-export-btn'
  exportButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
      </svg>
      Export Schema
    `
  exportButton.addEventListener('click', () => {
    exportSchemaData(response.schemas)
  })
  container.appendChild(exportButton)

  // Create a container for schema data
  const schemaData = document.createElement('div')
  schemaData.className = 'schema-data'
  container.appendChild(schemaData)

  // Process and display each schema
  let processedData = []

  response.schemas.forEach((schema) => {
    console.log('Processing schema:', schema)

    // Check if schema has properties array
    if (schema.properties && Array.isArray(schema.properties)) {
      processedData = processedData.concat(schema.properties)
    } else if (schema.content) {
      // Alternative format - schema might have content directly
      const properties = extractProperties(schema.content)
      processedData = processedData.concat(properties)
    }
  })

  console.log('Total properties to display:', processedData.length)

  // Now create the display for each property
  processedData.forEach((prop) => {
    const row = document.createElement('div')
    row.className = 'schema-property'
    row.style.display = 'flex'
    row.style.marginBottom = '8px'
    row.style.paddingBottom = '8px'
    row.style.borderBottom = '1px solid #eee'

    const keyEl = document.createElement('div')
    keyEl.className = 'schema-key'
    keyEl.style.flex = '0 0 200px'
    keyEl.style.fontWeight = 'bold'
    keyEl.style.color = '#6366f1'
    keyEl.textContent = prop.key || ''

    const valueEl = document.createElement('div')
    valueEl.className = 'schema-value'
    valueEl.style.flex = '1'
    valueEl.style.wordBreak = 'break-word'
    valueEl.textContent = prop.value !== undefined ? String(prop.value) : ''

    row.appendChild(keyEl)
    row.appendChild(valueEl)
    schemaData.appendChild(row)
  })
}

// Helper function to extract properties from schema content
export function extractProperties(content, prefix = '') {
  const properties = []

  if (typeof content === 'object' && content !== null) {
    if (Array.isArray(content)) {
      // Handle arrays
      content.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          properties.push(...extractProperties(item, `${prefix}${index}`))
        } else {
          properties.push({
            key: `${prefix}${index}`,
            value: item,
          })
        }
      })
    } else {
      // Handle objects
      Object.entries(content).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          properties.push(...extractProperties(value, `${prefix}${key}@`))
        } else {
          properties.push({
            key: `${prefix}${key}`,
            value: value,
          })
        }
      })
    }
  }

  return properties
}

export function exportSchemaData(schemas) {
  let exportContent = ''

  let processedData = []
  schemas.forEach((schema) => {
    if (schema.properties && Array.isArray(schema.properties)) {
      processedData = processedData.concat(schema.properties)
    } else if (schema.content) {
      const properties = extractProperties(schema.content)
      processedData = processedData.concat(properties)
    }
  })

  processedData.forEach((prop) => {
    exportContent += `${prop.key || ''}\n${
      prop.value !== undefined ? prop.value : ''
    }\n\n`
  })

  // Create and download file
  const blob = new Blob([exportContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${currentWebsiteDomain}_schema.txt`
  link.click()

  URL.revokeObjectURL(url)
}
