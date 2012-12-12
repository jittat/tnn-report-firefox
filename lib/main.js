const REPORTER_ON_REDIRECTION = "tnn-reporter-on-redirection";

const {Cc,Ci,Cr} = require("chrome");
var observerService = require("observer-service");
var data = require("self").data;
var simplePrefs = require("simple-prefs");
var simpleStorage = require("simple-storage");

var reportListeners = require("./report-listeners");
var reportConfig = require("./report-config");
var landingPages = reportConfig.getLandingPages();
var servers = reportConfig.getServers();

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

var reportBlocking = function(url) {
  var success = false;
  servers.forEach(function(baseURL,i,arr) {
    if(success)
      return;

    repURL = baseURL + 'blocks';
    submittedData = { 
      block_url: url 
    };

    var Request = require("request").Request;
    var blocksRequest = Request({
      url: repURL,
      content: submittedData,
      onComplete: function(response) {
        if(response.status == 200) {
          console.log("OK: " + response.text);
          success = true;
        } 
      }
    }).post();
  });
};

var redirectionCallback = function(subject, callbackData) {
  if(landingPages[subject.toURL]) {
    if(simplePrefs.prefs.autoReport) {
      console.log("Submitting >>> From: " + subject.fromURL + " To: " + subject.toURL);
      reportBlocking(subject.fromURL);
    } else {
      var submissionDialog = require("panel").Panel({
        width: 300,
        height: 300,
        contentURL: data.url("submission-dialog.html"),
        contentScriptFile: data.url("submission-dialog.js"),
        contentScript: "updateURL('" + subject.fromURL + "');"
      });
      submissionDialog.port.on("choice-selected",
                               function(payload) {
                                 if(payload.choice) {
                                   console.log("Submitting >>> From: " + subject.fromURL + " To: " + subject.toURL);
                                   reportBlocking(subject.fromURL);
                                 }
                                 if(payload.remember)
                                   console.log("remember this.");
                                 submissionDialog.hide();
                               });
      submissionDialog.show();
    }
  }
};

var registerEvents = function() {
  observerService.add("http-on-examine-response",
                      examineResponse);
  observerService.add(REPORTER_ON_REDIRECTION,
                      redirectionCallback);
};

var initialize = function() {
  registerEvents();
}

initialize();