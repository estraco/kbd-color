import AsusCTLRGBManager, { GeneratorAnimation, RGBConfig } from '.';

const manager = new AsusCTLRGBManager();

let i = 0;
const add = 0.1;

function* anim(): Generator<RGBConfig['zones'], void, unknown> {
    while (true) {
        const zones: RGBConfig['zones'] = {
            '1': {
                color: 0,
                mode: 'static'
            },
            '2': {
                color: 0,
                mode: 'static'
            },
            '3': {
                color: 0,
                mode: 'static'
            },
            '4': {
                color: 0,
                mode: 'static'
            }
        };

        const z1red = Math.floor(Math.sin(i) * 127) + 128;
        const z1green = Math.floor(Math.sin(i + 2) * 127) + 128;
        const z1blue = Math.floor(Math.sin(i + 4) * 127) + 128;

        const z1color = (z1red << 16) + (z1green << 8) + z1blue;

        i += add;

        zones['1'].color = z1color;

        const z2red = Math.floor(Math.sin(i) * 127) + 128;
        const z2green = Math.floor(Math.sin(i + 2) * 127) + 128;
        const z2blue = Math.floor(Math.sin(i + 4) * 127) + 128;

        const z2color = (z2red << 16) + (z2green << 8) + z2blue;

        i += add;

        zones['2'].color = z2color;

        const z3red = Math.floor(Math.sin(i) * 127) + 128;
        const z3green = Math.floor(Math.sin(i + 2) * 127) + 128;
        const z3blue = Math.floor(Math.sin(i + 4) * 127) + 128;

        const z3color = (z3red << 16) + (z3green << 8) + z3blue;

        i += add;

        zones['3'].color = z3color;

        const z4red = Math.floor(Math.sin(i) * 127) + 128;
        const z4green = Math.floor(Math.sin(i + 2) * 127) + 128;
        const z4blue = Math.floor(Math.sin(i + 4) * 127) + 128;

        const z4color = (z4red << 16) + (z4green << 8) + z4blue;

        i += add;

        zones['4'].color = z4color;

        yield zones;
    }
}

const animation = new GeneratorAnimation(anim(), 10);

manager.execAnimationGenerator(animation);
