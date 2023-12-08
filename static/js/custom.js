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

function updatePageReferencesWithSiblingClasses() {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        updatePageReferences();
      }
    }
  });

  function updatePageReferences() {
    const inlineElements = document.querySelectorAll('.inline');

    inlineElements.forEach((inline) => {
      let firstNonPageReferenceFound = false;
      let lastPageRef = null;

      Array.from(inline.childNodes).forEach((child) => {
        // Skip whitespace-only text nodes
        if (child.nodeType === Node.TEXT_NODE && !child.textContent.trim()) {
          return;
        }

        if (!firstNonPageReferenceFound && child.nodeType === Node.ELEMENT_NODE && child.classList.contains('page-reference')) {
          child.classList.add('first-with-siblings');
          lastPageRef = child; // Keep track of the last qualifying page reference
        } else {
          firstNonPageReferenceFound = true;
          if (child.classList) {
            child.classList.remove('first-with-siblings');
          }
        }
      });

      // Add 'last-with-siblings' class to the last qualifying page reference
      if (lastPageRef) {
        // Remove the class from all, then add to the last one
        inline.querySelectorAll('.last-with-siblings').forEach(el => {
          el.classList.remove('last-with-siblings');
        });
        lastPageRef.classList.add('last-with-siblings');
      }
    });
  }

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  // Apply the class to the elements immediately and also check for any mismatches
  updatePageReferences();
}

// Call the function to initialize
updatePageReferencesWithSiblingClasses();

/*function updatePageReferencesWithLastChildClass() {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        updatePageReferences();
      }
    }
  });

  function updatePageReferences() {
    const inlineElements = document.querySelectorAll('.inline');

    inlineElements.forEach((inline) => {
      let lastPageRef = null;

      // Iterate in reverse order to find the last .page-reference
      Array.from(inline.childNodes).reverse().forEach((child) => {
        // Skip whitespace-only text nodes
        if (child.nodeType === Node.TEXT_NODE && !child.textContent.trim()) {
          return;
        }

        // Identify the last .page-reference
        if (!lastPageRef && child.nodeType === Node.ELEMENT_NODE && child.classList.contains('page-reference')) {
          lastPageRef = child;
        }
      });

      // Apply the 'last-with-siblings' class to the last .page-reference
      if (lastPageRef) {
        inline.querySelectorAll('.page-reference').forEach(el => {
          el.classList.remove('last-with-siblings'); // Remove from all first
        });
        lastPageRef.classList.add('last-with-siblings'); // Add to the last one
      }
    });
  }

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  // Apply the class to the elements immediately and also check for any mismatches
  updatePageReferences();
}

// Call the function to initialize
updatePageReferencesWithLastChildClass();
*/

function updateFirstTagDirectParentClass() {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        updateFirstTagParent();
      }
    }
  });

  function updateFirstTagParent() {
    const inlineElements = document.querySelectorAll('.inline');

    inlineElements.forEach((inline) => {
      let firstTagParentFound = false;

      Array.from(inline.querySelectorAll('.tag')).forEach((tag) => {
        const parent = tag.parentElement;
        if (!firstTagParentFound && parent) {
          parent.classList.add('first-tag');
          firstTagParentFound = true;
        }
      });

      // If no .tag is found, ensure no elements incorrectly retain the 'first-tag' class
      if (!firstTagParentFound) {
        inline.querySelectorAll('.first-tag').forEach(tagParent => {
          tagParent.classList.remove('first-tag');
        });
      }
    });
  }

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  // Apply the class to the elements immediately and also check for any mismatches
  updateFirstTagParent();
}

// Call the function to initialize
updateFirstTagDirectParentClass();
