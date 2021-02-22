// Global var
let keysData;
let educationalData;
let averageData;
let projection;
let countriesDict = {};
let countriesDictRevers = {};
let countriesNamesDict = {
    AUS: {name: "Australia", index: "1"},
    AUT: {name: "Austria", index: "2"},
    BEL: {name: "Belgium", index: "3"},
    CAN: {name: "Canada", index: "4"},
    DNK: {name: "Denmark", index: "5"},
    FIN: {name: "Finland", index: "6"},
    FRA: {name: "France", index: "7"},
    DEU: {name: "Germany", index: "8"},
    GRC: {name: "Greece", index: "9"},
    IRL: {name: "Ireland", index: "10"},
    ITA: {name: "Italy", index: "11"},
    JPN: {name: "Japan", index: "12"},
    LUX: {name: "Luxembourg", index: "13"},
    NLD: {name: "Netherlands", index: "14"},
    NZL: {name: "New Zealand", index: "15"},
    NOR: {name: "Norway", index: "16"},
    PRT: {name: "Portugal", index: "17"},
    ESP: {name: "Spain", index: "18"},
    SWE: {name: "Sweden", index: "19"},
    CHE: {name: "Switzerland", index: "20"},
    GBR: {name: "United Kingdom", index: "21"},
    USA: {name: "United States", index: "22"}
};
let focus = "AVG";

// Events listeners
d3.select(window)
    .on("resize", function() {
        sizeChange();
        createPEChart(focus);
        createTEChart(focus);
        createAYEChart(focus, d3.select("#avg_selector").value);
        createLOEChart(focus, d3.select("#loe_selector").value);
        createGINIChart(focus);
        createCompareChart();
    });

d3.select(window)
    .on("load", function() {
        sizeChange();
        adjustYearSlider();

        d3.selectAll(".country_display")
            .text("Average for all the OECD countries");

        updateCompareDisplay();
    });

d3.select("#loe_selector")
    .on("change", function() {
        createLOEChart(focus, this.value);
    });

d3.select("#avg_selector")
    .on("change", function() {
        createAYEChart(focus, this.value);
    });

d3.select("#country_selector")
    .on("change", function() {
        focus = this.value;
        console.log("Focus: " + focus);
        createPEChart(focus);
        createTEChart(focus);
        createAYEChart(focus, d3.select("#avg_selector").value);
        createLOEChart(focus, d3.select("#leo_selector").value);
        createGINIChart(focus);

        d3.select("#map")
            .selectAll(".highlightedCountry")
            .attr("class", "OECDCountries");

        let selector = "#" + Object.keys(countriesDict)
            .find(key => countriesDict[key] === this.value);

        d3.select(selector)
            .attr("class", "highlightedCountry");

        if (focus === "AVG") d3.selectAll(".country_display")
            .text("Average for all the OECD countries");
        else d3.selectAll(".country_display")
            .text(countriesNamesDict[countriesDictRevers[focus]].name);
    });

d3.select("#year_slider")
    .on("change", function() {
        document.getElementById("year_display")
            .innerText = this.value;
        createCompareChart();

        updateCompareDisplay();
    });

d3.select("#var_selector")
    .on("change", function() {
        adjustYearSlider();
        createCompareChart();

        updateCompareDisplay();
    });

d3.selectAll("#te_layers, #gini, #pe_layers")
    .on("mouseover", function() {
        d3.select("#" + this.id)
            .selectAll("circle")
            .style("display", "unset");
    })
    .on("mouseout", function() {
        d3.select("#" + this.id)
            .selectAll("circle")
            .style("display", "none");
    });

/**
 * Render and update the public expenditure on education chart based on the selection of the country on the map
 *
 * @param selectedCountry a string specifying which country data to render in the public expenditure on education chart
 */
