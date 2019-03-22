var htmlCode;

document.addEventListener('DOMContentLoaded', () => {
    var scraped = chrome.tabs.executeScript({code: 'document.documentElement.outerHTML'},
        function(scraped) {
            htmlCode = scraped[0];
        }
    ); 
    
});
var allClasses;
window.addEventListener('DOMContentLoaded', (event) =>  {
    var getCalendar = document.getElementById('getCalendar');
    getCalendar.onclick = function() {

        /// FIND WHICH CLASSES TO SAVE
        var currentDocument = new DOMParser().parseFromString(htmlCode, "text/html")
        allClasses = currentDocument.getElementsByClassName("classTitle");
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
    }
})

