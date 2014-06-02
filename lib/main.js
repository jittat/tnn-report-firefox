const REPORTER_ON_REDIRECTION = "tnn-reporter-on-redirection";

const { Cc, Ci, Cr } = require("chrome");

var simplePrefs = require("simple-prefs");
var simpleStorage = require("simple-storage");
var eventCore = require("sdk/event/core");
var systemEvents = require("sdk/system/events");
var data = require("sdk/self").data;

var reportListeners = require("./report-listeners");
var reportConfig = require("./report-config");
var landingPages = reportConfig.getLandingPages();
var servers = reportConfig.getServers();

var redirectionEventTarget = {};

var isRedirectStatus = function( status ) {
    return ( status == 301 ) || ( status == 302 ) || ( status == 303 ) || ( status == 308 );
};

var examineResponse = function( event ) { 
    var subject = event.subject;
    subject.QueryInterface( Ci.nsIHttpChannel );
    if( isRedirectStatus( subject.responseStatus ) ) {
        var newListener = new reportListeners.TracingListener( subject, 
                                                               subject.URI.spec, 
                                                               redirectionEventTarget );
        subject.QueryInterface( Ci.nsITraceableChannel );
        newListener.originalListener = subject.setNewListener( newListener );
    }
};

var reportBlocking = function( url ) {
    var success = false;
    servers.forEach( function( baseURL, i, arr ) {
        if ( success ) {
            return;
        }
        
        var repURL = baseURL; 
        var submittedData = { 
            blocked_url: url 
        };
        
        var Request = require("request").Request;
        var blocksRequest = Request({
            url: repURL,
            content: submittedData,
            onComplete: function( response ) {
                if ( response.status == 200 ) {
                    console.log("OK: " + response.text);
                    success = true;
                } 
            }
        }).post();
    });
};

var redirectionCallback = function( event, subject ) {
    console.log( subject.toURL );
    if ( landingPages[ subject.toURL ] ) {
        console.log( 'matched' );
        if ( simplePrefs.prefs.autoReport ) {
            console.log( "Submitting >>> From: " + subject.fromURL + " To: " + subject.toURL );
            reportBlocking( subject.fromURL );
        } else {
            var submissionDialog = require( "panel" ).Panel({
                width: 300,
                height: 300,
                contentURL: data.url( "submission-dialog.html" ),
                contentScriptFile: data.url( "submission-dialog.js" ),
                contentScript: "updateURL('" + subject.fromURL + "');"
            });
            submissionDialog.port.on( "choice-selected",
                                      function( payload ) {
                                          if ( payload.choice ) {
                                              console.log( "Submitting >>> From: " + subject.fromURL +
                                                           " To: " + subject.toURL );
                                              reportBlocking( subject.fromURL );
                                          }
                                          if ( payload.remember ) {
                                              console.log( "remember this." );
                                          }
                                          submissionDialog.hide();
                                      });
            submissionDialog.show();
        }
    }
};

var registerEvents = function() {
    systemEvents.on( "http-on-examine-response", examineResponse );
    eventCore.on( redirectionEventTarget, 'redirect', redirectionCallback );
};

var initialize = function() {
    registerEvents();
}

initialize();
