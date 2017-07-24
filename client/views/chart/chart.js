import {Filter} from "/lib/filter.js";
import {Map} from "/lib/map.js";

Meteor.chart = {
    chartData: {},

    d3Chart: function () {
        return d3.select("#chart");
    },
    chartContainer: function () {
        //somewhere there must be a container for the entire chart
        //to get the padding of that container into the equation,
        //we select the container via id #chart-container

        return $("#chartContainer");
    },
    _clearChartDrawing: function (chartData) {
        chartData.d3Chart.selectAll("*")
            .remove();
        return chartData;
    },
    _trackBucketNameHtml: function (chartData) {
        var html = "";
        if (chartData.trackFilter.hasData() || chartData.resultFilter.hasData()) {
            html += "<ul class='track-bucket-names'>";

            if (chartData.trackFilter.isAllOff() && chartData.resultFilter.isAllOff()) {
                html += "<li class='label'>Chart filter:</li>";
            } else {
                html += '<li class="label"><a href="#" class="reset-filter">Clear filter</a>:</li>';
            }

            _.each(chartData.trackBuckets, function (b) {
                html += '<li><a name="' + b.name + '"';
                html += ' href="#"';
                html += ' class="track filter ' + (chartData.trackFilter.isOn(b.name) ? "on" : "off") + '"';
                html += '>#' + b.name + (b.duration ? ' (' + Meteor.tracker.printDuration(b.duration) + ')' : '') + '</a></li>';
            });
            html += "</ul>"
        }
        return html;
    },
    _isAvgMeaning: function (resultBucketName) {
        //check if the result bucket name indicates to not sum up all numbers to a total, but to calculate the average value
        return resultBucketName && resultBucketName.indexOf("/") > 0;
    },
    _resultBucketsForTracks: function (chartData) {
        var bucketArray = [],
            resultBuckets = new Map(),
            allOff = chartData.trackFilter.isAllOff();

        _.each(chartData.trackBuckets, function (trackBucket) {
            if (allOff || chartData.trackFilter.isOn(trackBucket.name)) {
                _.each(trackBucket.resultBuckets, function (resultBucket) {
                    var value = resultBuckets.get(resultBucket.name);
                    if (value) {
                        resultBuckets.set(resultBucket.name, {
                            number: value.number + resultBucket.number,
                            count: value.count + resultBucket.count
                        });
                    } else {
                        resultBuckets.set(resultBucket.name, {
                            number: resultBucket.number,
                            count: resultBucket.count
                        })
                    }
                });
            }
        });

        _.each(resultBuckets.entries(), function (e) {
            if (Meteor.chart._isAvgMeaning(e.key)) {
                bucketArray.push({name: e.key, number: e.value.number / e.value.count});
            } else {
                bucketArray.push({name: e.key, number: e.value.number});
            }
        });

        bucketArray.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });


        return bucketArray;
    },
    _resultBucketNameHtml: function (chartData) {
        var html = "";

        if (chartData.resultFilter.hasData()) {
            html += "<ul class='result-bucket-names'>";

            _.each(Meteor.chart._resultBucketsForTracks(chartData), function (b) {
                html += '<li><a name="' + b.name + '"';
                html += ' href="#"';
                if (chartData.resultFilter.isOn(b.name)) {
                    html += ' style="background:' + Meteor.chart._getResultColor(chartData, b.name) + '; color:white;"';
                    html += ' class="result filter on"';
                } else {
                    html += ' style="color:' + Meteor.chart._getResultColor(chartData, b.name) + ';"';
                    html += ' class="result filter off"';
                }
                html += '>' + (b.name ? b.name : 'pure');
                html += (b.number ? ' (' + +b.number.toFixed(1) + ')' : '');
                html += '</a></li>';
            });
            html += "</ul>"
        }
        return html;
    },
    _addDomainPadding: function (chartData) {
        if (!_.isUndefined(chartData.durationMax) && !_.isUndefined(chartData.durationMin)) {
            if (isNaN(chartData.durationMin) || chartData.durationMin == chartData.durationMax) {
                chartData.durationMin = 0;
            }

            var duration = chartData.durationMax - chartData.durationMin;
            var durationPadding = Math.round(duration / 100 * 10); //10% padding
            chartData.durationMax += durationPadding;
            if (chartData.durationMin - durationPadding >= 0) {
                chartData.durationMin -= durationPadding;
            } else {
                chartData.durationMin = 0;
            }
        }

        if (!_.isUndefined(chartData.resultsMax) && !_.isUndefined(chartData.resultsMin)) {
            if (isNaN(chartData.resultsMin) || chartData.resultsMin == chartData.resultsMax) {
                chartData.resultsMin = 0;
            }
            var results = chartData.resultsMax - chartData.resultsMin;
            var resultsPadding = Math.round(results / 100 * 10); //10% padding
            chartData.resultsMax += resultsPadding;
            if (chartData.resultsMin - resultsPadding >= 0) {
                chartData.resultsMin -= resultsPadding;
            } else {
                chartData.resultsMin = 0;
            }
        }
        return chartData;
    },
    _addToResultBucket: function (chartData, trackBucket, track, result) {
        if (_.isUndefined(trackBucket.resultBuckets)) {
            trackBucket.resultBuckets = [];
        }
        var buckets = trackBucket.resultBuckets;
        var number = Meteor.tracker.extractResult(result);
        var resultBucket = Meteor.tracker.extractResultBucket(result);

        for (var i = 0; i < buckets.length; i++) {
            if (buckets[i].name == resultBucket) {
                buckets[i].results.push({date: track.date, result: number, duration: track.duration, allResults: track.results});
                buckets[i].number += (number ? number : 0);
                buckets[i].count += 1;
                return trackBucket;
            }
        }

        buckets.push({
            name: resultBucket,
            results: [{date: track.date, result: number, duration: track.duration, allResults: track.results}],
            trackBucket: trackBucket,
            number: (number ? number : 0),
            count: 1
        });
        chartData.resultFilter.add(resultBucket);

        return trackBucket;
    },
    _addToTrackBucket: function (chartData, track) {
        if (_.isUndefined(chartData.trackBuckets)) {
            chartData.trackBuckets = [];
        }
        var buckets = chartData.trackBuckets;
        for (var i = 0; i < buckets.length; i++) {
            if (buckets[i].name == track.track) {
                buckets[i].tracks.push(track);
                buckets[i].duration += (track.duration ? track.duration : 0);

                _.each(track.results, function (result) {
                    Meteor.chart._addToResultBucket(chartData, buckets[i], track, result);
                });
                return chartData;
            }
        }
        buckets.push({name: track.track, tracks: [track], duration: (track.duration ? track.duration : 0)});
        _.each(track.results, function (result) {
            Meteor.chart._addToResultBucket(chartData, buckets[buckets.length - 1], track, result);
        });

        chartData.trackFilter.add(track.track);
        return chartData;
    },
    _calcMinMax: function (chartData) {
        delete chartData.durationMin;
        delete chartData.durationMax;
        delete chartData.dateMin;
        delete chartData.dateMax;
        delete chartData.resultsMin;
        delete chartData.resultsMax;

        chartData.durationMin = d3.min(chartData.trackBuckets, function (trackBucket) {
            if (chartData.trackFilter.isOn(trackBucket.name) || chartData.trackFilter.isAllOff()) {
                return trackBucket.tracks ? d3.min(trackBucket.tracks, function (t) {
                        return t.duration;
                    }) : chartData.durationMin;
            } else {
                return chartData.durationMin;
            }
        });
        chartData.durationMax = d3.max(chartData.trackBuckets, function (trackBucket) {
            if (chartData.trackFilter.isOn(trackBucket.name) || chartData.trackFilter.isAllOff()) {
                return trackBucket.tracks ? d3.max(trackBucket.tracks, function (t) {
                        return t.duration;
                    }) : chartData.durationMax;
            } else {
                return chartData.durationMax;
            }
        });
        chartData.dateMin = d3.min(chartData.trackBuckets, function (trackBucket) {
            if (chartData.trackFilter.isOn(trackBucket.name) || chartData.trackFilter.isAllOff()) {
                return trackBucket.tracks ? d3.min(trackBucket.tracks, function (t) {
                        return t.date;
                    }) : chartData.dateMin;
            } else {
                return chartData.dateMin;
            }
        });
        chartData.dateMax = d3.max(chartData.trackBuckets, function (trackBucket) {
            if (chartData.trackFilter.isOn(trackBucket.name) || chartData.trackFilter.isAllOff()) {
                return trackBucket.tracks ? d3.max(trackBucket.tracks, function (t) {
                        return t.date;
                    }) : chartData.dateMax;
            } else {
                return chartData.dateMax;
            }
        });


        chartData.resultsMin = d3.min(chartData.trackBuckets, function (trackBucket) {
            if ((chartData.trackFilter.isOn(trackBucket.name) || chartData.trackFilter.isAllOff()) && trackBucket.resultBuckets) {
                return d3.min(trackBucket.resultBuckets, function (resultBucket) {
                    if (chartData.resultFilter.isOn(resultBucket.name) || chartData.resultFilter.isAllOff()) {
                        return resultBucket.results ? d3.min(resultBucket.results, function (r) {
                                return parseFloat(r.result);
                            }) : chartData.resultsMin;
                    }
                });
            } else {
                return chartData.resultsMin;
            }
        });

        chartData.resultsMax = d3.max(chartData.trackBuckets, function (trackBucket) {
            if ((chartData.trackFilter.isOn(trackBucket.name) || chartData.trackFilter.isAllOff()) && trackBucket.resultBuckets) {
                return d3.max(trackBucket.resultBuckets, function (resultBucket) {
                    if (chartData.resultFilter.isOn(resultBucket.name) || chartData.resultFilter.isAllOff()) {
                        return resultBucket.results ? d3.max(resultBucket.results, function (r) {
                                return parseFloat(r.result);
                            }) : chartData.resultsMax;
                    }
                });
            } else {
                return chartData.resultsMax;
            }
        });


    },
    _prepareBuckets: function (chartData) {

        //clear data
        delete chartData.trackBuckets;

        if (!chartData["trackFilter"]) {
            chartData.trackFilter = new Filter();
        } else {
            chartData.trackFilter.clear();
        }
        if (!chartData["resultFilter"]) {
            chartData.resultFilter = new Filter();
        } else {
            chartData.resultFilter.clear();
        }

        //prepare track buckets and result buckets
        _.each(chartData.data, function (d) {
            Meteor.chart._addToTrackBucket(chartData, d);
        });
        chartData.trackBuckets.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

        if (chartData.trackFilter.isAllOff() && chartData.resultFilter.isAllOff()) {
            //set last track on
            var lastTrack = this._lastTrack(chartData);
            if (lastTrack) {
                chartData.trackFilter.on(lastTrack.track);

                var trackBucket = this._trackBucket(chartData, lastTrack.track);

                if (trackBucket["resultBuckets"]) {
                    _.each(trackBucket.resultBuckets, function (resultBucket) {
                        chartData.resultFilter.on(resultBucket.name);
                    });
                }
            }
        }
    },
    _lastTrack: function (chartData) {
        return _.first(chartData.data); //most recent comes first
    },
    _trackBucket: function (chartData, trackBucketName) {
        if (chartData.trackBuckets) {
            for (var i = 0; i < chartData.trackBuckets.length; i++) {
                var name = chartData.trackBuckets[i].name;
                if (name == trackBucketName) {
                    return chartData.trackBuckets[i];
                }
            }
        }
        return null;
    },
    _scaling: function (chartData) {
        Meteor.chart._calcMinMax(chartData);
        Meteor.chart._addDomainPadding(chartData);
        Meteor.chart._setDateScale(chartData);
        Meteor.chart._setDurationScale(chartData);
        Meteor.chart._setResultsScale(chartData);
        Meteor.chart._setDurationLine(chartData);
        Meteor.chart._setResultsLine(chartData);

        return chartData;
    },
    _loadData: function (chartData) {

        chartData.data = Template.instance()
            .tracks()
            .fetch();

        Meteor.chart._prepareBuckets(chartData);

        return chartData;
    }
    ,
    _setDateScale: function (chartData) {
        chartData.dateScale = d3.time.scale()
            .domain([chartData.dateMin, chartData.dateMax])
            .rangeRound([0, chartData.width]);
        chartData.dateAxis = d3.svg.axis()
            .scale(chartData.dateScale)
            .orient("top")
            .ticks(chartData.width > 400 ? 3 : 2);
        return chartData;
    }
    ,
    _setDurationScale: function (chartData) {
        chartData.durationScale = d3.scale.linear()
            .domain([chartData.durationMin, chartData.durationMax])
            .rangeRound([chartData.height, 0]);
        chartData.durationAxis = d3.svg.axis()
            .scale(chartData.durationScale)
            .orient("left")
            .tickFormat(Meteor.tracker.printDuration);
        return chartData;
    }
    ,
    _setDurationLine: function (chartData) {
        chartData.durationLine = d3.svg.line()
            .defined(function (d) {
                return !isNaN(d.duration);
            })
            .interpolate("monotone")
            .x(function (d) {
                return chartData.dateScale(d.date);
            })
            .y(function (d) {
                return chartData.durationScale(d.duration);
            });
        return chartData;
    }
    ,
    _setResultsScale: function (chartData) {
        chartData.resultScale = d3.scale.linear()
            .domain([chartData.resultsMin, chartData.resultsMax])
            .rangeRound([chartData.height, 0]);
        chartData.resultsAxis = d3.svg.axis()
            .scale(chartData.resultScale)
            .orient("right");
        return chartData;
    }
    ,
    _setResultsLine: function (chartData) {
        chartData.resultsLine = d3.svg.line()
            .defined(function (d) {
                return !isNaN(d.result);
            })
            .interpolate("monotone")
            .x(function (d) {
                return chartData.dateScale(d.date);
            })
            .y(function (d) {
                return chartData.resultScale(d.result);
            });
        return chartData;
    }
    ,
    _setResultColorScale: function (chartData) {
        chartData.resultColorScale = d3.scale.ordinal()
            .domain(Meteor.tracker.getResultBuckets())
            .range(d3.scale.category20().range());
        return chartData;
    },
    _getResultColor: function (chartData, resultName) {
        return chartData.resultColorScale(resultName);
    },

    _detectDimensions: function (chartData) {
        var chartContainer = this.chartContainer();
        chartData.chartContainer = chartContainer;

        var w = chartContainer.width();
        var padding = chartContainer.outerHeight(true) - chartContainer.height() + 2;
        var windowHeight = $(window)
            .height();

        _.each($(".padding"), function (element) {
            padding += $(element).outerHeight(true) - $(element).height() + 2;
        });


        var headerHeight = 0;
        _.each($(".header"), function (element) {
            headerHeight += $(element)
                    .outerHeight(true) + 2;
        });

        chartData.svgWidth = w;
        chartData.svgHeight = Math.max(windowHeight - headerHeight - padding, 400);

        return chartData;
    }
    ,
    _setDimensions: function (chartData) {

        chartData.margin = {top: 16 * 3.24, right: 100, bottom: 16 * 1.62, left: 100}; //assume 16px for font, line-height is 1.62em

        chartData.width = chartData.svgWidth - chartData.margin.left - chartData.margin.right;
        chartData.height = chartData.svgHeight - chartData.margin.top - chartData.margin.bottom;

        chartData.d3Chart.attr("width", chartData.svgWidth)
            .attr("height", chartData.svgHeight);

        return chartData;
    }
    ,
    _drawAxis: function (chartData, g) {
        //date axis
        if (this.hasDuration(chartData) || this.hasResult(chartData)) {
            g.append("g")
                .attr("class", "axis data+e")
                .call(chartData.dateAxis);
        }

        //duration axis
        if (this.hasDuration(chartData)) {
            g.append("g")
                .attr("class", "axis duration")
                .call(chartData.durationAxis);
        }

        //results axis
        if (this.hasResult(chartData)) {
            g.append("g")
                .attr("class", "axis results")
                .attr("transform", "translate(" + chartData.width + ",0)")
                .call(chartData.resultsAxis);
        }
        return chartData;
    },
    _extractTrackTooltip: function (track) {
        var html = "";
        html += Meteor.tracker.TOKEN_TRACK + track.track;
        if (track.duration) {
            html += " ";
            html += Meteor.tracker.printDuration(track.duration);
        }
        if (track.results) {
            html += "\n";
            if (track.results) {
                html += Meteor.tracker.printArray(track.results, " ");
            }

        }
        html += "\n" + Meteor.tracker.printDay(track.date);

        return html;
    },
    _extractResultTooltip: function (resultBucket, result) {
        var html = "";
        html += Meteor.tracker.TOKEN_TRACK + resultBucket.trackBucket.name + " " + result.result + resultBucket.name;
        html += "\n";
        if (result.duration) {
            html += Meteor.tracker.printDuration(result.duration) + " ";
        }
        if (result.allResults.length > 1) {
            html += Meteor.tracker.printArray(result.allResults, " ");
        }
        html += "\n" + Meteor.tracker.printDay(result.date);

        return html;
    },
    _wrap: function (text, width) {
        text.each(function () {
            var text = d3.select(this),
                lines = text.text().split(/\n/).reverse(),
                desiredLine,
                lineNumber = 0,
                lineHeight = 1.62, // ems
                x = text.attr("x"),
                y = text.attr("y"),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).style("alignment-baseline", "before-edge");

            while (desiredLine = lines.pop()) {
                var words = desiredLine.split(/\s+/).reverse(),
                    word,
                    line = [];

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").style("alignment-baseline", "before-edge").text(word);
                    }
                }
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").style("alignment-baseline", "before-edge").text(null);
            }

        });
    },
    _drawDurationLine: function (chartData, g, trackBucket) {
        if (trackBucket.tracks.length > 1) {
            g.append("path")
                .attr("class", "line duration " + trackBucket.name)
                .attr("d", chartData.durationLine(trackBucket.tracks));
        }
        _.each(trackBucket.tracks, function (track) {
            Meteor.chart._drawDurationDot(chartData, g, track);
        });

        return chartData;
    },
    _drawDurationDot: function (chartData, g, track) {
        if (!isNaN(track.duration)) {
            //this circle is for display
            g.append("circle")
                .attr("class", "dot duration " + track.track)
                .attr("r", 4)
                .attr("cx", chartData.dateScale(track.date))
                .attr("cy", chartData.durationScale(track.duration))

            //this circle is to increase the hover area
            var id = Meteor.tracker.uid();
            g.append("circle")
                .attr("class", "dot duration hover " + track.track)
                .attr("r", 10)
                .attr("cx", chartData.dateScale(track.date))
                .attr("cy", chartData.durationScale(track.duration))
                .attr("fill", "transparent")
                .on("mouseover", function (d, i) {
                    chartData.d3Chart.append("rect")
                        .attr({
                            id: id + "-background",
                            x: function () {
                                return chartData.dateScale(track.date) - 3;
                            },
                            y: function () {
                                return chartData.durationScale(track.duration) - 3;
                            }
                        })
                        .attr("fill", "#222");

                    chartData.d3Chart.append("text")
                        .attr({
                            id: id + "-text",
                            x: function () {
                                return chartData.dateScale(track.date);
                            },
                            y: function () {
                                return chartData.durationScale(track.duration);
                            }
                        })
                        .attr("transform", "translate(" + chartData.margin.left + "," + chartData.margin.top + ")")
                        .style("font-size", ".82em")
                        .attr("fill", "white")
                        .text(Meteor.chart._extractTrackTooltip(track))
                        .call(Meteor.chart._wrap, chartData.svgWidth - chartData.margin.left - chartData.dateScale(track.date) - 6)
                        .attr("transform", "translate(" + (chartData.margin.left + 3) + "," + (chartData.margin.top - d3.select("#" + id + "-text").node().getBBox().height - 6 ) + ")");

                    d3.select("#" + id + "-background")
                        .attr("width", d3.select("#" + id + "-text").node().getBBox().width + 6)
                        .attr("height", d3.select("#" + id + "-text").node().getBBox().height + 6)
                        .attr("transform", "translate(" + (chartData.margin.left + 3) + "," + (chartData.margin.top - d3.select("#" + id + "-text").node().getBBox().height - 6 ) + ")");

                })
                .on("mouseout", function (d, i) {
                    d3.select("#" + id + "-text").remove();
                    d3.select("#" + id + "-background").remove();
                });
        }
        return chartData;
    },
    _drawResultLine: function (chartData, g, resultBucket) {
        if (resultBucket.results.length > 1) {
            g.append("path")
                .attr("class", "line results " + resultBucket.name)
                .attr("d", chartData.resultsLine(resultBucket.results))
                .attr("stroke", Meteor.chart._getResultColor(chartData, resultBucket.name));
        }
        _.each(resultBucket.results, function (result) {
            Meteor.chart._drawResultDot(chartData, g, resultBucket, result);
        });
        return chartData;
    },
    _drawResultDot: function (chartData, g, resultBucket, result) {
        if (!isNaN(result.result)) {
            //this circle is for display
            g.append("circle")
                .attr("class", "dot results " + resultBucket.name)
                .attr("r", 4)
                .attr("cx", chartData.dateScale(result.date))
                .attr("cy", chartData.resultScale(result.result))
                .attr("fill", Meteor.chart._getResultColor(chartData, resultBucket.name))

            //this circle is to increase the hover area

            var id = Meteor.tracker.uid();
            g.append("circle")
                .attr("class", "dot results hover " + resultBucket.name)
                .attr("r", 10)
                .attr("cx", chartData.dateScale(result.date))
                .attr("cy", chartData.resultScale(result.result))
                .attr("fill", "transparent")
                .on("mouseover", function (d, i) {
                    chartData.d3Chart.append("rect")
                        .attr({
                            id: id + "-background",
                            x: function () {
                                return chartData.dateScale(result.date) - 3;
                            },
                            y: function () {
                                return chartData.resultScale(result.result) - 3;
                            }
                        })
                        .attr("fill", Meteor.chart._getResultColor(chartData, resultBucket.name));


                    chartData.d3Chart.append("text")
                        .attr({
                            id: id + "-text",
                            x: function () {
                                return chartData.dateScale(result.date);
                            },
                            y: function () {
                                return chartData.resultScale(result.result);
                            }
                        })
                        .attr("transform", "translate(" + chartData.margin.left + "," + chartData.margin.top + ")")
                        .attr("fill", "white")
                        .style("font-size", ".82em")
                        .text(Meteor.chart._extractResultTooltip(resultBucket, result))
                        .call(Meteor.chart._wrap, chartData.svgWidth - chartData.margin.left - chartData.dateScale(result.date) - 6)
                        .attr("transform", "translate(" + (chartData.margin.left + 3) + "," + (chartData.margin.top - d3.select("#" + id + "-text").node().getBBox().height - 6 ) + ")");

                    d3.select("#" + id + "-background")
                        .attr("width", d3.select("#" + id + "-text").node().getBBox().width + 6)
                        .attr("height", d3.select("#" + id + "-text").node().getBBox().height + 6)
                        .attr("transform", "translate(" + (chartData.margin.left + 3) + "," + (chartData.margin.top - d3.select("#" + id + "-text").node().getBBox().height - 6 ) + ")");


                })
                .on("mouseout", function (d, i) {
                    d3.select("#" + id + "-text").remove();
                    d3.select("#" + id + "-background").remove();

                });

        }

        return chartData;
    },
    _drawTracks: function (chartData, g) {
        if (chartData.trackFilter.hasOneOn()) {
            _.each(chartData.trackBuckets, function (trackBucket) {
                if (chartData.trackFilter.isOn(trackBucket.name)) {
                    Meteor.chart._drawDurationLine(chartData, g, trackBucket);
                    _.each(trackBucket.resultBuckets, function (resultBucket) {
                        if (chartData.resultFilter.isOn(resultBucket.name)) {
                            Meteor.chart._drawResultLine(chartData, g, resultBucket);
                        }
                    });
                }
            });
        } else if (chartData.resultFilter.hasOneOn()) {
            _.each(chartData.trackBuckets, function (trackBucket) {
                _.each(trackBucket.resultBuckets, function (resultBucket) {
                    if (chartData.resultFilter.isOn(resultBucket.name)) {
                        Meteor.chart._drawResultLine(chartData, g, resultBucket);
                    }
                });
            });

        }

        return chartData;
    },
    hasDuration: function (chartData) {
        if (chartData.trackFilter.hasOneOn()) {
            var allOn = chartData.trackFilter.getAllOn();

            for (var i = 0; i < allOn.length; i++) {

                var trackBucket = this._trackBucket(chartData, allOn[i]);
                if (trackBucket.duration) {
                    return true;
                }
            }
        }

        return false;
    },
    hasResult: function (chartData) {
        return chartData.resultFilter.hasOneOn();
    },
    prepare: function (load) {

        var chartData = this.chartData;
        chartData.d3Chart = Meteor.chart.d3Chart();
        this._clearChartDrawing(chartData);

        if (load) {
            this._loadData(chartData);
            this._setResultColorScale(chartData);
        }

        //set bucket names.
        //track and result bucket names must be set before detecting
        //dimensions, otherwise the chart will have too much height
        $("#trackBucketNames")
            .html(Meteor.chart._trackBucketNameHtml(chartData));
        $("#resultBucketNames")
            .html(Meteor.chart._resultBucketNameHtml(chartData));

        this._detectDimensions(chartData);
        this._setDimensions(chartData);
    },
    draw: function (loadData) {
        this.prepare(loadData);
        var chartData = this.chartData;

        if (this.hasDuration(chartData) || this.hasResult(chartData)) {
            $("#chart").show();
            this._scaling(chartData);

            //chart
            var g = chartData.d3Chart.append("g")
                .attr("transform", "translate(" + chartData.margin.left + "," + chartData.margin.top + ")");
            this._drawAxis(chartData, g);
            this._drawTracks(chartData, g);
        } else {
            $("#chart").hide();
        }
    }
}


