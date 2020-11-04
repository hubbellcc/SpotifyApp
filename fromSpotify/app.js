/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
let express = require('express'); // Express web server framework
let request = require('request'); // "Request" library
let cors = require('cors');
let querystring = require('querystring');
let cookieParser = require('cookie-parser');
let url = require("url");
const PLAYLIST_ID = "0C7UaW6FFDZIFBaRbRsNaS";  // TODO Might not be const, dynamically change playlist id?

let access_token = null;

let client_id = 'f90a6a0ff57b43149d6c4e0f36301d82'; // Your client id
let client_secret = 'f4d659d613a24ce293cb33197b2eacae'; // Your secret
let redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
let generateRandomString = function(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

let stateKey = 'spotify_auth_state';

const app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.use(express.urlencoded({extended:true}));

app.get('/login', function(req, res) {

    let state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    // The scope is a list of actions that the user is presented with and allows the app to do
    // Additional scope params and what each does can be found in their docs
    let scope = 'user-read-private user-read-email playlist-modify-public playlist-read-private playlist-read-collaborative';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/search', function(req, res) {
    let urlObject = url.parse(req.url,true); // see https://nodejs.org/api/url.html
    let toQuery;
    if(urlObject.query["search"]){
        toQuery = urlObject.query["search"];
    }

    if(access_token !== null) {
        let options = {
            url: 'https://api.spotify.com/v1/search?q='+toQuery+'&type=track',
            headers: {'Authorization': 'Bearer ' + access_token},
            json: true
        };
        request.get(options, function (error, response, body) {
            // console.log(body);
            if(!error){
                res.json(body);
            } else {
                res.json({
                    "error": error
                });
            }
        });
    } else {
        console.log("No token");
        res.json({
            error: "No token"
        });
    }
});

app.get('/callback', function(req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                access_token = body.access_token;
                console.log(access_token);
                var refresh_token = body.refresh_token;

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function(error, response, body) {
                    // console.log(body); //Get me information

                });

                // we can also pass the token to the browser to make requests from there
                res.redirect('/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});

app.post('/addToPlaylist', (req, res) => {
    // console.log(req.body);
    let toAdd = {uris:[]};
    // let uris = [];
    req.body.tracks.forEach((track, ind) => {
        toAdd.uris.push("spotify:track:"+track);
        // uris.push("spotify:track:"+track);
    });
    let options = {
        url: "https://api.spotify.com/v1/playlists/"+PLAYLIST_ID+"/tracks",
        headers: {'Authorization': 'Bearer ' + access_token},
        // uris: uris,
        // uris: toAdd,
        body: toAdd,
        Accept: "application/json",
        contentType: "application/json",
        json: true,
    };
    // console.log(options);
    request.post(options, (error, response, body) => {
       if(!error && response.statusCode === 201){
           //GOOD
           res.json({status: "success"});
       }else {
           res.json({error: response.body});}
    });

});

app.get('/refresh_token', function(req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

console.log('Listening on 8888');
app.listen(8888);