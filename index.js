const https = require("https");
const API_KEY = require('./apikey').API_KEY;
const normalBlindPickID = 430;
const normalDraftID = 400;
const rankedSoloID = 9999;  // TODO change this sometime later (probably never)

var summonerName = "";
var accountId = "";
var server = "";
var matchIDs = [];
var normalGames = [];

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
            console.log("-------------");
            console.log(body);  // debug
            for(var i = 0; i < body.endIndex; i++){
                matchIDs.push(body.matches[i].gameId);
                // add normal blind pick and draft games
                if(body.matches[i].queue == normalBlindPickID
                            || body.matches[i].queue == normalDraftID){
                    normalGames.push(body.matches[i].gameId);
                }
            }
            console.log(normalGames);

        });
    });
}

// the start of everything
go("SleepingSindooo", "euw1");  // I use your account sneedo. second best rat euw.
