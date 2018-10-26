class BundleList {
  constructor(bundles, enabled) {
    this.bundles = bundles;
    this.enabled = enabled;
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    if(enabled) {
      this.bundles.forEach(b => b.enable());
    } else {
      this.bundles.forEach(b => b.disable());
    }
  }
  hotload(newBundles) {
    this.bundles = this.bundles.concat(newBundles);
    if(this.enabled) {
      newBundles.forEach(b => b.enable());
    }
  }
}

class StyleSheetBuiltinBundle {
  constructor(str) {
    this.node = document.createElement('style');
    this.node.appendChild(document.createTextNode(str));
    this.node.disabled = true;
    this.node.id = '_nightlight_builtin_'+StyleSheetBuiltinBundle.nextId();
    document.head.appendChild(this.node);
  }
  enable() {
    this.node.disabled = false;
  }
  disable() {
    this.node.disabled = true;
  }
  static nextId() {
    const id = StyleSheetBuiltinBundle.id;
    StyleSheetBuiltinBundle.id++;
    return id;
  }
}
StyleSheetBuiltinBundle.id = 0;

class StyleSheetOverrideBundle {
  constructor(str) {
    this.node = document.createElement('style');
    this.node.appendChild(document.createTextNode(str));
    this.node.disabled = true;
    this.node.id = '_nightlight_override_'+StyleSheetOverrideBundle.nextId();
    document.head.appendChild(this.node);
  }
  enable() {
    this.node.disabled = false;
  }
  disable() {
    this.node.disabled = true;
  }
  static nextId() {
    const id = StyleSheetOverrideBundle.id;
    StyleSheetOverrideBundle.id++;
    return id;
  }
}
StyleSheetOverrideBundle.id = 0;

class AttributeBundle {
  constructor(node, attr, originalValue, newValue) {
    this.node = node;
    this.attr = attr;
    this.originalValue = originalValue;
    this.newValue = newValue;
  }
  enable() {
    this.node.setAttribute(this.attr, this.newValue);
  }
  disable() {
    this.node.setAttribute(this.attr, this.originalValue);
  }
}

class ImageBundle {
  constructor(node, originalSrc, newSrc) {
    this.node = node;
    this.originalSrc = originalSrc;
    this.newSrc = newSrc;
  }
  enable() {
    this.node.src = this.newSrc;
  }
  disable() {
    this.node.src = this.originalSrc;
  }
}

const MUTATION_OBSERVER = new MutationObserver(onMutation);
const BUNDLE_LIST = new BundleList([], false);
let WARMED_UP = false;

safari.self.addEventListener('message', event => {
  switch(event.name) {
  case 'START':
    warmup();
    BUNDLE_LIST.setEnabled(true);
    break;
  case 'STOP':
    BUNDLE_LIST.setEnabled(false);
    break;
  case 'TOGGLE':
    warmup();
    BUNDLE_LIST.setEnabled(!BUNDLE_LIST.enabled);
    break;
  case 'resource':
    addStyleSheetOverrideBundle(event.message.resource);
    break;
  }
});

safari.extension.dispatchMessage('READY');

function warmup() {
  if(!WARMED_UP) {
    WARMED_UP = true;
    if(document.readyState == 'loading') {
      document.addEventListener('DOMContentLoaded', onDomContentLoaded);
    } else if(document.readyState == 'interactive') {
      onDomContentLoaded();
    } else if(document.readyState == 'complete') {
      onDomContentLoaded();
    }
  }
}

function onDomContentLoaded() {
  makeImageShader();
  BUNDLE_LIST.hotload(start());
  MUTATION_OBSERVER.observe(document, { childList: true, subtree: true });
}

// TODO: Handle removed nodes and changes to attributes
function onMutation(mutations) {
  function makeBundlesForMutation(arr, m) {
    function makeBundle(arr, node) {
      if(node.nodeType != Node.ELEMENT_NODE) {
        return arr;
      }
      if(node.sheet) {
        arr = makeStyleSheetOverrideBundle(arr, node.sheet);
      }
      if(node.style) {
        arr = makeStyleBundle(arr, node);
      }
      if(node.bgColor) {
        arr = makeBgColorBundle(arr, node);
      }
      if(node.getAttribute('fill')) {
        arr = makeSvgFillBundle(arr, node);
      }
      if(node.getAttribute('flood-color')) {
        arr = makeSvgFloodColorBundle(arr, node);
      }
      if(node.getAttribute('lighting-color')) {
        arr = makeSvgLightingColorBundle(arr, node);
      }
      if(node.getAttribute('stroke')) {
        arr = makeSvgStrokeBundle(arr, node);
      }
      if(node.getAttribute('stop-color')) {
        arr = makeSvgStopColorBundle(arr, node);
      }
      if(node.tagName == 'IMG') {
        arr = makeImageBundle(arr, node);
      }
      return arr;
    }

    arr.concat([].slice.call(m.addedNodes).reduce(makeBundle, []));
    return arr;
  }
  
  const bundles = mutations.reduce(makeBundlesForMutation, []);
  if(bundles.length == 0) {
    return;
  }
  console.log('bundles from mutations', bundles); //*
  BUNDLE_LIST.hotload(bundles);
}

