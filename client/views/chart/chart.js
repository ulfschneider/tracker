Meteor.chart = {
    chartData: null,
    d3Chart: function () {
        return d3.select("#chart");
    },
    jQueryChart: function () {
        return $("#chart");
    },
    clear: function(chartData) {
        chartData.d3Chart.selectAll("*").remove();
        return chartData;
    },
    loadData: function (chartData) {
        chartData.data = Template.instance().tracks().fetch();
        chartData.durationMin = d3.min(chartData.data, function (d) {
            return d.duration;
        });
        chartData.durationMax = d3.max(chartData.data, function (d) {
            return d.duration;
        });
        chartData.dateMin = d3.min(chartData.data, function (d) {
            return d.date;
        });
        chartData.dateMax = d3.max(chartData.data, function (d) {
            return d.date;
        });
        chartData.resultsMin = d3.min(chartData.data, function (d) {
            return d.results ? d3.min(d.results, function (r) {
                return parseFloat(r);
            }) : chartData.resultsMin;
        });
        chartData.resultsMax = d3.max(chartData.data, function (d) {
            return d.results ? d3.max(d.results, function (r) {
                return parseFloat(r);
            }) : chartData.resultsMax;
        });
        return chartData;
    },
    setDateScale: function (chartData) {
        chartData.dateScale = d3.time.scale().domain([chartData.dateMin, chartData.dateMax])
            .rangeRound([0, chartData.width]);
        chartData.dateAxis = d3.svg.axis().scale(chartData.dateScale).orient("top");
        return chartData;
    },
    setDurationScale: function (chartData) {
        chartData.durationScale = d3.scale.linear().domain([chartData.durationMin, chartData.durationMax])
            .rangeRound([chartData.height, 0]);
        chartData.durationAxis = d3.svg.axis().scale(chartData.durationScale).orient("left").innerTickSize(-chartData.width)
            .outerTickSize(0)
            .tickPadding(7).tickFormat(Meteor.tracker.durationPrint);
        return chartData;
    },
    setDurationLine: function (chartData) {
        chartData.durationLine = d3.svg.line()
            .x(function (d) {
                return chartData.dateScale(d.date);
            })
            .y(function (d) {
                return d.duration ? chartData.durationScale(d.duration) : chartData.durationMin;
            });
        return chartData;
    },
    setResultsScale: function (chartData) {
        chartData.resultsScale = d3.scale.linear().domain([chartData.resultsMin, chartData.resultsMax])
            .rangeRound([chartData.height, 0]);
        chartData.resultsAxis = d3.svg.axis().scale(chartData.resultsScale).orient("right");
        return chartData;
    },

    detectDimensions: function (chartData) {
        var jQueryChart = Meteor.chart.jQueryChart();
        chartData.jQueryChart = jQueryChart;

        var w = jQueryChart.parent().width();

        var padding = jQueryChart.parent().outerHeight(true) - jQueryChart.parent().height() + 2;
        var windowHeight = $(window).height();

        var headerHeight = 0;
        _.each($(".header"), function (element) {
            headerHeight += $(element).outerHeight(true) + 2;
        });

        chartData.svgWidth = w;
        chartData.svgHeight = Math.max(windowHeight - headerHeight - padding, 200);

        return chartData;
    }
    ,
    setDimensions: function (chartData) {

        chartData.margin = {top: 16 * 1.62, right: 100, bottom: 16*1.62, left: 100};

        chartData.width = chartData.svgWidth - chartData.margin.left - chartData.margin.right;
        chartData.height = chartData.svgHeight - chartData.margin.top - chartData.margin.bottom;

        chartData.d3Chart.attr("width", chartData.svgWidth).attr("height", chartData.svgHeight);

        return chartData;
    },
    draw: function (reload) {

        if (!Meteor.chart.chartData) {
            Meteor.chart.chartData = {
                d3Chart: Meteor.chart.d3Chart()
            }
        }

        var chartData = Meteor.chart.chartData;

        Meteor.chart.clear(chartData);
        Meteor.chart.detectDimensions(chartData);
        Meteor.chart.setDimensions(chartData);


        if (reload) {
            Meteor.chart.loadData(chartData);
        }

        Meteor.chart.setDateScale(chartData);
        Meteor.chart.setDurationScale(chartData);
        Meteor.chart.setDurationLine(chartData);
        Meteor.chart.setResultsScale(chartData);


        var g = chartData.d3Chart.append("g").attr("transform", "translate(" + chartData.margin.left + "," + chartData.margin.top + ")");

        g.append("g").attr("class", "date axis")
            .call(chartData.dateAxis);


        g.append("g").attr("class", "duration axis")
            .call(chartData.durationAxis);


        g.append("g").attr("class", "results axis").attr("transform", "translate(" + chartData.width + ",0)")
            .call(chartData.resultsAxis);

        g.append("path").attr("class", "duration").attr("d", chartData.durationLine(chartData.data));

    }
}


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
        return TrackData.find({}, {limit: instance.loaded.get(), sort: {date: -1, track: 1}});
    }


});

Template.chart.rendered = function () {
    $(window).resize(function () {
        Meteor.chart.draw();
    });

};