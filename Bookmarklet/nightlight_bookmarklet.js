var IGNORED_ELEMENTS = ['VIDEO', 'SCRIPT'];
var WEBPAGE_COLORS = {
  bgColors:   new Map(),
  textColors: new Map()
};

function Color(r, g, b, a) {
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
  /// Returns saturation from HSV color model
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
    return new Color(Math.round(r), Math.round(g), Math.round(b), this.a);
  };
  /// Returns the inverted color
  this.invert = function() {
    return new Color(255-this.r, 255-this.g, 255-this.b, this.a);
  };
}

function ColorFromStr(rgbStr) {
  if (rgbStr === undefined) {
    return;
  }
  var rgb = rgbStr.replace(/rgba?\(/, '').replace(/\)/, '').split(',');
  var r = parseInt(rgb[0]);
  var g = parseInt(rgb[1]);
  var b = parseInt(rgb[2]);
  var a = (rgb[3] === undefined ? 1 : parseFloat(rgb[3]));
  return new Color(r, g, b, a);
}

function BlackColor() {
  return new Color(0, 0, 0, 1);
}

function GrayColor() {
  return new Color(128, 128, 128, 1);
}

function TransparentColor() {
  return new Color(0, 0, 0, 0);
}

function setNewColor(type, oldColor, newColor) {
  switch (type) {
    case 'bg':
      WEBPAGE_COLORS.bgColors.set(oldColor.rgbString(), newColor.rgbString());
      break;
    case 'text':
      WEBPAGE_COLORS.textColors.set(oldColor.rgbString(), newColor.rgbString());
      break;
  }
}

function getNewColor(type, oldColorStr) {
  switch (type) {
    case 'bg':
      return WEBPAGE_COLORS.bgColors.get(oldColorStr);
    case 'text':
      return WEBPAGE_COLORS.textColors.get(oldColorStr);
  }
}

function nightlight(element) {
  if (element === undefined || 
    [3, 8].includes(element.nodeType) || 
    IGNORED_ELEMENTS.includes(element.tagName)) {
    return;
  }

  var style = getComputedStyle(element);
  var oldBgColor = ColorFromStr(style.backgroundColor);
  var oldTextColor = ColorFromStr(style.color);
  var newBgColor, newTextColor;

  if (!WEBPAGE_COLORS.bgColors.has(oldBgColor.rgbString())) {
    if (oldBgColor.isTransparent()) {
      setNewColor('bg', oldBgColor, TransparentColor());
    } else if (oldBgColor.isColorful()) {
      setNewColor('bg', oldBgColor, oldBgColor.shade(-20));
    } else if (oldBgColor.isLight()) {
      setNewColor('bg', oldBgColor, oldBgColor.invert());
    } else {
      setNewColor('bg', oldBgColor, oldBgColor.shade(-50));
    }
  }
  newBgColor = ColorFromStr(getNewColor('bg', oldBgColor.rgbString()));
  
  if (!WEBPAGE_COLORS.textColors.has(oldTextColor.rgbString())) {
    if (oldTextColor.isTransparent()) {
      setNewColor('text', oldTextColor, TransparentColor());
    } else if (oldTextColor.isColorful()) {
      if (!oldTextColor.isLight()) {
        setNewColor('text', oldTextColor, oldTextColor.shade(50));
      } else {
        setNewColor('text', oldTextColor, oldTextColor);
      }
    } else {
      if (!oldTextColor.isLight()) {
        setNewColor('text', oldTextColor, oldTextColor.invert());
      } else {
        setNewColor('text', oldTextColor, oldTextColor);
      }
    }
  }
  newTextColor = ColorFromStr(getNewColor('text', oldTextColor.rgbString()));

  if (newBgColor === undefined) {
    newBgColor = BlackColor();
  }
  if (newTextColor === undefined) {
    newTextColor = GrayColor();
  }

  switch (element.tagName) {
    case 'BODY':
      if (newBgColor.isTransparent()) {
        newBgColor = BlackColor();
      }
      element.style.backgroundImage = 'none';
      element.style.setProperty('background-color', newBgColor.rgbString(), 'important');
      element.style.setProperty('color', newTextColor.rgbString(), 'important');
      break;
    case 'CANVAS':
      element.parentNode.removeChild(element);
      break;
    case 'IMG':
      element.style.filter = 'brightness(70%)';
      break;
    case 'DIV':
    case 'SPAN':
      if (style.backgroundImage != 'none') {
        return;
      }
      element.style.setProperty('background-color', newBgColor.rgbString(), 'important');
      element.style.borderColor = newTextColor.rgbString();
      if (!newBgColor.isLight()) {
        element.style.color = newTextColor.rgbString();
      }
      break;
    default:
      element.style.backgroundColor = newBgColor.rgbString();
      element.style.color = newTextColor.rgbString();
      break;
  }
  
  element = element.firstChild;
  while (element) {
    nightlight(element);
    element = element.nextSibling;
  }
}

nightlight(document.body);