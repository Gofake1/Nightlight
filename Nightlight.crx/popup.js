var STATE = {
  isOn:         false,
  darkenImages: false,
  blacklist:    [],
  currentTab:   {}
};
var WARNINGS = {
  NOT_WEBPAGE: 'This is not a webpage and won\'t be modified.',
  BLACKLISTED: 'This page is blacklisted and won\'t be modified.'
};

function handleIsOn() {
  chrome.storage.local.set({
    isOn: document.getElementById('isOnCheckbox').checked
  });
}

function displayColorGrid(colors) {
  var colorGrid = document.getElementById('colorGrid');
  while (colorGrid.firstChild) {
    colorGrid.removeChild(colorGrid.firstChild);
  }

  var colorTable = document.createElement('table');
  var colorRow, colorWell;
  for (let [oldColor, newColor] of colors.textColors) {
    colorRow = document.createElement('tr');

    colorWell = document.createElement('td');
    colorWell.className = 'colorWell';
    colorWell.style.border = '2px solid '+oldColor;
    colorRow.appendChild(colorWell);

    colorWell = document.createElement('td');
    colorWell.className = 'colorWell';
    colorWell.style.border = '2px solid '+newColor;
    colorRow.appendChild(colorWell);

    colorTable.appendChild(colorRow);
  }

  for (let [oldColor, newColor] of colors.bgColors) {
    colorRow = document.createElement('tr');

    colorWell = document.createElement('td');
    colorWell.className = 'colorWell';
    colorWell.style.background = oldColor;
    colorWell.style.border = '2px solid '+oldColor;
    colorRow.appendChild(colorWell);

    colorWell = document.createElement('td');
    colorWell.className = 'colorWell';
    colorWell.style.background = newColor;
    colorWell.style.border = '2px solid '+newColor;
    colorRow.appendChild(colorWell);

    colorTable.appendChild(colorRow);
  }
  
  colorGrid.appendChild(colorTable);
}

function blacklistContains(url) {
  if (url) {
    for (var i = 0; i < STATE.blacklist.length; i++) {
      if (url.includes(STATE.blacklist[i])) {
        return true;
      }
    }
  }
  return false;
}

function isWebpage(url) {
  if (url) {
    var tokens = url.split('/');
    var fileExtension = tokens[tokens.length-1].split('.')[1];
    if (fileExtension) {
      return !['pdf'].includes(fileExtension.toLowerCase());
    }
  }
  return true;
}

function toggleNightlight() {
  document.getElementById('isOnCheckbox').checked = STATE.isOn;
  document.getElementById('statusText').innerHTML = (STATE.isOn ? '<b>On</b>' :
    'Off');
  document.getElementById('colorGrid').innerText = '';
  
  if (blacklistContains(STATE.currentTab.url)) {
    document.getElementById('colorGrid').innerText = WARNINGS.BLACKLISTED;
  } else if (!isWebpage(STATE.currentTab.url)) {
    document.getElementById('colorGrid').innerText = WARNINGS.NOT_WEBPAGE;
  } else {
    chrome.tabs.sendMessage(STATE.currentTab.id, {
      isOn:         STATE.isOn,
      darkenImages: STATE.darkenImages
    });
  }
}

function handleUpdate(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    toggleNightlight();
  }
}

function handleActivate(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    STATE.currentTab = tab;
    toggleNightlight();
  }); 
}

function handleMessage(request, sender, sendResponse) {
  console.log(request);
  if (sender.tab) {
    displayColorGrid(request.webpageColors);
  }
}

function handleOptions(changes, areaName) {
  if (changes.isOn) {
    STATE.isOn = changes.isOn.newValue;
  }
  if (changes.darkenImages) {
    STATE.darkenImages = changes.darkenImages.newValue;
  }
  if (changes.blacklist) {
    STATE.blacklist = changes.blacklist.newValue.split(',');
  }
  toggleNightlight();
}

function initState() {
  chrome.storage.local.get('isOn', function(items) {
    STATE.isOn = items.isOn;
  });
  chrome.storage.sync.get(['darkenImages', 'blacklist'], function(items) {
    STATE.darkenImages = items.darkenImages;
    STATE.blacklist = items.blacklist.split(',');
  });
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    STATE.currentTab = tabs[0];
  });
}

document.getElementById('isOnCheckbox').addEventListener('change', handleIsOn);
chrome.tabs.onUpdated.addListener(handleUpdate);
chrome.tabs.onActivated.addListener(handleActivate);
chrome.runtime.onMessage.addListener(handleMessage);
chrome.storage.onChanged.addListener(handleOptions);
initState();