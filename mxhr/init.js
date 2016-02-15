
(function() {
    var totalImages = 0;

    F.mxhr.listen('image/png', function(payload, payloadId) {
        var img = document.createElement('img');
        img.src = 'data:image/png;base64,' + payload;
        document.getElementById('mxhr-output').appendChild(img);

        totalImages++;
    });

    F.mxhr.listen('text/html', function(payload, payloadId) {
        console.log('Found text/html payload:', payload, payloadId);
    });

    F.mxhr.listen('text/javascript', function(payload, payloadId) {
        eval(payload);
    });

    F.mxhr.listen('complete', function() {

        var time = (new Date).getTime() - streamStart;
        document.getElementById('mxhr-timing').innerHTML = '<p>' + totalImages + ' images in a multipart stream took: <strong>' + time + 'ms</strong> (' + (Math.round(100 * (time / totalImages)) / 100) + 'ms per image)</p>';

        var normalStart = (new Date).getTime();
        var img;
        for (var i = 0, last = 300; i < last; i++) {
            img = document.createElement('img');
            img.src = 'icon_check.png?nocache=' + (new Date).getTime() * Math.random();
            img.width = 28;
            img.height = 22;
            document.getElementById('normal-output').appendChild(img);

            var count = 0;
            img.onload = function() {
                count++;
                if (count === last) {
                    var time = (new Date).getTime() - normalStart;
                    document.getElementById('normal-timing').innerHTML = '<p>' + last + ' normal, uncached images took: <strong>' + time + 'ms</strong> (' + (Math.round(100 * (time / count)) / 100) + 'ms per image)</p>';
                }
            };
        }
    });

    var streamStart = (new Date).getTime();
    F.mxhr.load('mxhr.php?send_stream=1');
})();
