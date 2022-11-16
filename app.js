const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
//1) GET All Players Detials
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const dbResponse = await db.all(getPlayersQuery);
  const convertSnakeCaseToPascalCase = (dbObject) => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  };
  let newPlayerDetails = [];
  for (let player of dbResponse) {
    let playerDetails = convertSnakeCaseToPascalCase(player);
    newPlayerDetails.push(playerDetails);
  }
  response.send(newPlayerDetails);
});
//2) GET Player Details With Id
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const dbResponse = await db.get(getPlayersQuery);
  const convertSnakeCaseToPascalCase = (dbObject) => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  };
  let playerDetails = convertSnakeCaseToPascalCase(dbResponse);
  response.send(playerDetails);
});
//3) PUT Update Player Details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const getUpdateQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  const dbResponse = await db.run(getUpdateQuery);
  response.send("Player Details Updated");
});
//4) GET Match Details With Id
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const dbResponse = await db.get(getMatchQuery);
  const convertSnakeCaseToPascalCase = (dbObject) => {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    };
  };
  let matchDetails = convertSnakeCaseToPascalCase(dbResponse);
  response.send(matchDetails);
});

//5) GET PlayerMatch Details
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `SELECT match_details.match_id, match_details.match, match_details.year FROM match_details JOIN player_match_score ON match_details.match_id = player_match_score.match_id WHERE player_match_score.player_id = ${playerId};`;
  const dbResponse = await db.all(getMatchesQuery);

  const convertSnakeCaseToPascalCase = (dbObject) => {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    };
  };

  let newMatchDetails = [];
  for (let match of dbResponse) {
    let matchDetails = convertSnakeCaseToPascalCase(match);
    newMatchDetails.push(matchDetails);
  }

  response.send(newMatchDetails);
});

//6) GET Plyers Specific Matches
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `SELECT (player_details.player_id) AS playerId  
  FROM player_details JOIN player_match_score ON 
  player_details.player_id = player_match_score.player_id WHERE player_match_score.match_id = ${matchId};`;
  const dbResponse = await db.all(getPlayerQuery);
  respond.send(dbResponse);
});

//7) GET Player Details With Id
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `SELECT (player_match_score.player_id) AS playerId, 
     (player_details.player_name) AS playerName,
     SUM(player_match_score.score) AS totalScore,
     SUM(player_match_score.fours) AS totalFours,
     SUM(player_match_score.sixes) AS totalSixes
     FROM player_details JOIN player_match_score ON 
    player_details.player_id = player_match_score.player_id WHERE player_details.player_id = ${playerId};`;
  const dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});
module.exports = app;
