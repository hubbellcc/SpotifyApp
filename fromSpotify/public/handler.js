class handler{
    constructor() {
        const urlBase = "http://localhost:8888";
        $(document).ready(function() {      // when document loads, do some initialization
            onLoad();
        });
        let onLoad = function() {
            $("#login").on('click', () => {
                window.location.href = urlBase + "/login";
            }); //end login onclick
            $("#search-start").on('click', () => {
                let input = $("#search-query").val(), params;
                if (input.trim() !== "") {
                    params = "search=" + input;
                } // end if
                $.ajax({
                    type: "GET",
                    url: urlBase + "/search", // the url of the servlet returning the Ajax response
                    data: params, // key and route, for example "key=ABCDEF123456789&rt=31"
                    async: true,
                    dataType: "json",
                    success: handleSuccess,
                    error: handleError
                }); //End ajax
            });//end search-start onclick

            let result = $("#result"); //Result table
            let resultIDs = []; // Holds track/album/etc Spotify IDs

            result.on('click', '.spotTrack', function (e) { // I assume I can repeat this function but with .spotArtist for artists etc
                // console.log(e.currentTarget.id); // Debug to find ID of clicked item (0/1/2 etc)
                // This may cause problems with other id namings
                let trackIDIndex = e.currentTarget.id;


                if(resultIDs.length){  //Makes sure resultIDs is not empty
                    $.ajax({
                        type:"POST",
                        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                        url: urlBase + "/addToPlaylist",
                        data: {
                            tracks: [
                                resultIDs[trackIDIndex],
                            ]
                        },
                        dataType: 'json',
                        success: playlistAddSuccess,
                        error: playlistAddError
                    }); // End ajax
                    function playlistAddSuccess( response, textStatus, jqXHR ) {
                        let tableRow = $(e.currentTarget);
                        if(textStatus === "success") {
                            if(response.hasOwnProperty("error")){

                            }

                            console.log("add success!");
                            tableRow.fadeOut().fadeIn().fadeOut().fadeIn();
                        }
                    }
                    function playlistAddError( response, textStatus, jqXHR ) {
                        console.log("add error");
                    }
                } // end if .size
                function success(){

                }

            }); // end result.onclick
            function handleSuccess( response, textStatus, jqXHR ){  //TODO MAKE A STANDARD METHOD TO BUILD TABLE (DATA, TYPE(TRACK, ARTIST))???
                resultIDs = [];  //clears previous results
                //TODO STORE PREVIOUS RESPONSES??
                let innerhtml = "";
                if(textStatus === "success"){
                    if(response.hasOwnProperty("error")){
                        // TODO SEARCH FAILED
                    } else {
                        // Good response
                        innerhtml += "<tbody>";  // Start table body

                        //This is super unorganized but it iterates through track-type response from Spotify
                        //TODO WILL NEED TO CREATE NEW LOOPS FOR DIFFERENT SEARCH TYPES - ALBUMS/ARTISTS
                        //TODO NEW PAGE FOR ARTIST CLICKS?
                        response.tracks.items.forEach((entry, ind) => {
                            resultIDs.push(entry.id); //Puts the track id in the list

                            innerhtml += "<tr class='spotTrack' id="+ind+">";
                            let imageMd = entry.album.images[1].url;
                            // album name > entry.album.name


                            let artists = "<p> Artist(s) : ";
                            entry.artists.forEach((entry, ind) => {
                                artists += entry.name + ", ";
                            });
                            artists = artists.substring(0, artists.length - 2);
                            artists+="</p>";
                            let playLength = entry.duration_ms;
                            playLength = Math.ceil(playLength / 1000);  //Converts time received in ms to s

                            let trackName = entry.name;

                            /*****************************************
                            Other information that might be fun:
                            - .popularity (1-100)
                            - .track_number (within album presumably) ((THERES ALSO DISC NUMBER))
                            - .album.total_tracks
                             *****************************************/
                            innerhtml += "<td><img src='"+imageMd+"' height='150' width='150' alt='Album Art Not Found'></td>";  //TODO FIX HOVER OVER TO MAKE IMAGE BIGGER
                            innerhtml += "<td><b>" + trackName + "</b></br> Length &nbsp: " + playLength + "s</br>" + artists + "</td>";
                            innerhtml += "</tr>"

                            //TODO THEN ADD TO PLAYLIST, NEED AN ENDPOINT FOR THAT
                        }); //End items.foreach
                        innerhtml += "</tbody>";
                        result.html(innerhtml);
                    } // end else
                } // end if success
            } // end handleSuccess
            function handleError(){
                result.html("<h1>ERROR</h1>");
            }
        }; //end onLoad

    }//end constructor
    static create(){
        let handle = new handler();
    }//end create
} // end handler
