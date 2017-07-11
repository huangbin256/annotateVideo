const fs = require('fs-extra-plus');
const path = require('path');

const routes = []; 

// This export One Extension that can have multiple routes 
// that will be loaded by server
module.exports = routes;
var baseURI = "/api";

var _dataPath = path.join(__dirname, "../../data");

routes.push({
	method: "GET",
	path: baseURI + "/video",
	handler: function (request, reply) {
		var name = request.url.query.n;
		var file = path.resolve(_dataPath, name);

		reply(fs.readFileSync(file))
			.encoding('binary')
			.type('video/mp4');

	}
});