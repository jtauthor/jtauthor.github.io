
(function() {
    F = window.F || {};
    F.mxhr = {
        getLatestPacketInterval: null,
        lastLength: 0,
        listeners: {},
        
        boundary: "\u0003",// IE jumps over empty entries if we use the regex version instead of the string.
        fieldDelimiter: "\u0001",

        _msxml_progid: [
            'MSXML2.XMLHTTP.6.0',
            'MSXML3.XMLHTTP',
            'Microsoft.XMLHTTP',// Doesn't support readyState == 3 header requests.
            'MSXML2.XMLHTTP.3.0',// Doesn't support readyState == 3 header requests.
        ],

        load: function(url) {
            this.req = this.createXhrObject();
            if (this.req) {
                this.req.open('GET', url, true);

                var that = this;
                this.req.onreadystatechange = function() {
                    that.readyStateHandler();
                }

                this.req.send(null);
            }
        },

        createXhrObject: function() {
            var req;
            try {
                req = new XMLHttpRequest();
            }
            catch(e) {
                for (var i = 0, len = this._msxml_progid.length; i < len; ++i) {
                    try {
                        req = new ActiveXObject(this._msxml_progid[i]);
                        break;
                    }
                    catch(e2) {  }
                }
            }
            finally {
                return req;
            }
        },      

        readyStateHandler: function() {

            if (this.req.readyState === 3 && this.getLatestPacketInterval === null) {
                var that = this;
                this.getLatestPacketInterval = window.setInterval(function() { that.getLatestPacket(); }, 15);
            }

            if (this.req.readyState == 4) {
                clearInterval(this.getLatestPacketInterval);
                this.getLatestPacket();
                if (this.listeners.complete && this.listeners.complete.length) {
                    var that = this;
                    for (var n = 0, len = this.listeners.complete.length; n < len; n++) {
                        this.listeners.complete[n].apply(that);
                    }
                }
            }
        },

        getLatestPacket: function() {
            var length = this.req.responseText.length;
            var packet = this.req.responseText.substring(this.lastLength, length);

            this.processPacket(packet);
            this.lastLength = length;
        },

        processPacket: function(packet) {

            if (packet.length < 1) return;

            var startPos = packet.indexOf(this.boundary),
                endPos = -1;

            if (startPos > -1) {
                if (this.currentStream) {

                    endPos = startPos;
                    startPos = -1;
                } 
                else {
                    endPos = packet.indexOf(this.boundary, startPos + this.boundary.length);
                }
            }

            if (!this.currentStream) {

                this.currentStream = '';

                if (startPos > -1) {

                    if (endPos > -1) {
                        var payload = packet.substring(startPos, endPos);
                        this.currentStream += payload;

                        packet = packet.slice(endPos);

                        this.processPayload();

                        try {
                            this.processPacket(packet);
                        }
                        catch(e) {  }
                    } 
                    else {
                        this.currentStream += packet.substr(startPos);
                    }
                } 
            } else {
                if (endPos > -1) {
                    var chunk = packet.substring(0, endPos);
                    this.currentStream += chunk;
                    packet = packet.slice(endPos);
                    this.processPayload();
                    this.processPacket(packet);
                } else {
                    this.currentStream += packet;
                }
            }
        },

        processPayload: function() {
            this.currentStream = this.currentStream.replace(this.boundary, '');

            var pieces = this.currentStream.split(this.fieldDelimiter);
            var mime = pieces[0]
            var payloadId = pieces[1];
            var payload = pieces[2];

            var that = this;
            if (typeof this.listeners[mime] != 'undefined') {
                for (var n = 0, len = this.listeners[mime].length; n < len; n++) {
                    this.listeners[mime][n].call(that, payload, payloadId);
                }
            }

            delete this.currentStream;
        },

        listen: function(mime, callback) {
            if (typeof this.listeners[mime] == 'undefined') {
                this.listeners[mime] = [];
            }

            if (typeof callback === 'function') {
                this.listeners[mime].push(callback);
            }
        }
    };

})();
