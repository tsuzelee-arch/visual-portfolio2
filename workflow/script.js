const currentScriptUrl = document.currentScript?.src || new URL("workflow/script.js", document.baseURI).href;
const projectRootUrl = new URL("../", currentScriptUrl);
const imageExtensions = ["png", "jpg", "jpeg", "webp", "gif"];
const directImageRefs = new Map([
  ["a6.4", "a/a6.4.png"],
]);
const lightbox = document.createElement("div");
const lightboxImage = document.createElement("img");
const lightboxClose = document.createElement("button");

lightbox.className = "image-lightbox";
lightbox.hidden = true;
lightboxImage.alt = "放大圖片";
lightboxClose.className = "image-lightbox-close";
lightboxClose.type = "button";
lightboxClose.setAttribute("aria-label", "關閉放大圖片");
lightboxClose.innerHTML = "&times;";
lightbox.append(lightboxImage, lightboxClose);
document.body.append(lightbox);

function imageUrlFor(ref, extension) {
  if (directImageRefs.has(ref)) {
    return new URL(directImageRefs.get(ref), projectRootUrl).href;
  }

  const folder = ref.trim().charAt(0).toLowerCase();
  return new URL(`${folder}/${ref}.${extension}`, projectRootUrl).href;
}

function loadImageCandidate(ref, extensionIndex = 0) {
  if (extensionIndex >= imageExtensions.length) {
    return Promise.resolve(null);
  }

  const image = new Image();
  const url = imageUrlFor(ref, imageExtensions[extensionIndex]);

  return new Promise((resolve) => {
    image.onload = () => resolve(url);
    image.onerror = () => resolve(loadImageCandidate(ref, extensionIndex + 1));
    image.src = url;
  });
}

function openLightbox(url) {
  lightboxImage.src = url;
  lightbox.hidden = false;
  requestAnimationFrame(() => lightbox.classList.add("is-open"));
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  window.setTimeout(() => {
    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
  }, 180);
}

async function mountNodeImages(node) {
  const refs = (node.dataset.imageRefs || "").split(/\s+/).filter(Boolean);
  if (refs.length === 0) return;

  const urls = (await Promise.all(refs.map((ref) => loadImageCandidate(ref)))).filter(Boolean);
  if (urls.length === 0) return;

  const media = document.createElement("div");
  media.className = "node-media";
  media.dataset.count = String(urls.length);

  urls.forEach((url) => {
    const image = document.createElement("img");
    image.src = url;
    image.alt = "對應流程圖片";
    image.loading = "lazy";
    image.decoding = "async";
    image.tabIndex = 0;
    image.addEventListener("click", () => openLightbox(url));
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(url);
      }
    });
    media.append(image);
  });

  node.append(media);
}

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox || event.target === lightboxClose) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});

document.querySelectorAll("[data-image-refs]").forEach((node) => {
  mountNodeImages(node);
});

// Drag to scroll functionality
document.querySelectorAll(".flow-scroll").forEach((slider) => {
  let isDown = false;
  let isDragging = false;
  let startX;
  let scrollLeft;

  slider.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // Only left click
    isDown = true;
    isDragging = false;
    slider.classList.add("is-dragging");
    startX = e.pageX;
    scrollLeft = slider.scrollLeft;
  });

  window.addEventListener("mouseup", () => {
    if (isDown) {
      isDown = false;
      slider.classList.remove("is-dragging");
      setTimeout(() => { isDragging = false; }, 0);
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    // e.preventDefault() on window can sometimes cause warnings, but it's fine here if passive: false
    if (e.cancelable) e.preventDefault();
    
    const x = e.pageX;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      isDragging = true;
    }
    slider.scrollLeft = scrollLeft - walk;
  }, { passive: false });

  slider.addEventListener("dragstart", (e) => e.preventDefault());

  slider.addEventListener("click", (e) => {
    if (isDragging) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
});
