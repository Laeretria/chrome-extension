/* Runs when the popup is opened
Communicates with content.js to get image data
Updates the UI with the image analysis results
Shows total images and missing alt text counts */


document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const tabId = `${tab.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');
            
            // Load data for the selected tab
            loadTabData(tab.dataset.tab);
        });
    });

    // Initial load of image data
    loadTabData('images');
});

function loadTabData(tabName) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const action = tabName === 'images' ? 'getImages' : 'getLinks';
        
        chrome.tabs.sendMessage(tabs[0].id, {action: action}, function(response) {
            document.getElementById('loading').classList.add('hidden');
            
            if (tabName === 'images' && response && response.images) {
                updateImagesUI(response.images);
            } else if (tabName === 'links' && response && response.links) {
                updateLinksUI(response.links);
            }
        });
    });
}

function updateImagesUI(images) {
    const totalImages = images.length;
    const missingAlt = images.filter(img => !img.alt).length;
    
    document.getElementById('totalImages').textContent = totalImages;
    document.getElementById('missingAlt').textContent = missingAlt;
    
    const imageDetails = document.getElementById('imageDetails');
    imageDetails.innerHTML = '';
    
    images.forEach((img, index) => {
        const imageInfo = document.createElement('div');
        imageInfo.className = 'image-info';
        imageInfo.innerHTML = `
            <h3>Afbeelding ${index + 1}</h3>
            <p>Source: ${img.src}</p>
            <p>Alt Text: ${img.alt || '<span class="warning">Ontbreekt!</span>'}</p>
            <p>Afmetingen: ${img.width}x${img.height}</p>
        `;
        imageDetails.appendChild(imageInfo);
    });
}

function updateLinksUI(links) {
    const totalLinks = links.length;
    const internalLinks = links.filter(link => link.isInternal).length;
    const externalLinks = totalLinks - internalLinks;
    
    document.getElementById('totalLinks').textContent = totalLinks;
    document.getElementById('internalLinks').textContent = internalLinks;
    document.getElementById('externalLinks').textContent = externalLinks;
    
    const linkDetails = document.getElementById('linkDetails');
    linkDetails.innerHTML = '';
    
    links.forEach((link, index) => {
        const linkInfo = document.createElement('div');
        linkInfo.className = 'link-info';
        linkInfo.innerHTML = `
            <h3>Link ${index + 1}</h3>
            <p>URL: ${link.href}</p>
            <p>Text: ${link.text || '<span class="warning">Geen tekst!</span>'}</p>
            <p>Type: ${link.isInternal ? 'Intern' : 'Extern'}</p>
        `;
        linkDetails.appendChild(linkInfo);
    });
}