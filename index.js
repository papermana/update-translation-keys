#!/usr/bin/env node

const minimist = require('minimist');
const fs = require('fs');
const yaml = require('js-yaml');
const deepMerge = require('deepmerge');

const { _: filePaths, ...args } = minimist(process.argv.slice(2));
const parseObject = object => args.yaml
  ? yaml.safeLoad(object)
  : JSON.parse(object);
const stringifyObject = object => args.yaml
  ? yaml.safeDump(object)
  : JSON.stringify(object, null, 2);
const main = () => {
  if (args.help || args.h) {
    console.log(`
update-translation-keys

Accepts the path to the base translation file (e.g. 'en.json') and any number of other translation files that will get updated. E.g.:
  update-translation-keys translations/en.json translations/de.json translations/es.json

You can also pass a flag 'yaml=true' if the files are in this format:
  update-translation-keys --yaml=true translations/en.yml translations/fr.json
    `);
    return;
  }

  const [_, ...otherFilesPaths] = filePaths;
  const [baseFile, ...otherFiles] = filePaths
    .map(path => {
      const [_, locale] = /(\w+)\.\w+$/.exec(path);
      const file = fs.readFileSync(path, 'utf8');
      const parsedFile = parseObject(file);

      return {
        locale,
        data: parsedFile[locale],
      };
    });
  const updatedFiles = otherFiles
    .map(({ locale, data }) => ({
      [locale]: deepMerge(baseFile.data, data),
    }));

  otherFilesPaths
    .forEach((path, i) => {
      const fileToWrite = stringifyObject(updatedFiles[i]);

      fs.writeFileSync(path, fileToWrite, 'utf8');
    });
}

main();
