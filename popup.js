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
        var currentDocument = new DOMParser().parseFromString(htmlCode, "text/html")
        var allClasses = currentDocument.getElementsByClassName("classTitle");
        var classToSave = []
        
        for (var i = 0; i < allClasses.length; i++) {
            console.log("running3");

            var currentClass = allClasses[i].childNodes;
            if (currentClass.length > 0) {
                console.log("running2");

                var statusIndicator = currentClass[0].getElementsByClassName("statusIndicator");
                if (statusIndicator.innertext == "Registered") {
                    classToSave.push(i);
                    console.log("running1");
                }
            }
        }
    }
})

