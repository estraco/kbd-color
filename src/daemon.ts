#! /usr/bin/env node

import AsusCTLRGBManager, * as IAsusCTLRGBManager from '.';
import child_process from 'child_process';
import fs from 'fs';
import express from 'express';

const cmd = process.argv[2];

if (!cmd) {
    console.log('No command specified');
    process.exit(1);
}

const manager = new AsusCTLRGBManager();

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
    res.send('AsusCTLRGBManager API<br><br>' + app._router.stack
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter(({ route }: any) => !!route)
        .map((r: {
            route: {
                path: string;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                stack: any[];
                methods: {
                    [key: string]: boolean;
                }
            }
        }) => `${Object.keys(r.route.methods).join(', ')} ${r.route.path}`)
        .join('<br>'));
});

app.post('/config', async (req, res) => {
    if (!req.body.config) {
        res.status(400).send('No config specified');
        return;
    }

    const cfg = req.body.config as IAsusCTLRGBManager.RGBConfig;

    if (!cfg.name) {
        res.status(400).send('No config name specified');
        return;
    }

    if (!cfg.zones) {
        res.status(400).send('No zones specified');
        return;
    }

    for (const zone of Object.values(cfg.zones)) {
        if (!zone.color) {
            res.status(400).send('No color specified for zone');
            return;
        }

        if (!zone.mode) {
            res.status(400).send('No mode specified for zone');
            return;
        }
    }

    manager.setConfigData(cfg);

    res.send('OK');
});

app.get('/configs', async (_req, res) => {
    const configs = [...new Set([
        ...manager.getConfigs(),
        ...Object.keys(manager.configs)
    ])];

    res.send(configs);
});

app.get('/configs/:config', async (req, res) => {
    const config = req.params.config;

    if (!manager.configExists(config)) {
        res.status(404).send('Config not found');
        return;
    }

    const cfg = manager.loadConfig(config);

    res.send(cfg);
});

app.post('/configs/:config', async (req, res) => {
    const config = req.params.config;

    if (!manager.configExists(config)) {
        res.status(404).send('Config not found');
        return;
    }

    const cfg = req.body.config as IAsusCTLRGBManager.RGBConfig['zones'];

    if (!cfg) {
        res.status(400).send('No config specified');
        return;
    }

    for (const zone of Object.values(cfg)) {
        if (!zone.color) {
            res.status(400).send('No color specified for zone');
            return;
        }

        if (!zone.mode) {
            res.status(400).send('No mode specified for zone');
            return;
        }
    }

    manager.setConfigData({
        ...manager.loadConfig(config),
        zones: {
            ...manager.loadConfig(config).zones,
            ...cfg
        }
    });

    res.send('OK');
});

app.get('/configs/:config/:zone', async (req, res) => {
    const config = req.params.config;

    if (!manager.configExists(config)) {
        res.status(404).send('Config not found');
        return;
    }

    const cfg = manager.loadConfig(config);
    const zone = req.params.zone;

    if (!cfg.zones[zone]) {
        res.status(404).send('Zone not found');
        return;
    }

    res.send(cfg.zones[zone]);
});

app.post('/setcurrentconfig', async (req, res) => {
    if (!req.body.config) {
        res.status(400).send('No config specified');
        return;
    }

    const config = req.body.config;

    if (!manager.configExists(config)) {
        res.status(404).send('Config not found');
        return;
    }

    manager.setCurrentConfig(config);

    res.send('OK');
});

app.get('/setcurrentconfig', async (req, res) => {
    if (!req.query.config) {
        res.status(400).send('No config specified');
        return;
    }

    const config = req.query.config.toString();

    if (!manager.configExists(config)) {
        res.status(404).send('Config not found');
        return;
    }

    manager.setCurrentConfig(config);

    res.send('OK');
});

app.get('/currentconfig', async (_req, res) => {
    res.send(manager.currentConfig);
});

app.get('/settings', async (_req, res) => {
    res.send(manager.getSettings());
});

app.get('/update', async (_req, res) => {
    manager.update();

    res.send('OK');
});

const data = `[Unit]
Description=Asus CTL RGB Manager
After=network.target

[Service]
Type=simple
ExecStart=kbd-color-daemon service
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
`;

switch (cmd) {
    case 'create-service':
        fs.writeFileSync('/etc/systemd/system/asus-ctl-rgb-manager.service', data);

        console.log('Service created with data:');
        console.log(data);

        break;
    case 'remove-service':
        fs.unlinkSync('/etc/systemd/system/asus-ctl-rgb-manager.service');

        console.log('Service removed');

        break;
    case 'service':
        manager.update();

        app.listen(52813, () => {
            console.log('Server started on port 52813');
        });

        break;
    case 'enable-service':
        child_process.execSync('systemctl enable asus-ctl-rgb-manager.service');

        console.log('Service enabled');

        break;
    case 'disable-service':
        child_process.execSync('systemctl disable asus-ctl-rgb-manager.service');

        console.log('Service disabled');

        break;
    case 'start-service':
        child_process.execSync('systemctl start asus-ctl-rgb-manager.service');

        console.log('Service started');

        break;
    case 'stop-service':
        child_process.execSync('systemctl stop asus-ctl-rgb-manager.service');

        console.log('Service stopped');

        break;
    case 'restart-service':
        child_process.execSync('systemctl restart asus-ctl-rgb-manager.service');

        console.log('Service restarted');

        break;
    default:
        console.log('Unknown command');
        process.exit(1);
}
