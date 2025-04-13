document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const shortenForm = document.getElementById('shortenForm');
    const urlInput = document.getElementById('urlInput');
    const urlError = document.getElementById('urlError');
    const clearButton = document.getElementById('clearButton');
    const submitButton = document.getElementById('submitButton');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    const urlFormCard = document.getElementById('urlForm');
    const resultCard = document.getElementById('resultCard');
    const errorCard = document.getElementById('errorCard');
    
    const originalUrlDisplay = document.getElementById('originalUrlDisplay');
    const shortUrlDisplay = document.getElementById('shortUrlDisplay');
    const errorMessage = document.getElementById('errorMessage');
    
    const copyButton = document.getElementById('copyButton');
    const resetButton = document.getElementById('resetButton');
    const shareButton = document.getElementById('shareButton');
    const tryAgainButton = document.getElementById('tryAgainButton');
    
    // Show/hide clear button based on input content
    urlInput.addEventListener('input', () => {
      if (urlInput.value.trim() !== '') {
        clearButton.style.display = 'flex';
      } else {
        clearButton.style.display = 'none';
      }
    });
    
    clearButton.addEventListener('click', () => {
      urlInput.value = '';
      clearButton.style.display = 'none';
      urlError.textContent = '';
    });
    
    // Validate URL function
    function isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }
    
    // Function to shorten URL using the Go server endpoint
    async function shortenUrl(url) {
      try {
        const response = await fetch('/sort', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) {
          throw new Error('Failed to shorten URL');
        }
        
        const data = await response.json();
        
        // The Go server returns { short_url: "hash" }
        // We need to construct the full URL with the /rd/ prefix
        const baseUrl = window.location.origin + '/rd/';
        
        return {
          originalUrl: url,
          shortUrl: baseUrl + data.short_url
        };
      } catch (error) {
        console.error('Error shortening URL:', error);
        throw error;
      }
    }
    
    // Form submission
    shortenForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Reset error state
      urlError.textContent = '';
      
      // Get the URL
      const url = urlInput.value.trim();
      
      // Validate URL
      if (!url) {
        urlError.textContent = 'Please enter a URL';
        return;
      }
      
      if (!isValidUrl(url)) {
        urlError.textContent = 'Please enter a valid URL including http:// or https://';
        return;
      }
      
      submitButton.disabled = true;
      buttonText.textContent = 'Shortening...';
      loadingSpinner.classList.remove('hidden');
      
      try {
        // Call the API endpoint
        const response = await shortenUrl(url);
        
        originalUrlDisplay.textContent = response.originalUrl;
        originalUrlDisplay.title = response.originalUrl;
        
        shortUrlDisplay.textContent = response.shortUrl;
        shortUrlDisplay.title = response.shortUrl;
        shortUrlDisplay.href = response.shortUrl;
        
        urlFormCard.classList.add('hidden');
        resultCard.classList.remove('hidden');
        
      } catch (error) {
        errorMessage.textContent = error.message || 'Failed to shorten URL. Please try again.';
        urlFormCard.classList.add('hidden');
        errorCard.classList.remove('hidden');
      } finally {
        submitButton.disabled = false;
        buttonText.textContent = 'Shorten URL';
        loadingSpinner.classList.add('hidden');
      }
    });
    
    // Copy button
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shortUrlDisplay.textContent);
        showToast('Success! Link copied to clipboard');
      } catch (err) {
        showToast('Failed to copy link', true);
      }
    });
    
    // Share button
    shareButton.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Check out this shortened URL',
            url: shortUrlDisplay.textContent
          });
        } catch (error) {
          if (error.name !== 'AbortError') {
            showToast('Failed to share link', true);
          }
        }
      } else {
        showToast('Web Share API not supported in your browser');
      }
    });
    
    resetButton.addEventListener('click', resetToForm);
    tryAgainButton.addEventListener('click', resetToForm);
    
    // Function to reset to form view
    function resetToForm() {
      resultCard.classList.add('hidden');
      errorCard.classList.add('hidden');
      urlFormCard.classList.remove('hidden');
      urlInput.value = '';
      clearButton.style.display = 'none';
    }
    
    // Toast notification function
    function showToast(message, isError = false) {
      const toast = document.createElement('div');
      toast.className = 'toast ' + (isError ? 'toast-error' : 'toast-success');
      
      const icon = document.createElement('i');
      icon.className = isError 
        ? 'fas fa-exclamation-circle' 
        : 'fas fa-check-circle';
      
      const text = document.createElement('span');
      text.textContent = message;
      
      toast.appendChild(icon);
      toast.appendChild(text);
      
      document.body.appendChild(toast);
      
     
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }
  });