function createPEChart(selectedCountry) {
    console.log("Selected country: " + selectedCountry);
    let PEData;
    if (selectedCountry === "AVG") {
        PEData = averageData.map(function(d) {
            return {
                year: d.year,
                ed0exp: d.ed0exp,
                ed1exp: d.ed1exp,
                ed2exp: d.ed2exp,
                ed3exp: d.ed3exp,
                ed4exp: d.ed4exp,
                ed56exp: d.ed56exp,
                edexp: d.edexp
            };
        }).filter(function(row) {
            return row.edexp !== undefined;
        });
    }
    else {
        PEData = educationalData.filter(function(row) {
            return row.id === selectedCountry;
        })
            .map(function(d) {
                return {
                    year: d.year,
                    edexp: d.edexp
                };
            }).filter(function(row) {
                return !isNaN(row.edexp);
            });
    }

    let svgBounds = d3.select("#pe_chart").node().getBoundingClientRect();
    let xpad = 30;
    let ypad = 20;

    // Create the x and y scales
    // X scale
    let xScale = d3.scaleLinear()
        .domain([d3.min(PEData, function(d) {
            return d.year;
        }),
            1.0001 * d3.max(PEData, function(d) {
                return d.year;
            })])
        .range([xpad, svgBounds.width]);

    // Y scale
    let yScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(PEData, function(d) {
            return d.edexp;
        })]) // This is what is written on the Axis: from 0 to max(dimensionAttr)
        .range([svgBounds.height, ypad]); // This is where the axis is placed

    // Create the axes
    // X axis
    let xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(16)
        .tickFormat(d3.format("d"));

    d3.select("#xAxis1")
        .attr("transform", "translate(0, 360)")
        .transition()
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    // Y axis
    let yAxis = d3.axisLeft()
        .scale(yScale);

    d3.select("#yAxis1")
        .attr("transform", "translate(30, -40)")
        .transition()
        .call(yAxis);

    // Create the areas
    let columns;
    if (selectedCountry === "AVG") columns = ["ed0exp", "ed1exp", "ed2exp", "ed3exp", "ed4exp", "ed56exp"];
    else columns = ["edexp"];

    let areaColor = d3.scaleOrdinal()
        .domain(columns)
        .range(d3.schemeCategory10);

    let series = d3.stack().keys(columns)(PEData);

    // Define the area generator
    let area = d3.area()
        .x(function(d) {
            return xScale(d.data.year);
        })
        .y0(function(d) {
            return yScale(d[0]);
        })
        .y1(function(d) {
            return yScale(d[1]);
        });

    const PEAreas = d3.select("#pe_layers");

    // For the 'exit' subset
    PEAreas.selectAll("path")
        .data(series)
        .exit()
        .remove();

    // Refresh each time
    PEAreas.selectAll("circle")
        .remove();

    // For the 'enter' subset
    PEAreas.attr("transform", "translate(1 -40)")
        .selectAll("path")
        .data(series)
        .enter()
        .append("path")
        .attr("fill", function(d) {
            if (focus === "AVG") return areaColor(d.key);
            else return color(focus);
        })
        .attr("d", area);

    let rowsNumber = series[0].length;

    for (let num = 0; num < rowsNumber; ++num) {
        PEAreas.selectAll(".pe_circle" + num)
            .data(function() {
                return series.map(function(d) {
                    return {
                        key: d.key,
                        data: d[num]
                    }
                })
            })
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return xScale(d.data.data.year);
            })
            .attr("cy", function(d) {
                return yScale(d.data[1]);
            })
            .attr("r", 2)
            .attr("class", ".pe_circle" + num)
            .attr("fill", function(d) {
                if (focus === "AVG") return areaColor(d.key);
                else return color(focus);
            })
            .on("mouseover", function(d) {
                this.setAttribute("r", 5);

                // Show the tooltip on mouseover
                let xPosition = event.pageX + 10;
                let yPosition = event.pageY + 10;

                d3.select("#tooltip")
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px");

                d3.select("#tooltip")
                    .select("#tooltip_field_1")
                    .style("font-size", "12px")
                    .text("Year: " + d.data.data.year);

                d3.select("#tooltip")
                    .select("#tooltip_field_2")
                    .style("font-size", "12px")
                    .text("Value: " + parseFloat(d.data[1] - d.data[0]).toFixed(2) + "%");

                d3.select("#tooltip")
                    .classed("hidden", false);
            })
            .on("mouseout", function() {
                this.setAttribute("r", 2);

                d3.select("#tooltip")
                    .select("#tooltip_field_1")
                    .text("");
                d3.select("#tooltip")
                    .select("#tooltip_field_2")
                    .text("");
                d3.select("#tooltip").classed("hidden", true);
            });
    }

    // For the 'update' subset
    PEAreas.selectAll("path")
        .attr("fill", function(d) {
            if (focus === "AVG") return areaColor(d.key);
            else return color(focus);
        })
        .data(series)
        .transition()
        .attr("d", area);

    // Create legend
    let PElegend = d3.select("#pe_legend")
        .select("svg")
        .attr("height", function() {
            return 2 * 30 + columns.length * 20 + (columns.length - 1) * 10;
        });

    // For the 'exit' subset
    PElegend.selectAll("rect")
        .data(columns)
        .exit()
        .remove();

    PElegend.selectAll("text")
        .data(columns)
        .exit()
        .remove();

    // For the 'enter' subset
    PElegend.selectAll("rect")
        .data(columns)
        .enter()
        .append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", xpad)
        .attr("y", function(d, i) {
            return 30 + 30 * i;
        })
        .attr("fill", function(d) {
            if (focus !== "AVG") return color(focus);
            return areaColor(d);
        });

    PElegend.selectAll("text")
        .data(columns)
        .enter()
        .append("text")
        .attr("x", xpad + 30)
        .attr("y", function(d, i) {
            return 40 + 30 * i;
        })
        .text(function(d) {
            if (d === "ed0exp") return "pre-primary education";
            if (d === "ed1exp") return "primary education";
            if (d === "ed2exp") return "lower-secondary education";
            if (d === "ed3exp") return "upper-secondary education";
            if (d === "ed4exp") return "post-secondary education";
            if (d === "ed56exp") return "tertiary education";
            if (d === "edexp") return "all levels";
        })
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");

    // For the 'update' subset
    // For the 'enter' subset
    PElegend.selectAll("rect")
        .data(columns)
        .transition()
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", xpad)
        .attr("y", function(d, i) {
            return 30 + 30 * i;
        })
        .attr("fill", function(d) {
            if (focus !== "AVG") return color(focus);
            return areaColor(d);
        });

    PElegend.selectAll("text")
        .data(columns)
        .transition()
        .attr("x", xpad + 30)
        .attr("y", function(d, i) {
            return 40 + 30 * i;
        })
        .text(function(d) {
            if (d === "ed0exp") return "pre-primary education";
            if (d === "ed1exp") return "primary education";
            if (d === "ed2exp") return "lower-secondary education";
            if (d === "ed3exp") return "upper-secondary education";
            if (d === "ed4exp") return "post-secondary education";
            if (d === "ed56exp") return "tertiary education";
            if (d === "edexp") return "all levels";
        })
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
}

/**
 * Render and update the total expenditure on education chart based on the selection of the country on the map
 *
 * @param selectedCountry a string specifying which country data to render in the total expenditure on education chart
 */
