var g_AmountsMt = {
	"scarce": 0.2,
	"few": 0.5,
	"normal": 1,
	"many": 1.75,
	"tons": 3
};

var g_MixesMt = {
	"same": 0,
	"similar": 0.1,
	"normal": 0.25,
	"varied": 0.5,
	"unique": 0.75
};

var g_SizesMt = {
	"tiny": 0.5,
	"small": 0.75,
	"normal": 1,
	"big": 1.25,
	"huge": 1.5,
};

var g_AllAmountsMt = Object.keys(g_AmountsMt);
var g_AllMixesMt = Object.keys(g_MixesMt);
var g_AllSizesMt = Object.keys(g_SizesMt);

var g_DefaultTileClassesMt = [
	"animals",
	"baseResource",
	"berries",
	"bluff",
	"bluffIgnore", // performance improvement
	"dirt",
	"fish",
	"food",
	"forest",
	"hill",
	"land",
	"map",
	"metal",
	"mountain",
	"plateau",
	"player",
	"prop",
	"ramp",
	"rock",
	"settlement",
	"spine",
	"valley",
	"water"
];

var g_TileClassesMt;

var g_PlayerbaseTypesMt = {
	"line": {
		"getPosition": (distance, groupedDistance, startAngle) => placeLineMt(getTeamsArrayMt(), distance, groupedDistance, startAngle),
		"distance": fractionToTiles(randFloat(0.2, 0.35)),
		"groupedDistance": fractionToTiles(randFloat(0.08, 0.1)),
		"walls": false
	},
	"radial": {
		"getPosition": (distance, groupedDistance, startAngle) => playerPlacementCircleMt(distance, startAngle),
		"distance": fractionToTiles(randFloat(0.25, 0.35)),
		"groupedDistance": fractionToTiles(randFloat(0.08, 0.1)),
		"walls": true
	},
	"randomGroup": {
		"getPosition": (distance, groupedDistance, startAngle) => playerPlacementRandomMt(sortAllPlayers()) || playerPlacementCircleMt(distance, startAngle),
		"distance": fractionToTiles(randFloat(0.25, 0.35)),
		"groupedDistance": fractionToTiles(randFloat(0.08, 0.1)),
		"walls": true
	},
	"stronghold": {
		"getPosition": (distance, groupedDistance, startAngle) => placeStrongholdMt(getTeamsArrayMt(), distance, groupedDistance, startAngle),
		"distance": fractionToTiles(randFloat(0.2, 0.35)),
		"groupedDistance": fractionToTiles(randFloat(0.08, 0.1)),
		"walls": false
	}
};

/**
 * Adds an array of elements to the map.
 */
function addElementsMt(elements)
{
	for (let element of elements)
		element.func(
			[
				avoidClasses.apply(null, element.avoid),
				stayClasses.apply(null, element.stay || null)
			],
			pickSizeMt(element.sizes),
			pickMixMt(element.mixes),
			pickAmountMt(element.amounts),
			element.baseHeight || 0);
}

/**
 * Converts "amount" terms to numbers.
 */
function pickAmountMt(amounts)
{
	let amount = pickRandom(amounts);

	if (amount in g_AmountsMt)
		return g_AmountsMt[amount];

	return g_AmountsMt.normal;
}

/**
 * Converts "mix" terms to numbers.
 */
function pickMixMt(mixes)
{
	let mix = pickRandom(mixes);

	if (mix in g_MixesMt)
		return g_MixesMt[mix];

	return g_MixesMt.normal;
}

/**
 * Converts "size" terms to numbers.
 */
function pickSizeMt(sizes)
{
	let size = pickRandom(sizes);

	if (size in g_SizesMt)
		return g_SizesMt[size];

	return g_SizesMt.normal;
}

/**
 * Choose starting locations for all players.
 *
 * @param {string} type - "radial", "line", "stronghold", "randomGroup"
 * @param {number} distance - radial distance from the center of the map
 * @param {number} groupedDistance - space between players within a team
 * @param {number} startAngle - determined by the map that might want to place something between players
 * @returns {Array|undefined} - If successful, each element is an object that contains id, angle, x, z for each player
 */
function createBaseMtsByPatternMt(type, distance, groupedDistance, startAngle)
{
	return createBaseMts(...g_PlayerbaseTypesMt[type].getPosition(distance, groupedDistance, startAngle), g_PlayerbaseTypesMt[type].walls);
}

function createBaseMts(playerIDs, playerPosition, walls)
{
	g_Map.log("Creating bases");

	for (let i = 0; i < getNumPlayers(); ++i)
		createBaseMt(playerIDs[i], playerPosition[i], walls);

	return [playerIDs, playerPosition];
}

/**
 * Create the base for a single player.
 *
 * @param {Object} player - contains id, angle, x, z
 * @param {boolean} walls - Whether or not iberian gets starting walls
 */
