var defaults = {
  darkenImages: false,
  autoOn:       false,
  onTime:       '22:00',
  offTime:      '8:00',
  blacklist:    'netflix.com'
};

function restore() {
  chrome.storage.sync.get(defaults, function(items) {
    document.getElementById('darkenImages').checked = items.darkenImages;
    document.getElementById('autoOn').checked       = items.autoOn;
    document.getElementById('onTime').value         = items.onTime;
    document.getElementById('offTime').value        = items.offTime;
    document.getElementById('blacklist').value      = items.blacklist;
  });
}

function handleAutoOn() {
  if (document.getElementById('autoOn').checked) {
    document.getElementById('onTime').disabled = false;
    document.getElementById('offTime').disabled = false;
  } else {
    document.getElementById('onTime').disabled = true;
    document.getElementById('offTime').disabled = true;
  }
}

function save() {
  chrome.storage.sync.set({
    darkenImages: document.getElementById('darkenImages').checked,
    autoOn:       document.getElementById('autoOn').checked,
    onTime:       document.getElementById('onTime').value,
    offTime:      document.getElementById('offTime').value,
    blacklist:    document.getElementById('blacklist').value
  }, function() {
    document.getElementById('status').innerText = 'Options updated';
    setTimeout(function() {
      document.getElementById('status').innerText = '';
    }, 1000);
  });
}

function setDefaults() {
  chrome.storage.sync.set(defaults, function() {
    restore();
    document.getElementById('status').innerText = 'Restored defaults';
    setTimeout(function() {
      document.getElementById('status').innerText = '';
    }, 1000);
  });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('autoOn').addEventListener('change', handleAutoOn);
document.getElementById('save').addEventListener('click', save);
document.getElementById('defaults').addEventListener('click', setDefaults);
handleAutoOn();