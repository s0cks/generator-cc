import Generator from 'yeoman-generator';
import chalk from 'chalk';
import fs, { existsSync, mkdirSync } from 'fs';
import fsextra from 'fs-extra';
import path from 'path';

import COMPILERS, { Compiler } from './compiler.js';
import { Package, PackageList, DEFAULT_PACKAGES, TEST_PACKAGES, BENCHMARK_PACKAGES } from './packages.js';

const CPP_STANDARDS = [
  `20`, `11`, `03`, `14`, `17`, `23`,
];
const C_STANDARDS = [
  `23`, `99`, `11`, `17`,
];

const DEFAULT_COMPILE_OPTIONS = [];

const DEFAULT_CMAKE_VERSION = `3.29.3`;
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

interface Template {
  source: string;
  dest: string;
  ctx?: object;
}
type TemplateList = Array<Template>;

export interface GenModuleConfig {
  target_name?: string;
  executable?: boolean;
}

class CMakeModuleGenerator {
  constructor(name: string, template_path) {
  }
};

export default class extends Generator {
  private project_name_lower!: string;
  private source_prefix!: string;
  private header_prefix!: string;
  private namespace!: string;
  private root_ctx!: object;
  private cmake_ctx!: object;
  private cpp_ctx!: object;
  private props!: object;

  constructor(args: any, opts: any) {
    super(args, opts);
    this.argument("project_name", {
      type: String,
      required: true,
      description: "The name of the cmake project",
    });
    this.option("tests", {
      description: "Generate a test module using Google's GoogleTest framework.",
      type: Boolean,
      default: true,
    });
    this.option("benchmarks", {
      description: "Generate a benchmark module using Google's benchmark framework.",
      type: Boolean,
      default: true
    });
    this.option("doxygen", { //TODO: fix doxygen install
      description: "Generate w/ Doxygen enabled",
      type: Boolean,
      default: true,
    });
    this.option(`pre-commit`, {
      description: `Generate w/ git pre-commit enable.`,
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
      default: false,
    });
    this.option("clang", {
      description: "Generate w/ clang support.",
      type: Boolean,
      default: true,
    });
    this.option(`semantic-release`, {
      description: `Generate w/ semantic-release support.`,
      type: Boolean,
      default: true,
    });
    this.option(`glog`, {
      description: "Compile w/ glog",
      type: Boolean,
      default: true
    });
    this.option(`gflags`, {
      description: "Compile w/ gflags",
      type: Boolean,
      default: true
    });
    this.option(`readme`, {
      description: "Generate a README.md",
      type: Boolean,
      default: true,
    });
    this.option(`gitignore`, {
      description: `Generate a .gitignore`,
      type: Boolean,
      default: true,
    });
    const project_name = this.options["project_name"].replace(/[ \-]/, '_');
    this.project_name_lower = project_name.toLowerCase();
    this.source_prefix = project_name.toLowerCase();
    this.header_prefix = `${project_name.toUpperCase()}_`;
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
        choices: COMPILERS.map((compiler: Compiler) => compiler.name),
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

    const main_header_filename = `${this.project_name_lower}.h`;
    const main_header_path = `${source_prefix}/${this.project_name_lower}.h`;
    this.cpp_ctx = {
      ...this.root_ctx,
      header_prefix: this.props[`header_prefix`],
      namespace: this.props[`namespace`],
      source_prefix,
      main_header_filename,
      main_header_path,
      standard: cpp_standard,
    };
    const compile_options = this._getCompileOptions();
    const compiler = COMPILERS
      .find((compiler: Compiler) => {
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
      main_header_path,
      vcpkg: this.options[`vcpkg`],
      rtti: this.options[`rtti`],
      tests: this.options[`tests`],
      benchmarks: this.options[`benchmarks`],
      doxygen: this.options[`doxygen`],
      vscode: this.options[`vscode`],
      clang: this.options[`clang`],
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

  #genCMakeScripts() {
    this.log(`Generating ${chalk.cyan(`CMake`)} scripts....`);
    const scriptsDir = path.join(process.cwd(), `cmake`);
    if(!existsSync(scriptsDir)){
      this.log(`Creating ${chalk.gray(`cmake/`)} scripts directory....`);
      mkdirSync(scriptsDir);
    }
    const templates: TemplateList = [
      {
        source: `_CMakeLists.txt`,
        dest: `CMakeLists.txt`,
        ctx: {
          packages: this.#getDefaultPackages(),
          executable: this.options[`executable`],
        }
      },
      {
        source: `_CMakePresets.json`,
        dest: `CMakePresets.json`,
      },
      {
        source: this.#getCMakeScriptPath(`BuildInfo`),
        dest: this.#getCMakeScriptPath(`BuildInfo`),
      },
      {
        source: `_build.json`,
        dest: `build.json`
      }
    ];
    this.#genTemplateList(templates, {
      ...this.cmake_ctx
    });
  }

