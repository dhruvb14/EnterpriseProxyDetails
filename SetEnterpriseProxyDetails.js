/**
 * Author: Dhruv Bhavsar
 * Description: Enterprise Proxy configuration script for use with customer
 * who use a MITM proxy to inspect traffic. 
 * Helps config NPM, Git, Yarn and Python
 */

// Update this section specific to customer

// Enter customers proxy server including port
const proxyAddress = "proxyaddress:port";

// Include Windows Domain for network
const windowsDomain = "windowsdomain"

/** 
 * Specific hosts to not use proxy for. 
 * This is used by GIT/Nuget so you can proxy external
 * and internal GIT/Nuget servers differently. 
 * comma seperated host names, allows wildcards
 * and UNC names 
 */
const gitNoProxyExemption = "UNCServerYouWantToNotBeProxied,*.microsoft.com"; 
const nugetNoProxyExemption = "http://UNCServerYouWantToNotBeProxied:8080,http://*microsoft.com"; 

// End Update this section specific to customer

/**
 * 
 * DO NOT MODIFY BELOW HERE UNLESS 
 * YOU KNOW WHAT YOU ARE DOING
 * 
 */

var qs = require('querystring');
var execSync = require('child_process').execSync;
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
const path = require('path');
var programs = {
    npm: false,
    git: false,
    yarn: false,
    python: false
};
// Used by writePipConfig to verify path exists
const mkdirSync = function (dirPath) {
    try {
        fs.mkdirSync(dirPath)
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}
// Method to create pip proxy config
function writePipConfig(description) {
    console.log("Setting " + description);
    mkdirSync(path.resolve(process.env.APPDATA + '\\pip'));
    var pipConfigPath = process.env.APPDATA + '\\pip\\pip.ini';
    var contents = '[global]\nproxy = http://' + username + ':' + password + '@' + proxyAddress + '\ntrusted-host = pypi.python.org\n[list]\nformat=columns';
    fs.writeFileSync(pipConfigPath, contents);
}

// Prompt user for input to use in application
function prompt(question, callback) {
    var stdin = process.stdin,
        stdout = process.stdout;

    stdin.resume();
    stdout.write(question);

    stdin.once('data', function (data) {
        callback(data.toString().trim());
    });
}
// Execute commandline application
function spawnProcess(command, description) {
    console.log("Setting " + description);
    execSync(command, { stdio: [0, 1, 2] });
}
// Check if a program is installed
var commandExistsWindowsSync = function (commandName, callback) {
    try {
        var success = execSync('where ' + commandName);
        return !!success;
    } catch (error) {
        return false;
    }
}

console.log('Checking for installed programs');
programs.npm = commandExistsWindowsSync('npm');
console.log('npm installed: ', programs.npm);
programs.yarn = commandExistsWindowsSync('yarn');
console.log('yarn installed: ', programs.yarn);
programs.git = commandExistsWindowsSync('git');
console.log('git installed: ', programs.git);
programs.python = commandExistsWindowsSync('python');
console.log('python installed: ', programs.python);

var username;
var password;
var passwordFull;
prompt('Whats your username? ', function (input) {
    username = input;
    console.log(username);
    prompt('Whats your password? ', function (input) {
        password = qs.escape(input);
        passwordFull = input;
        commands = [
            {
                enabled: programs.npm,
                command: 'npm config rm proxy && npm config set proxy http://' + username + ':' + password + '@' + proxyAddress,
                title: 'Node HTTP Proxy'
            },
            {
                enabled: programs.npm,
                command: 'npm config rm https-proxy && npm config set https-proxy http://' + username + ':' + password + '@' + proxyAddress,
                title: 'Node HTTPS Proxy'
            },
            {
                enabled: programs.npm,
                command: 'npm config rm strict-ssl && npm config set strict-ssl false',
                title: 'Node SSL Ignore Enterprise Cert Validity'
            },
            {
                enabled: programs.yarn,
                command: 'yarn config delete proxy && yarn config set proxy http://' + username + ':' + password + '@' + proxyAddress,
                title: 'Yarn HTTP Proxy'
            },
            {
                enabled: programs.yarn,
                command: 'yarn config delete https-proxy && yarn config set https-proxy http://' + username + ':' + password + '@' + proxyAddress,
                title: 'Yarn HTTPS Proxy'
            },
            {
                enabled: programs.yarn,
                command: 'yarn config delete strict-ssl && yarn config set strict-ssl false',
                title: 'Yarn SSL Ignore Enterprise Cert Validity'
            },
            {
                enabled: programs.git,
                command: 'git config --global http.proxy http://' + username + ':' + password + '@' + proxyAddress,
                title: 'Git External HTTP Proxy'
            },
            {
                enabled: programs.git,
                command: 'setx no_proxy '+ gitNoProxyExemption,
                title: 'Override External Git HTTP Proxy'
            },
            {
                enabled: programs.git,
                command: 'git config --global http.sslVerify false',
                title: 'Git SSL Ignore Enterprise Cert Validity'
            },
            {
                enabled: true,
                command: 'nuget.exe config -set http_proxy=http://' + proxyAddress,
                title: 'Set NuGet Proxy URL'
            },
            {
                enabled: true,
                command: 'nuget.exe config -set http_proxy.user=' + windowsDomain + '\\' + username,
                title: 'Set NuGet Username'
            },
            {
                enabled: true,
                command: 'nuget.exe config -set no_proxy=' + nugetNoProxyExemption,
                title: 'Set NuGet no proxy urls'
            },
            {
                enabled: true,
                command: 'setx HTTPS_PROXY ' + 'http://' + username + ':' + passwordFull + '@' + proxyAddress,
                title: 'Override for system environmental HTTPS_PROXY variable'
            },
            {
                enabled: true,
                command: 'setx HTTP_PROXY ' + 'http://' + username + ':' + passwordFull + '@' + proxyAddress,
                title: 'Override for system environmental HTTP_PROXY variable'
            },
        ]
        commands.forEach(function (val) {
            if (val.enabled) {
                spawnProcess(val.command, val.title);
            }
        });
        // Pip is not properly added to path so just add
        // Config file anyways.
        if (programs.python) {
            writePipConfig("PIP HTTP Proxy");
        }
        process.exit();
    });
});