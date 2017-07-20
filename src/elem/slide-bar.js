var d = mvdom;

document.addEventListener("DOMContentLoaded", function(event) {

	var _dragItem, _lastPageX, _currentBarWidth, _startValue;

	d.on(document, "mousedown", ".slide-bar .slide-item", function(evt){
		_dragItem = evt.selectTarget;
		_lastPageX = evt.pageX;
		_currentBarWidth = d.closest(_dragItem, ".slide-bar").clientWidth;
		// set init value
		_startValue = getOffset(_dragItem).left + _dragItem.clientWidth / 2 - getOffset(d.closest(_dragItem, ".slide-bar")).left;

	});

	d.on(document, "mousemove", function(evt){
		if(_dragItem && _dragItem.classList.contains("slide-item")){
			var deltaX = evt.pageX - _lastPageX + _startValue;
			var value = deltaX / _currentBarWidth * 100;
			var slideBarEl = d.closest(_dragItem, ".slide-bar");
			change(slideBarEl, value, true);
		}
	});

	d.on(document, "mouseup", function(evt){
		if(_dragItem && _dragItem.classList.contains("slide-item")){
			var deltaX = evt.pageX - _lastPageX + _startValue;
			var value = deltaX / _currentBarWidth * 100;
			var slideBarEl = d.closest(_dragItem, ".slide-bar");
			change(slideBarEl, value);
			_dragItem = null;
		}
	});
});

function change(slideBarEl, value, changing){
	value = isNaN(value * 1) ? 0 : value * 1;
	value = value > 100 ? 100 : value;
	value = value < 0 ? 0 : value;
	value = parseInt(value);

	var item = d.first(slideBarEl, ".slide-item");
	item.style.left = value + "%";

	var inputEl = d.next(slideBarEl, ".slide-input");
	if(inputEl){
		inputEl.value = value;
	}

	var valueEl = d.first(slideBarEl, ".value");
	if(valueEl){
		valueEl.innerHTML = value + "%";
	}

	if(changing){
		d.trigger(slideBarEl, "changing", {detail:value});
	}else{
		d.trigger(slideBarEl, "change", {detail:value});
	}
}

function getOffset(el){
	var offset = {left: el.offsetLeft, top: el.offsetTop};
	if(el.offsetParent != null){
		var topOffset = getOffset(el.offsetParent);
		offset.left += topOffset.left;
		offset.top += topOffset.top;
	}
	return offset; 
}


