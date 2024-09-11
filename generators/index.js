'use string';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import fs, { existsSync, mkdirSync } from 'fs';
import fsextra from 'fs-extra';
import path from 'path';

const DEFAULT_COMPILE_OPTIONS = [];

const DEFAULT_CMAKE_VERSION = `3.29.3`;
const DEFAULT_PACKAGES = [
  {
    name: `Threads`,
    required: true,
    link: [
      "Threads::Threads"
    ],
    vcpkg: null,
  },
  {
    name: `glog`,
    required: true,
    config: true,
    link: [
      "glog::glog"
    ]
  },
  {
    name: `gflags`,
    required: true,
    config: true,
    link: [
      "gflags::gflags"
    ]
  }
];
const DEFAULT_TEST_PACKAGES = [
  {
    name: `GTest`,
    required: true,
    link: [
      "GTest::gtest",
      "GTest::gmock"
    ]
  },
];
const DEFAULT_BM_PACKAGES = [
  {
    name: `benchmark`,
    required: true,
    link: [
      "benchmark::benchmark"
    ]
  },
];

async function touch(filename) {
  await fsextra.ensureFile(filename);
  const now = new Date();
  await fsextra.utimes(filename, now, now);
}

export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument("appname", {
      type: String,
      required: false
    });
  }

  async prompting() {
    this.log(`Generate ${chalk.blue('cc')} project....`);
    this.props = await this.prompt([
      {
        type: `input`,
        name: `project_name`,
        message: `Project Name?`,
        default: this.appname.toLowerCase(),
        store: true
      },
      {
        type: `confirm`,
        name: `vscode`,
        message: `Generate .vscode configuration?`,
        default: true,
        store: true
      },
      {
        type: `confirm`,
        name: `doxygen`,
        message: `Generate Doxygen Configuration`,
        default: true,
        store: true
      },
      {
        type: `confirm`,
        name: `cppcheck`,
        message: `Generate CppCheck Configuration`,
        default: true,
        store: true
      },
      {
        type: `confirm`,
        name: `genBenchmarks`,
        message: `Generate Benchmarks Module`,
        default: true,
        store: true
      },
      {
        type: `confirm`,
        name: `genTests`,
        message: `Generate Tests Module`,
        default: true,
        store: true
      },
      {
        type: `confirm`,
        name: `vcpkg`,
        message: `Generate vcpkg.json?`,
        default: true,
        store: true
      },
      {
        type: `confirm`,
        name: `git`,
        message: `Enable git integration`,
        default: true,
        store: true
      },
      {
        type: `confirm`,
        name: `rtti`,
        message: `Enable RTTI?`,
        default: true,
        store: true
      },
      {
        type: `confirm`,
        name: `executable`,
        message: `Build Executable?`,
        default: true,
        store: true
      },
      {
        type: `input`,
        name: `prefix`,
        message: `Header Prefix?`,
        default: undefined,
        store: true
      },
      {
        type: `input`,
        name: `cmake_version`,
        message: `CMake Version?:`,
        default: DEFAULT_CMAKE_VERSION,
        store: true
      },
      {
        type: `input`,
        name: `namespace`,
        message: `Namespace?:`,
        default: undefined,
        store: true
      }
    ]);
  }

  _getProjectName() {
    return this.props.project_name.toLowerCase();
  }

  _getHeaderPrefix() {
    if(this.props.prefix && this.props.prefix.length() > 0)
        return this.props.prefix;
    return this._getProjectName().toUpperCase().replace(` `, `_`);
  }

  _getCompileOptions() {
    const options = [
      ...DEFAULT_COMPILE_OPTIONS,
    ];
    if(this.props.rtti)
      options.push(`-frtti`);
    return options;
  }

  _genCMakeLists(extra = {}) {
    this.fs.copyTpl(
      this.templatePath("_CMakeLists.txt"),
      this.destinationPath("CMakeLists.txt"),
      {
        project_name: this._getProjectName(),
        prefix: this._getHeaderPrefix(),
        cmake_version: this.props.cmake_version,
        packages: DEFAULT_PACKAGES,
        compile_options: this._getCompileOptions(),
        executable: extra.executable,
        lib_name: this._getLibraryName(),
        cppcheck: this.props.cppcheck,
        doxygen: this.props.doxygen,
        vcpkg: this.props.vcpkg,
      }
    );
    if(extra.executable) {
      this.fs.copyTpl(
        this.templatePath(`_main.cc`),
        this.destinationPath(`main.cc`),
        {
          project_name: this._getProjectName(),
          prefix: this._getHeaderPrefix(),
          namespace: this._getNamespace(),
        }
      );
    }
  }

  _getModuleName(name) {
    return `${this._getProjectName()}-${name}`.toLowerCase();
  }

  _getNamespace() {
    return this.props.namespace
        || this._getHeaderPrefix().toLowerCase();
  }

  _getLibraryName() {
    let name = this._getProjectName();
    if(this.props.executable)
      name = `${name}-core`;
    return name;
  }

  _genModule(tpl, packages, extra = {}) {
    this.log(`Generating ${chalk.cyan(tpl)} module....`);
    const module_dir = path.join(process.cwd(), tpl);
    if(!existsSync(module_dir))
      mkdirSync(module_dir);
    const project_name = this._getProjectName();
    this.fs.copyTpl(
      this.templatePath(`${tpl}/_CMakeLists.txt`),
      this.destinationPath(`${tpl}/CMakeLists.txt`),
      {
        project_name: project_name,
        module_name: extra.module_name || this._getModuleName(tpl),
        lib_name: this._getLibraryName(),
        prefix: this._getHeaderPrefix(),
        cmake_version: this.props.cmake_version,
        packages: packages,
        executable: extra.executable,
      }
    );
    if(extra.executable) {
      this.fs.copyTpl(
        this.templatePath(`${tpl}/_main.cc`),
        this.destinationPath(`${tpl}/main.cc`),
        {
          project_name: project_name,
          prefix: this._getHeaderPrefix(),
          namespace: this._getNamespace(),
        }
      );
    }
    const srcDir = path.join(module_dir, project_name);
    if(!existsSync(srcDir))
      mkdirSync(srcDir);
  }

  _copyCMakeScript(name) {
    this.fs.copy(
      this.templatePath(`cmake/${name}.cmake`),
      this.destinationPath(`cmake/${name}.cmake`),
    );
  }

  _genCMakeScripts() {
    const scriptsDir = path.join(process.cwd(), `cmake`);
    if(!existsSync(scriptsDir))
      mkdirSync(scriptsDir);
    this._copyCMakeScript(`GitConfig`);
    if(this.props.doxygen)
      this._copyCMakeScript(`DoxygenConfig`);
  }

  _genDoxygenConfig() {
    this._copyCMakeScript(`DoxygenConfig`);
    this.fs.copy(
      this.templatePath(`Doxyfile.in`),
      this.destinationPath(`Doxyfile.in`)
    );
  }

  _genCppCheckConfig() {
    this._copyCMakeScript(`CppCheckConfig`);
    this.fs.copy(
      this.templatePath(`.suppress.cppcheck`),
      this.destinationPath(`.suppress.cppcheck`)
    );
  }

  _getVcpkgPacakges() {
    return []
      .concat(DEFAULT_PACKAGES, DEFAULT_TEST_PACKAGES, DEFAULT_BM_PACKAGES)
      .filter((pkg) => pkg.vcpkg !== null)
      .map((pkg) => pkg.vcpkg || pkg.name.toLowerCase());
  }

  _genCMakePresets() {
    const project_name = this._getProjectName();
    // project.h
    this.fs.copyTpl(
      this.templatePath(`_CMakePresets.json`),
      this.destinationPath(`CMakePresets.json`),
      {
        project_name: project_name,
        vcpkg: this.props.vcpkg
      }
    );
  }

  _genBuildDirectory() {
    // create build dir
    const dir = path.join(process.cwd(), `build`);
    if(!existsSync(dir))
      mkdirSync(dir);
    touch(path.join(dir, `.gitkeep`));
  }

  _genInitialCode() {
    const project_name = this._getProjectName();
    // project.h
    this.fs.copyTpl(
      this.templatePath(`project.h.in`),
      this.destinationPath(`Sources/${project_name}/${project_name}.h.in`),
      {
        project_name: project_name,
        prefix: this._getHeaderPrefix(),
        git: this.props.git,
        namespace: this._getNamespace(),
      }
    );
    // project.cc
    this.fs.copyTpl(
      this.templatePath(`project.cc`),
      this.destinationPath(`Sources/${project_name}/${project_name}.cc`),
      {
        project_name: project_name,
        prefix: this._getHeaderPrefix(),
        git: this.props.git,
        namespace: this._getNamespace(),
      }
    );
    if(this.executable) {
      // main.cc
      this.fs.copyTpl(
        this.templatePath(`_main.cc`),
        this.destinationPath(`main.cc`),
        {
          project_name: project_name,
          prefix: this._getHeaderPrefix(),
          namespace: this._getNamespace(),
        }
      );
    }
  }

  _genClangFormatConfig() {
    this.fs.copy(
      this.templatePath(`.clang-format`),
      this.destinationPath(`.clang-format`)
    );
  }

  _genREADME() {
    this.fs.copyTpl(
      this.templatePath(`_README.md`),
      this.destinationPath(`README.md`),
      {
        project_name: this._getProjectName(),
        packages: this._getVcpkgPacakges(),
        vcpkg: this.props.vcpkg,
        cmake_version: this.props.cmake_version,
        executable: this.props.executable,
      }
    );
  }

  _genVcpkgConfig() {
    this.fs.copyTpl(
      this.templatePath(`_vcpkg.json`),
      this.destinationPath(`vcpkg.json`),
      {
        packages: this._getVcpkgPacakges(),
      }
    );
  }

  writing() {
    this._genCMakeLists({ executable: true });
    this._genCMakePresets();
    this._genCMakeScripts();
    if(this.props.doxygen)
      this._genDoxygenConfig();
    if(this.props.cppcheck)
      this._genCppCheckConfig();
    this._genModule(`Sources`, DEFAULT_PACKAGES, { module_name: this._getProjectName() });
    this._genInitialCode();
    if(this.props.genTests)
      this._genModule(`Tests`, DEFAULT_TEST_PACKAGES, { executable: true });
    if(this.props.genBenchmarks)
      this._genModule(`Benchmarks`, DEFAULT_BM_PACKAGES, { executable: true });
    if(this.props.vcpkg)
      this._genVcpkgConfig();
    this._genClangFormatConfig();
    this._genREADME();
  }

  install() {

  }

  end() {
    this.log(chalk.green('Finished'));
  }
};