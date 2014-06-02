exports.TracingListener = TracingListener;

const { Cc, Ci, Cr } = require("chrome");
var { emit } = require("sdk/event/core");

function TracingListener( channel, srcURL, target ) {
    this.originalListener = null;
    this.channel = channel;
    this.srcURL = srcURL;
    this.target = target;
}

TracingListener.prototype = {
    onDataAvailable: function( request, context, inputStream, offset, count ) {
        this.originalListener.onDataAvailable( request, context, inputStream, offset, count);
    },
    
    onStartRequest: function( request, context ) {
        this.originalListener.onStartRequest( request, context );
    },
    
    onStopRequest: function( request, context, statusCode ) {
        var location = null;
        try {
            location = this.channel.getResponseHeader( 'location' );
        } catch( e ) { 
        }
        if ( location ) {
            emit( this.target, 'redirect', 'on',
                  { fromURL: this.srcURL,
                    toURL: location } );
        }
        this.originalListener.onStopRequest( request, context, statusCode );
    },
  
    QueryInterface: function( aIID ) {
        if ( aIID.equals( Ci.nsIStreamListener ) ||
             aIID.equals( Ci.nsISupports ) ) {
            return this;
        }
        throw Cr.NS_NOINTERFACE;
    }
};

