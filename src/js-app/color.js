module.exports = {
	gradient: gradient,
	rgb: colorRgb,
	hex: colorHex,
	random: random,
	fade: fade,
	linear: linear
};

var COLOR_REG = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;

function random(pattern){
	pattern = pattern || "hex";
	var arr = [];
	for(var i = 0; i < 3; i++){
		arr.push(Math.round(Math.random() * 255));
	}
	var color = "rgb("+arr.join(",") + ")";
	if("rgb".toLowerCase() != pattern){
		var c = colorRgb(color);
		return c;
	}

	return color;

}

function fade(color, alpha){
	var col = colorRgb(color);
	var arrColor = col.replace(/(?:\(|\)|rgb|RGB)*/g,"").split(",");
	return "rgba("+arrColor[0]+", "+arrColor[1]+", "+arrColor[2]+", "+alpha+")";
}

function linear(startColor, endColor, ratio){
	var startRGB = colorRgbArr(startColor);
	var endRGB = colorRgbArr(endColor);
	var startR = startRGB[0];
	var startG = startRGB[1];
	var startB = startRGB[2];
	var endR = endRGB[0];
	var endG = endRGB[1];
	var endB = endRGB[2];
	var sR = endR-startR;
	var sG = endG-startG;
	var sB = endB-startB;

	var rgbColor = 'rgb('+parseInt((sR*ratio+startR))+','+parseInt((sG*ratio+startG))+','+parseInt((sB*ratio+startB))+')';
	return rgbColor;
}

// the color can be hex or rgb, step is between 0 and 1
function gradient(startColor, endColor, step){
	var startRGB = colorRgbArr(startColor);
	var startR = startRGB[0];
	var startG = startRGB[1];
	var startB = startRGB[2];
	var endRGB = colorRgbArr(endColor);
	var endR = endRGB[0];
	var endG = endRGB[1];
	var endB = endRGB[2];
	var sR = (endR-startR) / step;
	var sG = (endG-startG) / step;
	var sB = (endB-startB) / step;
	var colorArr = [];
	for(var i = 0; i <= step; i++){
		var hex = colorHex('rgb('+parseInt((sR*i+startR))+','+parseInt((sG*i+startG))+','+parseInt((sB*i+startB))+')');
		colorArr.push(hex);
	}
	return colorArr;
}

// the value can be #fff or #ffffff
function colorRgb(sColor){
	var sColor = sColor.toLowerCase();
	if(sColor && COLOR_REG.test(sColor)){
		if(sColor.length === 4){
			var sColorNew = "#";
			for(var i=1; i<4; i+=1){
				sColorNew += sColor.slice(i,i+1).concat(sColor.slice(i,i+1));
			}
			sColor = sColorNew;
		}
		var sColorChange = [];
		for(var i=1; i<7; i+=2){
			sColorChange.push(parseInt("0x"+sColor.slice(i,i+2)));
		}
		return sColorChange;
	}else{
		return sColor;
	}
}

// the value can be rgb(255, 255, 255), #fff or #ffffff
function colorHex(rgb){
	var colorRgb = rgb;
	if(/^(rgb|RGB)/.test(colorRgb)){
		var aColor = colorRgb.replace(/(?:\(|\)|rgb|RGB)*/g,"").split(",");
		var strHex = "#";
		for(var i=0; i<aColor.length; i++){
			var hex = Number(aColor[i]).toString(16);
			hex = hex<10 ? 0+''+hex :hex;
			if(hex === "0"){
				hex += hex;
			}
			strHex += hex;
		}
		if(strHex.length !== 7){
			strHex = colorRgb;
		}
		return strHex;
	}else if(COLOR_REG.test(colorRgb)){
		var aNum = colorRgb.replace(/#/,"").split("");
		if(aNum.length === 6){
			return colorRgb;
		}else if(aNum.length === 3){
			var numHex = "#";
			for(var i = 0; i < aNum.length; i+=1){
				numHex += (aNum[i] + aNum[i]);
			}
			return numHex;
		}
	}else{
		return colorRgb;
	}
}

function colorRgbArr(c){
	var cRgb = colorRgb(c);
	var arr = cRgb.replace(/(?:\(|\)|rgb|RGB)*/g,"").split(",");
	return arr;
}