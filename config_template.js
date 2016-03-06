// rename this file to config.js
// it will contain private API keys for the cloud services, so it must not be pushed on git.

var config = {
  nuance: {
    appId: 'you Nuance app ID',
    appKey: 'your Nuance app Key'
  },
  
  google: {
    apiKey: 'your google API key'
  },
  
  bing: {
    clientId: 'your bing client ID',
    clientSecret: 'your bing secret'
  }
};

module.exports = config;