function start() {
  const BASIC = 'html,input,textarea{background-color:rgb(8,8,8);color:#d2d2d2;}a{color:#56a9ff;}input[type="search"]{-webkit-appearance:none;}';
  const builtins = [BASIC].reduce(makeStyleSheetBuiltinBundle, []);
  const overrides = [].slice.call(document.styleSheets)
    .reduce(makeStyleSheetOverrideBundle, []);
  const styles = [].slice.call(document.querySelectorAll('[style]'))
    .reduce(makeStyleBundle, []);
  const bgColors = [].slice.call(document.querySelectorAll('[bgcolor]'))
    .reduce(makeBgColorBundle, []);
  const fontColors = [].slice.call(document.querySelectorAll('font[color]'))
    .reduce(makeFontColorBundle, []);
  const svgFills = [].slice.call(document.querySelectorAll('[fill]'))
    .reduce(makeSvgFillBundle, []);
  const svgFloods = [].slice.call(document.querySelectorAll('[flood-color]'))
    .reduce(makeSvgFloodColorBundle, []);
  const svgLights = [].slice
    .call(document.querySelectorAll('[lighting-color]'))
    .reduce(makeSvgLightingColorBundle, []);
  const svgStrokes = [].slice.call(document.querySelectorAll('[stroke]'))
    .reduce(makeSvgStrokeBundle, []);
  const svgStops = [].slice.call(document.querySelectorAll('[stop-color]'))
    .reduce(makeSvgStopColorBundle, []);
  const images = [].slice.call(document.getElementsByTagName('img'))
    .reduce(makeImageBundle, []);
  return builtins.concat(overrides).concat(styles).concat(bgColors)
    .concat(fontColors).concat(svgFills).concat(images);
}

// --- Bundle helpers ---

function makeStyleSheetBuiltinBundle(arr, str) {
  arr.push(new StyleSheetBuiltinBundle(str));
  return arr;
}

// sheet - `CSSStyleSheet`
function makeStyleSheetOverrideBundle(arr, sheet) {
  if(sheet.ownerNode.id.substring(0, 11) == '_nightlight') {
    return arr;
  }
  if(sheet.cssRules) {
    return makeStyleSheetOverrideBundleFromSheet(arr, sheet);
  } else {
    // FIXME: Redundant network requests due to iframes
    safari.extension.dispatchMessage('wantsResource', { href: sheet.href });
    return arr;
  }
}

function makeStyleSheetOverrideBundleFromSheet(arr, sheet) {
  const str = makeStyle(sheet);
  if(str != '') {
    arr.push(new StyleSheetOverrideBundle(str));
  }
  return arr;
}

function addStyleSheetOverrideBundle(str) {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(str));
  style.disabled = true;
  document.head.appendChild(style);
  const newStr = makeStyle(style.sheet);
  document.head.removeChild(style);
  if(newStr != '') {
    BUNDLE_LIST.hotload([new StyleSheetOverrideBundle(newStr)]);
  }
}

function makeStyleBundle(arr, node) {
  const str = makeAttributeDeclStr(node.style);
  if(str) {
    arr.push(new AttributeBundle(node, 'style', node.style.cssText, str));
  }
  return arr;
}

function makeBgColorBundle(arr, node) {
  const str = makeDarkStyleColor(node.bgColor);
  if(str) {
    // Workaround: Safari doesn't display correct color when formatted as RGB
    arr.push(new AttributeBundle(node, 'bgcolor', node.bgColor,
      rgbToHex(str)));
  }
  return arr;
}

function makeFontColorBundle(arr, node) {
  const str = makeLightStyleColor(node.color);
  if(str) {
    // Workaround: Safari doesn't display correct color when formatted as RGB
    arr.push(new AttributeBundle(node, 'color', node.color, rgbToHex(str)));
  }
  return arr;
}

