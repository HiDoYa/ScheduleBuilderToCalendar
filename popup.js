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
    setDateInputs();

    // Clicks
    var getCalendar = document.getElementById('getCalendar');
    getCalendar.onclick = function() {
        /// RETRIEVE DATA FROM FORMS
        var formData = new FormData(document.querySelector('form'));
        var formItr = formData.entries()
        var startDate = new Date(formItr.next().value[1]);
        var endDate = new Date(formItr.next().value[1]);
        endDate.setHours(40,59,59);

        /// FIND WHICH CLASSES TO SAVE
        var classToSave = findClassToSave();

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
                // Can't add to calendar if TBA
                if (infoGet[j].children[3].innerText == "TBA") {
                    continue;
                }

                counter++;
                var startDateLoc = clone(startDate);

                // LAB, LECTURE, DISCUSSION, LECTURE/DISCUSSION
                var blockName = name + ' ' + infoGet[j].children[0].innerText;
                classInfo.name.push(blockName);
                console.log(blockName);

                var weekdays = getWeekday(infoGet[j].children[2].innerText);
                var start = weekdays[1];
                classInfo.weekDay.push(weekdays[0]);

                var time = getTime(infoGet[j].children[1].innerText, startDateLoc, start);
                classInfo.startTime.push(time[0]);
                classInfo.endTime.push(time[1]);
                
                var location = infoGet[j].children[3].innerText;
                classInfo.location.push(location);
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
            var until = dateStrFormat(endDate.toISOString());

            // Unnecessary info is commented out
            var BEGIN = "BEGIN:VEVENT";
            var DTSTART = "DTSTART:" + classInfo.startTime[i];
            var DTEND = "DTEND:" + classInfo.endTime[i];
            var RRULE_UNTIL_BYDAY = "RRULE:FREQ=WEEKLY;WKST=SU;" + "UNTIL=" + until + ';' + "BYDAY=" + classInfo.weekDay[i];
            //var DTSTAMP = "DTSTMP:" + current;
            var UID = "UID:" + current + Math.random() + "@schedulebuilder";
            //var CREATED = "CREATED:" + current;
            //var DESCRIPTION = "DESCRIPTION:";
            //var LAST_MODIFIED = "LAST-MODIFIED:" + currentClass;
            var LOCATION = "LOCATION:" + classInfo.location[i];
            //var SEQUENCE = "SEQUENCE:0"; 
            //var STATUS = "STATUS:CONFIRMED";
            var SUMMARY = "SUMMARY:" + classInfo.name[i];
            //var TRANSP = "TRANSP:OPAQUE";
            var END = "END:VEVENT";

            //var strArr = [BEGIN, DTSTART, DTEND, RRULE_UNTIL_BYDAY, DTSTAMP, UID, CREATED, DESCRIPTION, LAST_MODIFIED, LOCATION, SEQUENCE, STATUS, SUMMARY, TRANSP, END];
            var strArr = [BEGIN, DTSTART, DTEND, RRULE_UNTIL_BYDAY, UID, LOCATION, SUMMARY, END];
            final += '\n' + strArr.join('\n');
        }
        final += '\n' + "END:VCALENDAR";

        download(final, 'export.ics', 'ics')
    }
})

function getTime(time, startDateLoc, start) {
    if (time == "TBA") {
        return ["", ""]
    }
    //Parse
    var times = time.split('-');
    var eachStart = times[0].split(' ');
    var eachEnd = times[1].split(' ');

    // Convert to military time
    var timeStart = timeAMPM(eachStart[0], eachStart[1]);
    var timeEnd = timeAMPM(eachEnd[1], eachEnd[2]);

    // Set start date to the correct weekday
    if (startDateLoc.getDay() != start) {
        var shift = start - startDateLoc.getDay();
        startDateLoc.setDate(startDateLoc.getDate() + shift);
    }
    var beginning = clone(startDateLoc);
    var ending = clone(startDateLoc);
    beginning.setHours(timeStart[0], timeStart[1]);
    ending.setHours(timeEnd[0], timeEnd[1]);

    return [printDate(beginning), printDate(ending)];
}

function getWeekday(weekdays) {
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
    return [weekdaysStr, start];
}

function heading () {
    var str = [
        "BEGIN:VCALENDAR",
        "PRODID:ClassSchedule",
        "VERSION:2.0"
    ]
    return str.join('\n');
}

function timeAMPM(time, str) {
    if (str == "AM") {
        var spTime = time.split(':');
        return spTime;
    } else if (str == "PM") {
        var spTime = time.split(':');
        // Convert the hour to int, add, then convert it back to string
        spTime[0] = String(parseInt(spTime[0], 10) + 12);
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

function setDateInputs() {
    var today = new Date();
    var format = today.toISOString().split("T")[0];
    document.getElementsByClassName('startDate')[0].value = format;
    document.getElementsByClassName('endDate')[0].value = format;
}

function findClassToSave() {
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
    return classToSave;
}

function clone(obj) {
    return new Date(obj.toLocaleString("en", {timeZone: "America/Los_Angeles"}));
}

// To replace toISOString (to deal with time zone problems)
function printDate(date) {
    // -7 only works for PST
    date.setHours(-7 + date.getHours());
    return dateStrFormat(date.toISOString());
}