function createBaseMt(playerID, playerPosition, walls)
{
	placePlayerBase({
		"playerID": playerID,
		"playerPosition": playerPosition,
		"PlayerTileClass": g_TileClassesMt.player,
		"BaseResourceClass": g_TileClassesMt.baseResource,
		"baseResourceConstraint": avoidClasses(g_TileClassesMt.water, 0, g_TileClassesMt.mountain, 0),
		"Walls": g_Map.getSize() > 192 && walls,
		"CityPatch": {
			"outerTerrain": g_Terrains.roadWild,
			"innerTerrain": g_Terrains.road,
			"painters": [
				new TileClassPainter(g_TileClassesMt.player)
			]
		},
		"StartingAnimal": {
			"template": g_Gaia.startingAnimal
		},
		"Berries": {
			"template": g_Gaia.fruitBush
		},
		"Mines": {
			"types": [
				{ "template": g_Gaia.metalLarge },
				{ "template": g_Gaia.stoneLarge }
			]
		},
		"Trees": {
			"template": g_Gaia.tree1,
			"count": currentBiome() == "generic/savanna" ? 5 : 15
		},
		"Decoratives": {
			"template": g_Decoratives.grassShort
		}
	});
}

/**
 * Return an array where each element is an array of playerIndices of a team.
 */
function getTeamsArrayMt()
{
	var playerIDs = sortAllPlayers();
	var numPlayers = getNumPlayers();

	// Group players by team
	var teams = [];
	for (let i = 0; i < numPlayers; ++i)
	{
		let team = getPlayerTeam(playerIDs[i]);
		if (team == -1)
			continue;

		if (!teams[team])
			teams[team] = [];

		teams[team].push(playerIDs[i]);
	}

	// Players without a team get a custom index
	for (let i = 0; i < numPlayers; ++i)
		if (getPlayerTeam(playerIDs[i]) == -1)
			teams.push([playerIDs[i]]);

	// Remove unused indices
	return teams.filter(team => true);
}

/**
 * Place teams in a line-pattern.
 *
 * @param {Array} playerIDs - typically randomized indices of players of a single team
 * @param {number} distance - radial distance from the center of the map
 * @param {number} groupedDistance - distance between players
 * @param {number} startAngle - determined by the map that might want to place something between players.
 *
 * @returns {Array} - contains id, angle, x, z for every player
 */
function placeLineMt(teamsArray, distance, groupedDistance, startAngle)
{
	let playerIDs = [];
	let playerPosition = [];

	let mapCenter = g_Map.getCenter();
	let dist = fractionToTiles(0.45);

	for (let i = 0; i < teamsArray.length; ++i)
	{
		var safeDist = distance;
		if (distance + teamsArray[i].length * groupedDistance > dist)
			safeDist = dist - teamsArray[i].length * groupedDistance;

		var teamAngle = startAngle + (i + 1) * 2 * Math.PI / teamsArray.length;

		for (let p = 0; p < teamsArray[i].length; ++p)
		{
			playerIDs.push(teamsArray[i][p]);
			playerPosition.push(Vector2D.add(mapCenter, new Vector2D(safeDist + p * groupedDistance, 0).rotate(-teamAngle)).round());
		}
	}

	return [playerIDs, playerPosition];
}

/**
 * Place given players in a stronghold-pattern.
 *
 * @param teamsArray - each item is an array of playerIDs placed per stronghold
 * @param distance - radial distance from the center of the map
 * @param groupedDistance - distance between neighboring players
 * @param {number} startAngle - determined by the map that might want to place something between players
 */
function placeStrongholdMt(teamsArray, distance, groupedDistance, startAngle)
{
	var mapCenter = g_Map.getCenter();

	let playerIDs = [];
	let playerPosition = [];

	for (let i = 0; i < teamsArray.length; ++i)
	{
		var teamAngle = startAngle + (i + 1) * 2 * Math.PI / teamsArray.length;
		var teamPosition = Vector2D.add(mapCenter, new Vector2D(distance, 0).rotate(-teamAngle));
		var teamGroupDistance = groupedDistance;

		// If we have a team of above average size, make sure they're spread out
		if (teamsArray[i].length > 4)
			teamGroupDistance = Math.max(fractionToTiles(0.08), groupedDistance);

		// If we have a solo player, place them on the center of the team's location
		if (teamsArray[i].length == 1)
			teamGroupDistance = fractionToTiles(0);

		// TODO: Ensure players are not placed outside of the map area, similar to placeLineMt

		// Create player base
		for (var p = 0; p < teamsArray[i].length; ++p)
		{
			var angle = startAngle + (p + 1) * 2 * Math.PI / teamsArray[i].length;
			playerIDs.push(teamsArray[i][p]);
			playerPosition.push(Vector2D.add(teamPosition, new Vector2D(teamGroupDistance, 0).rotate(-angle)).round());
		}
	}

	return [playerIDs, playerPosition];
}

/**
 * Creates tileClass for the default classes and every class given.
 *
 * @param {Array} newClasses
 * @returns {Object} - maps from classname to ID
 */
function initTileClassesMt(newClasses)
{
	var classNames = g_DefaultTileClassesMt;

	if (newClasses)
		classNames = classNames.concat(newClasses);

	g_TileClassesMt = {};
	for (var className of classNames)
		g_TileClassesMt[className] = g_Map.createTileClass();
}
