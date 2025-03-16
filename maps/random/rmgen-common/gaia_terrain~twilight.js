/**
 * Hills are elevated, planar, impassable terrain areas.
 */
function createPassableHills(terrainset, constraints, tileClass, count, minSize, maxSize, spread, failFraction = 0.8, elevation = 50, elevationSmoothing = 20)
{
	g_Map.log("Creating hills");
	createAreas(
		new ChainPlacer(
			minSize || 1,
			maxSize || Math.floor(scaleByMapSize(4, 6)),
			spread || Math.floor(scaleByMapSize(16, 60)),
			failFraction),
		[
			new LayeredPainter(terrainset, [1, elevationSmoothing]),
			new SmoothElevationPainter(ELEVATION_SET, elevation, elevationSmoothing),
			new TileClassPainter(tileClass)
		],
		constraints,
		count || scaleByMapSize(1, 4) * getNumPlayers());
}