function createTEChart(selectedCountry) {
    console.log("Selected country: " + selectedCountry);
    let TEData;
    if (selectedCountry === "AVG") {
        TEData = averageData.map(function(d) {
            return {
                year: d.year,
                ed0ex: d.ed0ex,
                ed1ex: d.ed1ex,
                ed2ex: d.ed2ex,
                ed3ex: d.ed3ex,
                ed4ex: d.ed4ex,
                ed56ex: d.ed56ex,
                edex: d.edex
            };
        }).filter(function(row) {
            return row.edex !== undefined;
        });
    }
    else {
        TEData = educationalData.filter(function(row) {
            return row.id === selectedCountry;
        })
            .map(function(d) {
                return {
                    year: d.year,
                    edex: d.edex
                };
            }).filter(function(row) {
                return !isNaN(row.edex);
            });
    }

    let svgBounds = d3.select("#te_chart").node().getBoundingClientRect();
    let xpad = 30;
    let ypad = 20;

    // Create the x and y scales
    // X scale
    let xScale = d3.scaleLinear()
        .domain([d3.min(TEData, function(d) {
            return d.year;
        }),
            1.0001 * d3.max(TEData, function(d) {
                return d.year;
            })])
        .range([xpad, svgBounds.width]);

    // Y scale
    let yScale = d3.scaleLinear()
        .domain([0, 1.15 * d3.max(TEData, function(d) {
            return d.edex;
        })]) // This is what is written on the Axis: from 0 to max(dimensionAttr)
        .range([svgBounds.height, ypad]); // This is where the axis is placed

    // Create the axes
    // X axis
    let xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(16)
        .tickFormat(d3.format("d"));

    d3.select("#xAxis2")
        .attr("transform", "translate(0, 360)")
        .transition()
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    // Y axis
    let yAxis = d3.axisLeft()
        .scale(yScale);

    d3.select("#yAxis2")
        .attr("transform", "translate(30, -40)")
        .transition()
        .call(yAxis);

    // Create the areas
    let columns;
    if (selectedCountry === "AVG") columns = ["ed0ex", "ed1ex", "ed2ex", "ed3ex", "ed4ex", "ed56ex"];
    else columns = ["edex"];

    let areaColor = d3.scaleOrdinal()
        .domain(columns)
        .range(d3.schemeCategory10);

    let series = d3.stack().keys(columns)(TEData);

    // Define the area generator
    let area = d3.area()
        .x(function(d) {
            return xScale(d.data.year);
        })
        .y0(function(d) {
            return yScale(d[0]);
        })
        .y1(function(d) {
            return yScale(d[1]);
        });

    const TEAreas = d3.select("#te_layers");

    // For the 'exit' subset
    TEAreas.selectAll("path")
        .data(series)
        .exit()
        .remove();

    // Refresh each time
    TEAreas.selectAll("circle")
        .remove();

    // For the 'enter' subset
    TEAreas.attr("transform", "translate(1 -40)")
        .selectAll("path")
        .data(series)
        .enter()
        .append("path")
        .attr("fill", function(d) {
            if (focus === "AVG") return areaColor(d.key);
            else return color(focus);
        })
        .attr("d", area);

    let rowsNumber = series[0].length;

    for (let num = 0; num < rowsNumber; ++num) {
        TEAreas.selectAll(".pe_circle" + num)
            .data(function() {
                return series.map(function(d) {
                    return {
                        key: d.key,
                        data: d[num]
                    }
                })
            })
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return xScale(d.data.data.year);
            })
            .attr("cy", function(d) {
                return yScale(d.data[1]);
            })
            .attr("r", 2)
            .attr("class", ".pe_circle" + num)
            .attr("fill", function(d) {
                if (focus === "AVG") return areaColor(d.key);
                else return color(focus);
            })
            .on("mouseover", function(d) {
                this.setAttribute("r", 5);

                // Show the tooltip on mouseover
                let xPosition = event.pageX + 10;
                let yPosition = event.pageY + 10;

                d3.select("#tooltip")
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px");

                d3.select("#tooltip")
                    .select("#tooltip_field_1")
                    .style("font-size", "12px")
                    .text("Year: " + d.data.data.year);

                d3.select("#tooltip")
                    .select("#tooltip_field_2")
                    .style("font-size", "12px")
                    .text("Value: " + parseFloat(d.data[1] - d.data[0]).toFixed(2) + "%");

                d3.select("#tooltip")
                    .classed("hidden", false);
            })
            .on("mouseout", function() {
                this.setAttribute("r", 2);

                d3.select("#tooltip")
                    .select("#tooltip_field_1")
                    .text("");
                d3.select("#tooltip")
                    .select("#tooltip_field_2")
                    .text("");
                d3.select("#tooltip").classed("hidden", true);
            });
    }

    // For the 'update' subset
    TEAreas.selectAll("path")
        .attr("fill", function(d) {
            if (focus === "AVG") return areaColor(d.key);
            else return color(focus);
        })
        .data(series)
        .transition()
        .attr("d", area);

    // Create legend
    let TElegend = d3.select("#te_legend")
        .select("svg")
        .attr("height", function() {
            return 2 * 30 + columns.length * 20 + (columns.length - 1) * 10;
        });

    // For the 'exit' subset
    TElegend.selectAll("rect")
        .data(columns)
        .exit()
        .remove();

    TElegend.selectAll("text")
        .data(columns)
        .exit()
        .remove();

    // For the 'enter' subset
    TElegend.selectAll("rect")
        .data(columns)
        .enter()
        .append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", xpad)
        .attr("y", function(d, i) {
            return 30 + 30 * i;
        })
        .attr("fill", function(d) {
            if (focus !== "AVG") return color(focus);
            return areaColor(d);
        });

    TElegend.selectAll("text")
        .data(columns)
        .enter()
        .append("text")
        .attr("x", xpad + 30)
        .attr("y", function(d, i) {
            return 40 + 30 * i;
        })
        .text(function(d) {
            if (d === "ed0ex") return "pre-primary education";
            if (d === "ed1ex") return "primary education";
            if (d === "ed2ex") return "lower-secondary education";
            if (d === "ed3ex") return "upper-secondary education";
            if (d === "ed4ex") return "post-secondary education";
            if (d === "ed56ex") return "tertiary education";
            if (d === "edex") return "all levels";
        })
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");

    TElegend.selectAll("rect")
        .data(columns)
        .transition()
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", xpad)
        .attr("y", function(d, i) {
            return 30 + 30 * i;
        })
        .attr("fill", function(d) {
            if (focus !== "AVG") return color(focus);
            return areaColor(d);
        });

    TElegend.selectAll("text")
        .data(columns)
        .transition()
        .attr("x", xpad + 30)
        .attr("y", function(d, i) {
            return 40 + 30 * i;
        })
        .text(function(d) {
            if (d === "ed0ex") return "pre-primary education";
            if (d === "ed1ex") return "primary education";
            if (d === "ed2ex") return "lower-secondary education";
            if (d === "ed3ex") return "upper-secondary education";
            if (d === "ed4ex") return "post-secondary education";
            if (d === "ed56ex") return "tertiary education";
            if (d === "edex") return "all levels";
        })
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
}

/**
 * Render and update the average years of education chart based on the selection of the country on the map
 *
 * @param selectedCountry a string specifying which country data to render in the average years of education chart
 * @param sex a string specifying which sex data to render in the average years of education chart
 */
