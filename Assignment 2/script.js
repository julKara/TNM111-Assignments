document.getElementById('fileInput').addEventListener('change', handleFileUpload);

let data = [];
let categories = new Set();
let canvas = document.getElementById('scatterPlot');
let ctx = canvas.getContext('2d');
let selectedPoint = null; // Stores the selected origin point
let quadrantMode = false; // Indicates if quadrant mode is active

canvas.width = 600;
canvas.height = 600;

const shapes = ["circle", "square", "triangle", "diamond", "cross"];
const colors = ["red", "blue", "green", "orange", "purple"];
const quadrantColors = ["blue", "green", "orange", "purple"]; // Colors for quadrants

canvas.addEventListener('click', handleCanvasClick);

function handleFileUpload(event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        let lines = e.target.result.split('\n').filter(line => line.trim() !== '');
        data = [];
        categories.clear();
        selectedPoint = null;
        quadrantMode = false;

        lines.forEach(line => {
            let [x, y, category] = line.split(',').map(item => item.trim());
            if (!isNaN(x) && !isNaN(y) && category) {
                data.push({ x: parseFloat(x), y: parseFloat(y), category });
                categories.add(category);
            }
        });

        drawScatterPlot();
    };

    reader.readAsText(file);
}

function drawScatterPlot() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let xValues = data.map(d => d.x);
    let yValues = data.map(d => d.y);

    let xMin = Math.min(...xValues);
    let xMax = Math.max(...xValues);
    let yMin = Math.min(...yValues);
    let yMax = Math.max(...yValues);

    drawAxes(xMin, xMax, yMin, yMax);
    drawPoints(xMin, xMax, yMin, yMax);
    drawLegend(); // ✅ Re-added this function to restore the legend
}

function drawLegend() {
    let legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = ''; // Clear previous legend

    let categoryList = Array.from(categories);
    let categoryMap = categoryList.reduce((acc, category, index) => {
        acc[category] = {
            shape: shapes[index % shapes.length],
            color: colors[index % colors.length]
        };
        return acc;
    }, {});

    categoryList.forEach(category => {
        let legendItem = document.createElement('canvas');
        legendItem.width = 20;
        legendItem.height = 20;
        let legendCtx = legendItem.getContext('2d');

        // Draw shape in correct color
        drawShape(legendCtx, 10, 10, categoryMap[category], categoryMap[category].color, false);

        let text = document.createElement('span');
        text.textContent = ` ${category}`;
        text.style.fontSize = "14px";
        text.style.marginLeft = "5px";

        let container = document.createElement('div');
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.appendChild(legendItem);
        container.appendChild(text);

        legendContainer.appendChild(container);
    });
}

function drawShape(ctx, x, y, category, color, isSelected) {
    ctx.fillStyle = color;
    ctx.strokeStyle = isSelected ? "black" : color; // Highlight selected point
    ctx.lineWidth = isSelected ? 3 : 2;

    ctx.beginPath();
    switch (category.shape) {
        case "circle":
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            if (isSelected) ctx.stroke();
            break;
        case "square":
            ctx.fillRect(x - 5, y - 5, 10, 10);
            if (isSelected) ctx.strokeRect(x - 6, y - 6, 12, 12);
            break;
        case "triangle":
            ctx.moveTo(x, y - 6);
            ctx.lineTo(x - 6, y + 6);
            ctx.lineTo(x + 6, y + 6);
            ctx.closePath();
            ctx.fill();
            if (isSelected) ctx.stroke();
            break;
        case "diamond":
            ctx.moveTo(x, y - 6);
            ctx.lineTo(x - 6, y);
            ctx.lineTo(x, y + 6);
            ctx.lineTo(x + 6, y);
            ctx.closePath();
            ctx.fill();
            if (isSelected) ctx.stroke();
            break;
        case "cross":
            ctx.moveTo(x - 5, y);
            ctx.lineTo(x + 5, y);
            ctx.moveTo(x, y - 5);
            ctx.lineTo(x, y + 5);
            ctx.stroke();
            break;
    }
}

function drawAxes(xMin, xMax, yMin, yMax) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 50);
    ctx.lineTo(canvas.width - 50, canvas.height - 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 50);
    ctx.lineTo(50, 50);
    ctx.stroke();

    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';

    for (let i = 0; i <= 4; i++) {
        let value = xMin + (i / 4) * (xMax - xMin);
        let xPos = 50 + (i / 4) * (canvas.width - 100);
        ctx.fillText(value.toFixed(2), xPos, canvas.height - 30);
    }

    for (let i = 0; i <= 4; i++) {
        let value = yMin + (i / 4) * (yMax - yMin);
        let yPos = canvas.height - 50 - (i / 4) * (canvas.height - 100);
        ctx.fillText(value.toFixed(2), 10, yPos);
    }
}

function drawPoints(xMin, xMax, yMin, yMax) {
    let categoryList = Array.from(categories);
    let categoryMap = categoryList.reduce((acc, category, index) => {
        acc[category] = { shape: shapes[index % shapes.length], color: colors[index % colors.length] };
        return acc;
    }, {});

    data.forEach(point => {
        let x = 50 + ((point.x - xMin) / (xMax - xMin)) * (canvas.width - 100);
        let y = canvas.height - 50 - ((point.y - yMin) / (yMax - yMin)) * (canvas.height - 100);
        let color = categoryMap[point.category].color;

        if (quadrantMode && selectedPoint) {
            let quadrant = getQuadrant(point, selectedPoint);
            color = quadrantColors[quadrant]; // Apply quadrant colors
        }

        drawShape(ctx, x, y, categoryMap[point.category], color, point === selectedPoint);
    });
}

function handleCanvasClick(event) {
    let rect = canvas.getBoundingClientRect();
    let clickX = event.clientX - rect.left;
    let clickY = event.clientY - rect.top;

    let xMin = Math.min(...data.map(d => d.x));
    let xMax = Math.max(...data.map(d => d.x));
    let yMin = Math.min(...data.map(d => d.y));
    let yMax = Math.max(...data.map(d => d.y));

    data.forEach(point => {
        let x = 50 + ((point.x - xMin) / (xMax - xMin)) * (canvas.width - 100);
        let y = canvas.height - 50 - ((point.y - yMin) / (yMax - yMin)) * (canvas.height - 100);

        if (Math.hypot(x - clickX, y - clickY) < 7) {
            if (selectedPoint === point) {
                selectedPoint = null;
                quadrantMode = false;
            } else {
                selectedPoint = point;
                quadrantMode = true;
            }
            drawScatterPlot();
        }
    });
}

function getQuadrant(point, origin) {
    if (point.x >= origin.x && point.y >= origin.y) return 0; // Q1
    if (point.x < origin.x && point.y >= origin.y) return 1; // Q2
    if (point.x < origin.x && point.y < origin.y) return 2; // Q3
    return 3; // Q4
}
