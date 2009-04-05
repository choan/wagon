/**
 * @function
 * @returns {wagon}
 */  
var Wagon = function() {
  /**
   * The object returned by the Wagon function to handle all our localization needs
   * @name wagon
   * @namespace
   */
  var wagon,
  /**
   * Translations store
   * @private
   */
  strings,
  /**
   * Language in use
   * @private
   */
  currentLang,
  /**
   * Namespace in use
   * @private
   */
  currentNs,
  /**
   * List of prefixes
   * @private
   */  
  prefixes = '#!@%',
  /**
   * Regexp to handle interpolation
   * @private
   */
  re = new RegExp('([' + prefixes + '])\{([a-z0-9_]+)\}', 'ig'),
  /**
   * A hash containing handlers for each prefix
   * @private
   */  
  handlers = {},
  /**
   * Initializes data fields
   * @private
   */
  initialize = function() {
    var i;
    strings = {};
    currentLang = '';
    currentNs = 'default';
  },
  /**
   * Adds a translation to the translations storage
   * @private
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
   * @private
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
   * @private
   */
  getTranslation = function(source, lang, ns) {
    var o, path, i, part;
    lang = lang || currentLang;
    ns = ns || currentNs;
    if (lang in strings && ns in strings[lang]) {
      o = strings[lang][ns];
      // handle nested objects
      if (/^[$a-z0-9_]+(\.[$a-z0-9_]+)+$/.test(source))
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
   * @private
   */
  translate = function(source, o, acceptHtml, transform) {
    var translation = getTranslation(source) || source;
    transform = typeof arguments[arguments.length - 1] == 'function' ? arguments[arguments.length - 1] : null;
    acceptHtml = arguments.length >= 3 && typeof acceptHtml == 'boolean' && acceptHtml;
    if (!acceptHtml) translation = escapeHtml(translation);
    if (o) translation = interpolate(translation, o, transform);
    return translation;
  },
  /**
   * Sets language and namespace to use both in setting and retrieving translations
   * @private
   */
  use = function(lang, ns) {
    currentLang = lang;
    if (ns !== undefined) currentNs = ns;
    return wagon;
  },
  /**
   * Selects translations based on a numeric argument, then interpolates data
   * @private
   */
  plural = function(singular, plural, n, o, acceptHtml, transform) {
    var getIndex, index, translation, source, defIndex;
    defIndex = defaultPluralIndex(n);
    source = defIndex == 1 && plural ? plural : singular;
    translation = getTranslation(source) || source;
    transform = typeof arguments[arguments.length - 1] == 'function' ? arguments[arguments.length - 1] : null;
    acceptHtml = arguments.length >= 5 && typeof acceptHtml == 'boolean' && acceptHtml;
    o = o || {};
    o['n'] = n;
    if (!acceptHtml) translation = escapeHtml(translation);
    return interpolate(translation, o, transform);
  },
  /**
   * Interpolates data on a template string
   * @private
   */
  interpolate = function(template, data, transform) {
    var m, s = template, r = '', search, part, prefix, name, value, found;
    while (s && (m = re.exec(s))) {
      search = m[0];
      prefix = m[1];
      name = m[2];
      if (name in data) {
        found = true;
        value = data[name];
        if (prefix in handlers) value = handlers[prefix](value);
        if (transform) value = transform(name, value);
      }
      part = s.substring(0, re.lastIndex);
      if (found) part = part.replace(search, value);
      r += part;
      s = s.substring(re.lastIndex);
      re.lastIndex = 0;
    }
    r += s;
    return r;
  },
  /**
   * Formats a number according to the current language
   * @private
   */  
  number_format = function(num) {
    var dSym, mSym, r, s, parts, re, i;
    dSym = getTranslation('$number.decimal') || '.',
    mSym = getTranslation('$number.milliard') || ',';
    parts = ('' + num).split('.');
    if (mSym) {
      r = '';
      s = parts[0];
      for (;;) {
        if (s.search(/[\d]([\d]{3})$/) !== -1) {
          r = mSym + s.slice(-3) + r;
          s = s.slice(0, -3);
        }
        else break;
      }
      r = s + r;
      parts[0] = r;
    }
    return parts.join(dSym);
  },
  /**
   * Sets a placeholder callback for the given prefix
   * @private
   */ 
  handlePlaceholder = function(prefix, handler) {
    handlers[prefix] = handler;
    return wagon;
  },
  /**
   * Returns the string with < and > symbols escaped for HTML
   * @private
   */  
  escapeHtml = function(s) {
    return ('' + s).replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },
  defaultPluralIndex = function(n) {
    return n == 1 ? 0 : 1;
  };

  // set up
  initialize();

  // return object with privileged methods
  return wagon = 
    /**
     * @scope wagon.prototype
     */  
    {
    /**
     * Sets a translation
     * @param {String} source
     * @param {String} translation
     * @param {String} [lang=current language]
     * @param {String} [namespace=current namespace]
     * @returns {wagon}
     */  
    set: function(source, translation, lang, ns) {
      if (typeof source === 'object')
        return setTranslations(source, translation, ns);
      else
        return setTranslation(source, translation, lang, ns);
    },
    /**
     * Retrieves a translation and interpolates properties from the given object
     * @function
     * @param {String} source Source string to be translated
     * @param {Object} data Data object to be interpolated
     * @param {Boolean} [acceptHtml=false] Accept HTML coming from the translation
     * @param {Function} [transform=null] Transformation function, receives the name and the value of the property to be interpolated as arguments, returns the final value to be interpolated
     * @returns {String} Translated string with interpolated data
     */ 
    t: translate,
    pl: plural,
    /**
     * Establish the language and namespace to be used from now on
     * @function
     * @param {String} language
     * @param {String} [namespace=the current namespace]
     * @returns {wagon}
     */  
    use: use,
    /**
     * Sets a callback for transforming placeholders based on its prefix
     * @function
     * @param {String} prefix One of #, %, @, !
     * @param {Function} handler Handler function, gets the value as argument, returns the value to be inserted
     * @returns {wagon}
     */  
    handlePlaceholder: handlePlaceholder,
    /**
     * Formats a number according to the current locale
     * @function
     * @param {Number}
     * @returns {String} The formatted number
     */   
    number_format: number_format,
    /**
     * Wagon library version number
     * @property {String}
     */  
    version: '<%= APP_VERSION %>'
  };
};
