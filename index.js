const https = require("https");
const API_KEY = require('./apikey').API_KEY;
const rankToValue = require("./rankValues").VALUES;
const normalBlindPickID = 430;
const normalDraftID = 400;
const rankedSoloID = 9999;  // TODO change this sometime later (probably never)

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
    doAll();
}

function doAll(){
    var url = "https://" + server + ".api.riotgames.com/lol/summoner/v3/summoners/by-name/";
    url += summonerName + "?api_key=" + API_KEY;
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
            for(var i = 0; i < body.endIndex; i++){
                matchIDs.push(body.matches[i].gameId);
                // add normal blind pick and draft games
                if(body.matches[i].queue == normalBlindPickID
                            || body.matches[i].queue == normalDraftID){
                    normalGames.push(body.matches[i].gameId);
                }
            }
            console.log("normal games IDs:");
            console.log(normalGames);
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
                for(var j = 0; j < 10; j++){
                    teammatesAndEnemies.push(body.participantIdentities[j].player.summonerId);
                }
                // this solution is insanely bad. callbacks are hard.
                if(x++ == normalGames.length - 1){
                    // last loop
                    console.log("-------------------------------");
                    console.log("Found users: " + teammatesAndEnemies.length);
                    //console.log("user summonerIDs:");
                    //console.log(teammatesAndEnemies);
                    // -> continue to next function
                    getRankForAllUsers();
                }
            });
        });
    }
}

function getRankForAllUsers(){
    var x = 0;
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
                    // last loop ( 200iq solution. or 10iq solution :c )
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
    console.log("ranks found: " + ranks.length);
    console.log("sum of ranks: " + sum);
    console.log("avg rank: " + (sum/ranks.length));   // calculate this to a rank
}

// the start of everything
go("SleepingSindooo", "euw1");  // I use your account sneedo. second best rat euw.
