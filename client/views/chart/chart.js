import {ChartFilter} from "/client/views/chart/chartFilter.js";

Meteor.chart = {
    chartData: null,

    d3Chart: function () {
        return d3.select("#chart");
    },
    jQueryChart: function () {
        return $("#chart");
    },
    _clearChartDrawing: function (chartData) {
        chartData.d3Chart.selectAll("*")
            .remove();
        $("#trackBucketNames")
            .hide();
        $("#chart")
            .hide();
        return chartData;
    },
    _trackBucketNameHtml: function (chartData) {
        var html = "";
        if (!chartData.trackFilter.isEmpty() || !!chartData.resultFilter.isEmpty()) {
            html += "<ul class='track-bucket-names'>";

            if (chartData.trackFilter.isAllOff() && chartData.resultFilter.isAllOff()) {
                html += "<li>Track filter:</li>";
            } else {
                html += '<li><a href="#" class="reset-filter">Reset filter</a>:';
            }
            _.each(chartData.trackFilter.getAll(), function (n) {
                html += '<li><a name="' + n + '"';
                html += ' href="#"';
                html += ' class="track filter ' + (chartData.trackFilter.isOn(n) ? "on" : "off") + '"';
                html += '>#' + n + '</a></li>';
            });
            html += "</ul>"
        }
        return html;
    },
    _resultBucketsForTracks: function (chartData) {
        if (chartData.trackFilter.hasOneOn()) {
            var buckets = new Set();
            _.each(chartData.trackBuckets, function (trackBucket) {
                if (chartData.trackFilter.isOn(trackBucket.name)) {
                    _.each(trackBucket.resultBuckets, function (resultBucket) {
                        buckets.add(resultBucket.name);
                    });
                }
            });
            return Array.from(buckets);
        } else {
            return chartData.resultFilter.getAll();
        }
    },
    _resultBucketNameHtml: function (chartData) {
        var html = "";

        if (!chartData.resultFilter.isEmpty()) {
            html += "<ul class='result-bucket-names'>";

            _.each(Meteor.chart._resultBucketsForTracks(chartData), function (n) {
                html += '<li><a name="' + n + '"';
                html += ' href="#"';
                if (chartData.resultFilter.isOn(n)) {
                    html += ' style="background:' + Meteor.chart._getResultColor(chartData, n) + '; color:white;"';
                    html += ' class="result filter on"';
                } else {
                    html += ' style="color:' + Meteor.chart._getResultColor(chartData, n) + ';"';
                    html += ' class="result filter off"';
                }
                html += '>' + (n.length ? n : "pure") + '</a></li>';
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
            var durationPadding = Math.round(duration / 100 * 5); //5% padding
            chartData.durationMax += durationPadding;
            if (chartData.durationMin - durationPadding >= 0) {
                chartData.durationMin -= durationPadding;
            }
        }

        if (!_.isUndefined(chartData.resultsMax) && !_.isUndefined(chartData.resultsMin)) {
            if (isNaN(chartData.resultsMin) || chartData.resultsMin == chartData.resultsMax) {
                chartData.resultsMin = 0;
            }
            var results = chartData.resultsMax - chartData.resultsMin;
            var resultsPadding = Math.round(results / 100 * 5); //5% padding
            chartData.resultsMax += resultsPadding;
            if (chartData.resultsMin - resultsPadding >= 0) {
                chartData.resultsMin -= resultsPadding;
            }
        }
        return chartData;
    },
    _extractResult: function (result) {
        return parseFloat(result);
    },
    _extractResultBucket: function (result) {
        var bucket = "";
        var number = Meteor.chart._extractResult(result);
        if (!isNaN(number)) {
            var numberString = number.toString();
            var idx = result.indexOf(numberString);

            if (idx == 0) {
                bucket = result.substr(idx + numberString.length, result.length);
            }
        }
        return bucket;
    },
    _addToResultBucket: function (chartData, trackBucket, date, result) {
        var number = Meteor.chart._extractResult(result);

        if (!trackBucket["resultBuckets"]) {
            trackBucket.resultBuckets = [];
        }

        var buckets = trackBucket.resultBuckets;
        var resultBucket = Meteor.chart._extractResultBucket(result);

        for (var i = 0; i < buckets.length; i++) {
            if (buckets[i].name.toLowerCase() == resultBucket.toLowerCase()) {
                buckets[i].results.push({date: date, result: number});
                return trackBucket;
            }
        }
        buckets.push({name: resultBucket, results: [{date: date, result: number}]});
        chartData.resultFilter.add(resultBucket);

        return trackBucket;
    },
    _addToTrackBucket: function (chartData, t) {
        if (!chartData["trackBuckets"]) {
            chartData.trackBuckets = [];
        }
        var buckets = chartData.trackBuckets;
        for (var i = 0; i < buckets.length; i++) {
            if (buckets[i].name.toLowerCase() == t.track.toLowerCase()) {
                buckets[i].tracks.push(t);

                _.each(t.results, function (result) {
                    Meteor.chart._addToResultBucket(chartData, buckets[i], t.date, result);
                });
                return chartData;
            }
        }
        buckets.push({name: t.track, tracks: [t]});
        _.each(t.results, function (result) {
            Meteor.chart._addToResultBucket(chartData, buckets[buckets.length - 1], t.date, result);
        });

        chartData.trackFilter.add(t.track);
        return chartData;
    },
    _calcMinMax: function (chartData) {
        delete chartData.durationMin;
        delete chartData.durationMax;
        delete chartData.dateMin;
        delete chartData.dateMax;
        delete chartData.dateMin;
        delete chartData.resultsMin;
        delete chartData.resultsMax;

        chartData.durationMin = d3.min(chartData.chartData, function (d) {
            if (chartData.trackFilter.has(d.track) || chartData.trackFilter.isEmpty()) {
                return d.duration;
            } else {
                return chartData.durationMin;
            }
        });
        chartData.durationMax = d3.max(chartData.chartData, function (d) {
            if (chartData.trackFilter.has(d.track) || chartData.trackFilter.isEmpty()) {
                return d.duration;
            } else {
                return chartData.durationMax;
            }
        });
        chartData.dateMin = d3.min(chartData.chartData, function (d) {
            if (chartData.trackFilter.has(d.track) || chartData.trackFilter.isEmpty()) {
                return d.date;
            } else {
                return chartData.dateMin;
            }
        });
        chartData.dateMax = d3.max(chartData.chartData, function (d) {
            if (chartData.trackFilter.has(d.track) || chartData.trackFilter.isEmpty()) {
                return d.date;
            } else {
                return chartData.dateMax;
            }
        });
        chartData.resultsMin = d3.min(chartData.chartData, function (d) {
            if (chartData.trackFilter.has(d.track) || chartData.trackFilter.isEmpty()) {
                return d.results ? d3.min(d.results, function (r) {
                    return parseFloat(r);
                }) : chartData.resultsMin;
            } else {
                return chartData.resultsMin;
            }
        });
        chartData.resultsMax = d3.max(chartData.chartData, function (d) {
            if (chartData.trackFilter.has(d.track) || chartData.trackFilter.isEmpty()) {
                return d.results ? d3.max(d.results, function (r) {
                    return parseFloat(r);
                }) : chartData.resultsMax;
            } else {
                return chartData.resultsMax;
            }
        });
    },
    _prepareBuckets: function (chartData) {

        //reset data
        delete chartData.trackBuckets;

        if (!chartData["trackFilter"]) {
            chartData.trackFilter = new ChartFilter();
        } else {
            chartData.trackFilter.clear();
        }
        if (!chartData["resultFilter"]) {
            chartData.resultFilter = new ChartFilter();
        } else {
            chartData.resultFilter.clear();
        }

        //prepare track buckets and result buckets
        _.each(chartData.chartData, function (d) {
            Meteor.chart._addToTrackBucket(chartData, d);
        });
        _.sortBy(chartData.trackBuckets, function (t) {
            return t.name.toLowerCase();
        });
    },
    _scaling: function (chartData) {
        Meteor.chart._calcMinMax(chartData);
        Meteor.chart._addDomainPadding(chartData);

        Meteor.chart._setDateScale(chartData);
        Meteor.chart._setDurationScale(chartData);
        Meteor.chart._setResultsScale(chartData);
        Meteor.chart._setResultColorScale(chartData);

        Meteor.chart._setDurationLine(chartData);
        Meteor.chart._setResultsLine(chartData);

        return chartData;
    },
    _loadData: function (chartData) {

        chartData.chartData = Template.instance()
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
            .innerTickSize(-chartData.width)
            .outerTickSize(0)
            .tickPadding(10)
            .tickFormat(Meteor.tracker.durationPrint);
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
        chartData.resultsScale = d3.scale.linear()
            .domain([chartData.resultsMin, chartData.resultsMax])
            .rangeRound([chartData.height, 0]);
        chartData.resultsAxis = d3.svg.axis()
            .scale(chartData.resultsScale)
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
                return chartData.resultsScale(d.result);
            });
        return chartData;
    }
    ,
    _setResultColorScale: function (chartData) {
        chartData.resultColorScale = d3.scale.ordinal()
            .domain(chartData.resultFilter.getAll())
            .range(d3.scale.category20().range());
        return chartData;
    },
    _getResultColor: function (chartData, resultName) {
        resultName = resultName.toLowerCase();
        return chartData.resultColorScale(resultName);
    },

    _detectDimensions: function (chartData) {
        var jQueryChart = Meteor.chart.jQueryChart();
        chartData.jQueryChart = jQueryChart;

        var w = jQueryChart.parent()
            .width();

        var padding = jQueryChart.parent()
                .outerHeight(true) - jQueryChart.parent()
                .height() + 2;
        var windowHeight = $(window)
            .height();

        var headerHeight = 0;
        _.each($(".header"), function (element) {
            headerHeight += $(element)
                    .outerHeight(true) + 2;
        });

        chartData.svgWidth = w;
        chartData.svgHeight = Math.max(windowHeight - headerHeight - padding, 200);

        return chartData;
    }
    ,
    _setDimensions: function (chartData) {

        chartData.margin = {top: 16 * 1.62, right: 100, bottom: 16 * 1.62, left: 100};

        chartData.width = chartData.svgWidth - chartData.margin.left - chartData.margin.right;
        chartData.height = chartData.svgHeight - chartData.margin.top - chartData.margin.bottom;

        chartData.d3Chart.attr("width", chartData.svgWidth)
            .attr("height", chartData.svgHeight);

        return chartData;
    }
    ,
    _drawAxis: function (chartData, g) {
        //date axis
        g.append("g")
            .attr("class", "date axis")
            .call(chartData.dateAxis);

        //duration axis
        g.append("g")
            .attr("class", "duration axis")
            .call(chartData.durationAxis);

        //results axis
        g.append("g")
            .attr("class", "results axis")
            .attr("transform", "translate(" + chartData.width + ",0)")
            .call(chartData.resultsAxis);
        return chartData;
    },
    _drawDurationLine: function (chartData, g, trackBucket) {
        if (trackBucket.tracks.length > 1) {
            g.append("path")
                .attr("class", "duration line " + trackBucket.name)
                .attr("d", chartData.durationLine(trackBucket.tracks));
        }
        _.each(trackBucket.tracks, function (track) {
            Meteor.chart._drawDurationDot(chartData, g, trackBucket, track);
        });

        return chartData;
    },
    _drawDurationDot: function (chartData, g, trackBucketName, data) {
        if (!isNaN(data.duration)) {
            g.append("circle")
                .attr("class", "duration dot " + trackBucketName)
                .attr("r", 4)
                .attr("cx", chartData.dateScale(data.date))
                .attr("cy", chartData.durationScale(data.duration))
        }
        return chartData;
    },
    _drawResultLine: function (chartData, g, resultBucket) {
        if (resultBucket.results.length > 1) {
            g.append("path")
                .attr("class", "results line " + resultBucket.name)
                .attr("d", chartData.resultsLine(resultBucket.results))
                .attr("stroke", Meteor.chart._getResultColor(chartData, resultBucket.name));
        }
        _.each(resultBucket.results, function (result) {
            Meteor.chart._drawResultDot(chartData, g, resultBucket.name, result);
        });
        return chartData;
    },
    _drawResultDot: function (chartData, g, resultBucketName, data) {
        if (!isNaN(data.result)) {
            g.append("circle")
                .attr("class", "results dot " + resultBucketName)
                .attr("r", 4)
                .attr("cx", chartData.dateScale(data.date))
                .attr("cy", chartData.resultsScale(data.result))
                .attr("fill", Meteor.chart._getResultColor(chartData, resultBucketName));
        }

        return chartData;
    },
    _drawTracks: function (chartData, g) {
        _.each(chartData.trackBuckets, function (trackBucket) {
            if (trackBucket.tracks.length && (chartData.trackFilter.isAllOff() || chartData.trackFilter.isOn(trackBucket.name))) {

                if ((chartData.resultFilter.hasOneOn() && chartData.trackFilter.isOn(trackBucket.name)) || chartData.resultFilter.isAllOff()) {
                    Meteor.chart._drawDurationLine(chartData, g, trackBucket);
                }
                _.each(trackBucket.resultBuckets, function (resultBucket) {
                    if (chartData.resultFilter.isAllOff() || chartData.resultFilter.isOn(resultBucket.name)) {
                        Meteor.chart._drawResultLine(chartData, g, resultBucket);
                    }
                });
            }
        });

        return chartData;
    },
    draw: function (reload) {
        if (!Meteor.chart.chartData) {
            reload = true;
        }
        if (reload) {
            Meteor.chart.chartData = {
                d3Chart: Meteor.chart.d3Chart()
            }
        }

        var chartData = Meteor.chart.chartData;
        Meteor.chart._clearChartDrawing(chartData);
        Meteor.chart._detectDimensions(chartData);
        Meteor.chart._setDimensions(chartData);

        if (reload) {
            Meteor.chart._loadData(chartData);
        }

        if (chartData.chartData.length >= 1) {
            $("#trackBucketNames")
                .show();
            $("#chart")
                .show();

            Meteor.chart._scaling(chartData);

            //chart
            var g = chartData.d3Chart.append("g")
                .attr("transform", "translate(" + chartData.margin.left + "," + chartData.margin.top + ")");
            Meteor.chart._drawAxis(chartData, g);
            Meteor.chart._drawTracks(chartData, g);

            //set bucket names
            $("#trackBucketNames")
                .html(Meteor.chart._trackBucketNameHtml(chartData));
            $("#resultBucketNames")
                .html(Meteor.chart._resultBucketNameHtml(chartData));
        }
    }
}


