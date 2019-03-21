/*current = document.getElementsByClassName("meeting");
for(i = 0; i < current.length; i++) {
	console.log(current[i].innerText);
}*/
function scrapeThePage() {
    var htmlCode = document.documentElement.outerHTML;
    return htmlCode;
}

document.addEventListener('DOMContentLoaded', () => {
        // Get the active tab
        /*
        var tabs = chrome.tabs.query({ active: true, currentWindow: true }, 
            function(tabs) {
                var tab = tabs[0];
                // Convert the function to a string
                var scriptToExec = '' + scrapeThePage;
                var scraped = chrome.tabs.executeScript(tab.id, {code: scriptToExec},
                    function(scraped) {
                        console.log(scraped);
                        console.log(scraped[0]);
                    }); 
            });
            */
    var scraped = chrome.tabs.executeScript({code: 'document.documentElement.outerHTML'},
        function(scraped) {
            console.log(scraped[0]);
        }
    ); 
    
});

var getCalendar = document.getElementById('getCalendar');
getCalendar.onclick = function() {
    var allClasses = currentDocument.getElementsByClassName("classTitle");
    var classToSave = []
    
    for (var i = 0; i < allClasses.length; i++) {
        var currentClass = allClassses[i].nextElementSibling;
        var statusIndicator = currentClass.getElementsByClassName("statusIndicator");
        if (statusIndicator.innertext == "Registered") {
            classToSave.push(i);
        }
    }
}

