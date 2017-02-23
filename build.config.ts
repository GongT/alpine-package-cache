import {MicroBuildHelper} from "./.micro-build/x/microbuild-helper";
import {MicroBuildConfig, ELabelNames, EPlugins} from "./.micro-build/x/microbuild-config";
import {JsonEnv} from "./.jsonenv/_current_result";
declare const build: MicroBuildConfig;
declare const helper: MicroBuildHelper;
/*
 +==================================+
 | <**DON'T EDIT ABOVE THIS LINE**> |
 | THIS IS A PLAIN JAVASCRIPT FILE  |
 |   NOT A TYPESCRIPT OR ES6 FILE   |
 |    ES6 FEATURES NOT AVAILABLE    |
 +==================================+
 */

/* Example config file */

const projectName = 'alpine-package-cache';

build.baseImage('nginx', 'alpine');
build.projectName(projectName);
build.domainName(projectName + '.' + JsonEnv.baseDomainName);

build.isInChina(JsonEnv.gfw.isInChina);

build.forwardPort(80, 'tcp');
build.forwardPort(443, 'tcp');

build.shellCommand('/usr/sbin/nginx');
build.stopCommand('./scripts/stop');

build.dependService('hosts-generator', 'https://github.com/GongT/hosts-generator.git');
build.dockerRunArgument('--dns=8.8.8.8', '--dns=223.5.5.5');

build.volume('./cache', '/data/cache');

build.specialLabel(ELabelNames.alias, [
	'mirrors.aliyun.com',
	'dl-cdn.alpinelinux.org',
]);
build.disablePlugin(EPlugins.jenv);

build.prependDockerFileContent('COPY scripts /data/scripts');
build.prependDockerFileContent('COPY config /data/config');
build.noDataCopy(true);

build.onConfig((isBuild) => {
	const CacheDefineList = ['alpinelinux'];
	const path = require('path');
	
	const RUNTIME_ROOT_FOLDER = isBuild? '/data' : path.dirname(__dirname);
	build.startupCommand('-c', `${RUNTIME_ROOT_FOLDER}/config/nginx.conf`);
	
	const remove = ['127.0.0.1', '172.17.0.1'];
	const contents = require('fs').readFileSync('/etc/resolv.conf', 'utf8').split(/\n/g);
	
	contents.push('223.5.5.5');
	contents.push('8.8.8.8');
	
	const resolvers = contents
		.map((e) => {
			const m = /\d+\.\d+\.\d+\.\d+/.exec(e.trim());
			return m? m[0] : null;
		})
		.filter((line) => {
			return line && remove.every((ip) => {
					return line.indexOf(ip) === -1;
				});
		});
	
	const resolvConf = helper.createTextFile(`# generated file
resolver ${resolvers.join(' ')};`);
	resolvConf.save('./config/resolv.conf');
	
	const cacheDefinePath = path.resolve(__dirname, './config/cache_define.d');
	const fs = require('fs');
	if (fs.existsSync(cacheDefinePath)) {
		fs.readdirSync(cacheDefinePath).forEach((e) => {
			if (CacheDefineList.indexOf(e.replace(/\.conf$/, '')) === -1) {
				console.log('rm -f %s', path.resolve(cacheDefinePath, e));
				fs.unlinkSync(path.resolve(cacheDefinePath, e));
			}
		});
	} else {
		console.log('mkdir %s', cacheDefinePath);
		fs.mkdirSync(cacheDefinePath);
	}
	
	CacheDefineList.forEach((name) => {
		const resolvConf = helper.createTextFile(`# generated file
proxy_cache_path ${RUNTIME_ROOT_FOLDER}/cache/${name} levels=1:2 keys_zone=${name}:10m max_size=5g
					   inactive=1y use_temp_path=off ;
`);
		resolvConf.save(`./config/cache_define.d/${name}.conf`);
	})
});
