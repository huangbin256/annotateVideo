var d = window.mvdom;
var utils = require("js-app/utils.js");
var render = require("js-app/render.js").render;
var color = require("js-app/color.js");

/*
 * need the annotation.tmpl to render anotation
*/

module.exports = VideoAnnotation;
var annotationHub = d.hub("annotationHub");

function VideoAnnotation(videoConEl){
	// annotation: {id: 1, time: 1, start: {x: 1, y: 1}, end: {x: 1, y: 1}}
	this._annotations = [];
	this._videoConEl = videoConEl;
	this._videoEl = d.first(videoConEl, "video");
}


VideoAnnotation.prototype.getAnnotations = function(){
	return Object.assign([], this._annotations);
}

VideoAnnotation.prototype.getAnnotation = function(annoId){
	for(var i = 0; i < this._annotations.length; i++){
		var anno = this._annotations[i];
		if(anno.id == annoId){
			return Object.assign({}, anno);
		}
	}
	return null;
}

VideoAnnotation.prototype.generateAnnotation = function(time, type){
	var self = this;
	var width = self._videoEl.offsetWidth;
	var height = self._videoEl.offsetHeight;
	var x = parseInt(0.3 * width);
	var y = parseInt(0.3 * height);
	var w = parseInt(0.4 * width);
	var h = parseInt(0.4 * height);
	var id = utils.random();
	var c = color.random();

	var obj = {
		id: id,
		type: type,
		frames: []
	}

	obj.frames[0] = {
		x: x,
		y: y,
		time: time,
		color: c
	};

	obj.frames[1] = {
		x: x,
		y: y,
		time: self._videoEl.duration,
		color: c
	};

	if(type == "circle"){
		obj.frames[0].r = Math.min(w, h);
		obj.frames[1].r = Math.min(w, h);
	}else{
		obj.frames[0].w = w;
		obj.frames[0].h = h;
		obj.frames[1].w = w;
		obj.frames[1].h = h;
	}
	return obj;
}

VideoAnnotation.prototype.addAnnotation = function(newAnno){
	var self = this;
	self._annotations.push(newAnno);
	annotationHub.pub("CHANGE", self.getAnnotations());
}

VideoAnnotation.prototype.updateAnnotation = function(annoEl){
	var self = this;
	var width = self._videoEl.clientWidth;
	var height = self._videoEl.clientHeight;
	var newAnno = {
		id: annoEl.getAttribute("data-anno-id"),
	};
	
	var index = getIndexByEl.call(self, annoEl);
	var anno = self._annotations[index];

	
	newAnno = Object.assign(newAnno, anno);
	var ox = annoEl.offsetLeft;
	var oy = annoEl.offsetTop;
	var ow = annoEl.offsetWidth;
	var oh = annoEl.offsetHeight;
	var frame = Object.assign({}, newAnno.frames[0]);
	frame.x = ox;
	frame.y = oy;
	if(newAnno.type == "circle"){
		frame.r = ow;
	}else{
		frame.w = annoEl.offsetWidth;
		frame.h = annoEl.offsetHeight;
	}
	frame.time = self._videoEl.currentTime;
	saveFrame.call(self, newAnno, frame);
	self._annotations.splice(index, 1, newAnno);
	
	annotationHub.pub("CHANGE", self.getAnnotations());
}


VideoAnnotation.prototype.endAnnotation = function(annoEl){
	var self = this;
	if(!annoEl){
		return ;
	}

	var id = annoEl.getAttribute("data-anno-id");
	var endTime = self._videoEl.currentTime;
	var index = getIndexByEl.call(self, annoEl);
	var anno = self._annotations[index];

	var frames = anno.frames;
	var newFrames = [];
	for(var i = 0; i < frames.length; i++){
		var f = frames[i];
		if(f.time < endTime){
			newFrames.push(f);
		}
	}

	newFrames.push(Object.assign({}, frames[frames.length - 1], {time: endTime}));
	anno.frames = newFrames;
	self._annotations.splice(index, 1, anno);
	d.remove(annoEl);

	annotationHub.pub("CHANGE", self.getAnnotations());
}

VideoAnnotation.prototype.deleteAnnotation = function(annoEl){
	var self = this;
	if(!annoEl){
		return ;
	}
	var id = annoEl.getAttribute("data-anno-id");
	var index = getIndexByEl.call(self, annoEl);
	self._annotations.splice(index, 1);
	d.remove(annoEl);
	annotationHub.pub("CHANGE", self.getAnnotations());
}

