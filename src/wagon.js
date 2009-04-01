var Wagon = function() {
  /**
   * The object that will be returned
   */
  var wagon,
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
   * List of prefixes
   */  
  prefixes = '#!@%',
  /**
   * Regexp to handle interpolation
   */
  re = /([#!@%])\{([a-z0-9_]+)\}/ig,
  /**
   * A hash containing handlers for each prefix
   */  
  handlers = {},
  /**
   * Is the object frozen?
   */  
  isFrozen = false,
  /**
   * Initializes data fields
   */
  initialize = function() {
    var i;
    strings = {};
    currentLang = '';
    currentNs = 'default';
    for (i = 0; i < prefixes.length; i += 1) {
      handlers[prefixes.charAt(i)] = I;
    }
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
    return wagon;
  },
  /**
   * Adds multiple translations to the translation storage
   */
  setTranslations = function(o, lang, ns) {
    if ('meta' in o && 'translations' in o) {
      lang = o.meta.lang;
      ns = o.meta.namespace;
      o = o.translations;
    }
    for (var i in o)
      if (o.hasOwnProperty(i))
        setTranslation(i, o[i], lang, ns);
    return wagon;
  },
  /**
   * Retrieves a translation from the translation storage
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
        }
        else if (part in o) { // nested objects
          o = o[part];
        }
        else {
          return null;
        }
        if (typeof o == 'string') break;
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
    return wagon;
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
      translation = translation['n'];
    }
    o['n'] = n;
    return interpolate(translation, o);
  },
  /**
   * Interpolates data on a template string
   */
  interpolate = function(template, data) {
    var m, s = template, r = '', search, part, prefix, name;
    while (s && (m = re.exec(s))) {
      search = m[0];
      prefix = m[1];
      name = m[2];
      part = s.substring(0, re.lastIndex);
      if (search && m[2] in data) part = part.replace(search, handlers[prefix](data[m[2]]));
      r += part;
      s = s.substring(re.lastIndex);
      re.lastIndex = 0;
    }
    r += s;
    return r;
  },
  /**
   * Sets a placeholder callback for the given prefix
   */ 
  handlePlaceholder = function(handler, prefix) {
    if (!isFrozen) handlers[prefix] = handler;
  },
  /**
   * Returns the given argument (used as default placeholder callback)
   */   
  I = function(value) {
    return value;
  },
  freeze = function() {
    isFrozen = true;
    return wagon;
  };

  // set up
  initialize();

  // return object with privileged methods
  return wagon = {
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
    handlePlaceholder: handlePlaceholder,
    freeze : freeze,
    version: '<%= APP_VERSION %>'
  };
};
