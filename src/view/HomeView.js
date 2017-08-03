var d = window.mvdom;
var Gtx = window.Gtx;
var d3 = window.d3;

var render = require("js-app/render.js").render;
var VideoAnnotation = require("js-app/VideoAnnotation.js");


d.register("HomeView",{
	create: function(data, config){
		return render("HomeView");
	}, 

	postDisplay: function(){
		var view = this; // best practice, set the view variable first.	
		view._videoEl = d.first("video");
		view._va = new VideoAnnotation(d.first(".video-con"));

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
			view._va.refreshAnnotations();
		});

		d.on(view._videoEl, "play", function(evt){
			checkPlay.call(view);
		});

		d.on(view._videoEl, "pause", function(evt){
			checkPlay.call(view);
		});
		// --------- /video events ---------//

		refreshAnnosItem.call(view);
	},

	events: {
		"click; .btn-add-anno":function(evt){
			var view = this;
			var type = evt.selectTarget.getAttribute("data-type");
			var videoEl = view._videoEl;
			videoEl.pause();
			var anno = view._va.generateAnnotation(videoEl.currentTime, type);
			view._va.addAnnotation(anno);
			view._va.showAnnotation(anno);
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
		},

		"click; .anno":function(evt){
			var view = this;
			selectAnno.call(view, evt.selectTarget);
			view._videoEl.pause();
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

				view._va.updateAnnotation(annoEl);

				view._dragEl = null;
				view._lastPos = null;
			}
		},

		"keyup": function(evt){
			var view = this;
			// delete key
			if(evt.keyCode == 8){
				var annoEl = d.first(view.el, ".anno.selected");
				view._va.endAnnotation(annoEl);
			}
		}
	},

	hubEvents: {
		"annotationHub; CHANGE": function(){
			var view = this;
			refreshAnnosItem.call(view);
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


function selectAnno(annoEl){
	var view = this;
	var annoConEl = d.first(view.el, ".annos-con");
	d.all(annoConEl, ".anno").forEach(function(itemEl){
		itemEl.classList.remove("selected");
	});
	annoEl.classList.add("selected");
}

function refreshAnnosItem(){
	var view = this;
	var annoItems = view._va.getAnnotations();
	var conEl = d.first(view.el, ".anno-items-con");
	d.empty(conEl);
	for(var i = 0; i < annoItems.length; i++){
		d.append(conEl, render("HomeView-anno-items", annoItems[i]));
	}
}