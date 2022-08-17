const { default: AsusCTLRGBManager } = require('../build/manager.js');
const { contextBridge } = require('electron');

const manager = new AsusCTLRGBManager();

async function waitForId(selector, delay = 100) {
    while (!document.getElementById(selector)) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    return document.getElementById(selector);
}

async function updateDropdown() {
    const configsDropdown = await waitForId('config-dropdown');
    const configs = manager.getConfigs();

    configs.forEach(config => {
        const option = document.createElement('option');
        option.value = config;
        option.innerText = config;
        configsDropdown.appendChild(option);
    });

    loadConfigToPage();
}

async function loadConfigToPage() {
    const configsDropdown = await waitForId('config-dropdown');
    const config = configsDropdown.value;

    const configData = manager.loadConfig(config);

    const zone1color = await waitForId('zone-1-color');
    const zone2color = await waitForId('zone-2-color');
    const zone3color = await waitForId('zone-3-color');
    const zone4color = await waitForId('zone-4-color');

    zone1color.value = `#${configData.zones['1'].color.toString(16).padStart(6, '0')}`;
    zone2color.value = `#${configData.zones['2'].color.toString(16).padStart(6, '0')}`;
    zone3color.value = `#${configData.zones['3'].color.toString(16).padStart(6, '0')}`;
    zone4color.value = `#${configData.zones['4'].color.toString(16).padStart(6, '0')}`;
}

// Promise.all([
//     waitForId('zone-1-color'),
//     waitForId('zone-2-color'),
//     waitForId('zone-3-color'),
//     waitForId('zone-4-color')
// ]).then(([zone1color, zone2color, zone3color, zone4color]) => {
//     console.log('All elements loaded');
//     zone1color.addEventListener('change', () => {
//         console.log(zone1color.value);
//         zone1color.value = zone1color.value.toUpperCase();
//         console.log(zone1color.value);
//         manager.setZone('1', zone1color.value);
//     });
//     zone2color.addEventListener('change', () => {
//         console.log(zone2color.value);
//         zone2color.value = zone2color.value.toUpperCase();
//         console.log(zone2color.value);
//         manager.setZone('2', zone2color.value);
//     });
//     zone3color.addEventListener('change', () => {
//         console.log(zone3color.value);
//         zone3color.value = zone3color.value.toUpperCase();
//         console.log(zone3color.value);
//         manager.setZone('3', zone3color.value);
//     });
//     zone4color.addEventListener('change', () => {
//         console.log(zone4color.value);
//         zone4color.value = zone4color.value.toUpperCase();
//         console.log(zone4color.value);
//         manager.setZone('4', zone4color.value);
//     });
// });

waitForId('save-config').then(saveConfig => {
    console.log('save-config');

    saveConfig.addEventListener('click', () => {
        const configName = document.getElementById('config-dropdown').value;
        const config = {
            name: configName,
            zones: {
                '1': {
                    color: document.getElementById('zone-1-color').value.match(/\d+/g).map(n => parseInt(n, 10))[0],
                    mode: 'static'
                },
                '2': {
                    color: document.getElementById('zone-2-color').value.match(/\d+/g).map(n => parseInt(n, 10))[0],
                    mode: 'static'
                },
                '3': {
                    color: document.getElementById('zone-3-color').value.match(/\d+/g).map(n => parseInt(n, 10))[0],
                    mode: 'static'
                },
                '4': {
                    color: document.getElementById('zone-4-color').value.match(/\d+/g).map(n => parseInt(n, 10))[0],
                    mode: 'static'
                }
            }
        }

        console.log(config);

        manager.saveConfig(config);
    });
});

waitForId('new-config-button').then(newConfigButton => {
    newConfigButton.addEventListener('click', () => {
        const configname = document.getElementById('new-config-name');

        const config = {
            name: configname.value,
            zones: manager.loadConfig('default').zones
        }

        manager.saveConfig(config);

        updateDropdown();
    });
});

waitForId('load-config-button').then(loadConfigButton => {
    loadConfigButton.addEventListener('click', () => {
        loadConfigToPage();
    });
});

waitForId('use-config').then(useConfig => {
    useConfig.addEventListener('click', () => {
        const configsDropdown = document.getElementById('config-dropdown');
        const config = configsDropdown.value;

        manager.setCurrentConfig(config);

        manager.update();
    });
});

updateDropdown();

contextBridge.exposeInMainWorld('manager', manager);
contextBridge.exposeInMainWorld('updateDropdown', updateDropdown);
contextBridge.exposeInMainWorld('loadConfigToPage', loadConfigToPage);
