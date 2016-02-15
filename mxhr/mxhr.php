<?php
    function mxhr_stream($payloads) {
        $stream = array();
        $version = 1;
        $sep = chr(1); # control-char SOH/ASCII 1
        $newline = chr(3); # control-char ETX/ASCII 3
        
        foreach ($payloads as $payload) {
            $stream[] = $payload['content_type'] . $sep . (isset($payload['id']) ? $payload['id'] : '') . $sep . $payload['data'];
        }

        echo $version . $newline . implode($newline, $stream) . $newline;
    }

    //Package image data into a payload
    function mxhr_assemble_image_payload($image_data, $id=null, $mime='image/jpeg') {
        return array(
            'data' => base64_encode($image_data),
            'content_type' => $mime,
            'id' => $id
        );
    }

    //Package html text into a payload
    function mxhr_assemble_html_payload($html_data, $id=null) {
        return array(
            'data' => $html_data,
            'content_type' => 'text/html',
            'id' => $id
        );
    }

    //Package javascript text into a payload
    function mxhr_assemble_javascript_payload($js_data, $id=null) {
        return array(
            'data' => $js_data,
            'content_type' => 'text/javascript',
            'id' => $id
        );
    }


    //Send the multipart stream
    if ($HTTP_GET_VARS['send_stream']) {

        $repetitions = 300;
        $payloads = array();

        //JS files
        $js_data = 'var a = "JS execution worked"; console.log(a, ';

        for ($n = 0; $n < $repetitions; $n++) {
            //$payloads[] = mxhr_assemble_javascript_payload($js_data . $n . ', $n);');
        }

        //HTML files
        $html_data = '<!DOCTYPE><html><head><title>Sample HTML Page</title></head><body></body></html>';

        for ($n = 0; $n < $repetitions; $n++) {
            //$payloads[] = mxhr_assemble_html_payload($html_data, $n);
        }

        //Images
        $image = '/mxhr/icon_check.png';
        $image_fh = fopen($image, 'r');
        $image_data = fread($image_fh, filesize($image));
        fclose($image_fh);

        for ($n = 0; $n < $repetitions; $n++) {
            $payloads[] = mxhr_assemble_image_payload($image_data, $n, 'image/png');
        }

        //Send off the multipart stream
        mxhr_stream($payloads);
        exit;
    }

?>
