export function initScrollToTopButton() {
  // Create the button element
  const scrollToTopButton = document.createElement('button')
  scrollToTopButton.id = 'scrollToTopBtn'
  scrollToTopButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Arrow / Arrow_Up_SM"> <path id="Vector" d="M12 17V7M12 7L8 11M12 7L16 11" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg>`
  scrollToTopButton.setAttribute('aria-label', 'Scroll to top')

  // Style the button
  Object.assign(scrollToTopButton.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#1448ff', // Dark blue color matching the SEO tool theme
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'none', // Hidden by default
    zIndex: '1000',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
    transition: 'opacity 0.3s, transform 0.3s',
  })

  // Add hover effect
  scrollToTopButton.onmouseover = () => {
    scrollToTopButton.style.backgroundColor = '#1371ff' // Slightly lighter blue on hover
    scrollToTopButton.style.transform = 'translateY(-3px)'
  }

  scrollToTopButton.onmouseout = () => {
    scrollToTopButton.style.backgroundColor = '#1448ff'
    scrollToTopButton.style.transform = 'translateY(0)'
  }

  // Add click event to scroll to top
  scrollToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  })

  // Append the button to the body
  document.body.appendChild(scrollToTopButton)

  // Show/hide button based on scroll position
  window.addEventListener('scroll', toggleScrollToTopButton)
}

function toggleScrollToTopButton() {
  const scrollToTopButton = document.getElementById('scrollToTopBtn')
  if (!scrollToTopButton) return

  // Show button when user scrolls down 300px from the top
  if (window.scrollY > 300) {
    scrollToTopButton.style.display = 'block'

    // Fade in animation
    setTimeout(() => {
      scrollToTopButton.style.opacity = '1'
    }, 10)
  } else {
    // Fade out animation
    scrollToTopButton.style.opacity = '0'

    // Hide after fade out animation completes
    setTimeout(() => {
      if (window.scrollY <= 300) {
        // Check again in case user scrolled back down
        scrollToTopButton.style.display = 'none'
      }
    }, 300)
  }
}

// Function to add the scroll to top button to the SEO tool
export function addScrollToTopToSEOTool() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollToTopButton)
  } else {
    initScrollToTopButton()
  }
}
