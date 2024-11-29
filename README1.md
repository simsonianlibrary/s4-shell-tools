# S4 Shell Tools

> **WARNING**: HIC SUNT DRACONES!<br/>This code is not very old, and isn't in a properly releasable state right now. I put it here for collaboration purposes. It will function as advertised and has been 'tried out' in the sense that it's built a mod or two that I've tested in-game. However, it lacks unit tests, and the documentation currently leaves much to be desired.<br/> 

## Overview
This repository contains the Typescript code and build files to generate a command line tool to build and manipulate Sims 4 `.package` files. The command line tool is just a file organizer that relies on the [Sims 4 Tool Kit](https://sims4toolkit.com/#/) library to do the heavy lifting of managing the binary data in the `.package` files.

See [Why is this](#Why-is-this) below for the rationale behind this code.

## Installation
I haven't set up publishing this to npmjs yet, so you will need to check out the repository, then run these commands to build the scripts:
```shell
npm run build
```
This will build the javascript files to the `out/` folder.

To run the script, you can:
* Install it globally by running `npm install -g` from inside the repository folder, then call it with npx: 
  ```shell
  npx S4ShellTools <command and options>
  ```
* Run the built javascript from the repo: 
  ```shell
  $REPO_PATH/out/S4ShellTools.js <command and options>
  ```
* Run the typescript directly with npx or ts-node: 
  ```shell
  ts-node $REPO_PATH/src/S4ShellTools.ts <command and options>
  ```
> **BE ADVISED:** while I've been coding in server side languages like Java for a quite a while, I am fairly new to Typescript. 
> If you have suggestions about how I might make this more idiomatic and standardized for the Typescript ecosystem, create an issue in this project with a suggestion, or a pull request.  

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

# Why is this
I build production software at my day job every day by typing code into a text file, clicking a few buttons or running a few simple commands, and I get a working thing out the other end (hopefully), such as a Java jar or a Golang executable. I don't need to worry about putting the right files in the right packages every time I build the thing. I just click the button, and my software thing comes out the other end of the workflow. The classic problem of 'It works for me (but not for you)' was mostly solved in professional software engineering a long time ago.

I want to work that same way when developing Sims 4 mods, since it would be more fun to focus on getting my mod to do things, rather than hunting through lots of different package files trying to figure out what I did to break something, looking for missing or replicated tuning XML files, and all the other dumb mistakes I've made while developing mods late into the night on weekends. So these tools are meant to provide a solid replicable mod-building workflow, just like in my real life with real software. Using these tools, two modders should be able to check out the same mod source code, build them automatically, and end up with identical .package files.

## Who might want to use this?
People who make tuning-heavy Sims 4 mods, to begin with. If you are making Sims 4 custom content mods like hair or clothing that doesn't contain tuning files or other specialized behavior, you would probably have no use for this tool. [S4Studio](https://sims4studio.com/) does everything you need.

If you make mods that include tuning XML, especially lots of tuning, and/or have different versions of your mod for different download configurations, etc, this tool might help solve a lot of problems for you. Once you reach the point of complexity that you need to start getting really systematic on how you build the mod's package files, that's when you probably need this tool or something like it.

## Why would you do want to do this? It seems complicated.
Modding is complicated. Searching through a bunch of package files for replicated or missing tuning xml is complicated _(and can bring on a feeling of despair...)_, as is dealing with string files and translations. The complexity of this tool is meant to make a lot of other things a lot more straightforward and most importantly, replicable. Exactly the same every time you build the mod.

It lets you apply many more software engineering principles to the process of building a mod more easily.
* Simple description of exactly what gets put into a mod, so that it builds from source files exactly the same way every single time.
* Output artifacts that you can treat as immutable. The `.package` files that you build probably never need to be reopened and edited. They can be easily built from scratch from a `build.yml` plan every time, exactly the same.
* The `.properties` files are the source code for the `STBL` language resources. Working with string resources as standard `.properties` files brings the benefits of all the existing software industry tooling for the format. It's also easy for someone to translate the file with nothing but a text editor, which immediately creates a much larger pool of potential translators. This file can be reincorporated into the build after translation. Searching, concatenation, batch changes -- there are a lot of ways to easily process text data.

## Future Changes/Additions Expected to this Tool
* I need to add some import/export raw resource commands, to be able to import exported STBL's from frankk's String Table Editor, and just for overall completeness.
* I'm still not sure about how I'm handling STBL instance IDs. I like having one unified list at the end, but need to consider the ongoing workflow over time I'm looking at some ways to come up with a permanent STBL ID (root ID + locale bits) for each string package. 
* I want to add some merge filters, so that you could exclude all STBLs or Tuning resources from a mod when merging. This would help when adopting this tool to build a currently existing mod, since the current versions of the packages would probably have a mixture of all of them mixed together. Ideally, the binary packages that get merged with the built-tuning packages would not contain any STBLs or tuning resources (since they might conflict with the ones tracked by this tool). Being able to exclude all the resource types that should be handled by this tool would speed that process along.
* I'm not currently inclined to add a lot of commands to generate hash keys from strings, etc. That seems like more of a concern for whatever person/program runs this tool. The hash keys for strings and tuning are needed in the source code, so it seems like they should be managed there, not in the build pipeline. The PyCharm plugin I'm building that will use this tool (see below) is where I expect to provide hash key generation tools.

# Future directions
The main goal of this tool, and its intended consumer, is a PyCharm IDE plugin that I'm developing to provide the capability to build .package files and compile python scripts in the same user interface, all at once by clicking a button. As such, the API (command line commands) is less likely to change than the code that implements it, since I'm calling the command line commands from another component (that is yet to be released). Current status: The plugin is working to run the builds from within PyCharm, but needs more features to be more useful. 

If you really want to use these tools in your own mod building pipelines at this point, you might want to fork the repository and work from that until the codebase is a bit more stable. I'm likely to change or add some things in both the strings and merges build operations

If you'd like to leap ahead and get a button to build a mod in PyCharm (or VS Code) right away, you can set this tool up as it exists today as an 'External Tool' in PyCharm or a Run Task in VS Code and give it its own Build button. :)

## Author
**Simsonian Library**  
<simsonianlibrary@gmail.com>
### [Patreon](https://www.patreon.com/SimsonianLibrary)
<https://www.patreon.com/SimsonianLibrary>

###[Mods for Sims 4](https://simsonianlibrary.wixsite.com/library/blog)
<https://simsonianlibrary.wixsite.com/library/blog>
