var d = window.mvdom;
var Gtx = window.Gtx;
var d3 = window.d3;

var render = require("js-app/render.js").render;
var color = require("js-app/color.js");
var utils = require("js-app/utils.js");
// key would be time
// annotation: {id: 1, time: 1, start: {x: 1, y: 1}, end: {x: 1, y: 1}}
var _annotations = [];


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

			// update annotation in video
			if(isPlay.call(view)){
				clearAnnotation.call(view);
				var annos = getValidAnnotations.call(view, videoEl.currentTime);
				if(annos.length > 0){
					for(var i = 0; i < annos.length; i++){
						showAnnotation.call(view, annos[i]);
					}
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

					var isCircle = annoEl.classList.contains("circle");
					if(isCircle){
						var dis = Math.max(Math.abs(deltaX), Math.abs(deltaY));
						deltaX = deltaX > 0 ? dis : -1 * dis;
						deltaY = deltaY > 0 ? dis : -1 * dis;
					}

					if(resizerEl.classList.contains("corner")){
						if(resizerEl.classList.contains("c-tl")){
							x1 += deltaX;
							y1 += deltaY;
							x1 = x1 < 0 ? 0 : x1;
							x1 = x1 > x2 - 2 ? x2 - 2 : x1;
							y1 = y1 < 0 ? 0 : y1;
							y1 = y1 > y2 - 2 ? y2 - 2 : y1;

							if(isCircle){
								var dis = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
								x1 = x2 - dis;
								y1 = y2 - dis;
							}
						}else if(resizerEl.classList.contains("c-tr")){
							x2 += deltaX;
							y1 += deltaY;

							x2 = x2 < x1 ? x1 : x2;
							x2 = x2 > width ? width : x2;
							y1 = y1 < 0 ? 0 : y1;
							y1 = y1 > y2 - 2 ? y2 - 2 : y1;

							if(isCircle){
								var dis = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
								x2 = x1 + dis;
								y1 = y2 - dis;
							}
						}else if(resizerEl.classList.contains("c-br")){
							x2 += deltaX;
							y2 += deltaY;

							x2 = x2 < x1 ? x1 : x2;
							x2 = x2 > width ? width : x2;
							y2 = y2 < y1 ? y1 : y2;
							y2 = y2 > height ? height : y2;

							if(isCircle){
								var dis = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
								x2 = x1 + dis;
								y2 = y1 + dis;
							}
						}else if(resizerEl.classList.contains("c-bl")){
							x1 += deltaX;
							y2 += deltaY;

							x1 = x1 < 0 ? 0 : x1;
							x1 = x1 > x2 - 2 ? x2 - 2 : x1;
							y2 = y2 < y1 ? y1 : y2;
							y2 = y2 > height ? height : y2;

							if(isCircle){
								var dis = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
								x1 = x2 - dis;
								y2 = y1 + dis;
							}
						}
					}else{
						if(resizerEl.classList.contains("l-l")){
							x1 += deltaX;

							x1 = x1 < 0 ? 0 : x1;
							x1 = x1 > x2 - 2 ? x2 - 2 : x1;

							if(isCircle){
								y1 += deltaX;

								y1 = y1 < 0 ? 0 : y1;
								y1 = y1 > y2 - 2 ? y2 - 2 : y1;

								var dis = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
								x1 = x2 - dis;
								y1 = y2 - dis;
							}
						}else if(resizerEl.classList.contains("l-t")){
							y1 +=+ deltaY;

							y1 = y1 < 0 ? 0 : y1;
							y1 = y1 > y2 - 2 ? y2 - 2 : y1;

							if(isCircle){
								x1 += deltaY;

								x1 = x1 < 0 ? 0 : x1;
								x1 = x1 > x2 - 2 ? x2 - 2 : x1;

								var dis = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
								x1 = x2 - dis;
								y1 = y2 - dis;
							}
						}else if(resizerEl.classList.contains("l-r")){
							x2 += deltaX;

							x2 = x2 < x1 ? x1 : x2;
							x2 = x2 > width ? width : x2;

							if(isCircle){
								y2 += deltaX;

								y2 = y2 < y1 ? y1 : y2;
								y2 = y2 > height ? height : y2;

								var dis = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
								x2 = x1 + dis;
								y2 = y1 + dis;
							}
						}else if(resizerEl.classList.contains("l-b")){
							y2 += deltaY;

							y2 = y2 < y1 ? y1 : y2;
							y2 = y2 > height ? height : y2;

							if(isCircle){
								x2 += deltaY;

								x2 = x2 < x1 ? x1 : x2;
								x2 = x2 > width ? width : x2;

								var dis = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
								x2 = x1 + dis;
								y2 = y1 + dis;
							}
						}
					}

					annoEl.style.left = (x1 / width * 100) + "%";
					annoEl.style.top = (y1 / height * 100)  + "%";
					annoEl.style.width = (x2 - x1) + "px";
					annoEl.style.height = (y2 - y1) + "px";

					if(isCircle){
						annoEl.style.borderRadius = (x2 - x1) + "px";
					}

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
				var annoEl = null;
				if(view._dragEl.classList.contains("resizer")){
					var resizerEl = view._dragEl;
					annoEl = d.closest(view._dragEl, ".anno");
				}else if(view._dragEl.classList.contains("anno")){
					annoEl = view._dragEl;
				}

				updateAnnotation.call(view, annoEl);

				view._dragEl = null;
				view._lastPos = null;
			}
		},

		"keyup": function(evt){
			var view = this;
			// delete key
			if(evt.keyCode == 8){
				var annoEl = d.first(view.el, ".anno:focus");
				deleteAnnotation.call(view, annoEl);
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

function isPlay(){
	var view = this;
	return !view._videoEl.paused;
}
// --------- /controls ---------//

// --------- annotation ---------//
function generateAnnotation(time, type){
	var view = this;
	var x = Math.random();
	var y = Math.random();
	var w = Math.random() * (1 - x);
	var h = Math.random() * (1 - y);
	var id = utils.random();

	var obj = {
		id: id,
		type: type
	}

	obj.start = {
 		x: x,
 		y: y,
 		time: time,
		color: color.random()
	};

	if(type == "circle"){
		obj.start.r = Math.min(w, h);
	}else{
		obj.start.w = w;
		obj.start.h = h;
	}

	return obj;
}

function addAnnotation(newAnno){
	var view = this;
	_annotations.push(newAnno);
}

function updateAnnotation(annoEl){
	var view = this;
	var width = view._videoEl.clientWidth;
	var height = view._videoEl.clientHeight;
	var newAnno = {
		id: annoEl.getAttribute("data-anno-id"),
	};
	
	var index = getIndexByEl.call(view, annoEl);
	var anno = _annotations[index];

	
	newAnno = Object.assign(newAnno, anno);
	var ox = annoEl.offsetLeft;
	var oy = annoEl.offsetTop;
	var ow = annoEl.offsetWidth;
	var oh = annoEl.offsetHeight;
	var frame = newAnno.start;
	frame.x = ox / width;
	frame.y = oy / height;
	if(newAnno.type == "circle"){
		frame.r = ow / width;
	}else{
		frame.w = annoEl.offsetWidth / width;
		frame.h = annoEl.offsetHeight / height;
	}
	_annotations.splice(index, 1, newAnno);
}

function deleteAnnotation(annoEl){
	var view = this;
	if(!annoEl){
		return ;
	}
	var id = annoEl.getAttribute("data-anno-id");
	var index = getIndexByEl.call(view, annoEl);
	_annotations.splice(index, 1);
	d.remove(annoEl);
}


function getIndexByEl(annoEl){
	var view = this;
	var id = annoEl.getAttribute("data-anno-id");
	for(var i = 0; i < _annotations.length; i++){
		var a = _annotations[i];
		if(a.id == id){
			return i;
		}
	}
	return -1;
}

function getAnnoByEl(annoEl){
	var view = this;
	return _annotations[getIndexByEl.call(view, annoEl)];
}

function getValidAnnotations(time){
	var view = this;
	var validAnnos = [];
	for(var i = 0; i < _annotations.length; i++){
		var a = _annotations[i];
		var startFrame = a.start;
		var endFrame = a.end;
		if(endFrame){
			if(startFrame.time <= time && endFrame.time >= time){
				validAnnos.push(a);
			}
		}else{
			if(startFrame.time <= time && startFrame.time + 1 >= time){
				validAnnos.push(a);
			}
		}
	}

	return validAnnos;
}

function clearAnnotation(){
	var view = this;
	d.empty(d.first(view.el, ".annos-con"));
}

function showAnnotation(anno){
	var view = this;
	var conEl = d.first(view.el, ".annos-con");
	var divEl = render("HomeView-annotation", anno);
	var width = conEl.clientWidth;
	var height = conEl.clientHeight;
	d.append(conEl, divEl);
	divEl = d.first(conEl, ".anno:last-child");

	var frame = anno.start;

	// position and size
	divEl.style.left = (frame.x * 100) + "%";
	divEl.style.top = (frame.y * 100) + "%";
	divEl.style.color = frame.color;
	divEl.style.backgroundColor = color.fade(frame.color, .3);

	if(anno.type == "circle"){
		divEl.classList.add("circle");
		var r = Math.min(width, height);
		divEl.style.width = (frame.r * r) + "px";
		divEl.style.height = (frame.r * r) + "px";
		divEl.style.borderRadius = (frame.r * r) + "px";
	}else{
		divEl.classList.add("rectangle");
		divEl.style.width = (frame.w * width) + "px";
		divEl.style.height = (frame.h * height) + "px";
	}

}

// --------- /annotation ---------//
