export function initScrollToTopButton() {
  // Check if the button already exists to prevent multiple creations
  if (document.getElementById('scrollToTopBtn')) return

  // Create the button element
  const scrollToTopButton = document.createElement('button')
  scrollToTopButton.id = 'scrollToTopBtn'
  scrollToTopButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Arrow / Arrow_Up_SM"> <path id="Vector" d="M12 17V7M12 7L8 11M12 7L16 11" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg>`
  scrollToTopButton.setAttribute('aria-label', 'Scroll to top')

  // Style the button
  Object.assign(scrollToTopButton.style, {
    position: 'fixed',
    bottom: '10px',
    right: '27px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1448ff', // Dark blue color matching the SEO tool theme
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'none', // Hidden by default
    zIndex: '1000',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
    transition: 'opacity 0.2s ease, transform 0.5s ease, visibility 0.2s ease',
    opacity: '0',
    visibility: 'hidden',
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
    // Target the main content div for scrolling
    const mainContent = document.querySelector('.main-content')
    if (mainContent) {
      mainContent.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } else {
      // Fallback to window scrolling
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  })

  // Append the button to the app container
  const appContainer = document.querySelector('.app-container')
  if (appContainer) {
    appContainer.appendChild(scrollToTopButton)
  } else {
    // Fallback to body if app container is not found
    document.body.appendChild(scrollToTopButton)
  }

  // Show/hide button based on scroll position
  const mainContent = document.querySelector('.main-content')
  if (mainContent) {
    mainContent.addEventListener('scroll', toggleScrollToTopButton)
  } else {
    // Fallback to window scroll event
    window.addEventListener('scroll', toggleScrollToTopButton)
  }

  // Add event listener for window resize
  window.addEventListener('resize', handleWindowResize)

  // Initial check for window size
  handleWindowResize()
}

function toggleScrollToTopButton() {
  const scrollToTopButton = document.getElementById('scrollToTopBtn')
  if (!scrollToTopButton) return

  // Get the main content area for scroll calculation
  const mainContent = document.querySelector('.main-content')
  const scrollY = mainContent ? mainContent.scrollTop : window.scrollY

  // Show button when user scrolls down 300px from the top and window width is adequate
  if (scrollY > 300 && window.innerWidth > 768) {
    // 768px is a common breakpoint for mobile devices
    // First make it visible but transparent
    scrollToTopButton.style.display = 'block'
    scrollToTopButton.style.visibility = 'visible'

    // Trigger reflow to ensure smooth transition
    scrollToTopButton.offsetHeight

    // Fade in animation
    scrollToTopButton.style.opacity = '1'
  } else {
    // Fade out animation
    scrollToTopButton.style.opacity = '0'
    scrollToTopButton.style.visibility = 'hidden'

    // Hide after fade out animation completes
    setTimeout(() => {
      if (scrollY <= 300 || window.innerWidth <= 768) {
        // Check again in case user scrolled back down or resized
        scrollToTopButton.style.display = 'none'
      }
    }, 500) // Match this with the transition duration
  }
}

function handleWindowResize() {
  const scrollToTopButton = document.getElementById('scrollToTopBtn')
  if (!scrollToTopButton) return

  // Hide button when window width is below threshold (mobile/minimized view)
  if (window.innerWidth <= 768) {
    scrollToTopButton.style.opacity = '0'
    scrollToTopButton.style.visibility = 'hidden'

    setTimeout(() => {
      scrollToTopButton.style.display = 'none'
    }, 500) // Match this with the transition duration
  } else {
    // Check scroll position to determine if button should be visible
    const mainContent = document.querySelector('.main-content')
    const scrollY = mainContent ? mainContent.scrollTop : window.scrollY

    if (scrollY > 300) {
      // First make it visible but transparent
      scrollToTopButton.style.display = 'block'

      // Trigger reflow to ensure smooth transition
      scrollToTopButton.offsetHeight

      scrollToTopButton.style.visibility = 'visible'
      scrollToTopButton.style.opacity = '1'
    }
  }
}

// Function to add the scroll to top button to the SEO tool
export function addScrollToTopToSEOTool() {
  // Ensure the function runs after the DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollToTopButton)
  } else {
    initScrollToTopButton()
  }
}
