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
    var today = new Date();
    var format = today.toISOString().split("T")[0];
    document.getElementsByClassName('startDate')[0].value = format;
    document.getElementsByClassName('endDate')[0].value = format;

    // Clicks
    var getCalendar = document.getElementById('getCalendar');
    getCalendar.onclick = function() {
        /// RETRIEVE DATA FROM FORMS
        var formData = new FormData(document.querySelector('form'));
        var formItr = formData.entries()
        var startTime = new Date(formItr.next().value[1]);
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

            var nameArr = classToSave[i].innerText.split(' ');
            while (nameArr.length != 2) {
                nameArr.pop();
            }
            var name = nameArr.join('');
            

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
                var beginning = startTimeLoc;
                beginning.setHours(timeStart[0], timeStart[1]);
                classInfo.startTime.push(dateStrFormat(beginning.toISOString()));

                var ending = startTimeLoc;
                ending.setHours(timeEnd[0], timeEnd[1]);
                classInfo.endTime.push(dateStrFormat(ending.toISOString()));

                classInfo.location.push(infoGet[j].children[3].innerText);
            }
        }

        /// CREATE THE FILE
        // ics format: https://tools.ietf.org/html/rfc5545

        // Heading
        var final = heading();

        // Get the string to return
        for (var i = 0; i < counter; i++) {
            // Get and format the date
            var dateObj = new Date();
            var current = dateStrFormat(dateObj.toISOString());
            var until = dateStrFormat(endTime.toISOString());

            // Get DTSTART, DTEND, endDate, location, summary, weekDays
            var BEGIN = "BEGIN:VEVENT";
            var DTSTART = "DTSTART;TZID=America/Los_Angeles:" + classInfo.startTime[i] + "Z";
            var DTEND = "DTEND;TZID=America/Los_Angeles:" + classInfo.endTime[i] + "Z";
            var RRULE_UNTIL_BYDAY = "RRULE:FREQ=WEEKLY;" + "UNTIL=" + until + 'Z;' + "BYDAY:" + classInfo.weekDay[i];
            var DTSTAMP = "DTSTMP:" + current + "Z";
            var UID = "UID:" + current + Math.random() + "@schedulebuilder";
            var CREATED = "CREATED:" + current + "Z";
            var DESCRIPTION = "DESCRIPTION:";
            var LAST_MODIFIED = "LAST-MODIFIED:" + current + "Z";
            var LOCATION = "LOCATION:" + classInfo.location[i];
            var SEQUENCE = "SEQUENCE:0"; 
            var STATUS = "STATUS:CONFIRMED";
            var SUMMARY = "SUMMARY:" + classInfo.name[i];
            var TRANSP = "TRANSP:OPAQUE";
            var END = "END:VEVENT";

            var strArr = [BEGIN, DTSTART, DTEND, RRULE_UNTIL_BYDAY, DTSTAMP, UID, CREATED, DESCRIPTION, LAST_MODIFIED, LOCATION, SEQUENCE, STATUS, SUMMARY, TRANSP, END];
            final += '\n' + strArr.join('\n');
        }
        final += '\n' + "END:VCALENDAR";

        download(final, 'export.ics', 'ics')
    }
})

function heading () {
    var str = [
        "BEGIN:VCALENDAR",
        "PRODID:-//Google Inc//Google Calendar 70.9054//EN",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Class",
        "X-WR-TIMEZONE:America/Los_Angeles",
        "BEGIN:VTIMEZONE",
        "TZID:America/Los_Angeles",
        "X-LIC-LOCATION:America/Los_Angeles",
        "BEGIN:DAYLIGHT",
        "TZOFFSETFROM:-0800",
        "TZOFFSETTO:-0700",
        "TZNAME:PDT",
        "DTSTART:19700308T020000",
        "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
        "END:DAYLIGHT",
        "BEGIN:STANDARD",
        "TZOFFSETFROM:-0700",
        "TZOFFSETTO:-0800",
        "TZNAME:PST",
        "DTSTART:19701101T020000",
        "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
        "END:STANDARD",
        "END:VTIMEZONE"
    ]

    return str.join('\n');
}

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

function dateStrFormat(date) {
    date = date.split(":").join("");
    date = date.split("-").join("");
    return date = date.split(".")[0]
}

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}