  #genCMakeModule(module_name: string, packages: PackageList, extra: GenModuleConfig = {}) {
    this.log(`Generating ${chalk.cyan(module_name)} module....`);
    {
      const module_dir = this.destinationPath(module_name);
      if(!existsSync(module_dir)) {
        this.log(`Creating ${module_dir} directory....`);
        mkdirSync(module_dir);
      }
    }
    {
      // project_name_lower/
      const src_dir = this.destinationPath(path.join(module_name, this.project_name_lower)); // TODO: this should probably be source_prefix/
      if(!fs.existsSync(src_dir)) {
        this.log(`Creating ${chalk.gray(`source`)} directory for ${chalk.cyan(module_name)} module....`);
        fs.mkdirSync(src_dir);
      }
    }
    {
      const lib_name = this.options[`executable`]
        ? `${this.project_name_lower}-core`
        : this.project_name_lower;
      // CMakeLists.txt
      this.fs.copyTpl(
        this.templatePath(`${module_name}/_CMakeLists.txt`),
        this.destinationPath(`${module_name}/CMakeLists.txt`),
        {
          ...this.cmake_ctx,
          module_name,
          target_name: extra.target_name || `${this.project_name_lower}-${module_name.toLowerCase()}`,
          packages,
          executable: extra.executable || false,
          lib_name,
        }
      );
    }
    {
      // main.cc
      const main_tpl = this.templatePath(path.join(module_name, `_main.cc`));
      this.log(`main_tpl: ${main_tpl}`);
      if(extra?.executable && fs.existsSync(main_tpl)) {
        this.log(`Generating ${chalk.cyan(`main.cc`)} for ${chalk.cyan(module_name)} module....`);
        this.fs.copyTpl(
          main_tpl,
          this.destinationPath(path.join(module_name, `main.cc`)),
          this.cpp_ctx,
        );
      }
    }
    this.log(`Generated ${chalk.cyan(module_name)} CMake module.`);
  }

  _copyCMakeScript(name: string) {
    const script = `cmake/${name}.cmake`;
    this.log(`Copying ${chalk.gray(script)}....`);
    this.fs.copy(
      this.templatePath(script),
      this.destinationPath(script),
    );
  }

  #getCMakeScriptPath(name: string): string {
    return `cmake/${name}.cmake`
  }

  #genTemplateList(templates: TemplateList, ctx?: object) {
    templates.forEach((tpl) => {
      this.log(`Copying ${chalk.gray(tpl.dest)}....`);
      this.fs.copyTpl(
        this.templatePath(tpl.source),
        this.destinationPath(tpl.dest),
        {
          ...ctx || {},
          ...tpl.ctx,
        },
      );
    });
  }

  #getDoxygenTemplates(): TemplateList {
    return [
      {
        source: this.#getCMakeScriptPath(`Doxygen`),
        dest: this.#getCMakeScriptPath(`Doxygen`),
        ctx: this.cmake_ctx,
      },
      {
        source: `_Doxyfile.in`,
        dest: `Doxyfile.in`,
      },
    ];
  }

  #genDoxygenConfig() {
    this.log(`Generating ${chalk.cyan(`Doxygen`)} config....`);
    {
      const dir = this.destinationPath(`docs`);
      if(!existsSync(dir)) {
        this.log(`Creating ${chalk.blue(`docs`)}/ directory....`);
        mkdirSync(dir);
      }
      touch(path.join(dir, `.gitkeep`));
    }
    const templates = this.#getDoxygenTemplates();
    this.#genTemplateList(templates);
  }

  #genBuildDirectory() {
    this.log(`Generating ${chalk.cyan(`build/`)} directory....`);
    // create build dir
    const dir = path.join(process.cwd(), `build`);
    if(!existsSync(dir))
      mkdirSync(dir);
    touch(path.join(dir, `.gitkeep`));
  }

  #getCppTemplates(): Array<Template> {
    const createDestFilename = (extension: string) => {
      return `Sources/${this.props[`source_prefix`]}/${this.project_name_lower}.${extension}`;
    };
    const templates: Array<Template> = [
      {
        source: `_project.h.in`,
        dest: createDestFilename(`h.in`),
      },
      {
        source: `_project.cc`,
        dest: createDestFilename(`cc`),
      }
    ];
    if(this.options[`tests`]) {
      const test_name = `${this.options["project_name"]}Test`;
      const test_header_path = `${this.source_prefix}/test_${this.project_name_lower}.h`;
      const ctx = {
        test_name,
        test_header_path,
        test_header_guard: `${this.header_prefix}TEST_H`
      };
      templates.push({
        source: `Tests/_test.h`,
        dest: `Tests/${test_header_path}`,
        ctx,
      });
      templates.push({
        source: `Tests/_test.cc`,
        dest: `Tests/${this.source_prefix}/test_${this.project_name_lower}.cc`,
        ctx,
      });
    }
    return templates;
  }

  #genInitialCode() {
    this.log(`Generating initial code....`);
    this.#genTemplateList(this.#getCppTemplates(), this.cpp_ctx);
  }

  #getClangTemplates(): TemplateList {
    return [
      {
        source: `_clang-format`,
        dest: `.clang-format`,
      },
      {
        source: `_clang-tidy`,
        dest: `.clang-tidy`,
      },
      {
        source: `_clangd`,
        dest: `.clangd`,
      },
      {
        source: this.#getCMakeScriptPath(`Coverage`),
        dest: this.#getCMakeScriptPath(`Coverage`),
        ctx: {
          ...this.cmake_ctx,
        }
      },
      {
        source: this.#getCMakeScriptPath(`ClangTidy`),
        dest: this.#getCMakeScriptPath(`ClangTidy`),
        ctx: {
          ...this.cmake_ctx,
        }
      }
    ];
  }

  #getDefaultPackages(): PackageList {
    const packages: PackageList = [
      ...DEFAULT_PACKAGES,
    ];
    if(this.options[`glog`]) {
      packages.push({
        name: `glog`,
        vcpkg: `glog`,
        required: true,
        link: [
          "glog::glog"
        ]
      });
    }
    if(this.options[`gflags`]) {
      packages.push({
        name: `gflags`,
        vcpkg: `gflags`,
        required: true,
        link: [
          "gflags::gflags"
        ]
      });
    }
    return packages;
  }

  #getAllPackages(): PackageList {
    return [
      ...this.#getDefaultPackages(),
      ...TEST_PACKAGES,
      ...BENCHMARK_PACKAGES,
    ];
  }

  #getVcpkgPackages(): PackageList {
    return this.#getAllPackages()
      .filter((pkg: Package) => pkg.vcpkg !== null);
  }

  #genREADME() {
    this.log(`Generating ${chalk.cyan(`README.md`)}....`);
    const readme_ctx = {
      ...this.root_ctx,
      packages: this.#getVcpkgPackages()
        .map((pkg: Package) => {
          return {
            name: pkg.vcpkg || pkg.name.toLowerCase(),
            version: pkg.version,
          };
        }),
      vcpkg: this.options[`vcpkg`],
      executable: this.options[`executable`],
    };
    const templates: TemplateList = [
      {
        source: `_README.md`,
        dest: `README.md`,
      }
    ];
    this.#genTemplateList(templates, readme_ctx);
  }

  #genGitIgnore() {
    const templates: TemplateList = [
      {
        source: `_gitignore`,
        dest: `.gitignore`,
      },
    ];
    this.#genTemplateList(templates, {
      ...this.root_ctx
    });
  }

  #genVcpkgConfig() {
    this.log(`Generating ${chalk.cyan(`vcpkg`)} config...`);
    const vcpkg_ctx = {
      ...this.root_ctx,
      packages: this.#getVcpkgPackages(),
    };
    const templates: TemplateList = [
      {
        source: `_vcpkg.json`,
        dest: `vcpkg.json`,
      },
      {
        source: `_vcpkg-configuration.json`,
        dest: `vcpkg-configuration.json`,
      }
    ];
    this.#genTemplateList(templates, vcpkg_ctx);
  }

  #genClangConfig() {
    this.#genTemplateList(this.#getClangTemplates(), {
    });
  }

  #genPreCommitConfig() {
    this.log(`Generating ${chalk.cyan(`pre-commit`)} config....`);
    this.#genTemplateList([
      {
        source: `_pre-commit-config.yaml`,
        dest: `.pre-commit-config.yaml`,
      }
    ]);
  }

  #genSemanticReleaseConfig() {
    this.log(`Generating ${chalk.cyan(`semantic-release`)} config....`);
    this.#genTemplateList([
      {
        source: `_releaserc`,
        dest: `.releaserc`,
      }
    ]);
  }

  writing() {
    this.#genCMakeScripts();
    this.#genBuildDirectory();
    if(this.options[`doxygen`])
      this.#genDoxygenConfig();
    this.#genCMakeModule(`Sources`, [] as PackageList, { target_name: this.project_name_lower });
    if(this.options[`tests`])
      this.#genCMakeModule(`Tests`, TEST_PACKAGES, { executable: true });
    if(this.options[`benchmarks`])
      this.#genCMakeModule(`Benchmarks`, BENCHMARK_PACKAGES, { executable: true });
    if(this.options[`vcpkg`])
      this.#genVcpkgConfig();
    if(this.options[`clang`])
      this.#genClangConfig();
    if(this.options[`pre-commit`])
      this.#genPreCommitConfig();
    if(this.options[`semantic-release`])
      this.#genSemanticReleaseConfig();
    this.#genInitialCode();
    if(this.options[`readme`])
      this.#genREADME();
    if(this.options[`gitignore`])
      this.#genGitIgnore();
  }

  install() {

  }

  end() {
    this.log(chalk.green('Finished'));
  }
};