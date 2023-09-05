// Abbreviate namespace
// Eample: "root/foo/bar" -> "r/f/bar"
function abbreviate(text, isTag) {
  return text
    .split("/")
    .map((part, index, arr) => {
      if (index === arr.length - 1) {
        return part; // return the last part unabbreviated
      } else {
        return part
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .join(""); // abbreviate other parts and capitalize
      }
    })
    .join("/");
}

function abbreviateNamespace(selector) {
  const appContainer = document.getElementById("app-container");

  const handleNamespaceHover = (event) => {
    const namespaceRef = event.target.closest(selector);
    if (!namespaceRef) return;

    if (event.type === "mouseenter") {
      namespaceRef.textContent = namespaceRef.dataset.origText;
    } else if (event.type === "mouseleave") {
      namespaceRef.textContent = namespaceRef.dataset.abbreviatedText;
    }
  };

  appContainer.addEventListener("mouseenter", handleNamespaceHover, true);
  appContainer.addEventListener("mouseleave", handleNamespaceHover, true);

  const observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      for (const node of mutation.addedNodes) {
        if (!node.querySelectorAll) continue;

        const namespaceRefs = node.querySelectorAll(selector);
        for (const namespaceRef of namespaceRefs) {
          const text = namespaceRef.textContent;
          const isTag = namespaceRef.classList.contains("tag");
          const testText = isTag
            ? text.substring(1).toLowerCase()
            : text.toLowerCase();
          if (testText !== namespaceRef.dataset.ref) continue;

          const abbreviatedText = abbreviate(text, isTag);

          namespaceRef.dataset.origText = text;
          namespaceRef.dataset.abbreviatedText = abbreviatedText;
          namespaceRef.textContent = abbreviatedText;
        }
      }
    }
  });

  observer.observe(appContainer, {
    subtree: true,
    childList: true,
  });
}

abbreviateNamespace(
  '.ls-block a.page-ref[data-ref*="/"], .foldable-title [data-ref*="/"], li[title*="root/"] .page-title, a.tag[data-ref*="/"], .title[data-ref*="/"]'
);

// Process all elements
function processAllElements() {
  // Process elements that are present at the time of page load
  processBlockElements(document.querySelectorAll('.ls-block'));
  processBreadcrumbElements(document.querySelectorAll('.breadcrumb .inline-wrap'));
  processTaggedElements(document.querySelectorAll('.ls-block > .block-main-container .tag'));
}