Template.chart.events({
    "click .track-bucket-names a.reset-filter": function (event) {
        Meteor.chart.chartData.trackFilter.clearToggles();
        Meteor.chart.chartData.resultFilter.clearToggles();
        Meteor.chart.draw(false);
    },
    "click .track-bucket-names a.filter": function (event) {
        var trackName = event.target.name;
        Meteor.chart.chartData.trackFilter.toggle(trackName);
        Meteor.chart.draw(false);
    },
    "click .result-bucket-names a.filter": function (event) {
        var resultName = event.target.name;
        Meteor.chart.chartData.resultFilter.toggle(resultName);
        Meteor.chart.draw(false);
    }

});


Template.chart.onCreated(function () {

    var instance = this;
    instance.loaded = new ReactiveVar(0);

    this.autorun(function () {
        var limit = Meteor.tracks.getLimit();
        var subscription = instance.subscribe('TrackData', limit);
        if (subscription.ready()) {
            instance.loaded.set(limit);
            Meteor.chart.draw(true);
        }
    });

    instance.tracks = function () {
        return TrackData.find({}, {limit: instance.loaded.get(), sort: {date: 1, track: 1}});
    }
});

Template.chart.rendered = function () {
    $(window)
        .resize(function () {
            Meteor.chart.draw();
        });

};