var htmlCode;

document.addEventListener('DOMContentLoaded', () => {
    var scraped = chrome.tabs.executeScript({code: 'document.documentElement.outerHTML'},
        function(scraped) {
            htmlCode = scraped[0];
        }
    ); 
    
});

window.addEventListener('DOMContentLoaded', () =>  {
    // Set default value for html date inputs
    document.getElementsByClassName('startDate')[0].value = new Date().toDateInputValue();
    document.getElementsByClassName('endDate')[0].value = new Date().toDateInputValue();

    // Clicks
    var getCalendar = document.getElementById('getCalendar');
    getCalendar.onclick = function() {
        /// RETRIEVE DATA FROM FORMS
        var formData = new FormData(document.querySelector('form'));
        var formItr = formData.entries()
        var startTime = new Date(formItr.next().value[0]);
        var endTime = new Date(formItr.next().value[1]);
        endTime.setHours(23,59,59);

        /// FIND WHICH CLASSES TO SAVE
        var currentDocument = new DOMParser().parseFromString(htmlCode, "text/html")
        var allClasses = currentDocument.getElementsByClassName("classTitle");
        var classToSave = []
        for (var i = 0; i < allClasses.length; i++) {
            var currentClass = allClasses[i].nextElementSibling;
            if (currentClass != undefined) {
                // Only include registered classes (not waitlisted)
                var statusIndicator = currentClass.getElementsByClassName("statusIndicator registered");
                if (statusIndicator != undefined && statusIndicator.length != 0) {
                    classToSave.push(allClasses[i]);
                }
            }
        }

        /// GET INFO ABOUT THE CLASS
        var classInfo = new Object();
        var counter = 0;
        classInfo.name = [];
        classInfo.startTime = [];
        classInfo.endTime = [];
        classInfo.weekDay = [];
        classInfo.location = [];

        for (var i = 0; i < classToSave.length; i++) {
            var currentClass = classToSave[i].nextElementSibling;
            var infoGet = currentClass.getElementsByClassName("meeting");
            var name = classToSave[i].innerText;

            for (var j = 0; j < infoGet.length; j++){
                counter++;
                var startTimeLoc = startTime;

                // LAB, LECTURE, DISCUSSION, LECTURE/DISCUSSION
                classInfo.name.push(name + ' ' + infoGet[j].children[0].innerText);

                var weekdays = infoGet[j].children[2].innerText;
                var weekdaysStr = '';
                var start = -1;
                for (var letter = 0; letter < weekdays.length; letter++) {
                    if (letter != 0) {
                        weekdaysStr += ','
                    }
                    switch (weekdays[letter]) {
                        case 'M':
                            weekdaysStr += "MO";
                            if (start == -1) {
                                start = 1;
                            }
                            break;
                        case 'T':
                            weekdaysStr += "TU";
                            if (start == -1) {
                                start = 2;
                            }
                            break;
                        case 'W':
                            weekdaysStr += "WE";
                            if (start == -1) {
                                start = 3;
                            }
                            break;
                        case 'R':
                            weekdaysStr += "TH";
                            if (start == -1) {
                                start = 4;
                            }
                            break;
                        case 'F':
                            weekdaysStr += "FR";
                            if (start == -1) {
                                start = 5;
                            }
                            break;
                    }
                }
                classInfo.weekDay.push(weekdaysStr);

                var time = infoGet[j].children[1].innerText;
                var times = time.split('-');
                var eachStart = times[0].split(' ');
                var eachEnd = times[1].split(' ');
                var timeStart = timeGet(eachStart[0], eachStart[1]);
                var timeEnd = timeGet(eachEnd[1], eachEnd[2]);

                if (startTimeLoc.getDay() != start) {
                    var shift = start - startTimeLoc.getDay();
                    startTimeLoc.setDate(startTimeLoc.getDate() + shift);
                }
                var beginning = startTimeLoc.toISOString();
                beginning.setHours(timeStart[0], timeStart[1]);
                classInfo.startTimeLoc.push(beginning);

                var ending = startTimeLoc.toISOString();
                ending.setHours(timeEnd[0], timeEnd[1]);
                classInfo.endTime.push(ending);

                classInfo.location.push(infoGet[j].children[3].innerText);
            }
        }

        /// CREATE THE FILE
        // ics format: https://tools.ietf.org/html/rfc5545

        // Heading
        var BEGIN = "BEGIN:VCALENDAR";
        var PRODID = "PRODID:-//Google Inc//Google Calendar 70.9054//EN";
        var VERSION = "VERSION:2.0";
        var CALSCALE = "CALSCALE:GREGORIAN";
        var METHOD = "METHOD:PUBLISH";
        var X_WR_CALNAME = "X-WR-CALNAME:Class";
        var X_WR_TIMEZONE = "X-WR-TIMEZONE:America/Los_Angeles";

        // Get the string to return
        for (var i = 0; i < counter; i++) {
            // Get and format the date
            var dateObj = new Date();
            var current = dateObj.toISOString();
            current.split(":").join("");
            current.split("-").join("");

            var until = endTime.toISOString();
            until.split(":").join("");
            until.split("-").join("");

            // Get DTSTART, DTEND, endDate, location, summary, weekDays
            var DTSTART = "DTSTART:" + classInfo.startTime[i];
            var DTEND = "DTEND:" + classInfo.endTime[i];
            var RRULE_UNTIL_BYDAY = "RRULE:FREQ=WEEKLY;" + "UNTIL=" + until + ';' + "BYDAY:" + classInfo.weekDay[i];
            var DTSTAMP = "DTSTMP:" + current;
            var UID = "UID:" + current + "@schedulebuilder";
            var CREATED = "CREATED:" + current;
            var DESCRIPTION = "DESCRIPTION:";
            var LAST_MODIFIED = "LAST-MODIFIED:" + current;
            var LOCATION = "LOCATION:" + classInfo.location[i];
            var SEQUENCE = "SEQUENCE:0"; 
            var STATUS = "STATUS:CONFIRMED";
            var SUMMARY = "SUMMARY:" + classInfo.name[i];
            var TRANSP = "TRANSP:OPAQUE";
            var END = "END:EVENT";

        }
    }
})

function timeGet(time, str) {
    if (str == "AM") {
        var spTime = time.split(':');
        return spTime;
    } else if (str == "PM") {
        var spTime = time.split(':');
        spTime[0] += 12;
        return spTime;
    }
}