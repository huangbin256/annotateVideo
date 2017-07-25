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

		// show default progress
		showCurrentTime.call(view);

		// show volume
		var volumeProgressItem = d.first(view.el, ".volume-progress .slide-item");
		volumeProgressItem.style.left = view._videoEl.volume * 100 + "%";

		d.on(view._videoEl, "timeupdate", function(evt){
			var videoEl = evt.target;
			showCurrentTime.call(view);
			clearAnnotation.call(view);
			var annos = getAnnotations.call(view, videoEl.currentTime);
			if(annos.length > 0){
				for(var i = 0; i < annos.length; i++){
					showAnnotation.call(view, annos[i]);
				}
			}
		});

		d.on(view._videoEl, "play", function(evt){
			checkPlay.call(view);
		});

		d.on(view._videoEl, "pause", function(evt){
			checkPlay.call(view);
		});
	},

	events: {
		"click; .btn-add-anno":function(evt){
			var view = this;
			var type = evt.selectTarget.getAttribute("data-type");
			var videoEl = view._videoEl;
			videoEl.pause();
			var anno = generateAnnotation.call(view, videoEl.currentTime, type);
			addAnnotation.call(view, anno);
			showAnnotation.call(view, anno);
		},

		"keyup; .time-values":function(evt){
			var view = this;
			if(evt.keyCode == 13){
				var timeEl = evt.selectTarget;
				var value = timeEl.value;
				value = isNaN(value * 1) ? -1 : value;
				gotoTime.call(view, value);
			}
		},

		"click; .btn-play":function(evt){
			var view = this;
			playOrStop.call(view);
		},

		"click; .btn-prev":function(evt){
			var view = this;
			var time = view._videoEl.currentTime;
			time -= 10;
			gotoTime.call(view, time);
		},

		"click; .btn-next":function(evt){
			var view = this;
			var time = view._videoEl.currentTime;
			time += 10;
			gotoTime.call(view, time);
		},

		"click; .btn-start":function(evt){
			var view = this;
			gotoTime.call(view, 0);
		},

		"click; .btn-end":function(evt){
			var view = this;
			gotoTime.call(view, view._videoEl.duration);
		},

		"changing; .time-progress":function(evt){
			var view = this;
			var duration = view._videoEl.duration;
			var time = duration * evt.detail / 100;
			gotoTime.call(view, time);
		},

		"changing; .volume-progress":function(evt){
			var view = this;
			view._videoEl.volume = evt.detail / 100;
		}
	}

});


// --------- controls ---------//
function showCurrentTime(){
	var view = this;
	var videoEl = view._videoEl;
	var inputEl = d.first(view.el, ".controlbar input");
	inputEl.value = videoEl.currentTime.toFixed(2);

	var timeProgressItem = d.first(view.el, ".time-progress .slide-item");
	timeProgressItem.style.left = videoEl.currentTime / videoEl.duration * 100 + "%";
}

function gotoTime(time){
	var view = this;
	var videoEl = view._videoEl;
	videoEl.currentTime = time;
}

function checkPlay(){
	var view = this;
	var paused = view._videoEl.paused;
	var btnEl = d.first(view.el, ".btn-play"); 

	if(paused){
		btnEl.classList.add("stop");
		btnEl.innerText = "Play";
	}else{
		btnEl.classList.remove("stop");
		btnEl.innerText = "Stop";
	}
}

function playOrStop(){
	var view = this;
	var paused = view._videoEl.paused;
	if(paused){
		view._videoEl.play();
	}else{
		view._videoEl.pause();
	}
}
// --------- /controls ---------//

// --------- annotation ---------//
function generateAnnotation(time, type){
	var view = this;
	var x = Math.random();
	var y = Math.random();
	var w = Math.random() * (1 - x);
	var h = Math.random() * (1 - y);

	var obj = {
		x: x,
		y: y,
		time: time,
		type: type,
		color: color.random()
	};

	if(type == "circle"){
		obj.r = w;
	}else{
		obj.w = w;
		obj.h = h;
	}

	return obj;
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
	var divEl = render("HomeView-annotation");
	var width = conEl.clientWidth;
	var height = conEl.clientHeight;
	d.append(conEl, divEl);
	divEl = d.first(conEl, ".anno:last-child");

	// position and size
	divEl.style.left = (anno.x * 100) + "%";
	divEl.style.top = (anno.y * 100) + "%";
	divEl.style.borderColor = anno.color;
	divEl.style.backgroundColor = color.fade(anno.color, .3);

	if(anno.type == "circle"){
		divEl.classList.add("circle");
		var r = Math.min(width, height);
		divEl.style.width = (anno.r * r) + "px";
		divEl.style.height = (anno.r * r) + "px";
		divEl.style.borderRadius = (anno.r * r) + "px";
	}else{
		divEl.classList.add("rectangle");
		divEl.style.width = (anno.w * width) + "px";
		divEl.style.height = (anno.h * height) + "px";
	}

}

function isEditMode(){
	var view = this;
	return view._videoEl.paused;
}
// --------- /annotation ---------//
