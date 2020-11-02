class spotifyConnect{

    static start(){
        const express = require("express");
        const req = require("request");
        const url = require('url');  // used for parsing request urls (in order to get params)


        let app = express();
        let server = app.listen(3006, function () { // start the server
            let host = server.address().address;
            let port = server.address().port;
            console.log('Express server running from host ' + host + ' on port ' + port);
        });

        app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            next();
        });

        app.get( '/', (request, response) => {response.sendFile(__dirname + '/webcontent/index.html');});
        app.use(express.static(__dirname +'/webcontent') ); // the folder to use to get static files (e.g. index.html)

        app.get('/auth', (request, response) => {
            let uri = "https://accounts.spotify.com/authorize?client_id=f90a6a0ff57b43149d6c4e0f36301d82" +
                "&response_type=code" +
                "&redirect_uri=localhost:3006/authResp" +
                // "&redirect_uri=www.youtube.com" +
                "&scope=user-read-private%20user-read-email" +
                "&state=testState";
            response.redirect(uri);
            // req(uri, function(error, res, jsonText) {
            //     console.log("Auth");
            //     response.redirect(res);
            // });


        });
        app.get("/authResp", (request, response) => {
            console.log("response")
        });


    }
}
spotifyConnect.start();