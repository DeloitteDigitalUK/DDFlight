/* Copyright 2013 Twitter, Inc. Licensed under The MIT License. http://opensource.org/licenses/MIT */

// ==========================================
// Search object model
// ==========================================

function traverse(util, searchTerm, options) {
  options = options || {};
  var obj = options.obj || window;
  var path = options.path || ((obj == window) ? 'window' : '');
  var props = Object.keys(obj);
  props.forEach(function(prop) {
    if ((tests[util] || util)(searchTerm, obj, prop)) {
      console.log([path, '.', prop].join(''), '->', ['(', typeof obj[prop], ')'].join(''), obj[prop]);
    }
    if (Object.prototype.toString.call(obj[prop]) == '[object Object]' && (obj[prop] != obj) && path.split('.').indexOf(prop) == -1) {
      traverse(util, searchTerm, {obj: obj[prop], path: [path,prop].join('.')});
    }
  });
}

function search(util, expected, searchTerm, options) {
  if (!expected || typeof searchTerm == expected) {
    traverse(util, searchTerm, options);
  } else {
    console.error([searchTerm, 'must be', expected].join(' '));
  }
}

var tests = {
  'name': function(searchTerm, obj, prop) {return searchTerm == prop;},
  'nameContains': function(searchTerm, obj, prop) {return prop.indexOf(searchTerm) > -1;},
  'type': function(searchTerm, obj, prop) {return obj[prop] instanceof searchTerm;},
  'value': function(searchTerm, obj, prop) {return obj[prop] === searchTerm;},
  'valueCoerced': function(searchTerm, obj, prop) {return obj[prop] == searchTerm;}
};

function byName(searchTerm, options) {search('name', 'string', searchTerm, options);}
function byNameContains(searchTerm, options) {search('nameContains', 'string', searchTerm, options);}
function byType(searchTerm, options) {search('type', 'function', searchTerm, options);}
function byValue(searchTerm, options) {search('value', null, searchTerm, options);}
function byValueCoerced(searchTerm, options) {search('valueCoerced', null, searchTerm, options);}
function custom(fn, options) {traverse(fn, null, options);}

// ==========================================
// Event logging
// ==========================================

var ALL = 'all'; //no filter

//log nothing by default
var logFilter = {
  eventNames: [],
  actions: []
}

function filterEventLogsByAction(/*actions*/) {
  var actions = [].slice.call(arguments);

  logFilter.eventNames.length || (logFilter.eventNames = ALL);
  logFilter.actions = actions.length ? actions : ALL;
  saveLogFilter();
}

function filterEventLogsByName(/*eventNames*/) {
  var eventNames = [].slice.call(arguments);

  logFilter.actions.length || (logFilter.actions = ALL);
  logFilter.eventNames = eventNames.length ? eventNames : ALL;
  saveLogFilter();
}

function hideAllEventLogs() {
  logFilter.actions = [];
  logFilter.eventNames = [];
  saveLogFilter();
}

function showAllEventLogs() {
  logFilter.actions = ALL;
  logFilter.eventNames = ALL;
  saveLogFilter();
}

function saveLogFilter() {
  try {
    if (window.localStorage) {
      localStorage.setItem('logFilter_eventNames', logFilter.eventNames);
      localStorage.setItem('logFilter_actions', logFilter.actions);
    }
  } catch (ignored) {};
}

function retrieveLogFilter() {
  var eventNames, actions;
  try {
    eventNames = (window.localStorage && localStorage.getItem('logFilter_eventNames'));
    actions = (window.localStorage && localStorage.getItem('logFilter_actions'));
  } catch (ignored) {
    return;
  }
  eventNames && (logFilter.eventNames = eventNames);
  actions && (logFilter.actions = actions);

  // reconstitute arrays in place
  Object.keys(logFilter).forEach(function(k) {
    var thisProp = logFilter[k];
    if (typeof thisProp == 'string' && thisProp !== ALL) {
      logFilter[k] = thisProp ? thisProp.split(',') : [];
    }
  });
}

module.exports = {

  enable: function(enable) {
    this.enabled = !!enable;

    if (enable && window.console) {
      console.info('Booting in DEBUG mode');
      console.info('You can configure event logging with DEBUG.events.logAll()/logNone()/logByName()/logByAction()');
    }

    retrieveLogFilter();

    window.DEBUG = this;
  },

  warn: function (message) {
    if (!window.console) { return; }
    var fn = (console.warn || console.log);
    fn.call(console, this.toString() + ': ' + message);
  },

  find: {
    byName: byName,
    byNameContains: byNameContains,
    byType: byType,
    byValue: byValue,
    byValueCoerced: byValueCoerced,
    custom: custom
  },

  events: {
    logFilter: logFilter,

    // Accepts any number of action args
    // e.g. DEBUG.events.logByAction("on", "off")
    logByAction: filterEventLogsByAction,

    // Accepts any number of event name args (inc. regex or wildcards)
    // e.g. DEBUG.events.logByName(/ui.*/, "*Thread*");
    logByName: filterEventLogsByName,

    logAll: showAllEventLogs,
    logNone: hideAllEventLogs
  }
};
