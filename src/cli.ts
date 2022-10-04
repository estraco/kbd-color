#! /usr/bin/env node

import AsusCTLRGBManager from '.';
import yargs from 'yargs';
import path from 'path';
import child_process from 'child_process';

const manager = new AsusCTLRGBManager();

const yarg = yargs
    .command('install-systemd', 'Install systemd service')
    .command('remove-systemd', 'Remove systemd service')
    .command('service', 'Update service');

if (process.argv.length === 2) {
    yarg.showHelp();

    process.exit(1);
}

yarg.parseAsync(process.argv.slice(2)).then(async (argv) => {
    if (argv.installSystemd) {
        if (process.getuid() !== 0) {
            console.log('You must be root to install systemd service');
            process.exit(1);
        }

        await new Promise((resolve, reject) => {
            const cmd = [
                'node',
                path.resolve(__dirname, './daemon.js'),
                'create-service'
            ];

            const child = child_process.spawn(cmd.shift(), cmd);
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

            child.on('exit', (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(code);
                }
            });
        }).catch((code) => {
            console.log('Error installing systemd service. Process exited with code:', code);
            process.exit(code);
        });

        await new Promise((resolve, reject) => {
            const cmd = [
                'systemctl',
                'daemon-reload'
            ];

            const child = child_process.spawn(cmd.shift(), cmd);
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

            child.on('exit', (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(code);
                }
            });
        }).catch((code) => {
            console.log('Error reloading systemd service. Process exited with code:', code);
            process.exit(code);
        });

        console.log('Systemd daemon reloaded');

        await new Promise((resolve, reject) => {
            const cmd = [
                'node',
                path.resolve(__dirname, './daemon.js'),
                'enable-service'
            ];

            const child = child_process.spawn(cmd.shift(), cmd);
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

            child.on('exit', (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(code);
                }
            });
        }).catch((code) => {
            console.log('Error enabling systemd service. Process exited with code:', code);
            process.exit(code);
        });

        await new Promise((resolve, reject) => {
            const cmd = [
                'node',
                path.resolve(__dirname, './daemon.js'),
                'start-service'
            ];

            const child = child_process.spawn(cmd.shift(), cmd);
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

            child.on('exit', (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(code);
                }
            });
        }).catch((code) => {
            console.log('Error starting systemd service. Process exited with code:', code);
            process.exit(code);
        });

        console.log('Systemd service installed and enabled');

        process.exit(0);
    } else if (argv.removeSystemd) {
        if (process.getuid() !== 0) {
            console.log('You must be root to remove systemd service');
            process.exit(1);
        }

        await new Promise((resolve, reject) => {
            const cmd = [
                'node',
                path.resolve(__dirname, './daemon.js'),
                'remove-service'
            ];

            const child = child_process.spawn(cmd.shift(), cmd);
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

            child.on('exit', (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(code);
                }
            });
        }).catch((code) => {
            console.log('Error removing systemd service. Process exited with code:', code);
            process.exit(code);
        });

        console.log('Systemd service removed');

        process.exit(0);
    } else if (argv.service) {
        manager.update();
    }
}).catch((err) => {
    console.log(err);
    process.exit(1);
});