function createAYEChart(selectedCountry, sex) {
    console.log("Selected country: " + selectedCountry);
    let AYEData;
    if (selectedCountry === "AVG") {
        if (sex === "both") {
            AYEData = averageData.map(function(d) {
                return {
                    year: d.year,
                    val: d.aveyrsed
                };
            }).filter(function(row) {
                return row.val !== undefined;
            });
        }
        else if (sex === "females") {
            AYEData = averageData.map(function(d) {
                return {
                    year: d.year,
                    val: d.faveyrsed
                };
            }).filter(function(row) {
                return row.val !== undefined;
            });
        }
        else {
            AYEData = averageData.map(function(d) {
                return {
                    year: d.year,
                    val: d.maveyrsed
                };
            }).filter(function(row) {
                return row.val !== undefined;
            });
        }
    }
    else {
        if (sex === "both") {
            AYEData = educationalData.filter(function(row) {
                return row.id === selectedCountry;
            })
                .map(function(d) {
                    return {
                        year: d.year,
                        val: d.aveyrsed
                    };
                }).filter(function(row) {
                    return !isNaN(row.val);
                });
        }
        else if (sex === "females") {
            AYEData = educationalData.filter(function(row) {
                return row.id === selectedCountry;
            })
                .map(function(d) {
                    return {
                        year: d.year,
                        val: d.faveyrsed
                    };
                }).filter(function(row) {
                    return !isNaN(row.val);
                });
        }
        else {
            AYEData = educationalData.filter(function(row) {
                return row.id === selectedCountry;
            })
                .map(function(d) {
                    return {
                        year: d.year,
                        val: d.maveyrsed
                    };
                }).filter(function(row) {
                    return !isNaN(row.val);
                });
        }
    }

    let svgBounds = d3.select("#aye_chart").node().getBoundingClientRect();
    let xpad = 30;
    let ypad = 20;

    // Create the x and y scales
    // X scale
    let xScale = d3.scaleBand()
        .range([xpad, svgBounds.width]) // This is where the axis is placed
        .padding(0.2)
        .domain(AYEData.map(function(d) {
            return d.year;
        })
            .sort()) // This is what is written on the Axis: year dates

    // Y scale
    let yScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(AYEData, function(d) {
            return d.val;
        })]) // This is what is written on the Axis: from 0 to max(dimensionAttr)
        .range([svgBounds.height, ypad]); // This is where the axis is placed

    // Create the axes
    // X axis
    let xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d3.format("d"));

    d3.select("#xAxis3")
        .attr("transform", "translate(0, 360)")
        .transition()
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    // Y axis
    let yAxis = d3.axisLeft()
        .scale(yScale);

    d3.select("#yAxis3")
        .attr("transform", "translate(30, -40)")
        .transition()
        .call(yAxis);

    // Create the bars
    let AYEBars = d3.select("#aye")
        .attr("transform", "translate(0 360) scale(1 -1)");

    // For the 'exit' subset
    AYEBars.selectAll(".aye")
        .data(AYEData)
        .exit()
        .remove();

    // For the 'enter' subset
    AYEBars.selectAll(".aye")
        .data(AYEData)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return xScale(d.year);
        })
        .attr("y", 1)
        .attr("height", function(d) {
            return svgBounds.height - yScale(d.val);
        })
        .attr("width", xScale.bandwidth())
        .attr("class", "aye")
        .attr("fill", function() {
            if (focus === "AVG") return "#00498d";
            else return color(focus);
        })
        .on("mouseover", function(d) {

            if (focus === "AVG") this.style.fill = lightenDarkenColor("#00498d", 80);
            else this.style.fill = lightenDarkenColor(color(focus), -50);

            // Show the tooltip on mouseover
            let xPosition = event.pageX + 10;
            let yPosition = event.pageY + 10;

            d3.select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px");

            d3.select("#tooltip")
                .select("#tooltip_field_1")
                .style("font-size", "12px")
                .text("Value: " + parseFloat(d.val).toFixed(2) + " years");

            d3.select("#tooltip")
                .classed("hidden", false);
        })
        .on("mouseout", function() {
            this.style.fill = "";
            d3.select("#tooltip")
                .select("#tooltip_field_1")
                .text("");
            d3.select("#tooltip")
                .select("#tooltip_field_2")
                .text("");
            d3.select("#tooltip").classed("hidden", true);
        });

    // For the 'update' subset
    AYEBars.selectAll(".aye")
        .data(AYEData)
        .transition()
        .attr("x", function(d) {
            return xScale(d.year);
        })
        .attr("y", 1)
        .attr("height", function(d) {
            return svgBounds.height - yScale(d.val);
        })
        .attr("width", xScale.bandwidth())
        .attr("class", "aye")
        .attr("fill", function() {
            if (focus === "AVG") return "#00498d";
            else return color(focus);
        });
}

/**
 * Render and update the level of education chart based on the selection of the country on the map
 *
 * @param selectedCountry a string specifying which country data to render in the level of education chart
 * @param sex a string specifying which sex data to render in the level of education chart
 */
