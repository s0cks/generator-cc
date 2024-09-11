# <%= project_name %>

<!-- START doctoc -->
<!-- END doctoc -->

## Building

### Prerequisites

You will need the following things to build:

- clang
- cmake>=<%= cmake_version %>
<%_ if(vcpkg) { -%>
- vcpkg
<%_ } -%>

You can build by doing the following:

```bash
# git clone
cd <%= project_name %>/
vcpkg install
mkdir build/ && cd build/
cmake --build --preset XXX .. # debug, release, etc. See CMakePresets.json
```

Check whether or not the build was successful:

```bash
./<%= project_name %> --version
```

<%_ if(executable) { -%>

## Running

```bash
<%= project_name %> --help
```

<%_ } -%>

## Packages

<%_ packages.forEach(function(pkg) { -%>

- <%= pkg %>
<%_ }) -%>
