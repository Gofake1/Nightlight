// Inline HTML attributes don't figure into the darkening process and are simply ignored

const BASIC = 'html{background-color:#000;color:#fff;}a{color:lightblue !important;}canvas{background-color:#000 !important;}img{filter:brightness(75%);}img[src*="svg"],svg{filter:invert(100%);}input,textarea{background-color:#000 !important;color:#fff !important;}input[type="search"]{-webkit-appearance:none;}';
// Workaround: Bug in Safari that breaks current approach in certain cases
// (rdar://42491788). This is a clumsy fallback that's bad for pages that 
// Safari isn't broken for, but better than nothing for pages that are.
const HACKS_GENERAL = 'body,h1,h2,h3,h4{background-color:#000 !important;color:#fff !important;}blockquote,div,header,main,nav,pre,section,span,table,td,tr{background-color:rgba(0,0,0,0.5) !important;color:#fff !important;}p{color:#fff !important;}ul{background-color:#000 !important;}';
const HACKS_SITE_SPECIFIC = ''; // TODO: Medium blogs
const COLOR_DARKEN_PROPS = [
'backgroundColor',
'floodColor',
'lightingColor',
'webkitTextFillColor'
];
// TODO: Deduplicate processed border rules
const COLOR_LIGHTEN_PROPS = [
'borderBottomColor',
'borderColor',
'borderLeftColor',
'borderRightColor',
'borderTopColor',
'caretColor',
'color',
'columnRuleColor',
'outlineColor',
'stopColor',
'strokeColor',
'webkitBorderAfterColor',
'webkitBorderBeforeColor',
'webkitBorderEndColor',
'webkitBorderStartColor',
'webkitTextDecorationColor',
'webkitTextEmphasisColor',
'webkitTextStrokeColor'
];
const CSS_NAME_FOR_PROP = {
  'backgroundColor': 'background-color',
  'borderBottomColor': 'border-bottom-color',
  'borderColor': 'border-color',
  'borderLeftColor': 'border-left-color',
  'borderRightColor': 'border-right-color',
  'borderTopColor': 'border-top-color',
  'caretColor': 'caret-color',
  'color': 'color',
  'columnRuleColor': 'column-rule-color',
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
const HEX_FOR_NAMED_COLOR = {
  'aliceblue':'#f0f8ff','antiquewhite':'#faebd7','aqua':'#00ffff','aquamarine':'#7fffd4','azure':'#f0ffff',
  'beige':'#f5f5dc','bisque':'#ffe4c4','black':'#000000','blanchedalmond':'#ffebcd','blue':'#0000ff','blueviolet':'#8a2be2','brown':'#a52a2a','burlywood':'#deb887',
  'cadetblue':'#5f9ea0','chartreuse':'#7fff00','chocolate':'#d2691e','coral':'#ff7f50','cornflowerblue':'#6495ed','cornsilk':'#fff8dc','crimson':'#dc143c','cyan':'#00ffff',
  'darkblue':'#00008b','darkcyan':'#008b8b','darkgoldenrod':'#b8860b','darkgray':'#a9a9a9','darkgreen':'#006400','darkkhaki':'#bdb76b','darkmagenta':'#8b008b','darkolivegreen':'#556b2f','darkorange':'#ff8c00','darkorchid':'#9932cc','darkred':'#8b0000','darksalmon':'#e9967a','darkseagreen':'#8fbc8f','darkslateblue':'#483d8b','darkslategray':'#2f4f4f','darkturquoise':'#00ced1','darkviolet':'#9400d3','deeppink':'#ff1493','deepskyblue':'#00bfff','dimgray':'#696969','dodgerblue':'#1e90ff',
  'firebrick':'#b22222','floralwhite':'#fffaf0','forestgreen':'#228b22','fuchsia':'#ff00ff',
  'gainsboro':'#dcdcdc','ghostwhite':'#f8f8ff','gold':'#ffd700','goldenrod':'#daa520','gray':'#808080','green':'#008000','greenyellow':'#adff2f',
  'honeydew':'#f0fff0','hotpink':'#ff69b4',
  'indianred ':'#cd5c5c','indigo':'#4b0082','ivory':'#fffff0',
  'khaki':'#f0e68c',
  'lavender':'#e6e6fa','lavenderblush':'#fff0f5','lawngreen':'#7cfc00','lemonchiffon':'#fffacd','lightblue':'#add8e6','lightcoral':'#f08080','lightcyan':'#e0ffff','lightgoldenrodyellow':'#fafad2','lightgrey':'#d3d3d3','lightgreen':'#90ee90','lightpink':'#ffb6c1','lightsalmon':'#ffa07a','lightseagreen':'#20b2aa','lightskyblue':'#87cefa','lightslategray':'#778899','lightsteelblue':'#b0c4de','lightyellow':'#ffffe0','lime':'#00ff00','limegreen':'#32cd32','linen':'#faf0e6',
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
const STATES = {
  NEW:      0,
  ENABLED:  1,
  DISABLED: 2
};
const VALID_MEDIA_TYPES = ['', 'all', 'screen'];
const VAR_DIV = function() {
  const div = document.createElement('div');
  div.id = '_nightlight_cssvar_tester';
  return div;
}();
const VAR_COLORS = {};
let STATE = STATES.NEW;
let STYLES = [];

if(window == window.top) {
  safari.self.addEventListener('message', event => {
    switch(event.name) {
    case 'START':
      switch(STATE) {
      case STATES.NEW:
        STYLES = falseStart();
        STATE = STATES.ENABLED;
        break;
      case STATES.ENABLED:
        // Do nothing
        break;
      case STATES.DISABLED:
        enableStyles(STYLES);
        STATE = STATES.ENABLED;
        break;
      }
      break;

    case 'STOP':
      if(STATE == STATES.ENABLED) {
        disableStyles(STYLES);
        STATE = STATES.DISABLED;
      }
      break;

    case 'TOGGLE':
      switch(STATE) {
      case STATES.NEW:
        STYLES = start();
        STATE = STATES.ENABLED;
        break;
      case STATES.ENABLED:
        disableStyles(STYLES);
        STATE = STATES.DISABLED;
        break;
      case STATES.DISABLED:
        enableStyles(STYLES);
        STATE = STATES.ENABLED;
        break;
      }
      break;
    }
  });

  window.onload = function(event) {
    document.body.appendChild(VAR_DIV);
    // TODO: MutationObserver filtering by style tag
    removeStyles(STYLES);
    STYLES = start();
  };

  safari.extension.dispatchMessage('READY');
}

// Darken before document finishes loading
function falseStart() {
  return makeAndAddStyles([BASIC, HACKS_GENERAL, HACKS_SITE_SPECIFIC]);
}

function start() {
  const processedHrefStyles = getHrefStyleSheets()
    .map(makeProcessedStyle).filter(str => str != '');
  const processedInlineStyles = getInlineStyleSheets()
    .map(makeProcessedStyle).filter(str => str != '');
//  console.log('href', processedHrefStyles); //*
//  console.log('inline', processedInlineStyles); //*
  return makeAndAddStyles([BASIC, HACKS_GENERAL, HACKS_SITE_SPECIFIC]
    .concat(processedHrefStyles)
    .concat(processedInlineStyles));
}

function getHrefStyleSheets() {
  return [].slice.call(document.styleSheets)
    .filter(s => s.href && VALID_MEDIA_TYPES.includes(s.media.mediaText));
}

function getInlineStyleSheets() {
  return [].slice.call(document.styleSheets)
    .filter(s => !s.href && VALID_MEDIA_TYPES.includes(s.media.mediaText));
}

// styleSheet - `CSSStyleSheet`
// Returns string
function makeProcessedStyle(styleSheet) {
  if(!styleSheet.cssRules) {
    return '';
  }
  return [].slice.call(styleSheet.cssRules).map(makeProcessedRule).join('');
}

// rule - `CSSRule`
// Returns string
function makeProcessedRule(rule) {
  if(rule.type == 1) {
    const decl = makeProcessedDecl(rule.style);
    if(decl == '') {
      return '';
    } else {
      return rule.selectorText+'{'+decl+'}';
    }
  } else if (rule.type == 3) {
    return makeProcessedStyle(rule.styleSheet);
  } else {
    return '';
  }
}

// decl - `CSSStyleDeclaration`
// Returns string
function makeProcessedDecl(decl) {
  function a(prop, f_color) {
    return { prop: prop, val: decl[prop], f_color: f_color };
  }

  return COLOR_DARKEN_PROPS.map(prop => a(prop, makeDarkenedColor))
    .concat(COLOR_LIGHTEN_PROPS.map(prop => a(prop, makeLightenedColor)))
    .reduce((arr, a) => {
      if(a.val != '') {
        const newVal = a.f_color(a.val);
        if(newVal) {
          arr.push(CSS_NAME_FOR_PROP[a.prop]+':'+newVal+' !important;');
        }
      }
      return arr;
    }, [])
    .join('');
}

function makeDarkenedColor(str) {
  return makeProcessedColor(str, makeDarkRGB, makeDarkRGBA, makeDarkHex,
    makeDarkVar);
}

function makeLightenedColor(str) {
  return makeProcessedColor(str, makeLightRGB, makeLightRGBA, makeLightHex,
    makeLightVar);
}

// `CSSStyleDeclaration` only returns color as rgb, rgba, or name
// Returns string or null
function makeProcessedColor(str, f_rgb, f_rgba, f_hex, f_var) {
  if(str.substring(0, 4) == 'rgb(') {
    return f_rgb(str);
  } else if(str.substring(0, 4) == 'rgba') {
    return f_rgba(str);
  } else if(HEX_FOR_NAMED_COLOR[str]) {
    return f_hex(HEX_FOR_NAMED_COLOR[str]);
  } else if(str.substring(0, 4) == 'var(') {
    return f_var(str);
  } else if(['transparent', 'inherit', 'currentcolor'].includes(str)) {
    return null;
  } else if(str == 'initial') {
    return null; // FIXME
  } else {
    console.error('Invalid color '+str);
    return null;
  }
}

function makeDarkRGB(str) {
  return makeProcessedRGB(str, _makeDarkRGBA);
}

function makeLightRGB(str) {
  return makeProcessedRGB(str, _makeLightRGBA);
}

function makeDarkRGBA(str) {
  return makeProcessedRGBA(str, _makeDarkRGBA);
}

function makeLightRGBA(str) {
  return makeProcessedRGBA(str, _makeLightRGBA);
}

function makeDarkHex(str) {
  return makeProcessedHex(str, _makeDarkRGBA);
}

function makeLightHex(str) {
  return makeProcessedHex(str, _makeLightRGBA);
}

function makeDarkVar(str) {
  return makeProcessedVar(str, _makeDarkRGBA);
}

function makeLightVar(str) {
  return makeProcessedVar(str, _makeLightRGBA);
}

function makeProcessedRGB(str, f_rgba) {
  const tokens = str.slice(4, -1).split(', ');
  const p = f_rgba(parseInt(tokens[0]), parseInt(tokens[1]),
    parseInt(tokens[2]), 1);
  return 'rgb('+p.r+','+p.g+','+p.b+')';
}

function makeProcessedRGBA(str, f_rgba) {
  const tokens = str.slice(5, -1).split(', ');
  const p = f_rgba(parseInt(tokens[0]), parseInt(tokens[1]),
    parseInt(tokens[2]), parseFloat(tokens[3]));
  return 'rgba('+p.r+','+p.g+','+p.b+','+p.a+')';
}

// Assume hex string length is 6
function makeProcessedHex(str, f_rgba) {
  const p = f_rgba(parseInt(str.substring(1, 3), 16), 
    parseInt(str.substring(3, 5), 16), parseInt(str.substring(5), 16), 1);
  return 'rgb('+p.r+','+p.g+','+p.b+')';
}

// https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
function makeProcessedVar(str, f_rgba) {
  if(VAR_COLORS[str]) {
//    console.log('hit', str, VAR_COLORS[str]); //*
    return VAR_COLORS[str];
  } else {
    VAR_DIV.style.color = str;
    const computedColor = window.getComputedStyle(VAR_DIV).color;
    const p = function() {
      if(computedColor.substring(0, 4) == 'rgb(') {
        return makeProcessedRGB(computedColor, f_rgba);
      } else {
        return makeProcessedRGBA(computedColor, f_rgba);
      }
    }();
    VAR_COLORS[str] = p;
//    console.log('miss', str, computedColor, p); //*
    return p;
  }
}

function _makeDarkRGBA(r, g, b, a) {
  if(saturation(r, g, b) > 0.15) {
    return shaded(-10, r, g, b, a);
  } else if(luminance(r, g, b) > 100) {
    return inverted(r, g, b, a);
  } else {
    return shaded(-50, r, g, b, a);
  }
}

function _makeLightRGBA(r, g, b, a) {
  if(saturation(r, g, b) > 0.15) {
    if(luminance(r, g, b) <= 100) {
      return shaded(50, r, g, b, a);
    } else {
      return { r: r, g: g, b: b, a: a };
    }
  } else {
    if(luminance(r, g, b) <= 100) {
      return inverted(r, g, b, a);
    } else {
      return { r: r, g: g, b: b, a: a };
    }
  }
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
  function clamped(x, lo, hi) {
    if(x < lo) {
      return lo;
    } else if(x > hi) {
      return hi;
    } else {
      return x;
    }
  }

  const rr = clamped(Math.round(r + (256-r)*(percent/100)), 0, 255);
  const gg = clamped(Math.round(g + (256-g)*(percent/100)), 0, 255);
  const bb = clamped(Math.round(b + (256-b)*(percent/100)), 0, 255);
  return { r: rr, g: gg, b: bb, a: a };
}

function inverted(r, g, b, a) {
  return { r: 255-r, g: 255-g, b: 255-b, a: a };
}

function makeAndAddStyles(strings) {
  const styles = strings.filter(s => s).map((s, i) => {
    const styleNode = document.createElement('style');
    styleNode.id = '_nightlight_'+i;
    styleNode.appendChild(document.createTextNode(s));
    return styleNode;
  });
  styles.forEach(node => document.head.appendChild(node));
  return styles;
}

function enableStyles(styles) {
  styles.forEach(s => s.disabled = false);
}

function disableStyles(styles) {
  styles.forEach(s => s.disabled = true);
}

function removeStyles(styles) {
  styles.forEach(s => s.parentNode.removeChild(s));
}
