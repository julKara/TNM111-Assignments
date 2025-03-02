
// Zoom-functionality section ************************************************************************************************************************** 
const width = 700, height = 700; // Size for SVGs

// Select the two SVG elements and set up zoom functionality
const svg1 = d3.select("#graph1")
    .attr("width", width)
    .attr("height", height);

const svg2 = d3.select("#graph2")
    .attr("width", width)
    .attr("height", height);

// Create groups for zooming inside SVGs
const svg1Group = svg1.append("g");
const svg2Group = svg2.append("g");

// Add labels to the bottom right corners of the SVGs
svg1.append("text")
    .attr("x", width - 20) // Adjust to right side
    .attr("y", height + 40) // Position at bottom
    .attr("text-anchor", "end") // Align text to the right
    .style("font-size", "30px")
    .style("fill", "red") // Dark color for visibility
    .text("Interactable");

svg2.append("text")
    .attr("x", width - 20)
    .attr("y", height + 40)
    .attr("text-anchor", "end")
    .style("font-size", "30px")
    .style("fill", "red")
    .text("Overview");


// Add zoom functionality with a wider range (0.2x to 4x)
const zoom1 = d3.zoom().scaleExtent([0.2, 4]).on("zoom", (event) => {
    svg1Group.attr("transform", event.transform);
    updateZoomIndicator("zoomIndicator1", event.transform.k);   // Sends in which zoomindicator (id) and event.tansform, aka how much zoomed in and out
});

const zoom2 = d3.zoom().scaleExtent([0.2, 4]).on("zoom", (event) => {
    svg2Group.attr("transform", event.transform);
    updateZoomIndicator("zoomIndicator2", event.transform.k);   // Sends in which zoomindicator (id) and event.tansform, aka how much zoomed in and out
});

// Apply zoom behaviors to SVGs
svg1.call(zoom1);
svg2.call(zoom2);

// Create zoom indicators at left bottom corner of SVGs (indicates current zoom)
d3.select("#graph1").append("text")
    .attr("id", "zoomIndicator1")
    .attr("x", 20)
    .attr("y", height - 20)
    .style("font-size", "16px")
    .text("Zoom: 100%");

d3.select("#graph2").append("text")
    .attr("id", "zoomIndicator2")
    .attr("x", 20)
    .attr("y", height - 20)
    .style("font-size", "16px")
    .text("Zoom: 100%");

// Updates zoom percentage display
function updateZoomIndicator(id, scale) {
    let zoomPercent = Math.round(scale * 100);
    d3.select(`#${id}`).text(`Zoom: ${zoomPercent}%`);
}

/****************************************************************************************************************************************************/

// Load tooltips
const tooltip = d3.select("body").append("div").attr("class", "tooltip");   // Tooltip for nodes
const tooltipLinks = d3.select("body").append("div").attr("class", "tooltipLink");   // Tooltip for links

// Control panel states
let linkWeightEnabled = true; // Default: link thickness is based on weight
let nodeWeightEnabled = true; // Default: node size is based on weight

// Function to update checkboxes
function updateCheckboxStates() {
    document.getElementById("toggleLinkWeight").checked = linkWeightEnabled;
    document.getElementById("toggleNodeWeight").checked = nodeWeightEnabled;
}

// Play on load of the JSON
d3.json("starwars-full-interactions-allCharacters.json").then(data => {

    // Nodes and links for each window
    let nodes1 = JSON.parse(JSON.stringify(data.nodes)); // Independent copy for svg1
    let nodes2 = JSON.parse(JSON.stringify(data.nodes)); // Independent copy for svg2
    let links1 = JSON.parse(JSON.stringify(data.links)); // Independent copy for svg1
    let links2 = JSON.parse(JSON.stringify(data.links)); // Independent copy for svg2

    // Draws the node-link diagram in svg
    function drawGraph(svgGroup, nodes, links, draggable = true) {
        
        // Set up force simulation with physics like in D3 in Depth (https://www.d3indepth.com/force-layout/ )
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.index).distance(80))   // Control edge length
            .force("charge", d3.forceManyBody().strength(-300))     // Spread nodes apart
            .force("center", d3.forceCenter(width / 2, height / 2));    // Attracts elements towards center point, in this case, center of 2 SVGs

        // Defines edges (links = number of scenes togheter) between nodes
        const link = svgGroup.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link") // Added class so you can toogle stroke-width
        .style("stroke", "#999") // Default stroke color
        .style("stroke-width", d => linkWeightEnabled ? Math.sqrt(d.value) : 2) // Link thickness toggle
        .on("mouseover", (event, d) => {   
            tooltipLinks.style("display", "block")
                .html(`Characters: ${d.source.name} & ${d.target.name} <br> Scenes together: ${d.value}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 5) + "px");
        })
        .on("mouseout", () => tooltipLinks.style("display", "none"));

        // Defines nodes (characters)
        const node = svgGroup.selectAll(".node")
            .data(nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", d => nodeWeightEnabled ? Math.sqrt(d.value) * 2 : 5) // Toggle node size based on weight
            .attr("fill", d => d.colour)
            .on("mouseover", (event, d) => {  
                tooltip.style("display", "block")
                    .html(`Name: ${d.name} <br> Scenes: ${d.value}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 5) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        // Make nodes draggable only if `draggable` is true
        if (draggable) {
            node.call(drag(simulation));
        }

        // Update positions dynamically every tick (function call) like in D3 in Depth (https://www.d3indepth.com/force-layout/ )
        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x).attr("cy", d => d.y);
        });
    }

    // Drag behavior for nodes,(https://www.d3indepth.com/interaction/ )
    function drag(simulation) {
        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        return d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded);
    }

    // Highlight the selected node in both graphs (DOESN'T WORK)
    function highlightNode(selectedNode) {
        svg1Group.selectAll(".node").attr("stroke", d => d.name === selectedNode.name ? "red" : "black");
        svg2Group.selectAll(".node").attr("stroke", d => d.name === selectedNode.name ? "red" : "black");
    }

    // Interactive edge weight filter
    document.getElementById("weightSlider").addEventListener("input", function() {
        let minWeight = +this.value;    // Get weight from slider in html
        document.getElementById("weightValue").textContent = minWeight; // Display value in html

        let filteredLinks1 = links1.filter(d => d.value >= minWeight); // Filter only links in svg1

        // ** Redraw graph **
        svg1Group.selectAll("*").remove();
        drawGraph(svg1Group, nodes1, filteredLinks1, true);
    });

     // Toggle link thickness based on weight
     document.getElementById("toggleLinkWeight").addEventListener("change", function() {
        linkWeightEnabled = this.checked;
        svg1Group.selectAll(".link").style("stroke-width", d => linkWeightEnabled ? Math.sqrt(d.value) : 2);    // Change storke-width
    });

    // Toggle node size based on weight
    document.getElementById("toggleNodeWeight").addEventListener("change", function() {
        nodeWeightEnabled = this.checked;
        svg1Group.selectAll(".node").attr("r", d => nodeWeightEnabled ? Math.sqrt(d.value) * 2 : 5);    // Change size of nodes by radius
    });

    // Draw graphs independently
    drawGraph(svg1Group, nodes1, links1, true);  // Draggable and filterable
    drawGraph(svg2Group, nodes2, links2, false); // Static (no dragging or filtering)
});
