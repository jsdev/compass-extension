function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1[0], color1[1], color1[2]);
  const lum2 = getLuminance(color2[0], color2[1], color2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function checkWCAGCompliance(ratio) {
  return {
    AA: ratio >= 4.5,
    AAA: ratio >= 7
  };
}
function scanDOM() {
  const elements = document.getElementsByTagName("*");
  const results = [];

  for (let element of elements) {
    const style = window.getComputedStyle(element);
    const bgColor = style.backgroundColor;
    const textColor = style.color;

    // Convert colors to RGB arrays
    const bgRGB = bgColor.match(/\d+/g).map(Number);
    const textRGB = textColor.match(/\d+/g).map(Number);

    const ratio = getContrastRatio(bgRGB, textRGB);
    const compliance = checkWCAGCompliance(ratio);

    if (!compliance.AA || !compliance.AAA) {
      results.push({
        element: element,
        backgroundColor: bgColor,
        textColor: textColor,
        ratio: ratio,
        compliance: compliance,
        cssVariables: {
          color: style.getPropertyValue('--text-color'),
          backgroundColor: style.getPropertyValue('--background-color')
        }
      });
    }
  }

  chrome.runtime.sendMessage({ action: "showResults", results: results });
}

function applyFix(elementSelector, property, value, isNewVariable) {
  const element = document.querySelector(elementSelector);
  if (!element) return;

  if (isNewVariable) {
    const varName = `--wcag-fix-${property}`;
    document.documentElement.style.setProperty(varName, value);
    element.style.setProperty(property, `var(${varName})`);
  } else {
    element.style.setProperty(property, value, 'important');
  }
}

function revertFix(elementSelector, property) {
  const element = document.querySelector(elementSelector);
  if (!element) return;
  element.style.removeProperty(property);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "applyFix") {
    applyFix(request.selector, request.property, request.value, request.isNewVariable);
  } else if (request.action === "revertFix") {
    revertFix(request.selector, request.property);
  }
});