function makeSvgFillBundle(arr, node) {
  const fill = node.getAttribute('fill');
  const newFill = makeSvgFillColor(fill);
  if(newFill) {
    arr.push(new AttributeBundle(node, 'fill', fill, newFill));
  }
  return arr;
}

function makeSvgFloodColorBundle(arr, node) {
  const flood = node.getAttribute('flood-color');
  const newFlood = makeSvgFloodColor(flood);
  if(newFlood) {

  }
  return arr;
}

function makeSvgLightingColorBundle(arr, node) {
  const lighting = node.getAttribute('lighting-color');
  const newLighting = makeSvgLightingColor(lighting);
  if(newLighting) {

  }
  return arr;
}

function makeSvgStrokeBundle(arr, node) {
  const stroke = node.getAttribute('stroke');
  const newStroke = makeSvgStrokeColor(stroke);
  if(newStroke) {

  }
  return arr;
}

function makeSvgStopColorBundle(arr, node) {
  const stop = node.getAttribute('stop-color');
  const newStop = makeSvgStopColor(stop);
  if(newStop) {

  }
  return arr;
}

function makeImageBundle(arr, node) {
  // FIXME
  if(shouldProcessImage(node)) {

  }
  return arr;
}

// ---

// --- SVG helpers ---

const SVG_FILL_CACHE = {};

function makeSvgFillColor(str) {
  if(str.substring(0, 4) == 'url(') {
    return null;
  } 
  return makeColor(str, SVG_FILL_CACHE, function(r, g, b, a) {
    if(saturation(r, g, b) < 0.15 && luminance(r, g, b) <= 100) {
      // Invert dark grays
      return inverted(r, g, b, a);
    }
    return same(r, g, b, a);
  });
}

function makeSvgStrokeColor(str) {
  if(str != '') {
    console.log('FIXME strokeColor', str); //*
  }
  return null;
}

function makeSvgFloodColor(str) {
  if(str != '') {
    console.log('FIXME floodColor', str); //*
  }
  return null;
}

function makeSvgLightingColor(str) {
  if(str != '') {
    console.log('FIXME lightingColor', str); //*
  }
  return null;
}

function makeSvgStopColor(str) {
  if(str != '') {
    console.log('FIXME stopColor', str); //*
  }
  return null;
}

// ---

// --- Style sheet/attribute and background image helpers ---

const DARK_STYLE_CACHE = {};

function makeDarkStyleColor(str) {
  return makeColor(str, DARK_STYLE_CACHE, function(r, g, b, a) {
    if(saturation(r, g, b) > 0.15) {
      // Darken colors
      return shaded(-50, r, g, b, a);
    } else if(luminance(r, g, b) > 100) {
      // Invert bright grays
      return inverted(r, g, b, a);
    } else {
      // Darken dark grays
      return shaded(-50, r, g, b, a);
    }
  });
}

// ---

// --- Style sheet/attribute helpers ---

const CSS_NAME_FOR_PROP = {
  'backgroundColor': 'background-color',
  'backgroundImage': 'background-image',
  'borderBottomColor': 'border-bottom-color',
  'borderColor': 'border-color',
  'borderLeftColor': 'border-left-color',
  'borderRightColor': 'border-right-color',
  'borderTopColor': 'border-top-color',
  'caretColor': 'caret-color',
  'color': 'color',
  'columnRuleColor': 'column-rule-color',
  'fill': 'fill',
  'floodColor': 'flood-color',
  'lightingColor': 'lighting-color',
  'outlineColor': 'outline-color',
  'stopColor': 'stop-color',
  'strokeColor': 'stroke-color',
  'webkitBorderAfterColor': '-webkit-border-after-color',
  'webkitBorderBeforeColor': '-webkit-border-before-color',
  'webkitBorderEndColor': '-webkit-border-end-color',
  'webkitBorderStartColor': '-webkit-border-start-color',
  'webkitTextDecorationColor': '-webkit-text-decoration-color',
  'webkitTextEmphasisColor': '-webkit-text-emphasis-color',
  'webkitTextFillColor': '-webkit-text-fill-color',
  'webkitTextStrokeColor': '-webkit-text-stroke-color'
};
const DARK_PROPS = ['backgroundColor', 'webkitTextFillColor'];
// TODO: Deduplicate processed border rules
const LIGHT_PROPS = [
'borderBottomColor',
'borderColor',
'borderLeftColor',
'borderRightColor',
'borderTopColor',
'caretColor',
'color',
'columnRuleColor',
'outlineColor',
'webkitBorderAfterColor',
'webkitBorderBeforeColor',
'webkitBorderEndColor',
'webkitBorderStartColor',
'webkitTextDecorationColor',
'webkitTextEmphasisColor',
'webkitTextStrokeColor'
];
const LIGHT_STYLE_CACHE = {};

