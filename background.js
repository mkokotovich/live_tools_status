var status_url = "http://tools-status-qa.engba.veritas.com/web/index.html";
//var status_url = "http://tools-status.engba.veritas.com/statuspage/#home";
var status_api = "http://tools-status-qa.engba.veritas.com/statuspageapi/v1/services/";

var tools_urls = [
    "*://engtools.engba.veritas.com/*",
    "*://jira.community.veritas.com/*",
    "*://stash.veritas.com/*",
    "*://confluence.community.veritas.com/*",
    "*://tools-review.engba.veritas.com/*",
    "*://vxtop.veritas.com/*",
    "*://vxexchange.veritas.com/*"
];

var tools_mappings = {
    "engtools.engba.veritas.com":"Etrack",
    "jira.community.veritas.com":"JIRA",
    "stash.veritas.com":"Stash",
    "confluence.community.veritas.com":"Confluence",
    "tools-review.engba.veritas.com":"Code Collaborator",
    "vxtop.veritas.com":"VxTOP",
    "vxexchange.veritas.com":"VxExchange"
};

function getDomain(url) {
    var prefix = /^https?:\/\//i;
    var domain = /^[^\/]+/;
    // remove any prefix
    url = url.replace(prefix, "");
    // assume any URL that starts with a / is on the current page's domain
    if (url.charAt(0) === "/") {
        url = window.location.hostname + url;
    }
    // now extract just the domain
    var match = url.match(domain);
    if (match) {
        return(match[0]);
    }
    return(null);
}

function queryIfToolIsUp(current_url) {
    var toolName = tools_mappings[getDomain(current_url)];
    if (toolName == null) {
        //If not found, default to true
        console.log(toolName + " not found");
        return true;
    }
    var x = new XMLHttpRequest();
    x.open('GET', status_api);
    x.onload = function() {
        var jsonData = JSON.parse(x.responseText);
        // Parse the json, look for the name we are loading
        for (var i = 0; i < jsonData.length; i++) {
            var name = jsonData[i].name;
            if (name == toolName) {
                // When we find our tool, check the status
                var statusNormal = true;
                for (var j = 0; j < jsonData[i].childNodes.length; j++)
                {
                    if (jsonData[i].childNodes[j].status != "NORMAL") {
                        statusNormal = false;
                    }
                }
                // Uncomment for testing
                //if (name == "Etrack") {
                //    statusNormal = false;
                //}
                console.log(name + ": " + statusNormal);
                if (statusNormal == false) {
                    var downName = name;
                    var query_url = "*://" + getDomain(current_url) + "/*";
                    chrome.tabs.query({url: query_url}, function (tabs) {
                        chrome.tabs.update(tabs[0].id, {url: status_url});
                        //alert(downName + " is down");
                    });
                }
            }
        }
    };
    x.send();
}

chrome.webRequest.onSendHeaders.addListener(
    function(details)
    {
        var toolUp = queryIfToolIsUp(details.url);
    },

    {urls: tools_urls}
);

