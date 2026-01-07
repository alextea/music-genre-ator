(function() {
  'use strict';

  // Toggle share pane visibility with slide animation
  function toggleSharePane() {
    const sharePane = document.querySelector('.share-pane');
    if (!sharePane) return;

    sharePane.classList.toggle('is-open');
  }

  // Copy text to clipboard
  function copyToClipboard(button) {
    const textarea = document.querySelector('textarea[name="share-content"]');
    if (!textarea) return;

    // Select and copy the text
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value)
          .then(function() {
            updateCopyButton(button);
          })
          .catch(function() {
            // Fallback to execCommand
            fallbackCopyToClipboard(textarea, button);
          });
      } else {
        // Fallback to execCommand
        fallbackCopyToClipboard(textarea, button);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }

  // Fallback copy method for older browsers
  function fallbackCopyToClipboard(textarea, button) {
    try {
      document.execCommand('copy');
      updateCopyButton(button);
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
  }

  // Update button text to show copy success
  function updateCopyButton(button) {
    const originalText = button.textContent;
    button.textContent = 'Text copied';
    button.disabled = true;

    // Reset button after 2 seconds
    setTimeout(function() {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  }

  // Initialize event listeners
  function init() {
    // Get elements
    const openShareButton = document.getElementById('js-open-share');
    const copyButton = document.getElementById('js-copy');
    const cancelButton = document.getElementById('js-cancel-share');

    // Open/close share pane when clicking "Share this genre"
    if (openShareButton) {
      openShareButton.addEventListener('click', function(e) {
        e.preventDefault();
        toggleSharePane();
      });
    }

    // Copy text when clicking "Copy text"
    if (copyButton) {
      copyButton.addEventListener('click', function(e) {
        e.preventDefault();
        copyToClipboard(this);
      });
    }

    // Close share pane when clicking "Cancel"
    if (cancelButton) {
      cancelButton.addEventListener('click', function(e) {
        e.preventDefault();
        toggleSharePane();
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
