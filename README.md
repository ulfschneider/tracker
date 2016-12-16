Tracker
===

File your workout routines and get a nice graphical 
overview of your personal achievements and improvements.

Tracker is free. It is built and shared by [Ulf Schneider](http://ulf.codes).

![](/public/r/tracker.jpg)

File a track
---

An example of a filed track is:

> Today 13:30 #bike 3h46m 94.6km 25.06km/h 995mtr-up //cold ride, started at minus 5°C and came back at plus 5°C

Step by step:

Just bring the caret into the text entry field which is labeled **File your track**.

Give your track a name. The name must start with **#** or **@**. E.g. use **#bike** to file your epic bike rides.

In the example above the ride took 3 hours and 46 minutes (**3h46m**). To make the time units of your duration 
clear, use **d** for days, **h** for hours, **m** for minutes, **s** for seconds or even **i** for milliseconds.

Bring in any other unit which is of interest for you by writing down the number first and adding the unit without 
a space between the number and the unit. In the above example we keep track of the distance (**94.6km**), the average 
speed (**25.06km/h**) and the meters up (**995mtr-up**). You decide how your units are being named.

Add a comment, if you like. Everything that comes behind the double slash **//** is treated as a comment. 
A comment may contain links to web pages.

If you don´t specify a date or a time, your track will be filed with the current date and time. 
You can specify a different date or time in the format **YY-MM-DD HH:mm** (omit the the time or the date if either one is not needed). 
The time format **HH:mm** is 24 hours. If you file a track for the last seven days, you can use the following shortcuts for the date: 
**today**, **yest**, **yesterday**, **mon**, **tue**, **wed**, **thu**, **fri**, **sat**, **sun**.

Submit your track by pressing ENTER or clicking/touching the Submit button.

Display tracks
---

Tracks are being displayed in two ways: as an ordered table, where the most recent activities are listed at the top,
and as a chart, which will visualize all tracks that are contained in the ordered table.

In the chart you can filter down further and hide away those tracks you are currently not interested in.
The filter controls visualize the total duration of your tracks, as well as the sum for any other unit that you collected.
There is one special case for your own units - if the unit contains a slash (/), like in km/h, which means kilometers per hour, the
units are not simply summed up but the average is being calculated. All figures are only for the currently filtered tracks.

Query tracks
---

Analyze your data by querying specific tracks and time ranges. 
Place your queries in the text entry field labeled **Query tracks**. An example of a query is:

> oct..dec #bike

This will list all #bike tracks for october, november and december of the current year.

You can select multiple tracks in one query, like **#bike #run**, which would select all #bike and #run tracks.

The time range selector allows you to do the following:

Query an entire year, like 2016: **16** or **2016**

Query a month, like august: **aug**

Query a range of months for the current year, like in the above example october to december: **oct..dec**

Query everything from a given date, like from 1st of march 2015: **2015-03-01..**

Query everything up to a given date, like up to 9th of october 2016: **..2016-10-09**

Query a date range, like from 1st of march 2015 to 9th of october 2016: **2015-03-01..2016-10-09**

Submit your query by pressing ENTER or clicking/touching the Query button.

Enjoy your sports routine!