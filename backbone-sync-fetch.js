var methodMap = {
  'create': 'POST',
  'update': 'PUT',
  'patch':  'PATCH',
  'delete': 'DELETE',
  'read':   'GET'
};

// Replacements for _.result
var isFunction = function (func) {
  var getType = {};
  return func && getType.toString.call(func) === '[object Function]';
};
var result = function (thing, name) {
  return isFunction(thing[name]) ? thing[name]() : thing[name];
};

var throwUrlError = function () {
  var err = new Error('Must provide a url for sync');
  throw err;
};

function backboneFetchSync(method, model, options) {
  options = options || {};
  var type = methodMap[method];

  var params = {
    method: type
  };

  if (!options.url) {
    options.url = result(model, 'url') || throwUrlError();
  }

  if (type !== 'GET') {
    if (!options.headers) {
      options.headers = new Headers();
      options.headers.append('Content-Type', 'application/json');
    }

    params.body = JSON.stringify(options.body || model.toJSON(options));
  }
  params.headers = options.headers;

  return new Promise(function (resolve, reject) {
    var origResponse;
    var xhr = options.xhr = fetch(options.url, params)
      .then(function (response) {
        origResponse = response;
        return response.json();
      })
      .then(function (responseData) {
        if(origResponse.status>=400){
          if (options.error) {
            options.error.call(this, responseData, origResponse, options);
          }

          reject({ responseData, origResponse, options });
        }else{
          if (options.success) {
            options.success.call(this, responseData, origResponse, options);
          }

          resolve({ responseData, origResponse, options });
        }
      })
      .catch(function (err) {
        if (options.error) {
          options.error.call(this, err, origResponse, options);
        }

        reject({ err, origResponse, options });
      });

    model.trigger('request', model, xhr, options);
  });
 }

 module.exports = backboneFetchSync;
