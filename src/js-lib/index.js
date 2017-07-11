var Handlebars = require("handlebars/runtime")["default"];
var mvdom = require("mvdom");
var d3 = require("d3");
//var d3 = Object.assign({}, require("d3-format"));

if (window){
	window.Handlebars = Handlebars;
	window.mvdom = mvdom;
	window.d3 = d3;
}