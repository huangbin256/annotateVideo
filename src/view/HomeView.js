var d = window.mvdom;
var Gtx = window.Gtx;
var d3 = window.d3;

var render = require("js-app/render.js").render;
var color = require("js-app/color.js");
// key would be time
// annotation: {x: 1, y: 1}
var _annotations = {};


d.register("HomeView",{
	create: function(data, config){
		return render("HomeView");
	}, 

	postDisplay: function(){
		var view = this; // best practice, set the view variable first.	
		d.on(d.first("video"), "timeupdate", function(evt){
			var videoEl = evt.target;
			var time = parseInt(videoEl.currentTime);
			var anno = _annotations[time];
			if(anno){
				showAnnotations.call(view, anno);
			}
		});
	},

	events: {
		"click; .btn-add-anno":function(evt){
			var view = this;
			var videoEl = d.first(view.el, "video");
			var anno = addAnnotation.call(view);
			var time = parseInt(videoEl.currentTime);
			_annotations[time] = anno;
			showAnnotations.call(view, anno);
		}
	}

});

function addAnnotation(){
	var view = this;
	var x = Math.random();
	var y = Math.random();
	var w = Math.random() * (1 - x);
	var h = Math.random() * (1 - y);

	return {
		x: x,
		y: y,
		w: w,
		h: h,
		color: color.random()
	};
}

function showAnnotations(anno){
	var view = this;
	var conEl = d.first(view.el, ".annos-con");
	var divEl = document.createElement("div");
	var width = conEl.clientWidth;
	var height = conEl.clientHeight;
	divEl.classList.add("rectangle");

	// position and size
	divEl.style.left = (anno.x * 100) + "%";
	divEl.style.top = (anno.y * 100) + "%";
	divEl.style.width = (anno.w * width) + "px";
	divEl.style.height = (anno.h * height) + "px";
	divEl.style.borderColor = anno.color;

	d.append(conEl, divEl);
	setTimeout(function(){
		d.remove(divEl);
	}, 1000);
}