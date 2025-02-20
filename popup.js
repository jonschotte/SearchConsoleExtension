// popup.js - Handles UI actions and displays results
document.addEventListener("DOMContentLoaded", () => {
    console.log("popup.js has loaded and is ready.");

    const checkButton = document.getElementById("checkButton");
    const downloadButton = document.createElement("button");
    downloadButton.id = "downloadButton";
    downloadButton.textContent = "Download CSV";
    document.body.appendChild(downloadButton);

    const resultsDiv = document.getElementById("results");
    let similarityResults = [];

    function showStatus(message, isError = false) {
        resultsDiv.innerHTML = `<p style="color: ${isError ? 'red' : 'green'}; font-weight: bold;">${message}</p>`;
    }

    checkButton.addEventListener("click", () => {
        console.log("Button Clicked: Check Similarity");

        const url = document.getElementById("urlInput").value;
        if (!url) {
            alert("Please enter a URL.");
            return;
        }

        showStatus("Scraping queries...");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            console.log("Sending scrape request to content.js...");

            chrome.tabs.sendMessage(tabs[0].id, { command: "scrapeQueries" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error:", chrome.runtime.lastError);
                    showStatus("Failed to communicate with content.js. Try refreshing Search Console.", true);
                    return;
                }

                console.log("Response from content.js:", response);

                if (!response || response?.error) {
                    showStatus(response?.error || "No queries found. Refresh Search Console and try again.", true);
                    return;
                }

                const scrapedQueries = response?.queries || [];
                console.log("Queries received in popup.js:", scrapedQueries);

                if (!scrapedQueries.length) {
                    showStatus("No queries collected. Ensure you are on the correct Search Console page.", true);
                    return;
                }

                showStatus("Running cosine similarity analysis...");
                chrome.runtime.sendMessage({
                    command: "checkSimilarity",
                    url,
                    queries: scrapedQueries,
                });
            });
        });
    });

    downloadButton.addEventListener("click", () => {
        if (similarityResults.length === 0) {
            alert("No results to download. Run similarity check first.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,Keyword,Similarity\n";
        similarityResults.forEach(({ keyword, similarity }) => {
            csvContent += `${keyword},${similarity}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "similarity_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Response received in popup.js:", message);
    const resultsDiv = document.getElementById("results");

    if (message.results && Array.isArray(message.results)) {
        similarityResults = message.results; // Store results for CSV download
        showStatus("Similarity Results:");
        resultsDiv.innerHTML = message.results.map(({ keyword, similarity }) => {
            return `<p><strong>${keyword}:</strong> ${similarity.toFixed(4)}</p>`;
        }).join('');
        console.log("✅ Results displayed in popup.");
    } else if (message.error) {
        showStatus(`Error: ${message.error}`, true);
    } else {
        console.error("❌ Unexpected message format received:", message);
    }
    sendResponse({ status: "received" }); // Prevents message channel closing error
    return true;
});
});