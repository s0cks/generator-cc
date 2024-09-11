# generator-cc

> Yeoman generator for creating a modern C++ project using cmake, vcpkg, glog, gflags & more. Allowing you to quickly set up a project following best practices

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Usage](#usage)
- [Build & Install](#build--install)
  - [Prerequisites](#prerequisites)
  - [Install Generator Locally (Optional)](#install-generator-locally-optional)
- [Generated Project](#generated-project)
- [License](#license)
- [Contributing](#contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

```sh
cd my/project/dir/
# run the generator using Yeoman:
yo @s0cks/cc
```

## Build & Install

### Prerequisites

- [node](https://nodejs.org/en) & [npm](https://www.npmjs.com/)
- [yeoman](https://yeoman.io/)

### Install Generator Locally (Optional)

```sh
# clone the repository
git clone https://github.com:s0cks/generator-cc
# install dependencies
npm i
# register the generator to Yeoman:
npm link
# check if it worked:
cd example/
yo @s0cks/generator-cc
```

## Generated Project

See [example/](/example/)

## License

See [LICENSE](/LICENSE)

## Contributing

See [CONTRIBUTING.md](/CONTRIBUTING.md).
