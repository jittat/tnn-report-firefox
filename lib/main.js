const REPORTER_ON_REDIRECTION = "tnn-reporter-on-redirection";
var landingPages = { 
  "http://58.97.5.29/annouce/court.html": true 
};

var reportListeners = require("./report-listeners");

const {Cc,Ci,Cr} = require("chrome");
var observerService = require("observer-service");
var data = require("self").data;

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

var redirectionCallback = function(subject, callbackData) {
  if(landingPages[subject.toURL]) {
    var submissionDialog = require("panel").Panel({
      width: 300,
      height: 200,
      contentURL: data.url("submission-dialog.html"),
      contentScriptFile: data.url("submission-dialog.js"),
      contentScript: "updateURL('" + subject.fromURL + "');"
    });
    submissionDialog.port.on("choice-selected",
                             function(choice) {
                               if(choice)
                                 console.log("Submitting >>> From: " + subject.fromURL + " To: " + subject.toURL);
                               submissionDialog.hide();
                             });
    submissionDialog.show();
  }
};

observerService.add("http-on-examine-response",
                    examineResponse);
observerService.add(REPORTER_ON_REDIRECTION,
                    redirectionCallback);