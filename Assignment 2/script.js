// Shoutout to: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects

// Script starts by calling upon handleFileUpload when a CSV file is choosen in fileInput 
document.getElementById('fileInput').addEventListener('change', handleFileUpload);

/******************** Global variables ********************/

let data = [];  // Stores parsed input from CSV
let categories = new Set(); // Contains categories from datapoints
let canvas = document.getElementById('scatterPlot');    // Canvas from index.html
let ctx = canvas.getContext('2d');  // 2D Content from canvas

let selectedPoint = null; // Selected origin point when left-clicking
let quadrantMode = false; // True if quadrant mode is active
let neighborMode = false; // True if nearest neighbors are highlighted
let nearestNeighbors = []; // Stores nearest neighbors to rightclick selected point

// Canvas size
canvas.width = 600;
canvas.height = 600;

// Shapes and colors
const shapes = ["circle", "square", "triangle", "diamond", "cross"];
const colors = ["red", "blue", "green", "orange", "purple"];    // Default colors
const quadrantColors = ["Cyan", "GreenYellow", "OrangeRed", "Fuchsia"]; // "Stronger colors"
const neighborColor = "yellow"; // Color for highlighting nearest neighbors

// Events listeners for interacting with canvas (Scatterplot)
canvas.addEventListener('click', handleCanvasClick);    // Left-click
canvas.addEventListener('contextmenu', handleRightClick);   // Right-click

/*********************************************************/



/******************** Functions for creating the Scatterplot ********************/

// Handles CVS-upload and parsing
function handleFileUpload(event) {
    let file = event.target.files[0];   // Get selected file
    if (!file) return;  // Check if file is valid

    let reader = new FileReader();
    reader.onload = function (e) {  // e is the content of CSV
        let lines = e.target.result.split('\n').filter(line => line.trim() !== '');     // Read and clean up lines (split makes it to array of each row)
        
        // Clear data for reload
        data = [];
        categories.clear();
        selectedPoint = null;
        quadrantMode = false;
        neighborMode = false;
        nearestNeighbors = [];

        // Parse each line into x, y, and category, spperated by ","
        lines.forEach(line => {
            let [x, y, category] = line.split(',').map(item => item.trim());
            if (!isNaN(x) && !isNaN(y) && category) {   // Check if input is valid (NaN = Not a Number)
                data.push({ x: parseFloat(x), y: parseFloat(y), category });    // Add to data to array last: x, y and chategory per line
                categories.add(category);   // Add category
            }
        });

        drawScatterPlot();  // Call function
    };

    reader.readAsText(file);    // Read file as text
}

// Draws the entire scatter plot (including axes, points and legend)
function drawScatterPlot() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // Clear 2D content upon redraw

    let xValues = data.map(d => d.x);   // Gets all xValues (first element of map)
    let yValues = data.map(d => d.y);   // Gets all yValues (second element of map)

    // Determine min/max values for scaling (needed for axises and points)
    let xMin = Math.min(...xValues);    // Go through all xValues and get the min
    let xMax = Math.max(...xValues);
    let yMin = Math.min(...yValues);
    let yMax = Math.max(...yValues);

    // Call upon all draw-functions
    drawAxes(xMin, xMax, yMin, yMax);
    drawPoints(xMin, xMax, yMin, yMax);
    drawLegend();
}

function drawAxes(xMin, xMax, yMin, yMax) {
    
    // Some "css"
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    // Draw X-axis, inspo from provided link (https://www.w3schools.com/html/html5_canvas.asp)
    // 50px padding so that the axis is not touching the edges of the canvas
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 50);
    ctx.lineTo(canvas.width - 50, canvas.height - 50);
    ctx.stroke();

    // Draw Y-axis, inspo from provided link
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 50);
    ctx.lineTo(50, 50);
    ctx.stroke();

    // Text style for axis labels
    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';

    // Draw labels (ticks??) for the X-axis (bottom numbers)
    for (let i = 0; i <= 4; i++) {
        let value = xMin + (i / 4) * (xMax - xMin); // Calculate the value at tick mark
        let xPos = 50 + (i / 4) * (canvas.width - 100); // Calculate the position on the canvas
        ctx.fillText(value.toFixed(2), xPos, canvas.height - 30);   // Draw the text below the axis line (fillText draws string at coordintes [text, x, y])
    }

    // Draw labels (ticks??) for the Y-axis
    for (let i = 0; i <= 4; i++) {
        let value = yMin + (i / 4) * (yMax - yMin);
        let yPos = canvas.height - 50 - (i / 4) * (canvas.height - 100);
        ctx.fillText(value.toFixed(2), 10, yPos);
    }
}