function makeLightStyleColor(str) {
  return makeColor(str, LIGHT_STYLE_CACHE, function(r, g, b, a) {
    if(luminance(r, g, b) <= 100) {
      if(saturation(r, g, b) > 0.15) {
        // Lighten dark colors
        return shaded(50, r, g, b, a);
      } else {
        // Invert dark grays
        return inverted(r, g, b, a);
      }
    }
    return same(r, g, b, a);
  });
}

function makeCtxs(makeCtx) {
  return DARK_PROPS.map(prop => makeCtx(prop, makeDarkStyleColor))
    .concat(LIGHT_PROPS.map(prop => makeCtx(prop, makeLightStyleColor)))
    .concat([makeCtx('backgroundImage', makeBackgroundImage),
      makeCtx('fill', makeSvgFillColor),
      makeCtx('strokeColor', makeSvgStrokeColor),
      makeCtx('lightingColor', makeSvgLightingColor),
      makeCtx('floodColor', makeSvgFloodColor),
      makeCtx('stopColor', makeSvgStopColor)]);
}

// ---

// --- Style sheet helpers ---

const VALID_MEDIA_TYPES = new Set(['all', 'screen', 'only screen']);

// ruler - `CSSStyleSheet` or `CSSMediaRule`
// Returns string
function makeStyle(ruler) {
  function isValidMediaType() {
    // Imported style sheets have null media
    if(!ruler.media || ruler.media.mediaText == '') {
      return true;
    }
    for(const styleMedium of ruler.media) {
      if(VALID_MEDIA_TYPES.has(styleMedium)) {
        return true;
      }
    }
    return false;
  }

  if(isValidMediaType()) {
    if(!ruler.cssRules) {
      // Workaround: Importing cross-origin style sheet
      safari.extension.dispatchMessage('wantsResource', { href: ruler.href });
      return '';
    } else {
      return [].slice.call(ruler.cssRules).reduce(makeRuleStr, '');
    }
  } else {
    return '';
  }
}

// rule - `CSSRule`
// Returns string
function makeRuleStr(str, rule) {
  if(rule.type == 1) {
    const decl = makeSheetDeclStr(rule.style);
    if(decl != '') {
      return str += rule.selectorText+'{'+decl+'}';
    }
  } else if(rule.type == 3) {
    str += makeStyle(rule.styleSheet);
  } else if(rule.type == 4) {
    str += '@media '+rule.media.mediaText+'{'+makeStyle(rule)+'}';
  } 
  return str;
}

// decl - `CSSStyleDeclaration`
// Returns string
function makeSheetDeclStr(decl) {
  function makeCtx(prop, f) {
    return {
      prop: prop,
      value: decl[prop],
      isImportant: decl.getPropertyPriority(CSS_NAME_FOR_PROP[prop]) ==
        'important',
      f: f 
    };
  }

  function makeStr(str, ctx) {
    if(ctx.value != '') {
      const newValue = ctx.f(ctx.value);
      if(newValue) {
        str += CSS_NAME_FOR_PROP[ctx.prop]+':'+newValue+
          (ctx.isImportant ? '!important;' : ';');
      }
    }
    return str;
  }

  return makeCtxs(makeCtx).reduce(makeStr, '');
}

// ---

// --- Style attribute helpers ---

// decl - `CSSStyleDeclaration`
// Returns string
function makeAttributeDeclStr(decl) {
  function makeCtx(prop, f) {
    return {
      prop: prop,
      priority: decl.getPropertyPriority(CSS_NAME_FOR_PROP[prop]),
      f: f
    };
  }

  function modifyDecl(ctx, decl) {
    const value = decl[ctx.prop];
    if(value == '') {
      return;
    }
    decl.setProperty(CSS_NAME_FOR_PROP[ctx.prop], ctx.f(value), ctx.priority);
  }

  const div = document.createElement('div');
  div.style = decl.cssText;
  const newDecl = div.style;
  makeCtxs(makeCtx).forEach(ctx => modifyDecl(ctx, newDecl));
  return newDecl.cssText;
}

// ---

// --- Image helpers ---

function makeImageShader() {

}

function shouldProcessImage(image) {

}

// Returns string or null
function makeImage(image) {
  if(shouldProcessImage(image)) {

  } else {
    return null;
  }
}

// ---

// --- Color and background image helpers ---