Template.chart.events({
    "click .track-bucket-names a.reset-filter": function (event) {
        event.preventDefault();
        Meteor.chart.chartData.trackFilter.clearToggles();
        Meteor.chart.chartData.resultFilter.clearToggles();
        Meteor.chart.draw();
    },
    "click .track-bucket-names a.filter": function (event) {
        event.preventDefault();
        var trackName = event.target.name;
        Meteor.chart.chartData.trackFilter.toggle(trackName);
        Meteor.chart.draw();
    },
    "click .result-bucket-names a.filter": function (event) {
        event.preventDefault();
        var resultName = event.target.name;
        Meteor.chart.chartData.resultFilter.toggle(resultName);
        Meteor.chart.draw();
    }

});


Template.chart.onCreated(function () {

    var _self = this;
    _self.loaded = new ReactiveVar(0);

    this.autorun(function () {
        var limit, subscription;

        subscription = _self.subscribe("TrackData");
        limit = Meteor.tracks.getLimit();

        if (subscription.ready()) {
            if (!Meteor.queryTracks.hasQuery()) {
                _self.loaded.set(limit);
            }
            Meteor.chart.draw(true);
        }
    });

    _self.tracks = function () {
        if (Meteor.queryTracks.hasQuery()) {
            return TrackData.find(Meteor.queryTracks.getQuery(), {sort: {date: -1, track: 1}});
        } else {
            return TrackData.find({}, {limit: _self.loaded.get(), sort: {date: -1, track: 1}});
        }
    }
});

Template.chart.rendered = function () {
    $(window)
        .resize(function () {
            Meteor.chart.draw();
        });

};