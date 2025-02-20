
console.log("content.js is running and ready.");

function scrapeQueries() {
    console.log("Attempting to scrape queries from Search Console...");

    if (!window.location.href.includes("search.google.com/")) {
        console.error("This is not the Google Search Console page.");
        return [];
    }

    const queryElements = Array.from(document.querySelectorAll('td[data-label="QUERIES"]'));

    const queries = queryElements
        .map(td => td.getAttribute("data-string-value")?.trim() || td.innerText?.trim())
        .filter(Boolean);

    console.log(`Scraped ${queries.length} queries:`, queries);
    return queries;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in content.js:", message);

    if (message.command === "scrapeQueries") {
        try {
            console.log("Processing scrape request...");
            const queries = scrapeQueries();
            console.log("Sending back scraped queries:", queries);
            sendResponse({ queries });
        } catch (error) {
            console.error("Error during scraping:", error);
            sendResponse({ error: "Scraping error." });
        }
    }
    return true;
});