// Function to process existing elements
function processBlockElements(blockPropertiesElements) {
  for (const blockElement of blockPropertiesElements) {
    // Search through all text nodes in the current blockElement
    const walker = document.createTreeWalker(blockElement, NodeFilter.SHOW_TEXT);
    let textNode;

    while (textNode = walker.nextNode()) {
      let textContent = textNode.textContent;

      // Check if the text starts with a question
      let isQuestion = textContent.trim().match(/^[A-Za-z0-9\s'()\-&"..,]+[\?]/);

      // Find the ancestor element
      let ancestorElement = blockElement.closest('.ls-block');

      // Get '.block-main-container .inline' element within the ancestor '.ls-block'
      let inlineElement = ancestorElement.querySelector('.block-main-container .block-content-inner .inline');

      // Check if the inlineElement exists and contains only ".page-reference" elements
      let pageRefOnly = false;
      if (inlineElement) {
        let totalChildren = Array.from(inlineElement.childNodes).filter(node => node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && /\S/.test(node.textContent))).length;
        let pageRefChildren = inlineElement.querySelectorAll('.page-reference').length;
        pageRefOnly = totalChildren === pageRefChildren;
      }

      // If the textContent starts with a question, add the class
      if (isQuestion) {
        ancestorElement.classList.add('descriptor-block');
      }

      // If the inlineElement contains only page-reference elements, add the 'concept-block' class
      if (pageRefOnly) {
        ancestorElement.classList.add('concept-block');
      } else {
        ancestorElement.classList.remove('concept-block');
      }
    }
  }
}

function processTaggedElements(blockElements) {
  let classToAdd = 'tagged-block'
  if (blockElements) {
    for (const blockElement of blockElements) {
      let ancestorElement = blockElement.closest('.ls-block');
      ancestorElement.classList.add(classToAdd);
    }
  }
}

// Function to remove :-, ;- and !- from breadcrumb elements
function processBreadcrumbElements(breadcrumbElements) {
  for (const breadcrumbElement of breadcrumbElements) {
    let textContent = breadcrumbElement.textContent;
    // Replace :-, ;- and !- with empty string
    textContent = textContent.replace(/:-|;-|!-/g, '');
    breadcrumbElement.textContent = textContent;
  }
}

// Function to add the descriptor-block class
function processDescriptorBlocks() {
  // Find all concept-block elements
  let conceptBlocks = document.querySelectorAll('.concept-block');
  
  for (const conceptBlock of conceptBlocks) {
    // Find all child ls-block elements
    let childBlocks = conceptBlock.querySelectorAll('.ls-block');

    for (const childBlock of childBlocks) {
      // If the childBlock is not also a concept-block, add the descriptor-block class
      if (!childBlock.classList.contains('concept-block')) {
        childBlock.classList.add('descriptor-block');
      }
    }
  }
}

function indexBlocks3() {
  processAllElements();
  /*processDescriptorBlocks();*/

  const observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (!node.querySelectorAll) continue;
          processBlockElements(node.querySelectorAll('.ls-block .inline'));
          processBreadcrumbElements(node.querySelectorAll('.breadcrumb .inline-wrap'));
          processTaggedElements(document.querySelectorAll('.ls-block > .block-main-container .tag'));
          /*processDescriptorBlocks();*/
        }
      } else if (mutation.type === 'characterData') {
        processAllElements();
        /*processDescriptorBlocks();*/
      }
    }
  });

  let keyboardInputTimeout;
  let shouldProcessMutations = true;

  document.addEventListener('keydown', (event) => {
    clearTimeout(keyboardInputTimeout);
    keyboardInputTimeout = setTimeout(() => {
      shouldProcessMutations = false;
    }, 2000); // 2 seconds
  });

  document.addEventListener('keyup', (event) => {
    clearTimeout(keyboardInputTimeout);
    shouldProcessMutations = true;
  });

  observer.observe(document.getElementById("app-container"), {
    subtree: true,
    childList: true,
    characterData: false,
  });
}

function applyMatchingStyles() {
  // Get the value of ref-value attribute from .page
  var refValue = document.querySelector('.title').getAttribute('data-ref');

  // Get all the .page-ref elements
  var pageRefs = document.querySelectorAll('.page-ref');

  // Iterate through the .page-ref elements
  pageRefs.forEach(function(pageRef) {
    // Check if the data-value attribute is the same as the refValue
    if (pageRef.getAttribute('data-ref') === refValue) {
      // Apply the styles to the matching elements
      pageRef.style.color = 'red'; // Example style
    }
  });
}

function pageLink(name, originalName){
    const a = document.createElement("a");
    a.classList.add("page-ref");
    a.href = "#/page/" + encodeURIComponent(name);
    a.textContent = originalName;
    return a;
}

function toggleChildren(button){
    const isExpanded = (button.textContent === "-");
    button.textContent = (isExpanded) ? "+" : "-";

    const newStyle = (isExpanded) ? "none" : "block";
    Array.prototype.filter.call(button.parentElement.children, (child)=>{
        if (child.className === "pagetree-node") child.style.setProperty("display", newStyle);
    });
}

const PageTree = { queries: { from: {}, to: {} }, max: {depth: 16, siblings: 16}, titles: {} };

PageTree.button = function treeButton(textContent, clickHandler){
    const button = document.createElement("button");
    button.classList.add("tree-button");
    button.textContent = textContent;
    if (clickHandler) button.addEventListener("click", clickHandler);
    return button;
}
PageTree.node = function treeNode(button, link){
    const div = document.createElement("div");
    div.classList.add("pagetree-node");
    div.append(button, link);
    return div;
}

