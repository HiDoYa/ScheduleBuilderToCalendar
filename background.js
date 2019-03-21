chrome.runtime.onInstalled.addListener(function() {
    rules = [{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {hostEquals: 'my.ucdavis.edu',
                      pathContains: 'schedulebuilder'}
        })],
        actions: [new chrome.declarativeContent.ShowPageAction()]
    }];

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules(rules);
    });
});