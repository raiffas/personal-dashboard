// Page Navigation
const navLinks = document.querySelectorAll(".nav-link");
const arrowButtons = document.querySelectorAll(".arrow-button");
const pages = document.querySelectorAll(
  ".home-page, .inbox-page, .calendar-page",
);
const html = document.documentElement;
let currentMode = "day";
let currentPage = "home";

function navigateToPage(pageName) {
  pages.forEach((page) => page.classList.remove("active"));
  navLinks.forEach((link) => link.classList.remove("active"));

  if (pageName === "home") {
    document.querySelector(".home-page").classList.add("active");
  } else if (pageName === "home-night") {
    document.querySelector(".home-page").classList.add("active");
    setMode("night");
    return;
  } else if (pageName === "inbox") {
    document.querySelector(".inbox-page").classList.add("active");
    currentMode === "day"
      ? document.querySelector('[data-page="inbox"]').classList.add("active")
      : null;
  } else if (pageName === "calendar") {
    document.querySelector(".calendar-page").classList.add("active");
    currentMode === "day"
      ? document.querySelector('[data-page="calendar"]').classList.add("active")
      : null;
  }

  // Update nav link active state
  document.querySelectorAll(`[data-page="${pageName}"]`).forEach((el) => {
    if (el.classList.contains("nav-link")) {
      el.classList.add("active");
    }
  });

  currentPage = pageName;
}

function setMode(mode) {
  currentMode = mode;
  html.setAttribute("data-mode", mode);
  document.getElementById("modeIcon").textContent =
    mode === "day" ? "☀️" : "🌙";

  const headline = document.querySelector(".hero-headline");
  if (headline) {
    headline.textContent = mode === "day" ? "good morning!" : "good night!";
  }

  const navHomeDay = document.querySelector('[data-page="home"]');
  const navHomeNight = document.querySelector('[data-page="home-night"]');
  if (mode === "day") {
    navHomeDay.textContent = "Home (day)";
    if (navHomeNight) navHomeNight.textContent = "Home (night)";
  } else {
    navHomeDay.textContent = "Home (day)";
    if (navHomeNight) navHomeNight.textContent = "Home (night)";
  }
}

// Event Listeners - Nav Links
document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const page = button.getAttribute("data-page");
    navigateToPage(page);
  });
});

// Event Listeners - Mode Toggle
document.getElementById("modeToggle").addEventListener("click", () => {
  const newMode = currentMode === "day" ? "night" : "day";
  setMode(newMode);
});

// Arrow Buttons
arrowButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const page = button.getAttribute("data-page");
    navigateToPage(page);
  });
});

// Format Date
function formatDate() {
  const options = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const date = new Date();
  const dateString = date.toLocaleDateString("en-US", options);
  document.getElementById("dateStamp").textContent = dateString.toLowerCase();
}

// Initialize
formatDate();
setMode("day");
