const REPORTER_ON_REDIRECTION = "tnn-reporter-on-redirection";
var landingPages = { 
  "http://58.97.5.29/annouce/court.html": true 
};

var reportListeners = require("./report-listeners");

const {Cc,Ci,Cr} = require("chrome");
var observerService = require("observer-service");

var isRedirectStatus = function(status) {
  return (status = 301) || (status == 302) || (status == 303) || (status == 308);
};

var examineResponse = function(subject, data) {
  subject.QueryInterface(Ci.nsIHttpChannel);
  if(isRedirectStatus(subject.responseStatus)) {
    var newListener = new reportListeners.TracingListener(subject, 
                                                          subject.URI.spec, 
                                                          REPORTER_ON_REDIRECTION);
    subject.QueryInterface(Ci.nsITraceableChannel);
    newListener.originalListener = subject.setNewListener(newListener);
  }
};

var redirectionCallback = function(subject, data) {
  if(landingPages[subject.toURL]) {
    console.log(">>> From: " + subject.fromURL + " To: " + subject.toURL);
  }
};

observerService.add("http-on-examine-response",
                    examineResponse);
observerService.add(REPORTER_ON_REDIRECTION,
                    redirectionCallback);