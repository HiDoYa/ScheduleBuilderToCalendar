var htmlCode;

document.addEventListener('DOMContentLoaded', () => {
    var scraped = chrome.tabs.executeScript({code: 'document.documentElement.outerHTML'},
        function(scraped) {
            htmlCode = scraped[0];
        }
    ); 
    
});

window.addEventListener('DOMContentLoaded', (event) =>  {
    var getCalendar = document.getElementById('getCalendar');
    getCalendar.onclick = function() {

        /// FIND WHICH CLASSES TO SAVE
        var currentDocument = new DOMParser().parseFromString(htmlCode, "text/html")
        var allClasses = currentDocument.getElementsByClassName("classTitle");
        var classToSave = []
        for (var i = 0; i < allClasses.length; i++) {

            var currentClass = allClasses[i].nextElementSibling;
            if (currentClass != undefined) {
                // Only include registered classes (not waitlisted)
                var statusIndicator = currentClass.getElementsByClassName("statusIndicator registered");
                if (statusIndicator != undefined && statusIndicator.legnth != 0) {
                    console.log(statusIndicator)
                    classToSave.push(i);
                }
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
        for (var i = 0; i < classToSave.length; i++) {
            // Get and format the date
            var dateObj = new Date();
            var current = dateObj.toISOString();
            current.split(":").join("");
            current.split("-").join("");

            var daysOfWeek = ["MO", "TU", "WE", "TH", "FR"]

            // Get DTSTART, DTEND, endDate, location, summary, weekDays
            var DTSTART;
            var DTEND;
            var RRULE_UNTIL_BYDAY = "RRULE:FREQ=WEEKLY;" + "UNTIL=" + endDate + ';' + "BYDAY:" + weekDays;
            var DTSTAMP = "DTSTMP:" + current;
            var UID = "UID:" + current + "@schedulebuilder";
            var CREATED = "CREATED:" + current;
            var DESCRIPTION = "DESCRIPTION:";
            var LAST_MODIFIED = "LAST-MODIFIED:" + current;
            var LOCATION;
            var SEQUENCE = "SEQUENCE:0"; 
            var STATUS = "STATUS:CONFIRMED";
            var SUMMARY;
            var TRANSP = "TRANSP:OPAQUE";
            var END = "END:EVENT";


        }
    }
})

