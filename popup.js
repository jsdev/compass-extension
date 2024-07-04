document.getElementById("checkButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "checkContrast" });
  });
});

function createColorPicker(initialColor, onChangeCallback) {
  const colorPicker = document.createElement("input");
  colorPicker.type = "color";
  colorPicker.value = initialColor;
  colorPicker.addEventListener("change", onChangeCallback);
  return colorPicker;
}

function createFixOptions(result, index) {
  const fixOptions = document.createElement("div");
  fixOptions.className = "fix-options";

  const textColorPicker = createColorPicker(result.textColor, (e) => {
    applyFix(index, "color", e.target.value);
  });
  const bgColorPicker = createColorPicker(result.backgroundColor, (e) => {
    applyFix(index, "backgroundColor", e.target.value);
  });

  const revertButton = document.createElement("button");
  revertButton.textContent = "Revert";
  revertButton.addEventListener("click", () => {
    revertFix(index, "color");
    revertFix(index, "backgroundColor");
  });

  const useVarCheckbox = document.createElement("input");
  useVarCheckbox.type = "checkbox";
  useVarCheckbox.id = `useVar-${index}`;
  const useVarLabel = document.createElement("label");
  useVarLabel.htmlFor = `useVar-${index}`;
  useVarLabel.textContent = "Create new CSS variable";

  fixOptions.appendChild(document.createTextNode("Text Color: "));
  fixOptions.appendChild(textColorPicker);
  fixOptions.appendChild(document.createElement("br"));
  fixOptions.appendChild(document.createTextNode("Background Color: "));
  fixOptions.appendChild(bgColorPicker);
  fixOptions.appendChild(document.createElement("br"));
  fixOptions.appendChild(useVarCheckbox);
  fixOptions.appendChild(useVarLabel);
  fixOptions.appendChild(document.createElement("br"));
  fixOptions.appendChild(revertButton);

  return fixOptions;
}

function applyFix(index, property, value) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const useVar = document.getElementById(`useVar-${index}`).checked;
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "applyFix",
      selector: `[data-wcag-element="${index}"]`,
      property: property,
      value: value,
      isNewVariable: useVar
    });
  });
}

function revertFix(index, property) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "revertFix",
      selector: `[data-wcag-element="${index}"]`,
      property: property
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showResults") {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    request.results.forEach((result, index) => {
      const resultElement = document.createElement("div");
      resultElement.innerHTML = `
        <p>Background: ${result.backgroundColor}</p>
        <p>Text Color: ${result.textColor}</p>
        <p>Contrast Ratio: ${result.ratio.toFixed(2)}</p>
        <p>WCAG AA: ${result.compliance.AA ? "Pass" : "Fail"}</p>
        <p>WCAG AAA: ${result.compliance.AAA ? "Pass" : "Fail"}</p>
      `;

      const toggleButton = document.createElement("button");
      toggleButton.textContent = "Show Fix Options";
      toggleButton.addEventListener("click", () => {
        resultElement.classList.toggle("show-options");
        toggleButton.textContent = resultElement.classList.contains("show-options") ? "Hide Fix Options" : "Show Fix Options";
      });

      resultElement.appendChild(toggleButton);
      resultElement.appendChild(createFixOptions(result, index));
      resultElement.appendChild(document.createElement("hr"));
      resultsDiv.appendChild(resultElement);

      // Add a data attribute to the element on the page for easy selection
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "applyFix",
          selector: `[data-wcag-element="${index}"]`,
          property: "data-wcag-element",
          value: index.toString(),
          isNewVariable: false
        });
      });
    });
  }
});
