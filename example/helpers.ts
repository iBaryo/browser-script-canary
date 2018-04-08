const vals = {
    text: 'value',
    number: 'value',
    checkbox: 'checked'
};

function configFactory() {
    return {
        probability: 0,
        version: '',
        canaryScriptUrl: '',
        loadAsync: false,
        supportCORs: false
    };
}

function getVal(id, def) {
    const el = document.getElementById(id) as HTMLInputElement;
    let val = el[vals[el.type]];
    let num = parseFloat(val);
    return (isNaN(num) ? val : num) || def;
}

function setVal(id, val) {
    const el = document.getElementById(id) as HTMLInputElement;
    return el[vals[el.type]] = val;
}

function saveConfig() {
    const config = configFactory();
    Object.keys(config).forEach(k => config[k] = getVal(k, config[k]));
    localStorage.setItem('canary-config', JSON.stringify(config));
}

function getConfig() {
    return Object.assign(
            configFactory(),
            JSON.parse(localStorage.getItem('canary-config') || '{}')
        );
}

function showConfig() {
    const config = getConfig();
    Object.keys(config).forEach(k => setVal(k, config[k]));
}