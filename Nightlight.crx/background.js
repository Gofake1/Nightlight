function dateFromString(str) {
  var tokens = str.split(':');
  var now = new Date();
  var later = new Date(now.getFullYear(), now.getMonth(), now.getDate(), tokens[0], 
    tokens[1], 0, 0);
}

function setAlarm(name, time) {
  chrome.alarms.clear(name);
  chrome.alarms.create(name, {
    when:            dateFromString(time),
    periodInMinutes: 24*60
  });
}

chrome.storage.onChanged.addListener(function(changes, areaName) {
  if (changes.autoOn) {
    if (changes.autoOn.newValue === true) {
      chrome.storage.sync.get(['onTime', 'offTime'], function(items) {
        setAlarm('onTime', items.onTime);
        setAlarm('offTime', items.offTime);
      });
    } else {
      chrome.alarms.clearAll();
    }
  }
  if (changes.onTime) {
    setAlarm('onTime', changes.onTime.newValue);
  }
  if (changes.offTime) {
    setAlarm('offTime', changes.offTime.newValue);
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  switch (alarm.name) {
    case 'onTime':
      chrome.storage.local.set({isOn: true});
      break;
    case 'offTime':
      chrome.storage.local.set({isOn: false});
      break;
  }
});

chrome.storage.sync.get(['autoOn', 'onTime', 'offTime'], function(items) {
  if (items.autoOn !== true) {
    return;
  }
  if (items.onTime) {
    setAlarm('onTime', items.onTime);
  }
  if (items.offTime) {
    setAlarm('offTime', items.offTime);
  }
});

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.storage.local.set({isOn: false});
  chrome.storage.sync.set({
    darkenImages: false,
    autoOn:       false,
    onTime:       '22:00',
    offTime:      '8:00',
    blacklist:    'netflix.com'
  });
});