const HEX_FOR_NAMED_COLOR = {
  'aliceblue':'#f0f8ff','antiquewhite':'#faebd7','aqua':'#00ffff','aquamarine':'#7fffd4','azure':'#f0ffff',
  'beige':'#f5f5dc','bisque':'#ffe4c4','black':'#000000','blanchedalmond':'#ffebcd','blue':'#0000ff','blueviolet':'#8a2be2','brown':'#a52a2a','burlywood':'#deb887',
  'cadetblue':'#5f9ea0','chartreuse':'#7fff00','chocolate':'#d2691e','coral':'#ff7f50','cornflowerblue':'#6495ed','cornsilk':'#fff8dc','crimson':'#dc143c','cyan':'#00ffff',
  'darkblue':'#00008b','darkcyan':'#008b8b','darkgoldenrod':'#b8860b','darkgray':'#a9a9a9','darkgreen':'#006400','darkkhaki':'#bdb76b','darkmagenta':'#8b008b','darkolivegreen':'#556b2f','darkorange':'#ff8c00','darkorchid':'#9932cc','darkred':'#8b0000','darksalmon':'#e9967a','darkseagreen':'#8fbc8f','darkslateblue':'#483d8b','darkslategray':'#2f4f4f','darkturquoise':'#00ced1','darkviolet':'#9400d3','deeppink':'#ff1493','deepskyblue':'#00bfff','dimgray':'#696969','dodgerblue':'#1e90ff',
  'firebrick':'#b22222','floralwhite':'#fffaf0','forestgreen':'#228b22','fuchsia':'#ff00ff',
  'gainsboro':'#dcdcdc','ghostwhite':'#f8f8ff','gold':'#ffd700','goldenrod':'#daa520','gray':'#808080','green':'#008000','greenyellow':'#adff2f','grey':'#808080',
  'honeydew':'#f0fff0','hotpink':'#ff69b4',
  'indianred ':'#cd5c5c','indigo':'#4b0082','ivory':'#fffff0',
  'khaki':'#f0e68c',
  'lavender':'#e6e6fa','lavenderblush':'#fff0f5','lawngreen':'#7cfc00','lemonchiffon':'#fffacd','lightblue':'#add8e6','lightcoral':'#f08080','lightcyan':'#e0ffff','lightgoldenrodyellow':'#fafad2','lightgray':'#d3d3d3','lightgrey':'#d3d3d3','lightgreen':'#90ee90','lightpink':'#ffb6c1','lightsalmon':'#ffa07a','lightseagreen':'#20b2aa','lightskyblue':'#87cefa','lightslategray':'#778899','lightsteelblue':'#b0c4de','lightyellow':'#ffffe0','lime':'#00ff00','limegreen':'#32cd32','linen':'#faf0e6',
  'magenta':'#ff00ff','maroon':'#800000','mediumaquamarine':'#66cdaa','mediumblue':'#0000cd','mediumorchid':'#ba55d3','mediumpurple':'#9370d8','mediumseagreen':'#3cb371','mediumslateblue':'#7b68ee','mediumspringgreen':'#00fa9a','mediumturquoise':'#48d1cc','mediumvioletred':'#c71585','midnightblue':'#191970','mintcream':'#f5fffa','mistyrose':'#ffe4e1','moccasin':'#ffe4b5',
  'navajowhite':'#ffdead','navy':'#000080',
  'oldlace':'#fdf5e6','olive':'#808000','olivedrab':'#6b8e23','orange':'#ffa500','orangered':'#ff4500','orchid':'#da70d6',
  'palegoldenrod':'#eee8aa','palegreen':'#98fb98','paleturquoise':'#afeeee','palevioletred':'#d87093','papayawhip':'#ffefd5','peachpuff':'#ffdab9','peru':'#cd853f','pink':'#ffc0cb','plum':'#dda0dd','powderblue':'#b0e0e6','purple':'#800080',
  'rebeccapurple':'#663399','red':'#ff0000','rosybrown':'#bc8f8f','royalblue':'#4169e1',
  'saddlebrown':'#8b4513','salmon':'#fa8072','sandybrown':'#f4a460','seagreen':'#2e8b57','seashell':'#fff5ee','sienna':'#a0522d','silver':'#c0c0c0','skyblue':'#87ceeb','slateblue':'#6a5acd','slategray':'#708090','snow':'#fffafa','springgreen':'#00ff7f','steelblue':'#4682b4',
  'tan':'#d2b48c','teal':'#008080','thistle':'#d8bfd8','tomato':'#ff6347','turquoise':'#40e0d0',
  'violet':'#ee82ee',
  'wheat':'#f5deb3','white':'#ffffff','whitesmoke':'#f5f5f5',
  'yellow':'#ffff00','yellowgreen':'#9acd32'
};

