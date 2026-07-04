(function () {
  const menuToggle = document.querySelector(".docroi-menu-toggle");
  const menuNav = document.querySelector("#docroiNav");

  if (!menuToggle || !menuNav) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = menuNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  menuNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
})();
