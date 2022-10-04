import cp from 'child_process';
import fs from 'fs';
import path from 'path';

export type RGBConfig = {
    zones: {
        [key: string]: {
            color: number;
            mode?: string;
        }
    }
    name: string;
}

export type ManagerSettings = {
    configsDir: string;
    defaultConfig: string;
    executablePath: string;
}

class FunctionAnimation {
    func: (time: number) => RGBConfig['zones'];
    delay: number;

    constructor(func: (time: number) => RGBConfig['zones'], delay: number) {
        this.func = func;
        this.delay = delay;
    }

    static sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class ArrayAnimation {
    array: RGBConfig['zones'][];
    delay: number;

    constructor(array: RGBConfig['zones'][], delay: number) {
        this.array = array;
        this.delay = delay;
    }

    static sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    run(i: number) {
        const j = i % this.array.length;

        return this.array[j];
    }
}

class GeneratorAnimation {
    generator: Generator<RGBConfig['zones'], void, unknown>;
    delay: number;

    constructor(generator: Generator<RGBConfig['zones'], void, unknown>, delay: number) {
        this.generator = generator;
        this.delay = delay;
    }

    static sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    run() {
        return this.generator.next().value;
    }
}

class AsusCTLRGBManager {
    configDir: string;
    configsDir: string;
    defaultConfig: string;
    currentConfig: string;
    executablePath: string;
    configs: { [key: string]: RGBConfig };

    private runningAnimation = false;

    static defaultConfig: RGBConfig = {
        name: 'default',
        zones: {
            '1': {
                color: 0xffffff,
                mode: 'static'
            },
            '2': {
                color: 0xffffff,
                mode: 'static'
            },
            '3': {
                color: 0xffffff,
                mode: 'static'
            },
            '4': {
                color: 0xffffff,
                mode: 'static'
            }
        }
    };

    constructor({
        configDir,
        executablePath,
        defaultConfig
    }: {
        configDir?: string;
        executablePath?: string;
        defaultConfig?: RGBConfig;
    } = {}) {
        if (process.platform !== 'linux') {
            throw new Error('This manager is only available on linux');
        }

        if (!executablePath) {
            const whichOutput = cp.execSync('which asusctl').toString();
            if (whichOutput.length === 0) {
                throw new Error('asusctl not found');
            }

            const file = whichOutput.split('\n')[0].trim();

            if (!fs.existsSync(file)) {
                throw new Error('asusctl not found');
            }

            if (!fs.statSync(file).isFile()) {
                throw new Error('asusctl not a file');
            }

            executablePath = file;
        } else {
            if (!fs.existsSync(executablePath)) {
                throw new Error(`${executablePath} not found`);
            }

            if (!fs.statSync(executablePath).isFile()) {
                throw new Error(`${executablePath} not a file`);
            }
        }

        this.configDir = configDir || path.join(process.getuid() === 0 ? '/etc' : `/home/${cp.execSync('whoami').toString().trim()}`, '.config', 'AsusCTLRGB');

        this.loadSettings();

        this.executablePath = executablePath || this.getSettings().executablePath;

        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, {
                recursive: true
            });
        }

        if (!fs.existsSync(path.join(this.configDir, this.getSettings().configsDir))) {
            fs.mkdirSync(path.join(this.configDir, this.getSettings().configsDir), {
                recursive: true
            });
        }

        if (!fs.existsSync(path.join(this.configDir, this.getSettings().configsDir, 'default.json'))) {
            fs.writeFileSync(path.join(this.configDir, this.getSettings().configsDir, 'default.json'), JSON.stringify(defaultConfig || AsusCTLRGBManager.defaultConfig));
        }

        this.configs = {};

        for (const config of this.getConfigs()) {
            this.loadConfig(config);
        }