function createLOEChart(selectedCountry, sex) {
    console.log("Selected country: " + selectedCountry);
    let LOEData;
    if (selectedCountry === "AVG") {
        LOEData = averageData.map(function(d) {
            return {
                year: d.year,
                ednosch: d.ednosch,
                ed1: d.ed1,
                ed2: d.ed2,
                ed3: d.ed3,
                mednosch: d.mednosch,
                med1: d.med1,
                med2: d.med2,
                med3: d.med3,
                fednosch: d.fednosch,
                fed1: d.fed1,
                fed2: d.fed2,
                fed3: d.fed3
            };
        }).filter(function(row) {
            return row.ednosch !== undefined;
        });
    }
    else {
        LOEData = educationalData.filter(function(row) {
            return row.id === selectedCountry;
        })
            .map(function(d) {
                return {
                    year: d.year,
                    ednosch: d.ednosch,
                    ed1: d.ed1,
                    ed2: d.ed2,
                    ed3: d.ed3,
                    mednosch: d.mednosch,
                    med1: d.med1,
                    med2: d.med2,
                    med3: d.med3,
                    fednosch: d.fednosch,
                    fed1: d.fed1,
                    fed2: d.fed2,
                    fed3: d.fed3
                };
            }).filter(function(row) {
                return !isNaN(row.ednosch);
            });
    }

    let svgBounds = d3.select("#loe_chart").node().getBoundingClientRect();
    let xpad = 30;
    let ypad = 20;

    // Create the x and y scales
    // X scale
    let xScale = d3.scaleBand()
        .range([xpad, svgBounds.width]) // This is where the axis is placed
        .padding(0.2)
        .domain(LOEData.map(function(d) {
            return d.year;
        })
            .sort()) // This is what is written on the Axis: year dates

    // Y scale
    let yScale = d3.scaleLinear()
        .domain([0, 110]) // This is what is written on the Axis: from 0 to max(dimensionAttr)
        .range([svgBounds.height, ypad]); // This is where the axis is placed

    // Create the axes
    // X axis
    let xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d3.format("d"));

    d3.select("#xAxis4")
        .attr("transform", "translate(0, 360)")
        .transition()
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    // Y axis
    let yAxis = d3.axisLeft()
        .scale(yScale);

    d3.select("#yAxis4")
        .attr("transform", "translate(30, -40)")
        .transition()
        .call(yAxis);

    // Create stacked bars
    let columns;

    // Filter by sex
    if (sex === "both") {
        columns = ["ednosch", "ed1", "ed2", "ed3"];
    }
    else if (sex === "females") {
        columns = ["fednosch", "fed1", "fed2", "fed3"];
    }
    else {
        columns = ["mednosch", "med1", "med2", "med3"];
    }

    let levelColor = d3.scaleOrdinal()
        .domain(columns)
        .range(d3.schemeCategory10);

    let stackedData = d3.stack()
        .keys(columns)
        (LOEData);

    const LOEBars = d3.select("#loe_layers");

    // For the 'exit' subset
    LOEBars.selectAll("g")
        .data(stackedData)
        .exit()
        .remove();

    // For the 'enter' subset
    LOEBars.selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .enter()
        .append("g")
        .attr("fill", function(d) {
            return levelColor(d.key);
        })
        .attr("transform", "translate(0, -40)")
        .selectAll("rect")
        // enter a second time = loop level per level to add all rectangles
        .data(function(d) {
            return d;
        })
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return xScale(d.data.year);
        })
        .attr("y", function(d) {
            return yScale(d[1]);
        })
        .attr("height", function(d) {
            return yScale(d[0]) - yScale(d[1]);
        })
        .attr("width", xScale.bandwidth())
        .on("mouseover", function(d) {

            let col = this.parentElement.attributes.fill.value;
            this.style.fill = lightenDarkenColor(col, 50);

            // Show the tooltip on mouseover
            let xPosition = event.pageX + 10;
            let yPosition = event.pageY + 10;

            d3.select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px");

            d3.select("#tooltip")
                .select("#tooltip_field_1")
                .style("font-size", "12px")
                .text("Value: " + parseFloat(d["1"] - d["0"]).toFixed(2) + "%");

            d3.select("#tooltip")
                .classed("hidden", false);
        })
        .on("mouseout", function() {
            this.style.fill = "";
            d3.select("#tooltip")
                .select("#tooltip_field_1")
                .text("");
            d3.select("#tooltip")
                .select("#tooltip_field_2")
                .text("");
            d3.select("#tooltip").classed("hidden", true);
        });

    // For the 'update' subset
    LOEBars.selectAll("g")
        .attr("fill", function(d) {
            return levelColor(d.key);
        })
        .data(stackedData)
        .selectAll("rect")
        .data(function(d) {
            return d;
        })
        .transition()
        .attr("x", function(d) {
            return xScale(d.data.year);
        })
        .attr("y", function(d) {
            return yScale(d[1]);
        })
        .attr("height", function(d) {
            return yScale(d[0]) - yScale(d[1]);
        })
        .attr("width", xScale.bandwidth());

    // Create legend
    let LOElegend = d3.select("#level_legend")
        .select("svg")
        .attr("height", function() {
            return 2 * 30 + columns.length * 20 + (columns.length - 1) * 10;
        });

    // For the 'enter' subset
    LOElegend.selectAll("rect")
        .data(columns)
        .enter()
        .append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", xpad)
        .attr("y", function(d, i) {
            return 30 + 30 * i;
        })
        .attr("fill", function(d) {
            return levelColor(d);
        });

    LOElegend.selectAll("text")
        .data(columns)
        .enter()
        .append("text")
        .attr("x", xpad + 30)
        .attr("y", function(d, i) {
            return 40 + 30 * i;
        })
        .text(function(d) {
            if (d === "ednosch" || d === "mednosch" || d === "fednosch") return "no schooling";
            if (d === "ed1" || d === "med1" || d === "fed1") return "any primary schooling"
            if (d === "ed2" || d === "med2" || d === "fed2") return "any secondary schooling"
            if (d === "ed3" || d === "med3" || d === "fed3") return "any tertiary schooling"
        })
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");

    // For the 'update' subset
    LOElegend.selectAll("text")
        .data(columns)
        .transition()
        .attr("x", xpad + 30)
        .attr("y", function(d, i) {
            return 40 + 30 * i;
        })
        .text(function(d) {
            if (d === "ednosch" || d === "mednosch" || d === "fednosch") return "no schooling";
            if (d === "ed1" || d === "med1" || d === "fed1") return "any primary schooling"
            if (d === "ed2" || d === "med2" || d === "fed2") return "any secondary schooling"
            if (d === "ed3" || d === "med3" || d === "fed3") return "any tertiary schooling"
        })
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
}

/**
 * Render and update the GINI Index chart based on the selection of the country on the map
 *
 * @param selectedCountry a string specifying which country data to render in the GINI chart
 */
