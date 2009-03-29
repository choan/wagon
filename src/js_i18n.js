var I18n = function() {
  /**
   * The I18n object
   */
  var I,
  /**
   * Translations store
   */
  strings,
  /**
   * Language in use
   */
  currentLang,
  /**
   * Namespace in use
   */
  currentNs,
  /**
   * Regexp to handle interpolation
   */
  re = /([#!@])(\{?)([a-z0-9_]+)/ig,

  /**
   * Initializes (and resets) data fields
   */
  initialize = function() {
    strings = {};
    currentLang = '';
    currentNs = 'default';
  },

  /**
   * Adds a translation to the translations storage
   */
  setTranslation = function(source, translation, lang, ns) {
    lang = lang || currentLang;
    ns = ns || currentNs;
    if (!(lang in strings)) strings[lang] = {};
    if (!(ns in strings[lang])) strings[lang][ns] = {};
    strings[lang][ns][source] = translation;
    return I;
  },

  /**
   * Add multiple translations to the translation storage
   */
  setTranslations = function(o, lang, ns) {
    for (var i in o)
      if (o.hasOwnProperty(i))
        setTranslation(i, o[i], lang, ns);
    return I;
  },

  /**
   * Retrieves a translations from the translation storage
   */
  getTranslation = function(source, lang, ns) {
    var o, path, i, part;
    lang = lang || currentLang;
    ns = ns || currentNs;
    if (lang in strings && ns in strings[lang]) {
      o = strings[lang][ns];

      // handle nested objects
      if (/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(source))
        path = source.split('.');
      else
        path = [source];

      while (path.length) {
        source = path.join('.');
        part = path.shift();
        if (source in o) { // unnested objects with dotted keys
          o = o[source];
          break;
        }
        else if (part in o) { // nested objects
          o = o[part];
        }
        else {
          return null;
        }
      }
      return o;
    }
    return null;
  },

  /**
   * Translates a string interpolating data from a hash-like argument
   */
  translate = function(source, o) {
    var translation = getTranslation(source) || source;
    if (o) translation = interpolate(translation, o);
    return translation;
  },

  /**
   * Sets language and namespace to use both in setting and retrieving translations
   */
  use = function(lang, ns) {
    currentLang = lang;
    if (ns !== undefined) currentNs = ns;
    return I;
  },

  /**
   * Selects translations based on a numeric argument, then interpolates data
   */
  pluralize = function(source, n, o) {
    var translation = getTranslation(source);
    o = o || {};
    if (n in translation) {
      translation = translation[n];
    }
    else {
      translation = translation['n']
    }
    o['n'] = n;
    return interpolate(translation, o);
  },

  /**
   * Interpolates data on a template string
   */
  interpolate = function(template, data) {
    var m, s = template, r = '', search, part;
    for (;;) {
      m = re.exec(s);
      if (!m) {
        break;
      }
      else {
        search = m[0];
        if (m[2]) {
          if (s.charAt(re.lastIndex) == '}') {
            re.lastIndex += 1;
            search += '}';
          }
          else
            search = false;
        }
        part = s.substring(0, re.lastIndex);
        if (search && m[3] in data) part = part.replace(search, data[m[3]]);
        r += part;
        s = s.substring(re.lastIndex);
      }
      re.lastIndex = 0;
    }
    r += s;
    return r;
  };

  // set up
  initialize();

  // return object with privileged methods
  return I = {
    reset: initialize,
    set: function(source, translation, lang, ns) {
      if (typeof source === 'object')
        return setTranslations(source, translation, ns);
      else
        return setTranslation(source, translation, lang, ns);
    },
    get: getTranslation,
    translate : translate,
    t: translate,
    pl: pluralize,
    pluralize: pluralize,
    use: use,
    version: '<%= APP_VERSION %>'
  };
  
}();