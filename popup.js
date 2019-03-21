/*current = document.getElementsByClassName("meeting");
for(i = 0; i < current.length; i++) {
	console.log(current[i].innerText);
}*/
function scrapeThePage() {
    // Keep this function isolated - it can only call methods you set up in content scripts
    var htmlCode = document.documentElement.outerHTML;
    return htmlCode;
}

document.addEventListener('DOMContentLoaded', () => {
        // Get the active tab
        var tabs = chrome.tabs.query({ active: true, currentWindow: true }, 
            function(tabs) {
                console.log(tabs);
            });
        var tab = tabs[0];

        // Convert the function to a string
        var scriptToExec = `(${scrapeThePage})()`;

        // Run the script in the context of the tab
        var scraped = chrome.tabs.executeScript(tab.id, { code: scriptToExec},
            function(scraped) {
                console.log(scraped);
            });
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

