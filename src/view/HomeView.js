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
		view._videoEl = d.first("video");

		d.on(view._videoEl, "timeupdate", function(evt){
			var videoEl = evt.target;
			clearAnnotation.call(view);
			var annos = getAnnotations.call(view, videoEl.currentTime);
			if(annos.length > 0){
				for(var i = 0; i < annos.length; i++){
					showAnnotation.call(view, annos[i]);
				}
			}
		});
	},

	events: {
		"click; .btn-add-anno":function(evt){
			var view = this;
			var videoEl = view._videoEl;
			videoEl.pause();
			var anno = generateAnnotation.call(view, videoEl.currentTime);
			addAnnotation.call(view, anno);
			showAnnotation.call(view, anno);
		}
	}

});

function generateAnnotation(time){
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
		time: time,
		color: color.random()
	};
}

function addAnnotation(newAnno){
	var view = this;
	var time = parseInt(newAnno.time);
	var annos = getAnnotations.call(view, newAnno.time);
	annos.push(newAnno);
	annos.sort(function(a, b){
		return a.time > b.time ? 1 : -1;
	});
	_annotations[time] = annos;
}

function getAnnotations(time){
	var view = this;
	var time = parseInt(time);
	return _annotations[time] || [];
}

function clearAnnotation(){
	var view = this;
	d.empty(d.first(view.el, ".annos-con"));
}

function showAnnotation(anno){
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
	divEl.style.backgroundColor = color.fade(anno.color, .3);

	d.append(conEl, divEl);
}