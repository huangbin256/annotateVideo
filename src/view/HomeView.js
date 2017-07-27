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

		// --------- video events ---------//
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
		// --------- /video events ---------//

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
			view._videoEl.pause();
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
		},

		"mousedown; .resizer":function(evt){
			var view = this;
			view._dragEl = evt.selectTarget;
			view._lastPos = {
				x: evt.pageX,
				y: evt.pageY
			};
		},

		"mousedown; .anno":function(evt){
			var view = this;
			if(!view._dragEl){
				view._dragEl = evt.selectTarget;
				view._lastPos = {
					x: evt.pageX,
					y: evt.pageY
				};
			}
		}
	},
	docEvents: {
		"mousemove":function(evt){
			var view = this;
			if(view._dragEl){
				var deltaX = evt.pageX - view._lastPos.x;
				var deltaY = evt.pageY - view._lastPos.y;
				var width = view._videoEl.clientWidth;
				var height = view._videoEl.clientHeight;

				if(view._dragEl.classList.contains("resizer")){
					var resizerEl = view._dragEl;
					var annoEl = d.closest(view._dragEl, ".anno");
					var ox = annoEl.offsetLeft;
					var oy = annoEl.offsetTop;
					var ow = annoEl.offsetWidth;
					var oh = annoEl.offsetHeight;
					var x1 = ox, y1 = oy, x2 = x1 + ow, y2 = y1 + oh;
					if(resizerEl.classList.contains("corner")){
						if(resizerEl.classList.contains("c-tl")){
							x1 += deltaX;
							y1 += deltaY;

							x1 = x1 < 0 ? 0 : x1;
							x1 = x1 > x2 - 2 ? x2 - 2 : x1;
							y1 = y1 < 0 ? 0 : y1;
							y1 = y1 > y2 - 2 ? y2 - 2 : y1;
						}else if(resizerEl.classList.contains("c-tr")){
							x2 += deltaX;
							y1 += deltaY;

							x2 = x2 < x1 ? x1 : x2;
							x2 = x2 > width ? width : x2;
							y1 = y1 < 0 ? 0 : y1;
							y1 = y1 > y2 - 2 ? y2 - 2 : y1;
						}else if(resizerEl.classList.contains("c-br")){
							x2 += deltaX;
							y2 += deltaY;

							x2 = x2 < x1 ? x1 : x2;
							x2 = x2 > width ? width : x2;
							y2 = y2 < y1 ? y1 : y2;
							y2 = y2 > height ? height : y2;
						}else if(resizerEl.classList.contains("c-bl")){
							x1 += deltaX;
							y2 += deltaY;

							x1 = x1 < 0 ? 0 : x1;
							x1 = x1 > x2 - 2 ? x2 - 2 : x1;
							y2 = y2 < y1 ? y1 : y2;
							y2 = y2 > height ? height : y2;
						}
					}else{
						if(resizerEl.classList.contains("l-l")){
							x1 += deltaX;

							x1 = x1 < 0 ? 0 : x1;
							x1 = x1 > x2 - 2 ? x2 - 2 : x1;
						}else if(resizerEl.classList.contains("l-t")){
							y1 +=+ deltaY;

							y1 = y1 < 0 ? 0 : y1;
							y1 = y1 > y2 - 2 ? y2 - 2 : y1;
						}else if(resizerEl.classList.contains("l-r")){
							x2 += deltaX;

							x2 = x2 < x1 ? x1 : x2;
							x2 = x2 > width ? width : x2;
						}else if(resizerEl.classList.contains("l-b")){
							y2 +=+ deltaY;

							y2 = y2 < y1 ? y1 : y2;
							y2 = y2 > height ? height : y2;
						}
					}


					annoEl.style.left = (x1 / width * 100) + "%";
					annoEl.style.top = (y1 / height * 100)  + "%";
					annoEl.style.width = (x2 - x1) + "px";
					annoEl.style.height = (y2 - y1) + "px";

				}else if(view._dragEl.classList.contains("anno")){
					var annoEl = view._dragEl;
					var ox = annoEl.offsetLeft;
					var oy = annoEl.offsetTop;
					var ow = annoEl.offsetWidth;
					var oh = annoEl.offsetHeight;
					var left = (ox + deltaX) / width;
					var top = (oy + deltaY) / height;
					
					left = left < 0 ? 0 : left;
					left = left * width + ow > width ? (width - ow) / width : left;
					annoEl.style.left = left * 100 + "%";
					
					top = top < 0 ? 0 : top;
					top = top * height + oh > height ? (height - oh) / height : top;
					annoEl.style.top = top * 100 + "%";
				}
			}


			view._lastPos = {
				x: evt.pageX,
				y: evt.pageY
			};
		},

		"mouseup":function(evt){
			var view = this;
			if(view._dragEl){
				view._dragEl = null;
				view._lastPos = null;
			}
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
	divEl.style.color = anno.color;
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
