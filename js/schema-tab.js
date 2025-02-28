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

  // Add export button
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
    Export Schema
  `
  exportButton.addEventListener('click', () => {
    exportSchemaData(response.schemas)
  })
  buttonContainer.appendChild(exportButton)
  container.appendChild(buttonContainer)

  // Process schema data
  let processedData = []
  response.schemas.forEach((schema) => {
    if (schema.properties && Array.isArray(schema.properties)) {
      processedData = processedData.concat(schema.properties)
    } else if (schema.content) {
      const properties = extractProperties(schema.content)
      processedData = processedData.concat(properties)
    }
  })

  // Sort properties alphabetically
  processedData.sort((a, b) => a.key.localeCompare(b.key))

  // Create a table for schema data with consistent styling
  const schemaTable = document.createElement('div')
  schemaTable.style.display = 'table'
  schemaTable.style.width = '100%'
  schemaTable.style.borderCollapse = 'collapse'
  schemaTable.style.marginTop = '10px'
  schemaTable.style.backgroundColor = '#e6f3ff'
  schemaTable.style.borderRadius = '6px'
  schemaTable.style.overflow = 'hidden'
  container.appendChild(schemaTable)

  // Add each property as a table row
  processedData.forEach((prop, index) => {
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
    keyCell.textContent = prop.key || ''

    const valueCell = document.createElement('div')
    valueCell.style.display = 'table-cell'
    valueCell.style.padding = '10px'
    valueCell.style.wordBreak = 'break-word'
    valueCell.style.verticalAlign = 'top'

    // Format URLs as links
    if (
      typeof prop.value === 'string' &&
      (prop.value.startsWith('http://') || prop.value.startsWith('https://'))
    ) {
      const link = document.createElement('a')
      link.href = prop.value
      link.target = '_blank'
      link.textContent = prop.value
      link.style.color = '#1448ff' // Orange color for links
      valueCell.appendChild(link)
    } else {
      valueCell.textContent = prop.value !== undefined ? String(prop.value) : ''
    }

    row.appendChild(keyCell)
    row.appendChild(valueCell)
    schemaTable.appendChild(row)
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

  // Sort properties alphabetically
  processedData.sort((a, b) => a.key.localeCompare(b.key))

  // Format each property with bold keys
  processedData.forEach((prop) => {
    if (!prop.key) return

    // Add the key in bold
    exportContent += `**${prop.key}**\n`

    // Add the value
    exportContent += `${prop.value !== undefined ? prop.value : ''}\n`
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