// Draws all data points on the scatter plot
function drawPoints(xMin, xMax, yMin, yMax) {
    let categoryList = Array.from(categories);  // Make categories to array

    // Create a mapping of categories to specific shapes and colors
    // Each category is assigned a shape and color from predefined arrays
    let categoryMap = categoryList.reduce((acc, category, index) => {   // reduce goes through the whole array passing on the previous return value to the next
        acc[category] = { 
            shape: shapes[index % shapes.length],  // Assign shape
            color: colors[index % colors.length]  // Assign color
        };
        return acc;
    }, {});

    data.forEach(point => {
        // Normalize the x-coordinate based on the data range and scale it to canvas size
        let x = 50 + ((point.x - xMin) / (xMax - xMin)) * (canvas.width - 100);
        // Normalize the y-coordinate (inverted because canvas y-axis starts at the top)
        let y = canvas.height - 50 - ((point.y - yMin) / (yMax - yMin)) * (canvas.height - 100);
        
        // Set the color to point based on the category
        let color = categoryMap[point.category].color;

        // If quadrant mode is active and a point is selected, recolor based on the quadrant
        if (quadrantMode && selectedPoint) {
            let quadrant = getQuadrant(point, selectedPoint);   // Quad 0-3
            color = quadrantColors[quadrant];   // Assign quadrant-based color
        }

        // If neighbor mode is active and this point is in the nearest neighbors list, highlight it
        if (neighborMode && nearestNeighbors.includes(point)) {
            color = neighborColor;
        }

        // Draw the shape for the point with the assigned category, color and selection
        drawShape(ctx, x, y, categoryMap[point.category], color, point === selectedPoint);
    });
}

// Draws the legend dephending on category (simlar to drawPoints)
function drawLegend() {
    let legendContainer = document.getElementById('legend');    // Get legend container from HTML
    legendContainer.innerHTML = ''; // Clear upon redraw
    let categoryList = Array.from(categories);  // Make array from categories

    // Similar to drawPoints(right above), go through all categories and assign color and shape
    let categoryMap = categoryList.reduce((acc, category, index) => {
        acc[category] = {
            shape: shapes[index % shapes.length],   // Assign shape
            color: colors[index % colors.length]    // Assign color
        };
        return acc;
    }, {});

    categoryList.forEach(category => {

        // Create canvas for legend icon
        let legendIcon = document.createElement('canvas');
        legendIcon.width = 20;
        legendIcon.height = 20;
        let legendCtx = legendIcon.getContext('2d');    // Get 2D content for legend

        // Draw the shape for the point with the assigned category and color (selection is always false in legend)
        drawShape(legendCtx, 10, 10, categoryMap[category], categoryMap[category].color, false);

        // Make text-element
        let text = document.createElement('span');
        text.textContent = ` ${category}`;
        text.style.fontSize = "14px";
        text.style.marginLeft = "5px";

        // Make conainer for text-element
        let container = document.createElement('div');
        container.style.display = "flex";
        container.style.alignItems = "center";
        // Apphend item and text to container
        container.appendChild(legendIcon);
        container.appendChild(text);

        // Apphend container to legend
        legendContainer.appendChild(container);
    });
}

