exports.TracingListener = TracingListener;

const {Cc,Ci,Cr} = require("chrome");
var observerService = require("observer-service");

function TracingListener(channel, srcURL, notificationTopic) {
  this.originalListener = null;
  this.channel = channel;
  this.srcURL = srcURL;
  this.notificationTopic = notificationTopic;
}

TracingListener.prototype = {
  onDataAvailable: function(request, context, inputStream, offset, count) {
    this.originalListener.onDataAvailable(request, context, inputStream, offset, count);
  },
    
  onStartRequest: function(request, context) {
    this.originalListener.onStartRequest(request, context);
  },
  
  onStopRequest: function(request, context, statusCode) {
    var location = null;
    try {
      location = this.channel.getResponseHeader('location');
    } catch(e) { 
    }
    if(location) {
      observerService.notify(this.notificationTopic,
                             { fromURL: this.srcURL,
                               toURL: location });
    }
    this.originalListener.onStopRequest(request, context, statusCode);
  },
  
  QueryInterface: function (aIID) {
    if(aIID.equals(Ci.nsIStreamListener) ||
       aIID.equals(Ci.nsISupports)) {
      return this;
    }
    throw Cr.NS_NOINTERFACE;
  }
};