VideoAnnotation.prototype.refreshAnnotations = function(){
	var self = this;
	var validAnnos = getValidAnnotations.call(self, self._videoEl.currentTime);
	clearInvalidAnnotation.call(self, validAnnos);
	if(validAnnos.length > 0){
		for(var i = 0; i < validAnnos.length; i++){
			var anno = validAnnos[i];
			var annoEl = d.first(self._videoConEl, ".anno[data-anno-id='"+anno.id+"']");
			self.showAnnotation(anno, annoEl);
		}
	}
}

VideoAnnotation.prototype.showAnnotation = function(anno, annoEl){
	var self = this;
	if(!annoEl){
		var conEl = d.first(self._videoConEl, ".annos-con");
		var divEl = render("annotation", anno);
		var width = conEl.clientWidth;
		var height = conEl.clientHeight;
		d.append(conEl, divEl);
		annoEl = d.first(conEl, ".anno:last-child");
	}

	var frame = getSnapshotByTime.call(self, anno, self._videoEl.currentTime);

	// position and size
	annoEl.style.left = frame.x + "px";
	annoEl.style.top = frame.y + "px";
	annoEl.style.color = frame.color;
	annoEl.style.boxShadow = "0 0 0 1px " + frame.color;
	annoEl.style.backgroundColor = color.fade(frame.color, .3);

	if(anno.type == "circle"){
		annoEl.classList.add("circle");
		annoEl.style.width = frame.r + "px";
		annoEl.style.height = frame.r + "px";
		annoEl.style.borderRadius = frame.r + "px";
	}else{
		annoEl.classList.add("rectangle");
		annoEl.style.width = frame.w + "px";
		annoEl.style.height = frame.h + "px";
	}
}

function clearInvalidAnnotation(validAnnos){
	var self = this;
	var obj = {};
	for(var i = 0; i < validAnnos.length; i++){
		var validAnno = validAnnos[i];
		obj[validAnno.id] = validAnnos;
	}

	d.all(self._videoConEl, ".annos-con .anno").forEach(function(annoEl){
		var id = annoEl.getAttribute("data-anno-id");
		if(!obj[id]){
			d.remove(annoEl);
		}
	});
}

function getValidAnnotations(time){
	var self = this;
	var validAnnos = [];
	for(var i = 0; i < self._annotations.length; i++){
		var a = self._annotations[i];
		var startFrame = a.frames[0];
		var endFrame = a.frames[a.frames.length - 1];
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

function getIndexByEl(annoEl){
	var self = this;
	var id = annoEl.getAttribute("data-anno-id");
	for(var i = 0; i < self._annotations.length; i++){
		var a = self._annotations[i];
		if(a.id == id){
			return i;
		}
	}
	return -1;
}

function getAnnoByEl(annoEl){
	var self = this;
	return self._annotations[getIndexByEl.call(self, annoEl)];
}

// for snapshot function
function getSnapshotByTime(anno, time){
	var self = this;
	if(isNaN(time) || time < 0){
		return null;
	}

	var frames = anno.frames;
	for(var i = 0; i < frames.length - 1; i++){
		var startFrame = frames[i];
		var endFrame = frames[i + 1];

		if(endFrame.time >= time && startFrame.time <= time){
			var snapshot = {};
			var duration = endFrame.time - startFrame.time;
			snapshot.time = time;
			var timeVar = time - startFrame.time;
			snapshot.x = getValueByTime.call(self, startFrame.x, endFrame.x, duration, timeVar);
			snapshot.y = getValueByTime.call(self, startFrame.y, endFrame.y, duration, timeVar);
			snapshot.color = color.linear(startFrame.color, endFrame.color, timeVar / duration);

			if(anno.type == "circle"){
				snapshot.r = getValueByTime.call(self, startFrame.r, endFrame.r, duration, timeVar);
			}else{
				snapshot.w = getValueByTime.call(self, startFrame.w, endFrame.w, duration, timeVar);
				snapshot.h = getValueByTime.call(self, startFrame.h, endFrame.h, duration, timeVar);
			}
			return snapshot;
		}
	}
	
	return null;
}

// for linear function
function getValueByTime(start, end, duration, time){
	var ratio = time / duration;
	return start + (end - start) * ratio;
}

function saveFrame(anno, frame){
	var self = this;
	if(!anno || !anno.frames){
		return ;
	}

	var frames = anno.frames;
	for(var i = 0; i < frames.length; i++){
		if(frames[i].time == frame.time){
			frames.splice(i, 1, frame);
			break;
		}else if(frames[i].time > frame.time){
			frames.splice(i, 0 , frame);
			break;
		}	
	}
}
