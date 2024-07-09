/* eslint-disable */
window.darkMode = false;

let headerElement = null;

document.addEventListener("DOMContentLoaded", () => {
  headerElement = document.getElementById("header");

  if (
    localStorage.getItem("dark_mode") &&
    localStorage.getItem("dark_mode") === "true"
  ) {
    window.darkMode = true;
    showNight();
  } else {
    showDay();
  }

  mobileMenuFunctionality();
});

document.getElementById("darkToggle").addEventListener("click", () => {
  if (document.documentElement.classList.contains("dark")) {
    localStorage.removeItem("dark_mode");
    showDay(true);
  } else {
    localStorage.setItem("dark_mode", true);
    showNight(true);
  }
});

function showDay() {
  document.getElementById("moon").classList.add("hidden");
  document.getElementById("sun").classList.remove("hidden");
  document.documentElement.classList.remove("dark");
}

function showNight() {
  document.getElementById("sun").classList.add("hidden");
  document.getElementById("moon").classList.remove("hidden");
  document.documentElement.classList.add("dark");
}

function mobileMenuFunctionality() {
  document.getElementById("openMenu").addEventListener("click", () => {
    openMobileMenu();
  });

  document.getElementById("closeMenu").addEventListener("click", () => {
    closeMobileMenu();
  });
}

window.openMobileMenu = () => {
  document.getElementById("openMenu").classList.add("hidden");
  document.getElementById("closeMenu").classList.remove("hidden");
  document.getElementById("menu").classList.remove("hidden");
  document.getElementById("mobileMenuBackground").classList.add("opacity-0");
  document.getElementById("mobileMenuBackground").classList.remove("hidden");

  setTimeout(() => {
    document
      .getElementById("mobileMenuBackground")
      .classList.remove("opacity-0");
  }, 1);
};

window.closeMobileMenu = () => {
  document.getElementById("closeMenu").classList.add("hidden");
  document.getElementById("openMenu").classList.remove("hidden");
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("mobileMenuBackground").classList.add("hidden");
};