function createGINIChart(selectedCountry) {
    console.log("Selected country: " + selectedCountry);
    let GINIData;
    if (selectedCountry === "AVG") {
        GINIData = averageData.map(function(d) {
            return {
                year: d.year,
                gini: d.ginitot2599
            };
        }).filter(function(row) {
            return row.gini !== undefined
        });
    }
    else {
        GINIData = educationalData.filter(function(row) {
            return row.id === selectedCountry;
        }).map(function(d) {
            return {
                year: d.year,
                gini: d.ginitot2599
            };
        }).filter(function(row) {
            return !isNaN(row.gini);
        });
    }

    let svgBounds = d3.select("#gini_chart").node().getBoundingClientRect();
    let xpad = 30;
    let ypad = 20;

    // Create the x and y scales
    // X scale
    let xScale = d3.scaleLinear()
        .domain([d3.min(GINIData, function(d) {
            return d.year;
        }),
            1.0003 * d3.max(GINIData, function(d) {
                return d.year;
            })])
        .range([xpad, svgBounds.width]);

    // Y scale
    let yScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(GINIData, function(d) {
            return d.gini;
        })]) // This is what is written on the Axis: from 0 to max(dimensionAttr)
        .range([svgBounds.height, ypad]); // This is where the axis is placed

    // Create the axes
    // X axis
    let xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d3.format("d"));

    d3.select("#xAxis5")
        .attr("transform", "translate(0, 360)")
        .transition()
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    // Y axis
    let yAxis = d3.axisLeft()
        .scale(yScale);

    d3.select("#yAxis5")
        .attr("transform", "translate(30, -40)")
        .transition()
        .call(yAxis);

    // Define the line generator
    let lineGenerator = d3.line()
        .x(function(d) {
            return xScale(d.year);
        })
        .y(function(d) {
            return yScale(d.gini);
        });

    // Create the line
    let line = lineGenerator(GINIData);

    let GINILine = d3.select("#gini")
        .attr("transform", "translate(1 -40)");

    // For the 'exit' subset
    GINILine.selectAll(".gini")
        .data([GINIData])
        .exit()
        .remove();

    GINILine.selectAll("circle")
        .data(GINIData)
        .exit()
        .remove();

    // For the 'enter' subset
    GINILine.selectAll(".gini")
        .data([GINIData])
        .enter()
        .append("path")
        .attr("d", line)
        .attr("class", "gini")
        .attr("stroke", function() {
            if (focus === "AVG") return "#00498d";
            else return color(focus);
        });

    GINILine.selectAll("circle")
        .data(GINIData)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return xScale(d.year);
        })
        .attr("cy", function (d) {
            return yScale(d.gini);
        })
        .attr("r", 3)
        .attr("class", ".gini_circle")
        .attr("fill", function() {
            if (focus === "AVG") return "#00498d";
            else return color(focus);
        })
        .on("mouseover", function(d) {
            this.setAttribute("r", 5);

            // Show the tooltip on mouseover
            let xPosition = event.pageX + 10;
            let yPosition = event.pageY + 10;

            d3.select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px");

            d3.select("#tooltip")
                .select("#tooltip_field_1")
                .style("font-size", "12px")
                .text("Year: " + d.year);

            d3.select("#tooltip")
                .select("#tooltip_field_2")
                .style("font-size", "12px")
                .text("Value: " + parseFloat(d.gini).toFixed(2));

            d3.select("#tooltip")
                .classed("hidden", false);
        })
        .on("mouseout", function() {
            this.setAttribute("r", 3);

            d3.select("#tooltip")
                .select("#tooltip_field_1")
                .text("");
            d3.select("#tooltip")
                .select("#tooltip_field_2")
                .text("");
            d3.select("#tooltip").classed("hidden", true);
        });

    // For the 'update' subset
    GINILine.selectAll(".gini")
        .data([GINIData])
        .transition()
        .attr("d", line)
        .attr("class", "gini")
        .attr("stroke", function() {
            if (focus === "AVG") return "#00498d";
            else return color(focus);
        });

    GINILine.selectAll("circle")
        .data(GINIData)
        .transition()
        .attr("cx", function (d) {
            return xScale(d.year);
        })
        .attr("cy", function (d) {
            return yScale(d.gini);
        })
        .attr("r", 3)
        .attr("class", ".gini_circle")
        .attr("fill", function() {
            if (focus === "AVG") return "#00498d";
            else return color(focus);
        });
}

/**
 * Render and update the compare chart
 */
function createCompareChart() {
    let variable = document.getElementById("var_selector").value;
    let year = +document.getElementById("year_slider").value;
    let compareData = educationalData.filter(function(row) {
        return row.year === year;
    }).map(function(d) {
        return {
            year: d.year,
            val: d[variable],
            country: countriesNamesDict[countriesDictRevers[d.id]].name,
            countryId: countriesDictRevers[d.id]
        };
    }).filter(function(row) {
        return !isNaN(row.val);
    });

    let svgBounds = d3.select("#loe_chart").node().getBoundingClientRect();
    let xpad = 30;
    let ypad = 60;

    // Create the x and y scales
    // X scale
    compareData.sort(function(a, b) {
        return a.val - b.val;
    });

    let xScale = d3.scaleBand()
        .range([xpad, svgBounds.width]) // This is where the axis is placed
        .padding(0.2)
        .domain(compareData.map(function(d) {
            return d.country;
        }));// This is what is written on the Axis: year dates

    // Y scale
    let yScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(compareData, function(d) {
            return d.val;
        })]) // This is what is written on the Axis: from 0 to max(dimensionAttr)
        .range([svgBounds.height, ypad]); // This is where the axis is placed

    // Create the axes
    // X axis
    let xAxis = d3.axisBottom()
        .scale(xScale);

    d3.select("#xAxis6")
        .attr("transform", "translate(0, 320)")
        .transition(2000)
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    // Y axis
    let yAxis = d3.axisLeft()
        .scale(yScale);

    d3.select("#yAxis6")
        .attr("transform", "translate(30, -80)")
        .transition(2000)
        .call(yAxis);

    // Create the bars
    let compareBars = d3.select("#compare")
        .attr("transform", "translate(0 320) scale(1 -1)");

    // For the 'exit' subset
    compareBars.selectAll(".compare")
        .data(compareData)
        .exit()
        .remove();

    // For the 'enter' subset
    compareBars.selectAll(".compare")
        .data(compareData)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return xScale(d.country);
        })
        .attr("y", 1)
        .attr("height", function(d) {
            return svgBounds.height - yScale(d.val);
        })
        .attr("width", xScale.bandwidth())
        .attr("class", "compare")
        .attr("fill", function(d) {
            return color(d.countryId);
        })
        .on("mouseover", function(d) {

            let col = color(d.countryId);
            this.style.fill = lightenDarkenColor(col, 30);

            // Show the tooltip on mouseover
            let xPosition = event.pageX + 10;
            let yPosition = event.pageY + 10;

            d3.select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px");

            d3.select("#tooltip")
                .select("#tooltip_field_1")
                .style("font-size", "12px")
                .text(function() {
                    if (document.getElementById("var_selector").value === "aveyrsed") return "Value: " + parseFloat(d.val).toFixed(2) + " years";
                    else if (document.getElementById("var_selector").value === "ginitot2599") return "Value: " + parseFloat(d.val).toFixed(2);
                    else return "Value: " + parseFloat(d.val).toFixed(2) + "%";
                });

            d3.select("#tooltip")
                .classed("hidden", false);
        })
        .on("mouseout", function() {
            this.style.fill = "";
            d3.select("#tooltip")
                .select("#tooltip_field_1")
                .text("");
            d3.select("#tooltip")
                .select("#tooltip_field_2")
                .text("");
            d3.select("#tooltip").classed("hidden", true);
        });

    // For the 'update' subset
    compareBars.selectAll(".compare")
        .data(compareData)
        .transition(2000)
        .attr("x", function(d) {
            return xScale(d.country);
        })
        .attr("y", 1)
        .attr("height", function(d) {
            return svgBounds.height - yScale(d.val);
        })
        .attr("width", xScale.bandwidth())
        .attr("class", "compare")
        .attr("fill", function(d) {
            return color(d.countryId);
        });
}

