# S4 Shell Tools

## Overview
This repository contains the Typescript code and build files to generate a command line tool to build and manipulate Sims 4 `.package` files. The command line tool is just a file organizer that relies on the [Sims 4 Tool Kit](https://sims4toolkit.com/#/) library to do the heavy lifting of managing the binary data in the `.package` files.

## Installation
I haven't set up publishing this to npmjs yet, so you will need to check out the repository, then run these commands to build the scripts:
```shell
npm run build
```
This will build the javascript files to the `dist/` folder.

To run the script, you can:
* Install it globally by running `npm install -g` from inside the repository folder, then call it with npx: 
  ```shell
  npx S4ShellTools <command and options>
  ```
* Run the built javascript from the repo: 
  ```shell
  $REPO_PATH/dist/S4ShellTools.js <command and options>
  ```
* Run the typescript directly with npx or ts-node: 
  ```shell
  ts-node $REPO_PATH/src/S4ShellTools.ts <command and options>
  ```


## Usage
```
Usage: S4ShellTools --help

Tools to build and manage a Sims 4 .package file

Options:
  -V, --version                                       output the version number
  --debug
  --trace
  -h, --help                                          display help for command

Commands:
  build [options]
  merge [options] [packagePaths...]
  dump-strings [options] <packageFile>
  import-property-files [options] [propertyFiles...]
  string-summary <sourcePath>
  find-duplicate-tuning <sourcePath>
  help [command]                                      display help for command

```

## build
```
Usage: S4ShellTools build [options]

Options:
  --config <configPath>
  -h, --help             display help for command
```
Builds a Sims 4 mod from sources specified in a `build.yml` configuration file. This command is the point of the entire tool, and gets its own page here [Build Config Documentation](example/Readme.md). If you don't specify the config path, it will default to looking in the current directory for the `build.yml` file.

## merge 
```
Usage: S4ShellTools merge [options] [packagePaths...]

Options:
  --output <output>
  --combineStrings
  -h, --help         display help for command
```
The `merge` command takes the path of the package to create followed by a list of packages to include inside it. There is no 'unmerge'. Building from source XML is intended to be a one way process, though you could still edit the built package with S4Studio, if you wish. You just can't unmerge it. 

If you don't specify the output directory, it will create a directory named 'build' in the current directory.

**Example**  
`S4ShellTools merge --output output/merged_package.package output/package_1.package output/package_2.package`

This will generate a file at `output/merged_package.package` that contains the contents of `output/package_1.package` and `output/package_2.package`.

## dump-strings 
```
Usage: S4ShellTools dump-strings [options] <packageFile>

Options:
  --output <output>
  -h, --help         display help for command
```
Extracts all the STBL resources from a package file as `.properties` files. If you don't specify the output directory, it will default to creating a folder named `build` in the current directory.

## import-property-files 
```
Usage: S4ShellTools import-property-files [options] [propertyFiles...]

Options:
  --output <output>
  -h, --help         display help for command
```
Creates a new package file from a list of `.properties` files. If you don't specify the output file, it will default to creating a file named `build/strings.package` in the current directory.

## string-summary 
```
Usage: S4ShellTools string-summary [options] <sourcePath>

Options:
  -h, --help  display help for command
```
Prints a table of the STBL resources in a package, along with the number of strings in each one. Handy for locating missing strings in translations or after upgrades and additions.

## find-duplicate-tuning
```
Usage: S4ShellTools find-duplicate-tuning [options] <sourcePath>

Options:
  -h, --help  display help for command
```
Recursively searches through a folder of packages and reports any duplicate tuning files found. 


## Author
**Simsonian Library**  
<simsonianlibrary@gmail.com>

### [Patreon](https://www.patreon.com/SimsonianLibrary)
<https://www.patreon.com/SimsonianLibrary>

