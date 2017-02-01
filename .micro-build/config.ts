import {MicroBuildHelper} from "./x/microbuild-helper";
import {MicroBuildConfig, ELabelNames, EPlugins} from "./x/microbuild-config";
import {JsonEnv} from "../.jsonenv/_current_result";
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
// build.npmCacheLayer(JsonEnv.gfw.npmRegistry);
// build.npmInstall('./package.json');

// build.forwardPort(80, 'tcp').publish(8080);

build.startupCommand('./scripts/start');
build.shellCommand('/bin/sh');
build.stopCommand('./scripts/stop');

// build.dependService('nginx', 'http://github.com/GongT/nginx-docker.git');
build.dockerRunArgument('--dns=8.8.8.8', '--dns=223.5.5.5');

build.volume('./cache', '/data/cache');

build.specialLabel(ELabelNames.alias, ['mirrors.aliyun.com', 'dl-cdn.alpinelinux.org']);
build.disablePlugin(EPlugins.jenv);

build.prependDockerFileContent('COPY scripts /data/scripts');
build.prependDockerFileContent('COPY config /data/config');
build.noDataCopy(true);
