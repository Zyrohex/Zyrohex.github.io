function collapseAndAbbreviateNamespaceRefs() {
  const observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      for (const node of mutation.addedNodes) {
        if (!node.querySelectorAll) continue;

        const initialNamespaceRefs = node.querySelectorAll(
          '.ls-block a.page-ref[data-ref*="/"], .foldable-title [data-ref*="/"], li[title*="root/"] .page-title, a.tag[data-ref*="/"]'
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
