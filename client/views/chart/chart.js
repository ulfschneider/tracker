Meteor.chart = {
    d3Chart: function () {
        return d3.select("#chart");
    },
    jQueryChart: function () {
        return $("#chart");
    },
    loadData: function (chartData) {
        chartData.data =  Template.instance().tracks().fetch();
        return chartData;
    },
    setX: function (chartData) {
        chartData.x = d3.scale.linear()
            .rangeRound([0, chartData.width]);
        return chartData;
    },
    setY: function (chartData) {
        chartData.y = d3.scale.linear()
            .rangeRound([chartData.height, 0]);
        return chartData;
    },
    setDurationLine: function(chartData) {
        chartData.durationLine = d3.svg.line()
            .x(function(d) { return  chartData.x(d.date); })
            .y(function(d) { return  chartData.y(d.duration); });
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

        chartData.width = w;
        chartData.height = Math.max(windowHeight - headerHeight - padding, 400);

        return chartData;
    }
    ,
    setDimensions: function (chartData) {
        var d3Chart = chartData.d3Chart;
        d3Chart.attr("width", chartData.width).attr("height", chartData.height);
    },
    draw: function () {
        var chartData = {
            d3Chart: Meteor.chart.d3Chart()
        };

        Meteor.chart.loadData(chartData);
        Meteor.chart.detectDimensions(chartData);
        Meteor.chart.setDimensions(chartData);

     //   Meteor.chart.setX(chartData);
      //  Meteor.chart.setY(chartData);
      //  Meteor.chart.setDurationLine(chartData);

      //  console.log(JSON.stringify(chartData.data));
      //  console.log(JSON.stringify(chartData.durationLine));

      //  chartData.d3Chart.append("svg:path").attr("d", chartData.durationLine(chartData.data));
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
            Meteor.chart.draw();
        }
    });

    instance.tracks = function () {
        return TrackData.find({}, {limit: instance.loaded.get(), sort: {date: -1, track: 1} });
    }

});

Template.chart.rendered = function () {
    $(window).resize(function () {
        Meteor.chart.draw();
    });

};