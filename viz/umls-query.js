async function getData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return (json);
    } catch (error) {
        console.error(error.message);
    }
}

let buildEndpointURL = (CUI, endpoint, apikey) => { return (`https://uts-ws.nlm.nih.gov/rest/content/current/CUI/${CUI}/${endpoint}?apiKey=${apikey}`) }

let testdata = {
    CUI: 'C0024141'
}