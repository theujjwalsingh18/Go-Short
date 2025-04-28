document.addEventListener("DOMContentLoaded", () => {
  const shortenForm = document.getElementById("shortenForm");
  const urlInput = document.getElementById("urlInput");
  const urlError = document.getElementById("urlError");
  const clearButton = document.getElementById("clearButton");
  const submitButton = document.getElementById("submitButton");
  const buttonText = document.getElementById("buttonText");
  const loadingSpinner = document.getElementById("loadingSpinner");

  const urlFormCard = document.getElementById("urlForm");
  const resultCard = document.getElementById("resultCard");
  const errorCard = document.getElementById("errorCard");

  const originalUrlDisplay = document.getElementById("originalUrlDisplay");
  const shortUrlDisplay = document.getElementById("shortUrlDisplay");
  const errorMessage = document.getElementById("errorMessage");

  const copyButton = document.getElementById("copyButton");
  const resetButton = document.getElementById("resetButton");
  const shareButton = document.getElementById("shareButton");
  const tryAgainButton = document.getElementById("tryAgainButton");

  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  const typer = document.getElementById("typewriter");
  const userLabel = document.getElementById("userLabel");
  const userBox = document.getElementById("userBox");
  const ageSpan = document.getElementById("age-span");

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
      localStorage.setItem("theme", "dark");
    } else {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
      localStorage.setItem("theme", "light");
    }
  });

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
  }

  urlInput.addEventListener("input", () => {
    if (urlInput.value.trim() !== "") {
      clearButton.style.display = "flex";
    } else {
      clearButton.style.display = "none";
    }
  });

  clearButton.addEventListener("click", () => {
    urlInput.value = "";
    clearButton.style.display = "none";
    urlError.textContent = "";
  });

  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async function shortenUrl(url) {
    try {
      const response = await fetch("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to shorten URL");
      }

      const data = await response.json();

      const baseUrl = window.location.origin + "/";
      return {
        originalUrl: url,
        shortUrl: baseUrl + data.short_url,
      };
    } catch (error) {
      console.error("Error shortening URL:", error);
      throw error;
    }
  }

  shortenForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    urlError.textContent = "";

    const url = urlInput.value.trim();

    if (!url) {
      urlError.textContent = "Please enter a URL";
      return;
    }

    if (!isValidUrl(url)) {
      urlError.textContent =
        "Please enter a valid URL including http:// or https://";
      return;
    }

    submitButton.disabled = true;
    buttonText.textContent = "Shortening...";
    loadingSpinner.classList.remove("hidden");

    try {
      const response = await shortenUrl(url);

      originalUrlDisplay.textContent = response.originalUrl;
      originalUrlDisplay.title = response.originalUrl;

      shortUrlDisplay.textContent = response.shortUrl;
      shortUrlDisplay.title = response.shortUrl;
      shortUrlDisplay.href = response.shortUrl;

      urlFormCard.classList.add("hidden");
      resultCard.classList.remove("hidden");
    } catch (error) {
      errorMessage.textContent =
        error.message || "Failed to shorten URL. Please try again.";
      urlFormCard.classList.add("hidden");
      errorCard.classList.remove("hidden");
    } finally {
      submitButton.disabled = false;
      buttonText.textContent = "Shorten URL";
      loadingSpinner.classList.add("hidden");
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shortUrlDisplay.textContent);
      showToast("Success! Link copied to clipboard");
    } catch (err) {
      showToast("Failed to copy link", true);
    }
  });

  shareButton.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this shortened URL",
          url: shortUrlDisplay.textContent,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          showToast("Failed to share link", true);
        }
      }
    } else {
      showToast("Web Share API not supported in your browser");
    }
  });

  resetButton.addEventListener("click", resetToForm);
  tryAgainButton.addEventListener("click", resetToForm);

  function resetToForm() {
    resultCard.classList.add("hidden");
    errorCard.classList.add("hidden");
    urlFormCard.classList.remove("hidden");
    urlInput.value = "";
    clearButton.style.display = "none";
  }

  function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = "toast " + (isError ? "toast-error" : "toast-success");

    const icon = document.createElement("i");
    icon.className = isError
      ? "fas fa-exclamation-circle"
      : "fas fa-check-circle";

    const text = document.createElement("span");
    text.textContent = message;
    toast.appendChild(icon);
    toast.appendChild(text);
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  var typingTimeout;
  function setupTypewriter(t) {
    var HTML = t.innerHTML;
    t.innerHTML = "";
    var cursorPosition = 0,
      tag = "",
      writingTag = false,
      tagOpen = false,
      typeSpeed = 100,
      tempTypeSpeed = 0;

    var type = function () {
      if (writingTag === true) {
        tag += HTML[cursorPosition];
      }
      if (HTML[cursorPosition] === "<") {
        tempTypeSpeed = 0;
        if (tagOpen) {
          tagOpen = false;
          writingTag = true;
        } else {
          tag = "";
          tagOpen = true;
          writingTag = true;
          tag += HTML[cursorPosition];
        }
      }
      if (!writingTag && tagOpen) {
        tag.innerHTML += HTML[cursorPosition];
      }
      if (!writingTag && !tagOpen) {
        if (HTML[cursorPosition] === " ") {
          tempTypeSpeed = 0;
        } else {
          tempTypeSpeed = Math.random() * typeSpeed + 50;
        }
        t.innerHTML += HTML[cursorPosition];
      }
      if (writingTag === true && HTML[cursorPosition] === ">") {
        tempTypeSpeed = Math.random() * typeSpeed + 50;
        writingTag = false;
        if (tagOpen) {
          var newSpan = document.createElement("span");
          t.appendChild(newSpan);
          newSpan.innerHTML = tag;
          tag = newSpan.firstChild;
        }
      }
      cursorPosition += 1;
      if (cursorPosition < HTML.length - 1) {
        typingTimeout = setTimeout(type, tempTypeSpeed);
      }
    };
    return {
      type: type,
      reset: function () {
        t.innerHTML = "";
        cursorPosition = 0;
      },
    };
  }

  function calculateAge(birthYear) {
    const today = new Date();
    return today.getFullYear() - birthYear;
  }

  const age = calculateAge(2005);
  typer.innerHTML = typer.innerHTML.replace("{{age}}", age);

  let isBoxVisible = false;
  var originalTypewriterHTML = typer.innerHTML;
  let typewriter = setupTypewriter(typer);

  function showBox() {
    userBox.style.display = "flex";
    userLabel.style.pointerEvents = "none";
    isBoxVisible = true;
    typewriter.reset();
    typewriter.type();
  }

  function hideBox() {
    userBox.style.display = "none";
    userLabel.style.pointerEvents = "auto";
    isBoxVisible = false;

    clearTimeout(typingTimeout);
    typer.innerHTML = "";
    typer.innerHTML = originalTypewriterHTML;
    typewriter = setupTypewriter(typer);
  }

  userLabel.addEventListener("click", function (event) {
    if (!isBoxVisible) {
      showBox();
    }
  });

  userLabel.addEventListener("mouseover", function (event) {
    if (!isBoxVisible) {
      showBox();
    }
  });

  document.addEventListener("click", function (event) {
    if (
      isBoxVisible &&
      !userBox.contains(event.target) &&
      event.target !== userLabel
    ) {
      hideBox();
    }
  });

  userBox.addEventListener("click", function (event) {
    event.stopPropagation();
  });
});
