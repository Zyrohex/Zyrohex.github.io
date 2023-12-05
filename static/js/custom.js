function collapseAndAbbreviateNamespaceRefs() {
  const observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      for (const node of mutation.addedNodes) {
        if (!node.querySelectorAll) continue;

        const initialNamespaceRefs = node.querySelectorAll(
          '.ls-block a.page-ref[data-ref*="/"], .foldable-title .page-ref[data-ref*="/"], li[title*="root/"] .page-title, a.tag[data-ref*="/"]'
        );
        const pageTitleRefs = node.querySelectorAll('.page-title');
        const filteredPageTitleRefs = Array.from(pageTitleRefs).filter((pageTitleRef) =>
          Array.from(pageTitleRef.childNodes).some((child) => child.nodeType === 3 && child.textContent.includes('/'))
        );
        const namespaceRefs = [...initialNamespaceRefs, ...filteredPageTitleRefs];

        for (const namespaceRef of namespaceRefs) {
          const text = namespaceRef.textContent;
          const testText = namespaceRef.classList.contains("tag")
            ? text.substring(1).toLowerCase()
            : text.toLowerCase();
          if (testText !== namespaceRef.dataset.ref) continue;

          // Perform collapsing.
          let abbreviatedText;
          if (namespaceRef.classList.contains("tag")) {
            const parts = text.split('/');
            abbreviatedText = "#" + parts[parts.length - 1]; // Retain the '#' and get the last part of the path
          } else {
            const parts = text.split('/');
            abbreviatedText = parts[parts.length - 1];
          }

          namespaceRef.dataset.origText = text;
          namespaceRef.textContent = abbreviatedText;
        }
      }
    }
  });

  observer.observe(document.getElementById("app-container"), {
    subtree: true,
    childList: true,
  });
}

collapseAndAbbreviateNamespaceRefs();

function updatePageReferencesWithCurrentClass() {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        updateCurrentPageRefs();
      }
    }
  });

  function updateCurrentPageRefs() {
    const titleBlock = document.querySelector('.title.block');
    if (!titleBlock) return;

    const titleText = titleBlock.textContent.trim().toLowerCase();
    const pageRefs = document.querySelectorAll('.ls-block .page-ref');

    // Add or remove "current-page-ref" class based on matching with ".title.block" value
    pageRefs.forEach((pageRef) => {
      const dataRef = pageRef.getAttribute('data-ref').toLowerCase();
      if (dataRef === titleText) {
        pageRef.classList.add('current-page-ref');
      } else {
        pageRef.classList.remove('current-page-ref');
      }
    });
  }

  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });

  // Apply the class to the elements immediately and also check for any mismatches
  updateCurrentPageRefs();
}

// Initialize the function to start observing and update classes accordingly
updatePageReferencesWithCurrentClass();