/**
 * Renders and updates the map and the highlights on top of it
 *
 * @param world the json data with the shape of all countries
 */
function drawMap(world) {

    projection = d3.geoMercator();

    // Define the path generator function
    let path = d3.geoPath(projection);

    // Draw the background (country outlines)
    let map = d3.select("#map");

    map.selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path)

        // Assign an id to each country path to make it easier to select afterwards
        .attr("id", function(d) {
            return d.id;
        })
        // Assign to each country path the appropriate class
        .attr("class", function(d) {
            if (countriesDict[d.id] !== undefined) return "OECDCountries";
            else return "countries";
        })
        // Action on mouseover
        .on("mouseover", function(d) {
            if (countriesDict[d.id] !== undefined) {
                this.style.fill = lightenDarkenColor("#00498d", 80);

                // Show the tooltip on mouseover
                let xPosition = event.pageX + 10;
                let yPosition = event.pageY + 10;

                d3.select("#tooltip")
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px");

                d3.select("#tooltip")
                    .select("#tooltip_field_1")
                    .text(countriesNamesDict[d.id].name);

                d3.select("#tooltip")
                    .classed("hidden", false);
            }
        })
        // Action on mouseout
        .on("mouseout", function() {
            this.style.fill = "";
            d3.select("#tooltip")
                .select("#tooltip_field_1")
                .text("");
            d3.select("#tooltip")
                .select("#tooltip_field_2")
                .text("");
            d3.select("#tooltip").classed("hidden", true);
        })
        .on("click", function(d) {
            if (countriesDict[d.id] !== undefined) {
                focus = countriesDict[d.id];
                console.log("Focus: " + focus);
                createPEChart(focus);
                createTEChart(focus);
                createAYEChart(focus, d3.select("#avg_selector").value);
                createLOEChart(focus, d3.select("#leo_selector").value);
                createGINIChart(focus);

                d3.select("#map")
                    .selectAll(".highlightedCountry")
                    .attr("class", "OECDCountries");

                this.setAttribute("class", "highlightedCountry");

                d3.selectAll(".country_display")
                    .text(countriesNamesDict[countriesDictRevers[focus]].name);

                document.getElementById("country_selector")
                    .selectedIndex = countriesNamesDict[countriesDictRevers[focus]].index;
            }
            else {
                focus = "AVG";
                console.log("Focus: " + focus);
                createPEChart(focus);
                createTEChart(focus);
                createAYEChart(focus, d3.select("#avg_selector").value);
                createLOEChart(focus, d3.select("#leo_selector").value);
                createGINIChart(focus);

                d3.select("#map")
                    .selectAll(".highlightedCountry")
                    .attr("class", "OECDCountries");

                d3.selectAll(".country_display")
                    .text("Average for all the OECD countries");
            }
        });
}

/**
 * Assigns a colour for each country
 */
const color = d3.scaleOrdinal()
    .domain(Object.keys(countriesNamesDict).map(function(key) {
        return countriesNamesDict[key];
    }))
    .range(d3.schemeCategory20);

/**
 * Lightens or darkens the given colour
 *
 * @param col a color to be changed
 * @param amt a degree of change
 * @returns {string} a new, changed colour
 */
function lightenDarkenColor(col, amt) {

    let usePound = false;

    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }

    let num = parseInt(col, 16);

    let r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = ((num >> 8) & 0x00FF) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num & 0x0000FF) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

/**
 * Updates the comparison description for the compare chart
 */
function updateCompareDisplay() {
    let selectedVariableIndex = document.getElementById("var_selector").selectedIndex;
    document.getElementById("compare_display")
        .innerText = d3.select("#var_selector").selectAll("option")._groups[0][selectedVariableIndex].innerText
        + " in the OECD countries";
}

/**
 * Adjusts the year slider
 */
function adjustYearSlider() {
    let min;
    let max = 2010;
    let step;
    d3.select("#year_slider")
        .attr("min", function() {
            let variable = document.getElementById("var_selector").value;
            if (variable === "edexp" || variable === "edex") {
                min = 1995;
                return 1995;
            }
            min = 1960;
            return 1960;
        })
        .attr("max", "2010")
        .attr("step", function() {
            let variable = document.getElementById("var_selector").value;
            if (variable === "edexp" || variable === "edex") {
                step = 1;
                return 1;
            }
            step = 5;
            return 5;
        });

    let ticks = document.getElementById("tick_marks");
    let i = min;
    while (i <= max) {
        let tick = document.createElement("option");
        tick.setAttribute("value", i);
        tick.setAttribute("id", "tick" + i);
        ticks.appendChild(tick);
        i += step;
    }
    document.getElementById("year_display").innerText = document.getElementById("year_slider").value;
}

/**
 * Adjusts the dimensions of the map
 */
function sizeChange() {
    let container = document.getElementById("world_map");
    d3.select("#map_container").attr("height", container.clientWidth * 0.450);
    d3.select("#map")
        .attr("transform", "scale(" + (container.clientWidth / 1010) + ")");
}

