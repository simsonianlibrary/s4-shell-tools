import {BuildFile} from '../buildFile';
import path from "path";

describe('BuildFile', () => {
    it('should create a new instance with valid config path', () => {
        const configPath = 'build.yml';
        const buildFile = new BuildFile(configPath);
        expect(buildFile.getProject()).toBe(path.dirname(configPath));
        expect(buildFile.getOutputDirectory()).toBe(path.resolve(path.dirname(configPath), 'build'));
    });

    it('should throw an error when config path is invalid', () => {
        const configPath = 'non/existent/file.yml';
        expect(() => new BuildFile(configPath)).toThrow();
    });

    it('should return the correct project path', () => {
        const buildFile = new BuildFile(`${__dirname}/build.yml`);
        expect(buildFile.getProject()).toBe(`${__dirname}`);
    });

    it('should return the correct output directory', () => {
        const buildFile = new BuildFile(`${__dirname}/build.yml`);
        expect(buildFile.getOutputDirectory()).toBe(`${__dirname}/build`);
    });

    it('should resolve project path correctly', () => {
        const buildFile = new BuildFile(`${__dirname}/build.yml`);
        expect(buildFile.resolveProjectPath('build')).toBe(`${__dirname}/build`);
    });

    it('should resolve output path correctly', () => {
        const buildFile = new BuildFile(`${__dirname}/build.yml`);
        expect(buildFile.resolveOutputPath('output.txt')).toBe(path.resolve(`${__dirname}/build/output.txt`));
    });

    it('should return empty arrays for default properties', () => {
        const buildFile = new BuildFile(`${__dirname}/build.yml`);
        expect(buildFile.getExcludePatterns()).toEqual(['_attic']);
        expect(buildFile.getPackages()).toEqual([{name: "mod_tuning.package", files: ["src/tuning/**/*"]}]);
        expect(buildFile.getStringPackages()).toEqual([{name: "mod_strings.package", files: ["strings/**/*"]}]);
        expect(buildFile.getMerges()[0].files.length).toEqual(4);
    });

    it('should return arrays for non-default properties', () => {
        const configPath = `${__dirname}/build.yml`;
        const buildFile = new BuildFile(configPath);
        expect(buildFile.getExcludePatterns()).not.toEqual([]);
        expect(buildFile.getPackages()).not.toEqual([]);
        expect(buildFile.getStringPackages()).not.toEqual([]);
        expect(buildFile.getMerges()).not.toEqual([]);
    });
});
