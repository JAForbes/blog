(function() {
  var attributes, headings, i, isObject, tag, tagCreator, tags, _i, _len, _results;

  function type(obj){
    return ({}).toString.call(obj).slice(8,-1)
  }

  isObject = function(obj) {
    return obj === Object(obj);
  };

  groupBy = function(list,iterator){
    var result = {};
    for(var i = 0; i< list.length; i++){
      var val = list[i];
      var resultKey = [iterator(val,i,list)];
      result[resultKey] = result[resultKey] || [];
      result[resultKey].push(val)
    }
    return result;
  }
  tagCreator = function(tag) {
    return function(attr, content) {
      var grouped = groupBy(arguments,function(i){
        return type(i) == 'Object' && 'Object' || 'Other'
      })
      var content = (grouped['Other'] || ['']).join('');
      var attr = (grouped['Object'] || [])[0];
      return "<" + tag + (attributes(attr)) + ">" + content + "</" + tag + ">";
    };
  };
  attributes = function(attr) {
    var key, result, value;
    if (isObject(attr)) {
      result = ((function() {
        var _results;
        _results = [];
        for (key in attr) {
          value = attr[key];
          _results.push("" + key + "='" + value + "' ");
        }
        return _results;
      })()).join('');
      return result = result.length > 0 && ' ' + result || result;
    } else {
      return '';
    }
  };
  headings = (function() {
    var _i, _results;
    _results = [];
    for (i = _i = 1; _i <= 6; i = ++_i) {
      _results.push("h" + i);
    }
    return _results;
  })();
  tags = ['textarea','input','div', 'img', 'p', 'a', 'i', 'b', 'script', 'code', 'pre', 'ul', 'ol', 'li', 'canvas', 'table'].concat(headings);
  _results = [];
  for (_i = 0, _len = tags.length; _i < _len; _i++) {
    tag = tags[_i];
    _results.push(window[tag] = tagCreator(tag));
  }
  return _results;
})();