/* DATA LOADING */
// Load in json data to make map
d3.json("../data/world.json", function(error, world) {
    if (error) {
        console.log(error);  //Log the error.
        throw error;
    }

    drawMap(world);
});


// Load CSV file
d3.csv("../data/OECD.csv", function(error, csv) {
    if (error) {
        console.log(error);  //Log the error.
        throw error;
    }

    csv.forEach(function(d) {
        // Get countries
        switch (d.id) {
            case "AUL":
                countriesDict["AUS"] = "AUL";
                countriesDictRevers["AUL"] = "AUS";
                break;
            case "AUS":
                countriesDict["AUT"] = "AUS";
                countriesDictRevers["AUS"] = "AUT";
                break;
            case "DEN":
                countriesDict["DNK"] = "DEN";
                countriesDictRevers["DEN"] = "DNK";
                break;
            case "FRG":
                countriesDict["DEU"] = "FRG";
                countriesDictRevers["FRG"] = "DEU";
                break;
            case "GRE":
                countriesDict["GRC"] = "GRE";
                countriesDictRevers["GRE"] = "GRC";
                break;
            case "IRE":
                countriesDict["IRL"] = "IRE";
                countriesDictRevers["IRE"] = "IRL";
                break;
            case "NET":
                countriesDict["NLD"] = "NET";
                countriesDictRevers["NET"] = "NLD";
                break;
            case "POR":
                countriesDict["PRT"] = "POR";
                countriesDictRevers["POR"] = "PRT";
                break;
            case "SPA":
                countriesDict["ESP"] = "SPA";
                countriesDictRevers["SPA"] = "ESP";
                break;
            case "SWZ":
                countriesDict["CHE"] = "SWZ";
                countriesDictRevers["SWZ"] = "CHE";
                break;
            case "UKM":
                countriesDict["GBR"] = "UKM";
                countriesDictRevers["UKM"] = "GBR";
                break;
            default:
                countriesDict[d.id] = d.id;
                countriesDictRevers[d.id] = d.id;
        }

        // Convert numeric values to 'numbers'
        // Year
        d.year === "" ? d.year = NaN : d.year = +d.year;

        // Public expenditure on education
        d.ed0exp === "" ? d.ed0exp = NaN : d.ed0exp = +d.ed0exp;
        d.ed1exp === "" ? d.ed1exp = NaN : d.ed1exp = +d.ed1exp;
        d.ed2exp === "" ? d.ed2exp = NaN : d.ed2exp = +d.ed2exp;
        d.ed3exp === "" ? d.ed3exp = NaN : d.ed3exp = +d.ed3exp;
        d.ed4exp === "" ? d.ed4exp = NaN : d.ed4exp = +d.ed4exp;
        d.ed56exp === "" ? d.ed56exp = NaN : d.ed56exp = +d.ed56exp;
        d.edexp === "" ? d.edexp = NaN : d.edexp = +d.edexp;

        // Total expenditure on education
        d.ed0ex === "" ? d.ed0ex = NaN : d.ed0ex = +d.ed0ex;
        d.ed1ex === "" ? d.ed1ex = NaN : d.ed1ex = +d.ed1ex;
        d.ed2ex === "" ? d.ed2ex = NaN : d.ed2ex = +d.ed2ex;
        d.ed3ex === "" ? d.ed3ex = NaN : d.ed3ex = +d.ed3ex;
        d.ed4ex === "" ? d.ed4ex = NaN : d.ed4ex = +d.ed4ex;
        d.ed56ex === "" ? d.ed56ex = NaN : d.ed56ex = +d.ed56ex;
        d.edex === "" ? d.edex = NaN : d.edex = +d.edex;

        // Average years of education attained in the population aged 25
        d.aveyrsed === "" ? d.aveyrsed = NaN : d.aveyrsed = +d.aveyrsed;
        d.maveyrsed === "" ? d.maveyrsed = NaN : d.maveyrsed = +d.maveyrsed;
        d.faveyrsed === "" ? d.faveyrsed = NaN : d.faveyrsed = +d.faveyrsed;

        // Level of education in the population aged 25 and over
        d.ednosch === "" ? d.ednosch = NaN : d.ednosch = +d.ednosch;
        d.ed1 === "" ? d.ed1 = NaN : d.ed1 = +d.ed1;
        d.ed2 === "" ? d.ed2 = NaN : d.ed2 = +d.ed2;
        d.ed3 === "" ? d.ed3 = NaN : d.ed3 = +d.ed3;
        d.mednosch === "" ? d.mednosch = NaN : d.mednosch = +d.mednosch;
        d.med1 === "" ? d.med1 = NaN : d.med1 = +d.med1;
        d.med2 === "" ? d.med2 = NaN : d.med2 = +d.med2;
        d.med3 === "" ? d.med3 = NaN : d.med3 = +d.med3;
        d.fednosch === "" ? d.fednosch = NaN : d.fednosch = +d.fednosch;
        d.fed1 === "" ? d.fed1 = NaN : d.fed1 = +d.fed1;
        d.fed2 === "" ? d.fed2 = NaN : d.fed2 = +d.fed2;
        d.fed3 === "" ? d.fed3 = NaN : d.fed3 = +d.fed3;

        // Educational GINI Index
        d.ginitot2599 === "" ? d.ginitot2599 = NaN : d.ginitot2599 = +d.ginitot2599;
    });

    // Store csv data in a global variable
    educationalData = csv;
    keysData = Object.keys(educationalData[0]);

    // Calculate and store average data
    averageData = []

    for (let yr = 1960; yr <= 2014; yr++) {
        let oneYearData;
        oneYearData = educationalData.filter(function(row) {
            return row.year === yr;
        });

        let tempRow = {}
        tempRow["year"] = yr;

        keysData.forEach(function(key) {
            if (key !== "id" && key !== "idn" && key !== "year") {
                let mean;
                mean = d3.mean(oneYearData, d => d[key]);
                tempRow[key] = mean;
            }
        })
        averageData.push(tempRow);
    }

    // Draw the charts for the first time
    createPEChart("AVG");
    createTEChart("AVG");
    createAYEChart("AVG", "both");
    createLOEChart("AVG", "both");
    createGINIChart("AVG");
    createCompareChart();

    // Show data
    console.log(educationalData);
    console.log(averageData);
    console.log(countriesDict);
});