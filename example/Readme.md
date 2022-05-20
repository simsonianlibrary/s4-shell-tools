# S4ShellTools Example Mod

This directory builds a ridiculous, yet functional, mod to demonstrate a few features of the S4ShellTools build process.

Here is the `build.yml` file:
```yaml
# All file paths in this file need to be relative to the directory that this file is in.
# Operations are performed from top to bottom. Package are built from tuning, then strings are built
# from properties files, and then finally the merge operations are done. This allows you to reference
# files in the merges section that are built in the two sections before it.
# Not all operations need to be specified in every build file. Only the output field is required.

# All build products are created in the output folder specified
output: build

# Exclude substrings cause files with paths that contain them to be excluded. This will skip anything
# with '_attic' in it's path.
exclude:
  - _attic

# The packages section defines zero or more packages that should be assembled from tuning XML files.
# The name attribute denotes the name of the output file in the output folder, and the files section
# is a list of path glob patterns relative to the build folder. Multiple packages can be built from 
# multiple lists of path globs pointing to tuning files. 
packages:
  - name: mod_tuning.package
    files:
      - src/tuning/**/*

# The strings section describes packages containing STBLs that are generated from plain text .properties files
# that are found using the list of path globs in the files section. Multiple strings packages can be built from
# multiple lists of .properties files.
strings:
  - name: mod_strings.package
    files:
      - src/strings/**/*

# The merges section describes zero or more package merge operations that should be done. The name indicates the name
# of the final merged package and the files list specifies which packages should be merged into the final one. Multiple merge 
# operations can be specified. The combineStrings option is kind of experimental and isn't working correctly at the moment. 
# It currently always combines all string entries by locale codes to create one unified STBL for each possible locale code.
# The final STBLS will have a randomized instance id with the appropriate language code set.
merges:
  - name: Astonisher_Mod.package
    combineStrings: false
    files:
      - build/mod_strings.package
      - build/mod_tuning.package
      - include/astonisher_statue.package
      - include/astonisher2_statue.package
```

This build project demonstrates a few things that aren't obvious. 

Part of the mod is built from tuning XML files, and then that package is merged with two packages with binary resources such as Object Definitions that I cloned using S4Studio, as well as the package built by the strings operations.

As for the strings, there is a complete English string `.properties` file and a partial French one (that's missing one string) in the `src/strings` folder. There are also name and description strings in each of the included statue object packages. 

When the final mod package is built, `Astonisher_Mod.package`, there will be one string table for each possible Sims 4 language. The French string table will have the French entries that were in the French string list, with the missing ones filled in with the English strings. All of the missing locale string tables for other languages will be filled with English strings as well. No more blank strings, and you can easily incorporate new translations as they come in. 

Note: I am adding some more attributes to the Strings package definitions to allow you to use a more persistent STBL ID between builds in an upcoming version. I would like to keep the 'merge STBLs by Language' feature, since I have a lot of mods that are built from individual object packages that initially have a couple of strings each in them (name and description). Having one string table per language at the end lets me export them to properties files so that translators can easily just edit one text file to translate the strings and send it back to me. I am open to input on how to handle these concerns in the build process. :)