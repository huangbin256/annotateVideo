var d = window.mvdom;
var utils = require("js-app/utils.js");
var render = require("js-app/render.js").render;
var color = require("js-app/color.js");

/*
 * need the annotation.tmpl to render anotation
*/

module.exports = VideoAnnotation;

function VideoAnnotation(videoConEl){
	// annotation: {id: 1, time: 1, start: {x: 1, y: 1}, end: {x: 1, y: 1}}
	this._annotations = [];
	this._videoConEl = videoConEl;
	this._videoEl = d.first(videoConEl, "video");
}

VideoAnnotation.prototype.generateAnnotation = function(time, type){
	var self = this;
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

VideoAnnotation.prototype.addAnnotation = function(newAnno){
	var self = this;
	self._annotations.push(newAnno);
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
	var frame = newAnno.start;
	frame.x = ox / width;
	frame.y = oy / height;
	if(newAnno.type == "circle"){
		frame.r = ow / width;
	}else{
		frame.w = annoEl.offsetWidth / width;
		frame.h = annoEl.offsetHeight / height;
	}
	self._annotations.splice(index, 1, newAnno);
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
}

VideoAnnotation.prototype.refreshAnnotations = function(){
	var self = this;
	clearAnnotation.call(self);
	var annos = getValidAnnotations.call(self, self._videoEl.currentTime);
	if(annos.length > 0){
		for(var i = 0; i < annos.length; i++){
			self.showAnnotation(annos[i]);
		}
	}
}

VideoAnnotation.prototype.showAnnotation = function(anno){
	var self = this;
	var conEl = d.first(self._videoConEl, ".annos-con");
	var divEl = render("annotation", anno);
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

function clearAnnotation(){
	var self = this;
	d.empty(d.first(self._videoConEl, ".annos-con"));
}

function getValidAnnotations(time){
	var self = this;
	var validAnnos = [];
	for(var i = 0; i < self._annotations.length; i++){
		var a = self._annotations[i];
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
	return self._annotations[getIndexByEl.call(view, annoEl)];
}