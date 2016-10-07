var DARKEN_IMAGES    = false;
var IGNORED_ELEMENTS = ['CANVAS','VIDEO','SCRIPT'];
var WEBPAGE_COLORS   = {
  bgColors:   new Map(),
  textColors: new Map()
};
var STATE            = {
  ACTIVE_NOT_DARKENED:   0,
  ACTIVE_DARKENED:       1,
  INACTIVE_DARKENED:     2,
  INACTIVE_NOT_DARKENED: 3
};
var CURRENT_STATE    = STATE.INACTIVE_NOT_DARKENED;

function color(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
  this.rgbString = function() {
    return (
      this.a == 1 ? 'rgb('+this.r+','+this.g+','+this.b+')' :
                    'rgba('+this.r+','+this.g+','+this.b+','+this.a+')'
    );
  };
  this.hexString = function() {
    return '#' + (
      ((0|(1<<8) + this.r).toString(16)).substr(1) +
      ((0|(1<<8) + this.g).toString(16)).substr(1) +
      ((0|(1<<8) + this.b).toString(16)).substr(1)
    );
  };
  this.isTransparent = function() {
    return this.a === 0;
  };
  /// Return saturation from HSV color model
  this.saturation = function() {
    var max = Math.max(this.r, Math.max(this.g, this.b));
    var min = Math.min(this.r, Math.min(this.g, this.b));
    return (max - min) / max;
  };
  /// Returns whether the color should be treated as color or as grayscale
  this.isColorful = function() {
    return this.saturation() > 0.15;
  };
  /// Returns approximate ITU-R BT.601 luminance
  this.luminance = function() {
    return ((this.r*3)+this.b+(this.g*4)) >> 3;
  };
  this.isLight = function() {
    return this.luminance() > 100;
  };
  /// Returns a lighter or darker color
  /// percent: positive integer (brighter), negative (darker),
  ///          must be between [-100, 100]
  this.shade = function(percent) {
    var r = this.r + (256 - this.r) * percent/100;
    var g = this.g + (256 - this.g) * percent/100;
    var b = this.b + (256 - this.b) * percent/100;
    r = (r < 0 ? 0 : r);
    g = (g < 0 ? 0 : g);
    b = (b < 0 ? 0 : b);
    r = (r > 255 ? 255 : r);
    g = (g > 255 ? 255 : g);
    b = (b > 255 ? 255 : b);
    return new color(Math.round(r), Math.round(g), Math.round(b), this.a);
  };
  /// Returns the inverted color
  this.invert = function() {
    return new color(255-this.r, 255-this.g, 255-this.b, this.a);
  };
}

function colorFromStr(rgbStr) {
  var rgb = rgbStr.replace(/rgba?\(/, '').replace(/\)/, '').split(',');
  var r = parseInt(rgb[0]);
  var g = parseInt(rgb[1]);
  var b = parseInt(rgb[2]);
  var a = (rgb[3] === undefined ? 1 : parseFloat(rgb[3]));
  return new color(r, g, b, a);
}

function colorFromHex(hexStr) {
  var decimal = parseInt(hexStr, 16);
  var r = (decimal >> 16) & 255;
  var g = (decimal >> 8) & 255;
  var b = (decimal) & 255;
  return new color(r, g, b, 1);
}

function blackColor() {
  return new color(0, 0, 0, 1);
}

function grayColor() {
  return new color(128, 128, 128, 1);
}

function clearColor() {
  return new color(0, 0, 0, 0);
}

function makeWebpageColors(element) {
  if (
    element === undefined ||
    IGNORED_ELEMENTS.includes(element.tagName) ||
    [3, 8].includes(element.nodeType)
  ) {
    return;
  }

  var style = getComputedStyle(element);
  var oldBgColor = colorFromStr(style.backgroundColor);
  var oldTextColor = colorFromStr(style.color);
  
  var newBgColor, newTextColor;
  if (
    !oldBgColor.isTransparent() &&
    !WEBPAGE_COLORS.bgColors.has(oldBgColor.rgbString())
  ) {
    if (oldBgColor.isColorful()) {
      newBgColor = oldBgColor.shade(-20);
    } else {
      if (oldBgColor.isLight()) {
        newBgColor = oldBgColor.invert();
      } else {
        newBgColor = oldBgColor.shade(-50);
      }
    }
    WEBPAGE_COLORS.bgColors.set(
      oldBgColor.rgbString(), newBgColor.rgbString()
    );
  }

  if (
    !oldTextColor.isTransparent() &&
    !WEBPAGE_COLORS.textColors.has(oldTextColor.rgbString())
  ) {
    if (oldTextColor.isColorful()) {
      if (!oldTextColor.isLight()) {
        newTextColor = oldTextColor.shade(50);
      } else {
        newTextColor = oldTextColor;
      }
    } else {
      if (!oldTextColor.isLight()) {
        newTextColor = oldTextColor.invert();
      } else {
        newTextColor = oldTextColor;
      }
    }
    WEBPAGE_COLORS.textColors.set(
      oldTextColor.rgbString(), newTextColor.rgbString()
    );
  }

  element = element.firstChild;
  while (element) {
    makeWebpageColors(element);
    element = element.nextSibling;
  }
}

