const https = require("https");
const API_KEY = require('./apikey').API_KEY;
const servers = require("./servers").SERVERS;
const rankToValue = require("./rankValues").VALUES;
const normalBlindPickID = 430;
const normalDraftID = 400;
const rankedSoloID = 9999;  // change this sometime later (probably never)

var summonerName = "";
var accountId = "";
var server = "";
var matchIDs = [];
var normalGames = [];
var teammatesAndEnemies = [];
var ranks = [];

function go(name, serv){
    summonerName = name;
    server = serv;
    getAccountId();
}

function getAccountId(){
    // api url
    var url = "https://" + server + ".api.riotgames.com/lol/summoner/v3/summoners/by-name/";
    url += summonerName + "?api_key=" + API_KEY;
    // getting data
    https.get(url, res => {
        res.setEncoding('utf8');
        let body = "";
        res.on("data", data => {
            body += data;
        });
        res.on("end", end => {
            body = JSON.parse(body);
            console.log(body);  // debug
            accountId = body.accountId;
            matchHistory();
        });
    });
}

function matchHistory(){
    var url = "https://" + server + ".api.riotgames.com/lol/match/v3/matchlists/by-account/";
    url += accountId + "/recent?api_key=" + API_KEY;
    https.get(url, res => {
        res.setEncoding('utf8');
        let body = "";
        res.on("data", data => {
            body += data;
        });
        res.on("end", end => {
            body = JSON.parse(body);
            //console.log("-------------");
            //console.log(body);  // debug

            // loop through all found matches
            for(var i = 0; i < body.endIndex; i++){
                matchIDs.push(body.matches[i].gameId);  // add match IDs to list
                var qType = body.matches[i].queue;
                if(qType == normalBlindPickID || qType == normalDraftID){
                    normalGames.push(body.matches[i].gameId);   // add normal games to this list
                }
            }
            console.log(">normal games found: " + normalGames.length);
            getAllUsers();
        });
    });
}

function getAllUsers(){
    var x = 0;
    for(var i = 0; i < normalGames.length; i++){
        var url = "https://" + server + ".api.riotgames.com/lol/match/v3/matches/";
        url += normalGames[i] + "?api_key=" + API_KEY;

        https.get(url, res => {
            res.setEncoding('utf8');
            let body = "";
            res.on("data", data => {
                body += data;
            });
            res.on("end", end => {
                body = JSON.parse(body);
                // add summonerID for every player in every game in the match history
                for(var j = 0; j < 10; j++){
                    teammatesAndEnemies.push(body.participantIdentities[j].player.summonerId);
                }
                // this solution is insanely bad (I think). callbacks are hard.
                if(x++ == normalGames.length - 1){  // last loop
                    console.log(">teammates and enemies scanned: " + teammatesAndEnemies.length);
                    //console.log(teammatesAndEnemies); // debug
                    getRankForAllUsers();
                }
            });
        });
    }
}

function getRankForAllUsers(){
    var x = 0;
    // get soloQ rank for every summoner found
    for(var i = 0; i < teammatesAndEnemies.length; i++){
        var url = "https://euw1.api.riotgames.com/lol/league/v3/positions/by-summoner/";
        url += teammatesAndEnemies[i] + "?api_key=" + API_KEY;
        https.get(url, res => {
            res.setEncoding('utf8');
            var body = "";
            res.on("data", data => {
                body += data;
            });
            res.on("end", end => {
                body = JSON.parse(body);

                if(JSON.stringify(body) != '[]'){
                    var l = body.length;
                    if(l !== "undefined"){
                        // loop through different queue types
                        for(var j = 0; j < l; j++){
                            if(body[j].queueType === "RANKED_SOLO_5x5"){
                                var rank = body[j].tier + " " + body[j].rank; // ex DIAMOND III
                                ranks.push(rank);
                            }
                        }
                    }
                }

                if(x++ == teammatesAndEnemies.length - 1){
                    // last loop
                    //console.log(ranks);   // debug
                    rankValues();
                }
            });
        });
    }
}

function rankValues(){
    var sum = 0;
    for(var i = 0; i < ranks.length; i++){
        sum += rankToValue[ranks[i]];
    }
    var avg = sum / ranks.length;
    var rankText = "undefined";

    for(var key in rankToValue){
        if(rankToValue[key] == Math.floor(avg)){
            rankText = key;
        }
    }

    console.log(">ranked players: " + ranks.length);
    console.log(">sum of rank values: " + sum);
    console.log(">avg rank value: " + avg);
    console.log("\nMMR rank: " + rankText);
}

// the beginning of everything
// ******************************
summoner = "THESWIFTSCOUT XD";  // low level acc
server = "euw";

go(summoner, servers[server.toUpperCase()]);
// ******************************
