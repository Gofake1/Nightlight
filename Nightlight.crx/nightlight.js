var IS_ON            = true;
var IS_DARK          = false;
var DARKEN_IMAGES    = false;
var WEBPAGE_COLORS   = [];
var IGNORED_ELEMENTS = ['CANVAS','VIDEO','SCRIPT'];

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
  /// Returns whether the color is considered light
  this.isLight = function() {
    return this.luminance() > 100;
  };
  /// Returns whether the color is more luminated than the other
  this.lighter = function(otherColor) {
    return this.luminance() > otherColor.luminance();
  };
  /// Returns a lighter or darker color as a hex string
  /// percent: positive integer (brighter), negative (darker)
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
    return new color(r, g, b, this.a);
  };
  /// Returns the inverted color
  this.invert = function() {
    return new color(255-this.r, 255-this.g, 255-this.b, this.a);
  };
  /// Returns a color that is less similar to the other color
  /// or the same color if contrast adjustment is not needed
  this.contrast = function(otherColor) {
    if (Math.abs(this.luminance() - otherColor.luminance()) < 50) {
      return this.shade(50);
    }
    return this;
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

function makeWebpageColorsFrom(element) {
  if (
    !IGNORED_ELEMENTS.includes(element.tagName) && 
    ![3, 8].includes(element.nodeType)
  ) {
    var elementStyle = getComputedStyle(element);
    WEBPAGE_COLORS.push({
      color:   elementStyle.color,
      bgColor: elementStyle.backgroundColor,
      bgImage: elementStyle.backgroundImage
    });
  }
  element = element.firstChild;
  while (element) {
    makeWebpageColorsFrom(element);
    element = element.nextSibling;
  }
}

function nightlight(element, newBgColor, newTextColor) {
  if (
    element === undefined ||
    [3, 8].includes(element.nodeType) ||
    IGNORED_ELEMENTS.includes(element.tagName)
  ) {
    return;
  }

  if (IS_ON) {
    var style = getComputedStyle(element);
    var oldBgColor = colorFromStr(style.backgroundColor);
    var oldTextColor = colorFromStr(style.color);

    if (newBgColor === undefined) {
      newBgColor = colorFromHex('#000000');
    }
    if (newTextColor === undefined) {
      newTextColor = colorFromHex('#888888');
    }
    if (oldBgColor.isColorful()) {
      newBgColor = oldBgColor.shade(-50);
    } else if (oldBgColor.isLight() && oldBgColor.lighter(newBgColor)) {
      newBgColor = oldBgColor.invert();
    }

    switch (element.tagName) {
      case 'BODY':
        element.style.backgroundImage = 'none';
        element.style.backgroundColor = newBgColor.rgbString();
        element.style.color = oldTextColor.contrast(newBgColor).rgbString();
        break;
      case 'IMG':
        if (DARKEN_IMAGES) {
          element.style.filter = 'brightness(70%)';
        }
        break;
      case 'DIV':
      case 'SPAN':
        if (style.backgroundImage != 'none') {
          return;
        }
        element.style.backgroundColor = newBgColor.rgbString();
        element.style.color = oldTextColor.contrast(newBgColor).rgbString();
        break;
      default:
        element.style.backgroundColor = newBgColor.rgbString();
        element.style.color = oldTextColor.contrast(newBgColor).rgbString();
        break;
    }

  } else if (!IS_ON && IS_DARK) {
    switch (element.tagName) {
      case 'IMG':
        element.style.filter = null;
        break;
      default:
        element.style.backgroundColor = null;
        element.style.color = null;
    }
  } else {
    return;
  }

  element = element.firstChild;
  while (element) {
    nightlight(element, newBgColor, newTextColor);
    element = element.nextSibling;
  }
}

nightlight(document.body);
IS_DARK = true;