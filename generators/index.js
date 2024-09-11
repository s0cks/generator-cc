'use string';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { existsSync, mkdirSync } from 'fs';
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
    this.argument("project_name", {
      type: String,
      required: true,
      desc: "The name of the cmake project",
    });
    this.option("tests", {
      description: "Generate a test module",
      type: Boolean,
      default: true,
    });
    this.option("benchmarks", {
      description: "Generate a benchmark module",
      type: Boolean,
      default: true
    });
    this.option("cppcheck", { //TODO: fix cppcheck install
      description: "Generate w/ CppCheck enabled",
      type: Boolean,
      default: false,
    });
    this.option("doxygen", { //TODO: fix doxygen install
      description: "Generate w/ Doxygen enabled",
      type: Boolean,
      default: false,
    });
    this.option("clang-format", {
      description: "Generate w/ clang-format enabled",
      type: Boolean,
      default: true
    });
    this.option("rtti", {
      description: "Generate w/ rtti enabled",
      type: Boolean,
      default: true,
    });
    this.option("vcpkg", {
      description: "Generate vcpkg configurations.",
      type: Boolean,
      default: true
    });
    this.option("vscode", {
      description: "Generate .vscode configurations.",
      type: Boolean,
      default: true
    });
    this.option("executable", {
      description: "Generate executable source",
      type: Boolean,
      default: true
    })
  }

  async prompting() {
    this.log(`Generate ${chalk.cyan('cc')} project....`);
    this.props = await this.prompt([
      {
        type: `input`,
        name: `cmake_version`,
        message: `CMake Version`,
        default: DEFAULT_CMAKE_VERSION,
        store: true
      },
      {
        type: `input`,
        name: `prefix`,
        message: `Header Prefix`,
        default: this._getHeaderPrefix(),
      },
      {
        type: `input`,
        name: `namespace`,
        message: `Namespace`,
        default: this._getNamespace(),
      }
    ]);
  }

  _getProjectName() {
    return this.options[`project_name`];
  }

  _getHeaderPrefix() {
    if(this.props && this.props.prefix && this.props.prefix.length > 0)
        return this.props.prefix;
    const prefix = this._getProjectName().toUpperCase().replace(` `, `_`);
    return prefix;
  }

  _getCompileOptions() {
    const options = [
      ...DEFAULT_COMPILE_OPTIONS,
    ];
    if(this.options["rtti"])
      options.push(`-frtti`);
    return options;
  }

  _genCMakeLists() {
    this.log(`Generating ${chalk.cyan(`CMakeLists.txt`)}....`)
    this.fs.copyTpl(
      this.templatePath("_CMakeLists.txt"),
      this.destinationPath("CMakeLists.txt"),
      {
        project_name: this._getProjectName(),
        prefix: this._getHeaderPrefix(),
        cmake_version: this.props.cmake_version,
        packages: DEFAULT_PACKAGES,
        compile_options: this._getCompileOptions(),
        executable: this.options[`executable`],
        lib_name: this._getLibraryName(),
        cppcheck: this.options["cppcheck"],
        doxygen: this.options["doxygen"],
        vcpkg: this.options["vcpkg"],
      }
    );
    if(this.options[`executable`]) {
      this.fs.copyTpl(
        this.templatePath(`_main.cc`),
        this.destinationPath(`main.cc`),
        {
          project_name: this._getProjectName(),
          prefix: this.props[`prefix`],
          namespace: this.props[`namespace`],
        }
      );
    }
  }

  _getModuleName(name) {
    return `${this._getProjectName()}-${name}`.toLowerCase();
  }

  _getNamespace() {
    return this.props && this.props[`namespace`]
        ? this.props[`namespace`]
        : this._getHeaderPrefix().toLowerCase();
  }

  _getLibraryName() {
    let name = this._getProjectName();
    if(this.options[`executable`])
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
        prefix: this.props.prefix,
        cmake_version: this.props.cmake_version,
        packages: packages,
        executable: extra.executable || false,
      }
    );
    if(extra.executable) {
      this.fs.copyTpl(
        this.templatePath(`${tpl}/_main.cc`),
        this.destinationPath(`${tpl}/main.cc`),
        {
          project_name: project_name,
          prefix: this.props[`prefix`],
          namespace: this.props[`namespace`],
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
    this.log(`Generating ${chalk.cyan(`cmake/`)} scripts....`);
    const scriptsDir = path.join(process.cwd(), `cmake`);
    if(!existsSync(scriptsDir))
      mkdirSync(scriptsDir);
    this._copyCMakeScript(`GitConfig`);
    if(this.options["doxygen"])
      this._copyCMakeScript(`DoxygenConfig`);
  }

  _genDoxygenConfig() {
    this.log(`Generating ${chalk.cyan(`Doxygen`)} config....`);
    this._copyCMakeScript(`DoxygenConfig`);
    this.fs.copy(
      this.templatePath(`Doxyfile.in`),
      this.destinationPath(`Doxyfile.in`)
    );
  }

  _genCppCheckConfig() {
    this.log(`Generating ${chalk.cyan("CppCheck")} config....`)
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
    this.log(`Generating ${chalk.cyan(`CMakePresets.json`)}....`)
    const project_name = this._getProjectName();
    // project.h
    this.fs.copyTpl(
      this.templatePath(`_CMakePresets.json`),
      this.destinationPath(`CMakePresets.json`),
      {
        project_name: project_name,
        vcpkg: this.options["vcpkg"],
      }
    );
  }

  _genBuildDirectory() {
    this.log(`Generating ${chalk.cyan(`build/`)} directory....`);
    // create build dir
    const dir = path.join(process.cwd(), `build`);
    if(!existsSync(dir))
      mkdirSync(dir);
    touch(path.join(dir, `.gitkeep`));
  }

  _genInitialCode() {
    this.log(`Generating initial code....`);
    const project_name = this._getProjectName();
    // project.h
    this.fs.copyTpl(
      this.templatePath(`project.h.in`),
      this.destinationPath(`Sources/${project_name}/${project_name}.h.in`),
      {
        project_name: project_name,
        prefix: this.props[`prefix`],
        namespace: this.props[`namespace`]
      }
    );
    // project.cc
    this.fs.copyTpl(
      this.templatePath(`project.cc`),
      this.destinationPath(`Sources/${project_name}/${project_name}.cc`),
      {
        project_name: project_name,
        prefix: this.props[`prefix`],
        namespace: this.props[`namespace`],
      }
    );
    if(this.options[`executable`]) {
      // main.cc
      this.fs.copyTpl(
        this.templatePath(`_main.cc`),
        this.destinationPath(`main.cc`),
        {
          project_name: project_name,
          prefix: this.props[`prefix`],
          namespace: this.props[`namespace`]
        }
      );
    }
  }

  _genClangFormatConfig() {
    this.log(`Generating ${chalk.cyan(`ClangFormat`)} config....`);
    this.fs.copy(
      this.templatePath(`.clang-format`),
      this.destinationPath(`.clang-format`)
    );
  }

  _genREADME() {
    this.log(`Generating ${chalk.cyan(`README.md`)}....`);
    this.fs.copyTpl(
      this.templatePath(`_README.md`),
      this.destinationPath(`README.md`),
      {
        project_name: this._getProjectName(),
        packages: this._getVcpkgPacakges(),
        vcpkg: this.options["vcpkg"],
        cmake_version: this.props.cmake_version,
        executable: this.options[`executable`],
      }
    );
  }

  _genVcpkgConfig() {
    this.log(`Generating ${chalk.cyan(`vcpkg`)} config...`);
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
    this._genBuildDirectory();
    if(this.options[`doxygen`])
      this._genDoxygenConfig();
    if(this.options[`cppcheck`])
      this._genCppCheckConfig();
    this._genModule(`Sources`, DEFAULT_PACKAGES, { module_name: this._getProjectName() });
    this._genInitialCode();
    if(this.options[`tests`])
      this._genModule(`Tests`, DEFAULT_TEST_PACKAGES, { executable: true });
    if(this.options[`benchmarks`])
      this._genModule(`Benchmarks`, DEFAULT_BM_PACKAGES, { executable: true });
    if(this.options[`vcpkg`])
      this._genVcpkgConfig();
    if(this.options[`clang-format`])
      this._genClangFormatConfig();
    this._genREADME();
  }

  install() {

  }

  end() {
    this.log(chalk.green('Finished'));
  }
};