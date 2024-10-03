import Generator from 'yeoman-generator';
import chalk from 'chalk';
import fs, { existsSync, mkdirSync } from 'fs';
import fsextra from 'fs-extra';
import path from 'path';

const COMPILER_CHOICES = [
  {
    name: `clang`,
    c: `clang`,
    cpp: `clang++`,
  },
  {
    name: `gcc`,
    c: `gcc`,
    cpp: `g++`,
  }
];
const CPP_STANDARDS = [
  `20`, `11`, `03`, `14`, `17`, `23`,
];
const C_STANDARDS = [
  `23`, `99`, `11`, `17`,
];

const DEFAULT_COMPILE_OPTIONS = [];

interface Package {
  name: string;
  version?: string;
  required?: boolean;
  config?: boolean;
  link: Array<string>;
  vcpkg?: string | null;
};
type PackageList = Array<Package>;

const DEFAULT_CMAKE_VERSION = `3.29.3`;
const DEFAULT_PACKAGES: PackageList = [
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
const DEFAULT_TEST_PACKAGES: PackageList = [
  {
    name: `GTest`,
    required: true,
    link: [
      "GTest::gtest",
      "GTest::gmock"
    ]
  },
];
const DEFAULT_BM_PACKAGES: PackageList = [
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

function supportsAutoReturns(standard) {
  return standard === `14`
      || standard === `17`
      || standard === `20`
      || standard === `23`;
}

export default class extends Generator {
  private project_name_lower!: string;
  private source_prefix!: string;
  private header_prefix!: string;
  private namespace!: string;
  private root_ctx!: object;
  private cmake_ctx!: object;
  private cpp_ctx!: object;
  private props!: object;

  constructor(args, opts) {
    super(args, opts);
    this.argument("project_name", {
      type: String,
      required: true,
      description: "The name of the cmake project",
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
      default: true,
    });
    this.option("clang-format", {
      description: "Generate w/ clang-format enabled",
      type: Boolean,
      default: true
    });
    this.option(`pre-commit`, {
      description: `Generate w/ git pre-commit enable.`,
      type: Boolean,
      default: true,
    });
    this.option("clang-tidy", {
      description: "Generate w/ clang-tidy enabled.",
      type: Boolean,
      default: true,
    });
    this.option("clangd", {
      description: "Generate w/ clangd support.",
      type: Boolean,
      default: true,
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
    });
    this.option("coverage", {
      description: "Generate w/ lcov support.",
      type: Boolean,
      default: true,
    });
    this.option(`semantic-release`, {
      description: `Generate w/ semantic-release support.`,
      type: Boolean,
      default: true,
    });
    const project_name = this.options["project_name"].replace(' ', '_');
    this.project_name_lower = project_name.toLowerCase();
    this.source_prefix = project_name.toLowerCase();
    this.header_prefix = project_name.toUpperCase();
    this.namespace = project_name.toLowerCase();
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
        name: `header_prefix`,
        message: `Header Prefix`,
        default: this.header_prefix,
      },
      {
        type: `input`,
        name: `source_prefix`,
        message: `Source Prefix`,
        default: this.source_prefix,
      },
      {
        type: `input`,
        name: `namespace`,
        message: `Namespace`,
        default: this.namespace,
      },
      {
        type: `list`,
        name: `compiler`,
        message: `Compiler?`,
        choices: COMPILER_CHOICES.map((compiler) => compiler.name),
        store: true,
      },
      {
        type: `list`,
        name: `c_standard`,
        message: `c Standard?`,
        choices: C_STANDARDS,
        store: true,
      },
      {
        type: `list`,
        name: `cpp_standard`,
        message: `c++ Standard?`,
        choices: CPP_STANDARDS,
        store: true,
      }
    ]);
    const project_name = this.options[`project_name`];
    this.root_ctx = {
      project_name,
      cmake_version: this.props[`cmake_version`],
    };
    const source_prefix = this.props[`source_prefix`];
    const cpp_standard = this.props[`cpp_standard`];
    const c_standard = this.props[`c_standard`];
    this.cpp_ctx = {
      ...this.root_ctx,
      header_prefix: this.props[`header_prefix`],
      namespace: this.props[`namespace`],
      source_prefix,
      main_header_filename: `${this.project_name_lower}.h`,
      main_header_path: `${source_prefix}/${this.project_name_lower}.h`,
      standard: cpp_standard,
    };
    const main_header_filename = `${this.project_name_lower}.h`;
    const library_name = `${this.project_name_lower}-core`;
    const compile_options = this._getCompileOptions();
    const compiler = COMPILER_CHOICES
      .find((compiler) => {
        if(compiler.name === this.props[`compiler`])
          return true;
        return false;
      });
    this.cmake_ctx = {
      ...this.root_ctx,
      header_prefix: this.props[`header_prefix`],
      cmake_prefix: this.props[`header_prefix`], // TODO: convert this to its own property
      source_prefix,
      main_header_filename,
      main_header_path: `${source_prefix}/${main_header_filename}`,
      vcpkg: this.options[`vcpkg`],
      rtti: this.options[`rtti`],
      tests: this.options[`tests`],
      benchmarks: this.options[`benchmarks`],
      cppcheck: this.options[`cppcheck`],
      doxygen: this.options[`doxygen`],
      clang_format: this.options[`clang-format`],
      vscode: this.options[`vscode`],
      clang_tidy: this.options['clang-tidy'],
      coverage: this.options["coverage"],
      clangd: this.options[`clangd`],
      library_name,
      compile_options,
      compiler,
      c_standard,
      cpp_standard,
    };
  }

  _getCompileOptions() {
    const opts: string[] = [
      ...DEFAULT_COMPILE_OPTIONS,
    ];
    if(this.options["rtti"])
      opts.push('-frtti');
    return opts;
  }

  _genCMakeLists() {
    this.log(`Generating ${chalk.cyan(`CMakeLists.txt`)}....`)
    this.fs.copyTpl(
      this.templatePath("_CMakeLists.txt"),
      this.destinationPath("CMakeLists.txt"),
      {
        ...this.cmake_ctx,
        packages: DEFAULT_PACKAGES,
        executable: this.options[`executable`],
      }
    );
    if(this.options[`executable`]) {
      this.fs.copyTpl(
        this.templatePath(`_main.cc`),
        this.destinationPath(`main.cc`),
        this.cpp_ctx,
      );
    }
  }

  _genModule(tpl, packages, extra: { module_name?: string, executable?: boolean } = {}) {
    this.log(`Generating ${chalk.cyan(tpl)} module....`);
    const module_dir = path.join(process.cwd(), tpl);
    if(!existsSync(module_dir))
      mkdirSync(module_dir);
    const project_name = this.options[`project_name`];
    const module_name = `${project_name}-${tpl}`.toLowerCase();
    this.fs.copyTpl(
      this.templatePath(`${tpl}/_CMakeLists.txt`),
      this.destinationPath(`${tpl}/CMakeLists.txt`),
      {
        ...this.cmake_ctx,
        module_name: extra.module_name || module_name,
        packages: packages,
        executable: extra.executable || false,
      }
    );
    const main_tpl = this.templatePath(path.join(tpl, `_main.cc`));
    if(fs.existsSync(main_tpl)) {
      this.log(`Generating ${chalk.cyan(`main.cc`)} for ${chalk.cyan(module_name)} module....`);
      this.fs.copyTpl(
        this.templatePath(main_tpl),
        this.destinationPath(`${tpl}/main.cc`),
        this.cpp_ctx,
      );
    }
    const srcDir = this.destinationPath(path.join(tpl, this.project_name_lower));
    if(!fs.existsSync(srcDir)) {
      this.log(`Creating ${chalk.gray(`source`)} directory for ${chalk.cyan(module_name)} module....`);
      fs.mkdirSync(srcDir);
    }
  }

  _copyCMakeScript(name) {
    const script = `cmake/${name}.cmake`;
    this.log(`Copying ${chalk.gray(script)}....`);
    this.fs.copy(
      this.templatePath(script),
      this.destinationPath(script),
    );
  }

  _genCMakeScripts() {
    this.log(`Generating ${chalk.cyan(`CMake`)} scripts....`);
    const scriptsDir = path.join(process.cwd(), `cmake`);
    if(!existsSync(scriptsDir)){
      this.log(`Creating ${chalk.cyan(`cmake/`)} scripts directory....`);
      mkdirSync(scriptsDir);
    }
    this._copyCMakeScript(`BuildInfo`);
  }

  _genDoxygenConfig() {
    this.log(`Generating ${chalk.cyan(`Doxygen`)} config....`);
    this._copyCMakeScript(`Doxygen`);
    const doxyfile = `Doxyfile.in`;
    this.log(`Copuing ${chalk.gray(doxyfile)}....`);
    this.fs.copy(
      this.templatePath(doxyfile),
      this.destinationPath(doxyfile)
    );
  }

  _genCppCheckConfig() {
    this.log(`Generating ${chalk.cyan("CppCheck")} config....`)
    this._copyCMakeScript(`CppCheckConfig`);
    const suppressions = `.suppress.cppcheck`;
    this.log(`Copying ${chalk.gray(suppressions)}....`);
    this.fs.copy(
      this.templatePath(suppressions),
      this.destinationPath(suppressions)
    );
  }

  _genCMakePresets() {
    this.log(`Generating ${chalk.cyan(`CMakePresets.json`)}....`)
    this.fs.copyTpl(
      this.templatePath(`_CMakePresets.json`),
      this.destinationPath(`CMakePresets.json`),
      this.cmake_ctx,
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

  _genTestSources() {
    const test_name = `${this.options["project_name"]}Test`;
    this.log(`Generating ${chalk.cyan(test_name)}....`);
    const test_header_path = `${this.source_prefix}/test_${this.project_name_lower}.h`;
    this.fs.copyTpl(
      this.templatePath(`Tests/_test.h`),
      this.destinationPath(`Tests/${test_header_path}`),
      {
        ...this.cpp_ctx,
        test_name,
        test_header_path,
      }
    );
    this.fs.copyTpl(
      this.templatePath(`Tests/_test.cc`),
      this.destinationPath(`Tests/${this.source_prefix}/test_${this.project_name_lower}.cc`),
      {
        ...this.cpp_ctx,
        test_name,
        test_header_path,
      }
    );
  }

  _genInitialCode() {
    const createDestFilename = (extension) => {
      return `Sources/${this.props[`source_prefix`]}/${this.project_name_lower}.${extension}`;
    };
    this.log(`Generating initial code....`);
    {
      this.fs.copyTpl(
        this.templatePath(`_project.h.in`),
        this.destinationPath(createDestFilename(`h.in`)),
        this.cpp_ctx,
      );
    }
    {
      this.fs.copyTpl(
        this.templatePath(`_project.cc`),
        this.destinationPath(createDestFilename(`cc`)),
        this.cpp_ctx,
      );
    }
    if(this.options[`executable`]) {
      this.log(`Generating ${chalk.cyan(`main.cc`)}....`);
      // main.cc
      this.fs.copyTpl(
        this.templatePath(`_main.cc`),
        this.destinationPath(`main.cc`),
        this.cpp_ctx,
      );
    }
    if(this.options[`tests`])
      this._genTestSources();
  }

  _genClangFormatConfig() {
    this.log(`Generating ${chalk.cyan(`ClangFormat`)} config....`);
    this.fs.copy(
      this.templatePath(`.clang-format`),
      this.destinationPath(`.clang-format`)
    );
  }

  _genClangTidyConfig() {
    this._copyCMakeScript(`ClangTidy`);
    this.log(`Generating ${chalk.cyan(`clang-tidy`)} config....`);
    this.fs.copyTpl(
      this.templatePath(`_clang-tidy`),
      this.destinationPath(`.clang-tidy`),
    );
  }

  _getVcpkgPackages(): PackageList {
    return ([] as PackageList)
      .concat(DEFAULT_PACKAGES, DEFAULT_TEST_PACKAGES, DEFAULT_BM_PACKAGES)
      .filter((pkg: Package) => pkg.vcpkg !== null);
  }

  _genREADME() {
    this.log(`Generating ${chalk.cyan(`README.md`)}....`);
    const packages = this._getVcpkgPackages()
      .map((pkg: Package) => {
        return {
          name: pkg.vcpkg || pkg.name.toLowerCase(),
          version: pkg.version,
        };
      });
    this.fs.copyTpl(
      this.templatePath(`_README.md`),
      this.destinationPath(`README.md`),
      {
        ...this.root_ctx,
        packages,
        vcpkg: this.options["vcpkg"],
        executable: this.options[`executable`],
      }
    );
  }

  _genVcpkgConfig() {
    this.log(`Generating ${chalk.cyan(`vcpkg`)} config...`);
    const packages = this._getVcpkgPackages()
      .map((pkg) => pkg.vcpkg || pkg.name.toLowerCase());
    this.fs.copyTpl(
      this.templatePath(`_vcpkg.json`),
      this.destinationPath(`vcpkg.json`),
      {
        ...this.root_ctx,
        packages,
      }
    );
    this.fs.copyTpl(
      this.templatePath(`_vcpkg-configuration.json`),
      this.destinationPath(`vcpkg-configuration.json`),
    );
  }

  _genLcovConfig() {
    this.log(`Generating ${chalk.cyan(`lcov`)} config....`);
    this._copyCMakeScript(`Coverage`);
  }

  _genClangdConfig() {
    this.log(`Generating ${chalk.cyan(`clangd`)} config....`);
    this.fs.copy(
      this.templatePath(`.clangd`),
      this.destinationPath(`.clangd`),
    );
  }

  _genPreCommitConfig() {
    this.log(`Generating ${chalk.cyan(`pre-commit`)} config....`);
    this.fs.copy(
      this.templatePath(`_pre-commit-config.yaml`),
      this.destinationPath(`.pre-commit-config.yaml`),
    );
  }

  _genSemanticReleaseConfig() {
    this.log(`Generating ${chalk.cyan(`semantic-release`)} config....`);
    this.fs.copy(
      this.templatePath(`_releaserc`),
      this.destinationPath(`.releaserc`),
    );
  }

  writing() {
    this._genCMakeLists();
    this._genCMakePresets();
    this._genCMakeScripts();
    this._genBuildDirectory();
    if(this.options[`doxygen`])
      this._genDoxygenConfig();
    this._genModule(`Sources`, DEFAULT_PACKAGES, { module_name: this.project_name_lower });
    if(this.options[`tests`])
      this._genModule(`Tests`, DEFAULT_TEST_PACKAGES, { executable: true });
    if(this.options[`benchmarks`])
      this._genModule(`Benchmarks`, DEFAULT_BM_PACKAGES, { executable: true });
    if(this.options[`vcpkg`])
      this._genVcpkgConfig();
    if(this.options[`clang-format`])
      this._genClangFormatConfig();
    if(this.options["clang-tidy"])
      this._genClangTidyConfig();
    if(this.options["coverage"])
      this._genLcovConfig();
    if(this.options[`clangd`])
      this._genClangdConfig();
    if(this.options[`pre-commit`])
      this._genPreCommitConfig();
    if(this.options[`semantic-release`])
      this._genSemanticReleaseConfig();
    this._genInitialCode();
    this._genREADME();
  }

  install() {

  }

  end() {
    this.log(chalk.green('Finished'));
  }
};