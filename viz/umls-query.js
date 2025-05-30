// Setup our form:
let createApiKeyModal = () => {
    let modal = document.createElement('dialog');
    let prompt = document.createElement('p');
    let input = document.createElement('input');
    let save = document.createElement('input');
    let clear = document.createElement('input');
    let done = document.createElement('input');
    document.body.appendChild(modal);
    modal.appendChild(prompt);
    modal.appendChild(input);
    modal.appendChild(save);
    modal.appendChild(clear);
    modal.appendChild(done);
    
    prompt.innerText = 'Please enter your UMLS API Key to query UMLS:'
    input.type = 'text'
    input.placeholder = 'API Key';
    save.type = 'button';
    save.value = 'Store Key';
    clear.type = 'button';
    clear.value = 'Clear Store';
    done.type = 'button';
    done.value = 'Done';

    save.addEventListener('click', () => {localStorage.setItem('UMLS API Key', input.value)})
    clear.addEventListener('click', () => {localStorage.removeItem('UMLS API Key'); input.value = '';})
    done.addEventListener('click', () => {modal.close()})

    let fire = () => {
        let prev_key = key()
        if (prev_key) {input.value = prev_key}
        modal.showModal()
    }

    let key = () => {
        if (input.value != '') {return(input.value)}
        else {return(localStorage.getItem('UMLS API Key'))}
    }

    return({fire: fire, key: key, close: modal.close, el: modal})
}

let keyGetter;

window.addEventListener('load', () => {
    keyGetter = createApiKeyModal();
    if (!keyGetter.key()) {
        keyGetter.fire()
    }
})

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

let buildSearchURL = (string, apikey) => { return(`https://uts-ws.nlm.nih.gov/rest/search/current?apiKey=${apikey}&string=${string}`) }
let buildEndpointURL = (CUI, endpoint, apikey) => { return(`https://uts-ws.nlm.nih.gov/rest/content/current/CUI/${CUI}/${endpoint}?apiKey=${apikey}`) }

// get names and descriptions for search terms:
async function search_desc(string) {
    let apikey = keyGetter.key();
    try {
        const searchData = await getData(buildSearchURL(string, apikey));
        if (!searchData || !searchData.result || !searchData.result.results) {
            return [];
        }
        
        const results = searchData.result.results;
        
        const definitions = await Promise.all(results.map(async (result) => {
            const defs_object = await getData(buildEndpointURL(result.ui, 'definitions', apikey));
            
            if (!defs_object || !defs_object.result) {
                console.log(`No definitions found for CUI: ${result.ui} (${result.name})`);
                return { name: result.name, def: 'No definition available', cui: result.ui };
            }
            
            // Fixed: Use includes() instead of 'in' operator
            const msh_defs = defs_object.result.filter(x => ['MSH', 'NCI'].includes(x.rootSource));
            
            return {
                name: result.name, 
                def: msh_defs.length > 0 ? msh_defs[0].value : 'No MSH/NCI definition available', 
                cui: result.ui
            };
        }));
        
        return definitions;
    } catch (error) {
        console.error('Error in search_desc:', error);
        return [];
    }
}