// ---

// --- Color helpers ---

// Returns string or null
function makeColor(str, cache, f_rgba) {
  const cached = cache[str];
  if(cached !== undefined) {
    // console.log('hit', str, cached);
    return cached;
  } else {
    const color = function() {
      if(str.substring(0, 4) == 'rgb(') {
        return makeColorFromRgb(str, f_rgba);
      } else if(str.substring(0, 4) == 'rgba') {
        return makeColorFromRgba(str, f_rgba);
      } else if(str.substring(0, 1) == '#') {
        return makeColorFromHex(str, f_rgba);
      } else if(HEX_FOR_NAMED_COLOR[str]) {
        return makeColorFromHex(HEX_FOR_NAMED_COLOR[str], f_rgba);
      } else if(str.substring(0, 4) == 'var(') {
        return makeColorFromVar(str, f_rgba);
      } else if(['none', 'transparent', 'initial', 'inherit', 'currentcolor']
        .includes(str))
      {
        return null;
      } else {
        console.error('Invalid color '+str);
        return null;
      }
    }();
    cache[str] = color;
    // console.log('miss', str, color);
    return color;
  }
}

function makeColorFromRgb(str, f_rgba) {
  const tokens = str.slice(4, -1).split(', ');
  const c = f_rgba(parseInt(tokens[0]), parseInt(tokens[1]),
    parseInt(tokens[2]), 1);
  return 'rgb('+c.r+','+c.g+','+c.b+')';
}

