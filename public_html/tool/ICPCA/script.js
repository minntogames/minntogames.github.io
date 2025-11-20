var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var cursorPosition = null;
var tempCursorPosition = [];
var maxSavedCursorPosition = 5;

canvas.addEventListener('mousemove', function(event) {
  var rect = canvas.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;

  cursorPosition = { x: x, y: y };
  updateCursorPositionOutput();
});

canvas.addEventListener('click', function() {
  if (cursorPosition) {
    if (tempCursorPosition.length >= maxSavedCursorPosition) {
      tempCursorPosition.shift(); // 最古の保存位置を削除
    }
    tempCursorPosition.push(cursorPosition);
    updateTempCursorPositionOutput();
    updateSavedCursorPositionOutput();
  }
});

document.getElementById('resetButton').addEventListener('click', function() {
  tempCursorPosition = [];
  updateTempCursorPositionOutput();
  updateSavedCursorPositionOutput();
});

function updateCursorPositionOutput() {
  var output = document.getElementById('cursorPositionOutput');
  if (cursorPosition) {
    output.textContent = 'カーソルの位置: x=' + cursorPosition.x + ', y=' + cursorPosition.y;
  } else {
    output.textContent = 'カーソルの位置: -';
  }
}

function updateTempCursorPositionOutput() {
  var output = document.getElementById('tempCursorPositionOutput');
  output.textContent = '一時カーソル位置: ';
  for (var i = 0; i < tempCursorPosition.length; i++) {
    output.textContent += '(' + tempCursorPosition[i].x + ', ' + tempCursorPosition[i].y + ')';
    if (i !== tempCursorPosition.length - 1) {
      output.textContent += ', ';
    }
  }
}

function updateSavedCursorPositionOutput() {
  var output = document.getElementById('savedCursorPositionOutput');
  output.textContent = '保存されたカーソル位置: ';
  for (var i = 0; i < tempCursorPosition.length; i++) {
    output.textContent += '(' + tempCursorPosition[i].x + ', ' + tempCursorPosition[i].y + ')';
    if (i !== tempCursorPosition.length - 1) {
      output.textContent += ', ';
    }
  }
}

document.getElementById('imageInput').addEventListener('change', function(e) {
  var image = new Image();

  image.onload = function() {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    var imageSizeOutput = document.getElementById('imageSizeOutput');
    imageSizeOutput.textContent = '画像のサイズ: 幅=' + image.width + '、高さ=' + image.height;
  };

  image.src = URL.createObjectURL(e.target.files[0]);
});

document.getElementById('imageURLInput').addEventListener('change', function() {
  var imageURL = document.getElementById('imageURLInput').value;
  if (imageURL) {
    var image = new Image();

    image.onload = function() {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      var imageSizeOutput = document.getElementById('imageSizeOutput');
      imageSizeOutput.textContent = '画像のサイズ: 幅=' + image.width + '、高さ=' + image.height;
    };

    image.src = imageURL;
  }
});
