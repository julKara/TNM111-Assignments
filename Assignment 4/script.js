const width = 800, height = 800; // Ensure a proper fit for both diagrams

// Select the two SVG elements and set up zoom functionality
const svg1 = d3.select("#graph1")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().scaleExtent([0.5, 3]).on("zoom", (event) => svg1Group.attr("transform", event.transform)))
    .append("g");

const svg2 = d3.select("#graph2")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().scaleExtent([0.5, 3]).on("zoom", (event) => svg2Group.attr("transform", event.transform)))
    .append("g");

// Groups for zooming
const svg1Group = svg1.append("g");
const svg2Group = svg2.append("g");

const tooltip = d3.select("body").append("div").attr("class", "tooltip");

// Load the JSON data
d3.json("starwars-full-interactions-allCharacters.json").then(data => {
    let nodes = data.nodes;
    let links = data.links;

    function drawGraph(svgGroup, nodes, links) {
        // Set up force simulation with physics like in D3 in Depth (https://www.d3indepth.com/force-layout/ )
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.index).distance(80)) // Control edge length
            .force("charge", d3.forceManyBody().strength(-300)) // Spread nodes apart
            .force("center", d3.forceCenter(width / 2, height / 2));    // Attracts elements towards center point, in this case, center of 2 SVGs, must fix to center of each individual SVG

        // Defines edges (links) between nodes
        const link = svgGroup.selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .on("mouseover", (event, d) => {    // Show tooltip when hovering over nodes
                tooltip.style("display", "block")
                    .html(`Characters: ${d.source.name} & ${d.target.name} <br> Number of scenes together: ${d.value}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 5) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        // Defines nodes (characters)
        const node = svgGroup.selectAll(".node")
            .data(nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", d => Math.sqrt(d.value) * 2) // Scale node size by its value
            .attr("fill", d => d.colour) // Set character color
            .call(drag(simulation)) // Make nodes draggable (function bellow)
            .on("mouseover", (event, d) => {    // Show tooltip when hovering over nodes
                tooltip.style("display", "block")
                    .html(`Name: ${d.name} <br> Scenes: ${d.value}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 5) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"))
            .on("click", (event, d) => highlightNode(d)); // Highlight node on click (doesnt work)

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
    function drag(simulation) { // Uses simulation as defined before
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

    // Highlight the selected node in both graphs (doesn't work)
    function highlightNode(selectedNode) {
        svg1.selectAll(".node").attr("stroke", d => d.name === selectedNode.name ? "red" : "black");
        svg2.selectAll(".node").attr("stroke", d => d.name === selectedNode.name ? "red" : "black");
    }

    // Interactive edge weight filter
    document.getElementById("weightSlider").addEventListener("input", function() {
        let minWeight = +this.value;
        document.getElementById("weightValue").textContent = minWeight; // Taken from html slider

        let filteredLinks = links.filter(d => d.value >= minWeight); // Filter links based on weight, only those whose value is above minWeight, aka weightValue stays connected (aka number of scenes the 2 characters have togehter)

        // Clear previous graphs and redraw with filtered links
        svg1Group.selectAll("*").remove();
        svg2Group.selectAll("*").remove();
        drawGraph(svg1Group, nodes, filteredLinks);
        drawGraph(svg2Group, nodes, filteredLinks);
    });

    // Draw the initial graphs
    drawGraph(svg1Group, nodes, links);
    drawGraph(svg2Group, nodes, links);

    // Also add brushing, tooltip edges & control pannel
});