function makeColorFromRgba(str, f_rgba) {
  const tokens = str.slice(5, -1).split(', ');
  const c = f_rgba(parseInt(tokens[0]), parseInt(tokens[1]),
    parseInt(tokens[2]), parseFloat(tokens[3]));
  return 'rgba('+c.r+','+c.g+','+c.b+','+c.a+')';
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function makeColorFromHex(str, f_rgba) {
  const c = function() {
    if(str.length == 4) {
      return f_rgba('0x'+str[1]+str[1]|0, '0x'+str[2]+str[2]|0,
        '0x'+str[3]+str[3]|0, 1);
    } else if(str.length == 7) {
      return f_rgba('0x'+str[1]+str[2]|0, '0x'+str[3]+str[4]|0,
        '0x'+str[5]+str[6]|0);
    } else {
      return null;
    }
  }();
  return 'rgb('+c.r+','+c.g+','+c.b+')';
}

// https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
function makeColorFromVar(str, f_rgba) {
  const div = document.createElement('div');
  document.head.appendChild(div);
  div.style.color = str;
  const _str = window.getComputedStyle(div).color;
  document.head.removeChild(div);
  const color = function() {
    if(_str.substring(0, 4) == 'rgb(') {
      return makeColorFromRgb(_str, f_rgba);
    } else {
      return makeColorFromRgba(_str, f_rgba);
    }
  }();
  return color;
}

function saturation(r, g, b) {
  const max = Math.max(r, Math.max(g, b));
  const min = Math.min(r, Math.min(g, b));
  return (max - min) / max;
}

// Returns approximate ITU-R BT.601 luminance
function luminance(r, g, b) {
  return ((r*3)+b+(g*4)) >> 3;
}

function shaded(percent, r, g, b, a) {
  const f = (percent >= 0) ? function(component) {
    return Math.round(component + (255-component)*(percent/100));
  } : function(component) {
    return Math.round(component + component*(percent/100));
  };
  return { r: f(r), g: f(g), b: f(b), a: a };
}

function inverted(r, g, b, a) {
  return { r: 255-r, g: 255-g, b: 255-b, a: a };
}

function same(r, g, b, a) {
  return { r: r, g: g, b: b, a: a };
}

function rgbToHex(str) {
  const tokens = str.slice(4, -1).split(',');
  const num = parseInt(tokens[2]) | (parseInt(tokens[1]) << 8) | 
    (parseInt(tokens[0] << 16));
  return '#'+(0x1000000+num).toString(16).slice(1);
}

// ---

// --- Background image helpers ---

const BACKGROUND_IMAGE_TYPE = {
  URL: 0,
  LINEAR_GRADIENT: 1,
  R_LINEAR_GRADIENT: 2,
  RADIAL_GRADIENT: 3,
  R_RADIAL_GRADIENT: 4
};
const RADIAL_GRADIENT_KEYWORDS = new Set([
  // shape
  'circle', 'ellipse',
  // size
  'closest-corner', 'closest-side', 'farthest-corner', 'farthest-side',
  // position
  'at'
]);

function makeBackgroundImage(str) {
  function makeGradientStr(type, prop) {
    return type+'('+(prop.meta != '' ? prop.meta+',' : '') +
      prop.colors.map(obj => {
        return makeDarkStyleColor(obj.color)+(obj.stop ? ' '+obj.stop : '');
      }).join(',')+')';
  }
  
  return parseBackgroundImage(str).map(prop => {
    switch(prop.type) {
    case BACKGROUND_IMAGE_TYPE.URL:
      return 'url('+prop.url+')';
    case BACKGROUND_IMAGE_TYPE.LINEAR_GRADIENT:
      return makeGradientStr('linear-gradient', prop);
    case BACKGROUND_IMAGE_TYPE.R_LINEAR_GRADIENT:
      return makeGradientStr('repeating-linear-gradient', prop);
    case BACKGROUND_IMAGE_TYPE.RADIAL_GRADIENT:
      return makeGradientStr('radial-gradient', prop);
    case BACKGROUND_IMAGE_TYPE.R_RADIAL_GRADIENT:
      return makeGradientStr('repeating-radial-gradient', prop);
    }
    return str;
  }).join(',');
}

function parseBackgroundImage(str) {
  const STATE = {
    DONE: 0,
    TYPE: 1,
    URL: 2,
    LINEAR_GRADIENT: 3,
    RADIAL_GRADIENT: 4,
    UNKNOWN: 5
  };
  const GRADIENT_STATE = {
    DONE: 0,
    META_OR_COLOR: 1,
    META: 2,
    COLOR: 3,
    COLOR_CLOSE_PAREN: 4,
    STOP: 5
  };

  function makeGradientCtx() {
    return { first: '', second: '', state: GRADIENT_STATE.META_OR_COLOR };
  }

  function makeGradientProp(type) {
    return { type: type, meta: '', colors: [] };
  }

  function gradientStateDone(ch, ctx) {
    if(ch == ' ') {
      ctx.state = GRADIENT_STATE.COLOR;
    }
  }

  function gradientStateMeta(ch, ctx, prop) {
    if(ch == ',') {
      ctx.state = GRADIENT_STATE.DONE;
      prop.meta = ctx.first;
      ctx.first = '';
    } else {
      ctx.first += ch;
    }
  }

  function gradientStateColor(ch, state, ctx, prop, props) {
    if(ch == ')') {
      state.value = STATE.DONE;
      prop.colors.push({ color: ctx.first });
      props.push(prop);
    } else if(ch == ',') {
      ctx.state = GRADIENT_STATE.DONE;
      prop.colors.push({ color: ctx.first });
      ctx.first = '';
    } else if(ch == '(') {
      ctx.state = GRADIENT_STATE.COLOR_CLOSE_PAREN;
      ctx.first += '(';
    } else if(ch == ' ') {
      ctx.state = GRADIENT_STATE.STOP;
    } else {
      ctx.first += ch;
    }
  }

  function gradientStateColorCloseParen(ch, ctx) {
    if(ch == ')') {
      ctx.state = GRADIENT_STATE.COLOR;
      ctx.first += ')';
    } else {
      ctx.first += ch;
    }
  }

  function gradientStateStop(ch, state, ctx, prop, props) {
    if(ch == ')') {
      state.value = STATE.DONE;
      prop.colors.push({ color: ctx.first, stop: ctx.second });
      props.push(prop);
    } else if(ch == ',') {
      ctx.state = GRADIENT_STATE.DONE;
      prop.colors.push({ color: ctx.first, stop: ctx.second });
      ctx.first = '';
      ctx.second = '';
    } else {
      ctx.second += ch;
    }
  }

  const state = { value: STATE.DONE };
  let type = '';
  let ctx = {};
  let prop = {};
  let props = [];

  for(const ch of str) {
    switch(state.value) {
    case STATE.DONE:
      if(ch == ',' || ch == ' ') {
        // Do nothing
      } else {
        state.value = STATE.TYPE;
        type = ch;
      }
      break;
    case STATE.TYPE:
      if(ch == '(') {
        if(type == 'url') {
          state.value = STATE.URL;
          ctx = {};
          prop = { type: BACKGROUND_IMAGE_TYPE.URL, url: '' };
        } else if(type == 'linear-gradient') {
          state.value = STATE.LINEAR_GRADIENT;
          ctx = makeGradientCtx();
          prop = makeGradientProp(BACKGROUND_IMAGE_TYPE.LINEAR_GRADIENT);
        } else if(type == 'repeating-linear-gradient') {
          state.value = STATE.LINEAR_GRADIENT;
          ctx = makeGradientCtx();
          prop = makeGradientProp(BACKGROUND_IMAGE_TYPE.R_LINEAR_GRADIENT);
        } else if(type == 'radial-gradient') {
          state.value = STATE.RADIAL_GRADIENT;
          ctx = makeGradientCtx();
          prop = makeGradientProp(BACKGROUND_IMAGE_TYPE.RADIAL_GRADIENT);
        } else if(type == 'repeating-radial-gradient') {
          state.value = STATE.RADIAL_GRADIENT;
          ctx = makeGradientCtx();
          prop = makeGradientProp(BACKGROUND_IMAGE_TYPE.R_RADIAL_GRADIENT);
        } else {
          state.value = STATE.UNKNOWN;
        }
      } else {
        type += ch;
      }
      break;
    case STATE.URL:
      if(ch == ')') {
        state.value = STATE.DONE;
        props.push(prop);
      } else {
        prop.url += ch;
      }
      break;
    case STATE.LINEAR_GRADIENT:
      switch(ctx.state) {
      case GRADIENT_STATE.DONE:
        gradientStateDone(ch, ctx);
        break;
      case GRADIENT_STATE.META_OR_COLOR:
        if(ch == '(') {
          ctx.state = GRADIENT_STATE.COLOR_CLOSE_PAREN;
          ctx.first += '(';
        } else if(ch == ' ') {
          if(ctx.first.substring(0, 1) == '#' ||
            HEX_FOR_NAMED_COLOR[ctx.first]) {

            ctx.state = GRADIENT_STATE.STOP;
          } else {
            ctx.state = GRADIENT_STATE.META;
            ctx.first += ' ';
          }
        } else if(ch == ',') {
          ctx.state = GRADIENT_STATE.DONE;
          if(ctx.first.slice(-3) == 'deg') {
            prop.meta = ctx.first;
          } else {
            prop.colors.push({ color: ctx.first });
          }
          ctx.first = '';
        } else {
          ctx.first += ch;
        }
        break;
      case GRADIENT_STATE.META:
        gradientStateMeta(ch, ctx, prop);
        break;
      case GRADIENT_STATE.COLOR:
        gradientStateColor(ch, state, ctx, prop, props);
        break;
      case GRADIENT_STATE.COLOR_CLOSE_PAREN:
        gradientStateColorCloseParen(ch, ctx);
        break;
      case GRADIENT_STATE.STOP:
        gradientStateStop(ch, state, ctx, prop, props);
        break;
      }
      break;
    case STATE.RADIAL_GRADIENT:
      switch(ctx.state) {
      case GRADIENT_STATE.DONE:
        gradientStateDone(ch, ctx);
        break;
      case GRADIENT_STATE.META_OR_COLOR:
        if(ch == '(') {
          ctx.state = GRADIENT_STATE.COLOR_CLOSE_PAREN;
          ctx.first += '(';
        } else if(ch == ' ') {
          if(ctx.first.substring(0, 1) == '#' ||
            HEX_FOR_NAMED_COLOR[ctx.first]) {

            ctx.state = GRADIENT_STATE.STOP;
          } else {
            ctx.state = GRADIENT_STATE.META;
            ctx.first += ' ';
          }
        } else if(ch == '-') {
          ctx.state = GRADIENT_STATE.META;
          ctx.first += '-';
        } else if(ch == '%') {
          ctx.state = GRADIENT_STATE.META;
          ctx.first += '%';
        } else if(ch == ',') {
          ctx.state = GRADIENT_STATE.DONE;
          if(RADIAL_GRADIENT_KEYWORDS.has(ctx.first)) {
            prop.meta = ctx.first;
          } else {
            prop.colors.push({ color: ctx.first });
          }
          ctx.first = '';
        } else {
          ctx.first += ch;
        }
        break;
      case GRADIENT_STATE.META:
        gradientStateMeta(ch, ctx, prop);
        break;
      case GRADIENT_STATE.COLOR:
        gradientStateColor(ch, state, ctx, prop, props);
        break;
      case GRADIENT_STATE.COLOR_CLOSE_PAREN:
        gradientStateColorCloseParen(ch, ctx);
        break;
      case GRADIENT_STATE.STOP:
        gradientStateStop(ch, state, ctx, prop, props);
        break;
      }
      break;
    case STATE.UNKNOWN:
      if(ch == ')') {
        state.value = STATE.DONE;
      }
      break;
    }
  }
  return props;
}

// ---