function getNewColor(type, oldColor) {
  switch (type) {
    case 'bg':
      return WEBPAGE_COLORS.bgColors.get(oldColor);
    case 'text':
      return WEBPAGE_COLORS.textColors.get(oldColor);
  }
}

function nightlight(mode, element) {
  if (
    element === undefined ||
    [3, 8].includes(element.nodeType) ||
    IGNORED_ELEMENTS.includes(element.tagName)
  ) {
    return;
  }

  if (mode == 'on') {
    var style = getComputedStyle(element);
    var oldBgColor = colorFromStr(style.backgroundColor);
    var oldTextColor = colorFromStr(style.color);

    if (oldBgColor.isTransparent()) {
      newBgColor = clearColor().rgbString();
    } else {
      newBgColor = getNewColor('bg', oldBgColor.rgbString());
    }
    if (oldTextColor.isTransparent()) {
      newTextColor = clearColor().rgbString();
    } else {
      newTextColor = getNewColor('text', oldTextColor.rgbString());
    }
    
    if (newBgColor === undefined) {
      newBgColor = blackColor().rgbString();
    }
    if (newTextColor === undefined) {
      newTextColor = grayColor().rgbString();
    }

    switch (element.tagName) {
      case 'BODY':
        if (colorFromStr(newBgColor).isTransparent()) {
          newBgColor = blackColor().rgbString();
        }
        element.style.backgroundImage = 'none';
        element.style.backgroundColor = newBgColor;
        element.style.color = newTextColor;
        break;
      case 'IMG':
        if (DARKEN_IMAGES) {
          element.style.filter = 'brightness(70%)';
        }
        break;
      case 'DIV':
      case 'SPAN':
        if (style.backgroundImage != 'none') {
          // invertText
          break;
        }
        element.style.backgroundColor = newBgColor;
        element.style.color = newTextColor;
        break;
      default:
        element.style.backgroundColor = newBgColor;
        element.style.color = newTextColor;
        break;
    }

  } else if (mode == 'off') {
    switch (element.tagName) {
      case 'IMG':
        element.style.filter = null;
        break;
      default:
        element.style.backgroundColor = null;
        element.style.color = null;
    }
  }

  element = element.firstChild;
  while (element) {
    nightlight(mode, element);
    element = element.nextSibling;
  }
}

function update(isOn) {
  switch (CURRENT_STATE) {
    case STATE.ACTIVE_NOT_DARKENED:
      makeWebpageColors(document.body);
      nightlight('on', document.body);
      CURRENT_STATE = STATE.ACTIVE_DARKENED;
      break;
    case STATE.ACTIVE_DARKENED:
      if (!isOn) {
        CURRENT_STATE = STATE.INACTIVE_DARKENED;
        update(isOn);
      }
      break;
    case STATE.INACTIVE_DARKENED:
      nightlight('off', document.body);
      CURRENT_STATE = STATE.INACTIVE_NOT_DARKENED;
      break;
    case STATE.INACTIVE_NOT_DARKENED:
      if (isOn) {
        CURRENT_STATE = STATE.ACTIVE_NOT_DARKENED;
        update(isOn);
      }
      break;
  }
  safari.self.tab.dispatchMessage('webpageColors', WEBPAGE_COLORS);
}

function handleMessage(event) {
  switch (event.name) {
    case 'toggleNightlight':
      DARKEN_IMAGES = event.message.darkenImages;
      update(event.message.isOn);
      break;
  }
}

function handleMutations(mutations) {
  mutations.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(addedNode) {
      makeWebpageColors(addedNode);
      if (CURRENT_STATE == (STATE.ACTIVE_DARKENED || STATE.ACTIVE_NOT_DARKENED)) {
        nightlight('on', addedNode);
      }
    });
  });
  safari.self.tab.dispatchMessage('webpageColors', WEBPAGE_COLORS);
}

safari.self.addEventListener('message', handleMessage, false);
var observer = new MutationObserver(handleMutations);
observer.observe(document.body, {childList: true, subtree: true});