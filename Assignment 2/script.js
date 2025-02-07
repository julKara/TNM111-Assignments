// Press clg to make log
console.log('Welcome!');

document.addEventListener("DOMContentLoaded", function() {
    // Get references to the file input and canvas elements
    const fileInput = document.getElementById("fileInput");
    const canvas = document.getElementById("scatterPlot");
    const ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 800;
    let dataPoints = []; // Array to store the data points from CSV
    let selectedPoint = null; // Variable to store the selected point

    // Event listener for redaing CSV-files
    fileInput.addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) { // Test i ffile is valid
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                processCSV(content); // Function to extract data points from CSV
            };
            reader.readAsText(file);
        }
    });

    // Function to extract data points from CSV
    function processCSV(data) {
        const rows = data.split("\n").slice(1); // Ignore header row
        dataPoints = rows.map(row => {
            const [x, y, category] = row.split(",").map(item => item.trim());
            return { x: parseFloat(x), y: parseFloat(y), category };
        });
        drawScatterPlot();
    }

    // Function to draw the scatter plot
    function drawScatterPlot() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        dataPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x * 10, canvas.height - point.y * 10, 5, 0, Math.PI * 2); // Draw point
            ctx.fillStyle = "blue";
            ctx.fill();
            ctx.stroke();
        });
    }

    // Event listener for selecting a data point on canvas
    canvas.addEventListener("click", function(event) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        dataPoints.forEach(point => {
            const px = point.x * 10;
            const py = canvas.height - point.y * 10;
            if (Math.hypot(px - clickX, py - clickY) < 6) { // Check if point is clicked
                selectedPoint = selectedPoint === point ? null : point;
                highlightPoint(selectedPoint);
            }
        });
    });

    // Function to highlight the selected point
    function highlightPoint(point) {
        drawScatterPlot(); // Redraw the scatter plot to clear previous highlight
        if (point) {
            ctx.beginPath();
            ctx.arc(point.x * 10, canvas.height - point.y * 10, 7, 0, Math.PI * 2);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
});