        this.currentConfig = this.getSettings().defaultConfig || 'default';
        if (!this.configs[this.currentConfig]) {
            this.currentConfig = 'default';
        }
    }

    loadConfig(name = 'default'): RGBConfig {
        const configPath = path.join(this.configDir, this.getSettings().configsDir, name + '.json');

        if (!fs.existsSync(configPath)) {
            return {
                zones: {},
                name
            };
        }

        const config = JSON.parse(fs.readFileSync(configPath).toString());

        this.setConfigData(config);
        this.setConfigData({
            ...config,
            name
        });

        return config;
    }

    saveConfig(config: RGBConfig) {
        const configPath = path.join(this.configDir, this.getSettings().configsDir, config.name + '.json');

        fs.writeFileSync(configPath, JSON.stringify(config));
    }

    getConfigs(): string[] {
        const configs = fs.readdirSync(path.join(this.configDir, this.getSettings().configsDir));

        return configs
            .filter(config => config.endsWith('.json'))
            .map(config => config.replace(/\.json$/, ''));
    }

    setConfigData(config: RGBConfig) {
        this.configs[config.name] = config;
    }

    setZone(zone: string, color: number, mode = 'static') {
        this.configs[this.currentConfig].zones[zone] = {
            color,
            mode
        };
    }

    getZone(zone: string): RGBConfig['zones'][string] {
        return this.configs[this.currentConfig].zones[zone];
    }

    setCurrentConfig(config: string) {
        this.currentConfig = config;
    }

    saveConfigs() {
        for (const config of Object.keys(this.configs)) {
            this.saveConfig(this.configs[config]);
        }
    }

    setColor(zone: string, color: number, mode = 'static') {
        const cmd = `${this.executablePath} led-mode ${mode} -c ${color.toString(16).padStart(6, '0')} -z ${zone}`;

        console.log(cmd);

        cp.execSync(cmd);
    }

    configExists(config: string) {
        return fs.existsSync(path.join(this.configDir, this.getSettings().configsDir, config + '.json'));
    }

    update() {
        if (!this.configs[this.currentConfig]) {
            this.loadConfig(this.currentConfig);
        }

        const config = this.configs[this.currentConfig];

        for (const zone in config.zones) {
            this.setColor(zone, config.zones[zone].color);
        }
    }

    loadSettings() {
        const spath = path.join(this.configDir, 'settings.json');

        if (!fs.existsSync(spath)) {
            fs.writeFileSync(spath, JSON.stringify({
                configsDir: path.join(this.configDir, this.getSettings().configsDir),
                defaultConfig: 'default',
                executablePath: this.executablePath
            }));
        }

        const settings = JSON.parse(fs.readFileSync(spath).toString()) as ManagerSettings;

        for (const [key, value] of Object.entries(settings)) {
            this[key as keyof ManagerSettings] = value;
        }
    }

    setSettings(settings: Partial<ManagerSettings>) {
        this.executablePath = settings.executablePath || this.executablePath;
        this.configDir = settings.configsDir || this.configDir || 'configs';
        this.defaultConfig = settings.defaultConfig || this.defaultConfig || 'default';

        const spath = path.join(this.configDir, 'settings.json');

        fs.writeFileSync(spath, JSON.stringify({
            configsDir: this.configsDir,
            defaultConfig: this.defaultConfig,
            executablePath: this.executablePath
        }));
    }

    getSettings(): ManagerSettings {
        return {
            configsDir: this.configsDir || 'configs',
            defaultConfig: this.defaultConfig || 'default',
            executablePath: this.executablePath
        };
    }

    saveSettings() {
        const spath = path.join(this.configDir, 'settings.json');

        fs.writeFileSync(spath, JSON.stringify({
            configsDir: this.configsDir,
            defaultConfig: this.defaultConfig,
            executablePath: this.executablePath
        }));
    }

    async execAnimationFunction(anim: FunctionAnimation) {
        this.runningAnimation = true;

        let i = 0;

        while (this.runningAnimation) {
            const config = anim.func(i);

            for (const zone in config.zones) {
                this.setColor(zone, config[zone].color);
            }

            await FunctionAnimation.sleep(anim.delay);

            i++;
        }
    }

    async execAnimationArray(anim: ArrayAnimation) {
        this.runningAnimation = true;

        let i = 0;

        while (this.runningAnimation) {
            const config = anim.run(i);

            for (const zone in config.zones) {
                this.setColor(zone, config[zone].color);
            }

            await ArrayAnimation.sleep(anim.delay);

            i++;
        }
    }

    async execAnimationGenerator(anim: GeneratorAnimation) {
        this.runningAnimation = true;

        while (this.runningAnimation) {
            const config = anim.run();

            if (!config) {
                break;
            }

            for (const zone in config.zones) {
                this.setColor(zone, config[zone].color);
            }

            await GeneratorAnimation.sleep(anim.delay);
        }
    }

    stopAnimation() {
        this.runningAnimation = false;
    }
}

export default AsusCTLRGBManager;
export {
    FunctionAnimation,
    ArrayAnimation,
    GeneratorAnimation
};