PageTree.filler = function fillChildDivs(direction, divParent, strProp, children, depth){
    children.forEach( (child)=>{
        const childName = child["original-name"];
        const children = PageTree.getData(direction, "children", strProp, childName);
        const nofChildren = children.length;
        const newDepth = depth - 1;
        const small = (newDepth > 0 && nofChildren <= PageTree.max.siblings);

        const buttonText = (nofChildren) ? ((small) ? "-" : "...") : " ";
        const buttonHandler = nofChildren && function(e){
            e.preventDefault();
            e.stopPropagation();

            if (button.textContent === "...") {
                PageTree.filler(direction, divChild, strProp, children, PageTree.max.depth);
            }
            toggleChildren(button);
        }
        const button = PageTree.button(buttonText, buttonHandler);

        const link = pageLink(child.name, childName);
        const divChild = PageTree.node(button, link);
        if (nofChildren && small) {
            PageTree.filler(direction, divChild, strProp, children, newDepth);
        }
        divParent.append(divChild);
    });
}

PageTree.getData = function getData(direction, nodestype, strProp, strParent){
    const query = PageTree.queries[direction][nodestype](strProp, strParent);
    return logseq.api.datascript_query(query).flat().sort( (a, b)=>{ return a.name.localeCompare(b.name) } );
}

PageTree.queries.from.children = function queryChildrenFrom(strProp, strParent){
    return `[
        :find (pull ?Child [*])
        :where
            [?child :block/page ?Child]
            [?child :block/properties ?child-props]
            [(get ?child-props :${strProp}) ?child-from]
            [?Parent :block/name "${strParent.toLowerCase()}"]
            [?Parent :block/original-name ?Parent-name]
            [(contains? ?child-from ?Parent-name)]
    ]`;
}
PageTree.queries.from.roots = function queryRootsFrom(strProp){
    return `[
        :find (pull ?Root [*])
        :where
            [?child :block/properties ?child-props]
            [(get ?child-props :${strProp}) ?child-from]
            [?Root :block/original-name ?Root-name]
            [(contains? ?child-from ?Root-name)]
            (not
                [?root :block/page ?Root]
                [?root :block/properties ?root-props]
                [(get ?root-props :${strProp}) ?root-from]
            )
    ]`;
}
PageTree.queries.to.children = function queryChildrenTo(strProp, strParent){
    return `[
        :find (pull ?Child [*])
        :where
            [?Parent :block/name "${strParent.toLowerCase()}"]
            [?parent :block/page ?Parent]
            [?parent :block/properties ?parent-props]
            [(get ?parent-props :${strProp}) ?parent-to]
            [?Child :block/original-name ?Child-name]
            [(contains? ?parent-to ?Child-name)]
    ]`;
}
PageTree.queries.to.roots = function queryRootsTo(strProp){
    return `[
        :find (pull ?Root [*])
        :where
            [?root :block/page ?Root]
            [?root :block/properties ?root-props]
            [(get ?root-props :${strProp}) ?root-to]
            (not 
                [?parent :block/properties ?parent-props]
                [(get ?parent-props :${strProp}) ?parent-to]
                [?Root :block/original-name ?Root-name]
                [(contains? ?parent-to ?Root-name)]
            )
    ]`;
}

PageTree.titles.from = "Tree from strProp:"
PageTree.titles.to = "Tree to strProp:"

PageTree.observer = new MutationObserver(() => {
    document.querySelectorAll("div.pagetree").forEach( (div)=>{
        const strProp = div.getAttribute("data-treeprop");
        if (!strProp) return;

        div.removeAttribute("data-treeprop");
        const direction = div.getAttribute("data-treedirection");
        const roots = PageTree.getData(direction, "roots", strProp);
        div.textContent = PageTree.titles[direction].replace("strProp", strProp);

        const nofRoots = roots.length;
        const buttonHandler = nofRoots && function(e){
            e.preventDefault();
            e.stopPropagation();
            toggleChildren(button);
        }
        const button = PageTree.button((nofRoots) ? "-" : "Ø", buttonHandler);
        div.prepend(button);

        PageTree.filler(direction, div, strProp, roots, PageTree.max.depth);
    });
});
PageTree.observer.observe(document.getElementById("main-content-container"), {
    attributes: true,
    subtree: true,
    attributeFilter: ["class"],
});

// Attach the function to the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', applyMatchingStyles);
// indexBlocks3();
collapseAndAbbreviateNamespaceRefs();