// Draws different shapes based on the category type
function drawShape(ctx, x, y, category, color, isSelected) {
    ctx.fillStyle = color;  // Colors inside of shape
    ctx.strokeStyle = isSelected ? "black" : color; // Highlight selected point by color
    ctx.lineWidth = isSelected ? 3 : 2; // Highlight selected point by linewidth

    ctx.beginPath();
    switch (category.shape) {   // All shapes follows the same outline
        case "circle":
            ctx.arc(x, y, 5, 0, Math.PI * 2);   // Adds arc to current subpath (makes circle)
            ctx.fill();
            if (isSelected) ctx.stroke();   // Add stroke (outline) if selected
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

// Determines which quadrant a point is in relative to the selected point
function getQuadrant(point, origin) {
    if (point.x >= origin.x && point.y >= origin.y) return 0; // Q1
    if (point.x < origin.x && point.y >= origin.y) return 1; // Q2
    if (point.x < origin.x && point.y < origin.y) return 2; // Q3
    return 3; // Q4
}

/******************** Functions for interacting with the Scatterplot ********************/

// Redraw scatterplot in quadrant mode upon left-click close enoough to point
function handleCanvasClick(event) {
    let rect = canvas.getBoundingClientRect();  // Get info from canvas, like position in relation to viewport origin (https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
    
    // Calculate the click position relative to the canvas
    let clickX = event.clientX - rect.left; // x-coord of where we clicked, minus pos of start of canvas
    let clickY = event.clientY - rect.top;

    // Get min and max to redraw scatterplot
    let xMin = Math.min(...data.map(d => d.x));
    let xMax = Math.max(...data.map(d => d.x));
    let yMin = Math.min(...data.map(d => d.y));
    let yMax = Math.max(...data.map(d => d.y));

    // Loop through all data points to check if any was clicked
    data.forEach(point => {
        
        // Convert the data points coordinates into canvas coordinates
        let x = 50 + ((point.x - xMin) / (xMax - xMin)) * (canvas.width - 100);
        let y = canvas.height - 50 - ((point.y - yMin) / (yMax - yMin)) * (canvas.height - 100);

        // Check if the click is close enough to the point (within 7 pixels)
        if (Math.hypot(x - clickX, y - clickY) < 7) {   // hypot is distance
            
            if (selectedPoint === point) {   // If the clicked point was already selected, deselect it and disable quadrant mode
                selectedPoint = null;
                quadrantMode = false;
            } else {     // Otherwise, select the new point and enable quadrant mode
                selectedPoint = point;
                quadrantMode = true;
            }

            // Redraw scatter plot
            drawScatterPlot();
        }
    });
}

function handleRightClick(event) {
    event.preventDefault(); // When clicking inside canvas, regular right-click does not happen

    // Same as in handleCanvasClick (right above)
    let rect = canvas.getBoundingClientRect();
    let clickX = event.clientX - rect.left;
    let clickY = event.clientY - rect.top;

    // Find the closest data point to the right-clicked location
    let clickedPoint = data.find(point => {

        // Convert the data point's coordinates into canvas coordinates
        let x = 50 + ((point.x - Math.min(...data.map(d => d.x))) / (Math.max(...data.map(d => d.x)) - Math.min(...data.map(d => d.x)))) * (canvas.width - 100);
        let y = canvas.height - 50 - ((point.y - Math.min(...data.map(d => d.y))) / (Math.max(...data.map(d => d.y)) - Math.min(...data.map(d => d.y)))) * (canvas.height - 100);

        // Check if the click is close enough to the point (within 7 pixels)
        return Math.hypot(x - clickX, y - clickY) < 7;
    });

    // If no point was clicked, return
    if (!clickedPoint) return;

    // If the clicked point is already selected and neighbor mode is active, disable neighbor mode
    if (selectedPoint === clickedPoint && neighborMode) {
        neighborMode = false;
        nearestNeighbors = [];
    } else { // Otherwise, enable neighbor mode and find the nearest neighbors of the clicked point
        neighborMode = true;
        nearestNeighbors = findNearestNeighbors(clickedPoint);
    }

    // Redraw scatterplot
    drawScatterPlot();
}

// Finds the 5 nearest neighbors to a selected point
function findNearestNeighbors(point) {
    return [...data]    // Return 5 closest points
        .filter(p => p !== point)
        .sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y))
        .slice(0, 5);
}
